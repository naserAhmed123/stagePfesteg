import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuration des icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

const CarteRisqueCoupureLumiereSfax = () => {
  const refCarte = useRef(null);
  const refInstanceCarte = useRef(null);
  const refGroupeCoucheZone = useRef(null);
  const [zonesVisibles, setZonesVisibles] = useState(true);
  const [statistiques, setStatistiques] = useState({
    pourcentageRisqueEleve: 0,
    pourcentageRisqueMoyen: 0,
    pourcentageRisqueFaible: 0,
    horodatage: formaterHorodatage(new Date())
  });
  const [periodeActive, setPeriodeActive] = useState('aujourdhui');
  const [reclamations, setReclamations] = useState([]);
  const coordonneesSfax = [34.7406, 10.7603];

  // Fonction pour formater la date
  function formaterHorodatage(date) {
    return `Mis à jour : ${date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  // Fonction pour calculer la distance
  function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  // Fonction pour déterminer le niveau de risque
  function calculerNiveauRisque(nombreIncidents) {
    if (nombreIncidents < 3) return { niveau: 'Faible', score: 1 };
    else if (nombreIncidents <= 5) return { niveau: 'Moyen', score: 2 };
    else return { niveau: 'Élevé', score: 3 };
  }

  // Fonction pour mettre à jour les statistiques
  function mettreAJourStatistiques(zones) {
    let compteRisqueEleve = 0, compteRisqueMoyen = 0, compteRisqueFaible = 0;

    zones.forEach(zone => {
      const niveau = zone.options.niveau;
      if (niveau === 'Élevé') compteRisqueEleve++;
      else if (niveau === 'Moyen') compteRisqueMoyen++;
      else compteRisqueFaible++;
    });

    const totalZones = zones.length;
    setStatistiques({
      pourcentageRisqueEleve: totalZones ? Math.round((compteRisqueEleve / totalZones) * 100) : 0,
      pourcentageRisqueMoyen: totalZones ? Math.round((compteRisqueMoyen / totalZones) * 100) : 0,
      pourcentageRisqueFaible: totalZones ? Math.round((compteRisqueFaible / totalZones) * 100) : 0,
      horodatage: formaterHorodatage(new Date())
    });
  }

  // Fonction pour récupérer les réclamations depuis l'API
  function recupererReclamations() {
    fetch('http://localhost:8080/reclamations')
      .then(reponse => reponse.json())
      .then(donnees => {
        setReclamations(donnees);
        filtrerEtGenererZones(donnees);
      })
      .catch(erreur => console.error('Erreur:', erreur));
  }

  // Fonction pour filtrer par date et générer les zones
  function filtrerEtGenererZones(donnees) {
    if (!donnees || donnees.length === 0) return;

    const maintenant = new Date();
    const aujourdHui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const hier = new Date(aujourdHui);
    hier.setDate(hier.getDate() - 1);
    const avantHier = new Date(hier);
    avantHier.setDate(avantHier.getDate() - 1);

    let donneesFiltrees = donnees.filter(reclamation => {
      if (!reclamation.heureReclamation) return false;
      
      const dateReclamation = new Date(reclamation.heureReclamation);
      const dateReclamationOnly = new Date(dateReclamation.getFullYear(), dateReclamation.getMonth(), dateReclamation.getDate());

      switch (periodeActive) {
        case 'aujourdhui': 
          return dateReclamationOnly.getTime() === aujourdHui.getTime();
        case 'hier': 
          return dateReclamationOnly.getTime() === hier.getTime();
        case 'avant-hier': 
          return dateReclamationOnly.getTime() === avantHier.getTime();
        default: 
          return false;
      }
    });

    genererZonesSurCarte(donneesFiltrees);
  }

  // Fonction pour générer les cercles sur la carte
  function genererZonesSurCarte(donneesFiltrees) {
    if (!refInstanceCarte.current || !refGroupeCoucheZone.current) return;

    refGroupeCoucheZone.current.clearLayers();

    if (!donneesFiltrees || donneesFiltrees.length === 0) {
      mettreAJourStatistiques([]);
      return;
    }

    const zonesParPosition = donneesFiltrees.reduce((acc, reclamation) => {
      const positionCle = reclamation.Position2Km;
      if (!acc[positionCle]) acc[positionCle] = [];
      acc[positionCle].push(reclamation);
      return acc;
    }, {});

    const zones = [];

    Object.entries(zonesParPosition).forEach(([position, reclamations]) => {
      const [lat, lon] = position.split(',').map(Number);
      const nombreIncidents = reclamations.length;
      const { niveau } = calculerNiveauRisque(nombreIncidents);
      const rue = reclamations[0].rue || 'Position inconnue';
      const dernierIncident = reclamations.reduce((latest, rec) => {
        const dateRec = new Date(rec.heureReclamation);
        return dateRec > latest ? dateRec : latest;
      }, new Date(reclamations[0].heureReclamation));

      const cercle = L.circle([lat, lon], {
        radius: 500,
        fillColor: getCouleurParNiveau(niveau),
        color: '#333',
        weight: 1,
        fillOpacity: 0.7,
        niveau: niveau,
        rue: rue,
        nombreIncidents: nombreIncidents,
        dernierIncident: dernierIncident
      }).addTo(refGroupeCoucheZone.current);

      cercle.bindPopup(`
        <div class="p-2 font-sans">
          <h3 class="font-bold mb-1">${rue}</h3>
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 rounded-full mr-2" style="background:${getCouleurParNiveau(niveau)}"></div>
            <span>${niveau} risque (${nombreIncidents} incidents)</span>
          </div>
          <p class="text-sm">Dernier incident: ${dernierIncident.toLocaleString('fr-FR')}</p>
          <p class="text-sm">Distance du centre: ${calculerDistance(coordonneesSfax[0], coordonneesSfax[1], lat, lon)}km</p>
        </div>
      `);

      zones.push(cercle);
    });

    mettreAJourStatistiques(zones);
  }

  // Fonction pour obtenir la couleur selon le niveau de risque
  function getCouleurParNiveau(niveau) {
    switch(niveau) {
      case 'Élevé': return '#e74c3c';
      case 'Moyen': return '#f1c40f';
      case 'Faible': return '#2ecc71';
      default: return '#3498db';
    }
  }

  // Fonction pour basculer la visibilité des zones
  const basculerZones = () => {
    if (!refInstanceCarte.current || !refGroupeCoucheZone.current) return;

    if (zonesVisibles) {
      refInstanceCarte.current.removeLayer(refGroupeCoucheZone.current);
    } else {
      refInstanceCarte.current.addLayer(refGroupeCoucheZone.current);
    }
    setZonesVisibles(!zonesVisibles);
  };

  // Initialisation de la carte
  useEffect(() => {
    if (!refInstanceCarte.current && refCarte.current) {
      refInstanceCarte.current = L.map(refCarte.current, {
        zoomControl: false,
        center: coordonneesSfax,
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(refInstanceCarte.current);

      refGroupeCoucheZone.current = L.layerGroup().addTo(refInstanceCarte.current);

      // Ajout de la légende
      const legende = L.control({ position: 'bottomright' });
      legende.onAdd = () => {
        const div = L.DomUtil.create('div', 'legende bg-white p-2 shadow rounded');
        div.innerHTML = `
          <h4 class="text-sm font-bold mb-1">Niveaux de risque</h4>
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 rounded-full mr-2" style="background:#e74c3c"></div>
            <span>Risque élevé (>5 incidents)</span>
          </div>
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 rounded-full mr-2" style="background:#f1c40f"></div>
            <span>Risque moyen (3-5 incidents)</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-2" style="background:#2ecc71"></div>
            <span>Risque faible (<3 incidents)</span>
          </div>
        `;
        return div;
      };
      legende.addTo(refInstanceCarte.current);

      recupererReclamations();
    }

    return () => {
      if (refInstanceCarte.current) {
        refInstanceCarte.current.remove();
        refInstanceCarte.current = null;
      }
    };
  }, []);

  // Effet pour filtrer les données quand la période change
  useEffect(() => {
    if (reclamations.length > 0) {
      filtrerEtGenererZones(reclamations);
    }
  }, [periodeActive]);

  // Fonction pour formater la date affichée dans les boutons
  function formaterDatePourAffichage(date) {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
  }

  // Génération des dates pour les boutons
  const maintenant = new Date();
  const aujourdHui = new Date(maintenant);
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  const avantHier = new Date(hier);
  avantHier.setDate(avantHier.getDate() - 1);

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      <div className="text-center mb-4 bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Carte du risque de coupure de lumière à Sfax</h1>
        <p className="text-gray-500">Visualisation des zones de coupure d'électricité</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow">
        <div className="w-full lg:w-64 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-2">Période</h3>
            <div className="flex flex-col gap-2">
              <button
                className={`p-2 rounded text-left ${
                  periodeActive === 'aujourdhui' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setPeriodeActive('aujourdhui')}
              >
                Aujourd'hui ({formaterDatePourAffichage(aujourdHui)})
              </button>
              <button
                className={`p-2 rounded text-left ${
                  periodeActive === 'hier' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setPeriodeActive('hier')}
              >
                Hier ({formaterDatePourAffichage(hier)})
              </button>
              <button
                className={`p-2 rounded text-left ${
                  periodeActive === 'avant-hier' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setPeriodeActive('avant-hier')}
              >
                Avant-hier ({formaterDatePourAffichage(avantHier)})
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-gray-800">Statistiques</h2>
              <span className="text-sm text-gray-500">{statistiques.horodatage}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 p-2 rounded text-center">
                <div className="font-bold text-red-600">{statistiques.pourcentageRisqueEleve}%</div>
                <div className="text-xs">Élevé</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-center">
                <div className="font-bold text-yellow-600">{statistiques.pourcentageRisqueMoyen}%</div>
                <div className="text-xs">Moyen</div>
              </div>
              <div className="bg-green-50 p-2 rounded text-center">
                <div className="font-bold text-green-600">{statistiques.pourcentageRisqueFaible}%</div>
                <div className="text-xs">Faible</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow relative">
          <div 
            ref={refCarte} 
            className="absolute inset-0 rounded-lg shadow border border-gray-200"
          ></div>
          
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              className="w-10 h-10 bg-white rounded shadow flex items-center justify-center hover:bg-gray-100"
              onClick={recupererReclamations}
              title="Actualiser"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              className="w-10 h-10 bg-white rounded shadow flex items-center justify-center hover:bg-gray-100"
              onClick={basculerZones}
              title={zonesVisibles ? 'Masquer zones' : 'Afficher zones'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteRisqueCoupureLumiereSfax;