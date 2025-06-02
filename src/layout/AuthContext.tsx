import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "direction" | "intervention" | "client";
  avatar?: string;
  travail?: "ENCOURS" | "QUITTER"; // For SERVICE_INTERVENTION
  etatCompte?: "NON_BLOQUER" | "BLOQUER"; // For CITOYEN
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
    console.log("Logging out, keeping lastRole");
    setUser(null);
    localStorage.removeItem("token");
    // Keep lastRole to handle redirection in ProtectedRoute
  };

  const checkAuthorization = (userData: any, role: string, userInfo: User) => {
    console.log(`Checking authorization for role: ${role}, travail: ${userData.travail}, etatCompte: ${userData.etatCompte}`);
    
    if (role === "intervention" && userData.travail !== "ENCOURS") {
      console.log("Intervention user not ENCOURS, setting userEroner before logout");
      localStorage.setItem("userEroner", JSON.stringify(userInfo));
      // Forcer l'écriture dans localStorage
      console.log("userEroner set to:", localStorage.getItem("userEroner"));
      logout();
      // Utiliser setTimeout pour s'assurer que localStorage est écrit
      setTimeout(() => {
        navigate("/blocked", { replace: true });
      }, 100);
      return false;
    }
    
    if (role === "client" && userData.etatCompte !== "NON_BLOQUER") {
      console.log("Client user not NON_BLOQUER, setting userEroner before logout");
      localStorage.setItem("userEroner", JSON.stringify(userInfo));
      // Forcer l'écriture dans localStorage
      console.log("userEroner set to:", localStorage.getItem("userEroner"));
      logout();
      // Utiliser setTimeout pour s'assurer que localStorage est écrit
      setTimeout(() => {
        navigate("/blockedCit", { replace: true });
      }, 100);
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const decoded = parseJwt(token);
        console.log("Decoded JWT (useEffect):", decoded);
        const email = decoded.email || decoded.sub;
        if (!email) {
          throw new Error("Aucun email ou sujet trouvé dans le JWT");
        }

        const response = await axios.get(`http://localhost:8080/api/utilisateur/${email}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data;
        const userRole = mapRoleToFrontend(decoded.role);

        // Créer userInfo AVANT de vérifier l'autorisation
        const userInfo: User = {
          id: decoded.sub || "unknown",
          email: decoded.email || email,
          name: decoded.name || userData.nom || "Utilisateur",
          role: userRole,
          travail: userData.travail,
          etatCompte: userData.etatCompte,
        };

        // Maintenant appeler checkAuthorization avec les 3 paramètres
        const isAuthorized = checkAuthorization(userData, userRole, userInfo);
        if (!isAuthorized) {
          return;
        }

        setUser(userInfo);
        localStorage.setItem("lastRole", userRole);
        localStorage.setItem("userEroner", JSON.stringify(userInfo));
        console.log("lastRole set to:", userRole);
        console.log("userEroner set to:", userInfo);
      } catch (err: any) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err);
        setError(err.message || "Échec de la récupération des données utilisateur");
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Backend response:", response.data);
      const { token } = response.data;
      if (!token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", token);
      const decoded = parseJwt(token);
      console.log("Decoded JWT (login):", decoded);

      const userResponse = await axios.get(`http://localhost:8080/api/utilisateur/${decoded.email || decoded.sub}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = userResponse.data;
      const userRole = mapRoleToFrontend(decoded.role);

      // Créer userInfo AVANT de vérifier l'autorisation
      const userInfo: User = {
        id: decoded.sub || "unknown",
        email: decoded.email || email,
        name: decoded.name || userData.nom || "Utilisateur",
        role: userRole,
        travail: userData.travail,
        etatCompte: userData.etatCompte,
      };

      // Maintenant appeler checkAuthorization avec les 3 paramètres
      const isAuthorized = checkAuthorization(userData, userRole, userInfo);
      if (!isAuthorized) {
        return;
      }

      setUser(userInfo);
      localStorage.setItem("userEroner", JSON.stringify(userInfo)); // Utiliser userInfo au lieu de user
      localStorage.setItem("lastRole", userRole);
      console.log("lastRole set to:", userRole);
      console.log("userEroner set to:", userInfo);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Échec de la connexion";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const authValues: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={authValues}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        if (!user) {
          console.log("No user, checking token and lastRole");
          const token = localStorage.getItem("token");
          const lastRole = localStorage.getItem("lastRole");
          console.log("Token:", !!token, "lastRole:", lastRole);
          navigate(token ? "/" : lastRole === "client" ? "/blockedCit" : "/blocked", { replace: true });
          return false;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token, redirecting based on lastRole:", localStorage.getItem("lastRole"));
          logout();
          navigate(localStorage.getItem("lastRole") === "client" ? "/blockedCit" : "/blocked", { replace: true });
          return false;
        }

        const response = await axios.get(`http://localhost:8080/api/utilisateur/${user.email}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data;
        console.log("User data:", userData);

        if (user.role === "intervention" && userData.travail !== "ENCOURS") {
          console.log("Intervention user not ENCOURS, redirecting to /blocked");
          localStorage.setItem("userEroner", JSON.stringify(user)); // Sauvegarder avant logout
          logout();
          navigate("/blocked", { replace: true });
          return false;
        }

        if (user.role === "client" && userData.etatCompte !== "NON_BLOQUER") {
          console.log("Client user not NON_BLOQUER, redirecting to /blockedCit");
          localStorage.setItem("userEroner", JSON.stringify(user)); // Sauvegarder avant logout
          logout();
          navigate("/blockedCit", { replace: true });
          return false;
        }

        return true;
      } catch (err: any) {
        console.error("Erreur lors de la vérification du statut utilisateur:", err);
        console.log("Error redirecting based on lastRole:", localStorage.getItem("lastRole"));
        logout();
        navigate(localStorage.getItem("lastRole") === "client" ? "/blockedCit" : "/blocked", { replace: true });
        return false;
      }
    };

    checkUserStatus(); // Initial check
    const interval = setInterval(checkUserStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [user, logout, navigate]);

  return <>{children}</>;
};