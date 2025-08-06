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
                        <Route path="/admin-usuarios" element={
                            <RequireAdmin>
                                <AdminUsuarios />
                            </RequireAdmin>
                        } />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/buscador" element={<Buscador />} />
                        <Route path="/nuevo-cliente" element={<NuevoDocumento tipo="Cliente" />} />
                        <Route path="/nuevo-movil" element={<NuevoDocumento tipo="Movil" />} />
                        <Route path="/nuevo-equipo" element={<NuevoDocumento tipo="EquipoAVL" />} />
                        <Route path="/nueva-simcard" element={<NuevoDocumento tipo="Simcard" />} />
                        <Route path="/historial-cambios" element={<HistorialCambios />} />
                    </Routes>
                </main>
            </div>
        </Router>
        </UserProvider>
    );
};

export default App;