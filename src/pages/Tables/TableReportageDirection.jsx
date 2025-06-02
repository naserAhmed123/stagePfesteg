import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, AlertCircle, FileText, MoreVertical, User, Check, X, Trash2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReportageTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const showCustomAlert = (message, type) => {
    const toastConfig = {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };
    if (type === 'success') {
      toast.success(message, toastConfig);
    } else if (type === 'error') {
      toast.error(message, toastConfig);
    }
  };

  const parseJwt = (token) => {
    if (!token) {
      showCustomAlert('Aucun token trouvé. Veuillez vous connecter.', 'error');
      navigate('/login');
      return null;
    }
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
      navigate('/login');
      return null;
    }
  };

  useEffect(() => {
    const fetchReportages = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token trouvé');

        const decoded = parseJwt(token);
        if (!decoded) throw new Error('Token JWT invalide ou mal formé');

        const response = await fetch('http://localhost:8080/api/reportages', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération des reportages: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        setLoading(false);
        showCustomAlert('Reportages chargés avec succès', 'success');
      } catch (err) {
        console.error('Erreur lors de la récupération des reportages:', err);
        setError(err.message);
        setLoading(false);
        showCustomAlert(`Erreur: ${err.message}`, 'error');
        if (err.message.includes('token') || err.message.includes('JWT')) {
          navigate('/login');
        }
      }
    };

    fetchReportages();
  }, [navigate]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((reportage) =>
      String(reportage.idReportage || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const toggleDropdown = (id) => {
    setOpenDropdown(prev => prev === id ? null : id);
  };

  const handleViewDetails = (reportage) => {
    setDetailsModal(reportage);
    setOpenDropdown(null);
  };

  const confirmAction = (reportage, action) => {
    setConfirmation({ reportage, action });
    setOpenDropdown(null);
  };

  const executeAction = async () => {
    if (!confirmation) return;
    const { reportage, action } = confirmation;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      if (action === 'accept') {
        const response = await fetch(`http://localhost:8080/api/reportages/${reportage.idReportage}/accept`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur lors de l'acceptation: ${response.status}`);
        }

        const updatedReportage = await response.json();
        const blockResponse = await fetch(`http://localhost:8080/api/citoyens/${reportage.idCitoyen}/bloquer`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!blockResponse.ok) {
          const errorData = await blockResponse.json();
          throw new Error(errorData.message || `Erreur lors du blocage du citoyen: ${blockResponse.status}`);
        }

        setData((prevData) =>
          prevData.map((item) =>
            item.idReportage === updatedReportage.idReportage ? updatedReportage : item
          )
        );
        showCustomAlert('Reportage accepté et citoyen bloqué avec succès.', 'success');
      } else if (action === 'refuse') {
        const response = await fetch(`http://localhost:8080/api/reportages/${reportage.idReportage}/refuse`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur lors du refus: ${response.status}`);
        }

        const updatedReportage = await response.json();
        setData((prevData) =>
          prevData.map((item) =>
            item.idReportage === updatedReportage.idReportage ? updatedReportage : item
          )
        );
        showCustomAlert('Reportage refusé avec succès.', 'success');
      } else if (action === 'archive') {
        const response = await fetch(`http://localhost:8080/api/reportages/${reportage.idReportage}/archive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur lors de l'archivage: ${response.status}`);
        }

        setData((prevData) =>
          prevData.filter((item) => item.idReportage !== reportage.idReportage)
        );
        showCustomAlert('Reportage archivé avec succès.', 'success');
      }

      setConfirmation(null);
    } catch (err) {
      console.error(`Erreur lors de l'action ${action}:`, err);
      showCustomAlert(`Erreur: ${err.message}`, 'error');
      if (err.message.includes('token') || err.message.includes('401')) {
        navigate('/login');
      }
      setConfirmation(null);
    }
  };

  const getAcceptationStyle = (acceptation) => {
    switch (acceptation) {
      case 'ENCOURS':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ACCEPTER':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'REFUSER':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const headers = [
    { key: 'idReportage', label: 'ID Reportage', icon: FileText },
    { key: 'idCitoyen', label: 'Nom Citoyen', icon: User },
    { key: 'idIntervention', label: 'Nom Service', icon: User },
    { key: 'typeReportage', label: 'Type', icon: FileText },
    { key: 'dateReportage', label: 'Date', icon: FileText },
    { key: 'acceptation', label: 'Acceptation', icon: FileText },
    { key: 'actions', label: 'Actions', icon: MoreVertical },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-2">Erreur de connexion</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-blue-600">Gestion des Reportages</h1>
              <p className="text-gray-600 mt-1">Gérez et consultez les informations des reportages</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ID reportage..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-gray-300 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {filteredData.length} reportages trouvés
            </span>
            <span>•</span>
            <span>Page {currentPage} sur {totalPages}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {headers.map((header) => {
                    const IconComponent = header.icon;
                    return (
                      <th key={header.key} className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span className="font-semibold text-sm">{header.label}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((reportage) => (
                  <tr key={reportage.idReportage} className="hover:bg-blue-50 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{reportage.idReportage}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{reportage.nomCit}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{reportage.nomService}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-mono text-sm">
                        {reportage.typeReportage}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{reportage.dateReportage}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium border shadow-sm ${getAcceptationStyle(
                          reportage.acceptation
                        )}`}
                      >
                        {reportage.acceptation}
                      </div>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => toggleDropdown(reportage.idReportage)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                        Actions
                      </button>
                      {openDropdown === reportage.idReportage && (
                        <div className="absolute right-6 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
                          <div className="py-2">
                            <button
                              onClick={() => handleViewDetails(reportage)}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            {reportage.acceptation === 'ENCOURS' ? (
                              <>
                                <button
                                  onClick={() => confirmAction(reportage, 'accept')}
                                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                                >
                                  <Check className="w-4 h-4" />
                                  Accepter
                                </button>
                                <button
                                  onClick={() => confirmAction(reportage, 'refuse')}
                                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                                >
                                  <X className="w-4 h-4" />
                                  Refuser
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => confirmAction(reportage, 'archive')}
                                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:scale-105 disabled:bg-gray-100 disabled:text-gray-400 disabled:scale-100 transition-all duration-200 shadow-lg border border-gray-200"
            >
              Précédent
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-lg border border-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:scale-105 disabled:bg-gray-100 disabled:text-gray-400 disabled:scale-100 transition-all duration-200 shadow-lg border border-gray-200"
            >
              Suivant
            </button>
          </div>
        )}

        {detailsModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Détails du Reportage</h2>
                  <p className="text-gray-600">Informations complètes</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">ID Reportage</p>
                    <p className="font-semibold">{detailsModal.idReportage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Nom Citoyen</p>
                    <p className="font-semibold">{detailsModal.nomCit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Nom Service</p>
                    <p className="font-semibold">{detailsModal.nomService}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Type de Reportage</p>
                    <p className="font-semibold">{detailsModal.typeReportage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Date du Reportage</p>
                    <p className="font-semibold">{detailsModal.dateReportage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Acceptation</p>
                    <p className="font-semibold">{detailsModal.acceptation}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setDetailsModal(null)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmation && (
          <div
            className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4"
            role="dialog"
            aria-labelledby="confirmation-title"
            aria-modal="true"
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-yellow-500">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 id="confirmation-title" className="text-2xl font-bold text-gray-800">
                    Confirmer l'action
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {confirmation.action === 'archive' ? (
                      <>
                        Voulez-vous vraiment supprimer ce reportage ? Il sera déplacé vers les archives.
                        <span className="block text-red-600 font-medium mt-1">
                          Cette action est irréversible sans accès aux archives.
                        </span>
                      </>
                    ) : (
                      <>
                        Voulez-vous vraiment{' '}
                        {confirmation.action === 'accept' ? 'accepter' : 'refuser'} ce reportage ?
                        {confirmation.action === 'accept' && (
                          <span className="block text-red-600 font-medium mt-1">
                            Le citoyen sera bloqué.
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setConfirmation(null)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={executeAction}
                  className={`px-6 py-3 text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 ${
                    confirmation.action === 'accept'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
                      : confirmation.action === 'refuse'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-400'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
                  }`}
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
};

export default ReportageTable;
