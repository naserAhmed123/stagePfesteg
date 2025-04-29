import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  AlertHexaIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useState, useEffect, useRef } from 'react';

export default function EcommerceMetrics() {
  const [reclamations, setReclamations] = useState([]);
  const [reclamationsPrev, setReclamationsPrev] = useState([]);
  const [allReclamations, setAllReclamations] = useState([]);
  const [error, setError] = useState(null);
  const [citoyens, setCitoyens] = useState([]);
  const [citoyensPrev, setCitoyensPrev] = useState([]);
  const [allCitoyens, setAllCitoyens] = useState([]);
  const [citoyensEvolution, setCitoyensEvolution] = useState(0);
  const [reclamationsEvolution, setReclamationsEvolution] = useState(0);

  useEffect(() => {
    const ceJour = new Date();
    const hier = new Date();
    hier.setDate(ceJour.getDate() - 1);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const ceJourStr = formatDate(ceJour);
    const hierStr = formatDate(hier);

    const calculateEvolution = (currentValue, previousValue) => {
      if (previousValue === 0) {
        return currentValue > 0 ? 100 : 0;
      } else {
        return ((currentValue - previousValue) / previousValue) * 100;
      }
    };

    const fetchReclamations = async () => {
      try {
        const response = await fetch('http://localhost:8080/reclamations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Échec du chargement: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setAllReclamations(data);
        
        console.log("Nombre total de réclamations:", data.length);
        
        
        const ceJourReclamations = data.filter(rec => {
          if (!rec.heureReclamation) return false;
          return rec.heureReclamation.startsWith(ceJourStr);
        });
        
        const hierReclamations = data.filter(rec => {
          if (!rec.heureReclamation) return false;
          return rec.heureReclamation.startsWith(hierStr);
        });
        
        
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
    
    const fetchCitoyens = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/citoyens', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Échec du chargement: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setAllCitoyens(data);
        
       
        
        const ceJourCitoyens = data.filter(cit => {
          if (!cit.dateCreation) return false;
          return cit.dateCreation.startsWith(ceJourStr);
        });
        
        const hierCitoyens = data.filter(cit => {
          if (!cit.dateCreation) return false;
          return cit.dateCreation.startsWith(hierStr);
        });
        
        
        setCitoyens(ceJourCitoyens);
        setCitoyensPrev(hierCitoyens);
        
        const ceJourCount = ceJourCitoyens.length;
        const hierCount = hierCitoyens.length;
        
        const evolution = calculateEvolution(ceJourCount, hierCount);
        setCitoyensEvolution(parseFloat(evolution.toFixed(2)));
      } catch (err) {
        setError(err.message);
        console.error("Erreur lors du chargement des citoyens:", err);
      }
    };
    
    fetchReclamations();
    fetchCitoyens();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Le Nombre des citoyens
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {allCitoyens.length}
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
              {allReclamations.length}
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