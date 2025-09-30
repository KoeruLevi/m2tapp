require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/database');   // <-- conecta AUTH (usuarios) como ya tenías
const buildModels = require('./services/buildModels'); // NUEVO (abajo)
const dataRouter = require('./routes/dataRoutes');     // REUSAMOS el mismo router (ver 1.4)
const authRoutes = require('./routes/logRoutes');

const app = express();

const corsOptions = {
  origin: ['https://m2tapp.vercel.app'],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1) Conexión default => MONGO_URI (Histórico + Usuario)
await connectDB(); // deja tu database.js tal como está
const connHistorico = mongoose.connection; // reutilizamos la conexión default

// 2) Conexión adicional => MONGO_URI_ACTUAL (módulo Actual)
const connActual = mongoose.createConnection(process.env.MONGO_URI_ACTUAL, {
  useNewUrlParser: true, useUnifiedTopology: true
});
connActual.on('connected', () => console.log('Mongo ACTUAL conectado'));

// 3) Modelos por conexión
const build = require('./services/buildModels');
const modelsHistorico = build(connHistorico);
const modelsActual    = build(connActual);

// 4) Inyección por prefijo
const bind = (models) => (req, _res, next) => { req.models = models; next(); };

app.use('/api/historico', bind(modelsHistorico), dataRouter);
app.use('/api/actual',    bind(modelsActual),    dataRouter);

// Auth (usuarios) siguen en la default (MONGO_URI)
app.use('/api/auth', authRoutes);

app.get('/', (_req,res)=>res.send('Backend OK multi-módulo'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en ${PORT}`));

module.exports = connectDB;