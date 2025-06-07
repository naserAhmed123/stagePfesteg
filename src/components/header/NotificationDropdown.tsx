import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../ui/dropdown/Dropdown';
import { DropdownItem } from '../ui/dropdown/DropdownItem';
import { Link } from 'react-router-dom';
import { Client, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import song from './alert.mp3';

interface User {
  id: number;
  email: string;
  role: string;
}

interface NotificationData {
  id: number;
  message: string;
  type: string;
  timestamp: string;
  isRead: boolean;
  uniqueKey: string;
}

interface DecodedToken {
  email?: string;
  sub?: string;
  role?: string;
  exp?: number;
}

interface ToastData {
  id: string;
  notification: NotificationData;
}

const NOTIFICATION_SOUNDS: Record<string, string> = {
  stuck_reclamation: song,
  pending_report: song,
  material_shortage: song,
  new_reclamation: song,
  completed_reclamation: song,
  problem_reclamation: song,
  new_complaint: song,
  report_rejected: song,
  report_accepted: song,
  complaint_verified: song,
  default: song,
};

interface CustomToastProps {
  notification: NotificationData;
  onClose: () => void;
  getNotificationIcon: (type: string) => string;
  formatTimestamp: (timestamp: string) => string;
  onNotificationClick: (notificationId: number) => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  notification,
  onClose,
  getNotificationIcon,
  formatTimestamp,
  onNotificationClick,
}) => {
  const navigate = useNavigate();

  const getNavigationPath = (type: string): string => {
    const pathMap: Record<string, string> = {
      stuck_reclamation: `/retardJour`,
      pending_report: `/reportageDirection`,
      material_shortage: `/matrieldirection`,
      new_reclamation: `/effectuerréclamation`,
      completed_reclamation: `/AjouterReclamation`,
      problem_reclamation: `/AjouterReclamation`,
      new_complaint: `/nonVerifPlainte`,
      report_rejected: `/listeReportage`,
      report_accepted: `/listeReportage`,
      complaint_verified: `/mesPlaintes`,
      default: '/notifications',
    };
    return pathMap[type] || pathMap.default;
  };

  const handleToastClick = () => {
    onNotificationClick(notification.id);
    navigate(getNavigationPath(notification.type));
    onClose();
  };

  const toastType =
    notification.type.includes('error') ||
    notification.type.includes('problem') ||
    notification.type.includes('rejected')
      ? 'error'
      : notification.type.includes('success') ||
        notification.type.includes('completed') ||
        notification.type.includes('accepted') ||
        notification.type.includes('verified')
      ? 'success'
      : notification.type.includes('warning') || notification.type.includes('stuck')
      ? 'warning'
      : 'info';

  return (
    <div
      className={`relative flex items-start gap-3 p-4 mb-2 rounded-xl shadow-2xl border-l-4 animate-slide-in max-w-sm w-full transition-all duration-300 cursor-pointer ${
        toastType === 'error'
          ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
          : toastType === 'success'
          ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
          : toastType === 'warning'
          ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
          : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
      }`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      onClick={handleToastClick}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          toastType === 'error'
            ? 'bg-red-100 text-red-600'
            : toastType === 'success'
            ? 'bg-green-100 text-green-600'
            : toastType === 'warning'
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-blue-100 text-blue-600'
        }`}
      >
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
            {notification.message}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Fermer le toast"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimestamp(notification.timestamp)}</p>
      </div>
      <div
        className={`absolute bottom-0 left-0 h-1 animate-progress ${
          toastType === 'error'
            ? 'bg-red-500'
            : toastType === 'success'
            ? 'bg-green-500'
            : toastType === 'warning'
            ? 'bg-yellow-500'
            : 'bg-blue-500'
        }`}
      />
    </div>
  );
};

export default function NotificationDropdown(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifying, setNotifying] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const displayedToastsRef = useRef<Set<string>>(new Set());
  const stompClientRef = useRef<Client | null>(null);

  const isLocalStorageAvailable = (): boolean => {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch (e) {
      console.error('LocalStorage unavailable:', e);
      return false;
    }
  };

  const loadSeenNotificationIds = (): Set<string> => {
    if (!isLocalStorageAvailable()) return new Set();
    try {
      const stored = window.localStorage.getItem('seenNotificationIds');
      console.log('Loaded seenNotificationIds:', stored);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading seen notification IDs:', error);
      return new Set();
    }
  };

  const saveSeenNotificationIds = (seenIds: Set<string>): void => {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.setItem('seenNotificationIds', JSON.stringify([...seenIds]));
      console.log('Saved seenNotificationIds:', [...seenIds]);
    } catch (error) {
      console.error('Error saving seen notification IDs:', error);
    }
  };

  const loadReadNotifications = (): Set<string> => {
    if (!isLocalStorageAvailable()) return new Set();
    try {
      const stored = window.localStorage.getItem('readNotifications');
      console.log('Loaded readNotifications:', stored);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading read notifications:', error);
      return new Set();
    }
  };

  const saveReadNotifications = (readNotifications: Set<string>): void => {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.setItem('readNotifications', JSON.stringify([...readNotifications]));
      console.log('Saved readNotifications:', [...readNotifications]);
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  function parseJwt(token: string): DecodedToken | null {
    if (!token) {
      console.log('No token provided');
      return null;
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      console.log('Decoded JWT:', decoded);
      return decoded;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  const fetchUser = async (): Promise<void> => {
    if (!isLocalStorageAvailable()) {
      setError('Local storage not available');
      setLoading(false);
      console.log('Local storage not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = window.localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');
      if (!token) {
        throw new Error('No token found');
      }

      const decoded = parseJwt(token);
      if (!decoded) {
        throw new Error('Invalid JWT token');
      }

      const email = decoded.email || decoded.sub;
      if (!email) {
        throw new Error('No email or subject in JWT');
      }

      console.log('Fetching user for email:', email);
      const response = await fetch(`http://localhost:8080/api/utilisateur/${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      const userData: User = await response.json();
      console.log('Fetched user:', userData);
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    if (!user || !isLocalStorageAvailable()) return;

    const token = window.localStorage.getItem('token');
    if (!token) {
      console.log('No token for WebSocket');
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);
    stompClientRef.current = stompClient;

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('Connected to WebSocket');
        stompClient.subscribe('/topic/reclamations', (message) => {
          try {
            const reclamation = JSON.parse(message.body);
            console.log('WebSocket reclamation:', reclamation);
            if (reclamation.etat === 'ENCOURS' && reclamation.id) {
              const seenIds = loadSeenNotificationIds();
              const uniqueKey = `stuck_reclamation_${reclamation.id}`;
              if (!seenIds.has(uniqueKey)) {
                console.log('New WebSocket notification:', uniqueKey);
                const newNotification: NotificationData = {
                  id: notifications.length + 1,
                  message: `Un technicien fait un retard dans certaines réclamations (#${reclamation.id})`,
                  type: 'stuck_reclamation',
                  timestamp: new Date().toISOString(),
                  uniqueKey,
                  isRead: false,
                };
                setNotifications((prev) => [...prev, newNotification]);
                seenIds.add(uniqueKey);
                saveSeenNotificationIds(seenIds);
              }
            }
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        });
      },
      (error) => {
        console.error('WebSocket connection error:', error);
      }
    );

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        console.log('Disconnected from WebSocket');
      }
    };
  };

  const fetchNotifications = async (): Promise<void> => {
    if (!user || !isLocalStorageAvailable()) {
      console.log('Skipping fetch: No user or localStorage unavailable', { user });
      return;
    }

    const token = window.localStorage.getItem('token');
    if (!token) {
      console.log('No token found for notifications');
      setError('No authentication token');
      return;
    }

    try {
      const notificationConfigs: Array<{ url: string; message: string; type: string }> = [];
      switch (user.role.toLowerCase()) {
        case 'direction':
          notificationConfigs.push(
            {
              url: 'http://localhost:8080/reclamations/encours/stuck',
              message: 'Un technicien fait un retard dans certaines réclamations',
              type: 'stuck_reclamation',
            },
            {
              url: 'http://localhost:8080/api/reportages/encours',
              message: 'Une notification depuis le bureau intervention de reporter un citoyen',
              type: 'pending_report',
            },
            {
              url: 'http://localhost:8080/api/materiels/status/rupture',
              message: 'Une notification depuis le technicien de rupture de stock dans un certain matériel',
              type: 'material_shortage',
            }
          );
          break;

        case 'service_intervention':
          notificationConfigs.push(
            {
              url: 'http://localhost:8080/reclamations/non-equipe',
              message: 'Il y a une nouvelle réclamation depuis un citoyen',
              type: 'new_reclamation',
            },
            {
              url: 'http://localhost:8080/reclamations/terminer',
              message: 'Il y a une réclamation terminée avec succès',
              type: 'completed_reclamation',
            },
            {
              url: 'http://localhost:8080/reclamations/problem',
              message: 'Il y a une réclamation qui ne termine pas car elle a un problème',
              type: 'problem_reclamation',
            },
            {
              url: 'http://localhost:8080/api/plaintes/nonverif',
              message: 'Il y a une nouvelle plainte depuis un citoyen',
              type: 'new_complaint',
            },
            {
              url: 'http://localhost:8080/api/reportages/refuser',
              message: 'La direction a refusé votre dernier reportage',
              type: 'report_rejected',
            },
            {
              url: 'http://localhost:8080/api/reportages/accepter',
              message: 'La direction a accepté votre dernier reportage et bloqué le citoyen',
              type: 'report_accepted',
            }
          );
          break;

        case 'citoyen':
          notificationConfigs.push({
            url: `http://localhost:8080/api/plaintes/${user.id}/verif`,
            message: "Le bureau d'intervention de STEG a vérifié votre dernière plainte",
            type: 'complaint_verified',
          });
          break;

        default:
          console.log('Unrecognized user role:', user.role);
          setError(`Unrecognized role: ${user.role}`);
          return;
      }

      console.log('Notification configs:', notificationConfigs);

      const seenIds = loadSeenNotificationIds();
      const readNotifications = loadReadNotifications();
      const newNotifications: NotificationData[] = [];

      for (const config of notificationConfigs) {
        try {
          console.log(`Fetching from ${config.url}`);
          const response = await fetch(config.url, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.log(`Failed to fetch ${config.url}: ${response.status} ${response.statusText}`);
            setError(`Failed to fetch ${config.url}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          console.log(`Response from ${config.url}:`, data);
          const items = Array.isArray(data) ? data : [data];

          items.forEach((item: any, index: number) => {
            const id = item.id || item.reclamationId || item.id || item.reportageId || item.idReportage;
            if (id) {
              const uniqueKey = `${config.type}_${id}`;
              if (!seenIds.has(uniqueKey)) {
                console.log(`New notification: ${uniqueKey}`);
                seenIds.add(uniqueKey);
                newNotifications.push({
                  id: notifications.length + newNotifications.length + index + 1,
                  message: `${config.message} (#${id})`,
                  type: config.type,
                  timestamp: new Date().toISOString(),
                  uniqueKey,
                  isRead: readNotifications.has(uniqueKey),
                });
              } else {
                console.log(`Skipping seen notification: ${uniqueKey}`);
              }
            } else {
              console.log('Item missing ID:', item);
            }
          });
        } catch (err) {
          console.error(`Error fetching ${config.url}:`, err);
          setError(`Error fetching ${config.url}`);
        }
      }

      if (newNotifications.length > 0) {
        console.log('Adding new notifications:', newNotifications);
        setNotifications((prev) => [...prev, ...newNotifications]);
        saveSeenNotificationIds(seenIds);
      } else {
        console.log('No new notifications found');
      }
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
      setError('Failed to fetch notifications');
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const now = new Date();
      const notificationTime = new Date(timestamp);
      if (isNaN(notificationTime.getTime())) return 'Unknown';
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} min`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
      return `${Math.floor(diffInMinutes / 1440)} d`;
    } catch {
      return 'Unknown';
    }
  };

  const getNotificationIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      stuck_reclamation: '⚠️',
      pending_report: '📋',
      material_shortage: '📦',
      new_reclamation: '🔔',
      completed_reclamation: '✅',
      problem_reclamation: '❌',
      new_complaint: '📝',
      report_rejected: '❌',
      report_accepted: '✅',
      complaint_verified: '✔️',
    };
    return iconMap[type] || '🔔';
  };

  const playNotificationSound = useCallback(
    (type?: string) => {
      if (!soundEnabled) {
        console.log('Sound disabled, skipping play');
        return;
      }
      try {
        if (audioRef.current) {
          console.log('Pausing current audio');
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const soundUrl = song;
        console.log(`Attempting to play sound: ${soundUrl}`);
        const audio = new Audio(soundUrl);
        audioRef.current = audio;
        audio.volume = 1.0;
        audio.play()
          .then(() => console.log(`Sound played successfully: ${soundUrl}`))
          .catch((err) => console.error(`Error playing sound ${soundUrl}:`, err));
      } catch (error) {
        console.error('Unexpected error in playNotificationSound:', error);
      }
    },
    [soundEnabled]
  );

  const showCustomToast = useCallback((notification: NotificationData) => {
    const toastId = `${notification.uniqueKey}-${Date.now()}`;
    console.log(`Showing toast: ${toastId}`);
    setToasts((prev) => {
      if (prev.length >= 3) return [...prev.slice(1), { id: toastId, notification }];
      return [...prev, { id: toastId, notification }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 6000);
  }, []);

  const toggleDropdown = (): void => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = (): void => {
    setIsOpen(false);
  };

  const handleNotificationClick = (notificationId: number): void => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((n) => {
        if (n.id === notificationId) {
          const readNotifications = loadReadNotifications();
          readNotifications.add(n.uniqueKey);
          saveReadNotifications(readNotifications);
          displayedToastsRef.current.delete(n.uniqueKey);
          console.log(`Marked as read: ${n.uniqueKey}`);
          return { ...n, isRead: true };
        }
        return n;
      });
      setNotifying(updatedNotifications.some((n) => !n.isRead));
      return updatedNotifications;
    });
    closeDropdown();
  };

  const markAllAsRead = (): void => {
    const readNotifications = loadReadNotifications();
    setNotifications((prev) => {
      const updatedNotifications = prev.map((notification) => {
        if (!notification.isRead) {
          readNotifications.add(notification.uniqueKey);
          displayedToastsRef.current.delete(notification.uniqueKey);
          console.log(`Marked all as read: ${notification.uniqueKey}`);
          return { ...notification, isRead: true };
        }
        return notification;
      });
      saveReadNotifications(readNotifications);
      setNotifying(false);
      return updatedNotifications;
    });
  };

  const toggleSound = (): void => {
    setSoundEnabled((prev) => {
      const newSoundEnabled = !prev;
      if (isLocalStorageAvailable()) {
        window.localStorage.setItem('soundEnabled', JSON.stringify(newSoundEnabled));
      }
      console.log(`Sound enabled: ${newSoundEnabled}`);
      return newSoundEnabled;
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('User loaded, starting notification fetch:', user);
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      const cleanupWebSocket = setupWebSocket();
      return () => {
        clearInterval(interval);
        if (cleanupWebSocket) cleanupWebSocket();
      };
    }
  }, [user]);

  useEffect(() => {
    const newNotifications = notifications.filter(
      (n) => !n.isRead && !displayedToastsRef.current.has(n.uniqueKey)
    );
    newNotifications.forEach((notification) => {
      showCustomToast(notification);
      displayedToastsRef.current.add(notification.uniqueKey);
      playNotificationSound(notification.type);
    });
    setNotifying(notifications.some((n) => !n.isRead));
    console.log('Current notifications:', notifications);
  }, [notifications, showCustomToast, playNotificationSound]);

  useEffect(() => {
    console.log('Testing alert sound on component mount');
    playNotificationSound();
  }, []);

  const handleCloseToast = (toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    console.log(`Closed toast: ${toastId}`);
  };

  if (loading) return <div className="animate-pulse h-11 w-11 bg-gray-200 rounded-full"></div>;
  if (error)
    return (
      <div className="text-red-600">
        Error: {error}
        <button
          onClick={() => {
            setError(null);
            fetchUser();
          }}
          className="ml-2 text-blue-600 underline"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="relative">
      <div className="fixed top-16 right-4 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <CustomToast
            key={toast.id}
            notification={toast.notification}
            onClose={() => handleCloseToast(toast.id)}
            getNotificationIcon={getNotificationIcon}
            formatTimestamp={formatTimestamp}
            onNotificationClick={handleNotificationClick}
          />
        ))}
      </div>
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-red-600 ${!notifying ? 'hidden' : 'flex'}`}
        >
          <span className="absolute inline-flex w-full h-full bg-red-600 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
            {notifications.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </h5>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-1 text-sm rounded transition-colors ${
                soundEnabled
                  ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'
              }`}
              title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                title="Marquer toutes comme lues"
              >
                Tout lire
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Fermer les notifications"
            >
              <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className="flex flex-col flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <li className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p>Aucune notification</p>
              </div>
            </li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.uniqueKey} className="flex-shrink-0">
                <DropdownItem
                  onItemClick={() => handleNotificationClick(notification.id)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <span className="relative block w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 flex-shrink-0">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`mb-1.5 text-sm break-words ${
                        !notification.isRead
                          ? 'text-gray-900 font-semibold dark:text-gray-100'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400 flex-wrap">
                      <span className="capitalize">{user?.role || 'Système'}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatTimestamp(notification.timestamp)}</span>
                      {!notification.isRead && (
                        <>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        </>
                      )}
                    </div>
                  </div>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        {notifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Link
              to="/notifications"
              className="block px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={closeDropdown}
            >
              Voir toutes les notifications
            </Link>
          </div>
        )}
      </Dropdown>
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes progress {
            from { width: 100%; }
            to { width: 0; }
          }
          .animate-slide-in { animation: slideIn 0.3s ease-out; }
          .animate-progress { width: 100%; animation: progress 6s linear forwards; }
        `}
      </style>
    </div>
  );
}