import React from 'react';
import PropTypes from 'prop-types'; // Importa PropTypes
import '../styles/DetailView.css';

const DetailView = ({ data, onClose }) => {
    if (!data) return null;

    const renderDetails = () => {
        if (data.Patente) {
            return (
                <>
                    <h3>Móvil</h3>
                    <p><strong>Patente:</strong> {data.Patente}</p>
                    <p><strong>Cliente:</strong> {data.Cliente}</p>
                    <p><strong>Marca:</strong> {data.Marca}</p>
                    <p><strong>Tipo:</strong> {data.Tipo}</p>
                    <p><strong>Chofer:</strong> {data.Chofer || 'No especificado'}</p>
                    <p><strong>Notas:</strong> {data.NOTAS || 'Sin notas'}</p>
                    <p><strong>Estado:</strong> {data['CONDICION \nMOVIL']}</p>
                    <p><strong>Equipo Principal:</strong> {JSON.stringify(data['Equipo Princ'] || 'No especificado')}</p>
                </>
            );
        } else if (data.Cliente) {
            return (
                <>
                    <h3>Cliente</h3>
                    <p><strong>Nombre:</strong> {data.Cliente}</p>
                    <p><strong>RUT:</strong> {data.RUT}</p>
                    <p><strong>Razón Social:</strong> {data['Razon Social']}</p>
                    <p><strong>Contacto:</strong> {data.CONTACTO_1 || 'No especificado'}</p>
                    <p><strong>Dirección:</strong> {data.Domicilio || 'No especificada'}</p>
                </>
            );
        } else if (data.imei) {
            return (
                <>
                    <h3>Equipo AVL</h3>
                    <p><strong>IMEI:</strong> {data.imei}</p>
                    <p><strong>Serial:</strong> {data.serial}</p>
                    <p><strong>Modelo:</strong> {data.model}</p>
                    <p><strong>Firmware:</strong> {data.current_firmware}</p>
                </>
            );
        }
        return <p>No hay detalles disponibles.</p>;
    };

    return (
        <div className="detail-view-overlay">
            <div className="detail-view-container">
                <button className="close-button" onClick={onClose}>X</button>
                <h2>Detalles</h2>
                <div className="detail-section">
                    {renderDetails()}
                </div>
            </div>
        </div>
    );
};

DetailView.propTypes = {
    data: PropTypes.shape({
        Cliente: PropTypes.string,
        Patente: PropTypes.string,
        imei: PropTypes.string,
        RUT: PropTypes.string,
        'Razon Social': PropTypes.string,
        CONTACTO_1: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        Domicilio: PropTypes.string,
        Marca: PropTypes.string,
        Tipo: PropTypes.string,
        Chofer: PropTypes.string,
        NOTAS: PropTypes.string,
        serial: PropTypes.string,
        model: PropTypes.string,
        current_firmware: PropTypes.string,
    }),
    onClose: PropTypes.func.isRequired,
};

export default DetailView;