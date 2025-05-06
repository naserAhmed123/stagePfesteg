import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';

const getStatusColor = (statut) => {
  switch (statut) {
    case 'Résolu':
      return 'bg-green-100 text-green-800';
    case 'En cours':
      return 'bg-blue-100 text-blue-800';
    case 'En attente':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'INTERVENTION':
      return 'bg-red-100 text-red-800';
    case 'MAINTENANCE':
      return 'bg-orange-100 text-orange-800';
    case 'INSPECTION':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RapportsPage() {
  const [rapports, setRapports] = useState([]);
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    carteIdentite: '',
    role: '',
    motDePasse: '',
    con: '',
    confirmMotDePasse: '',
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

  const verifierConnexionReseau = () => {
    return navigator.onLine;
  };

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
        setFormData({
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

  const fetchRapports = async () => {
    if (!formData.id) {
      return;
    }

    if (!verifierConnexionReseau()) {
      setError('Pas de connexion Internet. Vérifiez votre réseau et réessayez.');
      toast.error('Pas de connexion Internet. Vérifiez votre réseau et réessayez.', {
        position: 'top-right',
        autoClose: 5000,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      const response = await axios.get(`http://localhost:8080/api/rapports/service-intervention/${formData.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const mappedRapports = response.data.map((rapport) => ({
        id: rapport.referenceRapport,
        reference: rapport.referenceRapport,
        titre: rapport.titreRapport,
        date: new Date(rapport.dateRapport).toLocaleDateString('fr-FR'),
        serviceId: rapport.serviceInterventionId,
        contenu: rapport.Cont,
        typeRapport: rapport.typeRapport,
        statut: 'Résolu',
      }));

      setRapports(mappedRapports);
      toast.success('Rapports chargés avec succès', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des rapports:', err);
      let errorMessage = err.message || 'Erreur lors de la récupération des rapports';
      if (err.response) {
        errorMessage = `Erreur ${err.response.status}: ${err.response.data.message || err.response.statusText}`;
      }
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.id) {
      fetchRapports();
    }
  }, [formData.id]);

  const openModal = (rapport) => {
    setSelectedRapport(rapport);
    setIsModalOpen(true);
    setDownloadStatus('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRapport(null);
  };

  const downloadRapport = () => {
    if (!selectedRapport) return;

    setDownloadStatus('loading');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

    
      const margin = 10;
      let y = 20; 
      const pageHeight = 297; 
      const maxY = pageHeight - 20; 

      const checkPage = () => {
        if (y > maxY) {
          doc.addPage();
          y = 20;
        }
      };

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPPORT TECHNIQUE', margin, y);
      y += 10;
      checkPage();

      doc.setLineWidth(0.5);
      doc.line(margin, y, 200, y);
      y += 10;
      checkPage();

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Référence: ${selectedRapport.reference}`, margin, y);
      y += 7;
      checkPage();
      doc.text(`Titre: ${selectedRapport.titre}`, margin, y);
      y += 7;
      checkPage();
      doc.text(`Date: ${selectedRapport.date}`, margin, y);
      y += 7;
      checkPage();
      doc.text(`Service ID: ${agent.id}`, margin, y);
      y += 7;
      checkPage();
      doc.text(`Statut: ${selectedRapport.statut}`, margin, y);
      y += 7;
      checkPage();
      doc.text(`Type: ${selectedRapport.typeRapport}`, margin, y);
      y += 10;
      checkPage();

      doc.line(margin, y, 200, y);
      y += 10;
      checkPage();

      doc.setFont('helvetica', 'bold');
      doc.text('CONTENU DU RAPPORT:', margin, y);
      y += 7;
      checkPage();
      doc.setFont('helvetica', 'normal');

      const contentLines = doc.splitTextToSize(selectedRapport.contenu, 180); 
      contentLines.forEach((line) => {
        if (y > maxY) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 7;
      });

      y += 5;
      checkPage();
      doc.line(margin, y, 200, y);
      y += 10;
      checkPage();

      doc.setFontSize(10);
      doc.text(
        `Rapport généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`,
        margin,
        y
      );

      doc.save(`Rapport-${selectedRapport.reference}.pdf`);

      setDownloadStatus('success');
      setTimeout(() => {
        setDownloadStatus('');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Échec de la génération du PDF. Veuillez réessayer.', {
        position: 'top-right',
        autoClose: 5000,
      });
      setDownloadStatus('');
    }
  };
const getFormData = () => {
    return formData;
}
const agent = getFormData();
  const getServiceInitials = (serviceId) => {
    return `S${serviceId || '0'}`;
  };

  const filteredRapports = rapports.filter((rapport) =>
    rapport.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rapport.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(rapport.serviceId).includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 lg:mb-0">
            <span className="text-blue-600">Rapports</span> Bureau d'intervention
          </h1>

          <div className="w-full lg:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par référence, titre ou service ID..."
                className="w-full lg:w-80 pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3 text-gray-400 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {loading && <div className="text-center py-4">Chargement des rapports...</div>}
        {error && (
          <div className="text-center text-red-500 py-4">
            Erreur: {error}
            <button onClick={fetchRapports} className="ml-4 text-blue-600 underline">
              Réessayer
            </button>
          </div>
        )}

        {!loading && formData.id && !error && filteredRapports.length === 0 && (
          <div className="text-center py-10">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-gray-500">Aucun rapport ne correspond à votre recherche</p>
          </div>
        )}

        {!loading && formData.id && !error && filteredRapports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRapports.map((rapport) => (
              <div
                key={rapport.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-blue-600 font-semibold">{rapport.reference}</span>
                      <p className="text-gray-700 font-medium mt-1">{rapport.titre}</p>
                      <p className="text-gray-500 text-sm mt-1">{rapport.date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(
                          rapport.statut
                        )}`}
                      >
                        {rapport.statut}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getTypeColor(
                          rapport.typeRapport
                        )}`}
                      >
                        {rapport.typeRapport}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <span className="text-blue-600 font-medium text-sm">
                          {getServiceInitials(rapport.serviceId)}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium">Service ID: {rapport.serviceId}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => openModal(rapport)}
                      className="w-full flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 py-2.5 px-4 rounded-lg transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Voir le rapport
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal pour afficher le rapport complet */}
      {isModalOpen && selectedRapport && agent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Détails du rapport</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-blue-600 font-semibold text-lg">{selectedRapport.reference}</span>
                    <h3 className="text-gray-800 font-medium mt-1">{selectedRapport.titre}</h3>
                    <p className="text-gray-500 text-sm mt-1">{selectedRapport.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(
                        selectedRapport.statut
                      )}`}
                    >
                      {selectedRapport.statut}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getTypeColor(
                        selectedRapport.typeRapport
                      )}`}
                    >
                      {selectedRapport.typeRapport}
                    </span>
                  </div>
                </div>

                <div className="flex items-center mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium">
                      {agent.nom.toString().substring(0 , 1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium">Service ID: {agent.id}</p>
                    <p className="text-gray-500 text-sm">Bureau d'intervention</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-medium text-gray-800 mb-3">Rapport d'intervention</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedRapport.contenu}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-5 rounded-lg transition-colors duration-300"
                >
                  Fermer
                </button>
                <button
                  onClick={downloadRapport}
                  disabled={downloadStatus === 'loading'}
                  className={`${
                    downloadStatus === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white py-2.5 px-5 rounded-lg transition-colors duration-300 flex items-center`}
                >
                  {downloadStatus === 'loading' ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Téléchargement...
                    </>
                  ) : downloadStatus === 'success' ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Téléchargé !
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Télécharger PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}