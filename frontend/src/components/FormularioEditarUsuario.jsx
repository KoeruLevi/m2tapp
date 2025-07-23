import React, { useState } from "react";
import axios from "axios";

const FormularioEditarUsuario = ({ usuario, onClose }) => {
    const [form, setForm] = useState({ nombre: usuario.nombre, email: usuario.email, password: "", rol: usuario.rol });
    const [mensaje, setMensaje] = useState("");

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put("https://m2t-backend.onrender.com/api/auth/updateUser", form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMensaje("✅ Usuario actualizado.");
        } catch (err) {
            setMensaje("❌ Error: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <input name="email" placeholder="Correo" value={form.email} onChange={handleChange} type="email" required />
            <input name="password" placeholder="Nueva Contraseña (opcional)" value={form.password} onChange={handleChange} type="password" />
            <select name="rol" value={form.rol} onChange={handleChange} required>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
                <option value="tecnico">Técnico</option>
            </select>
            <button type="submit">Guardar cambios</button>
            <button type="button" onClick={onClose}>Cerrar</button>
            {mensaje && <div style={{ marginTop: 8 }}>{mensaje}</div>}
        </form>
    );
};

export default FormularioEditarUsuario;