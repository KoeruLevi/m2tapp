import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Buscador from './pages/Buscador';
import NuevoDocumento from './pages/NuevoDocumento';
import Header from './components/Header';
import './App.css';

const App = () => {
    return (
        <Router>
            <div className="app-container">
                <Header /> {/* Se mantiene el Header en la parte superior */}
                <main className="page-container">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/buscador" element={<Buscador />} />
                        <Route path="/nuevo-cliente" element={<NuevoDocumento tipo="Cliente" />} />
                        <Route path="/nuevo-movil" element={<NuevoDocumento tipo="Movil" />} />
                        <Route path="/nuevo-equipo" element={<NuevoDocumento tipo="EquipoAVL" />} />
                        <Route path="/nueva-simcard" element={<NuevoDocumento tipo="Simcard" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;