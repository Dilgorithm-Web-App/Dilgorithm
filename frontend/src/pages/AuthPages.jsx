import { useState, useContext, useEffect } from 'react'; // Added useEffect
import { AuthContext } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    // --- NEW: CONNECTION STATUS STATE ---
    const [status, setStatus] = useState("Checking backend...");
    const [isConnected, setIsConnected] = useState(false);

    // --- NEW: CONNECTION TEST LOGIC ---
    useEffect(() => {
        api.get('accounts/test/')
            .then(response => {
                setStatus("Connected to Dilgorithm Backend");
                setIsConnected(true);
            })
            .catch(error => {
                console.error("Connection failed:", error);
                setStatus("Backend Connection Failed");
                setIsConnected(false);
            });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Login to Dilgorithm</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required /><br/><br/>
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required /><br/><br/>
                <button type="submit">Log In</button>
            </form>
            <p>Need an account? <a href="/register">Register here</a>.</p>

            {/* --- NEW: STATUS INDICATOR UI --- */}
            <div style={{ 
                marginTop: '30px', 
                fontSize: '13px', 
                color: isConnected ? '#27ae60' : '#c0392b',
                fontWeight: 'bold'
            }}>
                ● {status}
            </div>
        </div>
    );
};
export const Register = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('accounts/register/', { email, username, password });
            alert('Registration Successful! Please log in.');
            navigate('/login');
        } catch (error) {
            // This prints the exact error from Django into your browser console
            console.error("Django says:", error.response?.data); 
            
            // This pops up the real error on your screen
            alert("Real Error: " + JSON.stringify(error.response?.data || error.message));
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Register for Dilgorithm</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required /><br/><br/>
                <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} required /><br/><br/>
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required /><br/><br/>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="/login">Log in here</a>.</p>
        </div>
    );
};