import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Buscador.css';

const Buscador = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await axios.get('http://localhost:5000/api/data/search', {
                params: { query },
            });
            setResults(response.data);
        } catch (err) {
            console.error('Error al realizar la búsqueda:', err);
            setError('Error al realizar la búsqueda.');
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
                <div className="results-container">
                    {results.length > 0 ? (
                        results.map((item, index) => (
                            <div key={index} className="result-card">
                                {renderNestedData(item)}
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