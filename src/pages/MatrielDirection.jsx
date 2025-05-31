import { useState, useEffect, useCallback } from 'react';
import { Search, PlusCircle, Filter, ArrowDownUp, MoreHorizontal, ChevronLeft, ChevronRight, XCircle, Edit, Eye, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TableauPiecesAvance() {
  const [pieces, setPieces] = useState([]);
  const [piecesFiltrees, setPiecesFiltrees] = useState([]);
  const [motRecherche, setMotRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [configTri, setConfigTri] = useState({ cle: 'name', direction: 'asc' });
  const [statutSelectionne, setStatutSelectionne] = useState('tous');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [pieceSelectionnee, setPieceSelectionnee] = useState(null);
  const [menu, setMenu] = useState(null);
  const elementsParPage = 5;
  const [afficherAjout, setAfficherAjout] = useState(false);
  const [afficherModifier, setAfficherModifier] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pieceASupprimer, setPieceASupprimer] = useState(null);
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
      if (!reponse.ok) throw new Error(`HTTP error! status: ${reponse.status}`);
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
      console.error("Erreur lors du chargement des pièces:", erreur.message);
      showCustomAlert("Erreur lors du chargement des données", "error");
    }
  };

  const filtrerEtTrierPieces = useCallback(() => {
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
        const valA = a[configTri.cle] || '';
        const valB = b[configTri.cle] || '';
        if (valA < valB) return configTri.direction === 'asc' ? -1 : 1;
        if (valA > valB) return configTri.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setPiecesFiltrees(resultat);
    setPageActuelle(1);
  }, [motRecherche, statutSelectionne, configTri, pieces]);

  useEffect(() => {
    filtrerEtTrierPieces();
  }, [filtrerEtTrierPieces]);

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

  const paginer = (numeroDePage) => {
    if (numeroDePage >= 1 && numeroDePage <= totalPages) {
      setPageActuelle(numeroDePage);
    }
  };

  const afficherDetailsPiece = (piece) => {
    setPieceSelectionnee(piece);
    setModalOuvert(true);
    setMenu(null);
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
    if (afficherAjout) {
      setFormData({
        id: '',
        name: '',
        reference: '',
        status: '',
        lastUpdated: ''
      });
    }
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

    if (!formData.name || !formData.reference || !formData.status) {
      showCustomAlert("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

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
      await chargerPieces();
    } catch (e) {
      console.error("Erreur lors de l'ajout de la pièce:", e.message);
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
    setMenu(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.reference || !formData.status) {
      showCustomAlert("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

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
        id: '',
        name: '',
        reference: '',
        status: '',
        lastUpdated: ''
      });

      toggleModalModifier();
      showCustomAlert("Pièce modifiée avec succès !", "success");
      await chargerPieces();
    } catch (e) {
      console.error("Erreur lors de la modification de la pièce:", e.message);
      showCustomAlert("Erreur lors de la modification de la pièce", "error");
    }
  };

  const ouvrirModalSuppression = (piece) => {
    setPieceASupprimer(piece);
    setShowDeleteModal(true);
    setMenu(null);
  };

  const supprimerPiece = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/materiels/archive/${pieceASupprimer.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setPieces(prevPieces => prevPieces.filter(piece => piece.id !== pieceASupprimer.id));
      setShowDeleteModal(false);
      setPieceASupprimer(null);
      showCustomAlert("Pièce supprimée avec succès !", "success");
      await chargerPieces();
    } catch (erreur) {
      console.error("Erreur lors de la suppression:", erreur.message);
      showCustomAlert("Erreur lors de la suppression de la pièce", "error");
    }
  };

  const changerStatut = async (id, nouveauStatut) => {
    try {
      const response = await fetch(`http://localhost:8080/api/materiels/${id}/status?status=${nouveauStatut}`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showCustomAlert("Statut modifié avec succès !", "success");
      setMenu(null);
      await chargerPieces();
    } catch (erreur) {
      console.error("Erreur lors du changement de statut:", erreur.message);
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
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        )
      },
      success: {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: <CheckCircle className="w-5 h-5" aria-hidden="true" />
      },
      warning: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />
      },
      error: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: <XCircle className="w-5 h-5" aria-hidden="true" />
      }
    };

    const style = alertStyles[alert.type];

    return (
      <div className="fixed top-6 right-6 z-50 max-w-md animate-fade-in-down" role="alert">
        <div className={`flex p-4 ${style.bg} ${style.text} border-l-4 ${style.border} rounded-lg shadow-md backdrop-blur-sm`}>
          <div className="flex-shrink-0 mr-3">
            {style.icon}
          </div>
          <div className="flex-1 text-sm font-medium">
            {alert.message}
          </div>
          <button
            type="button"
            className={`ml-3 -mx-1.5 -my-1.5 ${style.bg} ${style.text} rounded-lg p-1.5 hover:bg-opacity-75 transition-colors`}
            onClick={() => setAlert(prev => ({ ...prev, show: false }))}
            aria-label="Fermer l'alerte"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !pieceASupprimer) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="delete-modal-title">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          
          <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
            Confirmer la suppression
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Êtes-vous sûr de vouloir supprimer la pièce <strong>"{pieceASupprimer.name}"</strong> ? 
            Cette action est irréversible.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setPieceASupprimer(null);
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              aria-label="Annuler la suppression"
            >
              Annuler
            </button>
            <button
              onClick={supprimerPiece}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              aria-label="Confirmer la suppression"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DetailModal = () => {
    if (!modalOuvert || !pieceSelectionnee) return null;

    const styleStatut = formaterStatut(pieceSelectionnee.status);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="detail-modal-title">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 id="detail-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Détails de la pièce
            </h3>
            <button
              onClick={() => setModalOuvert(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Fermer les détails"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pieceSelectionnee.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Référence</label>
              <p className="text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {pieceSelectionnee.reference}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styleStatut.couleur}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${pieceSelectionnee.status === 'EN_STOCK' ? 'bg-green-500' : pieceSelectionnee.status === 'EN_COMMANDE' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                  {styleStatut.libelle}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière mise à jour</label>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(pieceSelectionnee.lastUpdated).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Changer le statut:</p>
              <div className="flex gap-2">
                <button 
                  className="px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800"
                  onClick={() => changerStatut(pieceSelectionnee.id, 'EN_STOCK')}
                  aria-label="Changer le statut à En stock"
                >
                  En stock
                </button>
                <button 
                  className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800"
                  onClick={() => changerStatut(pieceSelectionnee.id, 'EN_COMMANDE')}
                  aria-label="Changer le statut à En commande"
                >
                  En commande
                </button>
                <button 
                  className="px-2 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800"
                  onClick={() => changerStatut(pieceSelectionnee.id, 'RUPTURE')}
                  aria-label="Changer le statut à Rupture"
                >
                  Rupture
                </button>
              </div>
            </div>
            <div>
              <button 
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors mr-2"
                onClick={() => setModalOuvert(false)}
                aria-label="Fermer le modal"
              >
                Fermer
              </button>
              <button 
                className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                onClick={() => {
                  setModalOuvert(false);
                  modifierPiece(pieceSelectionnee);
                }}
                aria-label="Modifier la pièce"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FormModal = ({ isEdit = false }) => {
    const isOpen = isEdit ? afficherModifier : afficherAjout;
    const toggle = isEdit ? toggleModalModifier : toggleModalAjout;
    const handleFormSubmit = isEdit ? handleUpdate : handleSubmit;

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby={isEdit ? "edit-modal-title" : "add-modal-title"}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-screen-md mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 id={isEdit ? "edit-modal-title" : "add-modal-title"} className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isEdit ? 'Modifier la pièce' : 'Ajouter une pièce'}
            </h3>
            <button
              onClick={toggle}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Fermer le formulaire"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col">
              <label htmlFor="name" className="text-sm font-medium text-stone-600 dark:text-gray-300 mb-2">
                Nom de la pièce *
              </label>
              <input
                type="text"
                id="name"
                placeholder="Nom"
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-gray-100"
                required
                aria-required="true"
              />
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="reference" className="text-sm font-medium text-stone-600 dark:text-gray-300 mb-2">
                Référence *
              </label>
              <input
                type="text"
                id="reference"
                placeholder="Référence"
                value={formData.reference}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-gray-100 font-mono"
                required
                aria-required="true"
              />
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="status" className="text-sm font-medium text-stone-600 dark:text-gray-300 mb-2">
                Statut *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-100 bg-gray-100 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-gray-100"
                required
                aria-required="true"
              >
                <option value="">Sélectionner</option>
                <option value="EN_STOCK">En stock</option>
                <option value="EN_COMMANDE">En commande</option>
                <option value="RUPTURE">Rupture</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4 col-span-full">
              <button
                type="button"
                onClick={toggle}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                aria-label={isEdit ? 'Modifier la pièce' : 'Ajouter la pièce'}
              >
                {isEdit ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomAlert />
      <DeleteModal />
      <DetailModal />
      <FormModal isEdit={false} />
      <FormModal isEdit={true} />

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 mb-8 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion de Pièces
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gérez efficacement votre inventaire de pièces
                </p>
              </div>
              <button 
                className="group flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                onClick={toggleModalAjout}
                aria-label="Ajouter une nouvelle pièce"
              >
                <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Ajouter une pièce
              </button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou référence..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  value={motRecherche}
                  onChange={(e) => setMotRecherche(e.target.value)}
                  aria-label="Rechercher des pièces"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <select
                  className="pl-12 pr-8 py-3.5 bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm min-w-[200px]"
                  value={statutSelectionne}
                  onChange={(e) => setStatutSelectionne(e.target.value)}
                  aria-label="Filtrer par statut"
                >
                  <option value="tous">Tous statuts</option>
                  <option value="EN_STOCK">En stock</option>
                  <option value="EN_COMMANDE">En commande</option>
                  <option value="RUPTURE">Rupture</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-600/80">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors" onClick={() => demanderTri('name')}>
                      <div className="flex items-center group">
                        Nom
                        <ArrowDownUp className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors" onClick={() => demanderTri('reference')}>
                      <div className="flex items-center group">
                        Référence
                        <ArrowDownUp className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors" onClick={() => demanderTri('status')}>
                      <div className="flex items-center group">
                        Statut
                        <ArrowDownUp className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors" onClick={() => demanderTri('lastUpdated')}>
                      <div className="flex items-center group">
                        Dernière MAJ
                        <ArrowDownUp className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {elementsActuels.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Aucune pièce trouvée
                      </td>
                    </tr>
                  ) : (
                    elementsActuels.map((piece) => {
                      const styleStatut = formaterStatut(piece.status);
                      return (
                        <tr key={piece.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {piece.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-mono">
                            {piece.reference}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styleStatut.couleur}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${piece.status === 'EN_STOCK' ? 'bg-green-500' : piece.status === 'EN_COMMANDE' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                              {styleStatut.libelle}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(piece.lastUpdated).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 relative text-right">
                            <button
                              onClick={() => afficherDetailsPiece(piece)}
                              className="bg-blue-700 text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-500 transition-colors"
                              aria-label={`Voir les détails de ${piece.name}`}
                            >
                              Détails
                            </button>
                            <button
                              onClick={() => ouvrirMenu(piece.id)}
                              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              aria-label={`Ouvrir le menu des actions pour ${piece.name}`}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {menu === piece.id && (
                              <div className="absolute right-4 top-10 z-10 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                                <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                                  <li>
                                    <button
                                      onClick={() => afficherDetailsPiece(piece)}
                                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      aria-label={`Voir les détails de ${piece.name}`}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Voir
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => modifierPiece(piece)}
                                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      aria-label={`Modifier ${piece.name}`}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Modifier
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => ouvrirModalSuppression(piece)}
                                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                                      aria-label={`Supprimer ${piece.name}`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Supprimer
                                    </button>
                                  </li>
                               
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 dark:bg-gray-700/80">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Affichage de {indexPremierElement + 1} à {Math.min(indexDernierElement, piecesFiltrees.length)} sur {piecesFiltrees.length} pièces
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginer(pageActuelle - 1)}
                    disabled={pageActuelle === 1}
                    className="p-2 rounded-full bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => paginer(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        pageActuelle === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                      } transition-colors`}
                      aria-label={`Aller à la page ${page}`}
                      aria-current={pageActuelle === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => paginer(pageActuelle + 1)}
                    disabled={pageActuelle === totalPages}
                    className="p-2 rounded-full bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}