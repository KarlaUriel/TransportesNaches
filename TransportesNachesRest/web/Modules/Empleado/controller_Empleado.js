document.addEventListener("DOMContentLoaded", function () {
    // Elementos del DOM
    const btnNuevoOperador = document.getElementById("btnNuevoOperador");
    const btnRecargar = document.getElementById("btnRecargar");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelar");
    const formOperador = document.getElementById("formOperador");
    const tblOperador = document.getElementById("tblOperador");
    const txtBuscar = document.getElementById("txtBuscar");

    let operadores = [];

    // Eventos
    btnNuevoOperador.addEventListener('click', limpiarMostrarFormulario);
    btnRecargar.addEventListener('click', recargarOperadores);
    btnCancelar.addEventListener('click', () => setDetalleVisible(false));
    txtBuscar.addEventListener('input', buscarOperadores);
    formOperador.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarOperador();
    });


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

    // Inicialización
    inicializar();

    function inicializar() {
        recargarOperadores();
        setDetalleVisible(false);
    }

    async function recargarOperadores() {
        try {
            const response = await fetch('https://transportesnaches.com.mx/api/operador/getAll', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`

                }
            });
            const data = await response.json();
            if (!data) {
                throw new Error("La respuesta está vacía");
            }
            operadores = data;
            mostrarOperadores();
        } catch (error) {
            console.error("Error al cargar operadores:", error);
            mostrarError('Error', 'No se pudieron cargar los operadores: ' + error.message);
        }
    }

    function mostrarOperadores() {
        if (!Array.isArray(operadores)) {
            console.error("Los datos recibidos no son un array:", operadores);
            return;
        }
        let contenido = '';
        operadores.forEach(operador => {
            const persona = operador.Persona || {};
            const nombreCompleto = [
                persona.nombre || '',
                persona.apellidoPaterno || '',
                persona.apellidoMaterno || ''
            ].filter(Boolean).join(' ').trim() || 'Sin Nombre';
            const telefono = persona.telefono || 'No especificado';
            const correo = persona.correo || 'No especificado';
            const estado = operador.activoOperador ? 'Activo' : 'Inactivo';
            const estadoColor = operador.activoOperador ? 'text-green-600' : 'text-red-600';

            contenido += `
                <div class="operator-card bg-white rounded-lg shadow-md p-4 flex flex-col gap-2">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-gray-500 text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">${nombreCompleto}</h3>
                            <p class="text-sm ${estadoColor}">${estado}</p>
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
                    <div class="flex justify-end gap-2 mt-2">
                        ${operador.activoOperador ? `
                            <button onclick="cargarDetalleOperador(${operador.idOperador})" class="text-blue-500 hover:text-blue-700">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarOperador(${operador.idOperador})" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : `
                            <button onclick="reactivarOperador(${operador.idOperador})" class="text-green-500 hover:text-green-700">
                                <i class="fas fa-undo"></i> Reactivar
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        tblOperador.innerHTML = contenido;
        buscarOperadores(); // Apply search filter after rendering
    }

    function buscarOperadores() {
        const termino = txtBuscar.value.toLowerCase().trim();
        const cards = tblOperador.querySelectorAll(".operator-card");
        cards.forEach(card => {
            const nombre = card.querySelector("h3").textContent.toLowerCase().trim();
            card.style.display = nombre.includes(termino) ? "" : "none";
        });
    }

    function cargarDetalleOperador(idOperador) {
        const operador = operadores.find(o => o.idOperador == idOperador);
        if (!operador) {
            mostrarError('Error', 'Operador no encontrado');
            return;
        }

        const persona = operador.Persona || {};
        const usuario = operador.Usuario || {};
        document.getElementById("idOperador").value = operador.idOperador;
        document.getElementById("idPersona").value = persona.idPersona || '';
        document.getElementById("idUsuario").value = usuario.idUsuario || '';
        document.getElementById("nombre").value = persona.nombre || '';
        document.getElementById("apellidoPaterno").value = persona.apellidoPaterno || '';
        document.getElementById("apellidoMaterno").value = persona.apellidoMaterno || '';
        document.getElementById("telefono").value = persona.telefono || '';
        document.getElementById("correo").value = persona.correo || '';
        document.getElementById("usuario").value = usuario.nombreUsuario || '';
        document.getElementById("contrasenia").value = usuario.contrasenia || '';
        setDetalleVisible(true);
    }

    async function guardarOperador() {
        const operadorData = {
            idOperador: document.getElementById("idOperador").value || 0,
            Persona: {
                idPersona: document.getElementById("idPersona").value || 0,
                nombre: document.getElementById("nombre").value,
                apellidoPaterno: document.getElementById("apellidoPaterno").value,
                apellidoMaterno: document.getElementById("apellidoMaterno").value,
                telefono: document.getElementById("telefono").value,
                correo: document.getElementById("correo").value
            },
            Usuario: {
                idUsuario: document.getElementById("idUsuario").value || 0,
                nombreUsuario: document.getElementById("usuario").value,
                contrasenia: document.getElementById("contrasenia").value,
                rol: document.getElementById("rol").value,
                activoUsuario: 1
            },
            activoOperador: 1
        };

        try {
            const response = await fetch('https://transportesnaches.com.mx/api/operador/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(operadorData)
            });

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Operador guardado con éxito:", data);
            mostrarExito('Éxito', 'Operador guardado exitosamente');
            recargarOperadores();  // Recargar la tabla
            setDetalleVisible(false); // Ocultar el formulario
        } catch (error) {
            console.error("Error al guardar operador:", error);
            mostrarError('Error', 'No se pudo guardar el operador: ' + error.message);
        }
    }

    async function eliminarOperador(idOperador) {
        const confirmacion = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción desactivará el operador. ¿Deseas continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar'
        });

        if (!confirmacion.isConfirmed)
            return;

        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/operador/delete/${idOperador}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            mostrarExito('Éxito', 'Operador desactivado correctamente');
            recargarOperadores(); // Recarga la lista de operadores
        } catch (error) {
            console.error("Error al eliminar operador:", error);
            mostrarError('Error', 'No se pudo desactivar el operador: ' + error.message);
        }
    }

    // Función para limpiar y mostrar el formulario
    function limpiarMostrarFormulario() {
        limpiarFormulario();
        setDetalleVisible(true);
    }

    function limpiarFormulario() {
        document.getElementById("idOperador").value = '';
        document.getElementById("idPersona").value = '';
        document.getElementById("idUsuario").value = '';
        document.getElementById("nombre").value = '';
        document.getElementById("apellidoPaterno").value = '';
        document.getElementById("apellidoMaterno").value = '';
        document.getElementById("telefono").value = '';
        document.getElementById("correo").value = '';
        document.getElementById("usuario").value = '';
        document.getElementById("contrasenia").value = '';
    }

    // Función para mostrar u ocultar el detalle del formulario
    function setDetalleVisible(visible) {
        if (visible) {
            formOperador.classList.remove("hidden");
            tblOperador.classList.add("hidden");
        } else {
            formOperador.classList.add("hidden");
            tblOperador.classList.remove("hidden");
            limpiarFormulario();
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

    // Función para reactivar un operador
    async function reactivarOperador(idOperador) {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/operador/reactivar/${idOperador}`, {
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
            } else {
                mostrarExito('Éxito', 'Operador reactivado correctamente');
                await recargarOperadores(); // Recarga la lista de operadores
            }
        } catch (error) {
            console.error('Error al reactivar operador:', error);
            mostrarError('Error', 'No se pudo reactivar el operador: ' + error.message);
        }
    }

    // Hacer funciones disponibles globalmente para los eventos onclick en HTML
    window.cargarDetalleOperador = cargarDetalleOperador;
    window.eliminarOperador = eliminarOperador;
    window.reactivarOperador = reactivarOperador;
});