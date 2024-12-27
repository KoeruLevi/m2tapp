import React, { useState } from 'react';
import axios from 'axios';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);

    const handleSearch = async () => {
        try {
            const { data } = await axios.post('/api/data/search', { query }); // Asegúrate de que la ruta coincide con el backend
            setResults(data);
        } catch (error) {
            console.error('Error buscando datos', error);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Buscar datos"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Buscar</button>
            {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
        </div>
    );
};

export default Search;