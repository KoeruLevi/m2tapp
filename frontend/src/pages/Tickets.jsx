import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api } from '../utils/api';
import '../styles/Tickets.css';
import { useUser } from '../context/UserContext'; // ajusta la ruta si tu proyecto la tiene distinta

const PAGE = 20;
const BODY_PREVIEW_LEN = 40;

const truncateBody = (s) => {
  const text = String(s || '');
  if (text.length <= BODY_PREVIEW_LEN) return text;
  return text.slice(0, BODY_PREVIEW_LEN).trimEnd() + '… (clic para ver más)';
};

const fmt = (d) => (d ? new Date(d).toLocaleString('es-CL') : '—');

const Tickets = () => {
  const { user } = useUser();

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
  const [creating, setCreating] = useState(false);

  // Resultado (draft por ticket)
  const [draftResult, setDraftResult] = useState({}); // ticketId -> string

  // Modales
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsTicket, setDetailsTicket] = useState(null);

  const [openResult, setOpenResult] = useState(false);
  const [resultTicket, setResultTicket] = useState(null);

  const userId = user?._id;
  const userRol = user?.rol;

  const canEditResult = (t) => {
    if (!t || !userId) return false;
    if (userRol === 'admin') return true;
    if (t.createdBy?._id && String(t.createdBy._id) === String(userId)) return true;
    return (t.assignees || []).some(a => String(a?._id) === String(userId));
  };

  const canManageTicket = (t) => {
    if (!t || !userId) return false;
    if (userRol === 'admin') return true;
    return t.createdBy?._id && String(t.createdBy._id) === String(userId);
  };

  const isAssigned = (t) => {
    if (!t || !userId) return false;
    return (t.assignees || []).some(a => String(a?._id) === String(userId));
  };

  const isOverdue = (t) => t?.overdue;

  const fetchUsers = async () => {
    const r = await api.get('/api/tickets/users-lite');
    setUsers(r.data);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/tickets', {
        params: { status, mine, page, limit: PAGE, search },
      });
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch {
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
        title, body, assignees, dueAt: dueAtNew || undefined,
      });

      setFlash({ type: 'success', text: `Ticket N°${data.number} creado exitosamente.` });
      setTimeout(() => setFlash(null), 4000);

      setOpenCreate(false);
      setTitle('');
      setBody('');
      setAssignees([]);
      setDueAtNew('');

      fetchTickets().catch(() => {});
    } catch (e2) {
      setFlash({ type: 'error', text: `${e2.response?.data?.message || 'Error al crear ticket'}` });
      setTimeout(() => setFlash(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  const openDetailsModal = (t) => {
    setDetailsTicket(t);
    setOpenDetails(true);
  };

  const openResultModal = (t) => {
    setResultTicket(t);
    setOpenResult(true);

    // inicializa draft si no existe (mantiene lo que el usuario ya estaba escribiendo)
    setDraftResult(prev => {
      if (prev[t._id] !== undefined) return prev;
      return { ...prev, [t._id]: t.result ?? '' };
    });
  };

  const saveResult = async (t) => {
    try {
      const value = (draftResult[t._id] ?? t.result ?? '').toString();
      await api.put(`/api/tickets/${t._id}`, { result: value });
      await fetchTickets();
      setFlash({ type: 'success', text: 'Resultado guardado.' });
      setTimeout(() => setFlash(null), 2500);
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar resultado');
    }
  };

  const toggleDone = async (t, done) => {
    if (done) {
      const effective = (draftResult[t._id] ?? t?.result ?? '').trim();
      if (!effective) {
        alert('Debes ingresar un resultado antes de marcar el ticket como listo.');
        return;
      }
    }

    try {
      await api.put(`/api/tickets/${t._id}/done`, {
        done,
        result: draftResult[t._id], // backend guarda si viene
      });
      await fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al actualizar');
    }
  };

  const closeManual = async (t) => {
    if (!window.confirm('¿Cerrar este ticket?')) return;

    const effective = (draftResult[t._id] ?? t?.result ?? '').trim();
    if (!effective) {
      alert('Debes ingresar un resultado antes de cerrar el ticket.');
      return;
    }

    try {
      await api.put(`/api/tickets/${t._id}/close`, { result: draftResult[t._id] });
      await fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cerrar');
    }
  };

  const reopen = async (t) => {
    if (!window.confirm('¿Reabrir este ticket?')) return;
    try {
      await api.put(`/api/tickets/${t._id}/reopen`);
      await fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al reabrir');
    }
  };

  const remove = async (t) => {
    if (!window.confirm('Esta acción elimina definitivamente el ticket. ¿Continuar?')) return;
    try {
      await api.delete(`/api/tickets/${t._id}`);
      await fetchTickets();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="tickets-wrapper">
      <Header />

      {flash && (
        <div className={`toast toast--${flash.type}`} role="status">
          <span>{flash.text}</span>
          <button className="toast-close" onClick={() => setFlash(null)} aria-label="Cerrar">
            ×
          </button>
        </div>
      )}

      <div className="tickets-card">
        <div className="tickets-toolbar">
          <div className="filters">
            <button className={`chip ${status === 'open' ? 'active' : ''}`} onClick={() => { setStatus('open'); setPage(1); }}>Abiertos</button>
            <button className={`chip ${status === 'late' ? 'active' : ''}`} onClick={() => { setStatus('late'); setPage(1); }}>Atrasados</button>
            <button className={`chip ${status === 'closed' ? 'active' : ''}`} onClick={() => { setStatus('closed'); setPage(1); }}>Cerrados</button>
            <button className={`chip ${status === 'all' ? 'active' : ''}`} onClick={() => { setStatus('all'); setPage(1); }}>Todos</button>

            <select value={mine} onChange={(e) => { setMine(e.target.value); setPage(1); }} className="sel-min">
              <option value="">Todos</option>
              <option value="created">Creados por mí</option>
              <option value="assigned">Asignados a mí</option>
            </select>
          </div>

          <form onSubmit={onSearch} className="search-line">
            <input
              placeholder="Buscar por título / contenido / resultado"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <button className="btn-primary" onClick={() => setOpenCreate(true)}>+ Nuevo ticket</button>
        </div>

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
                <th style={{ width: 380 }}>Resultado / Acciones</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center' }}>Sin resultados</td></tr>
              ) : items.map(t => {
                const prog = `${t.progress.doneAssignees}/${t.progress.totalAssignees}`;
                const canEdit = canEditResult(t);
                const canManage = canManageTicket(t);
                const assigned = isAssigned(t);

                const resultLabel = canEdit
                  ? (t.result ? 'Editar resultado' : 'Agregar resultado')
                  : (t.result ? 'Ver resultado' : 'Sin resultado');

                return (
                  <tr key={t._id} className={isOverdue(t) ? 'row-overdue' : ''}>
                    <td>#{t.number}</td>

                    <td className="ticket-main" onClick={() => openDetailsModal(t)} role="button" tabIndex={0}>
                      <div className="t-title">{t.title}</div>
                      <div className={`t-body ${String(t.body || '').length > BODY_PREVIEW_LEN ? 't-body--trunc' : ''}`}>
                        {truncateBody(t.body)}
                      </div>
                    </td>

                    <td>{t.createdBy?.nombre || '-'}</td>

                    <td className="t-assignees">
                      {(t.assignees || []).map(a => <span key={a._id} className="tag">{a.nombre}</span>)}
                      {(t.assignees || []).length === 0 && <span className="muted">—</span>}
                    </td>

                    <td>{t.progress.creatorDone ? 'Creador ✓ · ' : 'Creador — · '}{prog}</td>

                    <td>{fmt(t.createdAt)}</td>

                    <td>
                      <span className={isOverdue(t) ? 'due-badge overdue' : 'due-badge'}>
                        {fmt(t.dueAt)}
                      </span>
                    </td>

                    <td>{t.status === 'open' ? 'Abierto' : 'Cerrado'}</td>

                    <td className="t-actions actions-cell">
                      <button
                        className="action-btn action-btn--ghost"
                        onClick={(e) => { e.stopPropagation(); openResultModal(t); }}
                      >
                        {resultLabel}
                      </button>

                      {t.status === 'open' && (
                        <>
                          <button
                            className="action-btn action-btn--success"
                            onClick={(e) => { e.stopPropagation(); toggleDone(t, true); }}
                            disabled={!(canManage || assigned || userRol === 'admin')}
                          >
                            Marcar listo
                          </button>

                          <button
                            className="action-btn action-btn--ghost"
                            onClick={(e) => { e.stopPropagation(); toggleDone(t, false); }}
                            disabled={!(canManage || assigned || userRol === 'admin')}
                          >
                            Deshacer
                          </button>

                          <button
                            className="action-btn action-btn--danger"
                            onClick={(e) => { e.stopPropagation(); closeManual(t); }}
                            disabled={!canManage}
                          >
                            Cerrar
                          </button>
                        </>
                      )}

                      {t.status === 'closed' && (
                        <>
                          <button
                            className="action-btn action-btn--primary"
                            onClick={(e) => { e.stopPropagation(); reopen(t); }}
                            disabled={!canManage}
                          >
                            Reabrir
                          </button>

                          <button
                            className="action-btn action-btn--danger"
                            onClick={(e) => { e.stopPropagation(); remove(t); }}
                            disabled={!canManage}
                          >
                            Eliminar
                          </button>
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
            <button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <span>Página {page} / {pages}</span>
            <button disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {/* Modal detalles del ticket */}
      {openDetails && detailsTicket && (
        <div className="modal-overlay" onClick={() => { setOpenDetails(false); setDetailsTicket(null); }}>
          <div className="modal ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-head">
              <div className="ticket-modal-title">
                Ticket #{detailsTicket.number}: {detailsTicket.title}
              </div>
              <button className="ticket-modal-close" onClick={() => { setOpenDetails(false); setDetailsTicket(null); }}>
                ×
              </button>
            </div>

            <div className="ticket-meta">
              <div><b>Creador:</b> {detailsTicket.createdBy?.nombre || '—'}</div>
              <div><b>Estado:</b> {detailsTicket.status === 'open' ? 'Abierto' : 'Cerrado'}</div>
              <div><b>Creado:</b> {fmt(detailsTicket.createdAt)}</div>
              <div><b>Fecha límite:</b> {fmt(detailsTicket.dueAt)}</div>
            </div>

            <div className="ticket-meta">
              <div style={{ gridColumn: '1 / -1' }}>
                <b>Asignados:</b>{' '}
                {(detailsTicket.assignees || []).length
                  ? (detailsTicket.assignees || []).map(a => a.nombre).join(', ')
                  : '—'}
              </div>
            </div>

            <div className="ticket-section">
              <div className="ticket-section-title">Descripción</div>
              <div className="ticket-pre">{detailsTicket.body || '—'}</div>
            </div>

            <div className="ticket-section">
              <div className="ticket-section-title">Resultado</div>
              <div className="ticket-pre">{(detailsTicket.result || '').trim() ? detailsTicket.result : '—'}</div>

              <div className="ticket-modal-actions">
                <button
                  className="action-btn action-btn--ghost"
                  onClick={() => {
                    openResultModal(detailsTicket);
                    setOpenDetails(false);
                  }}
                >
                  {canEditResult(detailsTicket)
                    ? (detailsTicket.result ? 'Editar resultado' : 'Agregar resultado')
                    : (detailsTicket.result ? 'Ver resultado' : 'Ver (vacío)')}
                </button>

                <button className="action-btn action-btn--primary" onClick={() => { setOpenDetails(false); setDetailsTicket(null); }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal resultado */}
      {openResult && resultTicket && (
        <div className="modal-overlay" onClick={() => { setOpenResult(false); setResultTicket(null); }}>
          <div className="modal result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-head">
              <div className="ticket-modal-title">
                Resultado Ticket #{resultTicket.number}
              </div>
              <button className="ticket-modal-close" onClick={() => { setOpenResult(false); setResultTicket(null); }}>
                ×
              </button>
            </div>

            <div className="ticket-section">
              <div className="ticket-section-title">Título</div>
              <div className="ticket-pre">{resultTicket.title}</div>
            </div>

            <div className="ticket-section">
              <div className="ticket-section-title">Resultado</div>

              {canEditResult(resultTicket) ? (
                <>
                  <textarea
                    className="result-textarea"
                    rows={8}
                    value={draftResult[resultTicket._id] ?? resultTicket.result ?? ''}
                    onChange={(e) => setDraftResult(s => ({ ...s, [resultTicket._id]: e.target.value }))}
                    placeholder="Escribe el resultado..."
                  />
                  <div className="ticket-modal-actions">
                    <button className="action-btn action-btn--primary" onClick={() => saveResult(resultTicket)}>
                      Guardar
                    </button>
                    <button className="action-btn action-btn--ghost" onClick={() => { setOpenResult(false); setResultTicket(null); }}>
                      Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ticket-pre">{(resultTicket.result || '').trim() ? resultTicket.result : '—'}</div>
                  <div className="ticket-modal-actions">
                    <button className="action-btn action-btn--primary" onClick={() => { setOpenResult(false); setResultTicket(null); }}>
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal crear ticket (sin cambios funcionales) */}
      {openCreate && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo ticket</h3>
            <form onSubmit={createTicket} className="create-form">
              <input
                placeholder="Título"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                disabled={creating}
              />
              <textarea
                placeholder="Descripción / notas"
                rows={6}
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                disabled={creating}
              />

              <label>Fecha límite (opcional):</label>
              <input
                type="datetime-local"
                value={dueAtNew}
                onChange={e => setDueAtNew(e.target.value)}
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
                <button type="button" onClick={() => !creating && setOpenCreate(false)} disabled={creating}>
                  Cancelar
                </button>
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