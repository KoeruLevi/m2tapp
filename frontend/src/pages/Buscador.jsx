import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Buscador.css';

const Buscador = () => {
    const [query, setQuery] = useState(''); // Término de búsqueda
    const [results, setResults] = useState([]); // Resultados de la búsqueda
    const [error, setError] = useState(null); // Manejo de errores

    const handleSearch = async (e) => {
        e.preventDefault(); // Evitar que el formulario recargue la página
        setError(null); // Reiniciar error antes de buscar

        try {
            const response = await axios.get('http://localhost:5000/api/data/search', {
                params: { query }, // Enviar el término de búsqueda como parámetro
            });
            setResults(response.data); // Actualizar resultados
        } catch (err) {
            console.error('Error al realizar la búsqueda:', err);
            setError('No se pudo realizar la búsqueda. Verifica tu conexión.');
        }
    };

    const renderNestedData = (data, level = 0) => {
        if (!data) return null;
        const marginLeft = level * 20; // Aumentar margen para cada nivel de jerarquía
        return (
            <div style={{ marginLeft: `${marginLeft}px` }}>
                {Object.entries(data).map(([key, value]) => (
                    <div key={key}>
                        {typeof value === 'object' && value !== null ? (
                            <>
                                <strong>{key}:</strong>
                                {Array.isArray(value) ? (
                                    value.map((item, index) => (
                                        <div key={index} style={{ marginLeft: `${marginLeft + 20}px` }}>
                                            {renderNestedData(item, level + 1)}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ marginLeft: `${marginLeft + 20}px` }}>
                                        {renderNestedData(value, level + 1)}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p>
                                <strong>{key}:</strong> {value?.toString()}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="buscador-wrapper">
            <div className="buscador-container">
                <h1>Buscador</h1>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Ingresa un término de búsqueda"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit">Buscar</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <div className="results-grid">
                    {results.length > 0 ? (
                        results.map((item, index) => (
                            <div key={index} className="result-card">
                                <h3>{item.tipo}: {item.nombre || item.numeroSerie || 'Sin Nombre'}</h3>
                                <p><strong>ID:</strong> {item._id}</p>
                                {Object.keys(item).map((key) => (
                                    <p key={key}>
                                        <strong>{key}:</strong> {JSON.stringify(item[key])}
                                    </p>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="no-results">No se encontraron resultados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Buscador;