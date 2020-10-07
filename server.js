const path      = require('path');
const express   = require('express');
const webSocket = require('socket.io');
const dotenv    = require('dotenv');
const { Sequelize, Op, Model, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
    define: {
        freezeTableName: true
    },
    database: 'appointment',
    username: 'root',
    password: null,
    dialect: 'sqlite',
    host    : "127.0.0.1",
    storage: './database.sqlite'
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully. -a sequelize-');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });



class Citas extends Model {} // aggd //de sequelize

Citas.init({
    // Model attributes are defined here
    mascota: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cliente: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    telefono:{
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha:{
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora:{
        type: DataTypes.STRING,
        allowNull:false
    },
    sintomas:{
        type: DataTypes.STRING,
        allowNull: false
    }

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Citas' // We need to choose the model name
});

// the defined model is the class itself
console.log(Citas === sequelize.models.Citas); // true
Citas.sync();

dotenv.config();
const app = express();

app.set('port', process.env.PORT);
app.use(express.static(path.join(__dirname, 'public')));

const server_old = app.listen(process.env.PORT, function () {
    console.log(`RUNNING ON ${process.env.PORT}. http://localhost:${process.env.PORT}/`);
});
const io         = webSocket(server_old);

io.on('connection', (socket) => {
    console.log('new connection', socket.id);

    socket.on('info:DB', async (data) => {
        //Justo en este momento debes hacer algo en la base de datos real
        const citas = await Citas.create({
            mascota: data.mascota,
            cliente: data.cliente,
            telefono: data.telefono,
            fecha: data.fecha,
            hora: data.hora,
            sintomas: data.sintomas
        });
          // let's assume the default of isAdmin is false
          console.log(citas.cliente); // 'alice123'
          console.log(citas.id); // false  

        io.sockets.emit('info:DB_Server', data);
        console.log('estoy por aca', data);
    });
    socket.on('info:DB_delete', (data) => {
        //Justo en este momento debes hacer algo en la base de datos real
        io.sockets.emit('info:DB_delete_Server', data);
    });
});

