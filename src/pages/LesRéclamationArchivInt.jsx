import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

const TabledirectionArchiv = () => {
  const [showModal, setShowModal] = useState(false);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReclamations();  // Charge les réclamations au montage du composant

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {},
      debug: (str) => console.log(str),
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        console.log('Connected to WebSocket server');
        stompClient.subscribe('/topic/reclamations', (message) => {
          console.log('Received message:', message.body);
          setReclamations((prevReclamations) => [
            ...prevReclamations,
            JSON.parse(message.body),
          ]);
        });
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
      },
      onStompError: (error) => {
        console.error('STOMP Error:', error);
      },
    });

    stompClient.activate();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  useEffect(() => {
    // Reset to first page when search term changes
    setCurrentPage(1);
    // Update total pages based on filtered results
    const filteredItems = getFilteredItems();
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
  }, [searchTerm, reclamations]);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/reclamations/archiver');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReclamations(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (e) {
      console.error('Error fetching reclamations:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
    
  // Fonction pour exporter toutes les réclamations en CSV
  const exportReclamationsToCSV = () => {
    if (reclamations.length === 0) {
      alert("Aucune réclamation à exporter");
      return;
    }

    // Créer les en-têtes du CSV
    const headers = [
      "Référence",
      "Importance",
      "Type de panne",
      "Genre de panne",
      "Numéro Client",
      "État",
      "Heure de réclamation",
      "Équipe"
    ].join(",");

    // Formater les données
    const csvRows = reclamations.map(rec => {
      return [
        rec.reference || "N/A",
        rec.importance || "N/A",
        rec.typePanne || "N/A",
        rec.genrePanne || "N/A",
        rec.numClient || "N/A",
        rec.etat || "N/A",
        rec.heureReclamation ? new Date(rec.heureReclamation).toLocaleString() : "N/A",
        "Équipe " + (rec.equipeId || "N/A")
      ].join(",");
    });

    // Combiner les en-têtes et les lignes
    const csvContent = [headers, ...csvRows].join("\n");

    // Créer un Blob avec le contenu CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    
    // Créer un URL pour le Blob
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reclamations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // Déclencher le téléchargement
    link.click();
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Map importance to badge colors
  const getImportanceBadgeClass = (importance) => {
    switch(importance) {
      case "CRITIQUE":
        return "text-red-500 bg-red-100/60";
      case "IMPORTANTE":
        return "text-orange-500 bg-orange-100/60";
      case "MOYENNE":
        return "text-blue-500 bg-blue-100/60";
      case "FAIBLE":
        return "text-emerald-500 bg-emerald-100/60";
      default:
        return "text-gray-500 bg-gray-100/60";
    }
  };

  // Map etat to status display
  const getEtatDisplay = (etat) => {
    switch(etat) {
      case "PAS_ENCOURS":
        return { text: "Nouveau", class: "bg-blue-200 w-full" };
      case "ENCOURS":
        return { text: "En cours", class: "bg-blue-500 w-2/3" };
      case "TERMINER":
        return { text: "Terminer", class: "bg-green-500 w-full" };
      case "ANNULEE":
        return { text: "Annulée", class: "bg-red-500 w-full" };
      default:
        return { text: "Inconnu", class: "bg-gray-500 w-1/3" };
    }
  };
  
  const countReferences = (reference) => {
    if (!reference) return 0;
    return reclamations.filter(item => item.reference === reference).length;
  };
  
  // Format date for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Search functionality
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Function to filter reclamations based on search term
  const getFilteredItems = () => {
    if (!searchTerm.trim()) {
      return reclamations;
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return reclamations.filter(reclamation => {
      // Convert all values to string and check if any includes the search term
      return (
        (reclamation.reference?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.importance?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.typePanne?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.genrePanne?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.numClient?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.etat?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.equipeId?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.heureReclamation && new Date(reclamation.heureReclamation).toLocaleString().toLowerCase().includes(searchTermLower))
      );
    });
  };

  // Pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get current page items
  const getCurrentItems = () => {
    const filteredItems = getFilteredItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Les Réclamations" />
      <div className="space-y-6 mt-6">
        <section className="container px-4 mx-auto bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-x-3">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">Les réclamations Archiver</h2>
                <span className="px-3 py-1 text-xs text-blue-600 bg-blue-100 rounded-full dark:bg-gray-800 dark:text-blue-400">
                  {getFilteredItems().length} Réclamations
                </span>
              </div>
            </div>

            <div className="flex items-center mt-4 gap-x-3">
              <button 
                className="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700"
                onClick={exportReclamationsToCSV}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_3098_154395)">
                    <path d="M13.3333 13.3332L9.99997 9.9999M9.99997 9.9999L6.66663 13.3332M9.99997 9.9999V17.4999M16.9916 15.3249C17.8044 14.8818 18.4465 14.1806 18.8165 13.3321C19.1866 12.4835 19.2635 11.5359 19.0351 10.6388C18.8068 9.7417 18.2862 8.94616 17.5555 8.37778C16.8248 7.80939 15.9257 7.50052 15 7.4999H13.95C13.6977 6.52427 13.2276 5.61852 12.5749 4.85073C11.9222 4.08295 11.104 3.47311 10.1817 3.06708C9.25943 2.66104 8.25709 2.46937 7.25006 2.50647C6.24304 2.54358 5.25752 2.80849 4.36761 3.28129C3.47771 3.7541 2.70656 4.42249 2.11215 5.23622C1.51774 6.04996 1.11554 6.98785 0.935783 7.9794C0.756025 8.97095 0.803388 9.99035 1.07431 10.961C1.34523 11.9316 1.83267 12.8281 2.49997 13.5832" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_3098_154395">
                      <rect width="20" height="20" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <span>Exporter toutes les réclamations</span>
              </button>

          
            </div>
          </div>

          <div className="mt-6 md:flex md:items-center md:justify-between">
           

            <div className="relative flex items-center mt-4 md:mt-0">
              <span className="absolute">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mx-3 text-gray-400 dark:text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Rechercher" 
                className="block w-full py-1.5 pr-5 text-gray-700 bg-white border border-gray-200 rounded-lg md:w-80 placeholder-gray-400/70 pl-11 rtl:pr-11 rtl:pl-5 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40" 
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="flex flex-col mt-6">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                          <button className="flex items-center gap-x-3 focus:outline-none">
                            <span>Réference</span>
                            <svg className="h-3" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2.13347 0.0999756H2.98516L5.01902 4.79058H3.86226L3.45549 3.79907H1.63772L1.24366 4.79058H0.0996094L2.13347 0.0999756ZM2.54025 1.46012L1.96822 2.92196H3.11227L2.54025 1.46012Z" fill="currentColor" stroke="currentColor" strokeWidth="0.1" />
                              <path d="M0.722656 9.60832L3.09974 6.78633H0.811638V5.87109H4.35819V6.78633L2.01925 9.60832H4.43446V10.5617H0.722656V9.60832Z" fill="currentColor" stroke="currentColor" strokeWidth="0.1" />
                              <path d="M8.45558 7.25664V7.40664H8.60558H9.66065C9.72481 7.40664 9.74667 7.42274 9.75141 7.42691C9.75148 7.42808 9.75146 7.42993 9.75116 7.43262C9.75001 7.44265 9.74458 7.46304 9.72525 7.49314C9.72522 7.4932 9.72518 7.49326 9.72514 7.49332L7.86959 10.3529L7.86924 10.3534C7.83227 10.4109 7.79863 10.418 7.78568 10.418C7.77272 10.418 7.73908 10.4109 7.70211 10.3534L7.70177 10.3529L5.84621 7.49332C5.84617 7.49325 5.84612 7.49318 5.84608 7.49311C5.82677 7.46302 5.82135 7.44264 5.8202 7.43262C5.81989 7.42993 5.81987 7.42808 5.81994 7.42691C5.82469 7.42274 5.84655 7.40664 5.91071 7.40664H6.96578H7.11578V7.25664V0.633865C7.11578 0.42434 7.29014 0.249976 7.49967 0.249976H8.07169C8.28121 0.249976 8.45558 0.42434 8.45558 0.633865V7.25664Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3" />
                            </svg>
                          </button>
                        </th>
                        <th scope="col" className="px-12 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                          Importance
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                         Type de panne
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">
                         Genre de panne
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">Numéro Client</th>
                        
                        <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">Etat</th>
                        <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">Heure</th>
                        <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400">Transmis à</th>
                        <th scope="col" className="relative py-3.5 px-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-4 text-sm text-center">
                            Chargement...
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-4 text-sm text-center text-red-500">
                          <div className="flex justify-center p-4">
                                <div className="relative w-full max-w-sm rounded-lg border border-gray-100 bg-white px-12 py-6 shadow-md">
                                  <button className="absolute top-0 right-0 p-4 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <p className="relative mb-1 text-sm font-medium">
                                    <span className="absolute -left-7 flex h-5 w-5 items-center justify-center rounded-xl bg-red-400 text-white">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-3 w-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </span>
                                    <span className="text-gray-700">Erreur :</span>
                                  </p>
                                  <p className="text-sm text-gray-600">{error}</p>
                                </div>
                              </div>
                             
                          </td>
                        </tr>
                      ) : getCurrentItems().length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-4 text-sm text-center">
                            {searchTerm ? "Aucun résultat trouvé pour votre recherche" : "Aucune réclamation trouvée"}
                          </td>
                        </tr>
                      ) : (
                        getCurrentItems().map((reclamation, index) => (
                          <tr key={index}>
                            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                              <div>
                                <h2 className="font-medium text-gray-800 dark:text-white">
                                {reclamation.reference || "N/A"}
                                </h2>
                                <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                réclamations  :  {countReferences(reclamation.reference)}
                                </p>
                              </div>
                            </td>
                            <td className="px-12 py-4 text-sm font-medium whitespace-nowrap">
                              <div className={`inline px-3 py-1 text-sm font-normal rounded-full gap-x-2 ${getImportanceBadgeClass(reclamation.importance)} dark:bg-gray-800`}>
                                {reclamation.importance || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <div>
                                <h4 className="text-gray-700 dark:text-gray-200">
                                  {reclamation.typePanne || "N/A"}
                                </h4>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <div>
                                <h4 className="text-gray-700 dark:text-gray-200">
                                  {reclamation.genrePanne || "N/A"}
                                </h4>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              {reclamation.numClient || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <div className="w-48 h-1.5 bg-blue-200 overflow-hidden rounded-full">
                                <div className={getEtatDisplay(reclamation.etat).class + " h-1.5"}></div>
                              </div>
                              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {getEtatDisplay(reclamation.etat).text}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              {formatDateTime(reclamation.heureReclamation)}
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              Equipe {reclamation.equipeId || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <button className="px-1 py-1 text-gray-500 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
                    <div className="mt-6 sm:flex sm:items-center sm:justify-between ">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page <span className="font-medium text-gray-700 dark:text-gray-100">{currentPage} de {totalPages}</span> 
            </div>

            <div className="flex items-center mt-4 gap-x-4 sm:mt-0">
              <button 
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:-scale-x-100">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                </svg>
                <span>
                  Précédent
                </span>
              </button>

              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>
                  Suivant
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 rtl:-scale-x-100">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>

     
          </>
  );
};

export default TabledirectionArchiv;