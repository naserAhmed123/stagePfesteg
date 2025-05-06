import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Download, FileText, ChevronDown, Plus, Trash2, WifiOff, AlertTriangle, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    carteIdentite: '',
    role: '',
    motDePasse: '',
    con: '',
    confirmMotDePasse: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function parseJwt(token) {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      toast.error('Problème avec votre session. Veuillez vous reconnecter.', {
        position: 'top-right',
        autoClose: 5000,
      });
      return null;
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Aucun token trouvé');
        }

        const decoded = parseJwt(token);
        if (!decoded) {
          throw new Error('Token JWT invalide ou mal formé');
        }

        const email = decoded.email || decoded.sub;
        if (!email) {
          throw new Error('Aucun email ou sujet trouvé dans le JWT');
        }

        const response = await fetch(`http://localhost:8080/api/utilisateur/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération de l'utilisateur: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        setUser(userData);
        setFormData({
          nom: userData.nom || '',
          carteIdentite: userData.carteIdentite || '',
          role: userData.role || '',
          motDePasse: '',
          con: userData.con || '',
          confirmMotDePasse: ''
        });
        toast.success('Données utilisateur chargées avec succès', {
          position: 'top-right',
          autoClose: 3000,
        });
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        setError(err.message);
        toast.error(`Erreur: ${err.message}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fonction pour simuler la création d'un PDF
  const simulerCreationPDF = () => {
    return {
      creerPDF: (element) => {
        return new Promise((resolve, reject) => {
          try {
            // Simulation de succès après un délai
            setTimeout(() => resolve('data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago...'), 500);
          } catch (error) {
            reject(error);
          }
        });
      }
    };
  };

  // Ajouter un nouveau champ personnalisé
  const ajouterChamp = () => {
    try {
      setChampsPersonnalises([...champsPersonnalises, { nom: 'Nouveau champ', valeur: '' }]);
      toast.info('Nouveau champ ajouté', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un champ:', error);
      toast.error('Impossible d\'ajouter un nouveau champ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Supprimer un champ personnalisé
  const supprimerChamp = (index) => {
    try {
      const nouveauxChamps = [...champsPersonnalises];
      nouveauxChamps.splice(index, 1);
      setChampsPersonnalises(nouveauxChamps);
      toast.info('Champ supprimé', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression d\'un champ:', error);
      toast.error('Impossible de supprimer le champ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Changer le nom d'un champ
  const changerNomChamp = (index, nouveauNom) => {
    try {
      const nouveauxChamps = [...champsPersonnalises];
      nouveauxChamps[index].nom = nouveauNom;
      setChampsPersonnalises(nouveauxChamps);
    } catch (error) {
      console.error('Erreur lors du changement de nom d\'un champ:', error);
      toast.error('Impossible de modifier le nom du champ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Changer la valeur d'un champ
  const changerValeurChamp = (index, nouvelleValeur) => {
    try {
      const nouveauxChamps = [...champsPersonnalises];
      nouveauxChamps[index].valeur = nouvelleValeur;
      setChampsPersonnalises(nouveauxChamps);
    } catch (error) {
      console.error('Erreur lors du changement de valeur d\'un champ:', error);
      toast.error('Impossible de modifier la valeur du champ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Fonction pour générer une chaîne aléatoire
  function generateRandomId() {
    return Math.random().toString(36).substr(2, 9); // Génère une chaîne aléatoire de 9 caractères
  }

  // Fonction pour valider les champs du formulaire
  const validateForm = () => {
    if (!titreRapport.trim()) {
      toast.warning('Veuillez saisir un titre pour le rapport', {
        position: 'top-right',
        autoClose: 4000,
      });
      return false;
    }
    
    if (!dateRapport) {
      toast.warning('Veuillez sélectionner une date pour le rapport', {
        position: 'top-right',
        autoClose: 4000,
      });
      return false;
    }
    
    if (!texteRapport.trim()) {
      toast.warning('Le contenu du rapport ne peut pas être vide', {
        position: 'top-right',
        autoClose: 4000,
      });
      return false;
    }
    
    if (!user) {
      toast.error('Informations utilisateur manquantes. Veuillez vous reconnecter.', {
        position: 'top-right',
        autoClose: 4000,
      });
      return false;
    }
    
    return true;
  };

  // Fonction pour sauvegarder le rapport dans le backend
  const saveReportToBackend = async ({ titreRapport, texteRapport, typeRapport, dateRapport, user }) => {
    try {
      const rapportData = {
        referenceRapport: `R-${dateRapport ? new Date(dateRapport).toLocaleDateString('en-CA').replace(/[^0-9]/g, '') : new Date().toISOString().split('T')[0].replace(/[^0-9]/g, '')}-${generateRandomId()}-${user.id}`,
        titreRapport,
        Cont: texteRapport,
        typeRapport: typeRapport.toUpperCase(),
        dateRapport: dateRapport ? new Date(dateRapport).toISOString() : new Date().toISOString(),
        serviceInterventionId: user.id
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token dauthentification manquant');
      }

      // Vérifier la connexion réseau avant d'envoyer la requête
      if (!navigator.onLine) {
        throw new Error('Pas de connexion internet. Impossible de sauvegarder le rapport.');
      }

      const response = await axios.post('http://localhost:8080/api/rapports', rapportData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000, // Délai d'expiration de 15 secondes
      });

      console.log('Report saved:', response.data);
      toast.success('Rapport enregistré avec succès dans la base de données', {
        position: 'top-right',
        autoClose: 3000,
      });
      return response.data;
    } catch (error) {
      console.error('Error saving report:', error);
      let errorMessage = 'Échec de lenregistrement du rapport sur le backend.';
      
      if (error.code === 'ECONNABORTED') {
        // Erreur de délai d'attente
        errorMessage = 'La connexion au serveur a pris trop de temps. Veuillez réessayer ultérieurement.';
      } else if (error.response) {
        // Erreur de réponse du serveur
        errorMessage = `Erreur serveur: ${error.response.status} - ${error.response.data.message || error.response.statusText}`;
        
        // Messages spécifiques selon le code d'erreur
        if (error.response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.response.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour créer ce rapport.';
        } else if (error.response.status === 500) {
          errorMessage = 'Erreur interne du serveur. Veuillez contacter l\'administrateur.';
        }
      } else if (error.request) {
        // Pas de réponse reçue après la requête
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet et réessayez.';
      } else if (!navigator.onLine || error.message.includes('internet') || error.message.includes('connexion')) {
        errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.';
      }
      
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
      throw new Error(errorMessage);
    }
  };

  // Vérifier l'état de la connexion réseau
  const verifierConnexionReseau = () => {
    return navigator.onLine;
  };

  // Créer et télécharger le PDF
  const telechargerPDF = async () => {
    // Vérifier d'abord la connexion réseau
    if (!verifierConnexionReseau()) {
      toast.error('Impossible de télécharger - Problème de réseau. Vérifiez votre connexion internet et réessayez.', {
        position: 'top-right',
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (!zoneRapportRef.current || !user) {
      toast.error('Impossible de générer le rapport. Veuillez réessayer.', {
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }

    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    const outilPDF = simulerCreationPDF();

    try {
      setEnCreation(true);
      toast.info('Création du rapport en cours...', {
        position: 'top-right',
        autoClose: 2000,
      });

      // Essayer de sauvegarder au backend avec gestion des délais d'attente
      try {
        // Définir un délai maximum pour la requête
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Délai d\'attente dépassé lors de la connexion au serveur')), 10000)
        );
        
        // Faire la requête avec un délai d'expiration
        await Promise.race([
          saveReportToBackend({
            titreRapport,
            texteRapport,
            typeRapport,
            dateRapport,
            user
          }),
          timeoutPromise
        ]);
      } catch (networkError) {
        console.error('Network error during save:', networkError);
        
        // Offrir une option pour continuer juste avec le téléchargement local
        if (window.confirm('Problème de connexion au serveur. Voulez-vous continuer avec le téléchargement local du PDF sans sauvegarde en base de données?')) {
          // Continuer avec juste la génération du PDF
        } else {
          // Abandonner l'opération complète
          throw new Error('Opération annulée par l\'utilisateur suite au problème réseau');
        }
      }

      // Generate PDF
      const donneesPDF = await outilPDF.creerPDF(zoneRapportRef.current);

      const lien = document.createElement('a');
      const nomFichier = `${titreRapport || 'Rapport'}_${typeRapport}_${dateRapport || 'sans-date'}.pdf`;
      lien.href = donneesPDF;
      lien.download = nomFichier;
      
      try {
        lien.click();
        
        // Clear form fields
        setTitreRapport('');
        setDateRapport('');
        setTexteRapport('');
        setChampsPersonnalises([]);
        setTypeRapport('journalier');

        setTelechargementReussi(true);
        toast.success(`Rapport ${nomFichier} téléchargé avec succès!`, {
          position: 'top-right',
          autoClose: 4000,
        });
        setTimeout(() => setTelechargementReussi(false), 3000);
      } catch (downloadError) {
        console.error('Error during file download:', downloadError);
        toast.error('Échec du téléchargement du fichier. Votre navigateur a peut-être bloqué l\'opération.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Error during PDF creation or saving:', error);
      
      // Messages d'erreur personnalisés selon le type de problème
      if (error.message.includes('réseau') || error.message.includes('connexion') || 
          error.message.includes('network') || error.message.includes('timeout') || 
          error.message.includes('délai')) {
        toast.error('Problème de réseau détecté. Vérifiez votre connexion internet et réessayez.', {
          position: 'top-right',
          autoClose: 6000,
        });
      } else {
        toast.error(`Problème lors de la création du PDF: ${error.message}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } finally {
      setEnCreation(false);
    }
  };

  // Liste des types de rapport
  const choixTypeRapport = {
    journalier: 'Rapport du jour',
    hebdomadaire: 'Rapport de la semaine',
    mensuel: 'Rapport du mois'
  };

  // Gestionnaire pour changement de type de rapport
  const handleTypeRapportChange = (key) => {
    try {
      setTypeRapport(key);
      setMontrerListeTypes(false);
      toast.info(`Type de rapport changé pour: ${choixTypeRapport[key]}`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erreur lors du changement de type de rapport:', error);
      toast.error('Impossible de changer le type de rapport', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // État pour suivre la connectivité réseau
  const [estConnecte, setEstConnecte] = useState(navigator.onLine);
  
  // Surveiller l'état de la connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      setEstConnecte(true);
      toast.success('Connexion internet rétablie!', {
        position: 'top-right',
        autoClose: 3000,
      });
    };
    
    const handleOffline = () => {
      setEstConnecte(false);
      toast.error('Connexion internet perdue!', {
        position: 'top-right',
        autoClose: false, // Reste affiché jusqu'à ce que la connexion soit rétablie
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Essayer de reconnecter
  const testerConnexion = () => {
    // Simuler un test de connexion en essayant de charger une petite ressource
    fetch('https://www.google.com/favicon.ico', { 
      mode: 'no-cors',
      cache: 'no-cache'
    })
      .then(() => {
        if (!navigator.onLine) {
          // Le navigateur pense qu'il est hors ligne mais nous avons réussi à nous connecter
          window.dispatchEvent(new Event('online'));
        } else {
          toast.success('La connexion au réseau fonctionne correctement!', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      })
      .catch(() => {
        toast.error('Toujours pas de connexion internet. Veuillez vérifier votre réseau.', {
          position: 'top-right',
          autoClose: 5000,
        });
      });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {!estConnecte && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 z-50 flex items-center justify-center">
          <WifiOff size={16} className="mr-2" />
          <span>Pas de connexion internet - L'application pourrait ne pas fonctionner correctement</span>
          <button 
            onClick={testerConnexion}
            className="ml-4 bg-white text-red-500 px-2 py-1 rounded text-sm flex items-center"
          >
            <RefreshCcw size={14} className="mr-1" /> Tester la connexion
          </button>
        </div>
      )}
      
      {loading && <div className="text-center">Chargement...</div>}
      {error && <div className="text-center text-red-500 flex items-center justify-center">
        <AlertTriangle size={20} className="mr-2" />
        <span>Erreur: {error}</span>
      </div>}
      
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
                        onClick={() => handleTypeRapportChange(key)}
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
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">Titre du rapport <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="titre"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Écrivez le titre de votre rapport"
              value={titreRapport}
              onChange={(e) => setTitreRapport(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date du rapport <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={dateRapport}
              onChange={(e) => setDateRapport(e.target.value)}
              required
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
            <label htmlFor="texte" className="block text-sm font-medium text-gray-700 mb-2">Texte du rapport <span className="text-red-500">*</span></label>
            <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex gap-2">
                {['gras', 'italique', 'souligne'].map((style) => (
                  <button
                    key={style}
                    className="p-1 hover:bg-gray-200 rounded"
                    onClick={() => {
                      // Placeholder for text formatting (not implemented)
                      toast.info(`Fonctionnalité de formatage "${style}" non implémentée`, {
                        position: 'top-right',
                        autoClose: 2000,
                      });
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
                required
              />
            </div>
          </div>

          <div className="mt-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Aperçu du rapport</h2>
            <div ref={zoneRapportRef} className="border border-gray-200 rounded-lg p-6 bg-white shadow">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{titreRapport || 'Titre du rapport'}</h3>
                  <div className="flex items-center text-gray-500 mt-2">
                    <Calendar size={16} className="mr-1" />
                    <span>{dateRapport || 'Pas de date'}</span>
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
                        <p className="text-gray-800">{champ.valeur || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="whitespace-pre-wrap">{texteRapport || 'Le texte du rapport sera ici...'}</div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={telechargerPDF}
              disabled={enCreation || loading}
              className={`flex items-center ${
                enCreation || loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white font-medium py-3 px-6 rounded-lg shadow transition-colors`}
            >
              {enCreation ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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