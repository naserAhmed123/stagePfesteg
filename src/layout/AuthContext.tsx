import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "direction" | "intervention" | "client";
  avatar?: string;
  travail?: "ENCOURS" | "QUITTER"; 
  etatCompte?: "NON_BLOQUER" | "BLOQUER"; 
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const redirecting = useRef(false); // Pour éviter les redirections multiples

  const mapRoleToFrontend = (backendRole: string | undefined): "direction" | "intervention" | "client" => {
    console.log("Backend role:", backendRole);
    if (!backendRole) {
      console.warn("Role missing in token, defaulting to client");
      return "client";
    }
    switch (backendRole.toUpperCase()) {
      case "DIRECTION":
        return "direction";
      case "TECHNICIEN":
      case "SERVICE_INTERVENTION":
        return "intervention";
      case "CITOYEN":
        return "client";
      default:
        console.warn(`Unknown role: ${backendRole}, defaulting to client`);
        return "client";
    }
  };

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      throw new Error("Invalid token");
    }
  };

  const logout = () => {
    console.log("Logging out");
    setUser(null);
    localStorage.removeItem("token");
    redirecting.current = false; // Reset le flag de redirection
  };

  // Fonction pour rediriger selon le rôle et le statut
  const handleBlockedUser = (userInfo: User, reason: string) => {
    if (redirecting.current) return; // Éviter les redirections multiples
    
    redirecting.current = true;
    console.log(`User blocked: ${reason}. Redirecting ${userInfo.role}`);
    
    // Sauvegarder les infos utilisateur
    localStorage.setItem("userEroner", JSON.stringify(userInfo));
    localStorage.setItem("lastRole", userInfo.role);
    
    // Déconnecter l'utilisateur
    setUser(null);
    localStorage.removeItem("token");
    
    // Rediriger selon le rôle
    const targetPath = userInfo.role === "client" ? "/blockedCit" : "/blocked";
    console.log(`Redirecting to: ${targetPath}`);
    
    // Utiliser setTimeout pour s'assurer que l'état est bien mis à jour
    setTimeout(() => {
      navigate(targetPath, { replace: true });
    }, 100);
  };

  const checkUserAuthorization = (userData: any, userInfo: User): boolean => {
    console.log(`Checking authorization - Role: ${userInfo.role}, Travail: ${userData.travail}, EtatCompte: ${userData.etatCompte}`);
    
    // Vérification pour les utilisateurs intervention
    if (userInfo.role === "intervention" && userData.travail !== "ENCOURS") {
      handleBlockedUser(userInfo, `Intervention user not ENCOURS (${userData.travail})`);
      return false;
    }
    
    // Vérification pour les utilisateurs client (citoyen)
    if (userInfo.role === "client" && userData.etatCompte !== "NON_BLOQUER") {
      handleBlockedUser(userInfo, `Client user blocked (${userData.etatCompte})`);
      return false;
    }
    
    return true;
  };

  // Fonction pour vérifier le statut utilisateur (utilisée dans useEffect et AuthGuard)
  const checkUserStatus = async (userInfo: User): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return false;
      }

      const response = await axios.get(`http://localhost:8080/api/utilisateur/${userInfo.email}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;
      return checkUserAuthorization(userData, userInfo);
    } catch (err: any) {
      console.error("Error checking user status:", err);
      if (err.response?.status === 401) {
        logout();
      }
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        redirecting.current = false;

        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, user not authenticated");
          setIsLoading(false);
          return;
        }

        const decoded = parseJwt(token);
        console.log("Decoded JWT:", decoded);
        const email = decoded.email || decoded.sub;
        if (!email) {
          throw new Error("No email found in JWT");
        }

        // Récupérer les données utilisateur depuis l'API
        const response = await axios.get(`http://localhost:8080/api/utilisateur/${email}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data;
        const userRole = mapRoleToFrontend(decoded.role);

        const userInfo: User = {
          id: decoded.sub || "unknown",
          email: decoded.email || email,
          name: decoded.name || userData.nom || "Utilisateur",
          role: userRole,
          travail: userData.travail,
          etatCompte: userData.etatCompte,
        };

        console.log("User info created:", userInfo);

        // Vérifier l'autorisation
        const isAuthorized = checkUserAuthorization(userData, userInfo);
        if (!isAuthorized) {
          console.log("User not authorized, redirection handled");
          return;
        }

        // Utilisateur autorisé
        setUser(userInfo);
        localStorage.setItem("lastRole", userRole);
        console.log("User authenticated successfully");
      } catch (err: any) {
        console.error("Auth initialization error:", err);
        setError(err.message || "Failed to initialize authentication");
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      redirecting.current = false;

      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { token } = response.data;
      if (!token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", token);
      const decoded = parseJwt(token);

      const userResponse = await axios.get(`http://localhost:8080/api/utilisateur/${decoded.email || decoded.sub}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = userResponse.data;
      const userRole = mapRoleToFrontend(decoded.role);

      const userInfo: User = {
        id: decoded.sub || "unknown",
        email: decoded.email || email,
        name: decoded.name || userData.nom || "Utilisateur",
        role: userRole,
        travail: userData.travail,
        etatCompte: userData.etatCompte,
      };

      // Vérifier l'autorisation
      const isAuthorized = checkUserAuthorization(userData, userInfo);
      if (!isAuthorized) {
        return; // La redirection est gérée dans checkUserAuthorization
      }

      setUser(userInfo);
      localStorage.setItem("userEroner", JSON.stringify(userInfo));
      localStorage.setItem("lastRole", userRole);
      console.log("Login successful");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Exposer checkUserStatus pour AuthGuard
  const authValues: AuthContextType & { checkUserStatus?: (userInfo: User) => Promise<boolean> } = {
    user,
    login,
    logout,
    isLoading,
    error,
    checkUserStatus,
  };

  return (
    <AuthContext.Provider value={authValues}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, checkUserStatus } = useAuth() as any;

  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout;

    const periodicCheck = async () => {
      console.log("AuthGuard: Checking user status periodically");
      await checkUserStatus(user);
    };

    // Vérification initiale
    periodicCheck();

    // Vérification périodique toutes les 5 secondes
    intervalId = setInterval(periodicCheck, 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, checkUserStatus]);

  return <>{children}</>;
};