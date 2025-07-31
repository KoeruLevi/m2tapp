require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/logRoutes');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


connectDB()
    .then(() => console.log('Base de datos conectada'))
    .catch(console.error);

app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en el puerto ${PORT}`));
