import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/Dashboard.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { api, apiPath } from "../utils/api";
import { useUser } from '../context/UserContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

  const modulo = (localStorage.getItem('modulo') || 'actual').toLowerCase();
  const isHistorico = modulo === 'historico';

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
        const resp = await api.get(apiPath('/export-todo'));
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

    <div className="dashboard-grid">
      <button className="dashboard-button" onClick={() => navigate('/buscador')}>
        Ir al Buscador
      </button>

      <button className="dashboard-button" onClick={() => navigate('/inventario')}>
        Inventario Equipos / Simcards
      </button>

       {!isHistorico && (
          <>
            <button className="dashboard-button" onClick={() => navigate('/nuevo-cliente')}>
              Crear Nuevo Cliente
            </button>

            <button className="dashboard-button" onClick={() => navigate('/nuevo-movil')}>
              Crear Nuevo Móvil
            </button>

            <button className="dashboard-button" onClick={() => navigate('/nuevo-equipo')}>
              Crear Nuevo Equipo AVL
            </button>

            <button className="dashboard-button" onClick={() => navigate('/nueva-simcard')}>
              Crear Nueva Simcard
            </button>
          </>
        )}

      <button className="dashboard-button" onClick={() => navigate('/historial-cambios')}>
        Ver Historial de Cambios
      </button>

      {!isHistorico && user?.rol === 'admin' && (
          <button
            className="delete-document-btn"
            onClick={() => navigate('/eliminar-documento')}
          >
            Eliminar Documento
          </button>
        )}
      </div>

    <button className="export-excel-btn" onClick={exportarTodoExcel}>
      📦 Exportar todo a Excel
    </button>
  </div>
);
};

export default Dashboard;