import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { api } from '../utils/api';
import '../styles/Tickets.css';

const PAGE = 20;

const Tickets = () => {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('open'); // 'open' | 'closed' | 'all' | 'late'
  const [mine, setMine] = useState(''); // '' | 'created' | 'assigned'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null); // { type:'success'|'error', text:string } | null

  // Crear ticket
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [dueAtNew, setDueAtNew] = useState('');
  const [creating, setCreating] = useState(false); // evita doble envío

  // Edición rápida por fila
  const [draftResult, setDraftResult] = useState({}); // ticketId -> string

  const fetchUsers = async () => {
    const r = await api.get('/api/tickets/users-lite');
    setUsers(r.data);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/tickets', {
        params: { status, mine, page, limit: PAGE, search }
      });
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
  useEffect(() => { fetchTickets(); }, [status, mine, page]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);

    try {
      const { data } = await api.post('/api/tickets', {
        title, body, assignees, dueAt: dueAtNew || undefined
      });

      // Mostrar confirmación y cerrar modal inmediatamente
      setFlash({ type: 'success', text: `✅ Ticket N°${data.number} creado exitosamente.` });
      setTimeout(() => setFlash(null), 4000);
      setOpenCreate(false);
      setTitle(''); setBody(''); setAssignees([]); setDueAtNew('');

      // Refrescar lista sin romper la UX si falla
      fetchTickets().catch(() => {});
    } catch (e) {
      setFlash({ type: 'error', text: `❌ ${e.response?.data?.message || 'Error al crear ticket'}` });
      setTimeout(() => setFlash(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  const saveMeta = async (id) => {
    try {
      await api.put(`/api/tickets/${id}`, { result: draftResult[id] ?? '' });
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar resultado');
    }
  };

  const toggleDone = async (id, done) => {
    if (done) {
      const t = items.find(x => x._id === id);
      const effective = (draftResult[id] ?? t?.result ?? '').trim();
      if (!effective) {
        alert('Debes ingresar un resultado antes de marcar el ticket como listo.');
        return;
      }
    }
    try {
      await api.put(`/api/tickets/${id}/done`, {
        done,
        result: draftResult[id] // el backend exige resultado si done=true
      });
      fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al actualizar');
    }
  };

  const closeManual = async (id) => {
    if (!window.confirm('¿Cerrar este ticket?')) return;
    const t = items.find(x => x._id === id);
    const effective = (draftResult[id] ?? t?.result ?? '').trim();
    if (!effective) {
      alert('Debes ingresar un resultado antes de cerrar el ticket.');
      return;
    }
    try {
      await api.put(`/api/tickets/${id}/close`, { result: draftResult[id] });
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

  const fmt = (d) => d ? new Date(d).toLocaleString('es-CL') : '—';
  const isOverdue = (t) => t.overdue;

  return (
    <div className="tickets-wrapper">
      <Header />

      {/* Toast de confirmación/errores (por encima del modal) */}
      {flash && (
        <div className={`toast toast--${flash.type}`} role="status">
          <span>{flash.text}</span>
          <button
            className="toast-close"
            onClick={() => setFlash(null)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}

      <div className="tickets-card">
        <div className="tickets-toolbar">
          <div className="filters">
            <button className={`chip ${status==='open'?'active':''}`} onClick={()=>{setStatus('open');setPage(1)}}>Abiertos</button>
            <button className={`chip ${status==='late'?'active':''}`} onClick={()=>{setStatus('late');setPage(1)}}>Atrasados</button>
            <button className={`chip ${status==='closed'?'active':''}`} onClick={()=>{setStatus('closed');setPage(1)}}>Cerrados</button>
            <button className={`chip ${status==='all'?'active':''}`} onClick={()=>{setStatus('all');setPage(1)}}>Todos</button>

            <select value={mine} onChange={(e)=>{setMine(e.target.value);setPage(1)}} className="sel-min">
              <option value="">Todos</option>
              <option value="created">Creados por mí</option>
              <option value="assigned">Asignados a mí</option>
            </select>
          </div>

          <form onSubmit={onSearch} className="search-line">
            <input
              placeholder="Buscar por título / contenido / resultado"
              value={search}
              onChange={e=>setSearch(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <button className="btn-primary" onClick={()=>setOpenCreate(true)}>+ Nuevo ticket</button>
        </div>

        {/* tabla */}
        <div className="tickets-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Creador</th>
                <th>Asignados</th>
                <th>Progreso</th>
                <th>Creado</th>
                <th>Fecha límite</th>
                <th>Estado</th>
                <th style={{width: 380}}>Resultado / Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 ? (
                <tr><td colSpan={9} style={{textAlign:'center'}}>Sin resultados</td></tr>
              ) : items.map(t => {
                const prog = `${t.progress.doneAssignees}/${t.progress.totalAssignees}`;
                return (
                  <tr key={t._id} className={isOverdue(t) ? 'row-overdue' : ''}>
                    <td>#{t.number}</td>
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
                    <td>{fmt(t.createdAt)}</td>
                    <td>
                      <span className={isOverdue(t) ? 'due-badge overdue' : 'due-badge'}>
                        {fmt(t.dueAt)}
                      </span>
                    </td>
                    <td>{t.status==='open' ? 'Abierto' : 'Cerrado'}</td>

                    <td className="t-actions actions-cell">
                      {/* caja de resultado */}
                      <input
                        className="result-input"
                        placeholder="Resultado..."
                        value={draftResult[t._id] ?? t.result ?? ''}
                        onChange={(e)=>setDraftResult(s=>({ ...s, [t._id]: e.target.value }))}
                      />
                      <button className="action-btn action-btn--ghost" onClick={()=>saveMeta(t._id)}>Guardar</button>

                      {t.status==='open' && (
                        <>
                          <button className="action-btn action-btn--success" onClick={()=>toggleDone(t._id, true)}>Marcar listo</button>
                          <button className="action-btn action-btn--ghost" onClick={()=>toggleDone(t._id, false)}>Deshacer</button>
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
              <input
                placeholder="Título"
                value={title}
                onChange={e=>setTitle(e.target.value)}
                required
                disabled={creating}
              />
              <textarea
                placeholder="Descripción / notas"
                rows={6}
                value={body}
                onChange={e=>setBody(e.target.value)}
                required
                disabled={creating}
              />

              <label>Fecha límite (opcional):</label>
              <input
                type="datetime-local"
                value={dueAtNew}
                onChange={e=>setDueAtNew(e.target.value)}
                disabled={creating}
              />

              <label>Asignar a:</label>
              <div className="assignees-list">
                {users.map(u => (
                  <label key={u._id} className="check">
                    <input
                      type="checkbox"
                      checked={assignees.includes(u._id)}
                      disabled={creating}
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
                <button type="button" onClick={()=>!creating && setOpenCreate(false)} disabled={creating}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;