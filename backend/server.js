require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/database');      // conecta MONGO_URI (Histórico + Usuario)
const buildModels = require('./services/buildModels'); // fabrica modelos por conexión
const dataRouter = require('./routes/dataRoutes');     // usa req.models
const authRoutes = require('./routes/logRoutes');

const app = express();

const corsOptions = {
  origin: ['https://m2tapp.vercel.app'],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoOpts = { useNewUrlParser: true, useUnifiedTopology: true };

// 1) Conexión default: MONGO_URI (Histórico + Usuario)
connectDB()
  .then(() => {
    console.log('Histórico/Auth conectado');
    const connHistorico = mongoose.connection;

    // 2) Conexión adicional: MONGO_URI_ACTUAL (módulo Actual)
    const connActual = mongoose.createConnection(process.env.MONGO_URI_ACTUAL, mongoOpts);

    // Mongoose 6/7/8: asPromise() resuelve cuando la conexión está lista
    return connActual.asPromise().then(() => {
      console.log('Actual conectado');

      // 3) Modelos por conexión
      const modelsHistorico = buildModels(connHistorico);
      const modelsActual    = buildModels(connActual);

      // 4) Middleware para inyectar modelos por request
      const bind = (models, peerModels) => (req, _res, next) => {
        req.models = models;       // DB del módulo actual de la ruta
        req.peerModels = peerModels; // DB del “otro” módulo (para mover docs)
      next();
      };
      app.use('/api/historico', bind(modelsHistorico, modelsActual), dataRouter);
      app.use('/api/actual',    bind(modelsActual,    modelsHistorico), dataRouter);

      // Auth (siempre en la conexión histórica/MONGO_URI)
      app.use('/api/auth', authRoutes);

      app.get('/', (_req, res) => res.send('Backend OK (multi-módulo, CJS)'));

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`Servidor corriendo en ${PORT}`));
    });
  })
  .catch((err) => {
    console.error('Fallo al conectar Mongo:', err);
    process.exit(1);
  });