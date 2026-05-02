import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './Chat.css';

export const Chat = () => {
    const { roomName } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);
    const endRef = useRef(null);
    const navigate = useNavigate();

    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await api.get('accounts/feed/');
                const data = res.data || [];
                setContacts(data.map(user => ({
                    name: user.fullName || user.username || 'User',
                    status: 'Active recently',
                    id: user.id
                })));
            } catch (err) {
                console.error("Failed to fetch contacts", err);
            }
        };
        fetchContacts();
    }, []);

    const COLORS = ['#E57373', '#64B5F6', '#81C784', '#BA68C8', '#FFB74D', '#4DD0E1'];
    const displayName = roomName.replace('room_', 'User ');

    useEffect(() => {
        socketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${roomName}/`);
        socketRef.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.error) alert("Security Block: " + data.error);
            else setMessages(prev => [...prev, { sender: data.sender, text: data.message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        };
        socketRef.current.onclose = () => console.log("Socket closed");
        return () => socketRef.current?.close();
    }, [roomName]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = (e) => {
        e.preventDefault();
        if (input.trim() && socketRef.current) {
            socketRef.current.send(JSON.stringify({ message: input, sender: 'Me' }));
            setInput('');
        }
    };

    return (
        <div className="ch-layout">
            {/* Contacts Panel */}
            <div className="ch-contacts">
                <h4 className="ch-contacts-title">Messages</h4>
                {contacts.map((c, i) => (
                    <div key={c.id} className={`ch-contact ${roomName === `room_${c.id}` ? 'ch-contact--active' : ''}`} onClick={() => navigate(`/chat/room_${c.id}`)}>
                        <div className="ch-contact-av" style={{ background: COLORS[i % 6] }}>{c.name[0]}</div>
                        <div className="ch-contact-info">
                            <div className="ch-contact-name">{c.name}</div>
                            <div className="ch-contact-status">{c.status}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Area */}
            <div className="ch-main">
                <div className="ch-header">
                    <div className="ch-header-left">
                        <div className="ch-header-av" style={{ background: '#E57373' }}>{displayName[0]?.toUpperCase() || 'U'}</div>
                        <div>
                            <div className="ch-header-name">{displayName}</div>
                            <div className="ch-header-status">Online now</div>
                        </div>
                    </div>
                    <button className="ch-add-family" onClick={() => alert("Family invite sent to your connections!")}>ADD FAMILY</button>
                </div>

                <div className="ch-messages">
                    {messages.length === 0 && (
                        <div className="ch-empty">
                            <span style={{ fontSize: 36 }}>💬</span>
                            <p>Start the conversation! Say hello.</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`ch-msg ${m.sender === 'Me' ? 'ch-msg--sent' : 'ch-msg--recv'}`}>
                            <div className="ch-bubble">{m.text}</div>
                            <div className="ch-time">{m.time}</div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                <form className="ch-input-bar" onSubmit={send}>
                    <input className="ch-input" type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Message..." />
                    <button type="submit" className="ch-send">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};