import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css'; // Ruta correcta al archivo CSS

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita el recargo de la página
        setError(null); // Reinicia el estado de errores

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password,
            });
            console.log('Respuesta del backend:', response.data);

            // Guarda el token en el localStorage o realiza acciones según la lógica
            localStorage.setItem('token', response.data.token);
            alert('Login exitoso, redirigiendo al dashboard...');
            window.location.href = '/dashboard'; // Redirige al dashboard
        } catch (error) {
            console.error('Error en el login:', error.response || error.message);
            setError(
                error.response?.data?.message || 'Ocurrió un error al iniciar sesión'
            );
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Iniciar Sesión</h2>
                {error && <p className="error-message">{error}</p>}
                <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Ingresar</button>
            </form>
        </div>
    );
};

export default Login;