import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Buscador.css';

const Buscador = () => {
    const [term, setTerm] = useState('');
    const [resultados, setResultados] = useState({
        Simcard: [],
        EquipoAVL: [],
        Movil: [],
        Cliente: [],
    });
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Simcard');

    const handleSearch = async () => {
        try {
            setError(null);
            const response = await axios.get('http://localhost:5000/api/data/search', {
                params: { query: term },
            });
            setResultados(response.data);
            setActiveTab('Simcard'); // Resetea la pestaña activa
        } catch (err) {
            console.error('Error al buscar datos:', err);
            setError(err.response?.data?.message || 'Error desconocido');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const renderTable = (data) => {
        if (!data || data.length === 0) {
            return <p>No hay datos para esta categoría</p>;
        }
    
        // Obtener las claves de las columnas de manera dinámica
        const headers = Object.keys(data[0]);
    
        return (
            <table className="table table-striped table-bordered">
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
                                    {/* Renderiza objetos o arrays de forma legible */}
                                    {typeof item[header] === 'object' && item[header] !== null ? (
                                        Array.isArray(item[header]) ? (
                                            // Si es un array, renderízalo como una lista
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
                                        ) : (
                                            // Si es un objeto, renderízalo como pares clave-valor
                                            <ul>
                                                {Object.entries(item[header]).map(([key, value]) => (
                                                    <li key={key}>
                                                        <strong>{key}:</strong> {value}
                                                    </li>
                                                ))}
                                            </ul>
                                        )
                                    ) : (
                                        // Si no es un objeto ni array, renderízalo directamente
                                        item[header]
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="container mt-4">
            <h1>Buscador Universal</h1>
            <div className="input-group mb-3">
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Ingresa un término de búsqueda"
                    className="form-control"
                />
                <button className="btn btn-primary" onClick={handleSearch}>
                    Buscar
                </button>
            </div>

            {error && <p className="text-danger">{error}</p>}

            {Object.values(resultados).some((arr) => arr.length > 0) ? (
                <div>
                    <ul className="nav nav-tabs">
                        {Object.keys(resultados).map((tab) => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => handleTabChange(tab)}
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
            ) : (
                !error && <p>No se encontraron resultados</p>
            )}
        </div>
    );
};

export default Buscador;