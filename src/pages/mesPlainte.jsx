import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaFileAlt, FaCalendar, FaUser, FaHashtag, FaCheckCircle, FaClipboardList, FaSearch, FaChevronDown, FaUndo, FaExclamationCircle, FaPlus, FaDownload, FaCalendarAlt, FaAlignLeft, FaPrint, FaTimes, FaIdCard } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Load API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const PlaintesDashboard = () => {
  const navigate = useNavigate();
  const [plaintes, setPlaintes] = useState([]);
  const [filteredPlaintes, setFilteredPlaintes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState({
    referenceRec: '',
    etatRef: '',
    nomClient: '',
    dateDebut: '',
  });
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [userData, setUserData] = useState({
    id: '',
    nom: '',
    carteIdentite: '',
    role: '',
    motDePasse: '',
    con: '',
    confirmMotDePasse: '',
  });

  // Parse JWT token
  const parseJwt = useCallback((token) => {
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
      toast.error('Problème avec votre session. Veuillez vous reconnecter.', {
        position: 'top-right',
        autoClose: 5000,
      });
      return null;
    }
  }, []);

  // Fetch user data
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

        const response = await fetch(`${API_URL}/api/utilisateur/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération de l'utilisateur: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        setUserData({
          id: userData.id || '',
          nom: userData.nom || '',
          carteIdentite: userData.carteIdentite || '',
          role: userData.role || '',
          motDePasse: '',
          con: userData.con || '',
          confirmMotDePasse: '',
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
  }, [parseJwt]);

  // Fetch complaints
  useEffect(() => {
    const fetchPlaintes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Aucun token trouvé');
        }

        if (!userData.id) {
          return; e
        }

        const response = await fetch(`${API_URL}/api/plaintes/citoyen/${userData.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération des plaintes: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setPlaintes(data);
        setFilteredPlaintes(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des plaintes:', error);
        setError(error.message);
        toast.error(`Erreur: ${error.message}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlaintes();
  }, [userData.id]);

  // Handle search
  const handleSearch = useCallback(() => {
    const filtered = plaintes.filter((plainte) => {
      const matchesReference = plainte.referenceRec
        .toLowerCase()
        .includes(searchCriteria.referenceRec.toLowerCase());
      const matchesEtat = plainte.etatRef
        .toLowerCase()
        .includes(searchCriteria.etatRef.toLowerCase());
      const matchesNom = plainte.nomClient
        .toLowerCase()
        .includes(searchCriteria.nomClient.toLowerCase());
      const matchesDate = searchCriteria.dateDebut
        ? new Date(plainte.datePlainte).toISOString().split('T')[0] === searchCriteria.dateDebut
        : true;
      return matchesReference && matchesEtat && matchesNom && matchesDate;
    });
    setFilteredPlaintes(filtered);
  }, [plaintes, searchCriteria]);

  // Reset search criteria
  const resetSearchCriteria = () => {
    setSearchCriteria({
      referenceRec: '',
      etatRef: '',
      nomClient: '',
      dateDebut: '',
    });
    setFilteredPlaintes(plaintes);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria((prev) => ({ ...prev, [name]: value }));
  };

  // Open/close popup
  const openPopup = (plainte) => {
    setSelectedPlainte(plainte);
  };

  const closePopup = () => {
    setSelectedPlainte(null);
  };

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      {loading && <div className="text-center">Chargement...</div>}
      {error && <div className="text-red-600 text-center">{error}</div>}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <FaClipboardList className="mr-3 text-blue-600 dark:text-blue-400" />
              Gestion des Plaintes
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Consultez et gérez toutes vos plaintes
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center"
            >
              <FaDownload className="mr-2" />
              Exporter
            </button>
            <button
              onClick={() => navigate('/ajouterPlainte')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center"
            >
              <FaPlus className="mr-2" />
              Nouvelle Plainte
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <FaSearch className="text-blue-500 mr-3" />
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Recherche avancée</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Reference Input */}
            <div className="space-y-2">
              <label htmlFor="referenceRec" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Référence
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFileAlt className="text-gray-400" size={14} />
                </div>
                <input
                  type="text"
                  id="referenceRec"
                  name="referenceRec"
                  placeholder="Rechercher par référence"
                  value={searchCriteria.referenceRec}
                  onChange={handleInputChange}
                  className="p-2.5 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            {/* Status Dropdown */}
            <div className="space-y-2">
              <label htmlFor="etatRef" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                État
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCheckCircle className="text-gray-400" size={14} />
                </div>
                <select
                  id="etatRef"
                  name="etatRef"
                  value={searchCriteria.etatRef}
                  onChange={handleInputChange}
                  className="p-2.5 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
                >
                  <option value="">Tous les états</option>
                  <option value="Traitée">Traitée</option>
                  <option value="En attente">En attente</option>
                  <option value="Nouvelle">Nouvelle</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaChevronDown className="text-gray-400" size={14} />
                </div>
              </div>
            </div>
            {/* Client Name Input */}
            <div className="space-y-2">
              <label htmlFor="nomClient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Client
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" size={14} />
                </div>
                <input
                  type="text"
                  id="nomClient"
                  name="nomClient"
                  placeholder="Rechercher par nom du client"
                  value={searchCriteria.nomClient}
                  onChange={handleInputChange}
                  className="p-2.5 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          {/* Date Range Picker */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date de plainte
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" size={14} />
                </div>
                <input
                  type="date"
                  id="dateDebut"
                  name="dateDebut"
                  value={searchCriteria.dateDebut}
                  onChange={handleInputChange}
                  className="p-2.5 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={resetSearchCriteria}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <FaUndo className="mr-2" />
              Réinitialiser
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
            >
              <FaSearch className="mr-2" />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="overflow-hidden shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Table Header */}
        <div className="hidden md:block">
          <div className="bg-blue-200 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center">
                  <FaFileAlt className="mr-2 text-blue-500" /> Référence
                </h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center">
                  <FaCheckCircle className="mr-2 text-green-500" /> État
                </h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center">
                  <FaCalendarAlt className="mr-2 text-purple-500" /> Date
                </h3>
              </div>
              <div className="col-span-4">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center">
                  <FaUser className="mr-2 text-orange-500" /> Client
                </h3>
              </div>
              <div className="col-span-1">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">
                  Actions
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {filteredPlaintes.map((plainte) => (
            <div
              key={plainte.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out group"
            >
              {/* Desktop view */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 items-center">
                <div className="col-span-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {plainte.referenceRec}
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plainte.etatRef === 'Traitée'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : plainte.etatRef === 'En attente'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 mr-1.5 rounded-full ${
                        plainte.etatRef === 'Traitée'
                          ? 'bg-green-500'
                          : plainte.etatRef === 'En attente'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    ></span>
                    {plainte.etatRef}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-purple-500 mr-1.5" size={12} />
                    {plainte.datePlainte
                      ? new Date(plainte.datePlainte).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="col-span-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 mr-3 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                      {plainte.nomClient.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{plainte.nomClient}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Client #{plainte.numClient || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => openPopup(plainte)}
                    className="inline-flex items-center p-1.5 rounded-full text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 transition-colors duration-150 group-hover:shadow-md"
                    aria-label="Voir détails"
                  >
                    <FaEye size={16} />
                  </button>
                </div>
              </div>

              {/* Mobile view */}
              <div className="md:hidden p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center">
                      <FaFileAlt className="mr-1.5" size={12} />
                      {plainte.referenceRec}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plainte.etatRef === 'Traitée'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : plainte.etatRef === 'En attente'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 mr-1.5 rounded-full ${
                        plainte.etatRef === 'Traitée'
                          ? 'bg-green-500'
                          : plainte.etatRef === 'En attente'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    ></span>
                    {plainte.etatRef}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <FaCalendarAlt className="mr-1.5 text-purple-500" size={12} />
                    {plainte.datePlainte
                      ? new Date(plainte.datePlainte).toLocaleDateString()
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <FaUser className="mr-1.5 text-orange-500" size={12} />
                    {plainte.nomClient}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => openPopup(plainte)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150 shadow-sm"
                  >
                    <FaEye className="mr-1.5" size={14} />
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredPlaintes.length === 0 && (
          <div className="py-8 text-center bg-white dark:bg-gray-800">
            <FaExclamationCircle className="mx-auto text-gray-400 dark:text-gray-500 text-3xl mb-3" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Aucune plainte trouvée
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aucun résultat ne correspond à vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Popup */}
      <AnimatePresence>
        {selectedPlainte && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden dark:border-gray-700"
            >
              {/* Header */}
              <div className="bg-blue-600 p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <FaFileAlt className="mr-3" />
                    Détails de la Plainte
                  </h2>
                  <button
                    onClick={closePopup}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                    aria-label="Fermer"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
                <div className="mt-2 bg-white bg-opacity-20 rounded-lg px-4 py-2 text-white flex items-center">
                  <FaHashtag className="mr-2" />
                  <p className="font-medium">ID: {selectedPlainte.id}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reference */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
                      <FaFileAlt className="mr-2" />
                      <h3 className="font-semibold">Référence</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{selectedPlainte.referenceRec}</p>
                  </div>
                  {/* Status */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center text-green-600 dark:text-green-400 mb-2">
                      <FaCheckCircle className="mr-2" />
                      <h3 className="font-semibold">État</h3>
                    </div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        selectedPlainte.etatRef === 'Traitée'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : selectedPlainte.etatRef === 'En attente'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 bg-${
                          selectedPlainte.etatRef === 'Traitée'
                            ? 'green'
                            : selectedPlainte.etatRef === 'En attente'
                            ? 'yellow'
                            : 'blue'
                        }-500 rounded-full mr-2`}
                      ></span>
                      {selectedPlainte.etatRef}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center text-purple-600 dark:text-purple-400 mb-2">
                      <FaCalendarAlt className="mr-2" />
                      <h3 className="font-semibold">Date de soumission</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPlainte.datePlainte
                        ? `${new Date(selectedPlainte.datePlainte).toLocaleDateString()} à ${new Date(
                            selectedPlainte.datePlainte
                          ).toLocaleTimeString()}`
                        : 'N/A'}
                    </p>
                  </div>
                  {/* Client */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center text-orange-600 dark:text-orange-400 mb-2">
                      <FaUser className="mr-2" />
                      <h3 className="font-semibold">Client</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-1">
                      <span className="font-medium">Nom:</span> {selectedPlainte.nomClient}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">N°:</span> {selectedPlainte.numClient || 'N/A'}
                    </p>
                  </div>
                </div>
                {/* IDs */}
                <div className="mt-5 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center text-gray-700 dark:text-gray-300 mb-3">
                    <FaIdCard className="mr-2 text-indigo-500" />
                    <h3 className="font-semibold">Identifiants associés</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-24">Citoyen ID:</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                        {selectedPlainte.citoyenId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-24">Réclamation:</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                        {selectedPlainte.reclamationId || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div className="mt-5 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center text-gray-700 dark:text-gray-300 mb-3">
                    <FaAlignLeft className="mr-2 text-indigo-500" />
                    <h3 className="font-semibold">Description</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap border-l-4 border-gray-200 dark:border-gray-600 pl-3">
                    {selectedPlainte.descrip || 'Aucune description fournie'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={closePopup}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center"
                >
                  <FaTimes className="mr-2" />
                  <span>Fermer</span>
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                >
                  <FaPrint className="mr-2" />
                  <span>Imprimer</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaintesDashboard;