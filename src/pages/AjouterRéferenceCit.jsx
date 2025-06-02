
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from '../components/common/PageBreadCrumb'; // Adjust path as needed

const AddReference = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    id: '',
    nom: '',
    numTelephone: '',
  });
  const [references, setReferences] = useState([]);
  const [formData, setFormData] = useState({
    newReference: '',
  });

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
          numTelephone: userData.numTelephone || '',
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

    fetchReferences();
  }, [userData.id]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const validateReference = (ref) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) return 'La référence doit contenir exactement 8 chiffres';
    if (!/^\d+$/.test(refStr)) return 'La référence doit être un nombre';
    if (references.includes(parseInt(refStr, 10))) return 'Cette référence existe déjà';
    return null;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
 if (AffecterRue(formData.newReference) === null) {
      alert("La référence n'est pas enregistrée ou disponible dans Sfax Sud", 'error');
      return;
    }
    const newReference = formData.newReference.trim();
    const validationError = validateReference(newReference);
    if (validationError) {
      toast.error(validationError, {
        position: 'top-right',
        autoClose: 5000,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/citoyens/${userData.id}/references`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parseInt(newReference, 10)),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const updatedCitoyen = await response.json();
      setReferences(updatedCitoyen.references || [...references, parseInt(newReference, 10)]);
      setFormData({ newReference: '' });
      setShowModal(false);
      toast.success('Référence ajoutée avec succès !', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout de la référence:", err);
      toast.error(`Erreur: ${err.message}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    setFormData({ newReference: '' });
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
            <button
              onClick={toggleModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              disabled={!userData.id || loading}
            >
              Ajouter Référence
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Gérez vos références ci-dessous. Chaque référence doit être un numéro unique de 8 chiffres.
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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {references.length > 0 ? (
                  references.map((ref) => (
                    <tr key={ref} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{ref}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="1" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucune référence trouvée.
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
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ajouter une Référence</h3>
              <button onClick={toggleModal} className="text-gray-400 hover:text-gray-500">
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
                    onClick={toggleModal}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Ajouter
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

export default AddReference;
