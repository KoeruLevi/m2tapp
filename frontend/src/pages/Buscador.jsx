import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Buscador.css';

const Buscador = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ Cliente: [], Movil: [], EquipoAVL: [] });
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Cliente'); // Tab activa

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setResults({ Cliente: [], Movil: [], EquipoAVL: [] });

        if (!query.trim()) {
            setError('El campo de búsqueda no puede estar vacío.');
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/data/search?query=${encodeURIComponent(query)}`);
            setResults(response.data);
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
            setError('Hubo un problema al realizar la búsqueda. Intenta nuevamente.');
        }
    };

    return (
        <div className="buscador-wrapper">
        <div className="buscador-container">
            <h1 className="buscador-titulo">Buscador Universal</h1>
            <form className="buscador-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="buscador-input"
                    placeholder="Ingresa un término de búsqueda"
                />
                <button type="submit" className="buscador-boton">Buscar</button>
            </form>

            {error && <p className="buscador-error">{error}</p>}

            <div className="buscador-tabs">
                <button
                    className={`tab-button ${activeTab === 'Cliente' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Cliente')}
                >
                    Clientes
                </button>
                <button
                    className={`tab-button ${activeTab === 'Movil' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Movil')}
                >
                    Móviles
                </button>
                <button
                    className={`tab-button ${activeTab === 'EquipoAVL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('EquipoAVL')}
                >
                    Equipos AVL
                </button>
            </div>

            <div className="buscador-resultados">
                {activeTab === 'Cliente' && (
                    <div>
                        <h2>Clientes</h2>
                        {results.Cliente.length > 0 ? (
                            <table className="result-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>RUT</th>
                                        <th>Razón Social</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.Cliente.map((cliente, index) => (
                                        <tr key={index}>
                                            <td>{cliente.Cliente}</td>
                                            <td>{cliente.RUT}</td>
                                            <td>{cliente['Razon Social']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No se encontraron resultados para Clientes.</p>
                        )}
                    </div>
                )}

                {activeTab === 'Movil' && (
                    <div>
                        <h2>Móviles</h2>
                        {results.Movil.length > 0 ? (
                            <table className="result-table">
                                <thead>
                                    <tr>
                                        <th>Patente</th>
                                        <th>Cliente</th>
                                        <th>Marca</th>
                                        <th>Tipo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.Movil.map((movil, index) => (
                                        <tr key={index}>
                                            <td>{movil.Patente}</td>
                                            <td>{movil.Cliente}</td>
                                            <td>{movil.Marca}</td>
                                            <td>{movil.Tipo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No se encontraron resultados para Móviles.</p>
                        )}
                    </div>
                )}

                {activeTab === 'EquipoAVL' && (
                    <div>
                        <h2>Equipos AVL</h2>
                        {results.EquipoAVL.length > 0 ? (
                            <table className="result-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Modelo</th>
                                        <th>IMEI</th>
                                        <th>Serial</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.EquipoAVL.map((equipo, index) => (
                                        <tr key={index}>
                                            <td>{equipo.ID}</td>
                                            <td>{equipo.model}</td>
                                            <td>{equipo.imei}</td>
                                            <td>{equipo.serial}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No se encontraron resultados para Equipos AVL.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default Buscador;