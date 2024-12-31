import React, { useState } from "react";
import axios from "axios";
import "../styles/Buscador.css";

const Buscador = () => {
    const [query, setQuery] = useState({ cliente: '', movil: '', equipo: '' });
    const [results, setResults] = useState({ Cliente: [], Movil: [], EquipoAVL: [] });
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedMovil, setSelectedMovil] = useState(null);
    const [filteredMoviles, setFilteredMoviles] = useState([]);
    const [filteredEquipos, setFilteredEquipos] = useState([]);
    const [popupData, setPopupData] = useState(null);
    const [popupType, setPopupType] = useState('');
    const [selectedCard, setSelectedCard] = useState({ Cliente: null, Movil: null, EquipoAVL: null });

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(
                `http://localhost:5000/api/data/search`,
                { params: query }
            );
            setResults(response.data);
            setFilteredMoviles(response.data.Movil); // Resetear filtros al buscar
            setFilteredEquipos(response.data.EquipoAVL);
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
            alert('Hubo un problema al realizar la búsqueda. Intenta nuevamente.');
        }
    };

    const handleClienteClick = (index) => {
        const clienteSeleccionado = results.Cliente[index];
        setSelectedCliente(clienteSeleccionado);
        setSelectedCard((prev) => ({ ...prev, Cliente: index }));

        if (clienteSeleccionado) {
            const movilesFiltrados = results.Movil.filter(
                (movil) => movil.Cliente === clienteSeleccionado.Cliente
            );
            setFilteredMoviles(movilesFiltrados);
            setFilteredEquipos([]); // Resetea equipos al seleccionar cliente
        }
    };

    const handleMovilClick = (index) => {
        const movilSeleccionado = filteredMoviles[index];
        setSelectedMovil(movilSeleccionado);
        setSelectedCard((prev) => ({ ...prev, Movil: index }));

        if (movilSeleccionado) {
            const equiposFiltrados = results.EquipoAVL.filter(
                (equipo) => equipo.ID === movilSeleccionado['Equipo Princ']['']
            );
            setFilteredEquipos(equiposFiltrados);
        }
    };

    const handleEquipoClick = (index) => {
        setSelectedCard((prev) => ({ ...prev, EquipoAVL: index }));
    };

    const handleCardDoubleClick = (type, data) => {
        setPopupType(type);
        setPopupData(data);
    };

    const closePopup = () => {
        setPopupData(null);
        setPopupType('');
    };

    const renderPopupContent = () => {
        if (!popupData) return null;

        return Object.entries(popupData)
            .filter(([key]) => key !== '_id') // Excluir el campo "_id"
            .map(([key, value]) => {
                if (key === 'Equipo Princ' && typeof value === 'object' && value !== null) {
                    // Renderizar el contenido del objeto "Equipo Princ"
                    const equipoPrincValue = Object.values(value)[0];
                    return (
                        <div key={key}>
                            <p><strong>{key}:</strong> {equipoPrincValue}</p>
                        </div>
                    );
                } else if (typeof value === 'object' && value !== null) {
                    // Renderizar objetos generales como checkboxes
                    return (
                        <div key={key}>
                            <p><strong>{key}:</strong></p>
                            <div className="checkbox-list">
                                {Object.entries(value).map(([subKey, subValue]) => (
                                    <div key={subKey}>
                                        <input
                                            type="checkbox"
                                            checked={!!subValue}
                                            disabled
                                        />
                                        <label>{subKey}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } else if (typeof value === 'boolean') {
                    // Renderizar valores booleanos como checkboxes
                    return (
                        <div key={key}>
                            <p><strong>{key}:</strong></p>
                            <input type="checkbox" checked={value} disabled />
                        </div>
                    );
                } else {
                    // Renderizar valores simples como texto
                    return (
                        <div key={key}>
                            <p><strong>{key}:</strong> {value}</p>
                        </div>
                    );
                }
            });
    };

    return (
        <div className="buscador-wrapper">
            <h1 className="buscador-titulo">Buscador Universal</h1>
            <form className="buscador-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Filtrar por Cliente"
                    value={query.cliente}
                    onChange={(e) => setQuery({ ...query, cliente: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Filtrar por Móvil"
                    value={query.movil}
                    onChange={(e) => setQuery({ ...query, movil: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Filtrar por Equipo"
                    value={query.equipo}
                    onChange={(e) => setQuery({ ...query, equipo: e.target.value })}
                />
                <button type="submit">Buscar</button>
            </form>

            <div className="tabs-container">
                <div className="tab">
                    <h2>Clientes</h2>
                    <div className="tab-content">
                        {results.Cliente.map((cliente, index) => (
                            <div
                                key={index}
                                className={`card ${selectedCard.Cliente === index ? 'selected' : ''}`}
                                onClick={() => handleClienteClick(index)}
                                onDoubleClick={() => handleCardDoubleClick('Cliente', cliente)}
                            >
                                <p><strong>Nombre:</strong> {cliente.Cliente}</p>
                                <p><strong>RUT:</strong> {cliente.RUT}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tab">
                    <h2>Móviles</h2>
                    <div className="tab-content">
                        {filteredMoviles.map((movil, index) => (
                            <div
                                key={index}
                                className={`card ${selectedCard.Movil === index ? 'selected' : ''}`}
                                onClick={() => handleMovilClick(index)}
                                onDoubleClick={() => handleCardDoubleClick('Movil', movil)}
                            >
                                <p><strong>Patente:</strong> {movil.Patente}</p>
                                <p><strong>Marca:</strong> {movil.Marca}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tab">
                    <h2>Equipos AVL</h2>
                    <div className="tab-content">
                        {filteredEquipos.map((equipo, index) => (
                            <div
                                key={index}
                                className={`card ${selectedCard.EquipoAVL === index ? 'selected' : ''}`}
                                onClick={() => handleEquipoClick(index)}
                                onDoubleClick={() => handleCardDoubleClick('EquipoAVL', equipo)}
                            >
                                <p><strong>IMEI:</strong> {equipo.imei}</p>
                                <p><strong>Modelo:</strong> {equipo.model}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {popupData && (
                <div className="popup">
                    <div className="popup-content">
                        <button className="close-btn" onClick={closePopup}>X</button>
                        <h2>Detalles de {popupType}</h2>
                        {renderPopupContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Buscador;