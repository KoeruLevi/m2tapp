import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css'; // Ruta al CSS

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            // Asegúrate de que la URL coincida con la de tu backend
            const response = await axios.post('https://m2t-backend.onrender.com/api/auth/login', {
                email,
                password,
            });
            // Guarda el token (y usuario si lo necesitas)
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user)); // opcional

            // Redirige (si usas React Router v6+, usa useNavigate)
            window.location.href = '/dashboard';
        } catch (error) {
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
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Ingresar</button>
            </form>
        </div>
    );
};

export default Login;
