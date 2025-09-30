import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function ModuloSelector() {
  const navigate = useNavigate();

  const elegir = (mod) => {
    localStorage.setItem('modulo', mod);        // "actual" | "historico"
    navigate('/dashboard');                     // o a donde quieras entrar
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
      <Header />
      <h2>Elige un módulo</h2>
      <p>Selecciona en qué plataforma quieres trabajar.</p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
        <button onClick={() => elegir('historico')} style={{ padding: '12px 20px' }}>
          🕰️ Módulo Histórico
        </button>
        <button onClick={() => elegir('actual')} style={{ padding: '12px 20px' }}>
          ⚙️ Módulo Actual
        </button>
      </div>
    </div>
  );
}