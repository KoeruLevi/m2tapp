import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { api, apiPath } from "../utils/api";
import "../styles/Inventario.css";

const PAGE_SIZE = 20;

const Inventario = () => {
  const [tipo, setTipo] = useState("EquipoAVL"); // "EquipoAVL" | "Simcard"
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");

  const pages = useMemo(() => Math.max(Math.ceil(total / PAGE_SIZE), 1), [total]);

  const fetchData = async () => {
    setLoading(true);
    setMsg("");
    try {
      const url = tipo === "EquipoAVL" ? "/inventario/equipos" : "/inventario/simcards";
      const resp = await api.get(apiPath(url), {
        params: { search, page, limit: PAGE_SIZE },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setRows(resp.data.items || []);
      setTotal(resp.data.total || 0);
      setSelected(null);
    } catch (err) {
      setMsg("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [tipo, page]);

  const onBuscar = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const asignar = async () => {
    if (!selected) return;
    try {
      if (tipo === "EquipoAVL") {
        const patente = window.prompt("Patente del móvil destino:");
        if (!patente) return;
        await api.post(
          apiPath("/inventario/asignar-equipo"),
          { equipoId: selected.ID, patente },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      } else {
        const equipoIdStr = window.prompt("ID del Equipo AVL destino:");
        if (!equipoIdStr) return;
        const equipoId = Number(equipoIdStr);
        if (!Number.isFinite(equipoId)) {
          alert("ID de equipo inválida");
          return;
        }
        await api.post(
          apiPath("/inventario/asignar-simcard"),
          { iccid: selected.ICCID, equipoId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      }
      alert("✅ Asignación realizada");
      fetchData();
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="inventory-wrapper">
      <Header />
      <div className="inventory-card">
        <div className="inventory-header">
          <div className="inventory-toggle">
            <button
              className={`toggle-btn ${tipo === "EquipoAVL" ? "active" : ""}`}
              onClick={() => { setTipo("EquipoAVL"); setPage(1); }}
            >
              EquipoAVL
            </button>
            <button
              className={`toggle-btn ${tipo === "Simcard" ? "active" : ""}`}
              onClick={() => { setTipo("Simcard"); setPage(1); }}
            >
              Simcard
            </button>
          </div>

          <form onSubmit={onBuscar} className="inventory-search">
            <input
              placeholder={tipo === "EquipoAVL" ? "Buscar por IMEI/Serial/ID/Modelo" : "Buscar por ICCID/Fono/Operador"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" disabled={loading}>Buscar</button>
          </form>
        </div>

        {msg && <div className="inventory-msg">{msg}</div>}

        <div className="inventory-table">
          <table>
            <thead>
              {tipo === "EquipoAVL" ? (
                <tr>
                  <th>ID</th><th>IMEI</th><th>Serial</th><th>Modelo</th><th>Estado</th>
                </tr>
              ) : (
                <tr>
                  <th>ICCID</th><th>Fono</th><th>Operador</th><th>ID Equipo</th><th>Estado</th>
                </tr>
              )}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center'}}>Sin resultados</td></tr>
              ) : rows.map((r) => {
                const selectedRow = selected && (selected._id === r._id);
                return (
                  <tr
                    key={r._id}
                    className={selectedRow ? "row-selected" : ""}
                    onClick={() => setSelected(r)}
                  >
                    {tipo === "EquipoAVL" ? (
                      <>
                        <td>{r.ID}</td>
                        <td>{r.imei}</td>
                        <td>{r.serial}</td>
                        <td>{r.model || "-"}</td>
                        <td>{r.asignadoA ? `Asignado a ${r.asignadoA.Patente}` : "Disponible"}</td>
                      </>
                    ) : (
                      <>
                        <td>{r.ICCID}</td>
                        <td>{r.fono}</td>
                        <td>{r.operador}</td>
                        <td>{r.ID ?? "-"}</td>
                        <td>{r.asignadoA ? `Asignada a ${r.asignadoA.ID}` : "Disponible"}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="inventory-footer">
          <div className="pager">
            <button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <span>Página {page} / {pages}</span>
            <button disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>

          <div className="inventory-actions">
            {selected && (
              selected.asignadoA ? (
                <div className="status assigned">
                  {tipo === "EquipoAVL"
                    ? <>Este equipo está asignado a <b>{selected.asignadoA.Patente}</b>.</>
                    : <>Esta simcard está asignada al equipo <b>{selected.asignadoA.ID}</b>.</>
                  }
                </div>
              ) : (
                <div className="status free">
                  Disponible para asignar.
                  <button onClick={asignar} className="assign-btn">Asignar</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventario;