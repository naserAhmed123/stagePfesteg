import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CarteRisqueCoupureLumiereSfax = () => {
  const refCarte = useRef(null);
  const refInstanceCarte = useRef(null);
  const refGroupeCoucheZone = useRef(null);
  const refInfo = useRef(null);
  const refLegende = useRef(null);
  const [zonesVisibles, setZonesVisibles] = useState(true);
  const [statistiques, setStatistiques] = useState({
    pourcentageRisqueEleve: 0,
    pourcentageRisqueMoyen: 0,
    pourcentageRisqueFaible: 0,
    horodatage: formaterHorodatage(new Date())
  });
  const [periodeActive, setPeriodeActive] = useState('maintenant');
  const [reclamations, setReclamations] = useState([]);
  const coordonneesSfax = [34.7406, 10.7603];

  function formaterHorodatage(date) {
    return `Mis à jour : ${date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = convertirEnRadians(lat2 - lat1);
    const dLon = convertirEnRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(convertirEnRadians(lat1)) * Math.cos(convertirEnRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  }

  function convertirEnRadians(degres) {
    return degres * Math.PI / 180;
  }

  function creerContenuPopup(rue, position, nombreIncidents, niveauRisque, dernierIncident) {
    const [lat, lon] = position.split(',').map(coord => parseFloat(coord.trim()));
    const distance = calculerDistance(coordonneesSfax[0], coordonneesSfax[1], lat, lon);
    let couleurRisque;
    if (niveauRisque === 'Élevé') couleurRisque = '#e74c3c';
    else if (niveauRisque === 'Moyen') couleurRisque = '#f1c40f';
    else couleurRisque = '#2ecc71';

    return (
      <div className="font-sans">
        <div className="text-base font-bold mb-1 text-gray-800 border-b border-gray-200 pb-1">{rue} ({distance}km du centre de Sfax)</div>
        <div className="flex items-center mt-2">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: couleurRisque }}></div>
          <strong>{niveauRisque} Risque : {nombreIncidents} incidents</strong>
        </div>
        <div className="mt-2 text-sm">
          <div>Incidents signalés : {nombreIncidents}</div>
          <div>Dernier incident : {new Date(dernierIncident).toLocaleString('fr-FR')}</div>
        </div>
      </div>
    );
  }

  function calculerNiveauRisque(nombreIncidents) {
    if (nombreIncidents < 3) return { niveau: 'Faible', score: 1 };
    else if (nombreIncidents <= 5) return { niveau: 'Moyen', score: 2 };
    else return { niveau: 'Élevé', score: 3 };
  }

  function mettreAJourStatistiques(zones) {
    let compteRisqueEleve = 0, compteRisqueMoyen = 0, compteRisqueFaible = 0;

    zones.forEach(zone => {
      const proprietes = zone.properties;
      if (proprietes.niveau === 'Élevé') compteRisqueEleve++;
      else if (proprietes.niveau === 'Moyen') compteRisqueMoyen++;
      else compteRisqueFaible++;
    });

    const totalZones = zones.length;
    const pourcentageRisqueEleve = totalZones ? Math.round((compteRisqueEleve / totalZones) * 100) : 0;
    const pourcentageRisqueMoyen = totalZones ? Math.round((compteRisqueMoyen / totalZones) * 100) : 0;
    const pourcentageRisqueFaible = totalZones ? Math.round((compteRisqueFaible / totalZones) * 100) : 0;

    setStatistiques({
      pourcentageRisqueEleve,
      pourcentageRisqueMoyen,
      pourcentageRisqueFaible,
      horodatage: formaterHorodatage(new Date())
    });
  }

  function recupererReclamations() {
    fetch('http://localhost:8080/reclamations')
      .then(reponse => reponse.json())
      .then(donnees => {
        setReclamations(donnees);
        filtrerEtGenererZones(donnees);
      })
      .catch(erreur => console.error('Erreur lors de la récupération des réclamations :', erreur));
  }

  function filtrerEtGenererZones(donnees) {
    const aujourdHui = new Date('2025-05-04');
    const aujourdHuiStr = aujourdHui.toISOString().split('T')[0];
    const hier = new Date(aujourdHui);
    hier.setDate(aujourdHui.getDate() - 1);
    const hierStr = hier.toISOString().split('T')[0];
    const avantHier = new Date(aujourdHui);
    avantHier.setDate(aujourdHui.getDate() - 2);
    const avantHierStr = avantHier.toISOString().split('T')[0];
    const avantAvantHier = new Date(aujourdHui);
    avantAvantHier.setDate(aujourdHui.getDate() - 3);
    const avantAvantHierStr = avantAvantHier.toISOString().split('T')[0];

    let donneesFiltrees = donnees;
    switch (periodeActive) {
      case 'maintenant':
        donneesFiltrees = donnees.filter(reclamation => {
          const dateReclamation = reclamation.heureReclamation.split('T')[0];
          return dateReclamation === aujourdHuiStr;
        });
        break;
      case 'matin':
        donneesFiltrees = donnees.filter(reclamation => {
          const dateReclamation = reclamation.heureReclamation.split('T')[0];
          return dateReclamation === avantHierStr;
        });
        break;
      case 'apres-midi':
        donneesFiltrees = donnees.filter(reclamation => {
          const dateReclamation = reclamation.heureReclamation.split('T')[0];
          return dateReclamation === avantAvantHierStr;
        });
        break;
      case 'hier':
        donneesFiltrees = donnees.filter(reclamation => {
          const dateReclamation = reclamation.heureReclamation.split('T')[0];
          return dateReclamation === hierStr;
        });
        break;
    }

    if (!refInstanceCarte.current || !refGroupeCoucheZone.current) return;

    refGroupeCoucheZone.current.clearLayers();

    if (!donneesFiltrees.length) {
      mettreAJourStatistiques([]);
      return;
    }

    const zonesParLieu = donneesFiltrees.reduce((acc, reclamation) => {
      const cle = `${reclamation.rue}|${reclamation.Position2Km}`;
      if (!acc[cle]) acc[cle] = [];
      acc[cle].push(reclamation);
      return acc;
    }, {});

    const zones = [];

    Object.keys(zonesParLieu).forEach(cleLieu => {
      const [rue, position] = cleLieu.split('|');
      const reclamationsLieu = zonesParLieu[cleLieu];
      const coordonnees = position.split(',').map(coord => parseFloat(coord.trim()));
      const nombreIncidents = reclamationsLieu.length;

      const { niveau, score } = calculerNiveauRisque(nombreIncidents);
      const pourcentageRisque = Math.round((score / 3) * 100);

      let couleurRemplissage;
      if (nombreIncidents < 3) couleurRemplissage = '#2ecc71';
      else if (nombreIncidents <= 5) couleurRemplissage = '#f1c40f';
      else couleurRemplissage = '#e74c3c';

      const dernierIncident = reclamationsLieu.reduce((dernier, rec) => {
        const dateActuelle = new Date(rec.heureReclamation);
        return dateActuelle > new Date(dernier) ? rec.heureReclamation : dernier;
      }, reclamationsLieu[0].heureReclamation);

      const cercle = L.circle(coordonnees, {
        color: '#333',
        fillColor: couleurRemplissage,
        fillOpacity: 0.5,
        weight: 1,
        radius: 500
      }).addTo(refGroupeCoucheZone.current);

      cercle.properties = {
        nom: rue,
        position: position,
        risque: pourcentageRisque,
        niveau: niveau,
        nombreIncidents: nombreIncidents,
        dernierIncident: dernierIncident
      };

      zones.push(cercle);

      cercle.bindPopup(creerContenuPopup(rue, position, nombreIncidents, niveau, dernierIncident));

      cercle.on('mouseover', function(e) {
        this.setStyle({ fillOpacity: 0.7, weight: 3 });
        if (refInfo.current) refInfo.current.update(this.properties);
      });

      cercle.on('mouseout', function(e) {
        this.setStyle({ fillOpacity: 0.5, weight: 1 });
        if (refInfo.current) refInfo.current.update();
      });
    });

    mettreAJourStatistiques(zones);
  }

  const basculerZones = () => {
    if (!refInstanceCarte.current || !refGroupeCoucheZone.current) return;

    if (zonesVisibles) {
      refInstanceCarte.current.removeLayer(refGroupeCoucheZone.current);
    } else {
      refInstanceCarte.current.addLayer(refGroupeCoucheZone.current);
    }
    setZonesVisibles(!zonesVisibles);
  };

  const gererZoomAvant = () => {
    if (refInstanceCarte.current) refInstanceCarte.current.zoomIn();
  };

  const gererZoomArriere = () => {
    if (refInstanceCarte.current) refInstanceCarte.current.zoomOut();
  };

  const gererClicPeriode = (periode) => {
    setPeriodeActive(periode);
    filtrerEtGenererZones(reclamations);
  };

  useEffect(() => {
    const lien = document.createElement('link');
    lien.rel = 'stylesheet';
    lien.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(lien);

    if (!refInstanceCarte.current && refCarte.current) {
      refInstanceCarte.current = L.map(refCarte.current, { zoomControl: false }).setView(coordonneesSfax, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
      }).addTo(refInstanceCarte.current);

      refGroupeCoucheZone.current = L.layerGroup().addTo(refInstanceCarte.current);

      const info = L.control({ position: 'bottomright' });

      info.onAdd = function(carte) {
        this._div = L.DomUtil.create('div', 'info bg-white p-2 rounded-md shadow-md font-sans text-sm max-w-xs');
        this.update();
        return this._div;
      };

      info.update = function(props) {
        this._div.innerHTML = '<h4 className="text-blue-500 m-0 mb-1 border-b border-gray-100 pb-1">Risque de coupure de lumière</h4>' + (props ?
          '<b>' + props.nom + ' (' + calculerDistance(coordonneesSfax[0], coordonneesSfax[1], props.position.split(',')[0], props.position.split(',')[1]) + 'km du centre de Sfax)</b><br />' + props.nombreIncidents + ' incidents' :
          'Survolez une zone pour plus de détails');
      };

      info.addTo(refInstanceCarte.current);
      refInfo.current = info;

      const legende = L.control({ position: 'bottomright' });

      legende.onAdd = function(carte) {
        const div = L.DomUtil.create('div', 'legende bg-white p-2 shadow-md rounded-md text-gray-600 leading-6');
        const seuils = [2, 5];
        const etiquettes = ['Risque faible (<3)', 'Risque moyen (3-5)', 'Risque élevé (>5)'];
        const couleurs = ['#2ecc71', '#f1c40f', '#e74c3c'];

        div.innerHTML = '<h4 className="text-sm font-bold m-0 mb-1">Niveaux de risque</h4>';
        for (let i = 0; i < seuils.length + 1; i++) {
          div.innerHTML += '<i style="width:18px;height:18px;float:left;margin-right:8px;opacity:0.7;background:' + couleurs[i] + '"></i> ' + etiquettes[i] + '<br>';
        }
        return div;
      };

      legende.addTo(refInstanceCarte.current);
      refLegende.current = legende;

      L.circle(coordonneesSfax, {
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.05,
        weight: 2,
        radius: 50000
      }).addTo(refInstanceCarte.current);

      recupererReclamations();
    }

    return () => {
      if (refInstanceCarte.current) {
        refInstanceCarte.current.remove();
        refInstanceCarte.current = null;
      }
      const liens = document.head.querySelectorAll('link');
      liens.forEach(lienEl => {
        if (lienEl.href.includes('font-awesome')) lienEl.remove();
      });
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-full m-0 p-4 box-border bg-white">
      <div className="text-center mb-4 bg-white p-4 rounded-lg shadow-md">
        <h1 className="m-0 text-2xl font-bold text-gray-800">Carte du risque de coupure de lumière à Sfax</h1>
        <p className="text-gray-500 my-2">Visualisation en temps réel des zones potentielles de coupure d'électricité à Sfax</p>
      </div>

      <div className="flex h-full gap-4 flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md flex-shrink-0">
            <h3 className="mt-0 text-base font-bold text-gray-800">Sélectionner la période</h3>
            <div className="flex flex-col gap-2">
              {[
                { id: 'maintenant', label: 'État actuel' },
                { id: 'hier', label: 'Hier' },
                { id: 'matin', label: 'Avant-hier' },
                { id: 'apres-midi', label: 'Avant avant-hier' }
              ].map(periode => (
                <div
                  key={periode.id}
                  className={`p-2 rounded cursor-pointer transition-all duration-200 ${
                    periodeActive === periode.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  data-time={periode.id}
                  onClick={() => gererClicPeriode(periode.id)}
                >
                  {periode.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
              <h2 className="m-0 text-lg font-bold text-gray-800">Statistiques actuelles</h2>
              <span className="text-sm text-gray-500">{statistiques.horodatage}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <div className="text-2xl font-bold text-blue-500 my-2">{statistiques.pourcentageRisqueEleve}%</div>
                <div className="text-sm text-gray-500">Zones à risque élevé</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <div className="text-2xl font-bold text-blue-500 my-2">{statistiques.pourcentageRisqueMoyen}%</div>
                <div className="text-sm text-gray-500">Zones à risque moyen</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <div className="text-2xl font-bold text-blue-500 my-2">{statistiques.pourcentageRisqueFaible}%</div>
                <div className="text-sm text-gray-500">Zones à risque faible</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-grow h-96 lg:h-auto">
          <div className="absolute inset-0 rounded-lg overflow-hidden z-9 shadow-md border-2 border-gray-200 lg:h-full sm:h-auto">
            <div id="carte" ref={refCarte} className="h-full w-full"></div>
          </div>

          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div
              className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200"
              title="Actualiser les données"
              onClick={() => recupererReclamations()}
            >
              <i className="fas fa-sync-alt"></i>
            </div>
            <div
              className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200"
              title={zonesVisibles ? 'Cacher les zones de risque' : 'Afficher les zones de risque'}
              onClick={basculerZones}
            >
              <i className={`fas ${zonesVisibles ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </div>
            <div
              className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200"
              title="Zoomer"
              onClick={gererZoomAvant}
            >
              <i className="fas fa-plus"></i>
            </div>
            <div
              className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-200"
              title="Dézoomer"
              onClick={gererZoomArriere}
            >
              <i className="fas fa-minus"></i>
            </div>
          </div>
        </div>

        <div className="w-20 sm:w-32 md:w-40 lg:w-48">
          <div className="bg-white p-5 rounded-lg shadow-md mt-4 lg:mt-0">
            <h2 className="text-lg font-bold text-gray-800 mt-0 border-b-2 border-gray-100 pb-2">Analyse des risques</h2>
            <div className="flex justify-around flex-wrap my-5">
              <div className="text-center p-4 rounded bg-red-50 border-l-4 border-red-500 w-full mb-2">
                <h3 className="text-base font-bold m-0">Risque élevé</h3>
                <div className="text-2xl font-bold my-2">5</div>
              </div>
              <div className="text-center p-4 rounded bg-yellow-50 border-l-4 border-yellow-400 w-full mb-2">
                <h3 className=" W3C validated code (HTML/CSS) text-base font-bold m-0">Risque moyen</h3>
                <div className="text-2xl font-bold my-2">3-5</div>
              </div>
              <div className="text-center p-4 rounded bg-green-50 border-l-4 border-green-500 w-full mb-2">
                <h3 className="text-base font-bold m-0">Risque faible</h3>
                <div className="text-2xl font-bold my-2">3</div>
              </div>
            </div>
            <div className="italic bg-gray-50 p-3 rounded border-l-3 border-blue-500 mt-4">
              <strong>Note :</strong> Ceci est une visualisation expérimentale. Pour des informations officielles sur les coupures d'électricité, veuillez contacter le fournisseur d'électricité local.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteRisqueCoupureLumiereSfax;