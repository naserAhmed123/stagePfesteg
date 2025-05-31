import {
    ArrowDownIcon,
    ArrowUpIcon,
    GroupIcon,
    AlertHexaIcon,
  } from "../../icons";
  import Badge from "../ui/badge/Badge";
  import { useState, useEffect, useCallback } from "react";
  // Importer toast si utilisé, par exemple :
  // import { toast } from 'react-toastify';
  
  const API_URL = "http://localhost:8080"; // Définir l'URL de l'API comme constante
  
  export default function CitoyenChart() {
    const [reclamations, setReclamations] = useState([]);
    const [reclamationsPrev, setReclamationsPrev] = useState([]);
    const [Plaintes, setPlaintes] = useState([]);
    const [citoyens, setCitoyens] = useState([]);
    const [citoyensPrev, setCitoyensPrev] = useState([]);
    const [allPlaintes, setallPlaintes] = useState([]);
    const [citoyensEvolution, setCitoyensEvolution] = useState(0);
    const [reclamationsEvolution, setReclamationsEvolution] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
      id: "",
      nom: "",
      carteIdentite: "",
      role: "",
      motDePasse: "",
      con: "",
      confirmMotDePasse: "",
    });
  
    // Parse JWT token
    const parseJwt = useCallback((token) => {
      if (!token) return null;
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
        console.error("Erreur lors du décodage du token:", e);
        // Assurez-vous que 'toast' est importé si utilisé
        // toast.error('Problème avec votre session. Veuillez vous reconnecter.', {
        //   position: 'top-right',
        //   autoClose: 5000,
        // });
        return null;
      }
    }, []);
  
    // Fetch user data
    useEffect(() => {
      const fetchUser = async () => {
        try {
          setLoading(true);
          setError(null);
  
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Aucun token trouvé");
          }
  
          const decoded = parseJwt(token);
          if (!decoded) {
            throw new Error("Token JWT invalide ou mal formé");
          }
  
          const email = decoded.email || decoded.sub;
          if (!email) {
            throw new Error("Aucun email ou sujet trouvé dans le JWT");
          }
  
          const response = await fetch(`${API_URL}/api/utilisateur/${email}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (!response.ok) {
            throw new Error(
              `Échec de la récupération de l'utilisateur: ${response.status} ${response.statusText}`
            );
          }
  
          const userData = await response.json();
          setUserData({
            id: userData.id || "",
            nom: userData.nom || "",
            carteIdentite: userData.carteIdentite || "",
            role: userData.role || "",
            motDePasse: "",
            con: userData.con || "",
            confirmMotDePasse: "",
          });
          // toast.success('Données utilisateur chargées avec succès', {
          //   position: 'top-right',
          //   autoClose: 3000,
          // });
        } catch (err) {
          console.error("Erreur lors de la récupération de l'utilisateur:", err);
          setError(err.message);
          // toast.error(`Erreur: ${err.message}`, {
          //   position: 'top-right',
          //   autoClose: 5000,
          // });
        } finally {
          setLoading(false);
        }
      };
  
      fetchUser();
    }, [parseJwt]);
  
    // Fetch complaints
    useEffect(() => {
      const fetchPlaintes = async () => {
        if (!userData.id) return; // Attendre que userData.id soit disponible
  
        try {
          setLoading(true);
          setError(null);
  
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Aucun token trouvé");
          }
  
          const response = await fetch(
            `${API_URL}/api/plaintes/citoyen/${userData.id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
  
          if (!response.ok) {
            throw new Error(
              `Échec de la récupération des plaintes: ${response.status} ${response.statusText}`
            );
          }
  
          const data = await response.json();
          setallPlaintes(data); 
        } catch (error) {
          console.error("Erreur lors de la récupération des plaintes:", error);
          setError(error.message);
       
        } finally {
          setLoading(false);
        }
      };
  
      fetchPlaintes();
    }, [userData.id]);
  
    // Fetch reclamations and calculate evolution
    useEffect(() => {
      if (!userData.id) return; // Attendre que userData.id soit disponible
  
      const ceJour = new Date();
      const hier = new Date();
      hier.setDate(ceJour.getDate() - 1);
  
      const formatDate = (date) => {
        return date.toISOString().split("T")[0];
      };
  
      const ceJourStr = formatDate(ceJour);
      const hierStr = formatDate(hier);
  
      const calculateEvolution = (currentValue, previousValue) => {
        if (previousValue === 0) {
          return currentValue > 0 ? 100 : 0;
        }
        return ((currentValue - previousValue) / previousValue) * 100;
      };
  
      const fetchReclamations = async () => {
        try {
          const response = await fetch(
            `${API_URL}/reclamations/reclamations/citoyen/${userData.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
  
          if (!response.ok) {
            throw new Error(
              `Échec du chargement: ${response.status} ${response.statusText}`
            );
          }
  
          const data = await response.json();
          setPlaintes(data);
  
          const ceJourReclamations = data.filter(
            (rec) => rec.heureReclamation?.startsWith(ceJourStr)
          );
          const hierReclamations = data.filter(
            (rec) => rec.heureReclamation?.startsWith(hierStr)
          );
  
          setReclamations(ceJourReclamations);
          setReclamationsPrev(hierReclamations);
  
          const ceJourCount = ceJourReclamations.length;
          const hierCount = hierReclamations.length;
  
          const evolution = calculateEvolution(ceJourCount, hierCount);
          setReclamationsEvolution(parseFloat(evolution.toFixed(2)));
        } catch (err) {
          setError(err.message);
          console.error("Erreur lors du chargement des réclamations:", err);
        }
      };
  
      fetchReclamations();
    }, [userData.id]);
  
    if (loading) {
      return <div>Chargement...</div>;
    }
  
    if (error) {
      return <div>Erreur: {error}</div>;
    }
  
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
  
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Le Nombre des plaintes
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {allPlaintes.length}
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                {citoyens.length} aujourd'hui, {citoyensPrev.length} hier
              </p>
            </div>
            <Badge color={citoyensEvolution >= 0 ? "success" : "error"}>
              {citoyensEvolution >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(citoyensEvolution)}%
            </Badge>
          </div>
        </div>
  
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <AlertHexaIcon className="text-red-900 size-6 dark:text-red-400" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Nombre des réclamations
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {Plaintes.length}
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                {reclamations.length} aujourd'hui, {reclamationsPrev.length} hier
              </p>
            </div>
  
            <Badge color={reclamationsEvolution <= 0 ? "success" : "error"}>
              {reclamationsEvolution <= 0 ? <ArrowDownIcon /> : <ArrowUpIcon />}
              {Math.abs(reclamationsEvolution)}%
            </Badge>
          </div>
        </div>
      </div>
    );
  }