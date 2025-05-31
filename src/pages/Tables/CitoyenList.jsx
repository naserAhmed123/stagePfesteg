import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";

import { Search, Eye, FileText, AlertCircle, Users, Phone, Mail, MapPin, MoreVertical, User, Shield, Hash } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CitoyenTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [referencesModal, setReferencesModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const [reportageModal, setReportageModal] = useState(null);
  const [reportageForm, setReportageForm] = useState({
    idCitoyen: null,
    idIntervention: null,
    typeReportage: '',
    dateReportage: new Date().toISOString().split('T')[0],
    acceptation: 'ENCOURS',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

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
        setReportageForm((prev) => ({
          ...prev,
          idIntervention: userData.id || null,
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

  const parseJwt = (token) => {
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
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/citoyens', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error('Échec de la récupération des données');
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((citoyen) =>
      String(citoyen.carteIdentite || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleReportage = (citoyen) => {
    setReportageModal(citoyen);
    setReportageForm({
      idCitoyen: citoyen.id,
      idIntervention: reportageForm.idIntervention,
      typeReportage: '',
      dateReportage: new Date().toISOString().split('T')[0],
      acceptation: 'ENCOURS',
    });
    setOpenDropdown(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setReportageForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitReportage = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }

      if (!reportageForm.typeReportage) {
        showCustomAlert('Veuillez sélectionner un type de reportage', 'error');
        return;
      }

      const response = await fetch('http://localhost:8080/api/reportages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportageForm),
      });

      if (!response.ok) {
        throw new Error(`Échec de la création du reportage: ${response.status} ${response.statusText}`);
      }

      showCustomAlert('Reportage créé avec succès', 'success');
      setReportageModal(null);
      setShowConfirmation(false);
    } catch (err) {
      console.error('Erreur lors de la création du reportage:', err);
      showCustomAlert(`Erreur: ${err.message}`, 'error');
    }
  };

  const confirmSubmission = () => {
    setShowConfirmation(true);
  };

  const handleViewDetails = (citoyen) => {
    setDetailsModal(citoyen);
    setOpenDropdown(null);
  };
  const DirectionAjout = () =>{
              navigate("/AjouterReclamation");
  }

  const handleAddReclamation = (citoyen) => {
    console.log(`Ajouter réclamation pour citoyen ID: ${citoyen.id}`);
    setOpenDropdown(null);
  };

  const handleViewReferences = (citoyen) => {
    setReferencesModal(citoyen);
    setOpenDropdown(null);
  };

  const headers = [
    { key: 'nom', label: 'Nom', icon: User },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'carteIdentite', label: 'Carte d\'identité', icon: FileText },
    { key: 'numTelephone', label: 'Téléphone', icon: Phone },
    { key: 'adress', label: 'Adresse', icon: MapPin },
    { key: 'references', label: 'Références', icon: FileText },
    { key: 'actions', label: 'Actions', icon: MoreVertical },
  ];

  const typeReportageOptions = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'DOUTESURIDENTITE', label: 'Doute suridentite' },
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
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-blue-600">
                Gestion des Citoyens
              </h1>
              <p className="text-gray-600 mt-1">Gérez et consultez les informations des citoyens</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par carte d'identité..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {filteredData.length} citoyens trouvés
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
                {paginatedData.map((citoyen) => (
                  <tr
                    key={citoyen.id}
                    className="hover:bg-blue-50 transition-all duration-300"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {citoyen.nom?.charAt(0)?.toUpperCase() || 'N'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{citoyen.nom}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {citoyen.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-mono text-sm">
                          {citoyen.carteIdentite}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {citoyen.numTelephone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="max-w-32 truncate">{citoyen.adress}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewReferences(citoyen)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        <FileText className="w-4 h-4" />
                        Voir
                      </button>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => toggleDropdown(citoyen.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                        Actions
                      </button>
                      {openDropdown === citoyen.id && (
                        <div className="absolute right-6 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden">
                          <div className="py-2">
                            <button
                              onClick={() => handleReportage(citoyen)}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                            >
                              <FileText className="w-4 h-4" />
                              Reportage
                            </button>
                            <button
                              onClick={() => handleViewDetails(citoyen)}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            <button
                              onClick={() => DirectionAjout()}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                            >
                              <AlertCircle className="w-4 h-4" />
                              Ajouter réclamation
                            </button>
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
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Détails du Citoyen</h2>
                  <p className="text-gray-600">Informations complètes</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">ID</p>
                      <p className="font-semibold">{detailsModal.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Nom</p>
                      <p className="font-semibold">{detailsModal.nom}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">{detailsModal.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Mot de passe</p>
                      <p className="font-semibold">••••••••</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Carte d'identité</p>
                      <p className="font-semibold">{detailsModal.carteIdentite}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-semibold">{detailsModal.numTelephone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="font-semibold">{detailsModal.adress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Références</p>
                      <p className="font-semibold">
                        {detailsModal.references && detailsModal.references.length > 0
                          ? detailsModal.references.join(', ')
                          : 'Aucune référence'
                        }
                      </p>
                    </div>
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

        {/* References Modal */}
        {referencesModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-500 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Références</h2>
                  <p className="text-gray-600">{referencesModal.nom}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                {referencesModal.references && referencesModal.references.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {referencesModal.references.map((ref, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 hover:bg-white transition-colors duration-200">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{ref}</p>
                          <p className="text-sm text-gray-500">Référence #{index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-400 rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune référence</h3>
                    <p className="text-gray-500">Ce citoyen n'a pas encore de références enregistrées.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setReferencesModal(null)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reportage Modal */}
        {reportageModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Nouveau Reportage</h2>
                  <p className="text-gray-600">Créer un reportage pour {reportageModal.nom}</p>
                </div>
              </div>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Citoyen</label>
                  <input
                    type="text"
                    value={reportageForm.idCitoyen}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Service Intervention</label>
                  <input
                    type="text"
                    value={reportageForm.idIntervention || 'Chargement...'}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de Reportage</label>
                  <select
                    name="typeReportage"
                    value={reportageForm.typeReportage}
                    onChange={handleFormChange}
                    className="mt-1 w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {typeReportageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date du Reportage</label>
                  <input
                    type="date"
                    value={reportageForm.dateReportage}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Acceptation</label>
                  <input
                    type="text"
                    value={reportageForm.acceptation}
                    readOnly
                    className="mt-1 w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setReportageModal(null)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmSubmission}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Reporter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-yellow-500 rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Confirmer le Reportage</h2>
                  <p className="text-gray-600">Voulez-vous vraiment soumettre ce reportage ?</p>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReportage}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg"
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

export default CitoyenTable;