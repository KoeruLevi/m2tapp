import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#eaf6ff'
    }}>
      <h1 style={{ marginBottom: 24 }}>Plataforma de Soporte de M2 Technic SPA</h1>
      <button
        style={{
          padding: '12px 36px',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 18,
          cursor: 'pointer'
        }}
        onClick={() => navigate('/login')}
      >
        Iniciar sesión
      </button>
    </div>
  );
};

export default Landing;