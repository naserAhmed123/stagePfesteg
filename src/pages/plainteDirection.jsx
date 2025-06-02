import React, { useState, useEffect } from 'react';
import { Eye, X, CheckCircle, Calendar, User, FileText, Hash, Trash2, AlertCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlaintesVerifieesTable = () => {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { id, referenceRec }

  // Fetch plaintes from API
  useEffect(() => {
    fetchPlaintes();
  }, []);

  const fetchPlaintes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/plaintes/verifier');
      if (response.ok) {
        const data = await response.json();
        setPlaintes(data);
      } else {
        console.error('Erreur lors du chargement des plaintes');
        toast.error('Échec du chargement des plaintes vérifiées.');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoir = (plainte) => {
    setSelectedPlainte(plainte);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/plaintes/archive/${id}`, {
        method: 'POST',
      });
      if (response.ok) {
        setPlaintes(plaintes.filter(plainte => plainte.id !== id));
        setConfirmation(null);
        if (selectedPlainte?.id === id) {
          setShowModal(false);
          setSelectedPlainte(null);
        }
        toast.success('Plainte archivée avec succès !');
      } else {
        console.error('Erreur lors de l\'archivage de la plainte');
        toast.error('Échec de l\'archivage de la plainte.');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Erreur de connexion au serveur.');
    }
  };

  const openConfirmation = (id, referenceRec) => {
    setConfirmation({ id, referenceRec });
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'NON_VERIFIE':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <CheckCircle className="h-6 w-6" />
          Plaintes Vérifiées
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {plaintes.length} plainte{plaintes.length > 1 ? 's' : ''} vérifiée{plaintes.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                État
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {plaintes.map((plainte, index) => (
              <tr 
                key={plainte.id} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{plainte.referenceRec}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{plainte.nomClient}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">N° {plainte.numClient}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(plainte.datePlainte)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {plainte.etatRef}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(plainte.verif)}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {plainte.verif === 'VERIFIE' ? 'Vérifiée' : plainte.verif}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleVoir(plainte)}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                      title="Voir les détails"
                      aria-label="Voir les détails de la plainte"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </button>
                    <button
                      onClick={() => openConfirmation(plainte.id, plainte.referenceRec)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-xl text-red-400 dark:text-red-300 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-150"
                      title="Supprimer la plainte"
                      aria-label="Supprimer la plainte"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
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
          <CheckCircle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">Aucune plainte vérifiée</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aucune plainte n'a encore été vérifiée.</p>
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedPlainte && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-labelledby="modal-title" aria-modal="true">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 id="modal-title" className="text-lg font-semibold text-white">Détails de la Plainte Vérifiée</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-slate-200"
                  aria-label="Fermer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{selectedPlainte.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Référence</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{selectedPlainte.referenceRec}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">État Référence</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{selectedPlainte.etatRef}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de Plainte</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{formatDate(selectedPlainte.datePlainte)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Numéro Client</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{selectedPlainte.numClient}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom Client</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{selectedPlainte.nomClient}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Réclamation</label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">{selectedPlainte.reclamationId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedPlainte.verif)}`}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {selectedPlainte.verif === 'VERIFIE' ? 'Vérifiée' : selectedPlainte.verif}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">
                  <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                    {selectedPlainte.Descrip || 'Aucune description disponible'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-b-2xl flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => openConfirmation(selectedPlainte.id, selectedPlainte.referenceRec)}
                className="px-4 py-2 bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors duration-150 text-sm font-medium"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-150 text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmation && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-labelledby="confirmation-title"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-6">
              <h2 id="confirmation-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Confirmer la Suppression
              </h2>
              <button
                onClick={() => setConfirmation(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
                <p className="text-slate-700 dark:text-slate-300">
                  Voulez-vous vraiment supprimer la plainte avec la référence {confirmation.referenceRec} ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 p-6">
              <button
                onClick={() => setConfirmation(null)}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmation.id)}
                className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaintesVerifieesTable;