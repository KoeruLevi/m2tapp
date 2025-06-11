import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    const goToBuscador = () => {
        navigate('/buscador');
    };
    const goToNuevoCliente = () => {
        navigate('/nuevo-cliente');
    };

    const goToNuevoMovil = () => {
        navigate('/nuevo-movil');
    };

    const goToNuevoEquipoAVL = () => {
        navigate('/nuevo-equipo');
    };

    const goToNuevaSimcard = () => {
        navigate('/nueva-simcard');
    };
    return (
        <div className="dashboard-container">
            <h1>Bienvenido al Dashboard</h1>
            <button className="dashboard-button" onClick={goToBuscador}>
                Ir al Buscador
            </button>
            <button className="dashboard-button" onClick={goToNuevoCliente}>
                Crear Nuevo Cliente
            </button>
            <button className="dashboard-button" onClick={goToNuevoMovil}>
                Crear Nuevo Móvil
            </button>
            <button className="dashboard-button" onClick={goToNuevoEquipoAVL}>
                Crear Nuevo Equipo AVL
            </button>
            <button className="dashboard-button" onClick={goToNuevaSimcard}>
                Crear Nueva Simcard
            </button>
        </div>
    );
};

export default Dashboard;