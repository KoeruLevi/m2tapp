import React, { useState } from "react";
import axios from "axios";
import "../styles/FormularioCrearUsuario.css";

const FormularioCrearUsuario = ({ onClose }) => {
    const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "" });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        if (form.password !== confirmPassword) {
            setMensaje("❌ Las contraseñas no coinciden.");
            return;
        }
        try {
            await axios.post("/api/auth/register", form);
            setMensaje("✅ Usuario creado exitosamente.");
            setForm({ nombre: "", email: "", password: "", rol: "" });
            setConfirmPassword("");
        } catch (err) {
            setMensaje("❌ Error: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <input name="email" placeholder="Correo" value={form.email} onChange={handleChange} type="email" required />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    required
                    style={{ flex: 1 }}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                        padding: "4px 8px", background: "#eee", border: "1px solid #aaa", borderRadius: 4, cursor: "pointer"
                    }}
                    tabIndex={-1}
                >
                    {showPassword ? "Ocultar" : "Ver"}
                </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    style={{ flex: 1 }}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    style={{
                        padding: "4px 8px", background: "#eee", border: "1px solid #aaa", borderRadius: 4, cursor: "pointer"
                    }}
                    tabIndex={-1}
                >
                    {showConfirmPassword ? "Ocultar" : "Ver"}
                </button>
            </div>
            <select name="rol" value={form.rol} onChange={handleChange} required>
                <option value="">Selecciona rol</option>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
                <option value="tecnico">Técnico</option>
            </select>
            <button type="submit">Crear usuario</button>
            <button type="button" onClick={onClose}>Cerrar</button>
            {mensaje && (
                <div className={`mensaje-feedback ${
                    mensaje.includes("✅") ? "exito" : mensaje.includes("❌") ? "error" : ""
                }`}>
                    {mensaje}
                </div>
            )}
        </form>
    );
};

export default FormularioCrearUsuario;