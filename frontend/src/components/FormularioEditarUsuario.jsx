import React, { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const FormularioEditarUsuario = ({ usuario, onClose }) => {
    // 1. Loguear el usuario recibido
    useEffect(() => {
        console.log("🟠 Prop usuario recibido en FormularioEditarUsuario:", usuario);
    }, [usuario]);

    const [form, setForm] = useState({ 
        nombre: usuario.nombre, 
        email: usuario.email, 
        password: "", 
        rol: usuario.rol 
    });
    const [mensaje, setMensaje] = useState("");

    // 2. Loguear cada vez que cambia el form
    useEffect(() => {
        console.log("🟢 Estado 'form' actualizado:", form);
    }, [form]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // 3. Loguear el token y los datos que van al backend
            console.log("🔵 Token usado:", token);
            console.log("🟣 Datos enviados al backend:", form);

            const response = await axios.put("https://m2t-backend.onrender.com/api/auth/updateUser", form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // 4. Loguear la respuesta del backend
            console.log("🟤 Respuesta del backend:", response.data);

            setMensaje("✅ Edición exitosa");
            setTimeout(() => {
                setMensaje("");
                onClose();
            }, 1500);
        } catch (err) {
            setMensaje("❌ Error: " + (err.response?.data?.message || err.message));
            // 5. Loguear el error
            console.log("🔴 Error backend:", err.response?.data, err);
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

FormularioEditarUsuario.propTypes = {
  usuario: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default FormularioEditarUsuario;