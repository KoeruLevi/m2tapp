import React, { useState } from "react";
import axios from "axios";

const FormularioCrearUsuario = ({ onClose }) => {
    const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "" });
    const [mensaje, setMensaje] = useState("");

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post("https://m2t-backend.onrender.com/api/auth/register", form);
            setMensaje("✅ Usuario creado exitosamente.");
            setForm({ nombre: "", email: "", password: "", rol: "" });
        } catch (err) {
            setMensaje("❌ Error: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <input name="email" placeholder="Correo" value={form.email} onChange={handleChange} type="email" required />
            <input name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} type="password" required />
            <select name="rol" value={form.rol} onChange={handleChange} required>
                <option value="">Selecciona rol</option>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
                <option value="tecnico">Técnico</option>
            </select>
            <button type="submit">Crear usuario</button>
            <button type="button" onClick={onClose}>Cerrar</button>
            {mensaje && <div style={{ marginTop: 8 }}>{mensaje}</div>}
        </form>
    );
};

export default FormularioCrearUsuario;