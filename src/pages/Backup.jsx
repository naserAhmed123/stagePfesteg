import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, RotateCcw, Eye, X, Key } from 'lucide-react';

const BackupPage = () => {
  const [selectedEntity, setSelectedEntity] = useState('Rapport');
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('includes');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRestoreZone, setShowRestoreZone] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [isKeyVerified, setIsKeyVerified] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(true);
  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const dropZoneRef = useRef(null);
  const itemsPerPage = 8;

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
      showAlert('Problème avec votre session. Veuillez vous reconnecter.', 'error');
      return null;
    }
  };

  const token = localStorage.getItem('token');
  const decoded = parseJwt(token);
  const email = decoded?.email || null;

  const entityConfig = {
    Equipe: {
      endpoint: 'equipes/archived',
      restore: (id) => `equipes/${id}/restore`,
      fields: ['id', 'nom', 'idDeArchive'],
      idField: 'idDeArchive',
      icon: '👥',
      label: 'Équipes',
    },
    Materiel: {
      endpoint: 'api/materiels/archived',
      restore: (id) => `api/materiels/restore/${id}`,
      fields: ['id', 'name', 'reference', 'status', 'lastUpdated', 'idDeArchive'],
      idField: 'idDeArchive',
      icon: '⚙️',
      label: 'Matériel',
    },
    Plainte: {
      endpoint: 'api/plaintes/archived',
      restore: (id) => `api/plaintes/restore/${id}`,
      fields: ['id', 'referenceRec', 'etatRef', 'datePlainte', 'numClient', 'nomClient', 'Descrip', 'idDeArchive'],
      idField: 'idDeArchive',
      icon: '📝',
      label: 'Plaintes',
    },
    Rapport: {
      endpoint: 'api/rapports/archived',
      restore: (reference) => `/api/rapports/restore/${reference}`,
      fields: ['referenceRapport', 'titreRapport', 'Cont', 'typeRapport', 'dateRapport'],
      idField: 'referenceRapport',
      icon: '📊',
      label: 'Rapports',
    },
    Reclamation: {
      endpoint: 'reclamations/archiver',
      restore: (id) => `reclamations/restore/${id}`,
      fields: ['id', 'reference', 'typePanne', 'numClient', 'genrePanne', 'heureReclamation', 'etat', 'importance', 'Position2Km', 'idDeArchive'],
      idField: 'idDeArchive',
      icon: '🔧',
      label: 'Réclamations',
    },
    Reportage: {
      endpoint: 'api/reportages/archived',
      restore: (id) => `api/reportages/${id}/restore`,
      fields: ['idReportage', 'idCitoyen', 'idIntervention', 'dateReportage', 'typeReportage', 'acceptation', 'idDeArchive'],
      idField: 'idDeArchive',
      icon: '📰',
      label: 'Reportages',
    },
  };

  const fieldLabels = {
    id: 'ID', nom: 'Nom', name: 'Nom', reference: 'Référence', status: 'Statut', lastUpdated: 'Dernière MàJ',
    referenceRec: 'Réf. Réclamation', etatRef: 'État', datePlainte: 'Date Plainte', numClient: 'N° Client',
    nomClient: 'Nom Client', Descrip: 'Description', referenceRapport: 'Réf. Rapport', titreRapport: 'Titre Rapport',
    Cont: 'Contenu', typeRapport: 'Type Rapport', dateRapport: 'Date Rapport', typePanne: 'Type Panne',
    genrePanne: 'Genre Panne', heureReclamation: 'Heure', etat: 'État', importance: 'Importance',
    Position2Km: 'Position (2km)', idReportage: 'ID Reportage', idCitoyen: 'ID Citoyen',
    idIntervention: 'ID Intervention', dateReportage: 'Date Reportage', typeReportage: 'Type Reportage',
    acceptation: 'Acceptation', idDeArchive: 'ID Archive',
  };

  useEffect(() => {
    if (isKeyVerified && email) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`http://localhost:8080/${entityConfig[selectedEntity].endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          console.log('Fetched data:', result);
          if (selectedEntity !== 'Rapport' && Array.isArray(result)) {
            const missingArchiveIds = result.filter(item => !item.idDeArchive);
            if (missingArchiveIds.length > 0) {
              console.warn(`Missing idDeArchive for ${selectedEntity}:`, missingArchiveIds);
              showAlert(`Certains ${entityConfig[selectedEntity].label.toLowerCase()} n’ont pas d’ID d’archive.`, 'warning');
            }
          }
          setData(Array.isArray(result) ? result : []);
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
          setData([]);
          showAlert('Erreur lors du chargement des données', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else if (!email) {
      showAlert('Session invalide. Veuillez vous reconnecter.', 'error');
      setShowKeyModal(true);
    }
  }, [selectedEntity, isKeyVerified, email]);

  const generateAndSendKey = async () => {
    if (!email) {
      setKeyError('Email non disponible. Veuillez vous reconnecter.');
      return;
    }
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      const response = await fetch('http://localhost:8080/api/secret/send-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, key }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      showAlert('Clé envoyée à votre email !', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la clé:', error);
      showAlert('Erreur lors de l\'envoi de la clé', 'error');
    }
  };

  const verifyKey = async () => {
    if (!enteredKey) {
      setKeyError('Veuillez entrer la clé secrète');
      return;
    }
    if (!email) {
      setKeyError('Email non disponible. Veuillez vous reconnecter.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/api/secret/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, key: enteredKey }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const { verified } = await response.json();
      if (verified) {
        setIsKeyVerified(true);
        setShowKeyModal(false);
        localStorage.setItem('keyVerified', 'true');
        showAlert('Clé vérifiée avec succès !', 'success');
      } else {
        setKeyError('Clé incorrecte.');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la clé:', error);
      setKeyError('Erreur lors de la vérification.');
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const CustomAlert = () => {
    if (!alert.show) return null;
    const styles = {
      info: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg> },
      success: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
      error: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', icon: <X className="w-5 h-5" /> },
      warning: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.342 11.315A2 2 0 0116.342 17H3.658a2 2 0 01-1.743-2.586L8.257 3.099zM10 15a1 1 0 100-2 1 1 0 000 2zm0-8a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> },
    };
    const { bg, border, text, icon } = styles[alert.type] || styles.info;
    return (
      <div className="fixed top-4 right-4 max-w-sm z-50">
        <div className={`flex p-3 ${bg} ${text} border-l-4 ${border} rounded-lg shadow`}>
          <div className="mr-2">{icon}</div>
          <div className="flex-1 text-sm">{alert.message}</div>
          <button onClick={() => setAlert({ show: false })} className="ml-2 p-1 rounded hover:bg-opacity-75"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  const KeyVerificationModal = () => {
    if (!showKeyModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-sm w-full p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-3">Vérification</h3>
          <p className="text-gray-600 text-center mb-4">Entrez la clé secrète envoyée à votre email.</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700">Clé Secrète</label>
              <input
                type="text"
                id="key"
                placeholder="Entrez la clé"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {keyError && <p className="text-red-600 text-sm mt-1">{keyError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateAndSendKey}
                disabled={!email}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Envoyer
              </button>
              <button
                onClick={verifyKey}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Vérifier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const confirmRestore = (item) => {
    console.log('Item to restore:', item);
    setItemToRestore(item);
    setShowConfirmModal(true);
  };

  const handleRestore = async () => {
    if (!itemToRestore) return;
    setIsLoading(true);
    try {
      const idField = entityConfig[selectedEntity].idField;
      if (!itemToRestore[idField]) {
        throw new Error(`Identifiant ${idField} manquant pour ${selectedEntity}`);
      }
      const restoreUrl = `http://localhost:8080/${entityConfig[selectedEntity].restore(itemToRestore[idField])}`;
      console.log('Restore URL:', restoreUrl);
      const response = await fetch(restoreUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText || 'No details provided'}`);
      }
      setData(data.filter((d) => d[idField] !== itemToRestore[idField]));
      showAlert('Élément récupéré !', 'success');
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      showAlert(`Erreur lors de la récupération: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      setShowRestoreZone(false);
      setShowConfirmModal(false);
      setItemToRestore(null);
    }
  };

  const handleDragStart = (e, item) => {
    setIsDragging(true);
    setDraggedItem(item);
    setShowRestoreZone(true);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setTimeout(() => setShowRestoreZone(false), 2000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const item = JSON.parse(e.dataTransfer.getData('text/plain'));
    confirmRestore(item);
    setIsDragging(false);
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const filteredData = data.filter((item) =>
    entityConfig[selectedEntity].fields.some((field) =>
      searchType === 'includes'
        ? String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
        : String(item[field] || '').toLowerCase() === searchTerm.toLowerCase()
    )
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getItemDisplayName = (item) => {
    const { fields } = entityConfig[selectedEntity];
    return item[fields[1]] || item[fields[0]] || 'Élément';
  };

  if (!isKeyVerified || !email) return <><CustomAlert /><KeyVerificationModal /></>;

  return (
    <div className="p-4 bg-white">
      <CustomAlert />
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Archives</h1>
          <p className="text-gray-600">Gérez vos données archivées</p>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {Object.entries(entityConfig).map(([entity, { icon, label }]) => (
            <div
              key={entity}
              className={`min-w-[160px] p-4 rounded-lg border-2 cursor-pointer hover:bg-blue-50 transition ${
                selectedEntity === entity ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedEntity(entity);
                setCurrentPage(1);
                setSearchTerm('');
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <div>
                  <h3 className={selectedEntity === entity ? 'text-white' : 'text-gray-800'}>{label}</h3>
                  <p className={`text-sm ${selectedEntity === entity ? 'text-blue-100' : 'text-gray-500'}`}>
                    {data.length} éléments
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="includes">Contient</option>
              <option value="equals">Exact</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50 border-b border-gray-200">
                      {entityConfig[selectedEntity].fields.map((field) => (
                        <th key={field} className="py-3 px-4 text-left text-blue-600 font-semibold uppercase text-sm">
                          {fieldLabels[field] || field}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-left text-blue-600 font-semibold uppercase text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-100 hover:bg-blue-50 cursor-move group ${draggedItem === item ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                      >
                        {entityConfig[selectedEntity].fields.map((field) => (
                          <td key={field} className="py-3 px-4 text-gray-700">{item[field]?.toString() || '-'}</td>
                        ))}
                        <td className="py-3 px-4">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => confirmRestore(item)}
                              disabled={!item[entityConfig[selectedEntity].idField]}
                              className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              title="Restaurer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-600" title="Voir">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center py-4 border-t border-gray-200 bg-blue-50">
                  <nav className="flex gap-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 text-blue-600 disabled:opacity-50 hover:bg-blue-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        totalPages <= 5 ? i + 1 :
                        currentPage <= 3 ? i + 1 :
                        currentPage >= totalPages - 2 ? totalPages - 4 + i :
                        currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`px-3 py-1 rounded-lg border border-gray-200 ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 text-blue-600 disabled:opacity-50 hover:bg-blue-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        <div
          ref={dropZoneRef}
          className={`transition duration-300 ${showRestoreZone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className={`p-6 rounded-lg border-2 border-dashed ${isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDragging ? 'bg-blue-600' : 'bg-blue-400'}`}>
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-lg font-bold ${isDragging ? 'text-blue-600' : 'text-gray-800'}`}>
                {isDragging ? 'Relâcher pour Restaurer' : 'Zone de Restauration'}
              </h3>
              <p className={`text-gray-600 ${isDragging ? 'text-blue-500' : ''}`}>
                {isDragging ? 'Déposez ici' : 'Glissez les éléments ici'}
              </p>
            </div>
          </div>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-sm w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.342 11.315A2 2 0 0116.342 17H3.658a2 2 0 01-1.743-2.586L8.257 3.099zM10 15a1 1 0 100-2 1 1 0 000 2zm0-8a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-3">Confirmer</h3>
              <p className="text-gray-600 text-center mb-4">Restaurer "{getItemDisplayName(itemToRestore)}" ?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Annuler
                </button>
                <button
                  onClick={handleRestore}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Restauration...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" /> Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default React.memo(BackupPage);