import React, { useState, useEffect } from "react";
import { api, apiPath } from "../utils/api";
import "../styles/Buscador.css";
import Header from "../components/Header";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState([]);
    const exportToExcel = () => {

    const allData = [
        ...filteredClientes.map(d => ({ Tipo: 'Cliente', ...d })),
        ...filteredMoviles.map(d => ({ Tipo: 'Movil', ...d })),
        ...filteredEquipos.map(d => ({ Tipo: 'EquipoAVL', ...d })),
        ...filteredSimcards.map(d => ({ Tipo: 'Simcard', ...d })),
    ];

    if (allData.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DatosExportados");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "busqueda-m2t.xlsx");
};
    function formatRut(rutRaw) {
    let rut = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!rut) return '';
    let dv = rut.slice(-1);
    rut = rut.slice(0, -1);
    let formatted = '';
    while (rut.length > 3) {
        formatted = '.' + rut.slice(-3) + formatted;
        rut = rut.slice(0, rut.length - 3);
    }
    formatted = rut + formatted;
    return formatted + '-' + dv;
}

    function beautifyFieldName(str) {
        if (!str) return '';
        if (str.toLowerCase() === 'createdat') return 'Creación';
        if (str.toLowerCase() === 'updatedat') return 'Actualización';
        let cleaned = str.replace(/[_\n]+/g, ' ');
        cleaned = cleaned
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        return cleaned;
    }

    function beautifyValue(key, value) {
  if (['createdat', 'updatedat'].includes(key.toLowerCase())) {
    try {
      const date = new Date(value);
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Santiago',
      });
    } catch {
      return value;
    }
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return value?.toString();
}

    useEffect(() => {
        console.log("🔄 UI Actualizada - Clientes:", filteredClientes);
        console.log("🔄 UI Actualizada - Móviles:", filteredMoviles);
        console.log("🔄 UI Actualizada - EquiposAVL:", filteredEquipos);
        console.log("🔄 UI Actualizada - Simcards:", filteredSimcards);
    }, [filteredClientes, filteredMoviles, filteredEquipos, filteredSimcards]);

    const handleSearch = async (e) => {
        e.preventDefault();
        console.log("🔍 Búsqueda iniciada con:", query);
        setLoading(true);
        try {
            const response = await api.get(apiPath('/search'), { params: query });
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
    
            const uniqueMoviles = moviles.filter((movil, index, self) =>
                index === self.findIndex((m) => m._id === movil._id)
            );

            const uniqueClientes = clientes.filter((cliente, index, self) =>
                index === self.findIndex((c) => c._id === cliente._id)
            );
    
            console.log("✅ Móviles después de eliminar duplicados:", uniqueMoviles.length);
    
            setResults(response.data);
            setFilteredClientes(clientes);
            setFilteredMoviles(uniqueMoviles);
            setFilteredEquipos(equipos);
            setFilteredSimcards(simcards);
            setFilteredClientes(uniqueClientes);
    
        } catch (error) {
            console.error("❌ Error al realizar la búsqueda:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClick = (type, data) => {
        console.log(`🔵 Clic en ${type}:`, data);

        let updatedFilters = { ...selectedFilters };
        if (selectedFilters[type] && selectedFilters[type]._id === data._id) {
            console.log(`❌ Deseleccionando ${type}`);
            delete updatedFilters[type];
            setSelectedFilters(updatedFilters);
            applyActiveFilters(updatedFilters);
            return;
        }

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
    
                    newFilteredMoviles = [filter];
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
                    newFilteredEquipos = [filter];
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
    
                    newFilteredSimcards = [filter];
                    break;
                }
            }
        });
    
        const uniqueMoviles = newFilteredMoviles.filter((movil, index, self) =>
            index === self.findIndex((m) => m._id === movil._id)
        );
    
        setFilteredClientes(newFilteredClientes);
        setFilteredMoviles(uniqueMoviles);
        setFilteredEquipos(newFilteredEquipos);
        setFilteredSimcards(newFilteredSimcards);
    
        console.log("✅ Móviles después de eliminar duplicados:", uniqueMoviles.length);
    };

    const handleCardDoubleClick = async (type, data) => {
        console.log(`🔎 Mostrando detalles de ${type}:`, data);
        setPopupType(type);
        setPopupData(data);

        try {
            const response = await api.get(apiPath('/historial'), {
                params: { type, id: type === 'EquipoAVL' ? data.ID : type === 'Cliente' ? data.Cliente : data.Patente || data.ICCID }
            });
            setHistorial(response.data);
        } catch (error) {
            console.error('❌ Error al obtener historial:', error);
            setHistorial([]);
        }
    };

    const closePopup = () => {
        setPopupData(null);
        setPopupType('');
    };

    const handleSaveChanges = async () => {
        try {
            const payload = {
                type: popupType,
                data: {
                    ...popupData,
                    ...editedData, 
                }
            };
    
            const token = localStorage.getItem('token');
        
        console.log('🚀 Guardando cambios:', payload);
        console.log('🔑 Token usado:', token);
        const response = await api.put(
            apiPath('/update'),
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    
            console.log("✅ Datos actualizados con éxito:", response.data);

            setPopupData((prev) => ({ ...prev, ...editedData }));
            setIsEditing(false);
            alert("✅ Cambios guardados exitosamente.");
        } catch (error) {
            console.error("❌ Error al actualizar los datos:", error.response?.status, error.response?.data || error.message);
            alert(error?.response?.data?.message || "Hubo un problema al guardar los cambios.");
        }
    };

    const handleItemClick = (type, item) => {
        let clickTimeout;
    
        return () => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
                handleCardDoubleClick(type, item);
            } else {
                clickTimeout = setTimeout(() => {
                    handleFilterClick(type, item);
                    clickTimeout = null;
                }, 250);
            }
        };
    };

    const normalizeKey = (k) =>
  k
    .replace(/[ _\n\r\t]+/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

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
                {loading && <p style={{ marginTop: '10px', fontWeight: 'bold', color: '#007bff' }}>Cargando resultados...</p>}
            </form>

            <button className="export-excel-btn" onClick={exportToExcel}>
                  📁 Exportar a Excel
            </button>

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

            {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Editar</button>
            ) : (
                <button className="save-btn" onClick={handleSaveChanges}>Guardar</button>
            )}

        <div className="detalle-formulario">
            {(() => {
  let entries = Object.entries(popupData).filter(([k]) => k !== "_id" && k !== "__v");

  // Inyecta la condición si es Cliente y no viene en el doc
  if (popupType === 'Cliente' && !entries.some(([k]) => normalizeKey(k) === 'CONDICION CLIENTE')) {
    entries = [['CONDICION \nCLIENTE', popupData["CONDICION \nCLIENTE"] || 'ACTIVO'], ...entries];
  }

  return entries.map(([key, value]) => {
    const NK = normalizeKey(key); // clave normalizada
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
      <div className="detalle-fila" key={key} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column' }}>
        <label className="detalle-label" style={{ fontWeight: 600, marginBottom: 2, color: '#225', fontSize: 15 }}>
          {beautifyFieldName(key)}
        </label>

        {isEditing ? (
          // SELECT para condición del cliente (detecta variantes con/sin salto de línea/acentos)
          (popupType === 'Cliente' && NK === 'CONDICION CLIENTE') ? (
            <select
              value={editedData[key] ?? (displayValue || "ACTIVO")}
              onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="ACTIVO">Activo</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="RETIRADO">Retirado</option>
            </select>
          ) : key === "RUT" ? (
            <input
              type="text"
              value={editedData[key] ?? displayValue}
              onChange={e => {
                const raw = e.target.value;
                const formatted = formatRut(raw);
                setEditedData({ ...editedData, [key]: formatted });
              }}
              style={{ width: "100%" }}
              maxLength={12}
              placeholder="Ej: 12.345.678-9"
            />
          ) : key === "ICCID" || key === "Equipo Princ" ? (
            <input
              type="text"
              value={editedData[key] ?? displayValue}
              onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
              style={{ width: "100%", marginBottom: 2 }}
            />
          ) : typeof value === "object" && value !== null ? (
            key === "Acc" || key === "Id" ? (
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
                    {beautifyFieldName(accKey)}
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
                    {beautifyFieldName(accKey)}
                  </label>
                ))}
              </div>
            ) : (
              <span style={{ color: "#444" }}>{displayValue}</span>
            )
          ) : typeof value === "boolean" ? (
            <span>{value ? "Sí" : "No"}</span>
          ) : (
            <span style={{ color: "#444" }}>{beautifyValue(key, displayValue)}</span>
          )
        )}
      </div>
    );
  });
})()}
  </div>
    {historial.length > 0 && (
  <div className="historial-section" style={{ marginTop: '30px' }}>
    <h3 style={{ color: '#007BFF' }}>📚 Historial de Asignaciones</h3>
    {historial.map((item, index) => (
      <div
        key={index}
        style={{
          borderBottom: '1px solid #ccc',
          paddingBottom: '8px',
          marginBottom: '12px',
        }}
      >
        {Object.entries(item)
          .filter(([key]) => !['_id', '__v'].includes(key))
          .slice(0, 4)
          .map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong>{' '}
              {typeof value === 'object'
                ? JSON.stringify(value)
                : value?.toString()}
            </p>
          ))}
      </div>
    ))}
  </div>
)}
        </div>
    </div>
)}
        </div>
    );
};

export default Buscador;