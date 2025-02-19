import React, { useState } from 'react';
import axios from 'axios';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('El campo de búsqueda no puede estar vacío.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.get('https://m2t-backend.onrender.com/api/data/search', { params: { cliente: query, movil: query, equipo: query, simcard: query } });
            console.log("Datos recibidos:", data);
            setResults(data);
        } catch (error) {
            console.error('Error buscando datos:', error);
            setError('Error al realizar la búsqueda. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Buscador Rápido</h2>
            <input
                type="text"
                placeholder="Ingrese búsqueda"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px'
                }}
            />
            <button
                onClick={handleSearch}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
                disabled={loading}
            >
                {loading ? 'Buscando...' : 'Buscar'}
            </button>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

            {results && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Resultados:</h3>
                    <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
                        {JSON.stringify(results, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default Search;