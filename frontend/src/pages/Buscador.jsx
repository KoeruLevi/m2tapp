import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Buscador.css";
import Header from "../components/Header";

const Buscador = () => {
    const [query, setQuery] = useState({ cliente: '', movil: '', equipo: '', simcard: '' });
    const [results, setResults] = useState({ Cliente: [], Movil: [], EquipoAVL: [], Simcard: [] });
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [filteredMoviles, setFilteredMoviles] = useState([]);
    const [filteredEquipos, setFilteredEquipos] = useState([]);
    const [filteredSimcards, setFilteredSimcards] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState({ Cliente: null, Movil: null, EquipoAVL: null, Simcard: null });
    const [popupData, setPopupData] = useState(null);
    const [popupType, setPopupType] = useState('');
    const [isEditing, setIsEditing] = useState(false); // Estado para activar modo edición
    const [editedData, setEditedData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log("🔄 UI Actualizada - Clientes:", filteredClientes);
        console.log("🔄 UI Actualizada - Móviles:", filteredMoviles);
        console.log("🔄 UI Actualizada - EquiposAVL:", filteredEquipos);
        console.log("🔄 UI Actualizada - Simcards:", filteredSimcards);
    }, [filteredClientes, filteredMoviles, filteredEquipos, filteredSimcards]);

    // 📌 FUNCIONALIDAD PARA BUSCAR DATOS
    const handleSearch = async (e) => {
        e.preventDefault();
        console.log("🔍 Búsqueda iniciada con:", query);
        setLoading(true);
        try {
            const response = await axios.get(`https://m2t-backend.onrender.com/api/data/search`, { params: query });
            console.log("✅ Respuesta de la API:", response.data);
    
            let clientes = response.data.Cliente || [];
            let moviles = response.data.Movil || [];
            let equipos = response.data.EquipoAVL || [];
            let simcards = response.data.Simcard || [];
    
            console.log("📌 Datos recibidos:");
            console.log("   - Clientes:", clientes.length);
            console.log("   - Móviles:", moviles.length);
            console.log("   - Equipos:", equipos.length);
            console.log("   - Simcards:", simcards.length);
    
            // 🔹 Eliminar duplicados en los móviles basados en el _id
            const uniqueMoviles = moviles.filter((movil, index, self) =>
                index === self.findIndex((m) => m._id === movil._id)
            );

            const uniqueClientes = clientes.filter((cliente, index, self) =>
                index === self.findIndex((c) => c._id === cliente._id)
            );
    
            console.log("✅ Móviles después de eliminar duplicados:", uniqueMoviles.length);
    
            setResults(response.data);
            setFilteredClientes(clientes);
            setFilteredMoviles(uniqueMoviles); // Usamos la versión sin duplicados
            setFilteredEquipos(equipos);
            setFilteredSimcards(simcards);
            setFilteredClientes(uniqueClientes);
    
        } catch (error) {
            console.error("❌ Error al realizar la búsqueda:", error);
        } finally {
            setLoading(false);
        }
    };

    // 📌 FUNCIÓN PARA APLICAR FILTROS Y RESTAURAR DATOS AL DESELECCIONAR
    const handleFilterClick = (type, data) => {
        console.log(`🔵 Clic en ${type}:`, data);

        let updatedFilters = { ...selectedFilters };

        // Si el elemento ya estaba seleccionado, lo eliminamos del filtro
        if (selectedFilters[type] && selectedFilters[type]._id === data._id) {
            console.log(`❌ Deseleccionando ${type}`);
            delete updatedFilters[type]; // Eliminar solo este filtro
            setSelectedFilters(updatedFilters);
            applyActiveFilters(updatedFilters);
            return;
        }

        // Agregar el nuevo filtro
        updatedFilters[type] = data;
        setSelectedFilters(updatedFilters);

        console.log("🔍 Aplicando filtrado basado en selección...");
        applyActiveFilters(updatedFilters);
    };

    const applyActiveFilters = (filters) => {
        console.log("🔄 Restaurando datos con filtros activos...", filters);
    
        let newFilteredClientes = [...results.Cliente];
        let newFilteredMoviles = [...results.Movil];
        let newFilteredEquipos = [...results.EquipoAVL];
        let newFilteredSimcards = [...results.Simcard];
    
        Object.entries(filters).forEach(([type, filter]) => {
            if (!filter) return;
    
            switch (type) {
                case "Cliente": {
                    newFilteredMoviles = newFilteredMoviles.filter(movil => movil.Cliente === filter.Cliente);
    
                    const movilIds = newFilteredMoviles
                        .map(movil => movil["Equipo Princ"]?.[""] || movil["Equipo Princ"])
                        .filter(Boolean);
    
                    newFilteredEquipos = newFilteredEquipos.filter(equipo => movilIds.includes(equipo.ID));
                    const equipoIds = newFilteredEquipos.map(equipo => equipo.ID);
    
                    newFilteredSimcards = newFilteredSimcards.filter(simcard => equipoIds.includes(simcard.ID));
                    break;
                }
    
                case "Movil": {
                    newFilteredClientes = newFilteredClientes.filter(cliente => cliente.Cliente === filter.Cliente);
    
                    const equipoId = filter["Equipo Princ"]?.[""] || filter["Equipo Princ"];
                    newFilteredEquipos = newFilteredEquipos.filter(equipo => equipo.ID === equipoId);
                    newFilteredSimcards = newFilteredSimcards.filter(simcard => simcard.ID === equipoId);
    
                    newFilteredMoviles = [filter]; // Mantener solo el móvil seleccionado
                    break;
                }
    
                case "EquipoAVL": {
                    newFilteredMoviles = newFilteredMoviles.filter(
                        movil => movil["Equipo Princ"]?.[""] === filter.ID || movil["Equipo Princ"] === filter.ID
                    );
    
                    newFilteredClientes = newFilteredClientes.filter(cliente =>
                        newFilteredMoviles.some(movil => movil.Cliente === cliente.Cliente)
                    );
    
                    newFilteredSimcards = newFilteredSimcards.filter(simcard => simcard.ID === filter.ID);
                    newFilteredEquipos = [filter]; // Mantener solo el equipo seleccionado
                    break;
                }
    
                case "Simcard": {
                    newFilteredEquipos = newFilteredEquipos.filter(equipo => equipo.ID === filter.ID);
                    newFilteredMoviles = newFilteredMoviles.filter(
                        movil => movil["Equipo Princ"]?.[""] === filter.ID || movil["Equipo Princ"] === filter.ID
                    );
    
                    newFilteredClientes = newFilteredClientes.filter(cliente =>
                        newFilteredMoviles.some(movil => movil.Cliente === cliente.Cliente)
                    );
    
                    newFilteredSimcards = [filter]; // Mantener solo la simcard seleccionada
                    break;
                }
            }
        });
    
        // ✅ Eliminar duplicados después de aplicar filtros
        const uniqueMoviles = newFilteredMoviles.filter((movil, index, self) =>
            index === self.findIndex((m) => m._id === movil._id)
        );
    
        setFilteredClientes(newFilteredClientes);
        setFilteredMoviles(uniqueMoviles);
        setFilteredEquipos(newFilteredEquipos);
        setFilteredSimcards(newFilteredSimcards);
    
        console.log("✅ Móviles después de eliminar duplicados:", uniqueMoviles.length);
    };

    // 📌 DOBLE CLIC PARA ABRIR DETALLE DEL ELEMENTO
    const handleCardDoubleClick = (type, data) => {
        console.log(`🔎 Mostrando detalles de ${type}:`, data);
        setPopupType(type);
        setPopupData(data);
    };

    // 📌 FUNCIÓN PARA CERRAR EL POPUP
    const closePopup = () => {
        setPopupData(null);
        setPopupType('');
    };

    const handleSaveChanges = async () => {
        try {
            const payload = {
                type: popupType,  // Asegurar que el backend sabe qué tipo de documento actualizar
                data: {
                    ...popupData,  // Mantener los datos originales
                    ...editedData, // Reemplazar con los cambios realizados
                }
            };
    
            const response = await axios.put(
                `https://m2t-backend.onrender.com/api/data/update`,
                payload
            );
    
            console.log("✅ Datos actualizados con éxito:", response.data);
    
            // Actualizar UI con los nuevos datos
            setPopupData((prev) => ({ ...prev, ...editedData }));
            setIsEditing(false);
            alert("✅ Cambios guardados exitosamente.");
        } catch (error) {
            console.error("❌ Error al actualizar los datos:", error);
            alert("Hubo un problema al guardar los cambios.");
        }
    };

    const handleItemClick = (type, item) => {
        let clickTimeout;
    
        return () => {
            if (clickTimeout) {
                // Si ya hubo un clic antes, lo cancelamos y abrimos detalles
                clearTimeout(clickTimeout);
                clickTimeout = null;
                handleCardDoubleClick(type, item);
            } else {
                // Si es el primer clic, esperamos un poco antes de decidir qué hacer
                clickTimeout = setTimeout(() => {
                    handleFilterClick(type, item);
                    clickTimeout = null;
                }, 250); // 250ms es el tiempo que espera antes de marcar/desmarcar
            }
        };
    };

    return (
        <div className="buscador-wrapper">
            <Header />

            <form className="buscador-form" onSubmit={handleSearch}>
                <input type="text" placeholder="Filtrar por Cliente" value={query.cliente} onChange={(e) => setQuery({ ...query, cliente: e.target.value })} />
                <input type="text" placeholder="Filtrar por Móvil" value={query.movil} onChange={(e) => setQuery({ ...query, movil: e.target.value })} />
                <input type="text" placeholder="Filtrar por Equipo" value={query.equipo} onChange={(e) => setQuery({ ...query, equipo: e.target.value })} />
                <input type="text" placeholder="Filtrar por Simcard" value={query.simcard} onChange={(e) => setQuery({ ...query, simcard: e.target.value })} />
                <button type="submit" disabled={loading}>
                    {loading ? 'Buscando...': 'Buscar'}
                </button>
            </form>

            <div className="tabs-container">
    {["Cliente", "Movil", "EquipoAVL", "Simcard"].map((type) => (
        <div className="tab" key={type}>
            <h2>{type === "Movil" ? "Móviles" : type}</h2>
            <div className="tab-content">
                {(type === "Cliente" ? filteredClientes
                : type === "Movil" ? filteredMoviles
                : type === "EquipoAVL" ? filteredEquipos
                : filteredSimcards).map((item, index) => (
                    <div
                        key={index}
                        className={`card ${selectedFilters[type] &&
                            JSON.stringify(selectedFilters[type]) === JSON.stringify(item)
                            ? 'selected' 
                            : ''}`}
                        onClick={handleItemClick(type, item)}
                    >
                        {/* ✅ Mostrar parámetros específicos según el tipo de entidad */}
                        {type === "Movil" ? (
                            <>
                                <p><strong>Cliente:</strong> {item.Cliente}</p>
                                <p><strong>Nombre:</strong> {item.Nombre}</p>
                                <p><strong>Patente:</strong> {item.Patente}</p>
                            </>
                        ) : type === "EquipoAVL" ? (
                            <>
                                <p><strong>IMEI:</strong> {item.imei}</p>
                                <p><strong>ID:</strong> {item.ID}</p>
                            </>
                        ) : type === "Simcard" ? (
                            <>
                                <p><strong>Fono:</strong> {item.fono}</p>
                                <p><strong>Operador:</strong> {item.operador}</p>
                            </>
                        ) : (
                            /* Cliente */
                            Object.entries(item)
                                .filter(([key]) => key !== "_id")
                                .slice(0, 2)
                                .map(([key, value]) => (
                                    <p key={key}><strong>{key}:</strong> {value?.toString()}</p>
                                ))
                        )}
                    </div>
                ))}
            </div>
        </div>
    ))}
</div>

            {popupData && (
    <div className="popup">
        <div className="popup-content">
            <button className="close-btn" onClick={closePopup}>X</button>
            <h2>Detalles de {popupType}</h2>

            {/* 🔹 Botón para cambiar a modo edición */}
            {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Editar</button>
            ) : (
                <button className="save-btn" onClick={handleSaveChanges}>Guardar</button>
            )}

            {/* 🔹 Formulario editable si está en modo edición */}
            {Object.entries(popupData)
    .filter(([key]) => key !== "_id")
    .map(([key, value]) => {
        let displayValue = value;

        if (key === "ICCID") {
            displayValue = typeof value === "object" && value !== null 
                ? (value.low || value.high || "No disponible") 
                : value;
        } 
        
        if (key === "Equipo Princ") {
            displayValue = typeof value === "object" && value !== null 
                ? (value[""] || value["ID"] || "No disponible") 
                : value;
        }

        return (
            <div key={key} style={{ marginBottom: "10px" }}>
                <strong>{key}:</strong>
                
                {isEditing ? (
                    key === "ICCID" || key === "Equipo Princ" ? (
                        <input
                            type="text"
                            value={editedData[key] ?? displayValue}
                            onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                            style={{ width: "100%" }}
                        />
                    ) : typeof value === "object" && value !== null ? (
                        key === "Acc" || key === "Id" ? (
                            // ✅ Checkboxes editables en modo edición
                            <div className="accesorios-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {Object.entries(value).map(([accKey, accValue]) => (
                                    <label key={accKey} className="accesorio-item" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <input
                                            type="checkbox"
                                            checked={!!editedData[key]?.[accKey]}
                                            onChange={(e) =>
                                                setEditedData({
                                                    ...editedData,
                                                    [key]: { ...editedData[key], [accKey]: e.target.checked }
                                                })
                                            }
                                        />
                                        {accKey}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                value={JSON.stringify(editedData[key] || value, null, 2)}
                                onChange={(e) => setEditedData({ ...editedData, [key]: JSON.parse(e.target.value) })}
                                rows={3}
                                style={{ width: "100%" }}
                            />
                        )
                    ) : typeof value === "boolean" ? (
                        <input
                            type="checkbox"
                            checked={editedData[key] ?? value}
                            onChange={(e) => setEditedData({ ...editedData, [key]: e.target.checked })}
                        />
                    ) : (
                        <input
                            type="text"
                            value={editedData[key] ?? displayValue}
                            onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                            style={{ width: "100%" }}
                        />
                    )
                ) : (
                    typeof value === "object" && value !== null ? (
                        key === "Acc" || key === "Id" ? (
                            <div className="accesorios-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {Object.entries(value).map(([accKey, accValue]) => (
                                    <label key={accKey} className="accesorio-item" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <input type="checkbox" checked={!!accValue} readOnly />
                                        {accKey}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <span>{displayValue}</span>
                        )
                    ) : typeof value === "boolean" ? (
                        <input type="checkbox" checked={value} readOnly />
                    ) : (
                        <span>{displayValue.toString()}</span>
                    )
                )}
            </div>
        );
    })}
        </div>
    </div>
)}
        </div>
    );
};

export default Buscador;