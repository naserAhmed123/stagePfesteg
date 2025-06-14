import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect } from 'react';

const Table2 = () => {
  const [showModal, setShowModal] = useState(false);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const itemsPerPage = 5;
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [citizen, setCitizen] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'info',
  });

  const [formData, setFormData] = useState({
    reference: '',
    numClient: '',
    typePanne: '',
    genrePanne: '',
    importance: '',
    equipeId: '',
    etat: 'PAS_ENCOURS',
    serviceInterventionId: null,
  });

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

        const userData = await response.json();
        setUser(userData);
        setFormData((prev) => ({
          ...prev,
          serviceInterventionId: userData.id || null,
        }));
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
        const response = await fetch('http://localhost:8080/equipes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTeams(data);
      } catch (e) {
        console.error('Error fetching teams:', e);
        showCustomAlert('Erreur lors de la récupération des équipes', 'error');
      }
    };

    fetchTeams();
  }, []);

  // Fetch reclamations and set up WebSocket
  useEffect(() => {
    fetchReclamations();

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

  // Update pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    const filteredItems = getFilteredItems();
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
  }, [searchTerm, reclamations, activeFilter]);

  // Fetch reclamations based on active filter
  const fetchReclamations = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8080/reclamations';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
      console.error('Error fetching reclamations:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamations();
  }, [activeFilter]);

  // Fetch citizen by reference (using CustomAlert)
  const fetchCitizenByReference = async (reference) => {
    if (!reference.trim()) {
      setCitizen(null);
      setFormData((prev) => ({ ...prev, numClient: '' }));
      showCustomAlert('Référence vide, veuillez entrer une référence valide.', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }

      console.log(`Fetching citizen for reference: ${reference}`);
      const response = await fetch(`http://localhost:8080/api/citoyens/recherche/reference/${reference}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération du citoyen: ${response.status}`);
      }

      const citizens = await response.json();
      console.log('Citizens received:', citizens);

      if (citizens.length > 0) {
        const selectedCitizen = citizens[0];
        setCitizen(selectedCitizen);
        setFormData((prev) => ({
          ...prev,
          numClient: selectedCitizen.numTelephone || '',
        }));
        showCustomAlert(`Réclamation pour ${selectedCitizen.nom} (ID: ${selectedCitizen.id})`, 'info');
        if (citizens.length > 1) {
          showCustomAlert('Plusieurs citoyens trouvés pour cette référence. Utilisation du premier.', 'warning');
        }
      } else {
        setCitizen(null);
        setFormData((prev) => ({ ...prev, numClient: '' }));
        showCustomAlert('La réclamation sera enregistrée avec un ID citoyen null', 'warning');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du citoyen:', err);
      setCitizen(null);
      setFormData((prev) => ({ ...prev, numClient: '' }));
      showCustomAlert(`Erreur: ${err.message}`, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    console.log(`Input changed: ${id} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (id === 'reference') {
      fetchCitizenByReference(value);
    }
  };

  const showCustomAlert = (message, type = 'info') => {
    setAlert({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    if (!showModal) {
      setCitizen(null);
      setFormData({
        reference: '',
        numClient: '',
        typePanne: '',
        genrePanne: '',
        importance: '',
        equipeId: '',
        etat: 'PAS_ENCOURS',
        serviceInterventionId: user?.id || null,
      });
    }
  };

  const AffecterRue = (ref) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) {
      return 'cas1';
    }

    const les5 = parseInt(refStr.substring(0, 5), 10);

    if (les5 > 72806 && les5 < 73392) {
      return 'GREMDA';
    } else if (les5 > 73432 && les5 < 73588) {
      return 'LAFRANE';
    } else if (les5 > 73590 && les5 < 73922) {
      return 'ELAIN';
    } else if (les5 > 73924 && les5 < 74208) {
      return 'MANZEL_CHAKER';
    } else if (les5 > 74252 && les5 < 74348) {
      return 'MATAR';
    } else if (les5 > 74386 && les5 < 74405) {
      return 'SOKRA_MHARZA';
    } else if (les5 > 74405 && les5 < 74700) {
      return 'GABES';
    }
    return null;
  };

  const AffecterPosition = (ref) => {
    const refStr = ref.toString();
    const les5 = parseInt(refStr.substring(0, 5), 10);
    // Gremda
    if (les5 > 72806 && les5 < 72923) {
      return '34.809452, 10.697908';
    } else if (les5 > 72923 && les5 < 73040) {
      return '34.820176, 10.683399';
    } else if (les5 > 73040 && les5 < 73157) {
      return '34.831885, 10.664742';
    } else if (les5 > 73157 && les5 < 73204) {
      return '34.848488, 10.654134';
    } else if (les5 > 73204 && les5 < 73251) {
      return '34.877576, 10.647410';
    } else if (les5 > 73251 && les5 < 73298) {
      return '34.917272, 10.628854';
    } else if (les5 > 73298 && les5 < 73345) {
      return '34.949842, 10.604524';
    } else if (les5 > 73345 && les5 < 73392) {
      return '34.977689, 10.580294';
    }
    // Mharza + Sokra
    else if (les5 > 74386 && les5 < 74395) {
      return '34.726994, 10.735081';
    } else if (les5 > 74395 && les5 < 74405) {
      return '34.718671, 10.716934';
    }
    // Gabes
    else if (les5 > 74406 && les5 < 74443) {
      return '34.725186, 10.740050';
    } else if (les5 > 74443 && les5 < 74480) {
      return '34.713981, 10.726896';
    } else if (les5 > 74480 && les5 < 74517) {
      return '34.692107, 10.712458';
    } else if (les5 > 74517 && les5 < 74554) {
      return '34.681489, 10.699727';
    } else if (les5 > 74554 && les5 < 74584) {
      return '34.649277, 10.661651';
    } else if (les5 > 74584 && les5 < 74614) {
      return '34.634163, 10.646154';
    } else if (les5 > 74614 && les5 < 74643) {
      return '34.624239, 10.634514';
    } else if (les5 > 74643 && les5 < 74672) {
      return '34.605497, 10.608144';
    } else if (les5 > 74672 && les5 < 74700) {
      return '34.591644, 10.595522';
    }
    // Lafrane
    else if (les5 > 73432 && les5 < 73541) {
      return '34.803097, 10.688320';
    } else if (les5 > 73541 && les5 < 73588) {
      return '34.818443, 10.679888';
    }
    // Matar
    else if (les5 > 74252 && les5 < 74265) {
      return '34.803097, 10.688320';
    } else if (les5 > 74265 && les5 < 74278) {
      return '34.818443, 10.679888';
    } else if (les5 > 74278 && les5 < 74291) {
      return '34.818443, 10.679888';
    } else if (les5 > 74291 && les5 < 74299) {
      return '34.818443, 10.679888';
    } else if (les5 > 74299 && les5 < 74307) {
      return '34.818443, 10.679888';
    } else if (les5 > 74307 && les5 < 74328) {
      return '34.818443, 10.679888';
    } else if (les5 > 74328 && les5 < 74349) {
      return '34.818443, 10.679888';
    }
    // Ain
    else if (les5 > 73590 && les5 < 73673) {
      return '34.796403, 10.680231';
    } else if (les5 > 73673 && les5 < 73756) {
      return '34.808556, 10.665329';
    } else if (les5 > 73756 && les5 < 73789) {
      return '34.820707, 10.649712';
    } else if (les5 > 73789 && les5 < 74822) {
      return '34.833610, 10.632666';
    } else if (les5 > 74822 && les5 < 74855) {
      return '34.845087, 10.617968';
    } else if (les5 > 74855 && les5 < 74888) {
      return '34.858657, 10.602249';
    } else if (les5 > 74888 && les5 < 74922) {
      return '34.872475, 10.588776';
    }
    // Manzel Chaker
    else if (les5 > 73924 && les5 < 73990) {
      return '34.758306, 10.698916';
    } else if (les5 > 73990 && les5 < 74056) {
      return '34.769614, 10.683164';
    } else if (les5 > 74056 && les5 < 74122) {
      return '34.781924, 10.661600';
    } else if (les5 > 74122 && les5 < 74152) {
      return '34.789963, 10.647072';
    } else if (les5 > 74152 && les5 < 74182) {
      return '34.801642, 10.63132';
    } else if (les5 > 74182 && les5 < 74888) {
      return '34.813320, 10.615415';
    } else if (les5 > 74195 && les5 < 74208) {
      return '34.827382, 10.601192';
    }
    return null;
  };

  const ValiderNum = (num) => {
    const numStr = num.toString();
    if (numStr.length !== 8) {
      return 'cas1';
    }
    const lePremiere = numStr.charAt(0);
    if (!['2', '4', '5', '9'].includes(lePremiere)) {
      return 'cas2';
    }
    return 'Valide';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numClient) {
      showCustomAlert('Le numéro client est obligatoire !', 'error');
      return;
    }

    if (!formData.typePanne || !formData.genrePanne || !formData.importance || !formData.equipeId) {
      showCustomAlert('Veuillez remplir tous les champs obligatoires !', 'error');
      return;
    }

    if (!user?.id) {
      showCustomAlert('Utilisateur non authentifié. Veuillez vous reconnecter.', 'error');
      return;
    }

    if (AffecterRue(formData.reference) === null) {
      showCustomAlert("La référence n'est pas enregistrée ou disponible dans Sfax Sud", 'error');
      return;
    }
    if (AffecterRue(formData.reference) === 'cas1') {
      showCustomAlert('La référence ne contient pas 8 chiffres', 'error');
      return;
    }
    if (ValiderNum(formData.numClient) === 'cas1') {
      showCustomAlert('Le numéro de client ne comporte pas 8 chiffres', 'error');
      return;
    } else if (ValiderNum(formData.numClient) === 'cas2') {
      showCustomAlert("Le numéro de client n'est pas un numéro tunisien", 'error');
      return;
    }
    const now = new Date();
    const formattedDateTime = now.toISOString();
    const payload = {
      reference: formData.reference,
      typePanne: formData.typePanne,
      numClient: parseInt(formData.numClient, 10) || 0,
      genrePanne: formData.genrePanne,
      heureReclamation: formattedDateTime,
      etat: formData.etat,
      importance: formData.importance,
      equipeId: parseInt(formData.equipeId, 10),
      serviceInterventionId: user.id,
      rue: AffecterRue(formData.reference),
      etatSauvgarder: 'NON_ARCHIVER',
      Position2Km: AffecterPosition(formData.reference),
      citoyen: citizen?.id ?? null,
    };
    try {
      const response = await fetch('http://localhost:8080/reclamations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setFormData({
        reference: '',
        numClient: '',
        typePanne: '',
        genrePanne: '',
        importance: '',
        equipeId: '',
        etat: 'PAS_ENCOURS',
        serviceInterventionId: user?.id || null,
      });
      setCitizen(null);

      await fetchReclamations();
      toggleModal();
      showCustomAlert('Réclamation ajoutée avec succès !', 'success');
    } catch (e) {
      console.error("Erreur lors de l'ajout de la réclamation:", e);
      showCustomAlert('Erreur lors de l’ajout de la réclamation', 'error');
    }
  };

  const exportReclamationsToCSV = () => {
    if (reclamations.length === 0) {
      showCustomAlert('Aucune réclamation à exporter', 'warning');
      return;
    }

    const headers = [
      'Référence',
      'Importance',
      'Type de panne',
      'Genre de panne',
      'Numéro Client',
      'État',
      'Heure de réclamation',
      'Équipe',
    ].join(',');

    const csvRows = reclamations.map((rec) => {
      return [
        rec.reference || 'N/A',
        rec.importance || 'N/A',
        rec.typePanne || 'N/A',
        rec.genrePanne || 'N/A',
        rec.numClient || 'N/A',
        rec.etat || 'N/A',
        rec.heureReclamation ? new Date(rec.heureReclamation).toLocaleString() : 'N/A',
        'Équipe ' + (rec.equipeId || 'N/A'),
      ].join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reclamations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    showCustomAlert('Exportation réussie !', 'success');
  };

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

  const countReferences = (reference) => {
    if (!reference) return 0;
    return reclamations.filter((item) => item.reference === reference).length;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getFilteredItems = () => {
    if (!searchTerm.trim()) {
      return reclamations;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return reclamations.filter((reclamation) => {
      return (
        (reclamation.reference?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.importance?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.typePanne?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.genrePanne?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.numClient?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.etat?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.equipeId?.toString().toLowerCase().includes(searchTermLower) || false) ||
        (reclamation.heureReclamation &&
          new Date(reclamation.heureReclamation).toLocaleString().toLowerCase().includes(searchTermLower))
      );
    });
  };

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

  const getCurrentItems = () => {
    const filteredItems = getFilteredItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const CustomAlert = () => {
    if (!alert.show) return null;

    const alertStyles = {
      info: {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: (
          <svg
            className='w-5 h-5'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            ></path>
          </svg>
        ),
      },
      success: {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: (
          <svg
            className='w-5 h-5'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            ></path>
          </svg>
        ),
      },
      warning: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: (
          <svg
            className='w-5 h-5'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd'
              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            ></path>
          </svg>
        ),
      },
      error: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: (
          <svg
            className='w-5 h-5'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            ></path>
          </svg>
        ),
      },
    };

    const style = alertStyles[alert.type];

    return (
      <div className='fixed top-5 right-5 z-[100] max-w-md animate-fade-in-down mt-[5%]'>
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
            <svg
              className='w-5 h-5'
              fill='currentColor'
              viewBox='0 0 20 20'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              ></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageBreadcrumb pageTitle='Les Réclamations' />
      <CustomAlert />
      <div className='space-y-6 mt-6'>
        <section className='container px-4 mx-auto bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800'>
          <div className='sm:flex sm:items-center sm:justify-between'>
            <div>
              <div className='flex items-center gap-x-3'>
                <h2 className='text-lg font-medium text-gray-800 dark:text-white'>Les réclamations</h2>
                <span className='px-3 py-1 text-xs text-blue-600 bg-blue-100 rounded-full dark:bg-gray-800 dark:text-blue-400'>
                  {getFilteredItems().length} Réclamations
                </span>
              </div>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-300'>C'est les réclamations de ce jour</p>
            </div>

            <div className='flex items-center mt-4 gap-x-3'>
              <button
                className='flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700'
                onClick={exportReclamationsToCSV}
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 20 20'
                  stroke='currentColor'
                  strokeWidth='1.67'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <g clipPath='url(#clip0_3098_154395)'>
                    <path
                      d='M13.3333 13.3332L9.99997 9.9999M9.99997 9.9999L6.66663 13.3332M9.99997 9.9999V17.4999M16.9916 15.3249C17.8044 14.8818 18.4465 14.1806 18.8165 13.3321C19.1866 12.4835 19.2635 11.5359 19.0351 10.6388C18.8068 9.7417 18.2862 8.94616 17.5555 8.37778C16.8248 7.80939 15.9257 7.50052 15 7.4999H13.95C13.6977 6.52427 13.2276 5.61852 12.5749 4.85073C11.9222 4.08295 11.104 3.47311 10.1817 3.06708C9.25943 2.66104 8.25709 2.46937 7.25006 2.50647C6.24304 2.54358 5.25752 2.80849 4.36761 3.28129C3.47771 3.7541 2.70656 4.42249 2.11215 5.23622C1.51774 6.04996 1.11554 6.98785 0.935783 7.9794C0.756025 8.97095 0.803388 9.99035 1.07431 10.961C1.34523 11.9316 1.83267 12.8281 2.49997 13.5832'
                      stroke='currentColor'
                      strokeWidth='1.67'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </g>
                  <defs>
                    <clipPath id='clip0_3098_154395'>
                      <rect width='20' height='20' fill='white' />
                    </clipPath>
                  </defs>
                </svg>
                <span>Exporter toutes les réclamations</span>
              </button>

              <button
                className='flex items-center justify-center w-1/2 px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-blue-500 rounded-lg shrink-0 sm:w-auto gap-x-2 hover:bg-blue-600 dark:hover:bg-blue-500 dark:bg-blue-600'
                onClick={toggleModal}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                  className='w-5 h-5'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span>Ajouter Réclamation</span>
              </button>
            </div>
          </div>

          <div className='mt-6 md:flex md:items-center md:justify-between'>
            <div className='inline-flex overflow-hidden bg-white border divide-x rounded-lg dark:bg-gray-900 rtl:flex-row-reverse dark:border-gray-700 dark:divide-gray-700'>
              <button
                className={`px-5 py-2 text-xs font-medium transition-colors duration-200 sm:text-sm dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 ${
                  activeFilter === 'all' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => handleFilterChange('all')}
              >
                Voir tout
              </button>
              <button
                className={`px-5 py-2 text-xs font-medium transition-colors duration-200 sm:text-sm dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 ${
                  activeFilter === 'today' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => handleFilterChange('today')}
              >
                Aujourd'hui
              </button>
              <button
                className={`px-5 py-2 text-xs font-medium transition-colors duration-200 sm:text-sm dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 ${
                  activeFilter === 'week' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => handleFilterChange('week')}
              >
                Semaine
              </button>
              <button
                className={`px-5 py-2 text-xs font-medium transition-colors duration-200 sm:text-sm dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 ${
                  activeFilter === 'month' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
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
                  className='w-5 h-5 mx-3 text-gray-400 dark:text-gray-600'
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
                className='block w-full py-1.5 pr-5 text-gray-700 bg-white border border-gray-200 rounded-lg md:w-80 placeholder-gray-400/70 pl-11 rtl:pr-11 rtl:pl-5 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40'
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
                        <th
                          scope='col'
                          className='py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          <button className='flex items-center gap-x-3 focus:outline-none'>
                            <span>Réference</span>
                            <svg
                              className='h-3'
                              viewBox='0 0 10 11'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                d='M2.13347 0.0999756H2.98516L5.01902 4.79058H3.86226L3.45549 3.79907H1.63772L1.24366 4.79058H0.0996094L2.13347 0.0999756ZM2.54025 1.46012L1.96822 2.92196H3.11227L2.54025 1.46012Z'
                                fill='currentColor'
                                stroke='currentColor'
                                strokeWidth='0.1'
                              />
                              <path
                                d='M0.722656 9.60832L3.09974 6.78633H0.811638V5.87109H4.35819V6.78633L2.01925 9.60832H4.43446V10.5617H0.722656V9.60832Z'
                                fill='currentColor'
                                stroke='currentColor'
                                strokeWidth='0.1'
                              />
                              <path
                                d='M8.45558 7.25664V7.40664H8.60558H9.66065C9.72481 7.40664 9.74667 7.42274 9.75141 7.42691C9.75148 7.42808 9.75146 7.42993 9.75116 7.43262C9.75001 7.44265 9.74458 7.46304 9.72525 7.49314C9.72522 7.4932 9.72518 7.49326 9.72514 7.49332L7.86959 10.3529L7.86924 10.3534C7.83227 10.4109 7.79863 10.418 7.78568 10.418C7.77272 10.418 7.73908 10.4109 7.70211 10.3534L7.70177 10.3529L5.84621 7.49332C5.84617 7.49325 5.84612 7.49318 5.84608 7.49311C5.82677 7.46302 5.82135 7.44264 5.8202 7.43262C5.81989 7.42993 5.81987 7.42808 5.81994 7.42691C5.82469 7.42274 5.84655 7.40664 5.91071 7.40664H6.96578H7.11578V7.25664V0.633865C7.11578 0.42434 7.29014 0.249976 7.49967 0.249976H8.07169C8.28121 0.249976 8.45558 0.42434 8.45558 0.633865V7.25664Z'
                                fill='currentColor'
                                stroke='currentColor'
                                strokeWidth='0.3'
                              />
                            </svg>
                          </button>
                        </th>
                        <th
                          scope='col'
                          className='px-12 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Importance
                        </th>
                        <th
                          scope='col'
                          className='px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Type de panne
                        </th>
                        <th
                          scope='col'
                          className='px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Genre de panne
                        </th>
                        <th
                          scope='col'
                          className='px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Numéro Client
                        </th>
                        <th
                          scope='col'
                          className='px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Etat
                        </th>
                        <th
                          scope='col'
                          className='px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Heure
                        </th>
                        <th
                          scope='col'
                          className='px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400'
                        >
                          Transmis à
                        </th>
                        <th scope='col' className='relative py-3.5 px-4'>
                          <span className='sr-only'>Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900'>
                      {loading ? (
                        <tr>
                          <td colSpan='9' className='px-4 py-4 text-sm text-center'>
                            Chargement...
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan='9' className='px-4 py-4 text-sm text-center text-red-500'>
                            <div className='flex justify-center p-4'>
                              <div className='relative w-full max-w-sm rounded-lg border border-gray-100 bg-white px-12 py-6 shadow-md'>
                                <button className='absolute top-0 right-0 p-4 text-gray-400'>
                                  <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    strokeWidth='1.5'
                                    stroke='currentColor'
                                    className='h-5 w-4'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      d='M6 18L18 6M6 6l12 12'
                                    />
                                  </svg>
                                </button>
                                <p className='relative mb-1 text-sm font-medium'>
                                  <span className='absolute -left-7 flex h-5 w-5 items-center justify-center rounded-xl bg-red-400 text-white'>
                                    <svg
                                      xmlns='http://www.w3.org/2000/svg'
                                      fill='none'
                                      viewBox='0 0 24 24'
                                      strokeWidth='1.5'
                                      stroke='currentColor'
                                      className='h-3 w-3'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M6 18L18 6M6 6l12 12'
                                      />
                                    </svg>
                                  </span>
                                  <span className='text-gray-700'>Erreur :</span>
                                </p>
                                <p className='text-sm text-gray-600'>{error}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : getCurrentItems().length === 0 ? (
                        <tr>
                          <td colSpan='9' className='px-4 py-4 text-sm text-center'>
                            {searchTerm ? 'Aucun résultat trouvé pour votre recherche' : 'Aucune réclamation trouvée'}
                          </td>
                        </tr>
                      ) : (
                        getCurrentItems().map((reclamation, index) => (
                          <tr key={index}>
                            <td className='px-4 py-4 text-sm font-medium whitespace-nowrap'>
                              <div>
                                <h2 className='font-medium text-gray-800 dark:text-white'>
                                  {reclamation.reference || 'N/A'}
                                </h2>
                                <p className='text-sm font-normal text-gray-600 dark:text-gray-400'>
                                  réclamations : {countReferences(reclamation.reference)}
                                </p>
                              </div>
                            </td>
                            <td className='px-12 py-4 text-sm font-medium whitespace-nowrap'>
                              <div
                                className={`inline px-3 py-1 text-sm font-normal rounded-full gap-x-2 ${getImportanceBadgeClass(
                                  reclamation.importance
                                )} dark:bg-gray-800`}
                              >
                                {reclamation.importance || 'N/A'}
                              </div>
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              <div>
                                <h4 className='text-gray-700 dark:text-gray-200'>
                                  {reclamation.typePanne || 'N/A'}
                                </h4>
                              </div>
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              <div>
                                <h4 className='text-gray-700 dark:text-gray-200'>
                                  {reclamation.genrePanne || 'N/A'}
                                </h4>
                              </div>
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              {reclamation.numClient || 'N/A'}
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              <div className='w-48 h-1.5 bg-blue-200 overflow-hidden rounded-full'>
                                <div
                                  className={getEtatDisplay(reclamation.etat).class + ' h-1.5'}
                                ></div>
                              </div>
                              <p className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                                {getEtatDisplay(reclamation.etat).text}
                              </p>
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              {formatDateTime(reclamation.heureReclamation)}
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              Equipe {reclamation.equipeId || 'N/A'}
                            </td>
                            <td className='px-4 py-4 text-sm whitespace-nowrap'>
                              <button className='px-1 py-1 text-gray-500 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  strokeWidth='1.5'
                                  stroke='currentColor'
                                  className='w-6 h-6'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z'
                                  />
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

          <div className='mt-6 sm:flex sm:items-center sm:justify-between'>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Page{' '}
              <span className='font-medium text-gray-700 dark:text-gray-100'>
                {currentPage} de {totalPages}
              </span>
            </div>

            <div className='flex items-center mt-4 gap-x-4 sm:mt-0'>
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                  className='w-5 h-5 rtl:-scale-x-100'
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
                className={`flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 ${
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
                  className='w-5 h-5 rtl:-scale-x-100'
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

      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50'>
          <div className='relative w-full max-w-screen-md mx-4 bg-white rounded-xl shadow-lg'>
            <div className='flex items-center justify-between p-4 border-b'>
              <h3 className='text-xl font-medium text-gray-900'>Ajouter Réclamation</h3>
              <button onClick={toggleModal} className='text-gray-400 hover:text-gray-500'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='p-6'>
              <form onSubmit={handleSubmit}>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  <div className='flex flex-col'>
                    <label
                      htmlFor='reference'
                      className='text-sm font-medium text-stone-600'
                    >
                      Réference
                    </label>
                    <input
                      type='text'
                      id='reference'
                      placeholder='Référence'
                      className='mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                      value={formData.reference}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='flex flex-col'>
                    <label
                      htmlFor='numClient'
                      className='text-sm font-medium text-stone-600'
                    >
                      Numéro client
                    </label>
                    <input
                      type='number'
                      id='numClient'
                      placeholder='Numéro client'
                      className='mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                      value={formData.numClient}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='flex flex-col'>
                    <label
                      htmlFor='typePanne'
                      className='text-sm font-medium text-stone-600'
                    >
                      Type de panne
                    </label>
                    <select
                      id='typePanne'
                      className='mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                      value={formData.typePanne}
                      onChange={handleInputChange}
                    >
                      <option value=''>Sélectionner</option>
                      <option value='TYPE1'>TYPE1</option>
                      <option value='TYPE2'>TYPE2</option>
                      <option value='TYPE3'>TYPE3</option>
                      <option value='TYPE4'>TYPE4</option>
                      <option value='TYPE5'>TYPE5</option>
                    </select>
                  </div>
                  <div className='flex flex-col'>
                    <label
                      htmlFor='genrePanne'
                      className='text-sm font-medium text-stone-600'
                    >
                      Genre de panne
                    </label>
                    <select
                      id='genrePanne'
                      className='mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                      value={formData.genrePanne}
                      onChange={handleInputChange}
                    >
                      <option value=''>Sélectionner</option>
                      <option value='ELECTRICITE'>ELECTRICITE</option>
                      <option value='GAZ'>GAZ</option>
                    </select>
                  </div>
                  <div className='flex flex-col'>
                    <label
                      htmlFor='importance'
                      className='text-sm font-medium text-stone-600'
                    >
                      Importance
                    </label>
                    <select
                      id='importance'
                      className='mt-2 block w-full cursor-pointer rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                      value={formData.importance}
                      onChange={handleInputChange}
                    >
                      <option value=''>Sélectionner</option>
                      <option value='CRITIQUE'>Critique</option>
                      <option value='IMPORTANTE'>Importante</option>
                      <option value='MOYENNE'>Moyenne</option>
                      <option value='FAIBLE'>Faible</option>
                    </select>
                  </div>
                  <div className='flex flex-col'>
                    <label
                      htmlFor='equipeId'
                      className='text-sm font-medium text-stone-600'
                    >
                      Equipe technique
                    </label>
                    <select
                      id='equipeId'
                      className='mt-2 block w-full cursor-pointer rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                      value={formData.equipeId}
                      onChange={handleInputChange}
                    >
                      <option value=''>Sélectionner</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.nom || `Equipe ${team.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className='mt-6 grid w-full grid-cols-2 justify-end space-x-4 md:flex'>
                  <button
                    type='button'
                    onClick={toggleModal}
                    className='rounded-lg bg-gray-200 px-8 py-2 font-medium text-gray-700 outline-none hover:opacity-80 focus:ring'
                  >
                    Annuler
                  </button>
                  <button
                    type='submit'
                    className='rounded-lg bg-blue-600 px-8 py-2 font-medium text-white outline-none hover:opacity-80 focus:ring'
                  >
                    Ajouter la réclamation
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

export default Table2;