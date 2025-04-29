import { useState, useEffect } from 'react';
import { Search, PlusCircle, Filter, ArrowDownUp, MoreHorizontal, ChevronLeft, ChevronRight, XCircle, Edit, Eye, Trash2 } from 'lucide-react';

export default function TableauPiecesAvance() {
  const [pieces, setPieces] = useState([]);
  const [piecesFiltrees, setPiecesFiltrees] = useState([]);
  const [motRecherche, setMotRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [configTri, setConfigTri] = useState({ cle: 'name', direction: 'asc' });
  const [statutSelectionne, setStatutSelectionne] = useState('tous');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [pieceSelectionnee, setPieceSelectionnee] = useState(null);
  const [menu, setMenu] = useState(false);
  const elementsParPage = 5;
  const [afficherAjout, setAfficherAjout] = useState(false);
  const [afficherModifier, setAfficherModifier] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'info'
  });
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    reference: '',
    status: '',
    lastUpdated: ''
  });

  useEffect(() => {
    chargerPieces();
  }, []);

  const chargerPieces = async () => {
    try {
      const reponse = await fetch('http://localhost:8080/api/materiels');
      const donnees = await reponse.json();
      const piecesTransformees = donnees.map(materiel => ({
        id: materiel.id,
        name: materiel.name,
        reference: materiel.reference,
        status: materiel.status,
        lastUpdated: materiel.lastUpdated
      }));
      setPieces(piecesTransformees);
      setPiecesFiltrees(piecesTransformees);
    } catch (erreur) {
      console.error("Erreur lors du chargement des pièces:", erreur);
    }
  };

  useEffect(() => {
    let resultat = [...pieces];
    
    if (statutSelectionne !== 'tous') {
      resultat = resultat.filter(piece => piece.status === statutSelectionne);
    }
    
    if (motRecherche) {
      resultat = resultat.filter(piece => 
        piece.name.toLowerCase().includes(motRecherche.toLowerCase()) ||
        piece.reference.toLowerCase().includes(motRecherche.toLowerCase())
      );
    }
    
    if (configTri.cle) {
      resultat = resultat.sort((a, b) => {
        if (a[configTri.cle] < b[configTri.cle]) {
          return configTri.direction === 'asc' ? -1 : 1;
        }
        if (a[configTri.cle] > b[configTri.cle]) {
          return configTri.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setPiecesFiltrees(resultat);
    setPageActuelle(1);
  }, [motRecherche, statutSelectionne, configTri, pieces]);

  const demanderTri = (cle) => {
    let direction = 'asc';
    if (configTri.cle === cle && configTri.direction === 'asc') {
      direction = 'desc';
    }
    setConfigTri({ cle, direction });
  };

  const totalPages = Math.ceil(piecesFiltrees.length / elementsParPage);
  const indexDernierElement = pageActuelle * elementsParPage;
  const indexPremierElement = indexDernierElement - elementsParPage;
  const elementsActuels = piecesFiltrees.slice(indexPremierElement, indexDernierElement);

  const paginer = (numeroDePage) => setPageActuelle(numeroDePage);

  const afficherDetailsPiece = (piece) => {
    setPieceSelectionnee(piece);
    setModalOuvert(true);
  };

  const formaterStatut = (statut) => {
    switch (statut) {
      case 'EN_STOCK':
        return { libelle: 'En stock', couleur: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      case 'EN_COMMANDE':
        return { libelle: 'En commande', couleur: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      case 'RUPTURE':
        return { libelle: 'Rupture', couleur: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
      default:
        return { libelle: statut, couleur: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
    }
  };

  const ouvrirMenu = (idMateriel) => {
    setMenu(menu === idMateriel ? null : idMateriel);
  };

  const showCustomAlert = (message, type = 'info') => {
    setAlert({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const toggleModalAjout = () => {
    setAfficherAjout(!afficherAjout);
    setFormData({
      id: '',
      name: '',
      reference: '',
      status: '',
      lastUpdated: ''
    });
  };

  const toggleModalModifier = () => {
    setAfficherModifier(!afficherModifier);
    if (!afficherModifier) {
      setFormData({
        id: '',
        name: '',
        reference: '',
        status: '',
        lastUpdated: ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = new Date();
    const formattedDateTime = now.toISOString();

    const payload = {
      name: formData.name,
      reference: formData.reference,
      status: formData.status,
      lastUpdated: formattedDateTime,
    };

    try {
      const response = await fetch('http://localhost:8080/api/materiels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setFormData({
        id: '',
        name: '',
        reference: '',
        status: '',
        lastUpdated: ''
      });

      toggleModalAjout();
      showCustomAlert("Pièce ajoutée avec succès !", "success");
      chargerPieces();
    } catch (e) {
      console.error("Erreur lors de l'ajout de la pièce:", e);
      showCustomAlert("Erreur lors de l'ajout de la pièce", "error");
    }
  };

  const modifierPiece = (piece) => {
    setFormData({
      id: piece.id,
      name: piece.name,
      reference: piece.reference,
      status: piece.status,
      lastUpdated: piece.lastUpdated
    });
    setAfficherModifier(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const now = new Date();
    const formattedDateTime = now.toISOString();

    const payload = {
      name: formData.name,
      reference: formData.reference,
      status: formData.status,
      lastUpdated: formattedDateTime,
    };

    try {
      const response = await fetch(`http://localhost:8080/api/materiels/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setFormData({
        name: '',
        reference: '',
        status: '',
      });

      toggleModalModifier();
      showCustomAlert("Pièce modifiée avec succès !", "success");
      chargerPieces();
    } catch (e) {
      console.error("Erreur lors de la modification de la pièce:", e);
      showCustomAlert("Erreur lors de la modification de la pièce", "error");
    }
  };

  const supprimerPiece = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette pièce ?")) {
      try {
        const reponse = await fetch(`http://localhost:8080/api/materiels/${id}`, {
          method: 'DELETE'
        });
        
        if (reponse.ok) {
          chargerPieces();
          setMenu(null);
          showCustomAlert("Pièce supprimée avec succès !", "success");
        } else {
          showCustomAlert("Erreur lors de la suppression de la pièce", "error");
        }
      } catch (erreur) {
        console.error("Erreur lors de la suppression:", erreur);
        showCustomAlert("Erreur lors de la suppression de la pièce", "error");
      }
    }
  };

  const changerStatut = async (id, nouveauStatut) => {
    try {
      const reponse = await fetch(`http://localhost:8080/api/materiels/${id}/status?status=${nouveauStatut}`, {
        method: 'PATCH'
      });
      
      if (reponse.ok) {
        chargerPieces();
        showCustomAlert("Statut modifié avec succès !", "success");
      } else {
        showCustomAlert("Erreur lors du changement de statut", "error");
      }
    } catch (erreur) {
      console.error("Erreur lors du changement de statut:", erreur);
      showCustomAlert("Erreur lors du changement de statut", "error");
    }
  };

  const CustomAlert = () => {
    if (!alert.show) return null;

    const alertStyles = {
      info: {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        )
      },
      success: {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        )
      },
      warning: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        )
      },
      error: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        )
      }
    };

    const style = alertStyles[alert.type];

    return (
      <div className="fixed top-5 right-5 z-[100] max-w-md animate-fade-in-down mt-[5%]">
        <div className={`flex p-4 mb-4 ${style.bg} ${style.text} border-l-4 ${style.border} rounded-lg shadow-md`} role="alert">
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 mr-2">
            {style.icon}
          </div>
          <div className="ml-3 text-sm font-medium">
            {alert.message}
          </div>
          <button
            type="button"
            className={`ml-auto -mx-1.5 -my-1.5 ${style.bg} ${style.text} rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex h-8 w-8`}
            onClick={() => setAlert(prev => ({ ...prev, show: false }))}
          >
            <span className="sr-only">Fermer</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomAlert />

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion de Pièces</h1>
              <button 
                className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                onClick={toggleModalAjout}
              >
                <PlusCircle className="w-5 h-5 mr-2 fill-blue-600 fill-current dark:fill-gray-400" />
                Ajouter une pièce
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou référence..."
                  className="w-[90%] pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                  value={motRecherche}
                  onChange={(e) => setMotRecherche(e.target.value)}
                />
              </div>
              <div className="flex gap-4 ">
                <div className="relative ">
                  <select
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                    value={statutSelectionne}
                    onChange={(e) => setStatutSelectionne(e.target.value)}
                  >
                    <option value="tous">Tous statuts</option>
                    <option value="EN_STOCK">En stock</option>
                    <option value="EN_COMMANDE">En commande</option>
                    <option value="RUPTURE">Rupture</option>
                  </select>
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 w-5 h-5 " />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => demanderTri('name')}>
                      <div className="flex items-center">
                        Nom
                        <ArrowDownUp className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => demanderTri('reference')}>
                      <div className="flex items-center">
                        Référence
                        <ArrowDownUp className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => demanderTri('status')}>
                      <div className="flex items-center">
                        Statut
                        <ArrowDownUp className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => demanderTri('lastUpdated')}>
                      <div className="flex items-center">
                        Dernière MAJ
                        <ArrowDownUp className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {elementsActuels.length > 0 ? (
                    elementsActuels.map((piece) => {
                      const styleStatut = formaterStatut(piece.status);
                      return (
                        <tr key={piece.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {piece.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {piece.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styleStatut.couleur}`}>
                              {styleStatut.libelle}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(piece.lastUpdated).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              className="bg-blue-700 hover:bg-blue-500 hover:text-white text-white dark:bg-gray-200 dark:text-blue-700 p-2 rounded-lg mr-6 hover:text-indigo-900"
                              onClick={() => afficherDetailsPiece(piece)}
                            >
                              Détails
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              <MoreHorizontal className="w-5 h-5 inline dark:fill-gray-400" 
                              onClick={() => ouvrirMenu(piece.id)}
                              />
                            </button>

                            {menu === piece.id && (
                              <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-10">
                                <button
                                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-md"
                                  onClick={() => modifierPiece(piece)}
                                >
                                  <Edit size={16} /> Modifier
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  onClick={() => afficherDetailsPiece(piece)}
                                >
                                  <Eye size={16} /> Voir
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-md"
                                  onClick={() => supprimerPiece(piece.id)}
                                >
                                  <Trash2 size={16} /> Supprimer
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aucune pièce trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {piecesFiltrees.length > 0 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Affichage de <span className="font-medium">{indexPremierElement + 1}</span> à{' '}
                      <span className="font-medium">
                        {indexDernierElement > piecesFiltrees.length ? piecesFiltrees.length : indexDernierElement}
                      </span>{' '}
                      sur <span className="font-medium">{piecesFiltrees.length}</span> résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => paginer(pageActuelle - 1)}
                        disabled={pageActuelle === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${pageActuelle === 1 ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                      >
                        <ChevronLeft className="h-5 w-5 dark:fill-gray-400" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((numero) => (
                        <button
                          key={numero}
                          onClick={() => paginer(numero)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageActuelle === numero
                              ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-200'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {numero}
                        </button>
                      ))}
                      <button
                        onClick={() => paginer(pageActuelle + 1)}
                        disabled={pageActuelle === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${pageActuelle === totalPages ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                      >
                        <ChevronRight className="h-5 w-5 dark:fill-gray-400" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Détails */}
          {modalOuvert && pieceSelectionnee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Détails de la pièce</h2>
                  <button onClick={() => setModalOuvert(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <XCircle className="w-6 h-6 dark:fill-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nom</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{pieceSelectionnee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Référence</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{pieceSelectionnee.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formaterStatut(pieceSelectionnee.status).couleur}`}>
                      {formaterStatut(pieceSelectionnee.status).libelle}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{new Date(pieceSelectionnee.lastUpdated).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Changer le statut:</p>
                    <div className="flex gap-2">
                      <button 
                        className="px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800"
                        onClick={() => changerStatut(pieceSelectionnee.id, 'EN_STOCK')}
                      >
                        En stock
                      </button>
                      <button 
                        className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800"
                        onClick={() => changerStatut(pieceSelectionnee.id, 'EN_COMMANDE')}
                      >
                        En commande
                      </button>
                      <button 
                        className="px-2 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800"
                        onClick={() => changerStatut(pieceSelectionnee.id, 'RUPTURE')}
                      >
                        Rupture
                      </button>
                    </div>
                  </div>
                  <div>
                    <button 
                      className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors mr-2"
                      onClick={() => setModalOuvert(false)}
                    >
                      Fermer
                    </button>
                    <button 
                      className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                      onClick={() => {
                        setModalOuvert(false);
                        modifierPiece(pieceSelectionnee);
                      }}
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Ajouter */}
          {afficherAjout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
              <div className="relative w-full max-w-screen-md mx-4 bg-white rounded-xl shadow-lg">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-xl font-medium text-gray-900">Ajouter Pièce</h3>
                  <button onClick={toggleModalAjout} className="text-gray-400 hover:text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <div className="flex flex-col">
                        <label htmlFor="name" className="text-sm font-medium text-stone-600">Nom pièce</label>
                        <input
                          type="text"
                          id="name"
                          placeholder="Nom"
                          className="mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="reference" className="text-sm font-medium text-stone-600">Référence</label>
                        <input
                          type="text"
                          id="reference"
                          placeholder="Référence"
                          className="mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={formData.reference}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="status" className="text-sm font-medium text-stone-600">Statut</label>
                        <select
                          id="status"
                          className="mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="">Sélectionner</option>
                          <option value="EN_STOCK">En stock</option>
                          <option value="EN_COMMANDE">En commande</option>
                          <option value="RUPTURE">Rupture</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 grid w-full grid-cols-2 justify-end space-x-4 md:flex">
                      <button type="button" onClick={toggleModalAjout} className="rounded-lg bg-gray-200 px-8 py-2 font-medium text-gray-700 outline-none hover:opacity-80 focus:ring">Annuler</button>
                      <button type="submit" className="rounded-lg bg-blue-600 px-8 py-2 font-medium text-white outline-none hover:opacity-80 focus:ring">Ajouter la pièce</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Modifier */}
          {afficherModifier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
              <div className="relative w-full max-w-screen-md mx-4 bg-white rounded-xl shadow-lg">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-xl font-medium text-gray-900">Modifier Pièce</h3>
                  <button onClick={toggleModalModifier} className="text-gray-400 hover:text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handleUpdate}>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <div className="flex flex-col">
                        <label htmlFor="name" className="text-sm font-medium text-stone-600">Nom pièce</label>
                        <input
                          type="text"
                          id="name"
                          placeholder="Nom"
                          className="mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="reference" className="text-sm font-medium text-stone-600">Référence</label>
                        <input
                          type="text"
                          id="reference"
                          placeholder="Référence"
                          className="mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={formData.reference}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="status" className="text-sm font-medium text-stone-600">Statut</label>
                        <select
                          id="status"
                          className="mt-2 block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="">Sélectionner</option>
                          <option value="EN_STOCK">En stock</option>
                          <option value="EN_COMMANDE">En commande</option>
                          <option value="RUPTURE">Rupture</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 grid w-full grid-cols-2 justify-end space-x-4 md:flex">
                      <button type="button" onClick={toggleModalModifier} className="rounded-lg bg-gray-200 px-8 py-2 font-medium text-gray-700 outline-none hover:opacity-80 focus:ring">Annuler</button>
                      <button type="submit" className="rounded-lg bg-blue-600 px-8 py-2 font-medium text-white outline-none hover:opacity-80 focus:ring">Modifier la pièce</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}