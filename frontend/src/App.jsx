import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Buscador from './pages/Buscador';
import NuevoDocumento from './pages/NuevoDocumento';
import Header from './components/Header';
import Landing from './pages/Landing';
import { UserProvider } from './context/UserContext';
import HistorialCambios from './pages/HistorialCambios';
import AdminUsuarios from './components/AdminUsuarios';
import RequireAdmin from './components/RequireAdmin';
import EliminarDocumento from './components/EliminarDocumento';
import ModuloSelector from './pages/ModuloSelector';
import Inventario from './pages/Inventario';
import Tickets from './pages/Tickets';
import RequireActualModule from './components/RequireActualModule';
import './App.css';

const App = () => {
  return (
    <UserProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="page-container">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/admin-usuarios"
                element={
                  <RequireAdmin>
                    <AdminUsuarios />
                  </RequireAdmin>
                }
              />

              <Route path="/tickets" element={<Tickets />} />
              <Route path="/modulos" element={<ModuloSelector />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/buscador" element={<Buscador />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/historial-cambios" element={<HistorialCambios />} />

              {/* CREAR (solo módulo ACTUAL) */}
              <Route
                path="/nuevo-cliente"
                element={
                  <RequireActualModule>
                    <NuevoDocumento tipo="Cliente" />
                  </RequireActualModule>
                }
              />
              <Route
                path="/nuevo-movil"
                element={
                  <RequireActualModule>
                    <NuevoDocumento tipo="Movil" />
                  </RequireActualModule>
                }
              />
              <Route
                path="/nuevo-equipo"
                element={
                  <RequireActualModule>
                    <NuevoDocumento tipo="EquipoAVL" />
                  </RequireActualModule>
                }
              />
              <Route
                path="/nueva-simcard"
                element={
                  <RequireActualModule>
                    <NuevoDocumento tipo="Simcard" />
                  </RequireActualModule>
                }
              />

              {/* ELIMINAR (admin + solo módulo ACTUAL) */}
              <Route
                path="/eliminar-documento"
                element={
                  <RequireActualModule>
                    <RequireAdmin>
                      <EliminarDocumento />
                    </RequireAdmin>
                  </RequireActualModule>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
};

export default App;