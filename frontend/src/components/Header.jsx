import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import '../styles/Header.css';
import FormularioCrearUsuario from './FormularioCrearUsuario';
import FormularioEditarUsuario from './FormularioEditarUsuario';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logoutUser } = useUser();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const [showCrearUsuario, setShowCrearUsuario] = useState(false);
    const [showEditarUsuario, setShowEditarUsuario] = useState(false);

    const abrirCrearUsuario = () => setShowCrearUsuario(true);
    const abrirEditarUsuario = () => setShowEditarUsuario(true);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                {user?.rol === "admin" && (
                    <button
                        className="gestion-usuarios-btn"
                        onClick={() => navigate('/admin-usuarios')}
                    >
                        👥 Gestión de usuarios
                    </button>
                )}
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
        {user?.rol?.toLowerCase() === "admin" && (
        <button
            className="user-menu-btn"
            onClick={abrirCrearUsuario}
        >
            Crear usuario
        </button>
        )}
        <button
            className="user-menu-btn"
            onClick={abrirEditarUsuario}
        >
            Editar mis datos
        </button>
        <button
            className="user-menu-btn"
            onClick={handleLogout}
        >
            Cerrar sesión
        </button>
    </div>
)}
{showCrearUsuario && user?.rol?.toLowerCase() === "admin" && (
    <div className="modal-overlay">
        <div className="modal-content">
            <h2>Crear usuario</h2>
            <FormularioCrearUsuario onClose={() => setShowCrearUsuario(false)} />
        </div>
    </div>
)}
{showEditarUsuario && (
    <div className="modal-overlay">
        <div className="modal-content">
            <h2>Editar mis datos</h2>
            <FormularioEditarUsuario 
                usuario={user} 
                onClose={() => setShowEditarUsuario(false)}
            />
        </div>
    </div>
)}
                </div>
            </div>
        </header>
    );
};

export default Header;