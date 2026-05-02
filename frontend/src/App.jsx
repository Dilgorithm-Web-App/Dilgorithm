import { useState } from 'react'
import './App.css'
import logoText from './assets/logo-text.png'

function App() {
  // NAVIGATION STATE: 'login', 'register', 'verify', or 'dashboard'
  const [currentView, setCurrentView] = useState('register');
  const [step, setStep] = useState(1);

  // DATA STATE
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', otp: ''
  });

  // UC-01 Logic: Progressing through registration
  const handleRegisterNext = () => {
    if (step === 2) setCurrentView('verify'); // Move to UC-02 after email/pass
    else setStep(step + 1);
  };

  // UC-02 Logic: After OTP, go to Login or Dashboard
  const handleVerify = () => {
    alert("Email Verified Successfully!");
    setCurrentView('login'); // Send them to Login to test UC-03
  };

  // UC-03 Logic: Simple Login check
  const handleLogin = () => {
    if (formData.email && formData.password) {
        setCurrentView('dashboard');
    } else {
        alert("Please enter credentials");
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      
      {/* GLOBAL HEADER */}
      <header style={{ padding: '30px', textAlign: 'center' }}>
        <img src={logoText} alt="Dilgorithm" style={{ width: '280px' }} />
      </header>

      <main style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <div style={cardStyle}>

          {/* --- UC-03: LOGIN VIEW --- */}
          {currentView === 'login' && (
            <div>
              <h2 style={titleStyle}>Login to Dilgorithm</h2>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" placeholder="amna@example.com" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
              
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" placeholder="••••••••" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} />
              
              <button style={mainBtn} onClick={handleLogin}>Login</button>
              
              <p style={toggleText}>
                New to Dilgorithm? <span style={linkStyle} onClick={() => setCurrentView('register')}>Create Account</span>
              </p>
            </div>
          )}

          {/* --- UC-01: REGISTRATION VIEW (Steps 1-2) --- */}
          {currentView === 'register' && (
            <div>
              <h2 style={titleStyle}>Step {step} of 12</h2>
              
              {step === 1 && (
                <div>
                  <h3 style={subTitle}>What is your Name?</h3>
                  <input style={inputStyle} placeholder="Full Name" 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                  <button style={mainBtn} onClick={handleRegisterNext}>Confirm Name</button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 style={subTitle}>Set your Credentials</h3>
                  <input style={inputStyle} placeholder="Email Address" type="email" 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <input style={inputStyle} placeholder="Create Password" type="password" 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  <button style={mainBtn} onClick={handleRegisterNext}>Register</button>
                </div>
              )}

              <p style={toggleText}>
                Already have an account? <span style={linkStyle} onClick={() => setCurrentView('login')}>Login</span>
              </p>
            </div>
          )}

          {/* --- UC-02: OTP VERIFICATION --- */}
          {currentView === 'verify' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={titleStyle}>Verify Your Email</h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                We sent a 4-digit code to <strong>{formData.email}</strong>
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <input style={otpBox} maxLength="1" />
                <input style={otpBox} maxLength="1" />
                <input style={otpBox} maxLength="1" />
                <input style={otpBox} maxLength="1" />
              </div>
              <button style={{...mainBtn, marginTop: '30px'}} onClick={handleVerify}>Verify & Continue</button>
            </div>
          )}

          {/* --- SUCCESS / DASHBOARD PLACEHOLDER --- */}
          {currentView === 'dashboard' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#8B0000' }}>Welcome Back, {formData.fullName || 'User'}!</h2>
              <p>You have successfully logged in (UC-03).</p>
              <button style={mainBtn} onClick={() => setCurrentView('login')}>Logout</button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// --- STYLING (The Figma Look) ---
const cardStyle = { 
  width: '380px', padding: '40px', borderRadius: '30px', 
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' 
};
const titleStyle = { color: '#333', fontSize: '24px', textAlign: 'center', marginBottom: '30px' };
const subTitle = { fontSize: '18px', color: '#555', marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8B0000', marginBottom: '5px', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px', outline: 'none' };
const otpBox = { width: '50px', height: '60px', textAlign: 'center', fontSize: '24px', border: '1px solid #ddd', borderRadius: '10px' };
const mainBtn = { width: '100%', padding: '16px', backgroundColor: '#8B0000', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };
const toggleText = { textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#777' };
const linkStyle = { color: '#8B0000', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' };

export default App