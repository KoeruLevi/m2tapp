import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 30 }}>
            <h2>📝 Historial de Cambios</h2>
            {loading && <p>Cargando cambios...</p>}
            {!loading && cambios.length === 0 && <p>No hay cambios registrados.</p>}
            {!loading && cambios.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f5f6fa" }}>
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
                            h.cambios.map((c, i) => (
                                <tr key={h._id + c.campo + i}>
                                    <td>{new Date(h.fecha).toLocaleString()}</td>
                                    <td>{h.usuario?.nombre || ''}</td>
                                    <td>{h.entidad}</td>
                                    <td>{c.campo}</td>
                                    <td>{String(c.valorAnterior)}</td>
                                    <td>{String(c.valorNuevo)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default HistorialCambios;