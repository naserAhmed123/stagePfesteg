import React, { useState, useEffect, useRef } from 'react';
import { Edit, Eye, MoreVertical, X, ChevronDown, Search, ChevronLeft, ChevronRight, LogOut, UserCheck, UserX, AlertCircle, Users, Filter } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OngletApp() {
  const [services, setServices] = useState([]);
  const [afficherActionsService, setAfficherActionsService] = useState(null);
  const [serviceSelectionne, setServiceSelectionne] = useState(null);
  const [serviceEnEdition, setServiceEnEdition] = useState(null);
  const [mode, setMode] = useState(null); // 'voir', 'editer'
  const [confirmation, setConfirmation] = useState(null); // { id, action, nom }
  const [filtreCon, setFiltreCon] = useState('Tous');
  const [filtreTravail, setFiltreTravail] = useState('Tous');
  const [chargement, setChargement] = useState(false);
  const [requeteRecherche, setRequeteRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(5);
  const refToastAffiche = useRef(false);

  const URL_API = 'http://localhost:8080/api/service-intervention';

  useEffect(() => {
    console.log('Montage de OngletApp, récupération des services...');
    recupererServices();
    return () => {
      console.log('Démontage de OngletApp');
      refToastAffiche.current = false;
    };
  }, []);

  const recupererServices = async () => {
    setChargement(true);
    try {
      const token = localStorage.getItem('token');
      const reponse = await axios.get(`${URL_API}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const servicesUniques = reponse.data.filter(
        (service, index, self) => self.findIndex(s => s.id === service.id) === index
      );
      setServices(servicesUniques);
      if (!refToastAffiche.current) {
        toast.success('Interventions de service chargées avec succès!');
        refToastAffiche.current = true;
      }
    } catch (erreur) {
      console.error('Erreur lors de la récupération des services:', erreur);
      toast.error('Échec du chargement des interventions de service.');
      if (erreur.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setChargement(false);
    }
  };

  const gererClicActionService = (idService) => {
    setAfficherActionsService(prev => (prev === idService ? null : idService));
  };

  const gererEditionService = (service) => {
    setServiceEnEdition({ ...service });
    setMode('editer');
    setAfficherActionsService(null);
  };

  const gererVoirService = (service) => {
    setServiceSelectionne(service);
    setMode('voir');
    setAfficherActionsService(null);
  };

  const gererMiseAJourService = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${URL_API}/update/${serviceEnEdition.id}`, serviceEnEdition, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(services.map(service =>
        service.id === serviceEnEdition.id ? serviceEnEdition : service
      ));
      setMode(null);
      setServiceEnEdition(null);
      toast.success('Intervention de service mise à jour avec succès!');
    } catch (erreur) {
      console.error('Erreur lors de la mise à jour du service:', erreur);
      toast.error('Échec de la mise à jour de l\'intervention de service.');
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
      setServices(services.map(service =>
        service.id === id ? { ...service, ...reponse.data } : service
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
    setAfficherActionsService(null);
  };

  const servicesFiltres = services.filter(service => {
    const correspondanceRecherche = (
      service.nom?.toLowerCase().includes(requeteRecherche.toLowerCase()) ||
      service.email?.toLowerCase().includes(requeteRecherche.toLowerCase()) ||
      service.carteIdentite?.toString().includes(requeteRecherche) ||
      service.numTel?.toString().includes(requeteRecherche)
    );
    const correspondanceCon = filtreCon === 'Tous' || service.con === filtreCon;
    const correspondanceTravail = filtreTravail === 'Tous' || service.travail === filtreTravail;
    return correspondanceRecherche && correspondanceCon && correspondanceTravail;
  });

  const indexDernierElement = pageActuelle * elementsParPage;
  const indexPremierElement = indexDernierElement - elementsParPage;
  const servicesActuels = servicesFiltres.slice(indexPremierElement, indexDernierElement);
  const pagesTotal = Math.ceil(servicesFiltres.length / elementsParPage) || 1;

  const gererPageSuivante = () => {
    if (pageActuelle < pagesTotal) {
      setPageActuelle(pageActuelle + 1);
    }
  };

  const gererPagePrecedente = () => {
    if (pageActuelle > 1) {
      setPageActuelle(pageActuelle - 1);
    }
  };

  const optionsCon = ['ACTIF', 'INACTIF'];
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
        confirmColor: 'bg-red-400 hover:bg-red-500',
      },
      retourner: {
        title: 'Retourner au travail',
        message: `Voulez-vous vraiment marquer ${confirmation?.nom} comme de retour au travail ?`,
        confirmColor: 'bg-blue-500 hover:bg-blue-600',
      },
    }[action] || {};
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <Users className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Gestion des Interventions de Service
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Gérez et suivez les interventions de vos services</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative flex-1 min-w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, ID ou téléphone..."
                  value={requeteRecherche}
                  onChange={e => setRequeteRecherche(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl py-3.5 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 shadow-sm"
                />
              </div>
              <div className="relative">
                <select
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl py-3.5 pl-4 pr-12 text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 shadow-sm min-w-44"
                  onChange={e => setFiltreCon(e.target.value)}
                  value={filtreCon}
                >
                  <option value="Tous">Tous les statuts</option>
                  {optionsCon.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              </div>
              <div className="relative">
                <select
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl py-3.5 pl-4 pr-12 text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 shadow-sm min-w-44"
                  onChange={e => setFiltreTravail(e.target.value)}
                  value={filtreTravail}
                >
                  <option value="Tous">Tous les travaux</option>
                  {optionsTravail.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="text-slate-500" size={20} />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Filtres rapides</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Statut</h4>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="filtreCon"
                        checked={filtreCon === 'Tous'}
                        onChange={() => setFiltreCon('Tous')}
                        className="text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">Tous</span>
                    </label>
                    {optionsCon.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="filtreCon"
                          checked={filtreCon === option}
                          onChange={() => setFiltreCon(option)}
                          className="text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                        />
                        <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Travail</h4>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="filtreTravail"
                        checked={filtreTravail === 'Tous'}
                        onChange={() => setFiltreTravail('Tous')}
                        className="text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">Tous</span>
                    </label>
                    {optionsTravail.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="filtreTravail"
                          checked={filtreTravail === option}
                          onChange={() => setFiltreTravail(option)}
                          className="text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                        />
                        <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {chargement ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <tr>
                    <th scope="col" className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                      />
                    </th>
                    {['Nom', 'Email', "Carte d'identité", 'Téléphone', 'Statut', 'Travail', 'Actions'].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {servicesActuels.map((service, index) => (
                    <tr 
                      key={service.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{service.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400">{service.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400">{service.carteIdentite}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400">{service.numTel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          service.con === 'ACTIF' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-100 text-red-400 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                          <span className={`mr-2 h-2 w-2 rounded-full ${
                            service.con === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-400'
                          }`}></span>
                          {service.con}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          service.travail === 'ENCOURS' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                        }`}>
                          <span className={`mr-2 h-2 w-2 rounded-full ${
                            service.travail === 'ENCOURS' ? 'bg-blue-500' : 'bg-slate-400'
                          }`}></span>
                          {service.travail}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 relative">
                        <button
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition-all duration-200"
                          onClick={() => gererClicActionService(service.id)}
                          aria-label="Actions pour le service"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {afficherActionsService === service.id && (
                          <div className="absolute right-8 top-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-10 overflow-hidden">
                            <button
                              className="w-full text-left px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors duration-200"
                              onClick={() => gererEditionService(service)}
                            >
                              <Edit size={16} className="text-blue-500" /> 
                              <span className="font-medium">Modifier</span>
                            </button>
                            <button
                              className="w-full text-left px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors duration-200"
                              onClick={() => gererVoirService(service)}
                            >
                              <Eye size={16} className="text-slate-500" /> 
                              <span className="font-medium">Voir</span>
                            </button>
                            {service.travail !== 'QUITTER' && (
                              <>
                                <div className="border-t border-slate-200 dark:border-slate-700"></div>
                                <button
                                  className="w-full text-left px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => ouvrirConfirmation(service.id, 'encongier', service.nom)}
                                  disabled={service.con === 'INACTIF'}
                                >
                                  <UserX size={16} className="text-yellow-500" /> 
                                  <span className="font-medium">Mettre en congé</span>
                                </button>
                                <button
                                  className="w-full text-left px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => ouvrirConfirmation(service.id, 'retourdecongier', service.nom)}
                                  disabled={service.con === 'ACTIF'}
                                >
                                  <UserCheck size={16} className="text-green-500" /> 
                                  <span className="font-medium">Retour de congé</span>
                                </button>
                              </>
                            )}
                            <div className="border-t border-slate-200 dark:border-slate-700"></div>
                            <button
                              className="w-full text-left px-4 py-3 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => ouvrirConfirmation(service.id, 'quitter', service.nom)}
                              disabled={service.travail === 'QUITTER'}
                            >
                              <LogOut size={16} /> 
                              <span className="font-medium">Quitter le travail</span>
                            </button>
                            <button
                              className="w-full text-left px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => ouvrirConfirmation(service.id, 'retourner', service.nom)}
                              disabled={service.travail === 'ENCOURS'}
                            >
                              <UserCheck size={16} className="text-blue-500" /> 
                              <span className="font-medium">Retourner au travail</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            Affichage de <span className="font-semibold text-slate-900 dark:text-slate-100">{indexPremierElement + 1}</span> à <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(indexDernierElement, servicesFiltres.length)}</span> sur <span className="font-semibold text-slate-900 dark:text-slate-100">{servicesFiltres.length}</span> entrées
          </div>
          <div className="flex gap-2">
            <button
              onClick={gererPagePrecedente}
              disabled={pageActuelle === 1}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pageActuelle === 1 
                  ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed text-slate-400 dark:text-slate-500' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              <ChevronLeft size={18} /> Précédent
            </button>
            <button
              onClick={gererPageSuivante}
              disabled={pageActuelle === pagesTotal}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pageActuelle === pagesTotal 
                  ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed text-slate-400 dark:text-slate-500' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              Suivant <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {mode === 'editer' && serviceEnEdition && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="editer-title">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-6">
                <h2 id="editer-title" className="text-2xl font-bold text-slate-900 dark:text-white">Mettre à jour l'intervention de service</h2>
                <button
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  onClick={() => setMode(null)}
                  aria-label="Fermer"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informations du service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Nom', type: 'text', key: 'nom' },
                      { label: 'Email', type: 'email', key: 'email' },
                      { label: 'Mot de passe', type: 'password', key: 'motDePasse' },
                      { label: 'Carte d’identité', type: 'number', key: 'carteIdentite' },
                      { label: 'Numéro de téléphone', type: 'number', key: 'numTel' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{field.label}</label>
                        <input
                          type={field.type}
                          value={serviceEnEdition[field.key] || ''}
                          onChange={e => setServiceEnEdition({
                            ...serviceEnEdition,
                            [field.key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value
                          })}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Statut</label>
                      <select
                        value={serviceEnEdition.con || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, con: e.target.value })}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      >
                        {optionsCon.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Travail</label>
                      <select
                        value={serviceEnEdition.travail || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, travail: e.target.value })}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      >
                        {optionsTravail.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-6">
                  <button
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition duration-200"
                    onClick={() => setMode(null)}
                  >
                    Annuler
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition duration-200"
                    onClick={gererMiseAJourService}
                  >
                    Mettre à jour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {mode === 'voir' && serviceSelectionne && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="voir-title">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-6">
                <h2 id="voir-title" className="text-2xl font-bold text-slate-900 dark:text-white">Intervention de service - {serviceSelectionne.nom}</h2>
                <button
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  onClick={() => setMode(null)}
                  aria-label="Fermer"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {[
                    { label: 'Nom', value: serviceSelectionne.nom },
                    { label: 'Email', value: serviceSelectionne.email },
                    { label: 'Carte d’identité', value: serviceSelectionne.carteIdentite },
                    { label: 'Numéro de téléphone', value: serviceSelectionne.numTel },
                    {
                      label: 'Statut',
                      value: (
                        <span className="inline-flex items-center">
                          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                            serviceSelectionne.con === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-400'
                          }`}></span>
                          {serviceSelectionne.con || 'N/A'}
                        </span>
                      ),
                    },
                    {
                      label: 'Travail',
                      value: (
                        <span className="inline-flex items-center">
                          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                            serviceSelectionne.travail === 'ENCOURS' ? 'bg-blue-500' : 'bg-slate-400'
                          }`}></span>
                          {serviceSelectionne.travail || 'N/A'}
                        </span>
                      ),
                    },
                  ].map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{field.label}</label>
                      <p className="text-slate-700 dark:text-slate-300">{field.value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {confirmation && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-labelledby="confirmation-title"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-6">
                <h2 id="confirmation-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  {getActionConfig(confirmation.action).title}
                </h2>
                <button
                  onClick={() => setConfirmation(null)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  aria-label="Fermer"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <p className="text-slate-700 dark:text-slate-300">{getActionConfig(confirmation.action).message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 p-6">
                <button
                  onClick={() => setConfirmation(null)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={gererAction}
                  className={`${getActionConfig(confirmation.action).confirmColor} text-white px-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200`}
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

export default OngletApp;