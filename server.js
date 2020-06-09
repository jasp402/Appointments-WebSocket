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
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });



class User extends Model {}

User.init({
    // Model attributes are defined here
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING
        // allowNull defaults to true
    }
}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'User' // We need to choose the model name
});

// the defined model is the class itself
console.log(User === sequelize.models.User); // true
User.sync();




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

    socket.on('info:DB', (data) => {
        //Justo en este momento debes hacer algo en la base de datos real
        io.sockets.emit('info:DB_Server', data);
    });
    socket.on('info:DB_delete', (data) => {
        //Justo en este momento debes hacer algo en la base de datos real
        io.sockets.emit('info:DB_delete_Server', data);
    });
});

