import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "direction" | "intervention" | "client";
  avatar?: string;
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

  const mapRoleToFrontend = (backendRole: string | undefined): "direction" | "intervention" | "client" => {
    console.log("Backend role:", backendRole); // Log pour déboguer
    if (!backendRole) {
      console.warn("Role missing in token, defaulting to client");
      return "client"; // Valeur par défaut
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = parseJwt(token);
        console.log("Decoded JWT (useEffect):", decoded);
        setUser({
          id: decoded.sub || "unknown",
          email: decoded.email || "",
          name: decoded.name || "Utilisateur",
          role: mapRoleToFrontend(decoded.role),
        });
      } catch (err: any) {
        console.error("Failed to decode token:", err.message);
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

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

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Backend response:", response.data); // Log pour déboguer
      const { token } = response.data;
      if (!token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", token);
      const decoded = parseJwt(token);
      console.log("Decoded JWT (login):", decoded); 
      localStorage.setItem("user", decoded);

      const userInfo: User = {
        id: decoded.sub || "unknown",
        email: decoded.email || email,
        name: decoded.name || "Utilisateur",
        role: mapRoleToFrontend(decoded.role),
      };

      setUser(userInfo);

    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Échec de la connexion";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
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