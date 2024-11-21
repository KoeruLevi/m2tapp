import React, { useState } from 'react';
import { Truck, Users, Smartphone, CreditCard } from 'lucide-react';

const mockClientes = [
  { id: 1, razonSocial: 'FERAM', rut: '76.543.210-9', contacto: 'Juan Pérez' },
  { id: 2, razonSocial: 'TAS CARGO', rut: '85.123.456-7', contacto: 'María González' }
];

const mockMoviles = [
  { 
    id: 1, 
    patente: 'ABCD-12', 
    tipo: 'Camión', 
    marca: 'Mercedes Benz', 
    cliente: 'FERAM',
    condicion: 'Activo'
  },
  { 
    id: 2, 
    patente: 'WXYZ-34', 
    tipo: 'Camioneta', 
    marca: 'Toyota', 
    cliente: 'TAS CARGO',
    condicion: 'Suspendido'
  }
];

const mockEquiposAVL = [
  {
    id: 10128,
    imei: '350317170937464',
    serie: '1127641342',
    firmware: '03.27.13.Rev.03',
    fabricante: 'Teltonika',
    modelo: 'FMC920',
    estado: 'activo'
  }
];

const mockSimcards = [
  {
    iccid: '89560100001241024797',
    numero: '56940279664',
    operador: 'Dataglobal',
    estado: 'activa',
    cuotaDatos: '7MB'
  }
];

const GPSTrackerFrontend = () => {
  const [activeTab, setActiveTab] = useState('moviles');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderTabs = () => {
    const tabs = [
      { key: 'moviles', label: 'Móviles', icon: <Truck /> },
      { key: 'clientes', label: 'Clientes', icon: <Users /> },
      { key: 'equipos', label: 'Equipos AVL', icon: <Smartphone /> },
      { key: 'simcards', label: 'Simcards', icon: <CreditCard /> }
    ];

    return (
      <div className="flex border-b mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center p-3 ${
              activeTab === tab.key 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    let data, columns;
    switch(activeTab) {
      case 'moviles':
        data = mockMoviles;
        columns = ['Patente', 'Tipo', 'Marca', 'Cliente', 'Condición'];
        break;
      case 'clientes':
        data = mockClientes;
        columns = ['Razón Social', 'RUT', 'Contacto'];
        break;
      case 'equipos':
        data = mockEquiposAVL;
        columns = ['ID', 'IMEI', 'Serie', 'Fabricante', 'Modelo', 'Estado'];
        break;
      case 'simcards':
        data = mockSimcards;
        columns = ['ICCID', 'Número', 'Operador', 'Estado', 'Cuota Datos'];
        break;
    }

    return (
      <div className="bg-white shadow-md rounded">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-xl font-semibold">{activeTab.toUpperCase()}</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            + Nuevo
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              {columns.map(col => (
                <th key={col} className="p-3 text-left">{col}</th>
              ))}
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                {Object.values(item).slice(0, columns.length).map((value, idx) => (
                  <td key={idx} className="p-3">{value}</td>
                ))}
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedItem(item);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Editar
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            {selectedItem ? `Editar ${activeTab}` : `Nuevo ${activeTab}`}
          </h2>
          
          {/* Campos dinámicos según la pestaña activa */}
          <div className="space-y-4">
            {activeTab === 'moviles' && (
              <>
                <input 
                  placeholder="Patente" 
                  className="w-full p-2 border rounded"
                  defaultValue={selectedItem?.patente}
                />
                <select className="w-full p-2 border rounded">
                  <option>Camión</option>
                  <option>Camioneta</option>
                  <option>Auto</option>
                </select>
              </>
            )}
            
            {activeTab === 'clientes' && (
              <>
                <input 
                  placeholder="Razón Social" 
                  className="w-full p-2 border rounded"
                  defaultValue={selectedItem?.razonSocial}
                />
                <input 
                  placeholder="RUT" 
                  className="w-full p-2 border rounded"
                  defaultValue={selectedItem?.rut}
                />
              </>
            )}

            {/* Puedes agregar más lógica para otras pestañas */}
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Gestión de Equipos GPS</h1>
      {renderTabs()}
      {renderTable()}
      {renderModal()}
    </div>
  );
};

export default GPSTrackerFrontend;