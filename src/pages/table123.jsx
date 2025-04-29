import React, { useState, useEffect, useRef } from 'react';
import { Edit, Eye, Trash2, MoreVertical, X, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OngletApp() {
  const [services, setServices] = useState([]);
  const [afficherActionsService, setAfficherActionsService] = useState(null);
  const [serviceSelectionne, setServiceSelectionne] = useState(null);
  const [serviceEnEdition, setServiceEnEdition] = useState(null);
  const [mode, setMode] = useState(null); // 'voir', 'editer'
  const [filtre, setFiltre] = useState('Tous');
  const [chargement, setChargement] = useState(false);
  const [requeteRecherche, setRequeteRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [elementsParPage] = useState(5);
  const refToastAffiche = useRef(false); // Suivi d'affichage des notifications

  const URL_API = 'http://localhost:8080/api/service-intervention';

  useEffect(() => {
    console.log('Montage de OngletApp, récupération des services...');
    recupererServices();
    return () => {
      console.log('Démontage de OngletApp');
      refToastAffiche.current = false; // Réinitialisation du drapeau de notification au démontage
    };
  }, []);

  const recupererServices = async () => {
    setChargement(true);
    try {
      const reponse = await axios.get(`${URL_API}/all`);
      console.log('Services récupérés:', reponse.data);
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
      await axios.put(`${URL_API}/update/${serviceEnEdition.id}`, serviceEnEdition);
      setServices(services.map(service =>
        service.id === serviceEnEdition.id ? serviceEnEdition : service
      ));
      setMode(null);
      setServiceEnEdition(null);
      toast.success('Intervention de service mise à jour avec succès!');
    } catch (erreur) {
      console.error('Erreur lors de la mise à jour du service:', erreur);
      toast.error('Échec de la mise à jour de l\'intervention de service.');
    }
  };

  const gererSuppressionService = async (idService) => {
    try {
      await axios.delete(`${URL_API}/delete/${idService}`);
      setServices(services.filter(service => service.id !== idService));
      setAfficherActionsService(null);
      toast.success('Intervention de service supprimée avec succès!');
    } catch (erreur) {
      console.error('Erreur lors de la suppression du service:', erreur);
      toast.error('Échec de la suppression de l\'intervention de service.');
    }
  };

  const servicesFiltres = services.filter(service => {
    const correspondanceRecherche = (
      service.nom?.toLowerCase().includes(requeteRecherche.toLowerCase()) ||
      service.email?.toLowerCase().includes(requeteRecherche.toLowerCase()) ||
      service.carteIdentite?.toString().includes(requeteRecherche) ||
      service.numTel?.toString().includes(requeteRecherche)
    );
    if (filtre === 'Tous') return correspondanceRecherche;
    return correspondanceRecherche && service.con === filtre;
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

  const optionsConcierge = ['ACTIF', 'INACTIF'];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Interventions de Service</h1>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, email, ID ou téléphone"
                value={requeteRecherche}
                onChange={e => setRequeteRecherche(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-10 pr-4 text-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative w-full md:w-48">
              <select
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-4 pr-10 text-gray-600 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setFiltre(e.target.value)}
                value={filtre}
              >
                <option value="Tous">Tous</option>
                {optionsConcierge.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-600 dark:text-gray-300">Afficher:</span>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtre"
                  checked={filtre === 'Tous'}
                  onChange={() => setFiltre('Tous')}
                  className="mr-2 text-blue-500 focus:ring-blue-500"
                />
                <span>Tous</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtre"
                  checked={filtre === 'ACTIF'}
                  onChange={() => setFiltre('ACTIF')}
                  className="mr-2 text-blue-500 focus:ring-blue-500"
                />
                <span>Actif</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtre"
                  checked={filtre === 'INACTIF'}
                  onChange={() => setFiltre('INACTIF')}
                  className="mr-2 text-blue-500 focus:ring-blue-500"
                />
                <span>Inactif</span>
              </label>
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
                    Concierge
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-300 dark:divide-gray-700">
                {servicesActuels.map(service => {
                  return (
                    <tr key={service.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{service.nom}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{service.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{service.carteIdentite}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{service.numTel}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          service.con === 'ACTIF' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          <span className={`mr-1 mt-[6px] h-2 w-2 rounded-full ${
                            service.con === 'ACTIF' ? 'bg-green-400' : 'bg-red-400'
                          }`}></span>
                          {service.con}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 relative">
                        <button
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none"
                          onClick={() => gererClicActionService(service.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {afficherActionsService === service.id && (
                          <div className="absolute right-8 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-10">
                            <button
                              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-md"
                              onClick={() => gererEditionService(service)}
                            >
                              <Edit size={16} /> Modifier
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              onClick={() => gererVoirService(service)}
                            >
                              <Eye size={16} /> Voir
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-md"
                              onClick={() => gererSuppressionService(service.id)}
                            >
                              <Trash2 size={16} /> Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-600 dark:text-gray-300">
            Affichage de {indexPremierElement + 1} à {Math.min(indexDernierElement, servicesFiltres.length)} sur {servicesFiltres.length} entrées
          </div>
          <div className="flex gap-2">
            <button
              onClick={gererPagePrecedente}
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
              onClick={gererPageSuivante}
              disabled={pageActuelle === pagesTotal}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                pageActuelle === pagesTotal 
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {mode === 'editer' && serviceEnEdition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 p-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mettre à jour l'intervention de service</h2>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                  onClick={() => setMode(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Informations du service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Nom</label>
                      <input
                        type="text"
                        value={serviceEnEdition.nom || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, nom: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={serviceEnEdition.email || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, email: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Mot de passe</label>
                      <input
                        type="password"
                        value={serviceEnEdition.motDePasse || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, motDePasse: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Carte d'identité</label>
                      <input
                        type="number"
                        value={serviceEnEdition.carteIdentite || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, carteIdentite: parseInt(e.target.value) })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Numéro de téléphone</label>
                      <input
                        type="number"
                        value={serviceEnEdition.numTel || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, numTel: parseInt(e.target.value) })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 mb-2">Concierge</label>
                      <select
                        value={serviceEnEdition.con || ''}
                        onChange={e => setServiceEnEdition({ ...serviceEnEdition, con: e.target.value })}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-gray-800 dark:text-white appearance-none"
                      >
                        {optionsConcierge.map(option => (
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
                    onClick={gererMiseAJourService}
                  >
                    Mettre à jour le service
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'voir' && serviceSelectionne && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 p-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Intervention de service - {serviceSelectionne.nom}</h2>
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
                    <p className="text-gray-600 dark:text-gray-300">{serviceSelectionne.nom || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Email</label>
                    <p className="text-gray-600 dark:text-gray-300">{serviceSelectionne.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Carte d'identité</label>
                    <p className="text-gray-600 dark:text-gray-300">{serviceSelectionne.carteIdentite || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Numéro de téléphone</label>
                    <p className="text-gray-600 dark:text-gray-300">{serviceSelectionne.numTel || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-500 text-sm mb-1">Concierge</label>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className={`inline-block h-2 w-2 rounded-full mr-1 ${
                        serviceSelectionne.con === 'ACTIF' ? 'bg-green-400' : 'bg-red-400'
                      }`}></span>
                      {serviceSelectionne.con || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OngletApp;