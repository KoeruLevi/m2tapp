import React, { useState } from 'react';
import axios from 'axios';
import '../styles/NuevoDocumento.css';

const NuevoDocumento = ({ tipo }) => {
    const [formData, setFormData] = useState({});
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje('');
        try {
            const endpoint = `https://m2t-backend.onrender.com/api/data/${tipo.toLowerCase()}`;
            const response = await axios.post(endpoint, formData);
            setMensaje(`✅ ${tipo} creado: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error('Error al crear documento:', error);
            setMensaje(
                error?.response?.data?.message || '❌ Error al crear el documento.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nuevo-documento-container">
            <h2>Crear nuevo {tipo}</h2>
            <form onSubmit={handleSubmit}>
                {tipo === 'Cliente' && (
                    <>
                        <input
                            type="text"
                            name="Cliente"
                            placeholder="Nombre del Cliente"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="CONDICION \nCLIENTE"
                            placeholder="Condición del Cliente"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="RUT"
                            placeholder="RUT"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="Razon Social"
                            placeholder="Razón Social"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="CONTACTO_1"
                            placeholder="Contacto"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="MAIL CONTACTO_1"
                            placeholder="Mail"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="Domicilio"
                            placeholder="Domicilio"
                            onChange={handleInputChange}
                        />
                    </>
                )}

                {tipo === 'Movil' && (
                <div className="form-grid">
                    <div className="form-column">
                        <input
                            type="text"
                            name="Patente"
                            placeholder="Patente"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="Cliente"
                            placeholder="Cliente asociado"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="CONDICION \nMOVIL"
                            placeholder="Condición del Móvil"
                            onChange={handleInputChange}
                        />
                        <label>
                            Suspendido:
                            <input
                                type="checkbox"
                                name="Suspendido"
                                onChange={(e) => setFormData({ ...formData, Suspendido: e.target.checked })}
                            />
                        </label>
                        <input
                            type="text"
                            name="Interno"
                            placeholder="Interno"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-column">
                        <label>
                            Activo en Trasat_1:
                            <input
                                type="checkbox"
                                name="ACTIVO EN \nTRASAT_1"
                                onChange={(e) => setFormData({ ...formData, 'ACTIVO EN \nTRASAT_1': e.target.checked })}
                            />
                        </label>
                        <label>
                            Activo en Akita:
                            <input
                                type="checkbox"
                                name="ACTIVO EN \nAKITA"
                                onChange={(e) => setFormData({ ...formData, 'ACTIVO EN \nAKITA': e.target.checked })}
                            />
                        </label>
                        <label>
                            Activo en Tgo:
                            <input
                                type="checkbox"
                                name="ACTIVO EN\nTgo"
                                onChange={(e) => setFormData({ ...formData, 'ACTIVO EN\nTgo': e.target.checked })}
                            />
                        </label>
                        <input
                            type="text"
                            name="Marca"
                            placeholder="Marca"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="Tipo"
                            placeholder="Tipo"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-column">
                        <input
                            type="text"
                            name="Chofer"
                            placeholder="Chofer"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="Equipo Princ"
                            placeholder="Equipo Principal"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="TECNOLOGIA \nEQUIPO"
                            placeholder="Tecnología del Equipo"
                            onChange={handleInputChange}
                        />
                        <input
                            type="date"
                            name="FECHA INSTALACION EQUIPO"
                            placeholder="Fecha de Instalación del Equipo"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-column">
                        <input
                            type="number"
                            name="Equipo Secundario_1"
                            placeholder="Equipo Secundario 1"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="Equipo Secundario_2"
                            placeholder="Equipo Secundario 2"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="Equipo Secundario_3"
                            placeholder="Equipo Secundario 3"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="Tecnico\nInstalador"
                            placeholder="Técnico Instalador"
                            onChange={handleInputChange}
                        />
                        <textarea
                            name="NOTAS"
                            placeholder="Notas"
                            rows="3"
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            )}

                {tipo === 'EquipoAVL' && (
                    <>
                        <input
                            type="text"
                            name="imei"
                            placeholder="IMEI"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="model"
                            placeholder="Modelo"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="number"
                            name="serial"
                            placeholder="Serial"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="current_firmware"
                            placeholder="Firmware"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="number"
                            name="ID"
                            placeholder="ID"
                            onChange={handleInputChange}
                            required
                        />
                    </>
                )}

                {tipo === 'Simcard' && (
                    <>
                        <input type="text" name="_id" placeholder="Identificador" onChange={handleInputChange} required />
                        <input type="text" name="ICCID" placeholder="ICCID" onChange={handleInputChange} required />
                        <input type="number" name="fono" placeholder="Fono" onChange={handleInputChange} required />
                        <input type="text" name="operador" placeholder="Operador" onChange={handleInputChange} required />
                        <input type="text" name="portador" placeholder="Portador" onChange={handleInputChange} />
                        <select name="estado" onChange={handleInputChange}>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Suspendido">Suspendido</option>
                        </select>
                        <input type="text" name="quota" placeholder="Quota" onChange={handleInputChange} />
                        <input type="number" name="ID" placeholder="ID del EquipoAVL" onChange={handleInputChange} required />
                    </>
                )}
                <button type="submit" disabled={loading}>
                {loading ? 'Creando...' : `Crear ${tipo}`}
                </button>
            </form>
            {mensaje && <p className="mensaje">{mensaje}</p>}
        </div>
    );
};

export default NuevoDocumento;