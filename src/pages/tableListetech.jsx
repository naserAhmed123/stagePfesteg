import React, { useState, useEffect, useRef } from 'react';
import { Edit, Eye, MoreVertical, X, ChevronDown, Search, ChevronLeft, ChevronRight, LogOut, UserCheck, UserX, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function TableListService() {
  const [techniciens, setTechniciens] = useState([]);
  const [afficherActionsTechnicien, setAfficherActionsTechnicien] = useState(null);
  const [technicienSelectionne, setTechnicienSelectionne] = useState(null);
  const [technicienEnModification, setTechnicienEnModification] = useState(null);
  const [mode, setMode] = useState(null); // 'voir', 'modifier'
  const [confirmation, setConfirmation] = useState(null); // { id, action, nom }
  const [filtreCon, setFiltreCon] = useState('Tous');
  const [filtreTravail, setFiltreTravail] = useState('Tous');
  const [chargement, setChargement] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [itemsParPage] = useState(5);
  const toastAfficheRef = useRef(false);

  const URL_API = 'http://localhost:8080/api/technicien';

  useEffect(() => {
    fetchServices();
    return () => {
      console.log('Démontage de TableListService');
      toastAfficheRef.current = false;
    };
  }, []);

  const fetchServices = async () => {
    setChargement(true);
    try {
      const token = localStorage.getItem('token');
      const reponse = await axios.get(`${URL_API}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const techniciensUniques = reponse.data.filter(
        (technicien, index, self) => self.findIndex(t => t.id === technicien.id) === index
      );
      setTechniciens(techniciensUniques);
      if (!toastAfficheRef.current) {
        toast.success('Liste des techniciens chargée avec succès');
        toastAfficheRef.current = true;
      }
    } catch (erreur) {
      console.error('Erreur lors du chargement des techniciens:', erreur);
      toast.error('Erreur lors du chargement des techniciens');
      if (erreur.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setChargement(false);
    }
  };

  const handleServiceActionClick = (technicienId) => {
    setAfficherActionsTechnicien(prev => (prev === technicienId ? null : technicienId));
  };

  const handleEditService = (technicien) => {
    setTechnicienEnModification({ ...technicien });
    setMode('modifier');
    setAfficherActionsTechnicien(null);
  };

  const handleViewService = (technicien) => {
    setTechnicienSelectionne(technicien);
    setMode('voir');
    setAfficherActionsTechnicien(null);
  };

  const handleUpdateService = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${URL_API}/update/${technicienEnModification.id}`, technicienEnModification, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechniciens(techniciens.map(technicien =>
        technicien.id === technicienEnModification.id ? technicienEnModification : technicien
      ));
      setMode(null);
      setTechnicienEnModification(null);
      toast.success('Technicien mis à jour avec succès !');
    } catch (erreur) {
      console.error('Erreur lors de la mise à jour du technicien:', erreur);
      toast.error('Erreur lors de la mise à jour du technicien');
      if (erreur.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const gererAction = async () => {
    if (!confirmation) return;
    const { id, action } = confirmation;
    try {
      const token = localStorage.getItem('token');
      const endpoint = {
        encongier: `${URL_API}/encongier/${id}`,
        retourdecongier: `${URL_API}/retourdecongier/${id}`,
        quitter: `${URL_API}/quitter/${id}`,
        retourner: `${URL_API}/retourner/${id}`,
      }[action];
      const reponse = await axios.put(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechniciens(techniciens.map(technicien =>
        technicien.id === id ? { ...technicien, ...reponse.data } : technicien
      ));
      setConfirmation(null);
      toast.success(`Action "${action === 'quitter' ? 'Quitter le travail' : action}" effectuée avec succès!`);
    } catch (erreur) {
      console.error(`Erreur lors de l'action ${action}:`, erreur);
      toast.error(`Échec de l'action ${action}.`);
      if (erreur.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const ouvrirConfirmation = (id, action, nom) => {
    setConfirmation({ id, action, nom });
    setAfficherActionsTechnicien(null);
  };

  const techniciensFiltres = techniciens.filter(technicien => {
    const correspondRecherche = (
      technicien.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      technicien.email?.toLowerCase().includes(recherche.toLowerCase()) ||
      technicien.carteIdentite?.toString().includes(recherche) ||
      technicien.numTel?.toString().includes(recherche)
    );
    const correspondanceCon = filtreCon === 'Tous' || technicien.con === filtreCon;
    const correspondanceTravail = filtreTravail === 'Tous' || technicien.travail === filtreTravail;
    return correspondRecherche && correspondanceCon && correspondanceTravail;
  });

  const indexDernierItem = pageActuelle * itemsParPage;
  const indexPremierItem = indexDernierItem - itemsParPage;
  const techniciensActuels = techniciensFiltres.slice(indexPremierItem, indexDernierItem);
  const totalPages = Math.ceil(techniciensFiltres.length / itemsParPage) || 1;

  const handleNextPage = () => {
    if (pageActuelle < totalPages) {
      setPageActuelle(pageActuelle + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageActuelle > 1) {
      setPageActuelle(pageActuelle - 1);
    }
  };

  const optionsStatut = ['ACTIF', 'INACTIF'];
  const optionsTravail = ['ENCOURS', 'QUITTER'];

  const getActionConfig = (action) => {
    return {
      encongier: {
        title: 'Mettre en congé',
        message: `Voulez-vous vraiment mettre ${confirmation?.nom} en congé ?`,
        confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
      },
      retourdecongier: {
        title: 'Retour de congé',
        message: `Voulez-vous vraiment marquer ${confirmation?.nom} comme de retour de congé ?`,
        confirmColor: 'bg-green-600 hover:bg-green-700',
      },
      quitter: {
        title: 'Quitter le travail',
        message: `Voulez-vous vraiment marquer ${confirmation?.nom} comme ayant quitté le travail ? Cette action peut être irréversible sans retour.`,
        confirmColor: 'bg-red-600 hover:bg-red-700',
      },
      retourner: {
        title: 'Retourner au travail',
        message: `Voulez-vous vraiment marquer ${confirmation?.nom} comme de retour au travail ?`,
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
      },
    }[action] || {};
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Liste des techniciens</h1>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, email, ID ou téléphone"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-10 pr-4 text-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative w-full md:w-48">
              <select
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-4 pr-10 text-gray-600 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setFiltreCon(e.target.value)}
                value={filtreCon}
              >
                <option value="Tous">Tous (Con)</option>
                {optionsStatut.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <div className="relative w-full md:w-48">
              <select
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-4 pr-10 text-gray-600 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setFiltreTravail(e.target.value)}
                value={filtreTravail}
              >
                <option value="Tous">Tous (Travail)</option>
                {optionsTravail.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-600 dark:text-gray-300">Afficher :</span>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtreCon"
                  checked={filtreCon === 'Tous'}
                  onChange={() => setFiltreCon('Tous')}
                  className="mr-2 text-blue-500 focus:ring-blue-500"
                />
                <span>Tous (Con)</span>
              </label>
              {optionsStatut.map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="filtreCon"
                    checked={filtreCon === option}
                    onChange={() => setFiltreCon(option)}
                    className="mr-2 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtreTravail"
                  checked={filtreTravail === 'Tous'}
                  onChange={() => setFiltreTravail('Tous')}
                  className="mr-2 text-blue-500 focus:ring-blue-500"
                />
                <span>Tous (Travail)</span>
              </label>
              {optionsTravail.map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="filtreTravail"
                    checked={filtreTravail === option}
                    onChange={() => setFiltreTravail(option)}
                    className="mr-2 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-800">
          {chargement ? (
            <div className="text-center py-4">
              <svg className="animate-spin h-5 w-5 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-200 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Carte d'identité
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Con
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Travail
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-300 dark:divide-gray-700">
                {techniciensActuels.map(technicien => (
                  <tr key={technicien.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{technicien.nom}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{technicien.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{technicien.carteIdentite}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{technicien.numTel}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        technicien.con === 'ACTIF' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        <span className={`mr-1 mt-[6px] h-2 w-2 rounded-full ${
                          technicien.con === 'ACTIF' ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {technicien.con}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        technicien.travail === 'ENCOURS' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        <span className={`mr-1 mt-[6px] h-2 w-2 rounded-full ${
                          technicien.travail === 'ENCOURS' ? 'bg-blue-400' : 'bg-gray-400'
                        }`}></span>
                        {technicien.travail}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 relative">
                      <button
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none"
                        onClick={() => handleServiceActionClick(technicien.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {afficherActionsTechnicien === technicien.id && (
                        <div className="absolute right-8 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-10">
                          <button
                            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-md"
                            onClick={() => handleEditService(technicien)}
                          >
                            <Edit size={16} /> Modifier
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => handleViewService(technicien)}
                          >
                            <Eye size={16} /> Voir
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => ouvrirConfirmation(technicien.id, 'encongier', technicien.nom)}
                            disabled={technicien.con === 'INACTIF'}
                          >
                            <UserX size={16} /> Mettre en congé
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => ouvrirConfirmation(technicien.id, 'retourdecongier', technicien.nom)}
                            disabled={technicien.con === 'ACTIF'}
                          >
                            <UserCheck size={16} /> Retour de congé
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => ouvrirConfirmation(technicien.id, 'quitter', technicien.nom)}
                            disabled={technicien.travail === 'QUITTER'}
                          >
                            <LogOut size={16} /> Quitter le travail
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-md"
                            onClick={() => ouvrirConfirmation(technicien.id, 'retourner', technicien.nom)}
                            disabled={technicien.travail === 'ENCOURS'}
                          >
                            <UserCheck size={16} /> Retourner au travail
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-600 dark:text-gray-300">
            Affichage de {indexPremierItem + 1} à {Math.min(indexDernierItem, techniciensFiltres.length)} sur {techniciensFiltres.length} entrées
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={pageActuelle === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                pageActuelle === 1 
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <button
              onClick={handleNextPage}
              disabled={pageActuelle === totalPages}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                pageActuelle === totalPages 
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {mode === 'modifier' && technicienEnModification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 p-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mettre à jour le technicien</h2>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                  onClick={() => setMode(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Informations du technicien</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Nom</label>
                      <input
                        type="text"
                        value={technicienEnModification.nom || ''}
                        onChange={e => setTechnicienEnModification({ ...technicienEnModification, nom: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-gray-600 dark:text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={technicienEnModification.email || ''}
                        onChange={(e) => setTechnicienEnModification({ ...technicienEnModification, email: e.target.value })}
                        class="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-gray-600 dark:text-gray-400 mb-2">Mot de passe</label>
                      <input
                        type="password"
                        value={technicienEnModification.motDePasse || ''}
                        onChange={(e) => setTechnicienEnModification({
                          ...technicienEnModification,
                          motDePasse: e.target.value
                        })}
                        class="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Carte d’identité</label>
                      <input
                        type="number"
                        value={technicienEnModification.carteIdentite || ''}
                        onChange={e => setTechnicienEnModification({ ...technicienEnModification, carteIdentite: parseInt(e.target.value) })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-gray-600 dark:text-gray-400 mb-2">Numéro de téléphone</label>
                      <input
                        type="number"
                        value={technicienEnModification.numTel || ''}
                        onChange={e => setTechnicienEnModification({ ...technicienEnModification, numTel: parseInt(e.target.value) })}
                        class="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Con</label>
                      <select
                        value={technicienEnModification.con || ''}
                        onChange={e => setTechnicienEnModification({ ...technicienEnModification, con: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white appearance-none"
                      >
                        {optionsStatut.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Travail</label>
                      <select
                        value={technicienEnModification.travail || ''}
                        onChange={e => setTechnicienEnModification({ ...technicienEnModification, travail: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white appearance-none"
                      >
                        {optionsTravail.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-gray-300 dark:border-gray-800 pt-4">
                  <button
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded"
                    onClick={() => setMode(null)}
                  >
                    Annuler
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    onClick={handleUpdateService}
                  >
                    Mettre à jour le technicien
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'voir' && technicienSelectionne && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 p-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Technicien - {technicienSelectionne.nom}</h2>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                  onClick={() => setMode(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Nom</label>
                    <p className="text-gray-600 dark:text-gray-300">{technicienSelectionne.nom || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Email</label>
                    <p className="text-gray-600 dark:text-gray-300">{technicienSelectionne.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Carte d’identité</label>
                    <p className="text-gray-600 dark:text-gray-300">{technicienSelectionne.carteIdentite || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Numéro de téléphone</label>
                    <p className="text-gray-600 dark:text-gray-300">{technicienSelectionne.numTel || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Con</label>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className={`inline-block h-2 w-2 rounded-full mr-1 ${
                        technicienSelectionne.con === 'ACTIF' ? 'bg-green-400' : 'bg-red-400'
                      }`}></span>
                      {technicienSelectionne.con || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Travail</label>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className={`inline-block h-2 w-2 rounded-full mr-1 ${
                        technicienSelectionne.travail === 'ENCOURS' ? 'bg-blue-400' : 'bg-gray-400'
                      }`}></span>
                      {technicienSelectionne.travail || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {confirmation && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            role="dialog"
            aria-labelledby="confirmation-title"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md border border-gray-300 dark:border-gray-800 shadow-lg transform transition-all duration-300 scale-100 hover:scale-105">
              <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 p-4">
                <h2 id="confirmation-title" className="text-xl font-bold text-gray-800 dark:text-white">
                  {getActionConfig(confirmation.action).title}
                </h2>
                <button
                  onClick={() => setConfirmation(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <p className="text-gray-600 dark:text-gray-300">{getActionConfig(confirmation.action).message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-300 dark:border-gray-800 p-4">
                <button
                  onClick={() => setConfirmation(null)}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={gererAction}
                  className={`${getActionConfig(confirmation.action).confirmColor} text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableListService;