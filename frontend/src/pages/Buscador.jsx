import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Buscador.css';


const Buscador = () => {
    const [term, setTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [resultados, setResultados] = useState({
        Simcard: [],
        EquipoAVL: [],
        Movil: [],
        Cliente: [],
    });
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Simcard');

    const handleSearch = async (e) => {
        if (e) e.preventDefault(); // Prevenir comportamiento por defecto en Enter
        try {
            setError(null);
            const response = await axios.get('http://localhost:5000/api/data/search', {
                params: { query: term },
            });
            setResultados(response.data); // Actualiza resultados
            setActiveTab('Simcard'); // Resetea la pestaña activa
            setSuggestions([]); // Limpia sugerencias tras buscar
        } catch (err) {
            console.error('Error al buscar datos:', err);
            setError(err.response?.data?.message || 'Error desconocido');
        }
    };

    const fetchSuggestions = async (value) => {
        try {
            if (value.trim() === '') {
                setSuggestions([]);
                return;
            }
            const response = await axios.get('http://localhost:5000/api/data/suggestions', {
                params: { query: value },
            });
            setSuggestions(response.data);
        } catch (err) {
            console.error('Error al obtener sugerencias:', err);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setTerm(value);
        fetchSuggestions(value);
    };

    const handleSuggestionClick = (suggestion) => {
        setTerm(suggestion);
        setSuggestions([]); // Limpia sugerencias tras seleccionar una
    };

    const renderTable = (data) => {
        if (!data || data.length === 0) {
            return <p className="no-results">No hay datos para esta categoría</p>;
        }

        const headers = Object.keys(data[0]);

        return (
            <div className="table-container">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                {headers.map((header) => (
                                    <td key={header}>
                                        {Array.isArray(item[header]) ? (
                                            <ul>
                                                {item[header].map((subItem, subIndex) =>
                                                    typeof subItem === 'object' ? (
                                                        <li key={subIndex}>
                                                            {Object.entries(subItem).map(([key, value]) => (
                                                                <span key={key}>
                                                                    <strong>{key}:</strong> {value} <br />
                                                                </span>
                                                            ))}
                                                        </li>
                                                    ) : (
                                                        <li key={subIndex}>{subItem}</li>
                                                    )
                                                )}
                                            </ul>
                                        ) : typeof item[header] === 'object' && item[header] !== null ? (
                                            <ul>
                                                {Object.entries(item[header]).map(([key, value]) => (
                                                    <li key={key}>
                                                        <strong>{key}:</strong> {value}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            item[header]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mt-4 buscador-wrapper">
            <h1>Buscador Universal</h1>
            <form className="position-relative" onSubmit={handleSearch}>
                <input
                    type="text"
                    value={term}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch(e);
                    }}
                    placeholder="Ingresa un término de búsqueda"
                    className="form-control"
                />
                {suggestions.length > 0 && (
                    <ul className="list-group">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className="list-group-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </form>
            <button className="btn btn-primary mt-3" onClick={handleSearch}>
                Buscar
            </button>

            {error && <p className="text-danger mt-3">{error}</p>}

            {Object.values(resultados).some((arr) => arr.length > 0) && (
                <div>
                    <ul className="nav nav-tabs mt-4">
                        {Object.keys(resultados).map((tab) => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab} ({resultados[tab].length})
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="tab-content mt-3">
                        <div className="tab-pane fade show active">
                            <h3>Datos de {activeTab}</h3>
                            {renderTable(resultados[activeTab])}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Buscador;