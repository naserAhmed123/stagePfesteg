import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  X, 
  AlertTriangle, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  MapPin, 
  User, 
  Clock as Clock3, 
  FileText 
} from 'lucide-react';

interface Reclamation {
  reference: string;
  typePanne: string;
  importance: 'CRITIQUE' | 'IMPORTANTE' | 'MOYENNE' | 'FAIBLE';
  etat: 'En cours' | 'Nouveau' | 'Résolu' | 'Planifié';
  genrePanne: string;
  numClient: string;
  rue: string;
  heureReclamation: string;
  description?: string;
}

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    calendar: string;
    reclamation: Reclamation;
  };
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// Modal Component avec design amélioré
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          role="button"
          aria-label="Close modal"
        />
        <div className={`relative inline-block w-full text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl ${className}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

// Badge de priorité stylisé
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const variants: Record<string, string> = {
    CRITIQUE: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200",
    IMPORTANTE: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-200",
    MOYENNE: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200",
    FAIBLE: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-200",
    default: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-200"
  };

  const icons: Record<string, JSX.Element> = {
    CRITIQUE: <AlertTriangle size={12} />,
    IMPORTANTE: <Zap size={12} />,
    MOYENNE: <AlertCircle size={12} />,
    FAIBLE: <CheckCircle2 size={12} />,
    default: <AlertCircle size={12} />
  };

  const displayPriority = priority in variants ? priority : 'default';

  return (
    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${variants[displayPriority]}`}>
      {icons[displayPriority]}
      <span>{displayPriority}</span>
    </span>
  );
};

// Badge d'état
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, string> = {
    "En cours": "bg-blue-100 text-blue-800 border-blue-200",
    "Nouveau": "bg-purple-100 text-purple-800 border-purple-200",
    "Résolu": "bg-green-100 text-green-800 border-green-200",
    "Planifié": "bg-yellow-100 text-yellow-800 border-yellow-200",
    default: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const displayStatus = status in variants ? status : 'default';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[displayStatus]}`}>
      {displayStatus}
    </span>
  );
};

// Fonction utilitaire pour normaliser les dates
const normalizeDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Date invalide:', dateString);
      return new Date().toISOString().split('T')[0];
    }
    
    // Créer une nouvelle date en utilisant les composants locaux pour éviter les problèmes de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erreur lors de la normalisation de la date:', error);
    return new Date().toISOString().split('T')[0];
  }
};

// Fonction utilitaire pour formater une date ISO
const formatDateForCalendar = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Date invalide pour le calendrier:', dateString);
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return new Date().toISOString();
  }
};

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayReclamations, setSelectedDayReclamations] = useState<CalendarEvent[]>([]);
  const [isReclamationsModalOpen, setIsReclamationsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isReclamationDetailModalOpen, setIsReclamationDetailModalOpen] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  const calendarsEvents = {
    CRITIQUE: "danger",
    IMPORTANTE: "warning",
    MOYENNE: "primary",
    FAIBLE: "success",
  };

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Début de la récupération des réclamations...');
      
      const response = await fetch('http://localhost:8080/reclamations', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const data: Reclamation[] = await response.json();
      console.log('Données récupérées:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide: attendu un tableau');
      }
      
      const reclamationEvents: CalendarEvent[] = data.map((reclamation, index) => {
        console.log(`Traitement réclamation ${index + 1}:`, reclamation);
        
        if (!reclamation.heureReclamation) {
          console.warn('Réclamation sans date:', reclamation);
          reclamation.heureReclamation = new Date().toISOString();
        }

        return {
          id: `${reclamation.reference}-${index}`,
          title: `${reclamation.typePanne} - ${reclamation.importance}`,
          start: formatDateForCalendar(reclamation.heureReclamation),
          allDay: false,
          extendedProps: {
            calendar: calendarsEvents[reclamation.importance as keyof typeof calendarsEvents] || "primary",
            reclamation,
          },
        };
      });
      
      console.log('Événements créés:', reclamationEvents);
      setEvents(reclamationEvents);
      
    } catch (e: any) {
      console.error('Erreur lors de la récupération des réclamations:', e);
      let errorMessage = 'Erreur inconnue';
      
      if (e.name === 'TimeoutError') {
        errorMessage = 'Timeout: Le serveur met trop de temps à répondre';
      } else if (e.name === 'TypeError' && e.message.includes('fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur est démarré.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(`Impossible de récupérer les réclamations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamations();

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {},
      debug: (str) => console.log('STOMP Debug:', str),
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connecté au serveur WebSocket');
        stompClient.subscribe('/topic/reclamations', (message) => {
          console.log('Message WebSocket reçu:', message.body);
          try {
            const newReclamation: Reclamation = JSON.parse(message.body);
            const newEvent: CalendarEvent = {
              id: `${newReclamation.reference}-${Date.now()}`,
              title: `${newReclamation.typePanne} - ${newReclamation.importance}`,
              start: formatDateForCalendar(newReclamation.heureReclamation),
              allDay: false,
              extendedProps: {
                calendar: calendarsEvents[newReclamation.importance as keyof typeof calendarsEvents] || "primary",
                reclamation: newReclamation,
              },
            };
            setEvents((prevEvents) => [...prevEvents, newEvent]);
          } catch (e) {
            console.error('Erreur lors du traitement du message WebSocket:', e);
          }
        });
      },
      onWebSocketError: (error) => {
        console.error('Erreur WebSocket:', error);
        setError('Erreur de connexion WebSocket - Connexion temps réel indisponible');
      },
      onStompError: (frame) => {
        console.error('Erreur STOMP:', frame);
        setError(`Erreur STOMP: ${frame.body}`);
      },
      onDisconnect: () => {
        console.log('Déconnecté du serveur WebSocket');
      },
    });

    stompClientRef.current = stompClient;
    stompClient.activate();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  const getReclamationsCountForDay = (date: Date): number => {
    const dateStr = normalizeDate(date.toISOString());
    const count = events.filter((event) => {
      const eventDate = normalizeDate(event.start);
      return eventDate === dateStr && event.extendedProps.reclamation;
    }).length;
    
    console.log(`Réclamations pour ${dateStr}:`, count);
    return count;
  };

  const handleDateClick = (arg: { dateStr: string }) => {
    console.log('Clic sur la date:', arg.dateStr);
    const selectedDate = arg.dateStr;
    
    const dayReclamations = events.filter((event) => {
      const eventDate = normalizeDate(event.start);
      const isMatch = eventDate === selectedDate && event.extendedProps.reclamation;
      console.log(`Comparaison: ${eventDate} === ${selectedDate} => ${isMatch}`);
      return isMatch;
    });
    
    console.log('Réclamations trouvées pour ce jour:', dayReclamations);
    setSelectedDayReclamations(dayReclamations);
    setIsReclamationsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventData = clickInfo.event.extendedProps;
    if (eventData?.reclamation) {
      setSelectedReclamation(eventData.reclamation);
      setIsReclamationDetailModalOpen(true);
    }
  };

  const renderDayCellContent = (arg: { date: Date; isToday: boolean }) => {
    const count = getReclamationsCountForDay(arg.date);
    if (count === 0) return null;

    return (
      <div
        className="flex justify-center items-center h-full cursor-pointer group"
        onClick={() => handleDateClick({ dateStr: normalizeDate(arg.date.toISOString()) })}
        role="button"
        aria-label={`View ${count} reclamations for ${arg.date.toLocaleDateString('fr-FR')}`}
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg group-hover:shadow-blue-300 transition-all duration-200 transform group-hover:scale-105">
          {count} réclamation{count > 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  const renderEventContent = (eventInfo: any) => {
    const currentView = calendarRef.current?.getApi().view.type;
    if (currentView === "dayGridMonth") {
      const priority = eventInfo.event.extendedProps.reclamation?.importance;
      return (
        <div className="flex items-center space-x-1 p-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPriorityColor(priority) }}></div>
          <div className="text-xs truncate">{eventInfo.event.title}</div>
        </div>
      );
    }

    const priority = eventInfo.event.extendedProps.reclamation?.importance;
    const colorClasses: Record<string, string> = {
      CRITIQUE: "bg-gradient-to-r from-red-500 to-red-600 border-red-300",
      IMPORTANTE: "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-300",
      MOYENNE: "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-300",
      FAIBLE: "bg-gradient-to-r from-green-500 to-green-600 border-green-300",
      default: "bg-gradient-to-r from-gray-500 to-gray-600 border-gray-300"
    };

    return (
      <div className={`${colorClasses[priority] || colorClasses.default} text-white p-2 rounded-lg cursor-pointer border-l-4 shadow-md hover:shadow-lg transition-all duration-200`}>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
          <div className="text-xs font-medium truncate">{eventInfo.event.title}</div>
        </div>
        <div className="text-xs opacity-90 mt-1">{eventInfo.timeText}</div>
      </div>
    );
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      CRITIQUE: '#ef4444',
      IMPORTANTE: '#f97316',
      MOYENNE: '#3b82f6',
      FAIBLE: '#10b981',
      default: '#6b7280'
    };
    return colors[priority] || colors.default;
  };

  const getStatistics = () => {
    const stats = {
      CRITIQUE: events.filter(e => e.extendedProps.reclamation?.importance === 'CRITIQUE').length,
      IMPORTANTE: events.filter(e => e.extendedProps.reclamation?.importance === 'IMPORTANTE').length,
      MOYENNE: events.filter(e => e.extendedProps.reclamation?.importance === 'MOYENNE').length,
      FAIBLE: events.filter(e => e.extendedProps.reclamation?.importance === 'FAIBLE').length,
    };
    return stats;
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <RefreshCw className="absolute inset-0 m-auto h-6 w-6 text-blue-600 animate-pulse" />
            </div>
            <p className="text-gray-600 font-medium mt-4">Chargement du calendrier...</p>
            <p className="text-gray-400 text-sm mt-1">Connexion au serveur en cours</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec titre et statistiques */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Calendrier des Réclamations
                </h1>
                <p className="text-gray-600 mt-1">Gestion et suivi en temps réel</p>
              </div>
            </div>
            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(stats).map(([priority, count]) => {
                const colors: Record<string, string> = {
                  CRITIQUE: 'from-red-500 to-red-600',
                  IMPORTANTE: 'from-orange-500 to-orange-600',
                  MOYENNE: 'from-blue-500 to-blue-600',
                  FAIBLE: 'from-green-500 to-green-600'
                };

                return (
                  <div key={priority} className={`bg-gradient-to-r ${colors[priority]} rounded-xl p-3 text-white shadow-lg`}>
                    <div className="text-xs opacity-90 uppercase tracking-wide">{priority}</div>
                    <div className="text-xl font-bold">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message d'erreur stylisé */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">Erreur de connexion</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  fetchReclamations();
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Calendrier principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="custom-calendar p-6">
            <style>{`
              .custom-calendar .fc-toolbar {
                background: linear-gradient(135deg,rgb(45, 80, 236) 0%,rgb(20, 59, 176) 100%);
                padding: 1rem;
                border-radius: 1rem;
                margin-bottom: 1.5rem;
              }
              .custom-calendar .fc-toolbar-title {
                color: white;
                font-weight: 700;
                font-size: 1.5rem;
              }
              .custom-calendar .fc-button {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 0.5rem;
                font-weight: 500;
                transition: all 0.2s;
              }
              .custom-calendar .fc-button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
              }
              .custom-calendar .fc-button-active {
                background: rgba(255, 255, 255, 0.4) !important;
              }
              .custom-calendar .fc-daygrid-day {
                border: 1px solid #e5e7eb;
                transition: all 0.2s;
              }
              .custom-calendar .fc-daygrid-day:hover {
                background-color: #f8fafc;
              }
              .custom-calendar .fc-day-today {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
                border-color: #3b82f6;
              }
              .custom-calendar .fc-col-header-cell {
                background: #f1f5f9;
                font-weight: 600;
                color: #475569;
                border-color: #e2e8f0;
              }
            `}</style>

            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable={false}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
              dayCellContent={renderDayCellContent}
              dateClick={handleDateClick}
              locale="fr"
              buttonText={{
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
              }}
              height="auto"
            />
          </div>
        </div>

        {/* Modal pour afficher les réclamations du jour */}
        <Modal
          isOpen={isReclamationsModalOpen}
          onClose={() => setIsReclamationsModalOpen(false)}
          className="max-w-6xl"
        >
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Réclamations du jour sélectionné
              </h3>
              <p className="text-gray-600">
                {selectedDayReclamations.length} réclamation{selectedDayReclamations.length > 1 ? 's' : ''} trouvée{selectedDayReclamations.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Référence
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type de panne
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Priorité
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        État
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Localisation
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date/Heure
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {selectedDayReclamations.length > 0 ? (
                      selectedDayReclamations.map((event) => (
                        <tr 
                          key={event.id} 
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 transition-all duration-200"
                          onClick={() => {
                            setSelectedReclamation(event.extendedProps.reclamation);
                            setIsReclamationDetailModalOpen(true);
                          }}
                          role="button"
                          aria-label={`View details for reclamation ${event.extendedProps.reclamation?.reference}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">
                              {event.extendedProps.reclamation?.reference}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">
                              {event.extendedProps.reclamation?.typePanne}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PriorityBadge priority={event.extendedProps.reclamation?.importance} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={event.extendedProps.reclamation?.etat} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-600">
                              <MapPin size={14} className="mr-1" />
                              {event.extendedProps.reclamation?.rue}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {new Date(event.extendedProps.reclamation?.heureReclamation).toLocaleString('fr-FR')}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucune réclamation</p>
                            <p className="text-sm">pour ce jour sélectionné</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsReclamationsModalOpen(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                aria-label="Close reclamations modal"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal pour afficher les détails d'une réclamation */}
        <Modal
          isOpen={isReclamationDetailModalOpen}
          onClose={() => setIsReclamationDetailModalOpen(false)}
          className="max-w-4xl"
        >
          <div className="p-8">
            {selectedReclamation && (
              <>
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">
                      Détails de la réclamation
                    </h3>
                    <div className="flex items-center space-x-3">
                      <PriorityBadge priority={selectedReclamation.importance} />
                      <StatusBadge status={selectedReclamation.etat} />
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Informations principales */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Informations générales
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Référence</p>
                        <p className="text-lg font-bold text-gray-900">{selectedReclamation.reference}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Type de panne</p>
                        <p className="text-base font-semibold text-gray-900">{selectedReclamation.typePanne}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Genre de panne</p>
                        <p className="text-base font-semibold text-gray-900">{selectedReclamation.genrePanne}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informations client et localisation */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Client et localisation
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User size={16} className="text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Numéro client</p>
                          <p className="text-base font-semibold text-gray-900">{selectedReclamation.numClient}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin size={16} className="text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Rue</p>
                          <p className="text-base font-semibold text-gray-900">{selectedReclamation.rue}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock3 size={16} className="text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date et heure</p>
                          <p className="text-base font-semibold text-gray-900">
                            {new Date(selectedReclamation.heureReclamation).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedReclamation.description && (
                  <div className="mt-8">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Description détaillée
                    </h4>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <p className="text-gray-700 leading-relaxed text-base">
                        {selectedReclamation.description}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsReclamationDetailModalOpen(false)}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                    aria-label="Close reclamation details modal"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Calendar;