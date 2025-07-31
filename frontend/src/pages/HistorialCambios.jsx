import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/HistorialCambios.css';


const CAMPO_TRADUCCIONES = {
    RUT: "RUT",
    "CONTACTO_1": "Contacto 1",
    "CONDICION CLIENTE": "Condición Cliente",
    "RAZON SOCIAL": "Razón Social",
    "MAIL CONTACTO_1": "Mail Contacto 1",
    "Domicilio": "Domicilio",
};

function beautifyFieldName(campo) {
    if (CAMPO_TRADUCCIONES[campo]) return CAMPO_TRADUCCIONES[campo];
    return campo.charAt(0).toUpperCase() + campo.slice(1).toLowerCase().replace(/_/g, " ");
}

function mostrarValor(valor) {
  if (valor === null || valor === undefined) return "-";
  if (typeof valor === "object") {
    if (Array.isArray(valor)) {
      return valor.length === 0 ? "(array vacío)" : (
        <pre style={{maxWidth: 180, overflow: "auto"}}>{JSON.stringify(valor, null, 1)}</pre>
      );
    }
    if (Object.keys(valor).length === 0) return "(objeto vacío)";
    // Si solo tiene una clave, muestra esa clave y valor
    if (Object.keys(valor).length === 1) {
      const k = Object.keys(valor)[0];
      return <span><b>{k}:</b> {String(valor[k])}</span>;
    }
    // Si tiene más claves, muestra el JSON
    return (
      <pre style={{maxWidth: 180, overflow: "auto", whiteSpace: "pre-wrap"}}>
        {JSON.stringify(valor, null, 1)}
      </pre>
    );
  }
  return valor.toString();
}
const NO_MOSTRAR = ["_id", "createdAt", "updatedAt", "__v"];

const HistorialCambios = () => {
    const [cambios, setCambios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCambios() {
            setLoading(true);
            try {
                const resp = await axios.get('/api/data/historial-cambios');
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
                                            <td>{mostrarValor(c.valorAnterior)}</td>
                                            <td>{mostrarValor(c.valorNuevo)}</td>
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