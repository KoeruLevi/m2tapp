import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api } from '../utils/api';
import '../styles/Tickets.css';

const PAGE = 20;

const Tickets = () => {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('open'); // 'open' | 'closed' | 'all'
  const [mine, setMine] = useState(''); // '' | 'created' | 'assigned'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Crear ticket
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assignees, setAssignees] = useState([]);

  const fetchUsers = async () => {
    const r = await api.get('/api/tickets/users-lite');
    setUsers(r.data);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/tickets', { params: { status, mine, page, limit: PAGE, search } });
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch (e) {
      alert('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchTickets(); /* eslint-disable-next-line */ }, [status, mine, page]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tickets', { title, body, assignees });
      setOpenCreate(false);
      setTitle(''); setBody(''); setAssignees([]);
      setPage(1);
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al crear ticket');
    }
  };

  const toggleDone = async (id, done) => {
    try {
      await api.put(`/api/tickets/${id}/done`, { done });
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al actualizar');
    }
  };

  const closeManual = async (id) => {
    if (!window.confirm('¿Cerrar este ticket?')) return;
    try {
      await api.put(`/api/tickets/${id}/close`);
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cerrar');
    }
  };

  const reopen = async (id) => {
    if (!window.confirm('¿Reabrir este ticket?')) return;
    try {
      await api.put(`/api/tickets/${id}/reopen`);
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al reabrir');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Esta acción elimina definitivamente el ticket. ¿Continuar?')) return;
    try {
      await api.delete(`/api/tickets/${id}`);
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="tickets-wrapper">
      <Header />
      <div className="tickets-card">
        <div className="tickets-toolbar">
          <div className="filters">
            <button className={`chip ${status==='open'?'active':''}`} onClick={()=>{setStatus('open');setPage(1)}}>Abiertos</button>
            <button className={`chip ${status==='closed'?'active':''}`} onClick={()=>{setStatus('closed');setPage(1)}}>Cerrados</button>
            <button className={`chip ${status==='all'?'active':''}`} onClick={()=>{setStatus('all');setPage(1)}}>Todos</button>

            <select value={mine} onChange={(e)=>{setMine(e.target.value);setPage(1)}} className="sel-min">
              <option value="">Todos</option>
              <option value="created">Creados por mí</option>
              <option value="assigned">Asignados a mí</option>
            </select>
          </div>

          <form onSubmit={onSearch} className="search-line">
            <input placeholder="Buscar por título/contenido" value={search} onChange={e=>setSearch(e.target.value)} />
            <button type="submit">Buscar</button>
          </form>

          <button className="btn-primary" onClick={()=>setOpenCreate(true)}>+ Nuevo ticket</button>
        </div>

        {/* tabla simple */}
        <div className="tickets-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Creador</th>
                <th>Asignados</th>
                <th>Progreso</th>
                <th>Estado</th>
                <th style={{width: 230}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 ? (
                <tr><td colSpan={6} style={{textAlign:'center'}}>Sin resultados</td></tr>
              ) : items.map(t => {
                const prog = `${t.progress.doneAssignees}/${t.progress.totalAssignees}`;
                return (
                  <tr key={t._id}>
                    <td>
                      <div className="t-title">{t.title}</div>
                      <div className="t-body">{t.body}</div>
                    </td>
                    <td>{t.createdBy?.nombre || '-'}</td>
                    <td className="t-assignees">
                      {t.assignees.map(a => <span key={a._id} className="tag">{a.nombre}</span>)}
                      {t.assignees.length===0 && <span className="muted">—</span>}
                    </td>
                    <td>{t.progress.creatorDone ? 'Creador ✓ · ' : 'Creador — · '}{prog}</td>
                    <td>{t.status==='open' ? 'Abierto' : 'Cerrado'}</td>
                    <td className="t-actions">
                      {/* marcar listo / deshacer */}
                      {t.status==='open' && (
                        <>
                          <button className="action-btn action-btn--ghost" onClick={()=>toggleDone(t._id, true)}>Marcar listo</button>
                          <button className="action-btn action-btn--success" onClick={()=>toggleDone(t._id, false)}>Deshacer</button>
                          <button className="action-btn action-btn--danger" onClick={()=>closeManual(t._id)}>Cerrar</button>
                        </>
                      )}
                      {t.status==='closed' && (
                        <>
                          <button className="action-btn action-btn--primary" onClick={()=>reopen(t._id)}>Reabrir</button>
                          <button className="action-btn action-btn--danger" onClick={()=>remove(t._id)}>Eliminar</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="tickets-footer">
          <div className="pager">
            <button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)}>Anterior</button>
            <span>Página {page} / {pages}</span>
            <button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {openCreate && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nuevo ticket</h3>
            <form onSubmit={createTicket} className="create-form">
              <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} required />
              <textarea placeholder="Descripción / notas" rows={6} value={body} onChange={e=>setBody(e.target.value)} required />
              <label>Asignar a:</label>
              <div className="assignees-list">
                {users.map(u => (
                  <label key={u._id} className="check">
                    <input
                      type="checkbox"
                      checked={assignees.includes(u._id)}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setAssignees(prev => on ? [...prev, u._id] : prev.filter(x => x !== u._id));
                      }}
                    />
                    <span>{u.nombre} <span className="muted">({u.email})</span></span>
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={()=>setOpenCreate(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;