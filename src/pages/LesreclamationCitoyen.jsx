import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaSort } from 'react-icons/fa';

const AddReclamation = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'info'
  });
  const [userData, setUserData] = useState({
    id: '',
    nom: '',
    carteIdentite: '',
    role: '',
    motDePasse: '',
    con: '',
    confirmMotDePasse: '',
  });
  const [reclamations, setReclamations] = useState([]);
  const [editReclamation, setEditReclamation] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'reference', direction: 'asc' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

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
  }, []);

  useEffect(() => {
    const fetchReclamations = async () => {
      if (!userData.id) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/reclamations/reclamations/citoyen/${userData.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Échec de la récupération des réclamations: ${response.status}`);
        }
        const data = await response.json();
        setReclamations(data);
      } catch (err) {
        console.error('Erreur lors de la récupération des réclamations:', err);
        toast.error(`Erreur: ${err.message}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    fetchReclamations();
  }, [userData.id]);

  const [formData, setFormData] = useState({
    reference: "",
    numClient: "",
    typePanne: "",
    genrePanne: "",
    importance: "",
    etat: "PAS_ENCOURS",
    serviceInterventionId: 0,
    citoyen: userData.id,
  });

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {},
      debug: (str) => console.log(str),
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        console.log('Connected to WebSocket server');
        stompClient.subscribe('/topic/reclamations', (message) => {
          console.log('Received message:', message.body);
          showCustomAlert("Nouvelle réclamation reçue!", "success");
        });
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
        showCustomAlert("Erreur de connexion WebSocket", "error");
      },
      onStompError: (error) => {
        console.error('STOMP Error:', error);
        showCustomAlert("Erreur STOMP", "error");
      },
    });

    stompClient.activate();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  const showCustomAlert = (message, type = 'info') => {
    setAlert({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    setEditReclamation(null);
    setFormData({
      reference: "",
      numClient: "",
      typePanne: "",
      genrePanne: "",
      importance: "",
      etat: "PAS_ENCOURS",
      serviceInterventionId: 0,
      citoyen: userData.id
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const AffecterRue = (ref) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) return "cas1";
    const les5 = parseInt(refStr.substring(0, 5), 10);
    if (les5 > 72806 && les5 < 73392) return "GREMDA";
    if (les5 > 73432 && les5 < 73588) return "LAFRANE";
    if (les5 > 73590 && les5 < 73922) return "ELAIN";
    if (les5 > 73924 && les5 < 74208) return "MANZEL_CHAKER";
    if (les5 > 74252 && les5 < 74348) return "MATAR";
    if (les5 > 74386 && les5 < 74405) return "SOKRA_MHARZA";
    if (les5 > 74406 && les5 < 74700) return "GABES";
    return null;
  };

  const AffecterPosition = (ref) => {
    const refStr = ref.toString();
    const les5 = parseInt(refStr.substring(0, 5), 10);
    if (les5 > 72806 && les5 < 72923) return "34.809452, 10.697908";
    if (les5 > 72923 && les5 < 73040) return "34.820176, 10.683399";
    if (les5 > 73040 && les5 < 73157) return "34.831885, 10.664742";
    if (les5 > 73157 && les5 < 73204) return "34.848438, 10.654134";
    if (les5 > 73204 && les5 < 73251) return "34.877576, 10.647410";
    if (les5 > 73251 && les5 < 73298) return "34.917272, 10.628854";
    if (les5 > 73298 && les5 < 73345) return "34.949842, 10.604524";
    if (les5 > 73345 && les5 < 73392) return "34.977689, 10.580294";
    if (les5 > 74386 && les5 < 74395) return "34.726994, 10.735081";
    if (les5 > 74395 && les5 < 74405) return "34.718671, 10.716934";
    if (les5 > 74406 && les5 < 74443) return "34.725186, 10.740050";
    if (les5 > 74443 && les5 < 74480) return "34.713981, 10.726896";
    if (les5 > 74480 && les5 < 74517) return "34.692107, 10.712458";
    if (les5 > 74517 && les5 < 74554) return "34.681489, 10.699727";
    if (les5 > 74554 && les5 < 74584) return "34.649277, 10.661651";
    if (les5 > 74584 && les5 < 74614) return "34.634163, 10.646154";
    if (les5 > 74614 && les5 < 74643) return "34.624239, 10.634514";
    if (les5 > 74643 && les5 < 74672) return "34.605497, 10.608144";
    if (les5 > 74672 && les5 < 74700) return "34.591644, 10.595522";
    if (les5 > 73432 && les5 < 73541) return "34.803097, 10.688320";
    if (les5 > 73541 && les5 < 73588) return "34.818443, 10.679888";
    if (les5 > 74252 && les5 < 74265) return "34.803097, 10.688320";
    if (les5 > 74265 && les5 < 74278) return "34.818443, 10.679888";
    if (les5 > 74278 && les5 < 74291) return "34.818443, 10.679888";
    if (les5 > 74291 && les5 < 74299) return "34.818443, 10.679888";
    if (les5 > 74299 && les5 < 74307) return "34.818443, 10.679888";
    if (les5 > 74307 && les5 < 74328) return "34.818443, 10.679888";
    if (les5 > 74328 && les5 < 74349) return "34.818443, 10.679888";
    if (les5 > 73590 && les5 < 73673) return "34.796403, 10.680231";
    if (les5 > 73673 && les5 < 73756) return "34.808556, 10.665329";
    if (les5 > 73756 && les5 < 73789) return "34.820707, 10.649712";
    if (les5 > 73789 && les5 < 74822) return "34.833610, 10.632666";
    if (les5 > 74822 && les5 < 74855) return "34.845087, 10.617968";
    if (les5 > 74855 && les5 < 74888) return "34.858657, 10.602249";
    if (les5 > 74888 && les5 < 74922) return "34.872475, 10.588776";
    if (les5 > 73924 && les5 < 73990) return "34.758306, 10.698916";
    if (les5 > 73990 && les5 < 74056) return "34.769614, 10.683164";
    if (les5 > 74056 && les5 < 74122) return "34.781924, 10.661600";
    if (les5 > 74122 && les5 < 74152) return "34.789963, 10.647072";
    if (les5 > 74152 && les5 < 74182) return "34.801642, 10.63132";
    if (les5 > 74182 && les5 < 74888) return "34.813320, 10.615415";
    if (les5 > 74195 && les5 < 74208) return "34.827382, 10.601192";
    return null;
  };

  const ValiderNum = (num) => {
    const numStr = num.toString();
    if (numStr.length !== 8) return "cas1";
    const lePremiere = numStr.charAt(0);
    if (!['2', '4', '5', '9'].includes(lePremiere)) return "cas2";
    return "Valide";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numClient) {
      showCustomAlert("Le numéro client est obligatoire !", "error");
      return;
    }

    if (!formData.typePanne || !formData.genrePanne || !formData.importance) {
      showCustomAlert("Veuillez remplir tous les champs obligatoires !", "error");
      return;
    }

    if (AffecterRue(formData.reference) === null) {
      showCustomAlert("La référence n'est pas enregistrée ou disponible dans Sfax Sud", "error");
      return;
    }
    if (AffecterRue(formData.reference) === "cas1") {
      showCustomAlert("La référence doit contenir 8 chiffres", "error");
      return;
    }
    if (ValiderNum(formData.numClient) === "cas1") {
      showCustomAlert("Le numéro de client doit contenir 8 chiffres", "error");
      return;
    }
    if (ValiderNum(formData.numClient) === "cas2") {
      showCustomAlert("Le numéro de client n'est pas un numéro tunisien valide", "error");
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
      equipeId: null,
      serviceInterventionId: 0,
      rue: AffecterRue(formData.reference),
      etatSauvgarder: "NON_ARCHIVER",
      Position2Km: AffecterPosition(formData.reference),
      citoyen: userData.id
    };

    try {
      const url = editReclamation
        ? `http://localhost:8080/reclamations/${editReclamation.id}`
        : 'http://localhost:8080/reclamations';
      const method = editReclamation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (editReclamation) {
        setReclamations(reclamations.map(rec => rec.id === editReclamation.id ? { ...rec, ...payload } : rec));
        showCustomAlert("Réclamation modifiée avec succès !", "success");
      } else {
        const newReclamation = await response.json();
        setReclamations([...reclamations, newReclamation]);
        showCustomAlert("Réclamation ajoutée avec succès !", "success");
      }

      toggleModal();
    } catch (e) {
      console.error("Erreur lors de l'opération sur la réclamation:", e);
      showCustomAlert(`Erreur: ${e.message}`, "error");
    }
  };

  const handleEdit = (reclamation) => {
    setEditReclamation(reclamation);
    setFormData({
      reference: reclamation.reference,
      numClient: reclamation.numClient.toString(),
      typePanne: reclamation.typePanne,
      genrePanne: reclamation.genrePanne,
      importance: reclamation.importance,
      etat: reclamation.etat,
      serviceInterventionId: reclamation.serviceInterventionId,
      citoyen: userData.id
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/reclamations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setReclamations(reclamations.filter(rec => rec.id !== id));
      showCustomAlert("Réclamation supprimée avec succès !", "success");
    } catch (e) {
      console.error("Erreur lors de la suppression de la réclamation:", e);
      showCustomAlert(`Erreur: ${e.message}`, "error");
    }
  };

  const showConfirmPopup = (action, message) => {
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    setReclamations([...reclamations].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    }));
  };

  // Sort reclamations by heureReclamation (descending) and take the top 3
  const recentReclamations = [...reclamations]
    .sort((a, b) => new Date(b.heureReclamation) - new Date(a.heureReclamation))
    .slice(0, 3);

  const CustomAlert = () => {
    if (!alert.show) return null;

    const alertStyles = {
      info: {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        )
      },
      success: {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        )
      },
      warning: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        )
      },
      error: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        )
      }
    };

    const style = alertStyles[alert.type];

    return (
      <motion.div
        className="fixed top-5 right-5 z-[100] max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className={`flex p-4 mb-4 ${style.bg} ${style.text} border-l-4 ${style.border} rounded-lg shadow-md`} role="alert">
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 mr-2">
            {style.icon}
          </div>
          <div className="ml-3 text-sm font-medium">
            {alert.message}
          </div>
          <button
            type="button"
            className={`ml-auto -mx-1.5 -my-1.5 ${style.bg} ${style.text} rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex h-8 w-8`}
            onClick={() => setAlert(prev => ({ ...prev, show: false }))}
          >
            <span className="sr-only">Fermer</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      </motion.div>
    );
  };

  const ConfirmModal = () => {
    if (!showConfirmModal) return null;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirmation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{confirmMessage}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Gestion des Réclamations" />
      <ToastContainer />
      <CustomAlert />
      <ConfirmModal />

      <motion.div
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Vos Réclamations Récentes</h2>
            <button
              onClick={toggleModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Ajouter Réclamation
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Consultez vos trois réclamations les plus récentes ci-dessous.
          </p>
        </div>

        {/* Modern Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['reference', 'numClient', 'typePanne', 'genrePanne', 'importance', 'etat', 'rue'].map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        <FaSort className="ml-2" />
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentReclamations.length > 0 ? (
                  recentReclamations.map((reclamation) => (
                    <tr key={reclamation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.reference}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.numClient}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.typePanne}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.genrePanne}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.importance}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.etat}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{reclamation.rue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => showConfirmPopup(() => handleEdit(reclamation), "Voulez-vous vraiment modifier cette réclamation ?")}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => showConfirmPopup(() => handleDelete(reclamation.id), "Voulez-vous vraiment supprimer cette réclamation ?")}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucune réclamation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {showModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{editReclamation ? 'Modifier la Réclamation' : 'Ajouter une Réclamation'}</h3>
              <button onClick={toggleModal} className="text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Référence</label>
                    <input
                      type="text"
                      id="reference"
                      placeholder="Entrez la référence"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.reference}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="numClient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro Client</label>
                    <input
                      type="number"
                      id="numClient"
                      placeholder="Entrez le numéro client"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.numClient}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="typePanne" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type de Panne</label>
                    <select
                      id="typePanne"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.typePanne}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="TYPE1">TYPE1</option>
                      <option value="TYPE2">TYPE2</option>
                      <option value="TYPE3">TYPE3</option>
                      <option value="TYPE4">TYPE4</option>
                      <option value="TYPE5">TYPE5</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="genrePanne" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Genre de Panne</label>
                    <select
                      id="genrePanne"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.genrePanne}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="ELECTRICITE">Électricité</option>
                      <option value="GAZ">Gaz</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="importance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Importance</label>
                    <select
                      id="importance"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.importance}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="CRITIQUE">Critique</option>
                      <option value="IMPORTANTE">Importante</option>
                      <option value="MOYENNE">Moyenne</option>
                      <option value="FAIBLE">Faible</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={toggleModal}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    {editReclamation ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default AddReclamation;