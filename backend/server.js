require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/logRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: ['https://m2tapp.vercel.app'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  };
  
  app.use(cors(corsOptions));


connectDB()
    .then(() => console.log('Base de datos conectada'))
    .catch(console.error);


app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('El backend está funcionando correctamente');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));