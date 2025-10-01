import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSettings, FiLayers } from 'react-icons/fi';
import '../styles/Header.css';
import FormularioCrearUsuario from './FormularioCrearUsuario';
import FormularioEditarUsuario from './FormularioEditarUsuario';
import { Link } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logoutUser } = useUser();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const [showCrearUsuario, setShowCrearUsuario] = useState(false);
    const [showEditarUsuario, setShowEditarUsuario] = useState(false);
    const [modulo, setModulo] = useState(localStorage.getItem('modulo') || 'actual');

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

    // Refresca el badge cuando cambias de ruta o cuando otro tab cambia el módulo
    useEffect(() => {
        setModulo(localStorage.getItem('modulo') || 'actual');
    }, [location.pathname]);
    useEffect(() => {
        const onStorage = (e) => {
           if (e.key === 'modulo') setModulo(e.newValue || 'actual');
        };
        window.addEventListener('storage', onStorage);
       return () => window.removeEventListener('storage', onStorage);
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
                <Link to="/tickets" className="header-icon-btn" title="Tickets">
                    {/* ícono simple (emoji) o tu icon pack */}
                    📝 <span style={{marginLeft: 6}}>Tickets</span>
                </Link>
                <div className="header-module">
                    <FiLayers style={{ marginRight: 6 }} />
                    <span className={`badge ${modulo === 'historico' ? 'badge-historico' : 'badge-actual'}`}>
                        Módulo: {modulo === 'historico' ? 'Histórico' : 'Actual'}
                    </span>
                    <button
                        className="switch-module-btn"
                        onClick={() => navigate('/modulos')}
                        title="Cambiar módulo"
                    >
                        Cambiar módulo
                    </button>
                </div>
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