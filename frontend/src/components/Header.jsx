import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import '../styles/Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logoutUser } = useUser();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ⬇️ Hooks SIEMPRE antes del return o condicionales
    if (location.pathname === '/') return null;

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
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
            </div>
            <div className="header-actions">
                {user && (
                    <span className="header-username">
                        👤 {user.nombre}
                    </span>
                )}
                <button className="home-button" onClick={goToDashboard}>
                    🏠 Home
                </button>
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        className="settings-btn"
                        aria-label="Opciones de usuario"
                        onClick={() => setShowMenu((v) => !v)}
                    >
                        <FiSettings />
                    </button>
                    {showMenu && (
                        <div className="user-menu-dropdown">
                            <span>
                                {user?.nombre} <br />
                                <span style={{ fontSize: 12, color: '#888' }}>{user?.rol}</span>
                            </span>
                            <button
                                className="user-menu-btn"
                                onClick={handleLogout}
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;