import React, { useState } from 'react';
import '../styles/NuevoDocumento.css';
import { formatearRut } from '../utils/rut.js';
import { api, apiPath } from '../utils/api.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const NuevoDocumento = ({ tipo }) => {
  const [formData, setFormData] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Carga masiva
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkMsg, setBulkMsg] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const modulo = localStorage.getItem('modulo') || 'actual';
  const bulkEnabled = modulo !== 'historico';

  const bulkTemplates = {
    Cliente: [
      'Cliente',
      'CONDICION \nCLIENTE',
      'RUT',
      'Razon Social',
      'CONTACTO_1',
      'MAIL CONTACTO_1',
      'Domicilio',
    ],
    Movil: [
      'Patente',
      'Cliente',
      'CONDICION \nMOVIL',
      'Suspendido',
      'Interno',
      'ACTIVO EN \nTRASAT_1',
      'ACTIVO EN \nAKITA',
      'ACTIVO EN\nTgo',
      'Marca',
      'Tipo',
      'Chofer',
      'Equipo Princ',
      'TECNOLOGIA \nEQUIPO',
      'FECHA INSTALACION EQUIPO',
      'Equipo Secundario_1',
      'Equipo Secundario_2',
      'Equipo Secundario_3',
      'Tecnico\nInstalador',
      'NOTAS',
    ],
    EquipoAVL: ['imei', 'model', 'serial', 'current_firmware', 'ID'],
    Simcard: ['ICCID', 'fono', 'operador', 'portador', 'estado', 'quota', 'ID'],
  };

  const requiredByTipo = {
    Cliente: ['Cliente', 'RUT'],
    Movil: ['Patente', 'Cliente'],
    EquipoAVL: ['imei', 'model', 'serial', 'current_firmware', 'ID'],
    Simcard: ['ICCID', 'fono', 'operador', 'ID'],
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'RUT') value = formatearRut(value);
    if (type === 'checkbox') value = checked;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    try {
      const endpoint = apiPath(`/${tipo.toLowerCase()}`);
      await api.post(endpoint, formData);
      setShowModal(true);
      setMensaje('');
      setFormData({});
    } catch (error) {
      setMensaje(error?.response?.data?.message || 'Error al crear el documento.');
    } finally {
      setLoading(false);
    }
  };

  const descargarPlantilla = () => {
    const headers = bulkTemplates[tipo] || [];
    const wb = XLSX.utils.book_new();

    const emptyRow = {};
    headers.forEach((h) => (emptyRow[h] = ''));

    const ws = XLSX.utils.json_to_sheet([emptyRow], { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, `${tipo}`);

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buf], { type: 'application/octet-stream' }),
      `plantilla-${tipo}.xlsx`
    );
  };

  const subirCargaMasiva = async () => {
    setBulkMsg('');
    if (!bulkEnabled) {
      setBulkMsg('El módulo Histórico no permite carga masiva.');
      return;
    }
    if (!bulkFile) {
      setBulkMsg('Selecciona un archivo .xlsx o .csv.');
      return;
    }

    setBulkLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', bulkFile);

      const resp = await api.post(
        apiPath(`/bulk/${tipo.toLowerCase()}`),
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const r = resp.data;
      setBulkMsg(
        `Importación finalizada. Total: ${r.total}, Insertados: ${r.insertados}, Duplicados BD: ${r.duplicadosBD}, Inválidos: ${r.invalidos}`
      );
    } catch (e) {
      setBulkMsg(e?.response?.data?.message || e.message || 'Error en carga masiva.');
    } finally {
      setBulkLoading(false);
    }
  };

  // ------- CAMPOS POR TIPO -------
  const renderFields = () => {
    if (tipo === 'Cliente')
      return (
        <>
          <div className="form-row">
            <input
              type="text"
              name="Cliente"
              placeholder="Nombre del Cliente"
              value={formData.Cliente || ''}
              onChange={handleInputChange}
              required
            />
            <select
              name="CONDICION \nCLIENTE"
              value={formData['CONDICION \nCLIENTE'] || 'ACTIVO'}
              onChange={handleInputChange}
            >
              <option value="ACTIVO">Activo</option>
            </select>
          </div>

          <div className="form-row">
            <input
              type="text"
              name="RUT"
              placeholder="RUT"
              value={formData.RUT || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="Razon Social"
              placeholder="Razón Social"
              value={formData['Razon Social'] || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="CONTACTO_1"
              placeholder="Contacto"
              value={formData['CONTACTO_1'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="MAIL CONTACTO_1"
              placeholder="Mail"
              value={formData['MAIL CONTACTO_1'] || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="Domicilio"
              placeholder="Domicilio"
              value={formData['Domicilio'] || ''}
              onChange={handleInputChange}
            />
          </div>
        </>
      );

    if (tipo === 'EquipoAVL')
      return (
        <>
          <div className="form-row">
            <input
              type="text"
              name="imei"
              placeholder="IMEI"
              value={formData.imei || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="model"
              placeholder="Modelo"
              value={formData.model || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="serial"
              placeholder="Serial"
              value={formData.serial || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="current_firmware"
              placeholder="Firmware"
              value={formData.current_firmware || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="ID"
              placeholder="ID"
              value={formData.ID || ''}
              onChange={handleInputChange}
              required
            />
          </div>
        </>
      );

    if (tipo === 'Simcard')
      return (
        <>
          <div className="form-row">
            <input
              type="text"
              name="ICCID"
              placeholder="ICCID"
              value={formData.ICCID || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="fono"
              placeholder="Fono"
              value={formData.fono || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="operador"
              placeholder="Operador"
              value={formData.operador || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="portador"
              placeholder="Portador"
              value={formData.portador || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <select name="estado" value={formData.estado || 'Activo'} onChange={handleInputChange}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Suspendido">Suspendido</option>
            </select>
            <input
              type="text"
              name="quota"
              placeholder="Quota"
              value={formData.quota || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="ID"
              placeholder="ID del EquipoAVL"
              value={formData.ID || ''}
              onChange={handleInputChange}
              required
            />
          </div>
        </>
      );

    if (tipo === 'Movil')
      return (
        <div className="movil-grid">
          <div className="movil-col">
            <input
              type="text"
              name="Patente"
              placeholder="Patente"
              value={formData.Patente || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="Cliente"
              placeholder="Cliente asociado"
              value={formData.Cliente || ''}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="CONDICION \nMOVIL"
              placeholder="Condición del Móvil"
              value={formData['CONDICION \nMOVIL'] || ''}
              onChange={handleInputChange}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="Suspendido"
                checked={!!formData.Suspendido}
                onChange={handleInputChange}
              />
              Suspendido
            </label>
            <input
              type="text"
              name="Interno"
              placeholder="Interno"
              value={formData.Interno || ''}
              onChange={handleInputChange}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ACTIVO EN \nTRASAT_1"
                checked={!!formData['ACTIVO EN \nTRASAT_1']}
                onChange={handleInputChange}
              />
              Activo en Trasat_1
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ACTIVO EN \nAKITA"
                checked={!!formData['ACTIVO EN \nAKITA']}
                onChange={handleInputChange}
              />
              Activo en Akita
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ACTIVO EN\nTgo"
                checked={!!formData['ACTIVO EN\nTgo']}
                onChange={handleInputChange}
              />
              Activo en Tgo
            </label>
          </div>

          <div className="movil-col">
            <input
              type="text"
              name="Marca"
              placeholder="Marca"
              value={formData.Marca || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="Tipo"
              placeholder="Tipo"
              value={formData.Tipo || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="Chofer"
              placeholder="Chofer"
              value={formData.Chofer || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="Equipo Princ"
              placeholder="Equipo Principal"
              value={formData['Equipo Princ'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="TECNOLOGIA \nEQUIPO"
              placeholder="Tecnología del Equipo"
              value={formData['TECNOLOGIA \nEQUIPO'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="date"
              name="FECHA INSTALACION EQUIPO"
              placeholder="Fecha de Instalación del Equipo"
              value={formData['FECHA INSTALACION EQUIPO'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="Equipo Secundario_1"
              placeholder="Equipo Secundario 1"
              value={formData['Equipo Secundario_1'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="Equipo Secundario_2"
              placeholder="Equipo Secundario 2"
              value={formData['Equipo Secundario_2'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="Equipo Secundario_3"
              placeholder="Equipo Secundario 3"
              value={formData['Equipo Secundario_3'] || ''}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="Tecnico\nInstalador"
              placeholder="Técnico Instalador"
              value={formData['Tecnico\nInstalador'] || ''}
              onChange={handleInputChange}
            />
            <textarea
              name="NOTAS"
              placeholder="Notas"
              rows="3"
              value={formData['NOTAS'] || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
      );

    return null;
  };

  return (
    <div className="nuevo-documento-container">
      <h2>Crear nuevo {tipo}</h2>

      <form onSubmit={handleSubmit} className="custom-form">
        {renderFields()}

        <button type="submit" disabled={loading} className="full-width-btn">
          {loading ? (
            <>
              Creando...<span className="spinner" />
            </>
          ) : (
            `Crear ${tipo}`
          )}
        </button>

        <button
          type="button"
          className="bulk-upload-btn"
          onClick={() => {
            setBulkMsg('');
            setBulkFile(null);
            setShowBulkModal(true);
          }}
          disabled={!bulkEnabled}
        >
          Carga masiva
        </button>
      </form>

      {mensaje && !showModal && <p className="mensaje">{mensaje}</p>}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Creación exitosa</h2>
            <p>El {tipo.toLowerCase()} fue creado correctamente.</p>
            <button onClick={() => setShowModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Carga masiva: {tipo}</h2>

            <p>
              Formatos aceptados: .xlsx o .csv (UTF-8). Recomendado: .xlsx.
              Para Cliente/Movil hay encabezados con saltos de línea y el CSV puede causar errores.
            </p>

            <p>
              Campos obligatorios: {(requiredByTipo[tipo] || []).join(', ')}
            </p>

            <button onClick={descargarPlantilla}>Descargar plantilla</button>

            <div style={{ marginTop: 12 }}>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              />
            </div>

            {bulkMsg && <p style={{ marginTop: 10 }}>{bulkMsg}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowBulkModal(false)}>Cerrar</button>
              <button onClick={subirCargaMasiva} disabled={bulkLoading}>
                {bulkLoading ? 'Subiendo...' : 'Subir archivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevoDocumento;