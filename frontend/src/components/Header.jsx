import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Si estamos en el login, no renderizamos el encabezado
    if (location.pathname === '/') return null;

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="header-container" onClick={goToDashboard}>
            <h1 className="header-title">Soporte M2T</h1>
        </div>
    );
};

export default Header;