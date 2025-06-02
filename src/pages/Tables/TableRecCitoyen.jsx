import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect } from 'react';

const UnassignedReclamations = () => {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'info',
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReclamationId, setSelectedReclamationId] = useState(null);
  const [selectedEquipeId, setSelectedEquipeId] = useState('');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const itemsPerPage = 5;

  // Show custom alert
  const showCustomAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  };

  // Parse JWT token
  function parseJwt(token) {
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
      showCustomAlert('Problème avec votre session. Veuillez vous reconnecter.', 'error');
      return null;
    }
  }

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token trouvé');

        const decoded = parseJwt(token);
        if (!decoded) throw new Error('Token JWT invalide ou mal formé');

        const email = decoded.email || decoded.sub;
        if (!email) throw new Error('Aucun email ou sujet trouvé dans le JWT');

        const response = await fetch(`http://localhost:8080/api/utilisateur/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok)
          throw new Error(`Échec de la récupération de l'utilisateur: ${response.status}`);

        const userData = await response.json();
        setUser(userData);
        showCustomAlert('Données utilisateur chargées avec succès', 'success');
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        setError(err.message);
        showCustomAlert(`Erreur: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('http://localhost:8080/equipes', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setTeams(data);
      } catch (e) {
        console.error('Error fetching teams:', e);
        showCustomAlert('Erreur lors de la récupération des équipes', 'error');
      }
    };
    fetchTeams();
  }, []);

  // Fetch unassigned reclamations and set up WebSocket
  useEffect(() => {
    fetchReclamations();

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log('Connected to WebSocket server');
        stompClient.subscribe('/topic/reclamations', (message) => {
          const updatedReclamation = JSON.parse(message.body);
          if (!updatedReclamation.equipeId) {
            setReclamations((prev) => {
              const exists = prev.find((rec) => rec.id === updatedReclamation.id);
              if (exists) {
                return prev.map((rec) =>
                  rec.id === updatedReclamation.id ? updatedReclamation : rec
                );
              }
              return [...prev, updatedReclamation];
            });
          } else {
            setReclamations((prev) => prev.filter((rec) => rec.id !== updatedReclamation.id));
          }
        });
      },
      onWebSocketError: (error) => console.error('WebSocket Error:', error),
      onStompError: (error) => console.error('STOMP Error:', error),
    });

    stompClient.activate();
    return () => stompClient.deactivate();
  }, []);

  // Fetch unassigned reclamations
  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/reclamations/non-equipe', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      let data = await response.json();

      const now = new Date();
      data = data.filter((reclamation) => {
        const reclamationDate = new Date(reclamation.heureReclamation);
        if (activeFilter === 'today') {
          return reclamationDate.toDateString() === now.toDateString();
        } else if (activeFilter === 'week') {
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(now.getDate() - 7);
          return reclamationDate >= oneWeekAgo && reclamationDate <= now;
        } else if (activeFilter === 'month') {
          const oneMonthAgo = new Date(now);
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return reclamationDate >= oneMonthAgo && reclamationDate <= now;
        }
        return true;
      });

      setReclamations(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (e) {
      console.error('Error fetching unassigned reclamations:', e);
      setError(e.message);
      showCustomAlert('Erreur lors de la récupération des réclamations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    const filteredItems = getFilteredItems();
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
  }, [searchTerm, reclamations, activeFilter]);

  // Handle assign equipe button click
  const handleAssignClick = (reclamationId) => {
    setSelectedReclamationId(reclamationId);
    setSelectedEquipeId('');
    setShowAssignModal(true);
  };

  // Handle equipe assignment submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEquipeId) {
      showCustomAlert('Veuillez sélectionner une équipe', 'error');
      return;
    }
    if (!user?.id) {
      showCustomAlert('Utilisateur non authentifié. Veuillez vous reconnecter.', 'error');
      return;
    }
    setShowConfirmAlert(true);
  };

  // Confirm assignment
  const confirmAssignment = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/reclamations/${selectedReclamationId}/assign-equipe/${selectedEquipeId}/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Une équipe est déjà assignée à cette réclamation');
        } else if (response.status === 400) {
          throw new Error('Réclamation, équipe ou utilisateur invalide');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedReclamation = await response.json();
      setReclamations((prev) => prev.filter((rec) => rec.id !== updatedReclamation.id));
      setShowAssignModal(false);
      setShowConfirmAlert(false);
      showCustomAlert('Équipe assignée avec succès', 'success');
    } catch (e) {
      console.error('Error assigning equipe:', e);
      showCustomAlert(`Erreur: ${e.message}`, 'error');
      setShowConfirmAlert(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter reclamations based on search term
  const getFilteredItems = () => {
    if (!searchTerm.trim()) return reclamations;
    const searchTermLower = searchTerm.toLowerCase().trim();
    return reclamations.filter((reclamation) =>
      [
        reclamation.reference,
        reclamation.importance,
        reclamation.typePanne,
        reclamation.genrePanne,
        reclamation.numClient,
        reclamation.etat,
        reclamation.heureReclamation &&
          new Date(reclamation.heureReclamation).toLocaleString(),
      ]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(searchTermLower))
    );
  };

  // Get current page items for pagination
  const getCurrentItems = () => {
    const filteredItems = getFilteredItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchReclamations();
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Get importance badge class
  const getImportanceBadgeClass = (importance) => {
    switch (importance) {
      case 'CRITIQUE':
        return 'text-red-500 bg-red-100/60';
      case 'IMPORTANTE':
        return 'text-orange-500 bg-orange-100/60';
      case 'MOYENNE':
        return 'text-blue-500 bg-blue-100/60';
      case 'FAIBLE':
        return 'text-emerald-500 bg-emerald-100/60';
      default:
        return 'text-gray-500 bg-gray-100/60';
    }
  };

  // Get etat display
  const getEtatDisplay = (etat) => {
    switch (etat) {
      case 'PAS_ENCOURS':
        return { text: 'Nouveau', class: 'bg-blue-200 w-full' };
      case 'ENCOURS':
        return { text: 'En cours', class: 'bg-blue-500 w-2/3' };
      case 'TERMINER':
        return { text: 'Terminer', class: 'bg-green-500 w-full' };
      case 'ANNULEE':
        return { text: 'Annulée', class: 'bg-red-500 w-full' };
      default:
        return { text: 'Inconnu', class: 'bg-gray-500 w-1/3' };
    }
  };

  // Custom alert component
  const CustomAlert = () => {
    if (!alert.show) return null;
    const alertStyles = {
      info: {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: (
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
        ),
      },
      success: {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: (
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        ),
      },
      error: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: (
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
        ),
      },
    };

    const style = alertStyles[alert.type];
    return (
      <div className='fixed top-5 right-5 z-[100] max-w-md animate-fade-in-down'>
        <div
          className={`flex p-4 mb-4 ${style.bg} ${style.text} border-l-4 ${style.border} rounded-lg shadow-md`}
          role='alert'
        >
          <div className='inline-flex items-center justify-center flex-shrink-0 w-8 h-8 mr-2'>
            {style.icon}
          </div>
          <div className='ml-3 text-sm font-medium'>{alert.message}</div>
          <button
            type='button'
            className={`ml-auto -mx-1.5 -my-1.5 ${style.bg} ${style.text} rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex h-8 w-8`}
            onClick={() => setAlert((prev) => ({ ...prev, show: false }))}
          >
            <span className='sr-only'>Fermer</span>
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Confirmation alert component
  const ConfirmAlert = () => {
    if (!showConfirmAlert) return null;
    return (
      <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50'>
        <div className='relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg'>
          <div className='p-4'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg className='w-6 h-6 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div className='ml-3 w-0 flex-1'>
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  Confirmer l'assignation
                </p>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-300'>
                  Voulez-vous vraiment assigner cette équipe à la réclamation ?
                </p>
              </div>
              <button
                onClick={() => setShowConfirmAlert(false)}
                className='ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
              >
                <span className='sr-only'>Fermer</span>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='mt-4 flex justify-end space-x-3'>
              <button
                onClick={() => setShowConfirmAlert(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Annuler
              </button>
              <button
                onClick={confirmAssignment}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageBreadcrumb pageTitle='Réclamations Non Assignées' />
      <CustomAlert />
      <ConfirmAlert />
      <div className='space-y-6 mt-6'>
        <section className='container px-4 mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700'>
          <div className='sm:flex sm:items-center sm:justify-between'>
            <div>
              <div className='flex items-center gap-x-3'>
                <h2 className='text-lg font-medium text-gray-800 dark:text-white'>
                  Réclamations non assignées
                </h2>
                <span className='px-3 py-1 text-xs text-blue-600 bg-blue-100 rounded-full dark:bg-gray-700 dark:text-blue-400'>
                  {getFilteredItems().length} Réclamations
                </span>
              </div>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-300'>
                Réclamations en attente d'assignation à une équipe
              </p>
            </div>
          </div>

          <div className='mt-6 md:flex md:items-center md:justify-between'>
            <div className='inline-flex flex-wrap gap-2 bg-white dark:bg-gray-900 border rounded-lg dark:border-gray-700'>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeFilter === 'all' ? 'bg-blue-100 text-blue-600 dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => handleFilterChange('all')}
              >
                Voir tout
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeFilter === 'today' ? 'bg-blue-100 text-blue-600 dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => handleFilterChange('today')}
              >
                Aujourd'hui
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeFilter === 'week' ? 'bg-blue-100 text-blue-600 dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => handleFilterChange('week')}
              >
                Semaine
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeFilter === 'month' ? 'bg-blue-100 text-blue-600 dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => handleFilterChange('month')}
              >
                Mois
              </button>
            </div>

            <div className='relative flex items-center mt-4 md:mt-0'>
              <span className='absolute'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                  className='w-5 h-5 mx-2 text-gray-400 dark:text-gray-600'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'
                  />
                </svg>
              </span>
              <input
                type='text'
                placeholder='Rechercher'
                className='block w-full py-1.5 pr-4 text-gray-700 bg-white border border-gray-200 rounded-lg md:w-64 placeholder-gray-400/70 pl-9 rtl:pr-9 rtl:pl-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40'
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

         <div className='flex flex-col mt-6'>
            <div className='-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
              <div className='inline-block min-w-full py-2 align-middle md:px-6 lg:px-8'>
                <div className='overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead className='bg-gray-50 dark:bg-gray-800'>
                      <tr>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Référence
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Importance
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Type
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Genre
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Client
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          État
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Heure
                        </th>
                        <th className='py-3 px-4 text-sm font-medium text-left text-gray-500 dark:text-gray-300'>
                          Équipe
                        </th>
                        <th className='relative py-3 px-4'>
                          <span className='sr-only'>Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900'>
                      {loading ? (
                        <tr>
                          <td colSpan='9' className='px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300'>
                            Chargement...
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan='9' className='px-4 py-3 text-sm text-center text-red-500 dark:text-red-400'>
                            Erreur : {error}
                          </td>
                        </tr>
                      ) : getCurrentItems().length === 0 ? (
                        <tr>
                          <td colSpan='9' className='px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300'>
                            {searchTerm ? 'Aucun résultat trouvé' : 'Aucune réclamation non assignée trouvée'}
                          </td>
                        </tr>
                      ) : (
                        getCurrentItems().map((reclamation) => (
                          <tr key={reclamation.id}>
                            <td className='px-4 py-3 text-sm font-medium whitespace-nowrap'>
                              <h2 className='font-medium text-gray-800 dark:text-white'>
                                {reclamation.reference || 'N/A'}
                              </h2>
                            </td>
                            <td className='px-4 py-3 text-sm font-medium whitespace-nowrap'>
                              <div
                                className={`inline px-3 py-1 text-sm font-semibold rounded-full ${getImportanceBadgeClass(
                                  reclamation.importance
                                )}`}
                              >
                                {reclamation.importance || 'N/A'}
                              </div>
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              {reclamation.typePanne || 'N/A'}
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              {reclamation.genrePanne || 'N/A'}
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              {reclamation.numClient || 'N/A'}
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              <div className='w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden'>
                                <div className={`${getEtatDisplay(reclamation.etat).class} h-2`} />
                              </div>
                              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                                {getEtatDisplay(reclamation.etat).text}
                              </p>
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              {formatDateTime(reclamation.heureReclamation)}
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              {reclamation.equipeId ? `Équipe ${reclamation.equipeId}` : 'Non assignée'}
                            </td>
                            <td className='px-4 py-3 text-sm whitespace-nowrap'>
                              <button
                                className='px-3 py-1 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                onClick={() => handleAssignClick(reclamation.id)}
                              >
                                Assigner
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

          <div className='mt-6 sm:flex sm:items-center sm:justify-between'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              Page{' '}
              <span className='font-medium text-gray-800 dark:text-gray-100'>
                {currentPage} de {totalPages}
              </span>
            </div>
            <div className='flex items-center mt-4 gap-x-4 sm:mt-0'>
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-1/2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 capitalize transition-colors duration-200 bg-white dark:bg-gray-900 border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                  className='w-4 h-4 rtl:-scale-x-100'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18'
                  />
                </svg>
                <span>Précédent</span>
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center w-1/2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 capitalize transition-colors duration-200 bg-white dark:bg-gray-900 border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>Suivant</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                  className='w-4 h-4 rtl:-scale-x-100'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3'
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>

      {showAssignModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50'>
          <div className='relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg'>
            <div className='flex items-center justify-between p-4 border-b dark:border-gray-700'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white'>Assigner une équipe</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className='text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='p-4'>
              <form onSubmit={handleAssignSubmit}>
                <div className='flex flex-col'>
                  <label htmlFor='equipeId' className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                    Équipe technique
                  </label>
                  <select
                    id='equipeId'
                    className='mt-2 block w-full rounded-md border border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 focus:ring-opacity-50'
                    value={selectedEquipeId}
                    onChange={(e) => setSelectedEquipeId(e.target.value)}
                  >
                    <option value='' className='dark:bg-gray-700'>Sélectionner une équipe</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} className='dark:bg-gray-700'>
                        {team.nom || `Équipe ${team.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='mt-4 grid w-full grid-cols-2 justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={() => setShowAssignModal(false)}
                    className='rounded-lg bg-gray-200 dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none hover:opacity-80 focus:ring'
                  >
                    Annuler
                  </button>
                  <button
                    type='submit'
                    className='rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white outline-none hover:opacity-80 focus:ring'
                  >
                    Assigner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnassignedReclamations;