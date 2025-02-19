const mongoose = require('mongoose');

// Conexión a la base de datos
mongoose.connect('mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/m2tapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const Simcard = require('./models/Simcard'); // Ajusta el path al modelo
const EquipoAVL = require('./models/EquipoAVL');
const Movil = require('./models/Movil');
const Cliente = require('./models/Cliente');

const convertToObjectId = async () => {
    try {
        // 1. Actualizar `equipoAVL_id` en Simcards
        const simcards = await Simcard.find();
        for (const simcard of simcards) {
            if (simcard.equipoAVL_id && typeof simcard.equipoAVL_id === 'string') {
                simcard.equipoAVL_id = mongoose.Types.ObjectId(simcard.equipoAVL_id);
                await simcard.save();
                console.log(`Simcard actualizada: ${simcard._id}`);
            }
        }

        // 2. Actualizar `movil_id` en Equipos
        const equipos = await EquipoAVL.find();
        for (const equipo of equipos) {
            if (equipo.movil_id && typeof equipo.movil_id === 'string') {
                equipo.movil_id = mongoose.Types.ObjectId(equipo.movil_id);
                await equipo.save();
                console.log(`Equipo AVL actualizado: ${equipo._id}`);
            }

            if (equipo.simcard_id && typeof equipo.simcard_id === 'string') {
                equipo.simcard_id = mongoose.Types.ObjectId(equipo.simcard_id);
                await equipo.save();
                console.log(`Simcard vinculada a equipo: ${equipo._id}`);
            }
        }

        // 3. Actualizar `cliente_id` en Moviles
        const moviles = await Movil.find();
        for (const movil of moviles) {
            if (movil.cliente_id && typeof movil.cliente_id === 'string') {
                movil.cliente_id = mongoose.Types.ObjectId(movil.cliente_id);
                await movil.save();
                console.log(`Movil actualizado: ${movil._id}`);
            }

            if (movil.equipoPrimario && typeof movil.equipoPrimario === 'string') {
                movil.equipoPrimario = mongoose.Types.ObjectId(movil.equipoPrimario);
            }

            if (movil.equipoSecundario && typeof movil.equipoSecundario === 'string') {
                movil.equipoSecundario = mongoose.Types.ObjectId(movil.equipoSecundario);
            }
            await movil.save();
        }

        // 4. Actualizar `moviles_ids` en Clientes
        const clientes = await Cliente.find();
        for (const cliente of clientes) {
            if (cliente.moviles_ids && Array.isArray(cliente.moviles_ids)) {
                cliente.moviles_ids = cliente.moviles_ids.map((id) =>
                    typeof id === 'string' ? mongoose.Types.ObjectId(id) : id
                );
                await cliente.save();
                console.log(`Cliente actualizado: ${cliente._id}`);
            }
        }

        console.log('Conversión completada.');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error durante la conversión:', error);
        mongoose.disconnect();
    }
};

convertToObjectId();