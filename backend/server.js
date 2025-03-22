require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/logRoutes'); // Importa las rutas de autenticación

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: ['https://m2tapp.vercel.app'], // 🟢 tu frontend en Vercel
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  };
  
  app.use(cors(corsOptions));

// Conectar a la base de datos
connectDB()
    .then(() => console.log('Base de datos conectada'))
    .catch(console.error);

// Rutas
app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes); // Registra las rutas de autenticación

app.get('/', (req, res) => {
    res.send('El backend está funcionando correctamente');
});

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));