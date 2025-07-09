import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/HistorialCambios.css';

// Traducción y formato de campos
const CAMPO_TRADUCCIONES = {
    RUT: "RUT",
    "CONTACTO_1": "Contacto 1",
    "CONDICION CLIENTE": "Condición Cliente",
    "RAZON SOCIAL": "Razón Social",
    "MAIL CONTACTO_1": "Mail Contacto 1",
    "Domicilio": "Domicilio",
    // Agrega aquí más campos si necesitas personalizar el nombre
};

function beautifyFieldName(campo) {
    if (CAMPO_TRADUCCIONES[campo]) return CAMPO_TRADUCCIONES[campo];
    // Capitaliza y reemplaza guiones bajos por espacios
    return campo.charAt(0).toUpperCase() + campo.slice(1).toLowerCase().replace(/_/g, " ");
}

const NO_MOSTRAR = ["_id", "createdAt", "updatedAt", "__v"];

const HistorialCambios = () => {
    const [cambios, setCambios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCambios() {
            setLoading(true);
            try {
                const resp = await axios.get('https://m2t-backend.onrender.com/api/data/historial-cambios');
                setCambios(resp.data);
            } catch {
                setCambios([]);
            } finally {
                setLoading(false);
            }
        }
        fetchCambios();
    }, []);

    return (
        <div className="historial-container">
            <h2 className="historial-title">
                <span role="img" aria-label="historial">📝</span> Historial de Cambios
            </h2>
            {loading && <p>Cargando cambios...</p>}
            {!loading && cambios.length === 0 && <p>No hay cambios registrados.</p>}
            {!loading && cambios.length > 0 && (
                <div className="historial-table-wrapper">
                    <table className="historial-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Entidad</th>
                                <th>Campo</th>
                                <th>Antes</th>
                                <th>Después</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cambios.map((h, idx) =>
                                h.cambios
                                    .filter(c => !NO_MOSTRAR.includes(c.campo))
                                    .map((c, i) => (
                                        <tr key={h._id + c.campo + i}>
                                            <td>{new Date(h.fecha).toLocaleString("es-CL")}</td>
                                            <td>{h.usuario?.nombre || h.usuario?.email || "Desconocido"}</td>
                                            <td>{h.entidad}</td>
                                            <td>{beautifyFieldName(c.campo)}</td>
                                            <td>{String(c.valorAnterior ?? "")}</td>
                                            <td>{String(c.valorNuevo ?? "")}</td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistorialCambios;