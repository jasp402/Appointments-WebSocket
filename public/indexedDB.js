let DB;

// Websockets
const socket = io();

console.log(socket.id); // undefined

// Crear Variables
const form              = document.querySelector('form'),
      nombreMascota     = document.querySelector('#mascota'),
      nombreDueño       = document.querySelector('#cliente'),
      telefono          = document.querySelector('#telefono'),
      fecha             = document.querySelector('#fecha'),
      hora              = document.querySelector('#hora'),
      sintomas          = document.querySelector('#sintomas'),
      headingAdministra = document.querySelector('#administra'),
      citas             = document.querySelector('#citas');

// Esperar el DOM ready
document.addEventListener('DOMContentLoaded', () => {
    let crearDB = window.indexedDB.open('citas', 1);

    // Si la DB tiene un error
    crearDB.onerror   = () => {
        console.log('Hay un error');
    }
    // Si la DB esta lista
    crearDB.onsuccess = () => {
        DB = crearDB.result;

        // LLamar a la funcion para mostrar citas
        mostrarCitas();
    }

    crearDB.onupgradeneeded = (e) => {
        // el evento es la misma base de datos
        let db = e.target.result;

        // Definir el ObjectStorage este toma 2 parametros el nombre de la DB y las opciones
        // keyPath es el indice de la DB
        let objectStore = db.createObjectStore('citas', {
            keyPath      : 'key',
            autoIncrement: true
        });

        // Crear los indices de la base de datos - createIndex toma | 3 parametros el nombre el keyPath y opciones
        objectStore.createIndex('mascota', 'mascota', {unique: false});
        objectStore.createIndex('cliente', 'cliente', {unique: false});
        objectStore.createIndex('telefono', 'telefono', {unique: false});
        objectStore.createIndex('fecha', 'fecha', {unique: false});
        objectStore.createIndex('hora', 'hora', {unique: false});
        objectStore.createIndex('sintomas', 'sintomas', {unique: false});
    }


    socket.on('connect', () => {
        console.log(socket.id); // 'G5p5...'
    });
    socket.on('info:DB_load_Server', (data) => {
        console.log('socket.id', data);

        //instanciamos un objeto Store
        let objectStore = DB.transaction('citas').objectStore('citas');
        //llamamos una peticion
        objectStore.openCursor().onsuccess = (e) => {
            let cursor = e.target.result;
            if(cursor){
                console.log('cursor--->',cursor.value)
            }else{
                let transaction = DB.transaction(['citas'], 'readwrite');
                let Store       = transaction.objectStore('citas');
                let syncRequest = Store.add(data[0]);
                syncRequest.onsuccess = () => {
                    form.reset();
                };
                transaction.oncomplete = () => {
                    mostrarCitas();
                };
                transaction.onerror    = () => {
                    console.log('Hay un error!!');
                }
            }
        }


    });
    socket.on('info:DB_Server', (data) => {
        console.log('socket.id', socket.id);
        let transaction = DB.transaction(['citas'], 'readwrite');
        let Store       = transaction.objectStore('citas');
        let syncRequest = Store.add(data);
        syncRequest.onsuccess  = () => {
            form.reset();
        }
        transaction.oncomplete = () => {
            mostrarCitas();
        }
        transaction.onerror    = () => {
            console.log('Hay un error!!');
        }
    });
    socket.on('info:DB_delete_Server', (data) => {
        console.log('socket.on = info:DB_delete_Server:', data);
        onDeleteRecords(data);
    });


    // Cuando das click en el formulario
    form.addEventListener('submit', agregarDatos);

    function agregarDatos(e) {
        e.preventDefault();


        const nuevaCita = {
            mascota : nombreMascota.value,
            cliente : nombreDueño.value,
            telefono: telefono.value,
            fecha   : fecha.value,
            hora    : hora.value,
            sintomas: sintomas.value

        }
        // Emitir los datos de la cita
        socket.emit('info:DB', nuevaCita);
        /*
        // en IndexedDB se utilizan las transacciones
        let transaction = DB.transaction(['citas'], 'readwrite');
        let objectStore = transaction.objectStore('citas');
        //Sync effect with Socket
        let peticion = objectStore.add(nuevaCita);
        peticion.onsuccess     = () => {
            form.reset();
        }
        transaction.oncomplete = () => {
            mostrarCitas();
        }
        transaction.onerror    = () => {
            console.log('Hay un error!!');
        }
        */
    }

    let mostrarCitas = () => {
        // Limpiar las citas anteriores
        while (citas.firstChild) {
            citas.removeChild(citas.firstChild);
        }

        // creamos un objectStore
        let objectStore = DB.transaction('citas').objectStore('citas');

        // LLamamos a una peticion
        objectStore.openCursor().onsuccess = (e) => {
            // el cursor se va a ubicar en la cita indicada para acceder a los datos
            let cursor = e.target.result;

            if (cursor) {
                let citaHTML = document.createElement('li');
                citaHTML.setAttribute('id', 'card_' + cursor.value.key);
                citaHTML.setAttribute('data-cita-id', cursor.value.key);
                citaHTML.classList.add('list-group-item');

                citaHTML.innerHTML = `
                    <p class="font-weight-bold">Mascota: <span class="font-weight-normal">${cursor.value.key}</span></p>
                    <p class="font-weight-bold">Mascota: <span class="font-weight-normal">${cursor.value.mascota}</span></p>
                    <p class="font-weight-bold">Cliente: <span class="font-weight-normal">${cursor.value.cliente}</span></p>
                    <p class="font-weight-bold">Telefono: <span class="font-weight-normal">${cursor.value.telefono}</span></p>
                    <p class="font-weight-bold">Fecha: <span class="font-weight-normal">${cursor.value.fecha}</span></p>
                    <p class="font-weight-bold">Hora: <span class="font-weight-normal">${cursor.value.hora}</span></p>
                    <p class="font-weight-bold">Sintomas: <span class="font-weight-normal">${cursor.value.sintomas}</span></p>`;

                // Boton borra
                const botonBorrar = document.createElement('button');

                botonBorrar.classList.add('borrar', 'btn', 'btn-danger');
                botonBorrar.classList.add('borrar', 'btn', 'btn-danger');
                botonBorrar.innerHTML = '<span aria-hidden="true">x</span> Borrar';
                botonBorrar.onclick   = borrarCita;
                citaHTML.appendChild(botonBorrar);

                // append en el padre
                citas.appendChild(citaHTML);

                // Consultar los proximos registros
                cursor.continue();
            } else {
                if (!citas.firstChild) {
                    headingAdministra.textContent = 'Agrega citas para comenzar'
                    let listado                   = document.createElement('p');
                    listado.classList.add('text-center');
                    listado.textContent = 'No hay registros';
                    citas.appendChild(listado);
                } else {
                    headingAdministra.textContent = 'Administra tus citas';
                }
            }
        }
    };

    let onDeleteRecords = (arData) => {
        let transaction = DB.transaction(['citas'], 'readwrite');
        let objectStore = transaction.objectStore('citas');
        objectStore.delete(arData);

        let buttonClose = document.getElementById('card_'+arData);

        transaction.oncomplete = () => {
            buttonClose.parentNode.removeChild(buttonClose);

            if (!citas.firstChild) {
                headingAdministra.textContent = 'Agrega citas para comenzar'
                let listado                   = document.createElement('p');
                listado.classList.add('text-center');
                listado.textContent = 'No hay registros';
                citas.appendChild(listado);
            }
            else {
                headingAdministra.textContent = 'Administra tus citas';
            }
        }
    };

    let borrarCita = (e) => {
        console.log('entro en borrarCita()');
        citaID = Number(e.target.parentElement.getAttribute('data-cita-id'));
        socket.emit('info:DB_delete', citaID);
    }

    console.log('load  DOM');
    socket.emit('info:DB_load');

}); // DOM Ready
