document.addEventListener("DOMContentLoaded", function () {
    // Elementos del DOM
    const btnNuevaCiudad = document.getElementById("btnNuevaCiudad");
    const btnRecargar = document.getElementById("btnRecargar");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelar");
    const formCiudad = document.getElementById("formCiudad");
    const tblCiudad = document.getElementById("tblCiudad");
    const txtBuscar = document.getElementById("txtBuscar");
    const inputEstado = document.getElementById("nombreEstado");
    const datalistEstados = document.getElementById("listaEstados");

    inputEstado.addEventListener('input', async function () {
        const query = inputEstado.value.trim();

        if (query.length < 2) return; // Esperar al menos 2 letras

        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/ciudad/getAllCiudades?query=${encodeURIComponent(query)}`);
            const ciudades = await response.json();

            // Extraer estados únicos
            const estadosUnicos = [];
            ciudades.forEach(ciudad => {
                const estado = ciudad.estado?.nombreEstado;
                if (estado && !estadosUnicos.includes(estado)) {
                    estadosUnicos.push(estado);
                }
            });

            // Limpiar y rellenar datalist
            datalistEstados.innerHTML = '';
            estadosUnicos.forEach(estado => {
                const option = document.createElement("option");
                option.value = estado;
                datalistEstados.appendChild(option);
            });

        } catch (error) {
            console.error("Error al cargar estados:", error);
        }
    });

    let ciudades = [];

    // Eventos
    btnNuevaCiudad.addEventListener('click', limpiarMostrarFormulario);
    btnRecargar.addEventListener('click', recargarCiudades);
    btnCancelar.addEventListener('click', () => setDetalleVisible(false));
    txtBuscar.addEventListener('input', buscarCiudades);
    formCiudad.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarCiudad();
    });

    // Inicialización
    inicializar();

    function inicializar() {
        recargarCiudades();
        setDetalleVisible(false);
    }

    async function recargarCiudades() {
        try {
            const response = await fetch('https://transportesnaches.com.mx/api/ciudad/getAll', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (!data) {
                throw new Error("La respuesta está vacía");
            }
            ciudades = data;
            mostrarCiudades();
        } catch (error) {
            console.error("Error al cargar ciudades:", error);
            mostrarError('Error', 'No se pudieron cargar las ciudades: ' + error.message);
        }
    }

    function mostrarCiudades() {
        if (!Array.isArray(ciudades)) {
            console.error("Los datos recibidos no son un array:", ciudades);
            return;
        }
        let contenido = '';
        ciudades.forEach(ciudad => {
            contenido += `
                <div class="ciudad-item bg-white rounded-lg p-3 flex items-center justify-between gap-3 border border-orange-100">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-city text-orange-600 text-lg"></i>
                        <div>
                            <h3 class="font-semibold text-gray-800 text-sm">${ciudad.nombreCiudad || 'Sin Nombre'}</h3>
                            <p class="text-xs text-gray-600">${ciudad.estado?.nombreEstado || 'Sin Estado'}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="cargarDetalleCiudad(${ciudad.idCiudad})" class="text-blue-500 hover:text-blue-700" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarCiudad(${ciudad.idCiudad})" class="text-red-500 hover:text-red-700" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        tblCiudad.innerHTML = contenido;
        buscarCiudades(); // Apply search filter after rendering
    }

    function normalizeString(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function buscarCiudades() {
        const termino = normalizeString(txtBuscar.value);
        const items = tblCiudad.querySelectorAll(".ciudad-item");
        items.forEach(item => {
            const nombreCiudad = normalizeString(item.querySelector("h3").textContent);
            const nombreEstado = normalizeString(item.querySelector("p").textContent);
            item.style.display = nombreCiudad.includes(termino) || nombreEstado.includes(termino) ? "" : "none";
        });
    }

    function cargarDetalleCiudad(idCiudad) {
        const ciudad = ciudades.find(c => c.idCiudad == idCiudad);
        if (!ciudad) {
            mostrarError('Error', 'Ciudad no encontrada');
            return;
        }

        document.getElementById("idCiudad").value = ciudad.idCiudad || '';
        document.getElementById("nombreCiudad").value = ciudad.nombreCiudad || '';
        document.getElementById("idEstado").value = ciudad.estado?.idEstado || '';
        document.getElementById("nombreEstado").value = ciudad.estado?.nombreEstado || '';
        setDetalleVisible(true);
    }

    async function guardarCiudad() {
        const nombreEstado = document.getElementById("nombreEstado").value.trim().toLowerCase();
        const nombreCiudad = document.getElementById("nombreCiudad").value.trim().toLowerCase();
        const idCiudad = parseInt(document.getElementById("idCiudad").value) || 0;

        // Validación: verificar si ya existe ciudad con el mismo nombre y estado
        const ciudadExistente = ciudades.find(c =>
            c.nombreCiudad?.toLowerCase() === nombreCiudad &&
            c.estado?.nombreEstado?.toLowerCase() === nombreEstado &&
            c.idCiudad !== idCiudad // para evitar conflicto en edición
        );

        if (ciudadExistente) {
            mostrarError('Duplicado', 'Ya existe una ciudad con ese nombre y estado');
            return;
        }

        // Aquí podrías validar si ya existe el estado también (si quieres evitar estados duplicados)
        const estadoExistente = ciudades.find(c =>
            c.estado?.nombreEstado?.toLowerCase() === nombreEstado
        );

        if (!estadoExistente) {
            mostrarError('Estado no válido', 'El estado ingresado no está registrado');
            return;
        }

        const ciudadData = {
            idCiudad: parseInt(document.getElementById("idCiudad").value) || 0,
            nombreCiudad: document.getElementById("nombreCiudad").value,
            estado: {
                idPersona: parseInt(document.getElementById("idEstado").value) || 0,
                nombreEstado: document.getElementById("nombreEstado").value
            }
        };

        try {
            const response = await fetch('https://transportesnaches.com.mx/api/ciudad/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ciudadData)
            });

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Ciudad guardada con éxito:", data);
            mostrarExito('Éxito', 'Ciudad guardada exitosamente');
            recargarCiudades();
            setDetalleVisible(false);
        } catch (error) {
            console.error("Error al guardar ciudad:", error);
            mostrarError('Error', 'No se pudo guardar la ciudad: ' + error.message);
        }
    }

    async function eliminarCiudad(idCiudad) {
        const confirmacion = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará la ciudad. ¿Deseas continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/ciudad/delete/${idCiudad}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Ciudad eliminada con éxito:", data);
            mostrarExito('Éxito', 'Ciudad eliminada exitosamente');
            recargarCiudades();
        } catch (error) {
            console.error("Error al eliminar ciudad:", error);
            mostrarError('Error', 'No se pudo eliminar la ciudad: ' + error.message);
        }
    }

    function limpiarMostrarFormulario() {
        limpiarFormulario();
        setDetalleVisible(true);
    }

    function limpiarFormulario() {
        document.getElementById("idCiudad").value = '';
        document.getElementById("nombreCiudad").value = '';
        document.getElementById("idEstado").value = '';
        document.getElementById("nombreEstado").value = '';
    }

    function setDetalleVisible(visible) {
        if (visible) {
            formCiudad.classList.remove("hidden");
            tblCiudad.classList.add("hidden");
        } else {
            formCiudad.classList.add("hidden");
            tblCiudad.classList.remove("hidden");
            limpiarFormulario();
        }
    }

    function mostrarError(titulo, mensaje) {
        Swal.fire({
            title: titulo,
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316'
        });
    }

    function mostrarExito(titulo, mensaje) {
        Swal.fire({
            title: titulo,
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316'
        });
    }

    window.cargarDetalleCiudad = cargarDetalleCiudad;
    window.eliminarCiudad = eliminarCiudad;
});