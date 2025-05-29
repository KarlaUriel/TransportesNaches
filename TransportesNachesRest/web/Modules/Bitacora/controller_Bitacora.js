let isSaving = false; // Indica si se está guardando un formulario
let tiposGasto = []; // Almacena los datos completos de tipos de gasto
const tiposGasStatic = [
    {idTipoGas: 1, nombreGas: "Diésel"},
    {idTipoGas: 2, nombreGas: "Gasolina"}
]; // Tipos de gas estáticos

let navigationConfirmed = false;


// Debug: Log the form elements
const iniciarForm = document.getElementById('iniciarViajeForm');
const finalizarForm = document.getElementById('finalizarViajeForm');
console.log('iniciarViajeForm:', iniciarForm);
console.log('finalizarViajeForm:', finalizarForm);

document.addEventListener("DOMContentLoaded", function () {
    // Inicializar la página
    inicializarBitacora();
    assignEventListeners(); // Asigna listeners a botones e inputs
    setupNoGastosCheckbox();
//    // Asignar eventos
//    document.getElementById("iniciarViaje")?.addEventListener("click", iniciarViaje);
//    document.getElementById("finalizarViaje")?.addEventListener("click", finalizarViaje);
//    document.getElementById("agregarGasto")?.addEventListener("click", agregarGasto);
//    document.getElementById("calcularTotal")?.addEventListener("click", calcularTotal);
//    document.querySelectorAll(".btnVolver").forEach(btn => btn.addEventListener("click", volver));
//    document.getElementById("fotoTablero")?.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaTablero"));
//    document.getElementById("fotoAcuse")?.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaAcuse"));
//    document.getElementById("fotoOtraInicio")?.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaOtraInicio"));
//    document.getElementById("fotoOtraFin")?.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaOtraFin"));

// Initialize autocomplete for all existing inputs
    document.querySelectorAll('.destino-input').forEach(input => {
        console.log('Initializing autocomplete for existing input:', input);
        setupAutocompleter(input);
    });

    // Mostrar/ocultar selector de nivel de gasolina de inicio
    document.getElementById('gasolinaInicio')?.addEventListener('change', function () {
        const gasolinaLevelDiv = document.getElementById('gasolinaLevel');
        if (this.checked) {
            gasolinaLevelDiv.classList.remove('hidden');
        } else {
            gasolinaLevelDiv.classList.add('hidden');
            document.getElementById('gasolinaLevelInput').value = '';
            document.querySelectorAll('.gas-level-btn').forEach(btn => {
                btn.classList.remove('bg-orange-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-800');
            });
        }
    });

    // Interceptar clics en enlaces de navegación
    interceptarNavegacion();

    // Set up the initial "+" button
    const initialButton = document.querySelector('.btnAgregarDestino');
    if (initialButton) {
        initialButton.addEventListener('click', handleDestinoButtonClick);
    }

    // Initialize "+" buttons
    updateDestinoButtons();
});

function assignEventListeners() {
    const iniciarViajeBtn = document.getElementById("iniciarViaje");
    const finalizarViajeBtn = document.getElementById("finalizarViaje");
    const agregarGastoBtn = document.getElementById("agregarGasto");
    const fotoTablero = document.getElementById("fotoTablero");
    const fotoAcuse = document.getElementById("fotoAcuse");
    const fotoOtraInicio = document.getElementById("fotoOtraInicio");
    const fotoOtraFin = document.getElementById("fotoOtraFin");

    // Remove existing listeners to prevent duplication
    if (iniciarViajeBtn) {
        iniciarViajeBtn.removeEventListener("click", iniciarViaje);
        iniciarViajeBtn.addEventListener("click", iniciarViaje);
    }
    if (finalizarViajeBtn) {
        finalizarViajeBtn.removeEventListener("click", finalizarViaje);
        finalizarViajeBtn.addEventListener("click", finalizarViaje);
    }
    if (agregarGastoBtn) {
        agregarGastoBtn.removeEventListener("click", agregarGasto);
        agregarGastoBtn.addEventListener("click", agregarGasto);
    }
    document.querySelectorAll(".btnVolver").forEach(btn => {
        btn.removeEventListener("click", volver);
        btn.addEventListener("click", volver);
    });
    if (fotoTablero) {
        fotoTablero.removeEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaTablero"));
        fotoTablero.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaTablero"));
    }
    if (fotoAcuse) {
        fotoAcuse.removeEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaAcuse"));
        fotoAcuse.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaAcuse"));
    }
    if (fotoOtraInicio) {
        fotoOtraInicio.removeEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaOtraInicio"));
        fotoOtraInicio.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaOtraInicio"));
    }
    if (fotoOtraFin) {
        fotoOtraFin.removeEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaOtraFin"));
        fotoOtraFin.addEventListener("change", (e) => mostrarVistaPrevia(e, "vistaPreviaOtraFin"));
    }
}



// Verifica si hay datos no guardados
function hayDatosNoGuardados() {
    if (isSaving)
        return false;

    const ignorarCampos = ['gasolinaInicio'];
    const finalizarViajeForm = document.getElementById('finalizarViajeForm');
    const iniciarViajeForm = document.getElementById('iniciarViajeForm');
    if (iniciarForm && !iniciarForm.classList.contains('hidden')) {
        const inputs = iniciarForm.querySelectorAll('input, select, textarea');
        for (let input of inputs) {
            if (input.value.trim() !== '')
                return true;
        }
    }
    if (finalizarForm && !finalizarForm.classList.contains('hidden')) {
        const inputs = finalizarForm.querySelectorAll('input, select, textarea');
        for (let input of inputs) {
            if (input.value.trim() !== '')
                return true;
        }
    }

    if (document.getElementById('fotoTablero')?.files?.length > 0 ||
            document.getElementById('fotoAcuse')?.files?.length > 0) {
        return true;
    }


    const gastosCards = document.getElementById('gastosCards');
    if (gastosCards && gastosCards.children.length > 0) {
    }
    return true;

    const listaCiudades = document.getElementById('listaCiudades');
    if (listaCiudades && listaCiudades.children.length > 0)
        return true;

    return false;
}

function agregarDestinoInput() {
    const container = document.getElementById('destinosContainer');

    const newRow = document.createElement('div');
    newRow.classList.add('flex', 'items-center', 'destino-row', 'mt-2');

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.classList.add('destino-input', 'w-full', 'p-2', 'border', 'border-orange-300', 'rounded', 'bg-orange-50', 'text-gray-800', 'text-sm', 'focus:ring-2', 'focus:ring-orange-500');
    newInput.placeholder = 'Escribe una ciudad...';
    newInput.autocomplete = 'off';

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('flex', 'items-center', 'ml-2', 'gap-2');

    const newAddButton = document.createElement('button');
    newAddButton.type = 'button';
    newAddButton.classList.add('btnAgregarDestino', 'bg-orange-600', 'text-white', 'p-2', 'rounded', 'hover:bg-orange-700', 'transition');
    newAddButton.textContent = '+';

    const newDeleteButton = document.createElement('button');
    newDeleteButton.type = 'button';
    newDeleteButton.classList.add('btnEliminarDestino', 'text-red-500', 'hover:text-red-700', 'p-2');
    newDeleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';

    buttonContainer.appendChild(newAddButton);
    buttonContainer.appendChild(newDeleteButton);
    newRow.appendChild(newInput);
    newRow.appendChild(buttonContainer);
    container.appendChild(newRow);

    setupAutocompleter(newInput);
    updateDestinoButtons();
    newInput.focus();
}


// Interceptar clics en enlaces de navegación
function interceptarNavegacion() {
    document.querySelectorAll('a[href], button:not(#iniciarViaje, #finalizarViaje, \n\
#agregarGasto, #btnVolver,#menuButton, #sidebarMenuButton, .gas-level-btn,\n\
 .btnAgregarDestino, #registrarOtroViaje, #gestionAdmin, #gestionSubmenu, #btnGestion)').forEach(element => {
        element.addEventListener('click', function (e) {
            if (hayDatosNoGuardados()) {
                e.preventDefault();
                Swal.fire({
                    title: '¿Estás seguro?',
                    text: 'Tienes datos no guardados. Si sales, se perderán los datos del formulario y los gastos registrados.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, salir',
                    cancelButtonText: 'No, quedarme',
                    confirmButtonColor: '#f97316',
                    cancelButtonColor: '#6b7280'
                }).then((result) => {
                    if (result.isConfirmed) {
                        if (element.tagName === 'A') {
                            window.location.href = element.href;
                        } else if (element.tagName === 'BUTTON') {
                            element.click();
                        }
                    }
                });
            }
        });
    });

    document.querySelectorAll('.btnVolver').forEach(btn => {
        btn.removeEventListener('click', volver); // Evitar múltiples listeners
        btn.addEventListener('click', volver);
    });



}

// Función para inicializar la bitácora
async function inicializarBitacora() {
    document.getElementById("iniciarViajeForm")?.classList.add("hidden");
    document.getElementById("finalizarViajeForm")?.classList.add("hidden");

//    const nombreOperador = localStorage.getItem("nombreCompleto");
//    if (nombreOperador) {
//        document.getElementById("nombreOperador").value = nombreOperador;
//    } else {
//        console.warn("No se encontró el nombre del operador en localStorage");
//    }

    await cargarNotasUsuario();
    cargarTiposVehiculo();
    cargarTiposGastos();
    cargarClientes();
}

// Cargar notas del usuario
async function cargarNotasUsuario() {
    const idUsuario = localStorage.getItem("idUsuario");
    if (!idUsuario) {
        Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID del usuario. Por favor, inicia sesión nuevamente.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        }).then(() => {
            window.location.href = "../Login/view_Login.html";
        });
        return;
    }

    try {
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/getAllByUser?idUsuario=${idUsuario}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });

        const notas = await response.json();
        if (notas.error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al obtener las notas: ' + notas.error,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        // Buscar todas las notas incompletas
        const notasIncompletas = notas.filter(nota => !nota.fechaLlegada || !nota.horaLlegada);
        const pendingTrips = notasIncompletas.map(nota => ({
                idNota: nota.idNota,
                destino: nota.destino || 'No especificado',
                cliente: nota.cliente?.nombreCliente || nota.nombreCliente || 'No especificado'
            }));

        // Almacenar las notas incompletas en localStorage
        localStorage.setItem('pendingTrips', JSON.stringify(pendingTrips));

        // Llenar el selector de viajes pendientes
        const viajePendienteSelect = document.getElementById('viajePendiente');
        if (viajePendienteSelect) {
            viajePendienteSelect.innerHTML = '<option value="">Seleccione un viaje...</option>';
            pendingTrips.forEach(trip => {
                const option = document.createElement('option');
                option.value = trip.idNota;
                option.textContent = `Viaje a ${trip.destino} (Cliente: ${trip.cliente})`;
                viajePendienteSelect.appendChild(option);
            });
        }

        if (notasIncompletas.length > 0) {
            // Seleccionar la primera nota incompleta por defecto
            const primeraNotaIncompleta = notasIncompletas[0];
            localStorage.setItem("idNota", primeraNotaIncompleta.idNota);
            document.getElementById('iniciarViajeForm').classList.add('hidden');
            document.getElementById('finalizarViajeForm').classList.remove('hidden');
            mostrarDatosNota(primeraNotaIncompleta.idNota);

            // Programáticamente seleccionar la primera nota en el dropdown
            if (viajePendienteSelect) {
                viajePendienteSelect.value = primeraNotaIncompleta.idNota;

                // Trigger the change event to ensure the UI updates
                const changeEvent = new Event('change');
                viajePendienteSelect.dispatchEvent(changeEvent);
            }

            // Mostrar alerta con información de los viajes pendientes
            const destinosPendientes = pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ');
            Swal.fire({
                title: 'Viajes pendientes',
                text: `Tienes ${pendingTrips.length} viaje(s) pendiente(s) hacia: ${destinosPendientes}. Por favor, finalízalos o inicia uno nuevo.`,
                icon: 'info',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
        } else {
            document.getElementById('iniciarViajeForm').classList.remove('hidden');
            document.getElementById('finalizarViajeForm').classList.add('hidden');
            localStorage.removeItem("idNota");
            localStorage.removeItem('pendingTrips');
            if (viajePendienteSelect) {
                viajePendienteSelect.innerHTML = '<option value="">Seleccione un viaje...</option>';
            }
        }
    } catch (error) {
        console.error('Error al cargar notas del usuario:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al conectar con el servidor al cargar las notas',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

// Iniciar viaje
async function iniciarViaje(event) {
    event.preventDefault();
    if (!validarCamposIniciarViaje())
        return;
    let pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
    if (pendingTrips.length > 0) {
        if (pendingTrips.length >= 2) {
            const destinosPendientes = pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ');
            Swal.fire({
                title: 'Límite alcanzado',
                text: `Ya tienes 2 viajes pendientes hacia: ${destinosPendientes}. Finaliza uno antes de iniciar otro.`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }
        const destinosPendientes = pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ');
        const result = await Swal.fire({
            title: '¿Estás seguro de iniciar otro viaje?',
            text: `Tienes un viaje pendiente hacia: ${destinosPendientes}. ¿Deseas iniciar un nuevo viaje?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, iniciar',
            cancelButtonText: 'No, cancelar',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
        });
        if (!result.isConfirmed) {
            return;
        }
    }
    const form = document.getElementById('iniciarViajeForm');
    const formData = new FormData(form);
    const destinosArray = Array.from(document.querySelectorAll('.destino-input'))
            .map(input => input.value.trim().split(',')[0].trim())
            .filter(destino => destino !== '');
    let destinos;
    if (destinosArray.length === 0) {
        destinos = '';
    } else if (destinosArray.length === 1) {
        destinos = destinosArray[0];
    } else if (destinosArray.length === 2) {
        destinos = `${destinosArray[0]} y ${destinosArray[1]}`;
    } else {
        destinos = `${destinosArray.slice(0, -1).join(', ')} y ${destinosArray[destinosArray.length - 1]}`;
    }
    formData.set('destino', destinos);
    const fechaActual = new Date().toISOString().split('T')[0];
    const nombreOperador = localStorage.getItem("nombreCompleto");
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = '00';
    const horaSalida = `${hours}:${minutes}:${seconds}`;
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d):00$/;
    if (!horaRegex.test(horaSalida)) {
        console.error('Formato de horaSalida inválido:', horaSalida);
        Swal.fire({
            title: 'Error',
            text: 'La hora de salida generada es inválida. Contacta al administrador.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }
    const datosNota = {
        nombreOperador: nombreOperador,
        nombreCliente: formData.get('nombreCliente'),
        fechaLlenado: fechaActual,
        fechaSalida: fechaActual,
        horaSalida: horaSalida,
        origen: formData.get('origen') || 'León, Guanajuato',
        destino: destinos,
        idUnidad: parseInt(formData.get('idUnidad')),
        kmInicio: parseFloat(formData.get('kmInicio')),
        idUsuario: parseInt(localStorage.getItem("idUsuario")),
        gasolinaInicio: formData.get('gasolinaInicio') === 'on',
        gasolinaLevel: formData.get('gasolinaLevel') || '',
        llantasInicio: formData.get('llantasInicio') === 'on',
        aceiteInicio: formData.get('aceiteInicio') === 'on',
        anticongelanteInicio: formData.get('anticongelanteInicio') === 'on',
        comentarioEstado: formData.get('comentarioEstado') || "",
        liquidoFrenosInicio: formData.get('liquidoFrenosInicio') === 'on',
        fotoTablero: await convertirABase64(document.getElementById('fotoTablero').files[0]) || null,
        fotoOtraInicio: await convertirABase64(document.getElementById('fotoOtraInicio').files[0]) || null
    };
    try {
        isSaving = true;
        const response = await fetch('https://transportesnaches.com.mx/api/nota/iniciarViaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({datosNota: JSON.stringify(datosNota)})
        });
        const result = await response.json();
        if (result.error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al iniciar el viaje: ' + result.error,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            isSaving = false;
            return;
        }
        if (result.idNota) {
            pendingTrips.push({
                idNota: result.idNota,
                destino: destinos,
                cliente: datosNota.nombreCliente
            });
            localStorage.setItem('pendingTrips', JSON.stringify(pendingTrips));
            localStorage.setItem("idNota", result.idNota);
        } else {
            console.warn("El servidor no devolvió idNota en la respuesta");
        }
        Swal.fire({
            title: 'Éxito',
            text: result.result || 'Viaje iniciado correctamente.',
            icon: 'success',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#f97316',
        }).then(() => {
            const kmInicioInput = document.getElementById('kmInicio');
            if (kmInicioInput) {
                kmInicioInput.value = '';
                console.log('kmInicio reset to empty after trip initiation');
            }
            document.getElementById('iniciarViajeForm').classList.add('hidden');
            mostrarDatosNota(localStorage.getItem('idNota'));
            document.getElementById('finalizarViajeForm').classList.remove('hidden');
            cargarNotasUsuario();
            const gastosCards = document.getElementById('gastosCards');
            if (gastosCards) {
                gastosCards.innerHTML = `
                    <h2 class="text-xl font-bold text-gray-800 bg-orange-200 py-2 px-4 rounded-lg mb-4 text-center">Registro de Gastos</h2>
                    <div id="gastosCards" class="sm:hidden block space-y-4"></div>
                    <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                        <div class="flex flex-col sm:flex-row gap-4">
                        
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="noGastos" name="noGastos">
                                No hubo gastos
                            </label>
                        </div>
                        <div class="text-lg font-bold text-gray-800">
                            <strong>Total:</strong> <span id="totalGastos" class="text-gray-800">0.00</span>
                        </div>
                    </div>
                `;
                document.getElementById('agregarGasto')?.addEventListener('click', agregarGasto);
                setupNoGastosCheckbox();
                calcularTotal();
            }
            isSaving = false;
        });
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al conectar con el servidor',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        isSaving = false;
    }
}
// Validar campos de iniciar viaje
function validarCamposIniciarViaje() {
    const camposObligatorios = [
        {id: "nombreCliente", mensaje: "El nombre del cliente es obligatorio"},
        {id: "origen", mensaje: "El origen es obligatorio"},
        {id: "idUnidad", mensaje: "Debe seleccionar una unidad"},
        {id: "kmInicio", mensaje: "El kilometraje inicial es obligatorio"},
        {id: "fotoTablero", mensaje: "Foto Tablero es obligatorio"}
    ];

    for (const campo of camposObligatorios) {
        const elemento = document.getElementById(campo.id);
        if (!elemento || !elemento.value.trim()) {
            Swal.fire({
                title: 'Campo requerido',
                text: campo.mensaje,
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            elemento?.focus();
            return false;
        }
    }

    const destinos = Array.from(document.querySelectorAll('.destino-input'))
            .map(input => input.value.trim())
            .filter(value => value !== '');
    if (destinos.length === 0) {
        Swal.fire({
            title: 'Destino requerido',
            text: 'Debe agregar al menos un destino.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        document.querySelector('.destino-input').focus();
        return false;
    }

    const gasolinaInicio = document.getElementById('gasolinaInicio');
    const gasolinaLevel = document.getElementById('gasolinaLevelInput');
    if (gasolinaInicio.checked && !gasolinaLevel.value) {
        Swal.fire({
            title: 'Nivel de gasolina requerido',
            text: 'Por favor, selecciona un nivel de gasolina (1/4, 1/2, o 1).',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return false;
    }

    return true;
}

// Mostrar datos de la nota
async function mostrarDatosNota(idNota) {
    if (!idNota) {
        Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID de la nota en el almacenamiento local.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }
    try {
        const params = new URLSearchParams({idNota});
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/getById?${params}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        });
        const nota = await response.json();
        if (nota.error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al obtener la nota: ' + nota.error,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }
        const destinos = nota.destino ? nota.destino.split(', ').map(d => d.trim()) : ['No especificado'];
        const viajePendienteSelect = document.getElementById('viajePendiente');
        const isTripSelected = viajePendienteSelect && viajePendienteSelect.value;
        const datosNotaDiv = document.getElementById('datosNota');
        datosNotaDiv.innerHTML = `
            <h3 class="text-lg font-bold text-white mb-4">Datos del Viaje (No editables)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                <p><strong class="text-gradient-start">Cliente:</strong> ${nota.cliente?.nombreCliente || nota.nombreCliente || 'No especificado'}</p>
                <p><strong class="text-gradient-start">Fecha Salida:</strong> ${nota.fechaSalida || 'No especificada'}</p>
                <p><strong class="text-gradient-start">Origen:</strong> ${nota.origen || 'León'}</p>
                <p><strong class="text-gradient-start">Destinos:</strong> ${destinos.join(', ') || 'No especificado'}</p>
                <p><strong class="text-gradient-start">Unidad:</strong> ${nota.unidad?.tipoVehiculo || nota.tipoVehiculo || 'No especificada'}</p>
                <p><strong class="text-gradient-start">Hora Salida:</strong> ${nota.horaSalida || 'No especificada'}</p>
            </div>
            <button type="button" id="registrarOtroViaje" class="bg-green-600 text-white py-2 px-6 rounded flex items-center gap-2 hover:bg-green-700 transition mt-4 ${isTripSelected ? '' : 'hidden'}">
                <i class="fas fa-plus"></i> Registrar Otro Viaje
            </button>
        `;
        const registrarOtroViajeBtn = document.getElementById('registrarOtroViaje');
        if (registrarOtroViajeBtn) {
            registrarOtroViajeBtn.addEventListener('click', function () {
                let pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
                if (pendingTrips.length >= 2) {
                    const destinosPendientes = pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ');
                    Swal.fire({
                        title: 'Límite alcanzado',
                        text: `Ya tienes 2 viajes pendientes hacia: ${destinosPendientes}. Finaliza uno antes de iniciar otro.`,
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#f97316',
                    });
                    return;
                }
                const finalizarForm = document.getElementById('finalizarViajeForm');
                if (finalizarForm) {
                    finalizarForm.reset();
                    document.getElementById('vistaPreviaAcuse').innerHTML = '';
                    document.getElementById('vistaPreviaOtraFin').innerHTML = '';
                    const gastosCards = document.getElementById('gastosCards');
                    if (gastosCards) {
                        gastosCards.innerHTML = `
                            <h2 class="text-xl font-bold text-gray-800 bg-orange-200 py-2 px-4 rounded-lg mb-4 text-center">Registro de Gastos</h2>
                            <div id="gastosCards" class="sm:hidden block space-y-4"></div>
                            <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                                <div class="flex flex-col sm:flex-row gap-4">
                                   
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="noGastos" name="noGastos">
                                        No hubo gastos
                                    </label>
                                </div>
                                <div class="text-lg font-bold text-gray-800">
                                    <strong>Total:</strong> <span id="totalGastos" class="text-gray-800">0.00</span>
                                </div>
                            </div>
                        `;
                        document.getElementById('agregarGasto')?.addEventListener('click', agregarGasto);
                        setupNoGastosCheckbox();
                        calcularTotal();
                    }
                }
                setDetalleVisible(true);
                if (iniciarForm) {
                    iniciarForm.scrollIntoView({behavior: 'smooth'});
                }
                const registrarOtroViajeBtn = document.getElementById('registrarOtroViaje');
                if (registrarOtroViajeBtn) {
                    registrarOtroViajeBtn.classList.add('hidden');
                }
                const viajePendienteSelect = document.getElementById('viajePendiente');
                if (viajePendienteSelect) {
                    viajePendienteSelect.value = '';
                    const changeEvent = new Event('change');
                    viajePendienteSelect.dispatchEvent(changeEvent);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al conectar con el servidor',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

// Finalizar viaje
//function validarCamposFinalizarViaje() {
//    const camposObligatorios = [
//        {id: "kmFinal", mensaje: "El kilometraje final es obligatorio"},
//        {id: "noEntrega", mensaje: "El número de entregas es obligatorio"},
//        {id: "fotoAcuse", mensaje: "Foto Acuse es obligatorio"}
//    ];
//
//    for (const campo of camposObligatorios) {
//        const elemento = document.getElementById(campo.id);
//        if (!elemento || !elemento.value.trim()) {
//            Swal.fire({
//                title: 'Campo requerido',
//                text: campo.mensaje,
//                icon: 'warning',
//                confirmButtonText: 'Aceptar',
//                confirmButtonColor: '#f97316'
//            });
//            elemento?.focus();
//            return false;
//        }
//    }
//
////    const gastos = document.querySelectorAll("#gastosCards .gasto-card");
////    console.log("Number of data rows:", gastos.length);
////    if (gastos.length === 0) {
////        Swal.fire({
////            title: 'Gastos requeridos',
////            text: 'Debe registrar al menos un gasto',
////            icon: 'warning',
////            confirmButtonText: 'Aceptar',
////            confirmButtonColor: '#f97316',
////        });
////        return false;
////    }
//
////    for (let i = 0; i < gastos.length; i++) {
////        console.log(`Card ${i + 1}:`, gastos[i]);
////        const tipoGastoSelect = gastos[i].querySelector(".tipoGasto");
////        if (!tipoGastoSelect) {
////            console.error(`Card ${i + 1} is missing the .tipoGasto element:`, gastos[i].innerHTML);
////            Swal.fire({
////                title: 'Error',
////                text: `El gasto ${i + 1} no tiene un tipo de gasto válido. Por favor, elimina este gasto y vuelve a agregarlo.`,
////                icon: 'error',
////                confirmButtonText: 'Aceptar',
////                confirmButtonColor: '#f97316',
////            });
////            return false;
////        }
////        const tipoGastoId = tipoGastoSelect.value;
////        const tipoGastoText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
////        const tipoPago = gastos[i].querySelector(".tipoPago").value;
////        const subTotal = parseFloat(gastos[i].querySelector(".subTotal").value) || 0;
////
////        if (!tipoGastoId || isNaN(parseInt(tipoGastoId)) || parseInt(tipoGastoId) <= 0) {
////            Swal.fire({
////                title: 'Tipo de gasto requerido',
////                text: `Por favor, selecciona un tipo de gasto válido para el gasto ${i + 1}.`,
////                icon: 'warning',
////                confirmButtonText: 'Aceptar',
////                confirmButtonColor: '#f97316',
////            });
////            gastos[i].querySelector(".tipoGasto").focus();
////            return false;
////        }
////
////        if (subTotal <= 0) {
////            Swal.fire({
////                title: 'Subtotal requerido',
////                text: `Por favor, ingresa un subtotal válido para el gasto ${i + 1}.`,
////                icon: 'warning',
////                confirmButtonText: 'Aceptar',
////                confirmButtonColor: '#f97316',
////            });
////            gastos[i].querySelector(".subTotal").focus();
////            return false;
////        }
////
////        if (!tipoPago) {
////            Swal.fire({
////                title: 'Tipo de pago requerido',
////                text: `Por favor, selecciona un tipo de pago para el gasto ${i + 1}.`,
////                icon: 'warning',
////                confirmButtonText: 'Aceptar',
////                confirmButtonColor: '#f97316'
////            });
////            gastos[i].querySelector(".tipoPago").focus();
////            return false;
////        }
////
////        if (tipoGastoText === "Combustible") {
////            const tipoGas = gastos[i].querySelector(".tipoGas").value;
////            if (!tipoGas || !["Magna", "Diésel", "Gasolina"].includes(tipoGas)) {
////                Swal.fire({
////                    title: 'Tipo de gasolina requerido',
////                    text: `Por favor, selecciona un tipo de gasolina para el gasto ${i + 1}.`,
////                    icon: 'warning',
////                    confirmButtonText: 'Aceptar',
////                    confirmButtonColor: '#f97316',
////                });
////                gastos[i].querySelector(".tipoGas").focus();
////                return false;
////            }
////        } else if (tipoGastoText === "Caseta") {
////            const casetas = gastos[i].querySelectorAll(".caseta-row");
////            for (let j = 0; j < casetas.length; j++) {
////                const nombreCaseta = casetas[j].querySelector(".nombreCaseta").value;
////                const costoCaseta = parseFloat(casetas[j].querySelector(".costoCaseta").value) || 0;
////                if (!nombreCaseta) {
////                    Swal.fire({
////                        title: 'Nombre de caseta requerido',
////                        text: `Por favor, selecciona una caseta ${j + 1} del gasto ${i + 1}.`,
////                        icon: 'warning',
////                        confirmButtonText: 'Aceptar',
////                        confirmButtonColor: '#f97316',
////                    });
////                    casetas[j].querySelector(".nombreCaseta").focus();
////                    return false;
////                }
////                if (costoCaseta <= 0) {
////                    Swal.fire({
////                        title: 'Costo de caseta requerido',
////                        text: `Por favor, ingresa un costo válido para la caseta ${j + 1} del gasto ${i + 1}.`,
////                        icon: 'warning',
////                        confirmButtonText: 'Aceptar',
////                        confirmButtonColor: '#f97316',
////                    });
////                    casetas[j].querySelector(".costoCaseta").focus();
////                    return false;
////                }
////            }
////        }
////    }
//
//    return true;
//}

// Set visibility of forms
function setDetalleVisible(visible) {
    if (visible) {
        if (iniciarForm) {
            iniciarForm.classList.remove("hidden");
            console.log('iniciarViajeForm mostrado');
        }
        if (finalizarForm) {
            finalizarForm.classList.add("hidden");
            console.log('finalizarViajeForm ocultado');
        }
    } else {
        if (iniciarForm) {
            iniciarForm.classList.add("hidden");
            console.log('iniciarViajeForm ocultado');
        }
        if (finalizarForm) {
            finalizarForm.classList.remove("hidden");
            console.log('finalizarViajeForm mostrado');
        }
    }
}

async function finalizarViaje(event) {
    event.preventDefault();
    if (!validarCamposFinalizarViaje())
        return;
    const form = document.getElementById('finalizarViajeForm');
    const formData = new FormData(form);
    const fechaActual = new Date().toISOString().split('T')[0];
    formData.set('fechaLlegada', fechaActual);
    const idNota = parseInt(localStorage.getItem('idNota'));
    if (!idNota) {
        Swal.fire({
            title: 'Error',
            text: 'No se ha seleccionado un viaje para finalizar. Por favor, selecciona un viaje pendiente.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }
    const noGastosCheckbox = document.getElementById("noGastos");
    const {gastos, total} = noGastosCheckbox?.checked ? {gastos: [], total: 0} : obtenerGastos();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = '00';
    const horaLlegada = `${hours}:${minutes}:${seconds}`;
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d):00$/;
    if (!horaRegex.test(horaLlegada)) {
        Swal.fire({
            title: 'Error',
            text: 'La hora de llegada generada es inválida. Contacta al administrador.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }
    const datosNota = {
        idNota: idNota,
        fechaLlegada: formData.get('fechaLlegada'),
        horaLlegada: horaLlegada,
        kmFinal: parseFloat(formData.get('kmFinal')),
        noEntrega: parseInt(formData.get('noEntrega')),
        comentarioEstado: formData.get('comentarioGeneral') || "",
        fotoAcuse: await convertirABase64(document.getElementById('fotoAcuse').files[0]) || null,
        fotoOtraFin: await convertirABase64(document.getElementById('fotoOtraFin').files[0]) || null,
        gastos
    };
    try {
        isSaving = true;
        console.log('JSON enviado a finalizarViaje:', JSON.stringify(datosNota, null, 2));
        const response = await fetch('https://transportesnaches.com.mx/api/nota/finalizarViaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({datosNota: JSON.stringify(datosNota)}),
        });
        const result = await response.json();
        console.log('Respuesta de finalizarViaje:', result);
        if (!response.ok) {
            throw new Error(result.error || 'Error en la respuesta del servidor');
        }
        if (result.error) {
            throw new Error(result.error);
        }
        let pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
        pendingTrips = pendingTrips.filter(trip => trip.idNota !== idNota);
        localStorage.setItem('pendingTrips', JSON.stringify(pendingTrips));
        Swal.fire({
            title: 'Guardado',
            text: result.result || 'Viaje guardado con éxito.',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Iniciar otro viaje',
            cancelButtonText: 'Volver al menú',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
        }).then((result) => {
            if (iniciarForm) {
                iniciarForm.reset();
                console.log('iniciarViajeForm reseteado');
            }
            if (finalizarForm) {
            window.location.href = '/menu';

            }
            const fotoTablero = document.getElementById('fotoTablero');
            const fotoAcuse = document.getElementById('fotoAcuse');
            const fotoOtraInicio = document.getElementById('fotoOtraInicio');
            const fotoOtraFin = document.getElementById('fotoOtraFin');
            if (fotoTablero) {
                fotoTablero.value = '';
                console.log('fotoTablero reseteado');
            }
            if (fotoAcuse) {
                fotoAcuse.value = '';
                console.log('fotoAcuse reseteado');
            }
            if (fotoOtraInicio) {
                fotoOtraInicio.value = '';
                console.log('fotoOtraInicio reseteado');
            }
            if (fotoOtraFin) {
                fotoOtraFin.value = '';
                console.log('fotoOtraFin reseteado');
            }
            document.getElementById('vistaPreviaTablero').innerHTML = '';
            document.getElementById('vistaPreviaAcuse').innerHTML = '';
            document.getElementById('vistaPreviaOtraInicio').innerHTML = '';
            document.getElementById('vistaPreviaOtraFin').innerHTML = '';
            console.log('Vistas previas de imágenes reseteadas');
            const gasolinaLevelDiv = document.getElementById('gasolinaLevel');
            const gasolinaLevelInput = document.getElementById('gasolinaLevelInput');
            if (gasolinaLevelDiv) {
                gasolinaLevelDiv.classList.add('hidden');
                console.log('gasolinaLevel ocultado');
            }
            if (gasolinaLevelInput) {
                gasolinaLevelInput.value = '';
                console.log('gasolinaLevelInput reseteado');
            }
            document.querySelectorAll('.gas-level-btn').forEach(btn => {
                btn.classList.remove('bg-orange-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-800');
            });
            console.log('Botones de nivel de gasolina reseteados');
            const gastosCards = document.getElementById('gastosCards');
            if (gastosCards) {
                gastosCards.innerHTML = `
                    <h2 class="text-xl font-bold text-gray-800 bg-orange-200 py-2 px-4 rounded-lg mb-4 text-center">Registro de Gastos</h2>
                    <div id="gastosCards" class="sm:hidden block space-y-4"></div>
                    <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                        <div class="flex flex-col sm:flex-row gap-4">
                            
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="noGastos" name="noGastos">
                                No hubo gastos
                            </label>
                        </div>
                        <div class="text-lg font-bold text-gray-800">
                            <strong>Total:</strong> <span id="totalGastos" class="text-gray-800">0.00</span>
                        </div>
                    </div>
                `;
                document.getElementById('agregarGasto')?.addEventListener('click', agregarGasto);
                setupNoGastosCheckbox();
                calcularTotal();
            }
            const destinosContainer = document.getElementById('destinosContainer');
            if (destinosContainer) {
                destinosContainer.innerHTML = `
                    <div class="flex items-center destino-row">
                        <input 
                            type="text" 
                            class="destino-input w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm focus:ring-2 focus:ring-orange-500" 
                            placeholder="Escribe una ciudad..." 
                            autocomplete="off">
                        <button type="button" class="btnAgregarDestino ml-2 bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition">+</button>
                    </div>
                `;
                console.log('Destinos reseteados a un solo input');
                const listaCiudades = document.getElementById('listaCiudades');
                if (listaCiudades) {
                    listaCiudades.innerHTML = '';
                    console.log('Lista de ciudades reseteada');
                }
                setupAutocompleter(destinosContainer.querySelector('.destino-input'));
                updateDestinoButtons();
            }
            const nombreOperador = localStorage.getItem('nombreCompleto');
            if (nombreOperador) {
                document.getElementById('nombreOperador').value = nombreOperador;
                console.log('nombreOperador reinicializado con:', nombreOperador);
            }
            cargarNotasUsuario();
            cargarTiposVehiculo();
            cargarTiposGastos();
            cargarClientes();
            console.log('Datos recargados: notas, tipos de vehículo, tipos de gastos, clientes');
            const gasolinaInicio = document.getElementById('gasolinaInicio');
            if (gasolinaInicio) {
                gasolinaInicio.checked = false;
                console.log('gasolinaInicio desmarcado');
            }
            const registrarOtroViajeBtn = document.getElementById('registrarOtroViaje');
            if (registrarOtroViajeBtn) {
                registrarOtroViajeBtn.classList.add('hidden');
            }
            if (result.isConfirmed) {
                setDetalleVisible(true);
                console.log('Navegando a iniciarViajeForm para nuevo viaje');
                if (iniciarForm) {
                    iniciarForm.scrollIntoView({behavior: 'smooth'});
                    console.log('Desplazado al inicio de iniciarViajeForm');
                }
            } else {
                localStorage.removeItem('idNota');
                localStorage.removeItem('notaBitacora');
                window.location.href = "/menu";
            }
            isSaving = false;
        });
    } catch (error) {
        console.error('Error al finalizar el viaje:', error);
        Swal.fire({
            title: 'Error',
            text: `Error al finalizar el viaje: ${error.message || 'Error al conectar con el servidor'}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        isSaving = false;
    }
}


function setupNoGastosCheckbox() {
    const noGastosCheckbox = document.getElementById("noGastos");
    const agregarGastoBtn = document.getElementById("agregarGasto");
    if (noGastosCheckbox && agregarGastoBtn) {
        noGastosCheckbox.addEventListener('change', function () {
            if (this.checked) {
                agregarGastoBtn.classList.add('hidden');
                document.querySelectorAll('#gastosCards .gasto-card').forEach(card => card.remove());
                document.getElementById('totalGastos').textContent = '0.00';
            } else {
                agregarGastoBtn.classList.remove('hidden');
            }
            calcularTotal();
        });
        // Ensure button state matches checkbox on initialization
        if (noGastosCheckbox.checked) {
            agregarGastoBtn.classList.add('hidden');
        } else {
            agregarGastoBtn.classList.remove('hidden');
        }
    }
}

// Validar campos de finalizar viaje
function validarCamposFinalizarViaje() {
    const camposObligatorios = [
        {id: "kmFinal", mensaje: "El kilometraje final es obligatorio"},
        {id: "noEntrega", mensaje: "El número de entregas es obligatorio"},
        {id: "fotoAcuse", mensaje: "Foto Acuse es obligatorio"}
    ];

    for (const campo of camposObligatorios) {
        const elemento = document.getElementById(campo.id);
        if (!elemento || !elemento.value.trim()) {
            Swal.fire({
                title: 'Campo requerido',
                text: campo.mensaje,
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316'
            });
            elemento?.focus();
            return false;
        }
    }

    const noGastosCheckbox = document.getElementById("noGastos");
    const gastos = document.querySelectorAll("#gastosCards .gasto-card");

    if (!noGastosCheckbox?.checked && gastos.length === 0) {
        Swal.fire({
            title: 'Gastos requeridos',
            text: 'Debe registrar al menos un gasto o marcar "No hubo gastos".',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return false;
    }

    if (!noGastosCheckbox?.checked) {
        console.log("Number of expense cards:", gastos.length);
        for (let i = 0; i < gastos.length; i++) {
            console.log(`Card ${i + 1}:`, gastos[i]);
            const tipoGastoSelect = gastos[i].querySelector(".tipoGasto");
            if (!tipoGastoSelect) {
                console.error(`Card ${i + 1} is missing the .tipoGasto element:`, gastos[i].innerHTML);
                Swal.fire({
                    title: 'Error',
                    text: `El gasto ${i + 1} no tiene un tipo de gasto válido. Por favor, elimina este gasto y vuelve a agregarlo.`,
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316',
                });
                return false;
            }
            const tipoGastoId = tipoGastoSelect.value;
            const tipoGastoText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
            const tipoPago = gastos[i].querySelector(".tipoPago").value;
            const subTotal = parseFloat(gastos[i].querySelector(".subTotal").value) || 0;

            if (!tipoGastoId || isNaN(parseInt(tipoGastoId)) || parseInt(tipoGastoId) <= 0) {
                Swal.fire({
                    title: 'Tipo de gasto requerido',
                    text: `Por favor, selecciona un tipo de gasto válido para el gasto ${i + 1}.`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316',
                });
                gastos[i].querySelector(".tipoGasto").focus();
                return false;
            }

            if (subTotal <= 0) {
                Swal.fire({
                    title: 'Subtotal requerido',
                    text: `Por favor, ingresa un subtotal válido para el gasto ${i + 1}.`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316',
                });
                gastos[i].querySelector(".subTotal").focus();
                return false;
            }

            if (!tipoPago) {
                Swal.fire({
                    title: 'Tipo de pago requerido',
                    text: `Por favor, selecciona un tipo de pago para el gasto ${i + 1}.`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316'
                });
                gastos[i].querySelector(".tipoPago").focus();
                return false;
            }

            if (tipoGastoText === "Combustible") {
                const tipoGas = gastos[i].querySelector(".tipoGas").value;
                if (!tipoGas || !["Diésel", "Gasolina"].includes(tipoGas)) {
                    Swal.fire({
                        title: 'Tipo de gasolina requerido',
                        text: `Por favor, selecciona un tipo de gasolina para el gasto ${i + 1}.`,
                        icon: 'warning',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#f97316',
                    });
                    gastos[i].querySelector(".tipoGas").focus();
                    return false;
                }
            } else if (tipoGastoText === "Caseta") {
                const casetas = gastos[i].querySelectorAll(".caseta-row");
                for (let j = 0; j < casetas.length; j++) {
                    const nombreCaseta = casetas[j].querySelector(".nombreCaseta").value;
                    const costoCaseta = parseFloat(casetas[j].querySelector(".costoCaseta").value) || 0;
                    if (!nombreCaseta) {
                        Swal.fire({
                            title: 'Nombre de caseta requerido',
                            text: `Por favor, selecciona una caseta ${j + 1} del gasto ${i + 1}.`,
                            icon: 'warning',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#f97316',
                        });
                        casetas[j].querySelector(".nombreCaseta").focus();
                        return false;
                    }
                    if (costoCaseta <= 0) {
                        Swal.fire({
                            title: 'Costo de caseta requerido',
                            text: `Por favor, ingresa un costo válido para la caseta ${j + 1} del gasto ${i + 1}.`,
                            icon: 'warning',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#f97316'
                        });
                        casetas[j].querySelector(".costoCaseta").focus();
                        return false;
                    }
                }
            }
        }
    }

    return true;
}

// Ensure this is inside controller_Bitacora.js
function setupAutocompleter(input) {
    console.log('Setting up autocompleter for input:', input);
    const suggestionsContainer = document.getElementById('sugerenciasDestino');
    suggestionsContainer.className = 'absolute z-50 bg-white border border-orange-300 rounded-lg max-h-48 overflow-y-auto hidden';

    function positionSuggestions() {
        const rect = input.getBoundingClientRect();
        suggestionsContainer.style.width = `${rect.width}px`;
        suggestionsContainer.style.top = `${rect.bottom + window.scrollY + 2}px`; // +2 for slight gap
        suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
    }

    function closeSuggestions() {
        suggestionsContainer.classList.add('hidden');
        suggestionsContainer.innerHTML = '';
    }

    // Find the closest scrollable parent
    function getScrollableParent(element) {
        let parent = element.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            const overflowY = style.overflowY;
            if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    }

    const scrollableParent = getScrollableParent(input) || window;

    input.addEventListener('input', async function () {
        const query = this.value.trim();
        if (query.length < 2) {
            closeSuggestions();
            return;
        }

        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/ciudad/getAllCiudades?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            // Validate response structure
            if (!Array.isArray(data)) {
                console.error('Invalid API response:', data);
                suggestionsContainer.innerHTML = '<li class="px-4 py-2 text-gray-500">No se encontraron resultados</li>';
                positionSuggestions();
                suggestionsContainer.classList.remove('hidden');
                return;
            }

            suggestionsContainer.innerHTML = '';
            if (data.length === 0) {
                suggestionsContainer.innerHTML = '<li class="px-4 py-2 text-gray-500">No se encontraron ciudades</li>';
                positionSuggestions();
                suggestionsContainer.classList.remove('hidden');
                return;
            }

            data.forEach(city => {
                if (city.ciudad) {
                    const li = document.createElement('li');
                    li.className = 'px-4 py-2 hover:bg-orange-600 hover:text-white cursor-pointer';
                    li.textContent = city.ciudad.split(',')[0].trim(); // Use city name only
                    li.addEventListener('click', () => {
                        input.value = city.ciudad; // Set full "city, state" in input
                        closeSuggestions();
                    });
                    suggestionsContainer.appendChild(li);
                }
            });

            positionSuggestions();
            suggestionsContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching city suggestions:', error.message);
            suggestionsContainer.innerHTML = '<li class="px-4 py-2 text-gray-500">Error al cargar sugerencias</li>';
            positionSuggestions();
            suggestionsContainer.classList.remove('hidden');
        }
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) {
            input.dispatchEvent(new Event('input'));
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => closeSuggestions(), 200);
    });

    let scrollTimeout;
    function handleScroll() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (!suggestionsContainer.classList.contains('hidden')) {
                const rect = input.getBoundingClientRect();
                const isInputVisible = rect.bottom > 0 && rect.top < window.innerHeight;

                if (!isInputVisible) {
                    closeSuggestions();
                } else {
                    positionSuggestions();
                }
            }
        }, 10); // 10ms debounce
    }

    // Attach scroll listener to window and scrollable parent
    window.addEventListener('scroll', handleScroll);
    if (scrollableParent !== window) {
        scrollableParent.addEventListener('scroll', handleScroll);
    }

    window.addEventListener('resize', () => {
        if (!suggestionsContainer.classList.contains('hidden')) {
            positionSuggestions();
        }
    });

    // Cleanup listeners on input removal (optional, for dynamic inputs)
    input.addEventListener('remove', () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollableParent !== window) {
            scrollableParent.removeEventListener('scroll', handleScroll);
        }
    });
}

function positionSuggestions(input, suggestionsContainer) {
    const rect = input.getBoundingClientRect();
    suggestionsContainer.style.width = `${rect.width}px`;
    suggestionsContainer.style.top = `${rect.bottom + window.scrollY + 2}px`; // +2 for slight gap
    suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
}


function eliminarDestinoInput(event) {
    const row = event.target.closest('.destino-row');
    const container = document.getElementById('destinosContainer');
    const rows = container.querySelectorAll('.destino-row');

    if (rows.length > 1) {
        container.removeChild(row);
        updateDestinoButtons(); // Asegurar que los botones se actualicen después de eliminar
    } else {
        Swal.fire({
            title: 'Advertencia',
            text: 'Debe haber al menos un campo de destino.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}
// Update event listeners for "+" buttons
function updateDestinoButtons() {
    const container = document.getElementById('destinosContainer');
    const rows = container.querySelectorAll('.destino-row');

    rows.forEach((row, index) => {
        const addButton = row.querySelector('.btnAgregarDestino');
        const deleteButton = row.querySelector('.btnEliminarDestino');

        if (addButton) {
            // Mostrar el botón "+" solo en el último campo
            addButton.style.display = index === rows.length - 1 ? 'block' : 'none';
            addButton.removeEventListener('click', handleDestinoButtonClick);
            addButton.addEventListener('click', handleDestinoButtonClick);
        }

        if (deleteButton) {
            deleteButton.removeEventListener('click', eliminarDestinoInput);
            deleteButton.addEventListener('click', eliminarDestinoInput);
        }
    });
}


// Handle "+" button click to add destination
function handleDestinoButtonClick(event) {
    const row = event.target.closest('.destino-row');
    const input = row.querySelector('.destino-input');
    const ciudad = input.value.trim();

    if (ciudad) {
        agregarDestinoInput();
    } else {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, ingresa un destino válido.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

async function cargarCasetas(selectElement) {
    if (!selectElement)
        return;

    try {
        const response = await fetch('https://transportesnaches.com.mx/api/caseta/getAll', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const casetas = await response.json();
        selectElement.innerHTML = '<option value="">Seleccionar caseta...</option>';

        casetas.forEach(caseta => {
            const option = document.createElement("option");
            option.value = caseta.nombre;
            option.textContent = caseta.nombre;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar casetas:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al cargar las casetas',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

function agregarCaseta(dataRow) {
    const casetasContainer = dataRow.querySelector(".casetasContainer");
    if (!casetasContainer)
        return;

    const casetaRow = document.createElement("div");
    casetaRow.classList.add("caseta-row", "flex", "items-center", "mb-2");

    casetaRow.innerHTML = `
        <select class="nombreCaseta w-1/2 p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm mr-2">
            <option value="">Seleccionar caseta...</option>
        </select>
        <input type="number" step="0.01" class="costoCaseta w-1/4 p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm mr-2" placeholder="Costo">
        <button type="button" class="eliminarCasetaBtn text-red-500 hover:text-red-700">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    cargarCasetas(casetaRow.querySelector(".nombreCaseta"));

    casetaRow.querySelector(".costoCaseta").addEventListener("input", () => {
        calcularSubTotal(dataRow);
        calcularTotal();
    });

    casetaRow.querySelector(".nombreCaseta").addEventListener("change", () => {
        calcularSubTotal(dataRow);
        calcularTotal();
    });

    casetaRow.querySelector(".eliminarCasetaBtn").addEventListener("click", () => {
        casetasContainer.removeChild(casetaRow);
        calcularSubTotal(dataRow);
        calcularTotal();
    });

    casetasContainer.appendChild(casetaRow);
}

// Agregar gasto a la tabla
function agregarGasto() {
    const gastosCards = document.getElementById("gastosCards");
    if (!gastosCards)
        return;

    const index = document.querySelectorAll("#gastosCards .gasto-card").length + 1;

    const card = document.createElement("div");
    card.classList.add("gasto-card", "bg-white", "p-4", "rounded-lg", "shadow-md", "border", "border-orange-200", "mb-4");
    card.innerHTML = `
        <div class="card-field flex justify-between items-center mb-2">
            <h3 class="text-lg font-semibold text-gray-800">Gasto #${index}</h3>
            <button type="button" class="btnEliminar text-red-500 hover:text-red-700">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
        <div class="card-field mb-2">
            <label class="block text-sm font-medium text-gray-700">Tipo de Gasto:</label>
            <select class="tipoGasto w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" required>
                <option value="">Seleccionar...</option>
            </select>
        </div>
        <div class="card-field detalleCasetaCell hidden mb-2">
            <label class="block text-sm font-medium text-gray-700">Nombre Caseta:</label>
            <div class="casetasContainer"></div>
            <button type="button" class="agregarCasetaBtn bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition mt-2 w-full">Agregar Caseta</button>
        </div>
        <div class="card-field tipoGasCell hidden mb-2">
            <label class="block text-sm font-medium text-gray-700">Tipo de Gas:</label>
            <select class="tipoGas w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm">
                <option value="">Seleccionar...</option>
                <option value="Diésel">Diésel</option>
                <option value="Gasolina">Gasolina</option>
            </select>
        </div>
        <div class="card-field valorLitroCell hidden mb-2">
            <label class="block text-sm font-medium text-gray-700">Valor por Litro:</label>
            <input type="number" step="0.01" class="valorLitro w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" placeholder="Ej. 23.50">
        </div>
        <div class="card-field tipoPagoCell mb-2">
            <label class="block text-sm font-medium text-gray-700">Tipo de Pago:</label>
            <select class="tipoPago w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm">
                <option value="">Seleccionar...</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
            </select>
        </div>
        <div class="card-field mb-2">
            <label class="block text-sm font-medium text-gray-700">Sub Total:</label>
            <input type="number" step="0.01" class="subTotal w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm">
        </div>
    `;

    llenarComboboxTipoGasto(card.querySelector(".tipoGasto")).then(() => {
        const tipoGastoSelect = card.querySelector(".tipoGasto");
        console.log(`Tipos de gasto cargados para gasto ${index}:`, Array.from(tipoGastoSelect.options).map(opt => ({value: opt.value, text: opt.text})));
    });

    const updateTipoPagoOptions = (tipoGastoSelect, tipoPagoSelect) => {
        const selectedText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
        tipoPagoSelect.innerHTML = '';

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Seleccionar...";
        tipoPagoSelect.appendChild(defaultOption);

        if (selectedText === "Caseta") {
            const efectivoOption = document.createElement("option");
            efectivoOption.value = "Efectivo";
            efectivoOption.textContent = "Efectivo";
            tipoPagoSelect.appendChild(efectivoOption);

            const tagOption = document.createElement("option");
            tagOption.value = "Tag";
            tagOption.textContent = "Tag";
            tipoPagoSelect.appendChild(tagOption);
        } else if (selectedText === "Combustible") {
            const efectivoOption = document.createElement("option");
            efectivoOption.value = "Efectivo";
            efectivoOption.textContent = "Efectivo";
            tipoPagoSelect.appendChild(efectivoOption);

            const tokaOption = document.createElement("option");
            tokaOption.value = "Toka";
            tokaOption.textContent = "Toka";
            tipoPagoSelect.appendChild(tokaOption);
        } else {
            const efectivoOption = document.createElement("option");
            efectivoOption.value = "Efectivo";
            efectivoOption.textContent = "Efectivo";
            tipoPagoSelect.appendChild(efectivoOption);

            const tarjetaOption = document.createElement("option");
            tarjetaOption.value = "Tarjeta";
            tarjetaOption.textContent = "Tarjeta";
            tipoPagoSelect.appendChild(tarjetaOption);
        }
    };

    const toggleColumns = (card, tipoGastoSelect) => {
        const selectedTipoGasto = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;

        const detalleCasetaCell = card.querySelector(".detalleCasetaCell");
        const tipoGasCell = card.querySelector(".tipoGasCell");
        const valorLitroCell = card.querySelector(".valorLitroCell");
        const tipoPagoCell = card.querySelector(".tipoPagoCell");
        const subTotalInput = card.querySelector(".subTotal");

        detalleCasetaCell.classList.add("hidden");
        tipoGasCell.classList.add("hidden");
        valorLitroCell.classList.add("hidden");
        tipoPagoCell.classList.add("hidden");
        subTotalInput.removeAttribute("required");

        if (selectedTipoGasto === "Caseta") {
            detalleCasetaCell.classList.remove("hidden");
            tipoPagoCell.classList.remove("hidden");
            card.querySelector(".tipoPago").setAttribute("required", true);
            subTotalInput.readOnly = true;

            const casetasContainer = card.querySelector(".casetasContainer");
            if (casetasContainer.children.length === 0) {
                agregarCaseta(card, casetasContainer);
            }
            calcularSubTotal(card, casetasContainer);
        } else if (selectedTipoGasto === "Combustible") {
            tipoGasCell.classList.remove("hidden");
            valorLitroCell.classList.remove("hidden");
            tipoPagoCell.classList.remove("hidden");
            card.querySelector(".tipoGas").setAttribute("required", true);
            card.querySelector(".valorLitro").setAttribute("required", true);
            card.querySelector(".tipoPago").setAttribute("required", true);
            subTotalInput.setAttribute("required", true);
            subTotalInput.readOnly = false;
        } else if (selectedTipoGasto) {
            tipoPagoCell.classList.remove("hidden");
            card.querySelector(".tipoPago").setAttribute("required", true);
            subTotalInput.setAttribute("required", true);
            subTotalInput.readOnly = false;
        }
    };

    const tipoGastoSelect = card.querySelector(".tipoGasto");
    const tipoPagoSelect = card.querySelector(".tipoPago");
    const subTotalInput = card.querySelector(".subTotal");

    tipoGastoSelect.addEventListener("change", function () {
        toggleColumns(card, tipoGastoSelect);
        updateTipoPagoOptions(tipoGastoSelect, tipoPagoSelect);
        calcularTotal();
    });

    subTotalInput.addEventListener("input", () => {
        calcularTotal();
    });

    card.querySelector(".agregarCasetaBtn")?.addEventListener("click", () => {
        agregarCaseta(card, card.querySelector(".casetasContainer"));
    });

    card.querySelector(".btnEliminar").addEventListener("click", function () {
        gastosCards.removeChild(card);
        calcularTotal();
    });

    gastosCards.appendChild(card);

    toggleColumns(card, tipoGastoSelect);
    updateTipoPagoOptions(tipoGastoSelect, tipoPagoSelect);
    calcularTotal();
}

// Cálculos
function calcularSubTotal(fila) {
    const tipoGastoSelect = fila.querySelector(".tipoGasto");
    const selectedTipoGasto = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
    const subTotalInput = fila.querySelector(".subTotal");

    if (selectedTipoGasto === "Caseta") {
        let totalCasetas = 0;
        const casetas = fila.querySelectorAll(".caseta-row");
        casetas.forEach(caseta => {
            const costo = parseFloat(caseta.querySelector(".costoCaseta").value) || 0;
            totalCasetas += costo;
        });
        subTotalInput.value = totalCasetas.toFixed(2);
    }
}
function calcularTotal() {
    let total = 0;
    document.querySelectorAll("#gastosCards .gasto-card").forEach(card => {
        const subTotal = parseFloat(card.querySelector(".subTotal").value) || 0;
        total += subTotal;
    });
    const totalGastos = document.getElementById("totalGastos");
    if (totalGastos) {
        totalGastos.textContent = total.toFixed(2);
    }
}

// Cargar tipos de vehículo
async function cargarTiposVehiculo() {
    const select = document.getElementById("idUnidad");
    if (!select)
        return;

    try {
        const response = await fetch('https://transportesnaches.com.mx/api/unidad/getAllVehiculo');
        if (!response.ok)
            throw new Error('Error en la respuesta del servidor');

        const datos = await response.json();
        if (datos.error) {
            console.error('Error al obtener unidades:', datos.error);
            Swal.fire({
                title: 'Error',
                text: 'Error al obtener unidades',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        select.innerHTML = '<option value="">Seleccione una unidad</option>';
        datos.forEach(unidad => {
            const option = document.createElement("option");
            option.value = unidad.idUnidad;
            option.textContent = `${unidad.tipoVehiculo}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al cargar unidades',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

// Cargar tipos de gastos
async function cargarTiposGastos() {
    const selects = document.querySelectorAll(".tipoGasto");
    if (selects.length === 0)
        return;

    try {
        const response = await fetch('https://transportesnaches.com.mx/api/gasto/getAllTipoGasto');
        const datos = await response.json();

        if (datos.error) {
            console.error('Error al obtener tipos de gasto:', datos.error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar tipos de gasto',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        tiposGasto = datos;
        selects.forEach(select => {
            select.innerHTML = '<option value="">Seleccionar tipo de gasto</option>';
            datos.forEach(gasto => {
                const option = document.createElement("option");
                option.value = gasto.idTipoGasto;
                option.textContent = gasto.descripcion;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al cargar tipos de gasto',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

// Llenar combobox de tipo de gasto
async function llenarComboboxTipoGasto(selectElement) {
    if (!selectElement)
        return;

    try {
        const response = await fetch('https://transportesnaches.com.mx/api/gasto/getAllTipoGasto');
        const datos = await response.json();

        if (datos.error) {
            console.error('Error al obtener tipos de gasto:', datos.error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar tipos de gasto',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        tiposGasto = datos;
        selectElement.innerHTML = '<option value="">Seleccionar...</option>';
        datos.forEach(gasto => {
            const option = document.createElement("option");
            option.value = gasto.idTipoGasto;
            option.textContent = gasto.descripcion;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar tipos de gasto:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al conectar con el servidor al cargar tipos de gasto',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

// Volver/cancelar
function volver(event) {
    event.preventDefault();
    const pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
    const isIniciarFormVisible = !iniciarForm.classList.contains('hidden');
    const isFinalizarFormVisible = !finalizarForm.classList.contains('hidden');

    if (hayDatosNoGuardados()) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Tienes datos no guardados. Si sales, se perderán los datos del formulario y los gastos registrados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'No, quedarme',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280'
        }).then((result) => {
            if (result.isConfirmed) {
                navigationConfirmed = true;
                if (isIniciarFormVisible && pendingTrips.length > 0) {
                    // If in iniciarViajeForm and there are pending trips, go back to finalizarViajeForm
                    limpiarDatos();
                    setDetalleVisible(false);
                    cargarNotasUsuario();
                } else {
                    // Otherwise, go to menu
                    limpiarDatos();
                    window.location.href = '/menu';
                }
            }
        });
    } else {
        if (isIniciarFormVisible && pendingTrips.length > 0) {
            // If in iniciarViajeForm and there are pending trips, go back to finalizarViajeForm
            setDetalleVisible(false);
            cargarNotasUsuario();
        } else {
            // Otherwise, go to menu
            window.location.href = '/menu';
        }
    }
}


function limpiarDatos() {
    const iniciarForm = document.getElementById('iniciarViajeForm');
    const finalizarForm = document.getElementById('finalizarViajeForm');
    if (iniciarForm) {
        iniciarForm.reset();
        console.log('iniciarViajeForm reseteado');
    }
    if (finalizarForm) {
        finalizarForm.reset();
        console.log('finalizarViajeForm reseteado');
    }

    const fotoTablero = document.getElementById('fotoTablero');
    const fotoAcuse = document.getElementById('fotoAcuse');
    const fotoOtraInicio = document.getElementById('fotoOtraInicio');
    const fotoOtraFin = document.getElementById('fotoOtraFin');
    if (fotoTablero) {
        fotoTablero.value = '';
        console.log('fotoTablero reseteado');
    }
    if (fotoAcuse) {
        fotoAcuse.value = '';
        console.log('fotoAcuse reseteado');
    }
    if (fotoOtraInicio) {
        fotoOtraInicio.value = '';
        console.log('fotoOtraInicio reseteado');
    }
    if (fotoOtraFin) {
        fotoOtraFin.value = '';
        console.log('fotoOtraFin reseteado');
    }

    document.getElementById('vistaPreviaTablero').innerHTML = '';
    document.getElementById('vistaPreviaAcuse').innerHTML = '';
    document.getElementById('vistaPreviaOtraInicio').innerHTML = '';
    document.getElementById('vistaPreviaOtraFin').innerHTML = '';
    console.log('Vistas previas de imágenes reseteadas');

    const gasolinaLevelDiv = document.getElementById('gasolinaLevel');
    const gasolinaLevelInput = document.getElementById('gasolinaLevelInput');
    if (gasolinaLevelDiv) {
        gasolinaLevelDiv.classList.add('hidden');
        console.log('gasolinaLevel ocultado');
    }
    if (gasolinaLevelInput) {
        gasolinaLevelInput.value = '';
        console.log('gasolinaLevelInput reseteado');
    }
    document.querySelectorAll('.gas-level-btn').forEach(btn => {
        btn.classList.remove('bg-orange-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-800');
    });
    console.log('Botones de nivel de gasolina reseteados');

    const gastosCards = document.getElementById('gastosCards');
    if (gastosCards) {
        gastosCards.innerHTML = `
            <h2 class="text-xl font-bold text-gray-800 bg-orange-200 py-2 px-4 rounded-lg mb-4 text-center">Registro de Gastos</h2>
            <div id="gastosCards" class="sm:hidden block space-y-4"></div>
            <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div class="flex flex-col sm:flex-row gap-4">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" id="noGastos" name="noGastos">
                        No hubo gastos
                    </label>
                </div>
                <div class="text-lg font-bold text-gray-800">
                    <strong>Total:</strong> <span id="totalGastos" class="text-gray-800">0.00</span>
                </div>
            </div>
        `;
        setupNoGastosCheckbox();
        calcularTotal();
        console.log('gastosCards reseteado');
    }

    const destinosContainer = document.getElementById('destinosContainer');
    if (destinosContainer) {
        destinosContainer.innerHTML = `
            <div class="flex items-center destino-row">
                <input 
                    type="text" 
                    class="destino-input w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm focus:ring-2 focus:ring-orange-500" 
                    placeholder="Escribe una ciudad..." 
                    autocomplete="off">
                <button type="button" class="btnAgregarDestino ml-2 bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition">+</button>
            </div>
        `;
        console.log('Destinos reseteados a un solo input');
        const listaCiudades = document.getElementById('listaCiudades');
        if (listaCiudades) {
            listaCiudades.innerHTML = '';
            console.log('Lista de ciudades reseteada');
        }
        setupAutocompleter(destinosContainer.querySelector('.destino-input'));
        updateDestinoButtons();
    }

    // Modificación: Verificar si nombreOperador existe antes de acceder a value
    const nombreOperadorInput = document.getElementById('nombreOperador');
    const nombreOperador = localStorage.getItem('nombreCompleto');
    if (nombreOperadorInput && nombreOperador) {
        nombreOperadorInput.value = nombreOperador;
        console.log('nombreOperador reinicializado con:', nombreOperador);
    } else {
        console.log('nombreOperador no encontrado en el DOM o en localStorage');
    }

    const gasolinaInicio = document.getElementById('gasolinaInicio');
    if (gasolinaInicio) {
        gasolinaInicio.checked = false;
        console.log('GasolinaInicio desmarcado');
    }

    localStorage.removeItem('idNota');
    localStorage.removeItem('pendingTrips');
    localStorage.removeItem('notaBitacora');
    console.log('Datos de localStorage (idNota, pendingTrips, notaBitacora) eliminados');
}

function proceedWithNavigation() {
    window.location.href = '/menu';
}

function resetFormsAndRedirect() {
    document.getElementById("iniciarViajeForm")?.reset();
    document.getElementById("finalizarViajeForm")?.reset();
    document.getElementById("gastosCards").innerHTML = "";
    document.getElementById("totalGastos").textContent = "0.00";
    localStorage.removeItem('idNota');
    window.location.href = "/menu";
}

function showWarning() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se perderán los datos no guardados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, volver',
        cancelButtonText: 'No, cancelar',
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#6b7280',
    }).then((result) => {
        if (result.isConfirmed) {
            resetFormsAndRedirect();
        }
    });
}

// Mostrar vista previa de imágenes
// Mostrar vista previa de imágenes
function mostrarVistaPrevia(event, idVistaPrevia) {
    const archivo = event.target.files[0];
    const vistaPrevia = document.getElementById(idVistaPrevia);

    if (archivo) {
        const reader = new FileReader();
        reader.onload = function (e) {
            vistaPrevia.innerHTML = `<img src="${e.target.result}" alt="Vista previa" class="max-w-full h-auto rounded-lg">`;
        };
        reader.readAsDataURL(archivo);
    }
}

// Convertir a base64
function convertirABase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        // Create an image element
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;

            img.onload = () => {
                // Create a canvas to resize the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 800; // Max width for resized image
                const MAX_HEIGHT = 600; // Max height for resized image
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 with compression (JPEG quality 0.7)
                const base64String = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                resolve(base64String);
            };

            img.onerror = () => reject("Error al cargar la imagen");
        };

        reader.onerror = () => reject("Error al leer el archivo");
        reader.readAsDataURL(file);
    });
}

// Obtener gastos
function obtenerGastos() {
    const gastosCards = document.querySelectorAll("#gastosCards .gasto-card");
    const gastos = [];
    let total = 0;

    gastosCards.forEach((card, index) => {
        const tipoGastoSelect = card.querySelector(".tipoGasto");
        const tipoGastoId = parseInt(tipoGastoSelect.value) || 0;
        const tipoGastoText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
        const subTotal = parseFloat(card.querySelector(".subTotal").value) || 0;
        const tipoPagoSelect = card.querySelector(".tipoPago");
        const tipoPago = tipoPagoSelect ? tipoPagoSelect.value : null;

        if (tipoGastoId <= 0) {
            console.warn(`Gasto ${index + 1} ignorado: idTipoGasto inválido (${tipoGastoId})`);
            return;
        }
        if (subTotal <= 0) {
            console.warn(`Gasto ${index + 1} ignorado: subTotal inválido (${subTotal})`);
            return;
        }
        if (!tipoPago) {
            console.warn(`Gasto ${index + 1} ignorado: tipoPago no especificado`);
            return;
        }

        total += subTotal;

        const gasto = {
            noGasto: index + 1,
            cantidad: 1,
            tipoGasto: {
                idTipoGasto: tipoGastoId
            },
            tipoPago: tipoPago,
            subTotal: subTotal,
            total: subTotal,
            costoUnitario: subTotal
        };

        if (tipoGastoText === "Combustible") {
            const tipoGasSelect = card.querySelector(".tipoGas");
            const valorLitro = parseFloat(card.querySelector(".valorLitro").value) || 0;
            if (tipoGasSelect) {
                gasto.tipoGas = tipoGasSelect.value;
                console.log(`Tipo de gasolina para gasto ${index + 1}: ${gasto.tipoGas}`);
            }
            gasto.valorLitro = valorLitro;
            console.log(`Valor por litro para gasto ${index + 1}: ${gasto.valorLitro}`);
        }

        if (tipoGastoText === "Caseta") {
            const casetas = card.querySelectorAll(".caseta-row");
            const detallesCasetas = [];
            casetas.forEach(caseta => {
                const nombre = caseta.querySelector(".nombreCaseta")?.value;
                const costo = parseFloat(caseta.querySelector(".costoCaseta")?.value) || 0;
                if (nombre && costo > 0) {
                    detallesCasetas.push({
                        nombreCaseta: nombre,
                        costoCaseta: costo
                    });
                }
            });

            if (detallesCasetas.length > 0) {
                gasto.detalleCaseta = JSON.stringify(detallesCasetas);
                console.log(`Detalles de casetas para gasto ${index + 1}: ${gasto.detalleCaseta}`);
            }
        }

        console.log(`Gasto ${index + 1} preparado:`, gasto);
        gastos.push(gasto);
    });

    console.log('Gastos finales a enviar:', gastos);
    return {gastos, total};
}

// Cargar clientes
async function cargarClientes() {
    const select = document.getElementById("nombreCliente");
    if (!select)
        return;

    try {
        const response = await fetch('https://transportesnaches.com.mx/api/cliente/getAll');
        const clientes = await response.json();

        if (clientes.error) {
            console.error('Error al obtener clientes:', clientes.error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar clientes',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316'
            });
            return;
        }

        // Filtrar clientes activos
        const clientesActivos = clientes.filter(cliente => cliente.activoCliente === 1);
        console.log('Clientes activos cargados:', clientesActivos.length, clientesActivos);

        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        clientesActivos.forEach(cliente => {
            const persona = cliente.persona || {};
            // Construir el nombre completo del cliente
            const nombreCompleto = [
                persona.nombre || '',
                persona.apellidoPaterno || '',
                persona.apellidoMaterno || ''
            ].filter(Boolean).join(' ').trim();

            if (nombreCompleto) { // Solo agregar si hay un nombre válido
                const option = document.createElement("option");
                option.value = cliente.nombreCliente; // Usar idCliente como value para evitar duplicados
                option.textContent = nombreCompleto;
                select.appendChild(option);
            }
        });

        console.log('Opciones generadas en el select:', select.options.length - 1); // -1 para excluir la opción "Seleccione un cliente"
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al cargar clientes',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316'
        });
    }
}

document.getElementById('viajePendiente')?.addEventListener('change', function () {
    console.log('Change event triggered, selected value:', this.value);
    const selectedIdNota = this.value;
    if (selectedIdNota) {
        localStorage.setItem('idNota', selectedIdNota);
        mostrarDatosNota(selectedIdNota);
    } else {
        localStorage.removeItem('idNota');
        document.getElementById('datosNota').innerHTML = `
            <button type="button" id="registrarOtroViaje" class="bg-green-600 text-white py-2 px-6 rounded flex items-center gap-2 hover:bg-green-700 transition mt-4 hidden">
                <i class="fas fa-plus"></i> Registrar Otro Viaje
            </button>
        `;
    }
});



// prueba te amo
// te amo mas 
// yo mas soy karla
// hola papi

//ola