require('dotenv').config();
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { connection, createConnection } from 'mongoose';
import connectDB from './config/database';   // <-- conecta AUTH (usuarios) como ya tenías
import dataRouter from './routes/dataRoutes';     // REUSAMOS el mismo router (ver 1.4)
import authRoutes from './routes/logRoutes';

const app = express();

const corsOptions = {
  origin: ['https://m2tapp.vercel.app'],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(json());
app.use(urlencoded({ extended: true }));

// 1) Conexión default => MONGO_URI (Histórico + Usuario)
await connectDB(); // deja tu database.js tal como está
const connHistorico = connection; // reutilizamos la conexión default

// 2) Conexión adicional => MONGO_URI_ACTUAL (módulo Actual)
const connActual = createConnection(process.env.MONGO_URI_ACTUAL, {
  useNewUrlParser: true, useUnifiedTopology: true
});
connActual.on('connected', () => console.log('Mongo ACTUAL conectado'));

// 3) Modelos por conexión
import build from './services/buildModels';
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