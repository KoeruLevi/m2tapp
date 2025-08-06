import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/Dashboard.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
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

    const exportarTodoExcel = async () => {
    try {
        const resp = await axios.get('https://m2t-backend.onrender.com/api/data/export-todo');
        const { clientes, moviles, equipos, simcards } = resp.data;

        const wb = XLSX.utils.book_new();

        const clean = (arr) => arr.map(obj => {
            const { _id, __v, createdAt, updatedAt, ...rest } = obj;
            return rest;
        });

        if (clientes && clientes.length > 0) {
            const wsClientes = XLSX.utils.json_to_sheet(clean(clientes));
            XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes");
        }
        if (moviles && moviles.length > 0) {
            const wsMoviles = XLSX.utils.json_to_sheet(clean(moviles));
            XLSX.utils.book_append_sheet(wb, wsMoviles, "Moviles");
        }
        if (equipos && equipos.length > 0) {
            const wsEquipos = XLSX.utils.json_to_sheet(clean(equipos));
            XLSX.utils.book_append_sheet(wb, wsEquipos, "EquipoAVL");
        }
        if (simcards && simcards.length > 0) {
            const wsSimcards = XLSX.utils.json_to_sheet(clean(simcards));
            XLSX.utils.book_append_sheet(wb, wsSimcards, "Simcard");
        }

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "m2t-todo.xlsx");
    } catch (err) {
        alert("Error al exportar datos: " + err.message);
    }
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
            <button className="dashboard-button" onClick={() => navigate('/historial-cambios')}>
                Ver Historial de Cambios
            </button>
            <button
                className="delete-document-btn"
                style={{
                    background: "#c82333",
                    color: "white",
                    fontWeight: "bold",
                    margin: "16px 0",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "20px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "background 0.18s"
                }}
                onClick={() => navigate('/eliminar-documento')}
            >
                Eliminar Documento
            </button>
            <button className="export-excel-btn" onClick={exportarTodoExcel}>
                📦 Exportar todo a Excel
            </button>
        </div>
    );
};

export default Dashboard;