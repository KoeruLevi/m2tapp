import React, { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useUser } from "../context/UserContext";

const FormularioEditarUsuario = ({ usuario, onClose }) => {
    const { setUser } = useUser ? useUser() : { setUser: () => {} };
    const { loginUser } = useUser();
    const [form, setForm] = useState({ 
        nombre: usuario.nombre, 
        email: usuario.email, 
        rol: usuario.rol 
    });
    const [mensaje, setMensaje] = useState("");
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setForm({
            nombre: usuario.nombre, 
            email: usuario.email, 
            rol: usuario.rol
        });
        setPassword("");
        setConfirmPassword("");
    }, [usuario]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();

        if (showPasswordFields && password !== confirmPassword) {
            setMensaje("❌ Las contraseñas no coinciden.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const dataToSend = { ...form };
            if (showPasswordFields && password) dataToSend.password = password;

            const response = await axios.put("https://m2t-backend.onrender.com/api/auth/updateUser", dataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (setUser && response.data && response.data.user) {
                setUser(response.data.user);
            } else if (setUser) {
                setUser({ ...usuario, ...form });
            }

            setMensaje("✅ Edición exitosa");
            const nuevoUsuario = { ...usuario, ...form };
            loginUser(nuevoUsuario);

            setTimeout(() => {
                setMensaje("");
                onClose();
            }, 1500);
        } catch (err) {
            setMensaje("❌ Error: " + (err.response?.data?.message || err.message));
            console.log("🔴 Error backend:", err.response?.data, err);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <input name="email" placeholder="Correo" value={form.email} onChange={handleChange} type="email" required />

            <button 
                type="button" 
                onClick={() => setShowPasswordFields(v => !v)}
                style={{ marginBottom: 8 }}
            >
                {showPasswordFields ? "Cancelar cambio de contraseña" : "Cambiar contraseña"}
            </button>

            {showPasswordFields && (
                <>
                    <div style={{ display: "flex", gap: 4 }}>
                        <input
                            name="password"
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            tabIndex={-1}
                            style={{ width: 50 }}
                        >
                            {showPassword ? "Ocultar" : "Ver"}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        <input
                            name="confirmPassword"
                            placeholder="Confirmar nueva contraseña"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(v => !v)}
                            tabIndex={-1}
                            style={{ width: 50 }}
                        >
                            {showConfirmPassword ? "Ocultar" : "Ver"}
                        </button>
                    </div>
                </>
            )}

            <select name="rol" value={form.rol} onChange={handleChange} required>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
                <option value="tecnico">Técnico</option>
            </select>
            <button type="submit">Guardar cambios</button>
            <button type="button" onClick={onClose}>Cerrar</button>
            {mensaje && <div style={{
                marginTop: 8,
                background: "#fff",
                borderRadius: 4,
                padding: 8,
                color: mensaje.includes("✅") ? "green" : mensaje.includes("❌") ? "red" : "#333",
                fontWeight: 500
            }}>{mensaje}</div>}
        </form>
    );
};

FormularioEditarUsuario.propTypes = {
    usuario: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default FormularioEditarUsuario;