import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Buscador from './pages/Buscador';
import './App.css'; // Asegúrate de importar los estilos globales

const App = () => {
    return (
        <Router>
            <div className="page-container">
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/buscador" element={<Buscador />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;