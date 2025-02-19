import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Si estamos en el login, no renderizamos el encabezado
    if (location.pathname === '/') return null;

    const goToDashboard = () => {
        console.log("🔄 Navegando al Dashboard...");
        navigate('/dashboard');
    };

    return (
        <header className="header">
            <div className="header-content" onClick={goToDashboard}>
                <img 
                    src="https://static.wixstatic.com/media/be77b1_6f1fc88227c94c8aa303bc6dc225c26c~mv2.png/v1/fill/w_73,h_86,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logo-M2-Tech.png" 
                    alt="M2T Logo" 
                    className="header-logo"
                />
                <h1 className="header-title">Soporte M2T</h1>
            </div>
        </header>
    );
};

export default Header;