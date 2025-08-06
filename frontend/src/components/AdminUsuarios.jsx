import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminUsuarios.css";

const AdminUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({});
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        const resp = await axios.get("https://m2t-backend.onrender.com/api/auth/users", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(resp.data);
    };

    const handleEdit = (usuario) => {
        setEditando(usuario._id);
        setForm({
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        });
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        await axios.put(`https://m2t-backend.onrender.com/api/auth/updateUser/${editando}`,
            form,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditando(null);
        fetchUsuarios();
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que quieres borrar este usuario?")) {
            await axios.delete(`https://m2t-backend.onrender.com/api/auth/deleteUser/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsuarios();
        }
    };

    return (
        <div>
            <h2>Gestión de Usuarios</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                {usuarios.map(u =>
                    <tr key={u._id}>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>{u.rol}</td>
                        <td>
                            <button onClick={() => handleEdit(u)}>Editar</button>
                            <button onClick={() => handleDelete(u._id)} style={{color:'red'}}>Eliminar</button>
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            {editando && (
                <form onSubmit={handleSubmitEdit}>
                    <input value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} placeholder="Nombre"/>
                    <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email"/>
                    <select value={form.rol} onChange={e=>setForm({...form, rol: e.target.value})}>
                        <option value="admin">Admin</option>
                        <option value="operador">Operador</option>
                        <option value="tecnico">Técnico</option>
                    </select>
                    <button type="submit">Guardar cambios</button>
                    <button type="button" onClick={()=>setEditando(null)}>Cancelar</button>
                </form>
            )}
        </div>
    );
};

export default AdminUsuarios;