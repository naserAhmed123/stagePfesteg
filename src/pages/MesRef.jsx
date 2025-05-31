
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit } from 'react-icons/fa';
import PageBreadcrumb from '../components/common/PageBreadCrumb'; // Adjust path as needed

const ManageReferences = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    id: '',
    nom: '',
    carteIdentite: '',
    role: '',
  });
  const [references, setReferences] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [formData, setFormData] = useState({
    newReference: '',
  });
  const [editReference, setEditReference] = useState(null);
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
    const fetchReferences = async () => {
      if (!userData.id) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/citoyens/${userData.id}/references`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Échec de la récupération des références: ${response.status}`);
        }
        const data = await response.json();
        setReferences(data);
        if (data.length === 0) {
          toast.warn('Aucune référence trouvée pour ce citoyen.', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des références:', err);
        toast.error(`Erreur: ${err.message}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

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

    fetchReferences();
    fetchReclamations();
  }, [userData.id]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const validateReference = (ref, oldRef) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) return 'La référence doit contenir exactement 8 chiffres';
    if (!/^\d+$/.test(refStr)) return 'La référence doit être un nombre';
    if (references.includes(parseInt(refStr, 10)) && parseInt(refStr, 10) !== oldRef) {
      return 'Cette référence existe déjà';
    }
    if (reclamations.some((rec) => rec.reference === oldRef)) {
      return 'Cette référence est utilisée dans une réclamation et ne peut pas être modifiée';
    }
    return null;
  };

  const handleEdit = (reference) => {
    setEditReference(reference);
    setFormData({ newReference: reference.toString() });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newReference = formData.newReference.trim();
    const validationError = validateReference(newReference, editReference);
    if (validationError) {
      toast.error(validationError, {
        position: 'top-right',
        autoClose: 5000,
      });
      return;
    }

    const updatedReferences = references.map((ref) =>
      ref === editReference ? parseInt(newReference, 10) : ref
    );

    const confirmEdit = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/citoyens/${userData.id}/references`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedReferences),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const updatedCitoyen = await response.json();
        setReferences(updatedCitoyen.references || updatedReferences);
        setShowEditModal(false);
        setEditReference(null);
        setFormData({ newReference: '' });
        toast.success('Référence modifiée avec succès !', {
          position: 'top-right',
          autoClose: 3000,
        });
      } catch (err) {
        console.error("Erreur lors de la modification de la référence:", err);
        toast.error(`Erreur: ${err.message}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    setConfirmAction(() => confirmEdit);
    setConfirmMessage(`Voulez-vous vraiment modifier la référence ${editReference} en ${newReference} ?`);
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

  const toggleEditModal = () => {
    setShowEditModal(!showEditModal);
    setEditReference(null);
    setFormData({ newReference: '' });
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
      <PageBreadcrumb pageTitle="Gestion des Références" />
      <ToastContainer />

      <motion.div
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Vos Références</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Consultez et modifiez vos références ci-dessous. Les références utilisées dans des réclamations ne peuvent pas être modifiées.
          </p>
        </div>

        {/* References Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Référence
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {references.length > 0 ? (
                  references.map((ref) => (
                    <tr key={ref} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{ref}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(ref)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifier"
                          disabled={loading}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucune référence trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {showEditModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Modifier la Référence</h3>
              <button onClick={toggleEditModal} className="text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="newReference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nouvelle Référence
                  </label>
                  <input
                    type="number"
                    id="newReference"
                    placeholder="Entrez une référence (8 chiffres)"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.newReference}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={toggleEditModal}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Modifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      <ConfirmModal />
    </>
  );
};

export default ManageReferences;
