import React, { useState, useRef, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import user from "./user.png";

const Chat1 = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState("z-2546@gmail.com"); // Remplacer par l'utilisateur connecté
    const [receiver, setReceiver] = useState("jean.dupont@example.com"); // Définir dynamiquement
    const fileInputRef = useRef(null);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = Stomp.over(socket);
        
        client.connect({}, (frame) => {
            console.log('Connected: ' + frame);
            
            // S'abonner à la queue privée
            client.subscribe(`/user/${currentUser}/queue/messages`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                addMessageToState(receivedMessage);
            });

            // S'abonner à la conversation spécifique
            client.subscribe(`/topic/${currentUser}.${receiver}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                addMessageToState(receivedMessage);
            });

            // S'abonner à l'autre sens de la conversation
            client.subscribe(`/topic/${receiver}.${currentUser}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                addMessageToState(receivedMessage);
            });

            setIsConnected(true);
            setStompClient(client);

        }, (error) => {
            console.error('Connection error:', error);
            setIsConnected(false);
        });

        return () => {
            if (stompClient && isConnected) {
                stompClient.disconnect();
            }
        };
    }, [currentUser, receiver]);

    const addMessageToState = (receivedMessage) => {
        setMessages(prevMessages => {
            // Vérifier si le message existe déjà
            if (prevMessages.some(msg => msg.id === receivedMessage.id)) {
                return prevMessages;
            }
            
            const messageType = receivedMessage.type?.toLowerCase() || 'text';
            const messageDate = new Date(receivedMessage.timestamp || new Date());
            const isToday = new Date().toDateString() === messageDate.toDateString();
            
            return [...prevMessages, {
                id: receivedMessage.id || Date.now(),
                type: messageType,
                content: receivedMessage.content,
                sender: receivedMessage.sender === currentUser || receivedMessage.sender?.email === currentUser ? 'me' : receivedMessage.sender?.email || receivedMessage.sender,
                time: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: isToday ? 'Aujourd\'hui' : messageDate.toLocaleDateString()
            }];
        });
    };

    const sendMessage = () => {
        if (!isConnected || inputMessage.trim() === '') return;
        
        const messageId = Date.now();
        const chatMessage = {
            id: messageId,
            content: inputMessage,
            sender: currentUser,
            receiver: receiver,
            type: 'TEXT',
            timestamp: new Date().toISOString()
        };

        // Ajout optimiste
        addMessageToState({
            ...chatMessage,
            sender: 'me'
        });

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        setInputMessage('');
    };

    const sendImage = (e) => {
        if (!isConnected || !e.target.files?.length) return;

        const file = e.target.files[0];
        const reader = new FileReader();
        const messageId = Date.now();

        reader.onload = (event) => {
            const chatMessage = {
                id: messageId,
                content: event.target.result,
                sender: currentUser,
                receiver: receiver,
                type: 'IMAGE',
                timestamp: new Date().toISOString()
            };

            // Ajout optimiste
            addMessageToState({
                ...chatMessage,
                sender: 'me'
            });

            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        };
        reader.readAsDataURL(file);
    };

    const groupMessagesByDate = () => {
        return messages.reduce((acc, message) => {
            const date = message.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(message);
            return acc;
        }, {});
    };

    const grpMessage = groupMessagesByDate();

    return (
        <>
            <PageBreadcrumb pageTitle="Discussion technicien" />
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-50 border-b border-gray-200 bg-white py-3 px-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <img src={user} height={50} width={50} className="rounded-full border border-gray-200" alt="User" />
                        <div>
                            <h4 className="font-semibold text-gray-800">Chef 1</h4>
                            <p className="text-xs text-emerald-600">
                                {isConnected ? 'En ligne' : 'Connexion en cours...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages container */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {Object.entries(grpMessage).map(([date, dayMessages]) => (
                        <div key={date}>
                            <div className="text-center text-sm text-gray-500 my-4">
                                <span className="bg-white px-3 py-1 rounded-full shadow-sm">{date}</span>
                            </div>
                            {dayMessages.map((message) => (
                                <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg ${message.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        {message.type === 'image' ? (
                                            <img src={message.content} alt="Sent" className="max-w-full h-auto rounded-md" />
                                        ) : (
                                            <p>{message.content}</p>
                                        )}
                                        <div className={`text-xs mt-1 ${message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {message.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Message input area */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={sendImage}
                        accept="image/*" 
                        className="hidden"
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <input 
                        type="text" 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Écrire un message..." 
                        className="flex-grow p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        onClick={sendMessage}
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Chat1;