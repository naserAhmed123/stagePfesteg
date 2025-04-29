import { useState, useRef } from 'react';
import { Calendar, Clock, Download, FileText, ChevronDown, Plus, Trash2 } from 'lucide-react';
import logo from './logoPrinp.png';

export default function GenerateurRapport() {
  const [typeRapport, setTypeRapport] = useState('journalier');
  const [titreRapport, setTitreRapport] = useState('');
  const [dateRapport, setDateRapport] = useState('');
  const [texteRapport, setTexteRapport] = useState('');
  const [champsPersonnalises, setChampsPersonnalises] = useState([]);
  const [montrerListeTypes, setMontrerListeTypes] = useState(false);
  const [enCreation, setEnCreation] = useState(false);
  const [telechargementReussi, setTelechargementReussi] = useState(false);
  const zoneTexteRef = useRef(null);
  const zoneRapportRef = useRef(null);

  // Fonction pour simuler la création d'un PDF
  const simulerCreationPDF = () => {
    return {
      creerPDF: (element) => {
        return new Promise((resolve) => { 
          setTimeout(() => resolve('data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago...'), 500);
        });
      }
    };
  };

  // Ajouter un nouveau champ personnalisé
  const ajouterChamp = () => {
    setChampsPersonnalises([...champsPersonnalises, { nom: 'Nouveau champ', valeur: '' }]);
  };

  // Supprimer un champ personnalisé
  const supprimerChamp = (index) => {
    const nouveauxChamps = [...champsPersonnalises];
    nouveauxChamps.splice(index, 1);
    setChampsPersonnalises(nouveauxChamps);
  };

  // Changer le nom d'un champ
  const changerNomChamp = (index, nouveauNom) => {
    const nouveauxChamps = [...champsPersonnalises];
    nouveauxChamps[index].nom = nouveauNom;
    setChampsPersonnalises(nouveauxChamps);
  };

  // Changer la valeur d'un champ
  const changerValeurChamp = (index, nouvelleValeur) => {
    const nouveauxChamps = [...champsPersonnalises];
    nouveauxChamps[index].valeur = nouvelleValeur;
    setChampsPersonnalises(nouveauxChamps);
  };

  // Créer et télécharger le PDF
  const telechargerPDF = async () => {
    if (!zoneRapportRef.current) return;
    
    const outilPDF = simulerCreationPDF();
    
    try {
      setEnCreation(true);
      
      const donneesPDF = await outilPDF.creerPDF(zoneRapportRef.current);
      
      const lien = document.createElement('a');
      const nomFichier = `${titreRapport || 'Rapport'}_${typeRapport}_${dateRapport || 'sans-date'}.pdf`;
      lien.href = donneesPDF;
      lien.download = nomFichier;
      lien.click();
      
      setTelechargementReussi(true);
      setTimeout(() => setTelechargementReussi(false), 3000);
    } catch (error) {
      alert("Problème lors de la création du PDF. Essayez encore.");
    } finally {
      setEnCreation(false);
    }
  };

  // Liste des types de rapport
  const choixTypeRapport = {
    journalier: "Rapport du jour",
    hebdomadaire: "Rapport de la semaine",
    mensuel: "Rapport du mois"
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        <div className="bg-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Créateur de Rapports</h1>
            <p className="mt-1 text-indigo-100">Faites vos rapports facilement et téléchargez-les</p>
          </div>
          <div className="w-24 h-12 bg-white rounded-md p-1 flex items-center justify-center">
            <img src={logo} alt="Logo de l'entreprise" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de rapport</label>
            <div className="relative">
              <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMontrerListeTypes(!montrerListeTypes)}
              >
                <span className="flex items-center">
                  {typeRapport === 'journalier' && <Clock size={18} className="mr-2 text-indigo-500" />}
                  {typeRapport === 'hebdomadaire' && <Calendar size={18} className="mr-2 text-indigo-500" />}
                  {typeRapport === 'mensuel' && <FileText size={18} className="mr-2 text-indigo-500" />}
                  {choixTypeRapport[typeRapport]}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {montrerListeTypes && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {Object.entries(choixTypeRapport).map(([key, value]) => (
                      <button
                        key={key}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                        onClick={() => {
                          setTypeRapport(key);
                          setMontrerListeTypes(false);
                        }}
                      >
                        {key === 'journalier' && <Clock size={18} className="mr-2 text-indigo-500" />}
                        {key === 'hebdomadaire' && <Calendar size={18} className="mr-2 text-indigo-500" />}
                        {key === 'mensuel' && <FileText size={18} className="mr-2 text-indigo-500" />}
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">Titre du rapport</label>
            <input
              type="text"
              id="titre"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Écrivez le titre de votre rapport"
              value={titreRapport}
              onChange={(e) => setTitreRapport(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date du rapport</label>
            <input
              type="date"
              id="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={dateRapport}
              onChange={(e) => setDateRapport(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Champs à ajouter</label>
              <button
                type="button"
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                onClick={ajouterChamp}
              >
                <Plus size={16} className="mr-1" />
                Ajouter un champ
              </button>
            </div>
            
            {champsPersonnalises.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <p className="text-gray-500 text-sm">Aucun champ ajouté</p>
              </div>
            ) : (
              <div className="space-y-3">
                {champsPersonnalises.map((champ, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-2 text-sm"
                        placeholder="Nom du champ"
                        value={champ.nom}
                        onChange={(e) => changerNomChamp(index, e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                        placeholder="Valeur du champ"
                        value={champ.valeur}
                        onChange={(e) => changerValeurChamp(index, e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="mt-2 p-1 text-red-500 hover:text-red-700"
                      onClick={() => supprimerChamp(index)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="texte" className="block text-sm font-medium text-gray-700 mb-2">Texte du rapport</label>
            <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex gap-2">
                {['gras', 'italique', 'souligne'].map(style => (
                  <button
                    key={style}
                    className="p-1 hover:bg-gray-200 rounded"
                    onClick={() => {
                    }}
                  >
                    <span className={style === 'gras' ? 'font-bold' : style === 'italique' ? 'italic' : 'underline'}>
                      {style.charAt(0).toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                id="texte"
                ref={zoneTexteRef}
                className="w-full px-4 py-3 border-none focus:ring-0 h-64"
                placeholder="Écrivez le texte de votre rapport ici..."
                value={texteRapport}
                onChange={(e) => setTexteRapport(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Aperçu du rapport</h2>
            <div ref={zoneRapportRef} className="border border-gray-200 rounded-lg p-6 bg-white shadow">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {titreRapport || "Titre du rapport"}
                  </h3>
                  <div className="flex items-center text-gray-500 mt-2">
                    <Calendar size={16} className="mr-1" />
                    <span>{dateRapport || "Pas de date"}</span>
                    <span className="mx-2">•</span>
                    <span>{choixTypeRapport[typeRapport]}</span>
                  </div>
                </div>
                <div className="w-24 h-12 flex items-center justify-center">
                  <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              
              {champsPersonnalises.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {champsPersonnalises.map((champ, index) => (
                      <div key={index} className="border-b border-gray-100 pb-2">
                        <p className="text-sm font-medium text-gray-500">{champ.nom}</p>
                        <p className="text-gray-800">{champ.valeur || "-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="whitespace-pre-wrap">
                {texteRapport || "Le texte du rapport sera ici..."}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={telechargerPDF}
              disabled={enCreation}
              className={`flex items-center ${enCreation ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium py-3 px-6 rounded-lg shadow transition-colors`}
            >
              {enCreation ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Télécharger en PDF
                </>
              )}
            </button>
          </div>
          
          {telechargementReussi && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md text-center">
              Rapport bien téléchargé !
            </div>
          )}
        </div>
      </div>
    </div>
  );
}