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
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState({ Cliente: null, Movil: null, EquipoAVL: null, Simcard: null });
    const [popupData, setPopupData] = useState(null);
    const [popupType, setPopupType] = useState('');

    useEffect(() => {
        console.log("🔄 UI Actualizada - Clientes:", filteredClientes);
        console.log("🔄 UI Actualizada - Móviles:", filteredMoviles);
        console.log("🔄 UI Actualizada - EquiposAVL:", filteredEquipos);
        console.log("🔄 UI Actualizada - Simcards:", filteredSimcards);
    }, [filteredClientes, filteredMoviles, filteredEquipos, filteredSimcards]);

    const handleSearch = async (e) => {
        e.preventDefault();
        console.log("🔍 Búsqueda iniciada con:", query);
    
        try {
            // 📌 Llamada a la API
            const response = await axios.get(`http://localhost:5000/api/data/search`, { params: query });
            console.log("✅ Respuesta de la API:", response.data);
    
            // 📌 Variables con los datos de cada colección
            let clientes = response.data.Cliente || [];
            let moviles = response.data.Movil || [];
            let equipos = response.data.EquipoAVL || [];
            let simcards = response.data.Simcard || [];
    
            console.log("📌 Datos recibidos:");
            console.log("   - Clientes:", clientes.length);
            console.log("   - Móviles:", moviles.length);
            console.log("   - Equipos:", equipos.length);
            console.log("   - Simcards:", simcards.length);
    
            // 📌 Variables de filtrado
            let filteredClientes = [...clientes];
            let filteredMoviles = [...moviles];
            let filteredEquipos = [...equipos];
            let filteredSimcards = [...simcards];
    
            // 📌 Filtrar por CLIENTE
            if (query.cliente) {
                console.log("🔎 Filtrando por cliente:", query.cliente);
                filteredMoviles = moviles.filter(movil =>
                    movil.Cliente &&
                    typeof movil.Cliente === "string" &&
                    movil.Cliente.trim().toLowerCase() === query.cliente.trim().toLowerCase()
                );
                console.log("   - Móviles después del filtro:", filteredMoviles.length);
            
                // 🔹 Eliminar duplicados antes de continuar con los IDs
                filteredMoviles = filteredMoviles.filter((movil, index, self) =>
                    index === self.findIndex((m) => m._id === movil._id)
                );
                console.log("✅ Móviles después de eliminar duplicados:", filteredMoviles.length);
            
                // 🔹 Extraer IDs de equipos desde "Equipo Princ"
                const movilIds = filteredMoviles.map(movil => {
                    console.log("   🔎 Revisando Equipo Princ:", movil["Equipo Princ"]);
                    
                    if (!movil["Equipo Princ"]) return null; // Evitar undefined/null
            
                    if (typeof movil["Equipo Princ"] === "object") {
                        return movil["Equipo Princ"][""] || movil["Equipo Princ"]["ID"] || null;
                    }
            
                    return movil["Equipo Princ"]; // Si es string o número, devolverlo directamente
                }).filter(id => id); // Eliminar null/undefined
            
                console.log("   - ID de Equipos obtenidos desde Móviles:", movilIds);
            
                // 🔹 Filtrar Equipos usando IDs obtenidos
                filteredEquipos = equipos.filter(equipo => movilIds.includes(equipo.ID));
                console.log("   - Equipos después del filtro por móviles:", filteredEquipos.length);
            
                // 🔹 Filtrar Simcards en base a los Equipos obtenidos
                const equipoIds = filteredEquipos.map(equipo => equipo.ID);
                filteredSimcards = simcards.filter(simcard => equipoIds.includes(simcard.ID));
                console.log("   - Simcards después del filtro por equipos:", filteredSimcards.length);
            }
    
            // 📌 Filtrar por MOVIL sin eliminar los datos previos filtrados
            if (query.movil) {
                console.log("🔎 Filtrando por móvil:", query.movil);
    
                filteredMoviles = filteredMoviles.filter(movil => {
                    if (!movil.Tipo) {
                        console.log("   ⚠️ Móvil sin Tipo válido:", movil);
                        return false;
                    }
                    return movil.Tipo.toLowerCase().includes(query.movil.toLowerCase());
                });
    
                console.log("   - Móviles después del filtro por Tipo:", filteredMoviles.length);
            }
    
            // 📌 Filtrar por EQUIPO
            if (query.equipo) {
                console.log("🔎 Filtrando por equipo:", query.equipo);
    
                filteredEquipos = equipos.filter(equipo =>
                    equipo.model &&
                    equipo.model.toString().toLowerCase().includes(query.equipo.toLowerCase())
                );
    
                console.log("   - Equipos después del filtro:", filteredEquipos.length);
            }
    
            // 📌 Filtrar por SIMCARD
            if (query.simcard) {
                console.log("🔎 Filtrando por simcard:", query.simcard);
    
                filteredSimcards = simcards.filter(simcard =>
                    simcard.operador &&
                    simcard.operador.toString().toLowerCase().includes(query.simcard.toLowerCase())
                );
    
                console.log("   - Simcards después del filtro:", filteredSimcards.length);
            }

            
    
            // 📌 Actualizar estados con los resultados filtrados
            setFilteredClientes(filteredClientes);
            setFilteredMoviles(filteredMoviles);
            setFilteredEquipos(filteredEquipos);
            setFilteredSimcards(filteredSimcards);
    
            console.log("✅ Resultados finales:");
            console.log("   - Clientes:", filteredClientes.length);
            console.log("   - Móviles:", filteredMoviles.length);
            console.log("   - Equipos:", filteredEquipos.length);
            console.log("   - Simcards:", filteredSimcards.length);
    
        } catch (error) {
            console.error("❌ Error al realizar la búsqueda:", error);
        }
    };

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
    
        // Inicializar variables con todos los datos originales
        let newFilteredClientes = [...results.Cliente];
        let newFilteredMoviles = [...results.Movil];
        let newFilteredEquipos = [...results.EquipoAVL];
        let newFilteredSimcards = [...results.Simcard];
    
        // 🔹 Si se selecciona un Cliente, filtramos sus móviles, equipos y simcards
        if (type === "Cliente") {
            console.log("🔍 Filtrando datos relacionados con el Cliente seleccionado...");
            newFilteredMoviles = newFilteredMoviles.filter(movil => movil.Cliente === data.Cliente);
            const movilIDs = newFilteredMoviles.map(movil => movil["Equipo Princ"]?.[''] || movil["Equipo Princ"]).filter(id => id);
            newFilteredEquipos = newFilteredEquipos.filter(equipo => movilIDs.includes(equipo.ID));
            const equipoIDs = newFilteredEquipos.map(equipo => equipo.ID);
            newFilteredSimcards = newFilteredSimcards.filter(simcard => equipoIDs.includes(simcard.ID));
        }
    
        // 🔹 Si se selecciona un Móvil, filtramos su Cliente, Equipos y Simcards
        if (type === "Movil") {
            console.log("🔍 Filtrando datos relacionados con el Móvil seleccionado...");
            newFilteredClientes = newFilteredClientes.filter(cliente => cliente.Cliente === data.Cliente);
            const equipoID = data?.["Equipo Princ"]?.[''] || data?.["Equipo Princ"];
            if (equipoID) {
                newFilteredEquipos = newFilteredEquipos.filter(equipo => equipo.ID === equipoID);
                const equipoIDs = newFilteredEquipos.map(equipo => equipo.ID);
                newFilteredSimcards = newFilteredSimcards.filter(simcard => equipoIDs.includes(simcard.ID));
            }
            newFilteredMoviles = [data]; // Mantener solo el móvil seleccionado
        }
    
        // 🔹 Si se selecciona un EquipoAVL, filtramos los Móviles, Clientes y Simcards
        if (type === "EquipoAVL") {
            console.log("🔍 Filtrando datos relacionados con el Equipo seleccionado...");
            newFilteredMoviles = newFilteredMoviles.filter(movil => movil["Equipo Princ"]?.[''] === data.ID || movil["Equipo Princ"] === data.ID);
            newFilteredClientes = newFilteredClientes.filter(cliente => newFilteredMoviles.some(movil => movil.Cliente === cliente.Cliente));
            newFilteredSimcards = newFilteredSimcards.filter(simcard => simcard.ID === data.ID);
            newFilteredEquipos = [data]; // Mantener solo el equipo seleccionado
        }
    
        // 🔹 Si se selecciona una Simcard, filtramos los Equipos, Móviles y Clientes
        if (type === "Simcard") {
            console.log("🔍 Filtrando datos relacionados con la Simcard seleccionada...");
            newFilteredEquipos = newFilteredEquipos.filter(equipo => equipo.ID === data.ID);
            newFilteredMoviles = newFilteredMoviles.filter(movil => movil["Equipo Princ"]?.[''] === data.ID || movil["Equipo Princ"] === data.ID);
            newFilteredClientes = newFilteredClientes.filter(cliente => newFilteredMoviles.some(movil => movil.Cliente === cliente.Cliente));
            newFilteredSimcards = [data]; // Mantener solo la simcard seleccionada
        }
    
        console.log("📌 Resultados después del filtrado:");
        console.log("   - Clientes:", newFilteredClientes.length);
        console.log("   - Móviles:", newFilteredMoviles.length);
        console.log("   - Equipos:", newFilteredEquipos.length);
        console.log("   - Simcards:", newFilteredSimcards.length);
    
        setFilteredClientes(newFilteredClientes);
        setFilteredMoviles(newFilteredMoviles);
        setFilteredEquipos(newFilteredEquipos);
        setFilteredSimcards(newFilteredSimcards);
    };
    
    /**
     * Función para restaurar datos en base a los filtros activos después de deseleccionar un item.
     */
    const applyActiveFilters = (activeFilters) => {
        console.log("🔄 Restaurando datos con filtros activos...", activeFilters);
    
        // Restaurar todos los datos desde el estado original
        let activeFilteredClientes = [...results.Cliente];
        let activeFilteredMoviles = [...results.Movil];
        let activeFilteredEquipos = [...results.EquipoAVL];
        let activeFilteredSimcards = [...results.Simcard];
    
        Object.entries(activeFilters).forEach(([type, filter]) => {
            if (type === "Cliente") {
                activeFilteredMoviles = activeFilteredMoviles.filter(movil => movil.Cliente === filter.Cliente);
                const movilIDs = activeFilteredMoviles.map(movil => movil["Equipo Princ"]?.[''] || movil["Equipo Princ"]).filter(id => id);
                activeFilteredEquipos = activeFilteredEquipos.filter(equipo => movilIDs.includes(equipo.ID));
                const equipoIDs = activeFilteredEquipos.map(equipo => equipo.ID);
                activeFilteredSimcards = activeFilteredSimcards.filter(simcard => equipoIDs.includes(simcard.ID));
            }
    
            if (type === "Movil") {
                activeFilteredClientes = activeFilteredClientes.filter(cliente => cliente.Cliente === filter.Cliente);
                const equipoID = filter?.["Equipo Princ"]?.[''] || filter?.["Equipo Princ"];
                if (equipoID) {
                    activeFilteredEquipos = activeFilteredEquipos.filter(equipo => equipo.ID === equipoID);
                    const equipoIDs = activeFilteredEquipos.map(equipo => equipo.ID);
                    activeFilteredSimcards = activeFilteredSimcards.filter(simcard => equipoIDs.includes(simcard.ID));
                }
            }
        });
    
        console.log("🔄 Datos restaurados tras deselección:");
        setFilteredClientes(activeFilteredClientes);
        setFilteredMoviles(activeFilteredMoviles);
        setFilteredEquipos(activeFilteredEquipos);
        setFilteredSimcards(activeFilteredSimcards);
    };
    const handleSelectOrDeselectItem = (type, item) => {
        console.log(`🔵 Clic en ${type}:`, item);
    
        // Si el elemento ya está seleccionado, lo deseleccionamos y restauramos la lista original
        if (selectedFilters[type] && selectedFilters[type]["ID"] === item["ID"]) {
            console.log(`❌ Deseleccionando ${type}`);
            setSelectedFilters((prev) => {
                const updatedFilters = { ...prev };
                delete updatedFilters[type]; // Remueve solo el filtro específico
                return updatedFilters;
            });
    
            // Restaurar los datos originales sin filtro
            setFilteredClientes(results.Cliente);
            setFilteredMoviles(results.Movil);
            setFilteredEquipos(results.EquipoAVL);
            setFilteredSimcards(results.Simcard);
        } else {
            // Si no está seleccionado, aplicar filtro normalmente
            handleFilterClick(type, item);
        }
    };

    const handleCardDoubleClick = (type, data) => {
        setPopupType(type);
        setPopupData(data);
    };

    const closePopup = () => {
        setPopupData(null);
        setPopupType('');
    };

    return (
        <div className="buscador-wrapper">
            <Header />

            <form className="buscador-form" onSubmit={handleSearch}>
                <input type="text" placeholder="Filtrar por Cliente" value={query.cliente} onChange={(e) => setQuery({ ...query, cliente: e.target.value })} />
                <input type="text" placeholder="Filtrar por Móvil" value={query.movil} onChange={(e) => setQuery({ ...query, movil: e.target.value })} />
                <input type="text" placeholder="Filtrar por Equipo" value={query.equipo} onChange={(e) => setQuery({ ...query, equipo: e.target.value })} />
                <input type="text" placeholder="Filtrar por Simcard" value={query.simcard} onChange={(e) => setQuery({ ...query, simcard: e.target.value })} />
                <button type="submit">Buscar</button>
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
                        onClick={() => handleFilterClick(type, item)}
                        onDoubleClick={() => handleCardDoubleClick(type, item)}
                    >
                        {Object.entries(item)
                            .filter(([key]) => key !== "_id")
                            .slice(0, 2)
                            .map(([key, value]) => (
                                <p key={key}><strong>{key}:</strong> {value?.toString()}</p>
                            ))}
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

            {Object.entries(popupData)
                .filter(([key]) => key !== "_id")
                .map(([key, value]) => (
                    <div key={key} style={{ marginBottom: "10px" }}>
                        <strong>{key}:</strong>

                        {/* 🔹 Si el valor es un objeto */}
                        {typeof value === "object" && value !== null ? (
                            key === "Equipo Princ" ? (
                                // ✅ Mostrar ID dentro de "Equipo Princ" sin JSON ni checkbox
                                <span> {value[""] || value["ID"] || "No disponible"} </span>
                            ) : key === "Acc" || key === "Id" ? (
                                // ✅ Mostrar accesorios e ID con checkboxes correctamente
                                <div className="accesorios-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {Object.entries(value)
                                        .filter(([accKey]) => accKey.trim() !== "") // Eliminar claves vacías
                                        .map(([accKey, accValue]) => {
                                            const isChecked = typeof accValue === "string" ? accValue.trim() !== "" : !!accValue;
                                            return (
                                                <label key={accKey.trim()} className="accesorio-item" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                    <input type="checkbox" checked={isChecked} readOnly />
                                                    {accKey.replace(/\n/g, "").trim()} {/* Eliminar saltos de línea y espacios extra */}
                                                </label>
                                            );
                                        })}
                                </div>
                            ) : key === "Sensor Temp" ? (
                                // ✅ Solución para Sensor Temp
                                <span> {value["(Cable)"] || "No disponible"} </span>
                            ) : (
                                // 🔹 Si es otro objeto, desglosarlo en una lista de valores
                                <ul>
                                    {Object.entries(value)
                                        .filter(([subKey]) => subKey.trim() !== "") // Evitar claves vacías
                                        .map(([subKey, subValue]) => (
                                            <li key={subKey.trim()}>
                                                <strong>{subKey.replace(/\n/g, "").trim()}:</strong> {subValue.toString()}
                                            </li>
                                        ))}
                                </ul>
                            )
                        ) : typeof value === "boolean" ? (
                            // ✅ Si es un booleano, mostrar como checkbox
                            <input type="checkbox" checked={value} readOnly />
                        ) : (
                            // 🔹 Si es un valor normal, lo mostramos en texto
                            <span> {value.toString()} </span>
                        )}
                    </div>
                ))}
        </div>
    </div>
)}
        </div>
    );
};

export default Buscador;