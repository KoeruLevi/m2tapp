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

    return (
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
                        <div key={index} className="result-item">
                            <h3>{item.nombre || 'Sin Nombre'}</h3>
                            <p>ID: {item._id}</p>
                            {/* Agrega aquí los campos que deseas mostrar */}
                        </div>
                    ))
                ) : (
                    <p>No se encontraron resultados</p>
                )}
            </div>
        </div>
    );
};

export default Buscador;