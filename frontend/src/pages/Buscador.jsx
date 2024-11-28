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