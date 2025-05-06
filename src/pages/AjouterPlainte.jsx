import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const parseJwt = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      alert('Problème avec votre session. Veuillez vous reconnecter.');
      return null;
    }
  };
  
  const verifierConnexionReseau = () => {
    return navigator.onLine;
  };
  
  const PlainteForm = () => {
    const [formData, setFormData] = useState({
      referenceRec: '',
      etatRef: '',
      numClient: '',
      nomClient: '',
      reclamationId: '',
      datePlainte: new Date().toISOString().slice(0, 16), // Format YYYY-MM-DDThh:mm
      description: '' // Nouveau champ pour le textarea
    });
    const [reclamations, setReclamations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({
      id: '',
      nom: '',
      carteIdentite: '',
      role: '',
      motDePasse: '',
      con: '',
      confirmMotDePasse: '',
    });
  
    // Fetch user data
    useEffect(() => {
      const fetchUser = async () => {
        if (!verifierConnexionReseau()) {
          setError('Aucune connexion réseau détectée');
          alert('Veuillez vérifier votre connexion Internet');
          return;
        }
  
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
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (!response.ok) {
            throw new Error(`Échec de la récupération de l'utilisateur: ${response.status} ${response.statusText}`);
          }
  
          const fetchedUser = await response.json();
          setUser(fetchedUser);
          setUserData({
            id: fetchedUser.id || '',
            nom: fetchedUser.nom || '',
            carteIdentite: fetchedUser.carteIdentite || '',
            role: fetchedUser.role || '',
            motDePasse: '',
            con: fetchedUser.con || '',
            confirmMotDePasse: '',
          });
          alert('Données utilisateur chargées avec succès');
        } catch (err) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', err);
          setError(err.message);
          alert(`Erreur: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
  
      fetchUser();
    }, []);
  
    // Fetch reclamations
    useEffect(() => {
      if (!userData.id) return;
  
      const fetchReclamations = async () => {
        if (!verifierConnexionReseau()) {
          alert('Veuillez vérifier votre connexion Internet');
          return;
        }
  
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `http://localhost:8080/reclamations/reclamations/citoyen/${userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Filtrer les réclamations qui ne sont pas finalisées/clôturées si nécessaire
          // Exemple: Ne montrer que les réclamations en attente ou en cours
          const filteredReclamations = data.filter(rec => 
            rec.etat !== 'CLOTURE' && rec.etat !== 'RESOLUE'
          );
          
          setReclamations(filteredReclamations);
        } catch (error) {
          alert('Erreur lors du chargement des réclamations');
          console.error(error);
        }
      };
  
      fetchReclamations();
    }, [userData.id]);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Si le champ modifié est reclamationId, remplir automatiquement les autres champs
      if (name === 'reclamationId' && value) {
        const selectedReclamation = reclamations.find(rec => rec.id.toString() === value);
        if (selectedReclamation) {
          setFormData(prev => ({
            ...prev,
            referenceRec: selectedReclamation.reference?.toString() || '',
            etatRef: selectedReclamation.etat || '',
            numClient: selectedReclamation.numClient || '',
            // Utiliser le nom du citoyen associé à la réclamation ou celui de l'utilisateur courant
            nomClient: user?.nom || '',
          }));
          alert('Informations de la réclamation chargées');
        }
      }
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      setIsModalOpen(true);
    };
  
    const confirmSubmit = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Préparation des données pour correspondre à l'entité Plainte du backend
        const plainteData = {
          referenceRec: formData.referenceRec,
          etatRef: formData.etatRef,
          datePlainte: new Date().toISOString(), // Format ISO pour LocalDateTime
          numClient: parseInt(formData.numClient),
          nomClient: formData.nomClient,
          Descrip: formData.description, // Nouveau champ description
          citoyenId:  userData.id , // Relation avec l'entité Citoyen
          reclamationId: parseInt(formData.reclamationId) // Relation avec l'entité Reclamation
        };
        console.log(plainteData)
        const response = await fetch('http://localhost:8080/api/plaintes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(plainteData)
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        alert('Plainte soumise avec succès !');
        setFormData({
          referenceRec: '',
          etatRef: '',
          numClient: '',
          nomClient: '',
          reclamationId: '',
          datePlainte: new Date().toISOString().slice(0, 16),
          description: ''
        });
      } catch (error) {
        alert(`Erreur lors de la soumission: ${error.message}`);
        console.error('Erreur de soumission:', error);
      }
      
      setIsModalOpen(false);
    };
  
    const closeModal = () => {
      setIsModalOpen(false);
    };
  
    if (loading) {
      return (
        <div className="min-h-screen bg-whitesmoke dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
          <p className="text-gray-800 dark:text-gray-100">Chargement...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="min-h-screen bg-whitesmoke dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
          <p className="text-red-600 dark:text-red-400">Erreur: {error}</p>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-whitesmoke dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            Formulaire de Plainte
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sélecteur de réclamation en haut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sélectionner une Réclamation
              </label>
              <select
                name="reclamationId"
                value={formData.reclamationId}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
                required
              >
                <option value="">Choisir une réclamation</option>
                {reclamations.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {`Réf: ${rec.reference || 'N/A'} - Type: ${rec.typePanne || 'N/A'}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Référence Réclamation
              </label>
              <input
                type="text"
                name="referenceRec"
                value={formData.referenceRec}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
                readOnly
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Référence automatiquement chargée depuis la réclamation sélectionnée
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                État Actuel
              </label>
              <input
                type="text"
                name="etatRef"
                value={formData.etatRef}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
                readOnly
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                État actuel de la réclamation
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Numéro Client
              </label>
              <input
                type="number"
                name="numClient"
                value={formData.numClient}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tu peux le changer si nécessaire
              </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom Client
              </label>
              <input
                type="text"
                name="nomClient"
                value={formData.nomClient}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
                required
              />
            </div>
            
            {/* Nouveau champ textarea pour la description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description de la Plainte
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition h-32 resize-y"
                placeholder="Veuillez décrire votre plainte en détail..."
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fournissez tous les détails pertinents concernant votre plainte
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date de la Plainte
              </label>
              <input
                type="datetime-local"
                name="datePlainte"
                value={formData.datePlainte}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition duration-300"
            >
              Soumettre la Plainte
            </button>
          </form>
        </div>
  
        {/* Modal de confirmation */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Confirmer la soumission
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Êtes-vous sûr de vouloir soumettre cette plainte ?
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default PlainteForm;