import React, { useState } from "react";
import axios from "axios";
import "../styles/EliminarDocumento.css";

const camposResumen = {
    Cliente: [
        { key: "Cliente", label: "Nombre Cliente" },
        { key: "RUT", label: "RUT" },
        { key: "Razon Social", label: "Razón Social" }
    ],
    Movil: [
        { key: "Patente", label: "Patente" },
        { key: "Cliente", label: "Cliente" },
        { key: "Nombre", label: "Nombre" },
        { key: "Tipo", label: "Tipo" }
    ],
    EquipoAVL: [
        { key: "imei", label: "IMEI" },
        { key: "Serial", label: "Serial" },
        { key: "ID", label: "ID" }
    ],
    Simcard: [
        { key: "fono", label: "Fono" },
        { key: "ICCID", label: "ICCID" },
        { key: "operador", label: "Portador" }
    ]
};

const EliminarDocumento = () => {
    const [tipo, setTipo] = useState("Cliente");
    const [busqueda, setBusqueda] = useState("");
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const handleBuscar = async (e) => {
        e.preventDefault();
        setResultado(null);
        setMensaje("");
        if (!busqueda.trim()) return setMensaje("Escribe un valor para buscar.");
        setLoading(true);

        try {
            const resp = await axios.get(
                "https://m2t-backend.onrender.com/api/data/search",
                { params: { [tipo.toLowerCase()]: busqueda } }
            );
            let items = resp.data[tipo];
            if (!items || items.length === 0) {
                setMensaje("No se encontró ningún documento.");
                setResultado(null);
            } else {
                setResultado(items[0]);
            }
        } catch (err) {
            setMensaje("Ocurrió un error al buscar.");
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async () => {
        if (!resultado || !window.confirm("¿Seguro que deseas eliminar este documento? Esta acción es irreversible.")) return;
        setLoading(true);
        setMensaje("");
        try {
            const token = localStorage.getItem('token');
            // Notar: ajusta endpoint según tu backend. Ejemplo: /api/data/eliminar/{tipo}/{id}
            const res = await axios.delete(
                `https://m2t-backend.onrender.com/api/data/delete/${tipo}/${resultado._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setMensaje("✅ Documento eliminado correctamente.");
            setResultado(null);
            setBusqueda("");
        } catch (err) {
            setMensaje("❌ Error al eliminar: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="eliminar-documento-wrapper">
            <h2>Eliminar Documento</h2>
            <form onSubmit={handleBuscar} className="eliminar-doc-form">
                <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="Cliente">Cliente</option>
                    <option value="Movil">Movil</option>
                    <option value="EquipoAVL">EquipoAVL</option>
                    <option value="Simcard">Simcard</option>
                </select>
                <input
                    placeholder={`Buscar por ${camposResumen[tipo][0].label}`}
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </form>
            {mensaje && <div className="eliminar-doc-msg">{mensaje}</div>}
            {resultado && (
                <div className="eliminar-doc-card">
                    <h3>{tipo}</h3>
                    <ul>
                        {camposResumen[tipo].map(field => (
                            <li key={field.key}><b>{field.label}:</b> {resultado[field.key] ?? "No disponible"}</li>
                        ))}
                    </ul>
                    <button
                        className="eliminar-doc-btn"
                        style={{ background: "#c82333", color: "#fff" }}
                        onClick={handleEliminar}
                        disabled={loading}
                    >
                        {loading ? "Eliminando..." : "Eliminar definitivamente"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EliminarDocumento;