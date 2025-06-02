import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, X, AlertCircle, Calendar, User, FileText, Hash } from 'lucide-react';

const PlaintesTable = () => {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [plainteToVerify, setPlainteToVerify] = useState(null);

  // Fetch plaintes from API
  useEffect(() => {
    fetchPlaintes();
  }, []);

  const fetchPlaintes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/plaintes/nonverif');
      if (response.ok) {
        const data = await response.json();
        setPlaintes(data);
      } else {
        console.error('Erreur lors du chargement des plaintes');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoir = (plainte) => {
    setSelectedPlainte(plainte);
    setShowModal(true);
  };

  const handleVerifierClick = (plainte) => {
    setPlainteToVerify(plainte);
    setShowConfirmModal(true);
  };

  const handleVerifierConfirm = async () => {
    if (!plainteToVerify) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/plaintes/${plainteToVerify.id}/verifier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh the table after verification
        await fetchPlaintes();
        setShowConfirmModal(false);
        setPlainteToVerify(null);
      } else {
        console.error('Erreur lors de la vérification');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (verif) => {
    switch (verif) {
      case 'VERIFIE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'NON_VERIFIE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Nouvelles Plaintes à Vérifier
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {plaintes.length} plainte{plaintes.length > 1 ? 's' : ''} en attente de vérification
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                État
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plaintes.map((plainte) => (
              <tr key={plainte.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{plainte.referenceRec}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{plainte.nomClient}</span>
                    <span className="text-sm text-gray-500">N° {plainte.numClient}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(plainte.datePlainte)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {plainte.etatRef}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(plainte.verif)}`}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {plainte.verif === 'NON_VERIFIE' ? 'Non Vérifié' : plainte.verif}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleVoir(plainte)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleVerifierClick(plainte)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150"
                      title="Vérifier la plainte"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Vérifier
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plaintes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune plainte</h3>
          <p className="mt-1 text-sm text-gray-500">Toutes les plaintes ont été vérifiées.</p>
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedPlainte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Détails de la Plainte</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedPlainte.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedPlainte.referenceRec}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">État Référence</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedPlainte.etatRef}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de Plainte</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(selectedPlainte.datePlainte)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Client</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedPlainte.numClient}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Client</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedPlainte.nomClient}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Réclamation</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedPlainte.reclamationId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPlainte.verif)}`}>
                      {selectedPlainte.verif === 'NON_VERIFIE' ? 'Non Vérifié' : selectedPlainte.verif}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {selectedPlainte.Descrip || 'Aucune description disponible'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-150"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && plainteToVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmer la vérification</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Êtes-vous sûr de vouloir vérifier cette plainte ?
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium text-gray-700">Plainte: {plainteToVerify.referenceRec}</p>
                <p className="text-sm text-gray-600">Client: {plainteToVerify.nomClient}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPlainteToVerify(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  Annuler
                </button>
                <button
                  onClick={handleVerifierConfirm}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaintesTable;