import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminUsuarios.css";

const AdminUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({});
    const token = localStorage.getItem('token');
    const [isMasterEdit, setIsMasterEdit] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const iAmAdmin  = currentUser?.rol === 'admin';
    const iAmMaster = !!currentUser?.isMaster;

    const [pwdUser, setPwdUser] = useState(null);
    const [pwd1, setPwd1] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    
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
        setIsMasterEdit(!!usuario.isMaster);
        setForm({
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        });
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        const payload = { ...form };
        if (isMasterEdit) delete payload.rol;
        await axios.put(`https://m2t-backend.onrender.com/api/auth/updateUser/${editando}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditando(null);
        fetchUsuarios();
    };

    const handleDelete = async (id) => {
        const u = usuarios.find(x => x._id === id);
        if (u && (u.nombre || '').trim().toLowerCase() === 'admin') {  // <-- NUEVO
            alert('Este usuario está protegido y no puede eliminarse.');
            return;
        }
        
        if (window.confirm("¿Seguro que quieres borrar este usuario?")) {
            await axios.delete(`https://m2t-backend.onrender.com/api/auth/deleteUser/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsuarios();
        }
    };

    const openChangePwd = (usuario) => {
  setPwdUser(usuario);
  setPwd1(''); setPwd2(''); setShowPwd(false);
};

const submitChangePwd = async (e) => {
  e.preventDefault();
  if (pwd1.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
  if (pwd1 !== pwd2)   return alert('Las contraseñas no coinciden');

  try {
    await axios.put(
      `https://m2t-backend.onrender.com/api/auth/changePassword/${pwdUser._id}`,
      { newPassword: pwd1, confirm: pwd2 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('Contraseña actualizada');
    setPwdUser(null);
  } catch (err) {
    alert(err?.response?.data?.message || 'Error al cambiar contraseña');
  }
};

const resetPassword = async (usuario) => {
  if (!window.confirm(`¿Resetear contraseña de ${usuario.nombre}? Se generará una temporal.`)) return;
  try {
    const r = await axios.post(
      `https://m2t-backend.onrender.com/api/auth/resetPassword/${usuario._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const temp = r.data?.tempPassword;
    if (temp) {
      try { await navigator.clipboard.writeText(temp); } catch {}
      alert(`Nueva contraseña temporal: ${temp}\n\n(ya fue copiada al portapapeles)`);
    } else {
      alert('Contraseña reseteada');
    }
  } catch (err) {
    alert(err?.response?.data?.message || 'Error al resetear contraseña');
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
  {usuarios.length === 0 ? (
    <tr><td colSpan="4">No hay usuarios registrados.</td></tr>
  ) : (
    usuarios.map(u =>
      <tr key={u._id}>
        <td>{u.nombre}</td>
        <td>{u.email}</td>
        <td>{u.rol}</td>
        <td>
            <button onClick={() => handleEdit(u)}>Editar</button>
            {!u.isMaster && (
                <button onClick={() => handleDelete(u._id)} style={{ color: 'red' }}>
                    Eliminar
                </button>
            )}
            { (u.isMaster ? iAmMaster : iAmAdmin) && (
            <>
            <button onClick={() => openChangePwd(u)}>Cambiar pass</button>
            <button onClick={() => resetPassword(u)} className="btn-warn">Reset pass</button>
            </>
            )}
        </td>
      </tr>
    )
  )}
</tbody>
        </table>
            {editando && (
                <form onSubmit={handleSubmitEdit}>
                    <input value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} placeholder="Nombre"/>
                    <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email"/>
                    <select
                        value={form.rol}
                        onChange={e => setForm({ ...form, rol: e.target.value })}
                        disabled={isMasterEdit}
                        title={isMasterEdit ? 'El rol del usuario maestro no se puede modificar' : ''}
                    >
                        <option value="admin">Admin</option>
                        <option value="operador">Operador</option>
                        <option value="tecnico">Técnico</option>
                    </select>

                    {isMasterEdit && (
                        <small style={{ display: 'block', marginTop: 6, color: '#a22' }}>
                        El rol del usuario maestro no se puede modificar.
                        </small>
                    )}
                    <button type="submit">Guardar cambios</button>
                    <button type="button" onClick={()=>setEditando(null)}>Cancelar</button>
                </form>  
            )}

            {pwdUser && (
                <div className="modal-overlay">
                    <div className="modal">
                    <h3>Cambiar contraseña — {pwdUser.nombre}</h3>
                    <form onSubmit={submitChangePwd}>
                        <div className="pwd-row">
                        <label>Nueva contraseña</label>
                        <input
                            type={showPwd ? 'text' : 'password'}
                            value={pwd1}
                            onChange={e=>setPwd1(e.target.value)}
                            required
                        />
                        </div>
                        <div className="pwd-row">
                        <label>Repetir contraseña</label>
                        <input
                            type={showPwd ? 'text' : 'password'}
                            value={pwd2}
                            onChange={e=>setPwd2(e.target.value)}
                            required
                        />
                        </div>
        <label className="toggle-eye">
          <input type="checkbox" checked={showPwd} onChange={e=>setShowPwd(e.target.checked)} /> Mostrar
        </label>
        <div className="modal-actions">
          <button type="button" onClick={()=>setPwdUser(null)}>Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    </div>
  </div>
)}
            
        </div>
        
    );
};

export default AdminUsuarios;