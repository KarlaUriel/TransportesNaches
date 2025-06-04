document.addEventListener("DOMContentLoaded", function () {
    // Elementos del DOM
    const tipoClienteRadios = document.querySelectorAll('input[name="tipoCliente"]');
    const apellidosContainer = document.querySelector('.apellidos-container');
    const btnNuevoCliente = document.getElementById("btnNuevoCliente");
    const btnRecargar = document.getElementById("btnRecargar");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelar");
    const formCliente = document.getElementById("formCliente");
    const tblClientes = document.getElementById("tblClientes");
    const txtBuscar = document.getElementById("txtBuscar");
    const subclientesContainer = document.getElementById("subclientesContainer");
    const subclientesList = document.getElementById("subclientesList");
    const btnAgregarSubcliente = document.getElementById("btnAgregarSubcliente");

    let clientes = [];


    const token = localStorage.getItem("token");
    if (!token) {
        Swal.fire({
            title: 'Error',
            text: 'No se encontró un token de autenticación.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    // Event listeners
    btnNuevoCliente.addEventListener('click', limpiarMostrarFormulario);
    btnRecargar.addEventListener('click', recargarClientes);
    btnCancelar.addEventListener('click', () => setDetalleVisible(false));
    txtBuscar.addEventListener('input', buscarClientes);
    formCliente.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarCliente();
    });
    btnAgregarSubcliente.addEventListener('click', agregarSubclienteInput);

    // Manejo dinámico del tipo de cliente
    tipoClienteRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            apellidosContainer.style.display = this.value === 'moral' ? 'none' : 'grid';
            if (this.value === 'moral') {
                document.getElementById("apellidoPaterno").value = '';
                document.getElementById("apellidoMaterno").value = '';
            }
        });
    });

    // Inicialización
    inicializar();

    function inicializar() {
        recargarClientes();
        setDetalleVisible(false);
        const defaultRadio = document.querySelector('input[name="tipoCliente"][value="fisica"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
        }
        apellidosContainer.style.display = 'grid';
    }

    async function recargarClientes() {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/cliente/getAll`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!data || !Array.isArray(data)) {
                throw new Error("La respuesta no es un array válido o está vacía");
            }
            clientes = data.filter(cliente => cliente.activoCliente === 1);
            mostrarClientes();
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            mostrarError('Error', 'No se pudieron cargar los clientes: ' + error.message);
        }
    }

    function mostrarClientes() {
        if (!Array.isArray(clientes)) {
            console.error("Los datos recibidos no son un array:", clientes);
            return;
        }

        let contenido = '';
        clientes.forEach(cliente => {
            const persona = cliente.persona || cliente.Persona || {};
            const tipoMostrar = cliente.tipoCliente === 'M' ? 'Moral' : cliente.tipoCliente === 'F' ? 'Física' : 'Desconocido';
            const nombreCompleto = [
                persona.nombre || '',
                persona.apellidoPaterno || '',
                persona.apellidoMaterno || ''
            ].filter(Boolean).join(' ').trim() || 'Sin Nombre';
            const telefono = persona.telefono || 'Sin Teléfono';
            const correo = persona.correo || 'Sin Correo';

            contenido += `
                <div class="client-card bg-white rounded-lg shadow-md p-4 flex flex-col gap-2">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-gray-500 text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">${nombreCompleto}</h3>
                            <p class="text-sm text-gray-600 capitalize">${tipoMostrar}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                        <i class="fas fa-phone text-orange-600"></i>
                        <span>${telefono}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                        <i class="fas fa-envelope text-orange-600"></i>
                        <span>${correo}</span>
                    </div>
                    <div class="flex justify-between mt-2">
                        <button onclick="mostrarSubclientes(${cliente.idCliente})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-users"></i> Ver Subclientes
                        </button>
                        <div>
                            <button onclick="cargarDetalleCliente(${cliente.idCliente})" class="text-blue-500 hover:text-blue-700 mr-2">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarCliente(${cliente.idCliente})" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        tblClientes.innerHTML = contenido;
        buscarClientes(); // Apply search filter after rendering
    }

    function buscarClientes() {
        const termino = txtBuscar.value.toLowerCase().trim();
        const cards = tblClientes.querySelectorAll(".client-card");
        cards.forEach(card => {
            const nombre = card.querySelector("h3").textContent.toLowerCase().trim();
            card.style.display = nombre.includes(termino) ? "" : "none";
        });
    }

    async function cargarDetalleCliente(idCliente) {
        const cliente = clientes.find(c => c.idCliente == idCliente);
        if (!cliente) {
            mostrarError('Error', 'No se encontró el cliente');
            return;
        }

        const tipoCliente = cliente.tipoCliente === 'M' ? 'moral' : 'fisica';
        const radio = document.querySelector(`input[name="tipoCliente"][value="${tipoCliente}"]`);
        if (radio) {
            radio.checked = true;
        }

        tipoClienteRadios.forEach(radio => radio.disabled = true);

        const persona = cliente.persona || cliente.Persona || {};
        apellidosContainer.style.display = tipoCliente === 'moral' ? 'none' : 'grid';

        document.getElementById("idCliente").value = cliente.idCliente;
        document.getElementById("idPersona").value = persona.idPersona || '';
        document.getElementById("nombre").value = persona.nombre || '';
        document.getElementById("apellidoPaterno").value = persona.apellidoPaterno || '';
        document.getElementById("apellidoMaterno").value = persona.apellidoMaterno || '';
        document.getElementById("telefono").value = persona.telefono || '';
        document.getElementById("correo").value = persona.correo || '';
        document.getElementById("calificaciones").value = cliente.calificaciones || '';
        document.getElementById("factura").checked = cliente.factura === 1;

        // Cargar subclientes existentes
        cargarSubclientes(cliente.idCliente);

        setDetalleVisible(true);
    }

    async function cargarSubclientes(idCliente) {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/cliente/getSubclients/${idCliente}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`}
            });
            const data = await response.json();
            subclientesList.innerHTML = '';
            if (Array.isArray(data)) {
                data.forEach(subcliente => agregarSubclienteInput(subcliente.nombre, subcliente.ubicacion, subcliente.idSubcliente));
            }
        } catch (error) {
            console.error("Error al cargar subclientes:", error);
            subclientesList.innerHTML = ''; // Limpiar y permitir agregar nuevos
        }
    }

    function agregarSubclienteInput(nombre = '', ubicacion = '', id = null) {
        const div = document.createElement('div');
        div.className = 'flex flex-col md:flex-row gap-4 mb-2 subcliente-entry';
        div.innerHTML = `
            <div class="client-card bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 w-full">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-gray-500 text-xl"></i>
                    </div>
                    <div>
                        <input type="text" class="w-full p-2 border border-orange-300 rounded bg-white text-gray-800 text-sm subcliente-nombre font-bold" placeholder="Nombre del subcliente" value="${nombre || ''}" data-id="${id || ''}">
                    </div>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <i class="fas fa-map-marker-alt text-orange-600"></i>
                    <input type="text" class="w-full p-2 border border-orange-300 rounded bg-white text-gray-800 text-sm subcliente-ubicacion" placeholder="Ubicación (Google Maps)" value="${ubicacion || ''}">
                </div>
                <div class="flex justify-end mt-2">
                    <button type="button" class="bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700 transition remove-subcliente">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        subclientesList.appendChild(div);

        div.querySelector('.remove-subcliente').addEventListener('click', async () => {
            const idSubcliente = div.querySelector('.subcliente-nombre').dataset.id;
            if (idSubcliente) {
                const confirmacion = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: "Este subcliente será desactivado. ¿Deseas continuar?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#f97316',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Sí, desactivar'
                });

                if (confirmacion.isConfirmed) {
                    try {
                        const response = await fetch(`https://transportesnaches.com.mx/api/cliente/deleteSubclient/${idSubcliente}`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`}
                        });
                        const data = await response.json();
                        if (!response.ok || data.error) {
                            throw new Error(data.error || 'Error al desactivar el subcliente');
                        }
                        subclientesList.removeChild(div);
                        mostrarExito('Éxito', 'Subcliente desactivado correctamente');
                    } catch (error) {
                        console.error('Error al eliminar subcliente:', error);
                        mostrarError('Error', 'No se pudo desactivar el subcliente: ' + error.message);
                    }
                }
            } else {
                subclientesList.removeChild(div);
            }
        });
    }

    async function mostrarSubclientes(idCliente) {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/cliente/getSubclients/${idCliente}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`}
            });
            const subclientes = await response.json();

            if (!subclientes || subclientes.length === 0) {
                Swal.fire({
                    title: 'Sin Subclientes',
                    text: 'Este cliente no tiene subclientes registrados.',
                    icon: 'info',
                    confirmButtonText: 'Aceptar'
                });
                return;
            }

            let contenido = `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            `;
            subclientes.forEach(sub => {
                const isValidUrl = validarURLGoogleMaps(sub.ubicacion);
                contenido += `
                    <div class="client-card bg-white rounded-lg shadow-md p-4 flex flex-col gap-2">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-gray-500 text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-800">${sub.nombre || 'Sin Nombre'}</h3>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <i class="fas fa-map-marker-alt text-orange-600"></i>
                            <span>${isValidUrl
                        ? `<a href="${sub.ubicacion}" target="_blank" class="text-blue-500 hover:underline">Ver en Google Maps</a>`
                        : sub.ubicacion || 'Sin Ubicación'}</span>
                        </div>
                        <div class="flex justify-end mt-2">
                            <button onclick="cargarSubclienteParaEdicion(${sub.idSubcliente}, '${sub.nombre}', '${sub.ubicacion}')" 
                                    class="text-blue-500 hover:text-blue-700">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>
                `;
            });
            contenido += '</div>';

            Swal.fire({
                title: 'Subclientes',
                html: contenido,
                icon: '',
                width: '',
                confirmButtonText: 'Cerrar',
                customClass: {
                    popup: 'swal-wide',
                    htmlContainer: 'swal-html-container'
                }
            });
        } catch (error) {
            console.error("Error al cargar subclientes:", error);
            mostrarError('Error', 'No se pudieron cargar los subclientes: ' + error.message);
        }
    }

    async function guardarCliente() {
        const tipoCliente = document.querySelector('input[name="tipoCliente"]:checked')?.value;
        if (!tipoCliente) {
            mostrarError('Error', 'Debes seleccionar un tipo de cliente');
            return;
        }

        const tipoClienteValor = tipoCliente === 'fisica' ? 'F' : 'M';
        const nombre = document.getElementById("nombre").value.trim();

        if (!nombre) {
            mostrarError('Error', 'El nombre o razón social es obligatorio');
            return;
        }

        if (tipoCliente === 'fisica') {
            const apellidoPaterno = document.getElementById("apellidoPaterno").value.trim();
            if (!apellidoPaterno) {
                mostrarError('Error', 'El apellido paterno es obligatorio para personas físicas');
                return;
            }
        }

        const clienteData = {
            idCliente: parseInt(document.getElementById("idCliente").value) || 0,
            tipoCliente: tipoClienteValor,
            persona: {
                idPersona: parseInt(document.getElementById("idPersona").value) || 0,
                nombre: nombre,
                apellidoPaterno: tipoCliente === 'fisica' ? document.getElementById("apellidoPaterno").value.trim() : null,
                apellidoMaterno: tipoCliente === 'fisica' ? document.getElementById("apellidoMaterno").value.trim() : null,
                telefono: document.getElementById("telefono").value.trim(),
                correo: document.getElementById("correo").value.trim() || null
            },
            calificaciones: document.getElementById("calificaciones").value.trim() || null,
            factura: document.getElementById("factura").checked ? 1 : 0,
            activoCliente: 1
        };

        const subclientes = Array.from(subclientesList.querySelectorAll('.subcliente-entry')).map(div => {
            const nombreInput = div.querySelector('.subcliente-nombre');
            const ubicacionInput = div.querySelector('.subcliente-ubicacion');
            return {
                idSubcliente: nombreInput.dataset.id ? parseInt(nombreInput.dataset.id) : null,
                nombre: nombreInput.value.trim(),
                ubicacion: ubicacionInput.value.trim()
            };
        }).filter(sub => sub.nombre && sub.ubicacion);

        try {
            const response = await fetch('https://transportesnaches.com.mx/api/cliente/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(clienteData)
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || `Error en la petición: ${response.statusText}`);
            }

            if (subclientes.length > 0) {
                const subclientesResponse = await fetch(`https://transportesnaches.com.mx/api/cliente/saveSubclients/${data.idCliente || clienteData.idCliente}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(subclientes)
                });
                const subclientesData = await subclientesResponse.json();
                if (!subclientesResponse.ok || subclientesData.error) {
                    throw new Error(subclientesData.error || 'Error al guardar los subclientes');
                }
            }

            mostrarExito('Éxito', data.message || 'Cliente guardado correctamente');
            recargarClientes();
            setDetalleVisible(false);
            tipoClienteRadios.forEach(radio => radio.disabled = false);
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            mostrarError('Error', error.message || 'No se pudo guardar el cliente');
        }
    }

    async function eliminarCliente(idCliente) {
        const confirmacion = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción desactivará al cliente. ¿Deseas continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar'
        });

        if (!confirmacion.isConfirmed)
            return;

        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/cliente/delete/${idCliente}`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            clientes = clientes.filter(cliente => cliente.idCliente !== idCliente);
            mostrarClientes();
            if (txtBuscar.value.trim()) {
                buscarClientes();
            }
            mostrarExito('Éxito', 'Cliente desactivado correctamente');
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
            mostrarError('Error', 'No se pudo desactivar el cliente: ' + error.message);
        }
    }

    async function limpiarMostrarFormulario() {
        const {value: tipoCliente} = await Swal.fire({
            title: 'Seleccione el tipo de cliente',
            input: 'radio',
            inputOptions: {
                'fisica': 'Persona Física',
                'moral': 'Persona Moral'
            },
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes seleccionar un tipo de cliente';
                }
            },
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Continuar'
        });

        if (tipoCliente) {
            limpiarFormulario();
            const radio = document.querySelector(`input[name="tipoCliente"][value="${tipoCliente}"]`);
            if (radio) {
                radio.checked = true;
            }
            apellidosContainer.style.display = tipoCliente === 'moral' ? 'none' : 'grid';
            tipoClienteRadios.forEach(radio => radio.disabled = false);
            setDetalleVisible(true);
        }
    }

    function limpiarFormulario() {
        document.getElementById("idCliente").value = '';
        document.getElementById("idPersona").value = '';
        document.getElementById("nombre").value = '';
        document.getElementById("apellidoPaterno").value = '';
        document.getElementById("apellidoMaterno").value = '';
        document.getElementById("telefono").value = '';
        document.getElementById("correo").value = '';
        document.getElementById("calificaciones").value = '';
        document.getElementById("factura").checked = false;
        subclientesList.innerHTML = '';
        const defaultRadio = document.querySelector('input[name="tipoCliente"][value="fisica"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
        }
        apellidosContainer.style.display = 'grid';
    }

    function setDetalleVisible(visible) {
        if (visible) {
            formCliente.classList.remove("hidden");
            tblClientes.classList.add("hidden");
        } else {
            formCliente.classList.add("hidden");
            tblClientes.classList.remove("hidden");
            limpiarFormulario();
            tipoClienteRadios.forEach(radio => radio.disabled = false);
        }
    }

    function mostrarError(titulo, mensaje) {
        Swal.fire({
            title: titulo,
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }

    function mostrarExito(titulo, mensaje) {
        Swal.fire({
            title: titulo,
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });
    }

    async function reactivarCliente(idCliente) {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/cliente/reactivar/${idCliente}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error en la petición: ' + response.statusText);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            mostrarExito('Éxito', 'Cliente reactivado correctamente');
            recargarClientes();
        } catch (error) {
            console.error('Error al reactivar cliente:', error);
            mostrarError('Error', 'No se pudo reactivar el cliente: ' + error.message);
        }
    }

    function validarURLGoogleMaps(url) {
        const regex = /^https:\/\/(www\.)?google\.com\/maps\//;
        return regex.test(url);
    }

    async function cargarSubclienteParaEdicion(idSubcliente, nombre, ubicacion) {
        // Cargar el subcliente en el formulario para edición
        const clienteId = document.getElementById("idCliente").value;
        if (clienteId) {
            await cargarDetalleCliente(clienteId);
            const existingEntry = Array.from(subclientesList.querySelectorAll('.subcliente-entry')).find(
                    entry => entry.querySelector('.subcliente-nombre').dataset.id == idSubcliente
            );
            if (!existingEntry) {
                agregarSubclienteInput(nombre, ubicacion, idSubcliente);
            }
            setDetalleVisible(true);
        }
    }

    window.cargarDetalleCliente = cargarDetalleCliente;
    window.eliminarCliente = eliminarCliente;
    window.reactivarCliente = reactivarCliente;
    window.mostrarSubclientes = mostrarSubclientes;
    window.cargarSubclienteParaEdicion = cargarSubclienteParaEdicion;

    // Función para toggle del menú de gestión
    window.toggleGestionMenu = function () {
        const menu = document.getElementById('gestionSubmenu');
        menu.classList.toggle('hidden');
    };

    // Manejo de roles de usuario
    const userRole = 'Administrador';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = userRole === 'Administrador' ? '' : 'none';
    });

    // Toggle sidebar para dispositivos móviles
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const menuIcon = document.getElementById('menu-icon');
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
        if (sidebar.classList.contains('-translate-x-full')) {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        } else {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-times');
        }
    };
});