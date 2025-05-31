import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';

// Utility to debounce search input
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility to get importance color
const getImportanceColor = (importance) => {
  const value = typeof importance === 'object' ? importance?.name || 'N/A' : importance || 'N/A';
  switch (value.toUpperCase()) { // Handle case variations
    case 'IMPORTANTE':
    case 'HIGH':
      return 'bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Utility to safely convert values to strings
const safeToString = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return value.name || JSON.stringify(value);
  return String(value);
};

export default function ReclamationsPage() {
  const [reclamations, setReclamations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'stateChangeTime', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReclamations = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await axios.get(`http://localhost:8080/reclamations/encours/stuck?minutes=5`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      // Map reclamations with fallback to heureReclamation
      const mappedReclamations = response.data.map((reclamation) => ({
        id: reclamation.id,
        reference: reclamation.reference,
        typePanne: safeToString(reclamation.typePanne),
        genrePanne: safeToString(reclamation.genrePanne),
        stateChangeTime: reclamation.stateChangeTime || reclamation.heureReclamation, // Fallback
        importance: safeToString(reclamation.importance),
        rue: safeToString(reclamation.rue),
        Position2Km: reclamation.Position2Km || 'N/A',
        etat: safeToString(reclamation.etat),
        equipeId: reclamation.equipeId || 'N/A',
      }));

      setReclamations(mappedReclamations);
      toast.success('Réclamations chargées avec succès', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des réclamations:', err);
      let errorMessage = err.message || 'Erreur lors de la récupération des réclamations';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Non autorisé : veuillez vous reconnecter.';
        } else {
          errorMessage = `Erreur ${err.response.status}: ${err.response.data.message || err.response.statusText}`;
        }
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
    fetchReclamations();
    const interval = setInterval(fetchReclamations, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Sort and filter reclamations
  const sortedAndFilteredReclamations = useMemo(() => {
    let result = [...reclamations];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (reclamation) =>
          safeToString(reclamation.reference).toLowerCase().includes(searchTerm.toLowerCase()) ||
          safeToString(reclamation.Position2Km).toLowerCase().includes(searchTerm.toLowerCase()) ||
          safeToString(reclamation.equipeId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'stateChangeTime') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          aValue = safeToString(aValue).toLowerCase();
          bValue = safeToString(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [reclamations, searchTerm, sortConfig]);

  // Pagination
  const paginatedReclamations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedAndFilteredReclamations.slice(start, end);
  }, [sortedAndFilteredReclamations, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedAndFilteredReclamations.length / pageSize);

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  }, 300);

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('Réclamations en Cours (>5 min) - Rapport', 10, 20);

      autoTable(doc, {
        startY: 30,
        head: [['Référence', 'Type Panne', 'Genre Panne', 'Début ENCOURS', 'Importance', 'Rue', 'Position', 'Équipe']],
        body: sortedAndFilteredReclamations.map((reclamation) => [
          safeToString(reclamation.reference),
          safeToString(reclamation.typePanne),
          safeToString(reclamation.genrePanne),
          moment(reclamation.stateChangeTime).format('DD/MM/YYYY HH:mm'),
          safeToString(reclamation.importance),
          safeToString(reclamation.rue),
          safeToString(reclamation.Position2Km),
          safeToString(reclamation.equipeId),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 },
      });

      doc.save(`Reclamations_ENCOURS_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`);
      toast.success('PDF téléchargé avec succès', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Échec de la génération du PDF', {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

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

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            Réclamations <span className="text-blue-600">En Cours plus 5 min</span>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par référence, position ou équipe..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Rechercher des réclamations"
              />
              <svg
                className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"
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
            <button
              onClick={downloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
              aria-label="Télécharger le rapport PDF"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exporter PDF
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto"
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
            Chargement...
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 py-4">
            Erreur: {error}
            <button onClick={fetchReclamations} className="ml-4 text-blue-600 underline">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && paginatedReclamations.length === 0 && (
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
            <p className="mt-2 text-gray-500">Aucune réclamation en cours plus 5 min  trouvée</p>
          </div>
        )}

        {!loading && !error && paginatedReclamations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'reference', label: 'Référence' },
                      { key: 'typePanne', label: 'Type Panne' },
                      { key: 'genrePanne', label: 'Genre Panne' },
                      { key: 'stateChangeTime', label: 'Début ENCOURS' },
                      { key: 'importance', label: 'Importance' },
                      { key: 'rue', label: 'Rue' },
                      { key: 'Position2Km', label: 'Position' },
                      { key: 'equipeId', label: 'Équipe/Technicien' },
                    ].map((header) => (
                      <th
                        key={header.key}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort(header.key)}
                      >
                        {header.label}
                        {sortConfig.key === header.key && (
                          <span className="ml-2">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedReclamations.map((reclamation) => (
                    <tr key={reclamation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {safeToString(reclamation.reference)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {safeToString(reclamation.typePanne)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {safeToString(reclamation.genrePanne)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {moment(reclamation.stateChangeTime).format('HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(
                            reclamation.importance
                          )}`}
                        >
                          {safeToString(reclamation.importance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {safeToString(reclamation.rue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {safeToString(reclamation.Position2Km)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {safeToString(reclamation.equipeId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
              <div className="text-sm text-gray-700">
                Affichage de {(currentPage - 1) * pageSize + 1} à{' '}
                {Math.min(currentPage * pageSize, sortedAndFilteredReclamations.length)} sur{' '}
                {sortedAndFilteredReclamations.length} réclamations
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
