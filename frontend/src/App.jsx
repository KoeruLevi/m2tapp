import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import './App.css';

const RequireModuloActual = ({ children }) => {
  const modulo = (localStorage.getItem('modulo') || 'actual').toLowerCase();
  if (modulo === 'historico') return <Navigate to="/dashboard" replace />;
  return children;
};

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

              <Route
                path="/nuevo-cliente"
                element={
                  <RequireModuloActual>
                    <NuevoDocumento tipo="Cliente" />
                  </RequireModuloActual>
                }
              />
              <Route
                path="/nuevo-movil"
                element={
                  <RequireModuloActual>
                    <NuevoDocumento tipo="Movil" />
                  </RequireModuloActual>
                }
              />
              <Route
                path="/nuevo-equipo"
                element={
                  <RequireModuloActual>
                    <NuevoDocumento tipo="EquipoAVL" />
                  </RequireModuloActual>
                }
              />
              <Route
                path="/nueva-simcard"
                element={
                  <RequireModuloActual>
                    <NuevoDocumento tipo="Simcard" />
                  </RequireModuloActual>
                }
              />

              <Route
                path="/eliminar-documento"
                element={
                  <RequireAdmin>
                    <RequireModuloActual>
                      <EliminarDocumento />
                    </RequireModuloActual>
                  </RequireAdmin>
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