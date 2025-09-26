document.addEventListener("DOMContentLoaded", function () {
    // Elementos del DOM
    const btnNuevaCaseta = document.getElementById("btnNuevaCaseta");
    const btnRecargar = document.getElementById("btnRecargar");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelar");
    const formCaseta = document.getElementById("formCaseta");
    const tblCaseta = document.getElementById("tblCaseta");
    const txtBuscar = document.getElementById("txtBuscar");

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

    let casetas = [];

    // Eventos
    btnNuevaCaseta.addEventListener('click', limpiarMostrarFormulario);
    btnRecargar.addEventListener('click', recargarCasetas);
    btnCancelar.addEventListener('click', () => setDetalleVisible(false));
    txtBuscar.addEventListener('input', buscarCasetas);
    formCaseta.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarCaseta();
    });



    // Inicialización
    inicializar();

    function inicializar() {
        recargarCasetas();
        setDetalleVisible(false);



    }

    async function recargarCasetas() {
        try {

            const response = await fetch('https://transportesnaches.com.mx/api/caseta/getAll', {
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
            casetas = data;
            mostrarCasetas();
        } catch (error) {
            console.error("Error al cargar casetas:", error);
            mostrarError('Error', 'No se pudieron cargar las casetas: ' + error.message);
        }
    }

    function mostrarCasetas() {
        if (!Array.isArray(casetas)) {
            console.error("Los datos recibidos no son un array:", casetas);
            return;
        }
        let contenido = '';
        casetas.forEach(caseta => {
            const isValidUrl = validarURLGoogleMaps(caseta.ubicacion);
            contenido += `
                <div class="caseta-item bg-white rounded-lg p-3 flex items-center justify-between gap-3 border border-orange-100">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-road text-orange-600 text-lg"></i>
                        <div>
                            <h3 class="font-semibold text-gray-800 text-sm">${caseta.nombre || 'Sin Nombre'}</h3>
                            <p class="text-xs text-gray-600">
                                ${isValidUrl
                    ? `<a href="${caseta.ubicacion}" target="_blank" class="text-blue-500 hover:underline">Ver en Google Maps</a>`
                    : caseta.ubicacion || 'Sin Ubicación'}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="cargarDetalleCaseta(${caseta.idCaseta})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarCaseta(${caseta.idCaseta})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        tblCaseta.innerHTML = contenido;
        buscarCasetas(); // Apply search filter after rendering
    }

    function buscarCasetas() {
        const termino = txtBuscar.value.toLowerCase().trim();
        const items = tblCaseta.querySelectorAll(".caseta-item");
        items.forEach(item => {
            const nombre = item.querySelector("h3").textContent.toLowerCase().trim();
            item.style.display = nombre.includes(termino) ? "" : "none";
        });
    }

    function cargarDetalleCaseta(idCaseta) {
        const caseta = casetas.find(c => c.idCaseta == idCaseta);
        if (!caseta) {
            mostrarError('Error', 'Caseta no encontrada');
            return;
        }

        document.getElementById("idCaseta").value = caseta.idCaseta || '';
        document.getElementById("nombre").value = caseta.nombre || '';
        document.getElementById("ubicacion").value = caseta.ubicacion || '';
        setDetalleVisible(true);
    }

    async function eliminarCaseta(idCaseta) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción eliminará la caseta permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#d33',
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/caseta/delete/${idCaseta}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`

                }
            });

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Caseta eliminada con éxito:", data);
            mostrarExito('Éxito', 'Caseta eliminada exitosamente');
            recargarCasetas();
        } catch (error) {
            console.error("Error al eliminar caseta:", error);
            mostrarError('Error', 'No se pudo eliminar la caseta: ' + error.message);
        }
    }

    async function guardarCaseta() {
        const nombre = document.getElementById("nombre").value.trim().toLowerCase();
        const ubicacion = document.getElementById("ubicacion").value.trim();
        const casetaExistente = casetas.find(c => c.nombre.toLowerCase() === nombre && c.idCaseta != (document.getElementById("idCaseta").value || 0));

        if (casetaExistente) {
            mostrarError('Duplicado', 'Ya existe una caseta con ese nombre');
            return;
        }

        if (ubicacion && !validarURLGoogleMaps(ubicacion)) {
            mostrarError('Error', 'La ubicación debe ser un enlace válido de Google Maps');
            return;
        }

        const casetaData = {
            idCaseta: document.getElementById("idCaseta").value || 0,
            nombre: document.getElementById("nombre").value,
            ubicacion: ubicacion || null
        };

        try {
            const response = await fetch('https://transportesnaches.com.mx/api/caseta/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`

                },
                body: JSON.stringify(casetaData)
            });

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Caseta guardada con éxito:", data);
            mostrarExito('Éxito', 'Caseta guardada exitosamente');
            recargarCasetas();
            setDetalleVisible(false);
        } catch (error) {
            console.error("Error al guardar caseta:", error);
            mostrarError('Error', 'No se pudo guardar la caseta: ' + error.message);
        }
    }

    function limpiarMostrarFormulario() {
        limpiarFormulario();
        setDetalleVisible(true);
    }

    function limpiarFormulario() {
        document.getElementById("idCaseta").value = '';
        document.getElementById("nombre").value = '';
        document.getElementById("ubicacion").value = '';
    }

    function setDetalleVisible(visible) {
        if (visible) {
            formCaseta.classList.remove("hidden");
            tblCaseta.classList.add("hidden");
        } else {
            formCaseta.classList.add("hidden");
            tblCaseta.classList.remove("hidden");
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

    function validarURLGoogleMaps(url) {
        if (!url)
            return false;
        const regex = /^https:\/\/(www\.)?google\.com\/maps\//;
        return regex.test(url);
    }

    window.cargarDetalleCaseta = cargarDetalleCaseta;
    window.eliminarCaseta = eliminarCaseta;
});