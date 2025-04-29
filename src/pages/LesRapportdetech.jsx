import { useState } from 'react';

// Données de test
const rapports = [
  {
    id: 1,
    reference: "REC-2025-0421",
    date: "21/04/2025",
    technicien: "Thomas Dubois",
    statut: "Résolu",
    priorite: "Haute",
    contenu: "Intervention sur site suite à une panne d'électricité. Remplacement du disjoncteur principal et vérification du circuit électrique. Tout est fonctionnel après intervention."
  },
  {
    id: 2,
    reference: "REC-2025-0415",
    date: "15/04/2025",
    technicien: "Marie Laurent",
    statut: "Résolu",
    priorite: "Moyenne",
    contenu: "Problème de fuite d'eau au niveau du robinet de cuisine. Remplacement du joint défectueux et vérification de l'étanchéité. Situation résolue."
  },
  {
    id: 3,
    reference: "REC-2025-0410",
    date: "10/04/2025",
    technicien: "Philippe Martin",
    statut: "En attente",
    priorite: "Basse",
    contenu: "Maintenance préventive sur système de climatisation. Nettoyage des filtres et vérification du niveau de gaz. Recommandation de remplacement des filtres dans 3 mois."
  },
  {
    id: 4,
    reference: "REC-2025-0405",
    date: "05/04/2025",
    technicien: "Sophie Durand",
    statut: "Résolu",
    priorite: "Haute",
    contenu: "Problème de connexion internet. Remplacement du routeur défectueux et configuration du nouveau matériel. Tests effectués avec succès."
  },
  {
    id: 5,
    reference: "REC-2025-0401",
    date: "01/04/2025",
    technicien: "Lucas Petit",
    statut: "En cours",
    priorite: "Moyenne",
    contenu: "Installation de nouveaux équipements de sécurité. Mise en place de 3 caméras et d'un système d'alarme. Formation du client sur l'utilisation du système."
  },
  {
    id: 6,
    reference: "REC-2025-0328",
    date: "28/03/2025",
    technicien: "Émilie Leroy",
    statut: "Résolu",
    priorite: "Haute",
    contenu: "Réparation d'une fuite au niveau de la toiture. Remplacement des tuiles endommagées et vérification de l'isolation. Recommandation d'une inspection complète dans les 6 mois."
  }
];

// Fonction pour obtenir la couleur du statut
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

// Fonction pour obtenir la couleur de priorité
const getPriorityColor = (priorite) => {
  switch (priorite) {
    case 'Haute':
      return 'bg-red-100 text-red-800';
    case 'Moyenne':
      return 'bg-orange-100 text-orange-800';
    case 'Basse':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RapportsPage() {
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');

  const openModal = (rapport) => {
    setSelectedRapport(rapport);
    setIsModalOpen(true);
    setDownloadStatus('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Fonction pour télécharger le rapport comme fichier texte
  const downloadRapport = () => {
    if (!selectedRapport) return;
    
    setDownloadStatus('loading');
    
    // Création du contenu du fichier
    const content = `
RAPPORT TECHNIQUE
=====================================
Référence: ${selectedRapport.reference}
Date: ${selectedRapport.date}
Technicien: ${selectedRapport.technicien}
Statut: ${selectedRapport.statut}
Priorité: ${selectedRapport.priorite}
-------------------------------------
CONTENU DU RAPPORT:
${selectedRapport.contenu}
-------------------------------------
Rapport généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}
    `;
    
    // Création du blob et du lien de téléchargement
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Création d'un élément a temporaire pour le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport-${selectedRapport.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyage
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadStatus('success');
      
      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setDownloadStatus('');
      }, 2000);
    }, 100);
  };

  // Filtrer les rapports en fonction du terme de recherche
  const filteredRapports = rapports.filter(rapport => 
    rapport.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rapport.technicien.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 lg:mb-0">
            <span className="text-blue-600">Rapports</span> Techniques
          </h1>
          
          <div className="w-full lg:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par référence ou technicien..."
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
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
                    <p className="text-gray-500 text-sm mt-1">{rapport.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(rapport.statut)}`}>
                      {rapport.statut}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityColor(rapport.priorite)}`}>
                      {rapport.priorite}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="text-blue-600 font-medium text-sm">
                        {rapport.technicien.split(' ').map(name => name[0]).join('')}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium">{rapport.technicien}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => openModal(rapport)}
                    className="w-full flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 py-2.5 px-4 rounded-lg transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Voir le rapport
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredRapports.length === 0 && (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-500">Aucun rapport ne correspond à votre recherche</p>
          </div>
        )}
      </div>

      {/* Modal pour afficher le rapport complet */}
      {isModalOpen && selectedRapport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Détails du rapport</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-blue-600 font-semibold text-lg">{selectedRapport.reference}</span>
                    <p className="text-gray-500 text-sm mt-1">{selectedRapport.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(selectedRapport.statut)}`}>
                      {selectedRapport.statut}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityColor(selectedRapport.priorite)}`}>
                      {selectedRapport.priorite}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium">
                      {selectedRapport.technicien.split(' ').map(name => name[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium">{selectedRapport.technicien}</p>
                    <p className="text-gray-500 text-sm">Technicien</p>
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
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Téléchargement...
                    </>
                  ) : downloadStatus === 'success' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Téléchargé !
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger
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