import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    const goToBuscador = () => {
        navigate('/buscador');
    };

    return (
        <div className="dashboard-container">
            <h1>Bienvenido al Dashboard</h1>
            <button className="dashboard-button" onClick={goToBuscador}>
                Ir al Buscador
            </button>
        </div>
    );
};

export default Dashboard;