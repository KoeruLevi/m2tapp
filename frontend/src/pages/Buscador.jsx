import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Buscador.css';

const Buscador = () => {
    const [filters, setFilters] = useState({
        cliente: '',
        movil: '',
        equipo: ''
    });
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setResults([]);

        try {
            // Construir la consulta con los filtros
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`http://localhost:5000/api/data/search?${queryParams}`);
            setResults(response.data);
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
            setError('Hubo un problema al realizar la búsqueda. Intenta nuevamente.');
        }
    };

    return (
        <div className="buscador-container">
            <h1 className="buscador-titulo">Buscador Universal</h1>
            <form className="buscador-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    name="cliente"
                    value={filters.cliente}
                    onChange={handleInputChange}
                    className="buscador-input"
                    placeholder="Filtrar por Cliente"
                />
                <input
                    type="text"
                    name="movil"
                    value={filters.movil}
                    onChange={handleInputChange}
                    className="buscador-input"
                    placeholder="Filtrar por Móvil"
                />
                <input
                    type="text"
                    name="equipo"
                    value={filters.equipo}
                    onChange={handleInputChange}
                    className="buscador-input"
                    placeholder="Filtrar por Equipo"
                />
                <button type="submit" className="buscador-boton">Buscar</button>
            </form>

            {error && <p className="buscador-error">{error}</p>}

            <div className="buscador-resultados">
                {results.Cliente?.length > 0 && (
                    <div>
                        <h2>Clientes</h2>
                        <table>
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
                    </div>
                )}

                {results.Movil?.length > 0 && (
                    <div>
                        <h2>Móviles</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Patente</th>
                                    <th>Cliente</th>
                                    <th>Marca</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.Movil.map((movil, index) => (
                                    <tr key={index}>
                                        <td>{movil.Patente}</td>
                                        <td>{movil.Cliente}</td>
                                        <td>{movil.Marca}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {results.EquipoAVL?.length > 0 && (
                    <div>
                        <h2>Equipos AVL</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>IMEI</th>
                                    <th>Serial</th>
                                    <th>Modelo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.EquipoAVL.map((equipo, index) => (
                                    <tr key={index}>
                                        <td>{equipo.imei}</td>
                                        <td>{equipo.serial}</td>
                                        <td>{equipo.model}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Buscador;