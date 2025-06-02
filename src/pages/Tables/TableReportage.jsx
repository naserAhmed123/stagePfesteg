import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, AlertCircle, FileText, MoreVertical, User } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReportageTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    idReportage: null,
    idCitoyen: null,
    idIntervention: null,
    typeReportage: '',
    dateReportage: '',
    acceptation: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const showCustomAlert = (message, type) => {
    if (type === 'success') {
      toast.success(message, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else if (type === 'error') {
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Parse JWT
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

  // Fetch reportages
  useEffect(() => {
    const fetchReportages = async () => {
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

  const handleUpdateReportage = (reportage) => {
    setUpdateForm({
      idReportage: reportage.idReportage,
      idCitoyen: reportage.idCitoyen,
      idIntervention: reportage.idIntervention,
      typeReportage: reportage.typeReportage || '',
      dateReportage: reportage.dateReportage,
      acceptation: reportage.acceptation,
    });
    setUpdateModal(reportage);
    setOpenDropdown(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }

      if (!updateForm.typeReportage) {
        showCustomAlert('Veuillez sélectionner un type de reportage.', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/reportages/${updateForm.idReportage}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de la mise à jour: ${response.status} ${response.statusText}`);
      }

      const updatedReportage = await response.json();
      setData((prevData) =>
        prevData.map((reportage) =>
          reportage.idReportage === updatedReportage.idReportage ? updatedReportage : reportage
        )
      );
      showCustomAlert('Reportage mis à jour avec succès.', 'success');
      setUpdateModal(null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du reportage:', err);
      showCustomAlert(`Erreur: ${err.message}`, 'error');
      if (err.message.includes('token') || err.message.includes('401')) {
        navigate('/login');
      }
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

  const typeReportageOptions = [
    { value: 'SPAM', text: 'Spam' },
    { value: 'DOUTESURIDENTITE', label: 'Doute sur identité' },
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
              <p className="text-gray-600 mt-1">Gérez et consulter les informations des reportages</p>
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
                      <div className="text-gray-600">{reportage.acceptation}</div>
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
                            {reportage.acceptation === 'ENCOURS' && (
                              <button
                                onClick={() => handleUpdateReportage(reportage)}
                                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                              >
                                <FileText className="w-4 h-4" />
                                Mise à jour
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

        {/* Pagination */}
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

        {/* Details Modal */}
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

        {/* Update Modal */}
        {updateModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Mise à jour du Reportage</h2>
                  <p className="text-gray-600">Modifier le type de reportage</p>
                </div>
              </div>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Reportage</label>
                  <input
                    type="text"
                    value={updateForm.idReportage}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom Citoyen</label>
                  <input
                    type="text"
                    value={updateModal.nomCit}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom Service</label>
                  <input
                    type="text"
                    value={updateModal.nomService}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de Reportage</label>
                  <select
                    name="typeReportage"
                    value={updateForm.typeReportage}
                    onChange={handleFormChange}
                    className="mt-1 w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {typeReportageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label || option.text}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date du Reportage</label>
                  <input
                    type="text"
                    value={updateForm.dateReportage}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Acceptation</label>
                  <input
                    type="text"
                    value={updateForm.acceptation}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setUpdateModal(null)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitUpdate}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportageTable;