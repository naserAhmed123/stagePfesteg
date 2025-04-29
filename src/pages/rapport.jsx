import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Calendar, Clock, FileText, AlertTriangle, CheckCircle, Activity, Download, BotMessageSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReclamationReportSystem = () => {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('CeJour');
  const [isReportReady, setIsReportReady] = useState(false);
  const reportRef = useRef(null);
  const [lastToast, setLastToast] = useState({ type: null, time: null }); 

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/reclamations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`Échec du chargement: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Les données reçues ne sont pas un tableau');
        }
        const lesRec = data.map(elm => ({
          id: elm.id || '',
          heureReclamation: elm.heureReclamation || new Date().toISOString(),
          etat: elm.etat || 'inconnu',
          importance: elm.importance || 'inconnue',
          typePanne: elm.typePanne || 'Inconnu',
          rue: elm.rue || 'inconnue',
        }));
        setReclamations(lesRec);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchReclamations();
  }, []);

  useEffect(() => {
    const checkReportTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay(); // 0 = ahad, 6 = sebt
      const date = now.getDate();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentTime = now.getTime();

    
      setIsReportReady(false);

      const shouldShowToast = (type) =>
        !lastToast.type ||
        lastToast.type !== type ||
        currentTime - lastToast.time > 60000; 

      console.log({
        reportType,
        hour,
        minute,
        day,
        date,
        lastDayOfMonth,
        isReportReady,
      });

      if (reportType === 'CeJour') {
        if (hour === 2 && minute === 14) {
          setIsReportReady(true);
          if (shouldShowToast('CeJour')) {
            toast.success('Rapport journalier prêt à télécharger !', {
              position: 'top-center',
              autoClose: 5000,
            });
            setLastToast({ type: 'CeJour', time: currentTime });
          }
        }
      } else if (reportType === 'cetteSemaine') {
        if (day === 6 && hour === 18 && minute === 0) {
          setIsReportReady(true);
          if (shouldShowToast('cetteSemaine')) {
            toast.success('Rapport hebdomadaire prêt à télécharger !', {
              position: 'top-center',
              autoClose: 5000,
            });
            setLastToast({ type: 'cetteSemaine', time: currentTime });
          }
        }
      } else if (reportType === 'mensieulle') {
        if (date === lastDayOfMonth && hour === 18 && minute === 0) {
          setIsReportReady(true);
          if (shouldShowToast('mensieulle')) {
            toast.success('Rapport mensuel prêt à télécharger !', {
              position: 'top-center',
              autoClose: 5000,
            });
            setLastToast({ type: 'mensieulle', time: currentTime });
          }
        }
      }
    };

    // Vérifier toutes les 10 secondes
    const timer = setInterval(checkReportTime, 10000);
    return () => clearInterval(timer);
  }, [reportType, lastToast]);

  // Générer le rapport (only change reportType)
  const generateReport = (type) => {
    setReportType(type);
  };

  // Télécharger le PDF
  const downloadPDF = async () => {
    if (!reportRef.current || !isReportReady) return;
  
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
  
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
  
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  
    let heightLeft = imgHeight;
    let position = 0;
  
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  
    pdf.save(`rapport_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  

  const getFilteredData = () => {
    const now = new Date();
    let filteredData = [];
    let periodText = '';

    switch (reportType) {
      case 'CeJour':
        filteredData = reclamations.filter(rec => {
          const recDate = new Date(rec.heureReclamation);
          return recDate.toDateString() === now.toDateString();
        });
        periodText = "aujourd'hui";
        break;
      case 'cetteSemaine':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        filteredData = reclamations.filter(rec => {
          const recDate = new Date(rec.heureReclamation);
          return recDate >= startOfWeek;
        });
        periodText = 'cette semaine';
        break;
      case 'mensieulle':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredData = reclamations.filter(rec => {
          const recDate = new Date(rec.heureReclamation);
          return recDate >= startOfMonth;
        });
        periodText = 'ce mois';
        break;
      default:
        filteredData = reclamations;
        periodText = 'toutes périodes';
    }

    const trendData = [];
    const jour = reportType === 'CeJour' ? 1 : reportType === 'cetteSemaine' ? 7 : 30;
    for (let i = jour - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const count = reclamations.filter(rec => {
        const recDate = new Date(rec.heureReclamation);
        return recDate.toDateString() === date.toDateString();
      }).length;
      trendData.push({ date: date.toLocaleDateString('fr-FR'), count });
    }

    return { filteredData, periodText, trendData };
  };

  const { filteredData, periodText, trendData } = getFilteredData();

  const totalReclamations = filteredData.length;

  const countByEtat = filteredData.reduce((acc, rec) => {
    acc[rec.etat] = (acc[rec.etat] || 0) + 1;
    return acc;
  }, {});
  const etatData = Object.keys(countByEtat).map(key => ({ name: key, value: countByEtat[key] }));

  const countByImportance = filteredData.reduce((acc, rec) => {
    acc[rec.importance] = (acc[rec.importance] || 0) + 1;
    return acc;
  }, {});
  const importanceData = Object.keys(countByImportance).map(key => ({ name: key, value: countByImportance[key] }));

  const countByTypePanne = filteredData.reduce((acc, rec) => {
    acc[rec.typePanne] = (acc[rec.typePanne] || 0) + 1;
    return acc;
  }, {});
  const typePanneData = Object.keys(countByTypePanne).map(key => ({ name: key, value: countByTypePanne[key] }));

  const countByRue = filteredData.reduce((acc, rec) => {
    acc[rec.rue] = (acc[rec.rue] || 0) + 1;
    return acc;
  }, {});
  const rueData = Object.keys(countByRue)
    .map(key => ({ name: key, value: countByRue[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const getConclusions = () => {
    const conclusions = [];
    if (totalReclamations === 0) conclusions.push ('Aucune réclamation enregistrée.');
    if (totalReclamations > 20) conclusions.push('Volume élevé, attention requise.');
    if (totalReclamations < 5) conclusions.push('Faible volume, Travail avec une seule équipe technique possible .');
    const resolvedCount = countByEtat['Résolu'] || 0;
    if (resolvedCount / totalReclamations < 0.3) conclusions.push('Taux de résolution faible.');
    const criticalCount = countByImportance['Critique'] || 0;
    if (criticalCount > 0) conclusions.push(`${criticalCount} réclamation(s) critique(s).`);
    if (rueData.length > 0) conclusions.push(`Rue "${rueData[0].name}" : ${rueData[0].value} réclamations.`);
    return conclusions;
  };

  const getRecommendations = () => {
    const recommendations = [];
    if (totalReclamations === 0) recommendations.push('Surveiller la situation.');
    const resolvedCount = countByEtat['TERMINER'] || 0;
    if (resolvedCount / totalReclamations < 0.3) recommendations.push('Augmenter les ressources.');
    const mostCommonPanne = Object.keys(countByTypePanne).reduce((a, b) => countByTypePanne[a] > countByTypePanne[b] ? a : b, '');
    if (mostCommonPanne) recommendations.push(`Analyser "${mostCommonPanne}".`);
    if (rueData.length > 0) recommendations.push(`Inspecter "${rueData[0].name}".`);
    return recommendations;
  };

  const conclusions = getConclusions();

  const recommendations = getRecommendations();

  const Couleurs = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <AlertTriangle size={40} className="mx-auto" />
          <p className="mt-4">Erreur: {error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <ToastContainer />

      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Rapport des Réclamations - STEG</h1>
          <p className="mt-2 text-indigo-100 text-lg">Analyses et statistiques avancées</p>
          <div className="mt-6 flex space-x-4">
            {['CeJour', 'cetteSemaine', 'mensieulle'].map(type => (
              <button
                key={type}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  reportType === type
                    ? 'bg-white text-blue-700 shadow-lg'
                    : 'bg-blue-500 hover:bg-blue-400'
                }`}
                onClick={() => generateReport(type)}
              >
                <div className="flex items-center">
                  <Calendar size={20} className="mr-2" />
                  {type === 'CeJour' ? 'Journalier' : type === 'cetteSemaine' ? 'Hebdomadaire' : 'Mensuel'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10" ref={reportRef}>
        <section className="bg-white rounded-2xl  shadow-xl p-8 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Rapport {reportType === 'CeJour' ? 'Journalier' : reportType === 'cetteSemaine' ? 'Hebdomadaire' : 'Mensuel'}
            </h2>
            <p className="text-gray-500 mt-2 flex items-center">
              <Clock size={20} className="mr-2" />
              Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              isReportReady
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={downloadPDF}
            disabled={!isReportReady}
          >
            <Download size={20} className="mr-2" />
            Télécharger PDF
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Réclamations</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalReclamations}</p>
            <p className="text-gray-500 mt-1">{periodText}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-700">Términer</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{countByEtat['TERMINER'] || 0}</p>
            <p className="text-gray-500 mt-1">
              {totalReclamations > 0 ? ((countByEtat['TERMINER'] || 0) / totalReclamations * 100).toFixed(1) + '%' : '0%'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-700">En cours</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{countByEtat['ENCOURS'] || 0}</p>
            <p className="text-gray-500 mt-1">
              {totalReclamations > 0 ? ((countByEtat['ENCOURS'] || 0) / totalReclamations * 100).toFixed(1) + '%' : '0%'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-700">Problém</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{countByEtat['PROBLEM'] || 0}</p>
            <p className="text-gray-500 mt-1">
              {totalReclamations > 0 ? ((countByEtat['PROBLEM'] || 0) / totalReclamations * 100).toFixed(1) + '%' : '0%'}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Distribution par État</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={etatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {etatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Couleurs[index % Couleurs.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Distribution par Importance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Nombre" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Rues</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rueData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Réclamations" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Types de Panne</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typePanneData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {typePanneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Couleurs[index % Couleurs.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Tendance des Réclamations</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Réclamations" stroke="#0088FE" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
                <div className="flex items-center justify-center mr-4">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4 flex ">
                      <BotMessageSquare size={24} className="mr-2" />
                      AI Analyse
                    </h3>
               </div>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-amber-700 mb-4 flex items-center">
              <AlertTriangle size={24} className="mr-2" />
              Conclusions
            </h3>
            <ul className="space-y-3">
              {
              conclusions.map((conclusion, index) => (

                <li key={index} className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <span className="text-gray-700">{conclusion}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center">
              <CheckCircle size={24} className="mr-2" />
              Recommandations
            </h3>
            <ul className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReclamationReportSystem;