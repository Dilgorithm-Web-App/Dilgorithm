import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

export const Chat = () => {
    const { roomName } = useParams(); 
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Connect to the Django WebSocket server
        // Note: We use 127.0.0.1 to match your server's current running state
        socketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${roomName}/`);

        socketRef.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.error) {
                alert("Security Block: " + data.error); // Handles profanity/bot filtering
            } else {
                setMessages((prev) => [...prev, { sender: data.sender, text: data.message }]);
            }
        };

        socketRef.current.onclose = () => console.log("Chat socket closed");

        return () => socketRef.current.close();
    }, [roomName]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && socketRef.current) {
            socketRef.current.send(JSON.stringify({
                'message': input,
                'sender': 'Me' 
            }));
            setInput('');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/feed')} style={{ marginBottom: '10px', cursor: 'pointer' }}>← Back to Feed</button>
            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }}>
                <h3>Chat Room: {roomName.replace('room_', 'User ')}</h3>
                <div style={{ height: '350px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', backgroundColor: '#fff', marginBottom: '15px' }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ textAlign: msg.sender === 'Me' ? 'right' : 'left', margin: '10px 0' }}>
                            <div style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '15px', backgroundColor: msg.sender === 'Me' ? '#007bff' : '#e4e6eb', color: msg.sender === 'Me' ? '#fff' : '#000' }}>
                                <strong>{msg.sender}:</strong> {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Type a message..." 
                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Send</button>
                </form>
            </div>
        </div>
    );
};