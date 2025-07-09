import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import { useUser } from '../context/UserContext';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logoutUser } = useUser();

    
    if (location.pathname === '/') return null;

    const goToDashboard = () => {
        console.log("🔄 Navegando al Dashboard...");
        navigate('/dashboard');
    };

    return (
        <header className="header">
            <div className="header-content">
                <img 
                    src="https://static.wixstatic.com/media/be77b1_6f1fc88227c94c8aa303bc6dc225c26c~mv2.png/v1/fill/w_73,h_86,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logo-M2-Tech.png" 
                    alt="M2T Logo" 
                    className="header-logo"
                />
                <h1 className="header-title">Soporte M2T</h1>
                {user && (
                  <div className="user-profile">
                    <span>👤 {user.nombre || user.email}</span>
                    <span style={{marginLeft: 12, fontSize: 13, color: "#888"}}>{user.rol}</span>
                    <button className="logout-btn" onClick={() => { logoutUser(); navigate('/login'); }}>Cerrar sesión</button>
                  </div>
                )}
            </div>
            <button className="home-button" onClick={goToDashboard}>
                🏠 Home
            </button>
        </header>
    );
};

export default Header;