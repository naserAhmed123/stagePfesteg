import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Client } from '@stomp/stompjs';
import { useEffect , useState } from "react";
import SockJS from 'sockjs-client';
import { Link } from "react-router";

export default function RecentOrders() {
    const [reclamations, setReclamations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
  
    useEffect(() => {
      fetchReclamations();  
  
      const stompClient = new Client({
        brokerURL: 'ws://localhost:8080/ws',
        connectHeaders: {},
        debug: (str) => console.log(str),
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
          console.log('Connected to WebSocket server');
          stompClient.subscribe('/topic/reclamations', (message) => {
            console.log('Received message:', message.body);
            setReclamations((prevReclamations) => [
              ...prevReclamations,
              JSON.parse(message.body),
            ]);
          });
        },
        onWebSocketError: (error) => {
          console.error('WebSocket Error:', error);
        },
        onStompError: (error) => {
          console.error('STOMP Error:', error);
        },
      });
  
      stompClient.activate();
  
      return () => {
        if (stompClient) {
          stompClient.deactivate();
        }
      };
    }, []);
  

    const fetchReclamations = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/reclamations');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReclamations(data);
      } catch (e) {
        console.error('Error fetching reclamations:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    const getEtatDisplay = (etat) => {
      switch(etat) {
        case "PAS_ENCOURS":
          return { text: "Nouveau", class: "bg-blue-200 w-full" };
        case "ENCOURS":
          return { text: "En cours", class: "bg-blue-500 w-2/3" };
        case "TERMINER":
          return { text: "Terminer", class: "bg-green-500 w-full" };
        case "ANNULEE":
          return { text: "Annulée", class: "bg-red-500 w-full" };
        default:
          return { text: "Inconnu", class: "bg-gray-500 w-1/3" };
      }
    };
    const les5Derniers = reclamations.slice(-6);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Les 6 dernieres réclamations
          </h3>
        </div>

        <div className="flex items-center gap-3">
       
          <Link
           to="/AjouterReclamation"
           className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
           Voir tout
          </Link>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Réference
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Importance
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Etat
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Genre Panne
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Transmis à
              </TableCell>
            </TableRow>
          </TableHeader>

{/* nerj3lha nhar ekher  */}
            {reclamations.length === 0 ? (
            <TableBody >
              <TableRow >
                <TableCell >
                  <div className="flex justify-center p-4">
                    <div className="relative w-full max-w-sm rounded-lg border border-gray-100 bg-white px-12 py-6 shadow-md">
                      <button className="absolute top-0 right-0 p-4 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <p className="relative mb-1 text-sm font-medium">
                        <span className="absolute -left-7 flex h-5 w-5 items-center justify-center rounded-xl bg-red-400 text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-3 w-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                        <span className="text-gray-700">Erreur :</span>
                      </p>
                      <p className="text-sm text-gray-600">{error}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
            ) : (les5Derniers.map((rec , index) => (
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">

              <TableRow key={index} className="">
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                  <div className="bg-blue-700 w-auto p-2 pb-6 rounded-lg h-5">
                  <p className="font-medium text-white  text-theme-sm dark:text-white/90">
                        {rec.reference}
                      </p>
                      </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {rec.importance}
                </TableCell>
                
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                <div className="w-48 h-1.5 bg-blue-200 overflow-hidden rounded-full">
                                <div className={getEtatDisplay(rec.etat).class + " h-1.5"}></div>
                              </div>
                              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {getEtatDisplay(rec.etat).text}
                              </p>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {rec.genrePanne}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {rec.equipeId}
                </TableCell>
              </TableRow>
              </TableBody>

            ))

            )}
        </Table>
      </div>
    </div>
  );
}
