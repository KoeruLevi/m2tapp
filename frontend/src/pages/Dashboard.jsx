import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

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
        </div>
    );
};

export default Dashboard;