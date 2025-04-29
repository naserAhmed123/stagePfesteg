import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    calendar: string;
    reclamation?: any;
  };
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayReclamations, setSelectedDayReclamations] = useState<CalendarEvent[]>([]);
  const [isReclamationsModalOpen, setIsReclamationsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  
  const [selectedReclamation, setSelectedReclamation] = useState<any>(null);
  const [isReclamationDetailModalOpen, setIsReclamationDetailModalOpen] = useState(false);

  const calendarsEvents = {
    CRITIQUE: "danger",
    IMPORTANTE: "warning",
    MOYENNE: "primary",
    FAIBLE: "success",
  };

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/reclamations');
      if (!response.ok) {
        throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
      }
      const data = await response.json();
      const reclamationEvents: CalendarEvent[] = data.map((reclamation: any, index: number) => ({
        id: `${reclamation.reference}-${index}`,
        title: `${reclamation.typePanne} - ${reclamation.importance}`,
        start: new Date(reclamation.heureReclamation).toISOString(),
        allDay: false,
        extendedProps: {
          calendar: calendarsEvents[reclamation.importance as keyof typeof calendarsEvents] || "primary",
          reclamation: reclamation,
        },
      }));
      setEvents(reclamationEvents);
    } catch (e: any) {
      console.error('Erreur lors de la récupération des réclamations:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamations();

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {},
      debug: (str) => console.log(str),
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        console.log('Connecté au serveur WebSocket');
        stompClient.subscribe('/topic/reclamations', (message) => {
          console.log('Message reçu:', message.body);
          const newReclamation = JSON.parse(message.body);
          const newEvent: CalendarEvent = {
            id: `${newReclamation.reference}-${Date.now()}`,
            title: `${newReclamation.typePanne} - ${newReclamation.importance}`,
            start: new Date(newReclamation.heureReclamation).toISOString(),
            allDay: false,
            extendedProps: {
              calendar: calendarsEvents[newReclamation.importance as keyof typeof calendarsEvents] || "primary",
              reclamation: newReclamation,
            },
          };
          setEvents((prevEvents) => [...prevEvents, newEvent]);
        });
      },
      onWebSocketError: (error) => {
        console.error('Erreur WebSocket:', error);
      },
      onStompError: (error) => {
        console.error('Erreur STOMP:', error);
      },
    });

    stompClient.activate();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  const getReclamationsCountForDay = (date: Date): number => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate() &&
        event.extendedProps.reclamation
      );
    }).length;
  };

  // Gérer le clic sur un jour
  const handleDateClick = (arg: { dateStr: string }) => {
    const selectedDate = new Date(arg.dateStr);
    const dayReclamations = events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate() &&
        event.extendedProps.reclamation
      );
    });
    setSelectedDayReclamations(dayReclamations);
    setIsReclamationsModalOpen(true);
  };
  
  // Nouveau handler pour le clic sur un événement
  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventData = clickInfo.event.extendedProps;
    if (eventData && eventData.reclamation) {
      setSelectedReclamation(eventData.reclamation);
      setIsReclamationDetailModalOpen(true);
    }
  };

  // Personnaliser le contenu des carreaux en vue mensuelle
  const renderDayCellContent = (arg: { date: Date; isToday: boolean }) => {
    const count = getReclamationsCountForDay(arg.date);
    if (count === 0) return null;

    return (
      <div
        className="flex justify-center items-center h-full cursor-pointer"
        onClick={() => handleDateClick({ dateStr: arg.date.toISOString().split('T')[0] })}
      >
        <span className="text-sm font-medium text-gray-800 dark:text-white">
          {count} réclamation{count > 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  // Rendu des événements pour les vues semaine et jour
  const renderEventContent = (eventInfo: any) => {
    const currentView = calendarRef.current?.getApi().view.type;
    if (currentView === "dayGridMonth") {
      return null; // Ne pas afficher les événements individuels en vue mensuelle
    }
    const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
    return (
      <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded cursor-pointer`}>
        <div className="fc-daygrid-event-dot"></div>
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <>
      {loading && <div className="text-center p-4">Chargement...</div>}
      {error && (
        <div className="text-center p-4 text-red-500">
          Erreur : {error}
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
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
            eventClick={handleEventClick}  // Ajouter le handler pour le clic sur événement
            dayCellContent={renderDayCellContent}
            dateClick={handleDateClick}
            locale="fr"
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
          />
        </div>

        {/* Modal pour afficher les réclamations du jour */}
        <Modal
          isOpen={isReclamationsModalOpen}
          onClose={() => setIsReclamationsModalOpen(false)}
          className="max-w-[900px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Réclamations du jour
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Liste des réclamations pour le jour sélectionné
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Type de panne
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Importance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      État
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Rue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {selectedDayReclamations.length > 0 ? (
                    selectedDayReclamations.map((event) => (
                      <tr 
                        key={event.id} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          setSelectedReclamation(event.extendedProps.reclamation);
                          setIsReclamationDetailModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.extendedProps.reclamation?.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.extendedProps.reclamation?.typePanne}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.extendedProps.reclamation?.importance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.extendedProps.reclamation?.etat}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {event.extendedProps.reclamation?.rue}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aucune réclamation pour ce jour.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={() => setIsReclamationsModalOpen(false)}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
        
        {/* Nouvelle Modal pour afficher les détails d'une réclamation spécifique */}
        <Modal
          isOpen={isReclamationDetailModalOpen}
          onClose={() => setIsReclamationDetailModalOpen(false)}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Détails de la réclamation
            </h5>
            {selectedReclamation && (
              <div className="mt-4 p-6 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Référence</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.reference}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de panne</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.typePanne}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Genre de panne</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.genrePanne}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Importance</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.importance}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">État</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.etat}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Numéro client</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.numClient}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rue</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedReclamation.rue}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date et heure</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedReclamation.heureReclamation).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                {/* Afficher d'autres détails si disponibles */}
                {selectedReclamation.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                    <p className="text-base text-gray-900 dark:text-white whitespace-pre-line mt-1">
                      {selectedReclamation.description}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={() => setIsReclamationDetailModalOpen(false)}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Calendar;