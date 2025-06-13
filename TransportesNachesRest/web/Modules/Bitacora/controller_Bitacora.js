let isSaving = false;
const tiposGasStatic = [
    {idTipoGas: 1, nombreGas: "Diésel"},
    {idTipoGas: 2, nombreGas: "Gasolina"}
];
let tiposGasto = [];

const iniciarForm = document.getElementById('iniciarViajeForm');
const finalizarForm = document.getElementById('finalizarViajeForm');

document.addEventListener("DOMContentLoaded", () => {
    inicializarBitacora();
    assignEventListeners();
    setupNoGastosCheckbox();
    document.querySelectorAll('.destino-input').forEach(input => setupAutocompleter(input));
    document.getElementById('gasolinaInicio')?.addEventListener('change', function () {
        const gasolinaLevelDiv = document.getElementById('gasolinaLevel');
        gasolinaLevelDiv.classList.toggle('hidden', !this.checked);
        if (!this.checked) {
            document.getElementById('gasolinaLevelInput').value = '';
            document.querySelectorAll('.gas-level-btn').forEach(btn => {
                btn.classList.remove('bg-orange-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-800');
            });
        }
    });
    interceptarNavegacion();
    const initialButton = document.querySelector('.btnAgregarDestino');
    if (initialButton)
        initialButton.addEventListener('click', handleDestinoButtonClick);
    updateDestinoButtons();
});

function assignEventListeners() {
    const elements = {
        iniciarViaje: {id: "iniciarViaje", handler: iniciarViaje},
        finalizarViaje: {id: "finalizarViaje", handler: finalizarViaje},
        agregarGasto: {id: "agregarGasto", handler: agregarGasto},
        fotoTablero: {id: "fotoTablero", handler: e => mostrarVistaPrevia(e, "vistaPreviaTablero")},
        fotoAcuse: {id: "fotoAcuse", handler: e => mostrarVistaPrevia(e, "vistaPreviaAcuse")},
        fotoOtraInicio: {id: "fotoOtraInicio", handler: e => mostrarVistaPrevia(e, "vistaPreviaOtraInicio")},
        fotoOtraFin: {id: "fotoOtraFin", handler: e => mostrarVistaPrevia(e, "vistaPreviaOtraFin")}
    };
    Object.values(elements).forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.removeEventListener("click", handler);
            element.removeEventListener("change", handler);
            element.addEventListener(element.tagName === "INPUT" ? "change" : "click", handler);
    }
    });
    document.querySelectorAll(".btnVolver").forEach(btn => {
        btn.removeEventListener("click", volver);
        btn.addEventListener("click", volver);
    });
}

function hayDatosNoGuardados() {
    if (isSaving)
        return false;
    const forms = [iniciarForm, finalizarForm].filter(form => form && !form.classList.contains('hidden'));
    for (const form of forms) {
        for (const input of form.querySelectorAll('input, select, textarea')) {
            if (input.value.trim() && input.id !== 'gasolinaInicio')
                return true;
        }
    }
    if (document.getElementById('fotoTablero')?.files?.length > 0 || document.getElementById('fotoAcuse')?.files?.length > 0)
        return true;
    return document.getElementById('gastosCards')?.children.length > 0 || document.getElementById('listaCiudades')?.children.length > 0;
}

function agregarDestinoInput() {
    const container = document.getElementById('destinosContainer');
    const newRow = document.createElement('div');
    newRow.classList.add('flex', 'items-center', 'destino-row', 'mt-2');
    newRow.innerHTML = `
        <input type="text" class="destino-input w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm focus:ring-2 focus:ring-orange-500" placeholder="Escribe una ciudad..." autocomplete="off">
        <div class="flex items-center ml-2 gap-2">
            <button type="button" class="btnAgregarDestino bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition">+</button>
            <button type="button" class="btnEliminarDestino text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash-alt"></i></button>
        </div>`;
    container.appendChild(newRow);
    setupAutocompleter(newRow.querySelector('.destino-input'));
    updateDestinoButtons();
    newRow.querySelector('.destino-input').focus();
}

function interceptarNavegacion() {
    document.querySelectorAll('a[href], button:not(#iniciarViaje, #finalizarViaje, #agregarGasto, #btnVolver, #menuButton, #cerrarSesion, #sidebar, .fuel-level-btn, .btnAgregarDestino, #registrarOtroViaje, #gestionAdmin, #gestionSubmenu)').forEach(element => {
        element.addEventListener('click', e => {
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
                }).then(result => {
                    if (result.isConfirmed) {
                        if (element.tagName === 'A')
                            window.location.href = element.href;
                        else
                            element.click();
                    }
                });
            }
        });
    });
}

async function inicializarBitacora() {
    iniciarForm?.classList.add("hidden");
    finalizarForm?.classList.add("hidden");
    await cargarNotasUsuario();
    cargarTiposVehiculo();
    cargarTiposGastos();
    cargarClientes();
}

async function cargarNotasUsuario() {
    const idUsuario = localStorage.getItem("idUsuario");
    if (!idUsuario) {
        mostrarError('Error', 'No se encontró el ID del usuario. Por favor, inicia sesión nuevamente.').then(() => {
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
            mostrarError('Error', 'Error al obtener las notas: ' + notas.error);
            return;
        }
        const pendingTrips = notas.filter(nota => !nota.fechaLlegada || !nota.horaLlegada).map(nota => ({
                idNota: nota.idNota,
                destino: nota.destino || 'No especificado',
                cliente: nota.cliente?.nombreCliente || nota.nombreCliente || 'No especificado'
            }));
        localStorage.setItem('pendingTrips', JSON.stringify(pendingTrips));
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
        if (pendingTrips.length > 0) {
            const primeraNota = pendingTrips[0];
            localStorage.setItem("idNota", primeraNota.idNota);
            setDetalleVisible(false);
            mostrarDatosNota(primeraNota.idNota);
            if (viajePendienteSelect) {
                viajePendienteSelect.value = primeraNota.idNota;
                viajePendienteSelect.dispatchEvent(new Event('change'));
            }
            Swal.fire({
                title: 'Viajes pendientes',
                text: `Tienes ${pendingTrips.length} viaje(s) pendiente(s) hacia: ${pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ')}. Por favor, finalízalos o inicia uno nuevo.`,
                icon: 'info',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316'
            });
        } else {
            setDetalleVisible(true);
            localStorage.removeItem("idNota");
            localStorage.removeItem('pendingTrips');
            if (viajePendienteSelect)
                viajePendienteSelect.innerHTML = '<option value="">Seleccione un viaje...</option>';
        }
    } catch (error) {
        console.error('Error al cargar notas:', error);
        mostrarError('Error', 'Error al conectar con el servidor al cargar las notas');
    }
}

async function iniciarViaje(event) {
    event.preventDefault();
    if (!validarCamposIniciarViaje())
        return;
    let pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
    if (pendingTrips.length >= 2) {
        mostrarError('Límite alcanzado', `Ya tienes 2 viajes pendientes hacia: ${pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ')}. Finaliza uno antes de iniciar otro.`);
        return;
    }
    if (pendingTrips.length > 0) {
        const result = await mostrarAlerta('¿Estás seguro de iniciar otro viaje?', `Tienes un viaje pendiente hacia: ${pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ')}. ¿Deseas iniciar un nuevo viaje?`);
        if (!result.isConfirmed)
            return;
    }
    const form = document.getElementById('iniciarViajeForm');
    const formData = new FormData(form);
    const destinosArray = Array.from(document.querySelectorAll('.destino-input')).map(input => input.value.trim().split(',')[0].trim()).filter(destino => destino);
    const destinos = destinosArray.length === 0 ? '' : destinosArray.length === 1 ? destinosArray[0] : `${destinosArray.slice(0, -1).join(', ')} y ${destinosArray[destinosArray.length - 1]}`;
    formData.set('destino', destinos);
    const now = new Date();
    const fechaActual = now.toISOString().split('T')[0];
    const horaSalida = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    if (!/^([01]\d|2[0-3]):([0-5]\d):00$/.test(horaSalida)) {
        mostrarError('Error', 'La hora de salida generada es inválida. Contacta al administrador.');
        return;
    }
    const datosNota = {
        nombreOperador: localStorage.getItem("nombreCompleto"),
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
            mostrarError('Error', 'Error al iniciar el viaje: ' + result.error);
            isSaving = false;
            return;
        }
        if (result.idNota) {
            pendingTrips.push({idNota: result.idNota, destino: destinos, cliente: datosNota.nombreCliente});
            localStorage.setItem('pendingTrips', JSON.stringify(pendingTrips));
            localStorage.setItem("idNota", result.idNota);
        }
        await mostrarExito('Éxito', result.result || 'Viaje iniciado correctamente.');
        resetForms();
        setDetalleVisible(false);
        mostrarDatosNota(result.idNota);
        cargarNotasUsuario();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error', 'Error al conectar con el servidor');
        isSaving = false;
    }
}

function validarCamposIniciarViaje() {
    const campos = [
        {id: "nombreCliente", mensaje: "El nombre del cliente es obligatorio"},
        {id: "origen", mensaje: "El origen es obligatorio"},
        {id: "idUnidad", mensaje: "Debe seleccionar una unidad"},
        {id: "kmInicio", mensaje: "El kilometraje inicial es obligatorio"},
        {id: "fotoTablero", mensaje: "Foto Tablero es obligatorio"}
    ];
    for (const {id, mensaje} of campos) {
        const elemento = document.getElementById(id);
        if (!elemento || !elemento.value.trim()) {
            mostrarError('Campo requerido', mensaje);
            elemento?.focus();
            return false;
        }
    }
    const destinos = Array.from(document.querySelectorAll('.destino-input')).map(input => input.value.trim()).filter(value => value);
    if (destinos.length === 0) {
        mostrarError('Destino requerido', 'Debe agregar al menos un destino.');
        document.querySelector('.destino-input').focus();
        return false;
    }
    const gasolinaInicio = document.getElementById('gasolinaInicio');
    const gasolinaLevel = document.getElementById('gasolinaLevelInput');
    if (gasolinaInicio.checked && !gasolinaLevel.value) {
        mostrarError('Nivel de gasolina requerido', 'Por favor, selecciona un nivel de gasolina (1/4, 1/2, o 1).');
        return false;
    }
    return true;
}

async function mostrarDatosNota(idNota) {
    if (!idNota) {
        mostrarError('Error', 'No se encontró el ID de la nota en el almacenamiento local.');
        return;
    }
    try {
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        const nota = await response.json();
        if (nota.error) {
            mostrarError('Error', 'Error al obtener la nota: ' + nota.error);
            return;
        }
        const destinos = nota.destino ? nota.destino.split(', ').map(d => d.trim()) : ['No especificado'];
        const datosNotaDiv = document.getElementById('datosNota');
        datosNotaDiv.innerHTML = `
            <h3 class="text-lg font-bold text-white mb-4">Datos del Viaje (No editables)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg">
 joke                <p><strong class="text-gradient-start">Cliente:</strong> ${nota.cliente?.nombreCliente || nota.nombreCliente || 'No especificado'}</p>
                <p><strong class="text-gradient-start">Fecha Salida:</strong> ${nota.fechaSalida || 'No especificada'}</p>
                <p><strong class="text-gradient-start">Origen:</strong> ${nota.origen || 'León'}</p>
                <p><strong class="text-gradient-start">Destinos:</strong> ${destinos.join(', ') || 'No especificado'}</p>
                <p><strong class="text-gradient-start">Unidad:</strong> ${nota.unidad?.tipoVehiculo || nota.tipoVehiculo || 'No especificada'}</p>
                <p><strong class="text-gradient-start">Hora Salida:</strong> ${nota.horaSalida || 'No especificada'}</p>
            </div>
            <button type="button" id="registrarOtroViaje" class="bg-green-600 text-white py-2 px-6 rounded flex items-center gap-2 hover:bg-green-700 transition mt-4 ${document.getElementById('viajePendiente')?.value ? '' : 'hidden'}">
                <i class="fas fa-plus"></i> Registrar Otro Viaje
            </button>`;
        document.getElementById('registrarOtroViaje')?.addEventListener('click', () => {
            let pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
            if (pendingTrips.length >= 2) {
                mostrarError('Límite alcanzado', `Ya tienes 2 viajes pendientes hacia: ${pendingTrips.map(trip => `${trip.destino} (Cliente: ${trip.cliente})`).join(', ')}. Finaliza uno antes de iniciar otro.`);
                return;
            }
            resetForms();
            setDetalleVisible(true);
            document.getElementById('registrarOtroViaje')?.classList.add('hidden');
            document.getElementById('viajePendiente').value = '';
            document.getElementById('viajePendiente')?.dispatchEvent(new Event('change'));
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error', 'Error al conectar con el servidor');
    }
}

function setDetalleVisible(visible) {
    if (visible) {
        iniciarForm?.classList.remove("hidden");
        finalizarForm?.classList.add("hidden");
    } else {
        iniciarForm?.classList.add("hidden");
        finalizarForm?.classList.remove("hidden");
    }
}

async function finalizarViaje(event) {
    event.preventDefault();
    if (!validarCamposFinalizarViaje())
        return;
    const form = document.getElementById('finalizarViajeForm');
    const formData = new FormData(form);
    const idNota = parseInt(localStorage.getItem('idNota'));
    if (!idNota) {
        mostrarError('Error', 'No se ha seleccionado un viaje para finalizar. Por favor, selecciona un viaje pendiente.');
        return;
    }
    const noGastosCheckbox = document.getElementById("noGastos");
    const {gastos, total} = noGastosCheckbox?.checked ? {gastos: [], total: 0} : obtenerGastos();
    const now = new Date();
    const horaLlegada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    if (!/^([01]\d|2[0-3]):([0-5]\d):00$/.test(horaLlegada)) {
        mostrarError('Error', 'La hora de llegada generada es inválida. Contacta al administrador.');
        return;
    }
    const datosNota = {
        idNota: idNota,
        fechaLlegada: new Date().toISOString().split('T')[0],
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
        const response = await fetch('https://transportesnaches.com.mx/api/nota/finalizarViaje', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({datosNota: JSON.stringify(datosNota)})
        });
        const result = await response.json();
        if (!response.ok || result.error)
            throw new Error(result.error || 'Error en la respuesta del servidor');
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
            cancelButtonColor: '#6b7280'
        }).then(result => {
            resetForms();
            if (result.isConfirmed) {
                setDetalleVisible(true);
                iniciarForm?.scrollIntoView({behavior: 'smooth'});
            } else {
                localStorage.removeItem('idNota');
                localStorage.removeItem('notaBitacora');
                window.location.href = "/menu";
            }
            isSaving = false;
        });
    } catch (error) {
        console.error('Error al finalizar el viaje:', error);
        mostrarError('Error', `Error al finalizar el viaje: ${error.message || 'Error al conectar con el servidor'}`);
        isSaving = false;
    }
}

function resetForms() {
    [iniciarForm, finalizarForm].forEach(form => form?.reset());
    ['fotoTablero', 'fotoAcuse', 'fotoOtraInicio', 'fotoOtraFin'].forEach(id => {
        const input = document.getElementById(id);
        if (input)
            input.value = '';
    });
    ['vistaPreviaTablero', 'vistaPreviaAcuse', 'vistaPreviaOtraInicio', 'vistaPreviaOtraFin'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
    const gasolinaLevelDiv = document.getElementById('gasolinaLevel');
    const gasolinaLevelInput = document.getElementById('gasolinaLevelInput');
    if (gasolinaLevelDiv)
        gasolinaLevelDiv.classList.add('hidden');
    if (gasolinaLevelInput)
        gasolinaLevelInput.value = '';
    document.querySelectorAll('.gas-level-btn').forEach(btn => {
        btn.classList.remove('bg-orange-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-800');
    });
    const gastosCards = document.getElementById('gastosCards');
    if (gastosCards) {
        gastosCards.innerHTML = `
            <h2 class="text-xl font-bold text-gray-800 bg-orange-200 py-2 px-4 rounded-lg mb-4 text-center">Registro de Gastos</h2>
            <div id="gastosCards" class="sm:hidden block space-y-4"></div>
            <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div class="flex flex-col sm:flex-row gap-4">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" id="noGastos" name="noGastos"> No hubo gastos
                    </label>
                </div>
                <div class="text-lg font-bold text-gray-800">
                    <strong>Total:</strong> <span id="totalGastos" class="text-gray-800">0.00</span>
                </div>
            </div>`;
        setupNoGastosCheckbox();
        calcularTotal();
    }
    const destinosContainer = document.getElementById('destinosContainer');
    if (destinosContainer) {
        destinosContainer.innerHTML = `
            <div class="flex items-center destino-row">
                <input type="text" class="destino-input w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm focus:ring-2 focus:ring-orange-500" placeholder="Escribe una ciudad..." autocomplete="off">
                <button type="button" class="btnAgregarDestino ml-2 bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition">+</button>
            </div>`;
        setupAutocompleter(destinosContainer.querySelector('.destino-input'));
        updateDestinoButtons();
    }
    const nombreOperadorInput = document.getElementById('nombreOperador');
    const nombreOperador = localStorage.getItem('nombreCompleto');
    if (nombreOperadorInput && nombreOperador)
        nombreOperadorInput.value = nombreOperador;
    const gasolinaInicio = document.getElementById('gasolinaInicio');
    if (gasolinaInicio)
        gasolinaInicio.checked = false;
    const registrarOtroViajeBtn = document.getElementById('registrarOtroViaje');
    if (registrarOtroViajeBtn)
        registrarOtroViajeBtn.classList.add('hidden');
}

function validarCamposFinalizarViaje() {
    const campos = [
        {id: "kmFinal", mensaje: "El kilometraje final es obligatorio"},
        {id: "noEntrega", mensaje: "El número de entregas es obligatorio"},
        {id: "fotoAcuse", mensaje: "Foto Acuse es obligatorio"}
    ];
    for (const {id, mensaje} of campos) {
        const elemento = document.getElementById(id);
        if (!elemento || !elemento.value.trim()) {
            mostrarError('Campo requerido', mensaje);
            elemento?.focus();
            return false;
        }
    }
    const noGastosCheckbox = document.getElementById("noGastos");
    const gastos = document.querySelectorAll("#gastosCards .gasto-card");
    if (!noGastosCheckbox?.checked && gastos.length === 0) {
        mostrarError('Gastos requeridos', 'Debe registrar al menos un gasto o marcar "No hubo gastos".');
        return false;
    }
    for (let i = 0; i < gastos.length; i++) {
        const tipoGastoSelect = gastos[i].querySelector(".tipoGasto");
        if (!tipoGastoSelect) {
            mostrarError('Error', `El gasto ${i + 1} no tiene un tipo de gasto válido. Por favor, elimina este gasto y vuelve a agregarlo.`);
            return false;
        }
        const tipoGastoId = tipoGastoSelect.value;
        const tipoGastoText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
        const tipoPago = gastos[i].querySelector(".tipoPago").value;
        const subTotal = parseFloat(gastos[i].querySelector(".subTotal").value) || 0;
        if (!tipoGastoId || isNaN(parseInt(tipoGastoId)) || parseInt(tipoGastoId) <= 0) {
            mostrarError('Tipo de gasto requerido', `Por favor, selecciona un tipo de gasto válido para el gasto ${i + 1}.`);
            gastos[i].querySelector(".tipoGasto").focus();
            return false;
        }
        if (subTotal <= 0) {
            mostrarError('Subtotal requerido', `Por favor, ingresa un subtotal válido para el gasto ${i + 1}.`);
            gastos[i].querySelector(".subTotal").focus();
            return false;
        }
        if (!tipoPago) {
            mostrarError('Tipo de pago requerido', `Por favor, selecciona un tipo de pago para el gasto ${i + 1}.`);
            gastos[i].querySelector(".tipoPago").focus();
            return false;
        }
        if (tipoGastoText === "Combustible") {
            const tipoGas = gastos[i].querySelector(".tipoGas").value;
            if (!tipoGas || !["Diésel", "Gasolina"].includes(tipoGas)) {
                mostrarError('Tipo de gasolina requerido', `Por favor, selecciona un tipo de gasolina para el gasto ${i + 1}.`);
                gastos[i].querySelector(".tipoGas").focus();
                return false;
            }
        } else if (tipoGastoText === "Caseta") {
            const casetas = gastos[i].querySelectorAll(".caseta-row");
            for (let j = 0; j < casetas.length; j++) {
                const nombreCaseta = casetas[j].querySelector(".nombreCaseta").value;
                const costoCaseta = parseFloat(casetas[j].querySelector(".costoCaseta").value) || 0;
                if (!nombreCaseta) {
                    mostrarError('Nombre de caseta requerido', `Por favor, selecciona una caseta ${j + 1} del gasto ${i + 1}.`);
                    casetas[j].querySelector(".nombreCaseta").focus();
                    return false;
                }
                if (costoCaseta <= 0) {
                    mostrarError('Costo de caseta requerido', `Por favor, ingresa un costo válido para la caseta ${j + 1} del gasto ${i + 1}.`);
                    casetas[j].querySelector(".costoCaseta").focus();
                    return false;
                }
            }
        }
    }
    return true;
}

function setupNoGastosCheckbox() {
    const noGastosCheckbox = document.getElementById("noGastos");
    const agregarGastoBtn = document.getElementById("agregarGasto");
    if (noGastosCheckbox && agregarGastoBtn) {
        noGastosCheckbox.addEventListener('change', function () {
            agregarGastoBtn.classList.toggle('hidden', this.checked);
            if (this.checked) {
                document.querySelectorAll('#gastosCards .gasto-card').forEach(card => card.remove());
                document.getElementById('totalGastos').textContent = '0.00';
            }
            calcularTotal();
        });
        agregarGastoBtn.classList.toggle('hidden', noGastosCheckbox.checked);
    }
}

function setupAutocompleter(input) {
    const suggestionsContainer = document.getElementById('sugerenciasDestino');
    suggestionsContainer.className = 'absolute z-50 bg-white border border-orange-300 rounded-lg max-h-48 overflow-y-auto hidden';
    function positionSuggestions() {
        const rect = input.getBoundingClientRect();
        suggestionsContainer.style.width = `${rect.width}px`;
        suggestionsContainer.style.top = `${rect.bottom + window.scrollY + 2}px`;
        suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
    }
    function closeSuggestions() {
        suggestionsContainer.classList.add('hidden');
        suggestionsContainer.innerHTML = '';
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
            if (!response.ok)
                throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            suggestionsContainer.innerHTML = Array.isArray(data) && data.length ? data.map(city => `
                <li class="px-4 py-2 hover:bg-orange-600 hover:text-white cursor-pointer">${city.ciudad.split(',')[0].trim()}</li>
            `).join('') : '<li class="px-4 py-2 text-gray-500">No se encontraron ciudades</li>';
            suggestionsContainer.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', () => {
                    input.value = li.textContent;
                    closeSuggestions();
                });
            });
            positionSuggestions();
            suggestionsContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            suggestionsContainer.innerHTML = '<li class="px-4 py-2 text-gray-500">Error al cargar sugerencias</li>';
            positionSuggestions();
            suggestionsContainer.classList.remove('hidden');
        }
    });
    input.addEventListener('focus', () => input.value.trim().length >= 2 && input.dispatchEvent(new Event('input')));
    input.addEventListener('blur', () => setTimeout(closeSuggestions, 200));
    const handleScroll = () => {
        if (!suggestionsContainer.classList.contains('hidden')) {
            const rect = input.getBoundingClientRect();
            if (rect.bottom <= 0 || rect.top >= window.innerHeight)
                closeSuggestions();
            else
                positionSuggestions();
        }
    };
    window.addEventListener('scroll', handleScroll);
    if (scrollableParent !== window)
        scrollableParent.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => !suggestionsContainer.classList.contains('hidden') && positionSuggestions());
}

function getScrollableParent(element) {
    let parent = element.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight)
            return parent;
        parent = parent.parentElement;
    }
    return null;
}

function eliminarDestinoInput(event) {
    const row = event.target.closest('.destino-row');
    const container = document.getElementById('destinosContainer');
    if (container.querySelectorAll('.destino-row').length > 1) {
        container.removeChild(row);
        updateDestinoButtons();
    } else {
        mostrarError('Advertencia', 'Debe haber al menos un campo de destino.');
    }
}

function updateDestinoButtons() {
    const rows = document.getElementById('destinosContainer').querySelectorAll('.destino-row');
    rows.forEach((row, index) => {
        const addButton = row.querySelector('.btnAgregarDestino');
        const deleteButton = row.querySelector('.btnEliminarDestino');
        if (addButton) {
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

function handleDestinoButtonClick(event) {
    const input = event.target.closest('.destino-row').querySelector('.destino-input');
    if (input.value.trim())
        agregarDestinoInput();
    else
        mostrarError('Error', 'Por favor, ingresa un destino válido.');
}

async function cargarCasetas(selectElement) {
    if (!selectElement)
        return;
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/caseta/getAll', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        if (!response.ok)
            throw new Error('Error en la respuesta del servidor');
        const casetas = await response.json();
        selectElement.innerHTML = '<option value="">Seleccionar caseta...</option>' + casetas.map(caseta => `<option value="${caseta.nombre}">${caseta.nombre}</option>`).join('');
    } catch (error) {
        console.error('Error al cargar casetas:', error);
        mostrarError('Error', 'Error al cargar las casetas');
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
        <button type="button" class="eliminarCasetaBtn bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition shadow-md">
            <i class="fas fa-trash-alt"></i>
        </button>`;
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
            <button type="button" class="btnEliminar bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition shadow-md">
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
            <button type="button" class="agregarCasetaBtn bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition mt-2 w-full"><i class="fas fa-plus"></i> Agregar Caseta</button>
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
        </div>`;
    llenarComboboxTipoGasto(card.querySelector(".tipoGasto"));
    const tipoGastoSelect = card.querySelector(".tipoGasto");
    const tipoPagoSelect = card.querySelector(".tipoPago");
    const subTotalInput = card.querySelector(".subTotal");
    const updateTipoPagoOptions = () => {
        const selectedText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
        tipoPagoSelect.innerHTML = '<option value="">Seleccionar...</option>';
        const options = selectedText === "Caseta" ? ["Efectivo", "Tag"] : selectedText === "Combustible" ? ["Efectivo", "Toka"] : ["Efectivo", "Tarjeta"];
        options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            tipoPagoSelect.appendChild(option);
        });
    };
    const toggleColumns = () => {
        const selectedTipoGasto = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
        card.querySelector(".detalleCasetaCell").classList.toggle("hidden", selectedTipoGasto !== "Caseta");
        card.querySelector(".tipoGasCell").classList.toggle("hidden", selectedTipoGasto !== "Combustible");
        card.querySelector(".valorLitroCell").classList.toggle("hidden", selectedTipoGasto !== "Combustible");
        card.querySelector(".tipoPagoCell").classList.toggle("hidden", !selectedTipoGasto);
        subTotalInput.readOnly = selectedTipoGasto === "Caseta";
        [".tipoGas", ".valorLitro", ".tipoPago"].forEach(selector => card.querySelector(selector)?.toggleAttribute("required", selectedTipoGasto === "Combustible" || selectedTipoGasto));
        if (selectedTipoGasto === "Caseta" && !card.querySelector(".casetasContainer").children.length)
            agregarCaseta(card);
    };
    tipoGastoSelect.addEventListener("change", () => {
        toggleColumns();
        updateTipoPagoOptions();
        calcularTotal();
    });
    subTotalInput.addEventListener("input", calcularTotal);
    card.querySelector(".agregarCasetaBtn")?.addEventListener("click", () => agregarCaseta(card));
    card.querySelector(".btnEliminar").addEventListener("click", () => {
        gastosCards.removeChild(card);
        calcularTotal();
    });
    gastosCards.prepend(card);
    toggleColumns();
    updateTipoPagoOptions();
    calcularTotal();
}

function calcularSubTotal(fila) {
    const tipoGastoSelect = fila.querySelector(".tipoGasto");
    const selectedTipoGasto = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
    const subTotalInput = fila.querySelector(".subTotal");
    if (selectedTipoGasto === "Caseta") {
        let totalCasetas = 0;
        fila.querySelectorAll(".caseta-row").forEach(caseta => {
            totalCasetas += parseFloat(caseta.querySelector(".costoCaseta").value) || 0;
        });
        subTotalInput.value = totalCasetas.toFixed(2);
    }
}

function calcularTotal() {
    const total = Array.from(document.querySelectorAll("#gastosCards .gasto-card")).reduce((sum, card) => sum + (parseFloat(card.querySelector(".subTotal").value) || 0), 0);
    document.getElementById("totalGastos").textContent = total.toFixed(2);
}

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
            mostrarError('Error', 'Error al obtener unidades');
            return;
        }
        // Ordenar unidades alfabéticamente por tipoVehiculo
        const unidadesOrdenadas = datos.sort((a, b) =>
            a.tipoVehiculo.localeCompare(b.tipoVehiculo, 'es', {sensitivity: 'base'})
        );
        select.innerHTML = '<option value="">Seleccione una unidad</option>' +
                unidadesOrdenadas.map(unidad => `<option value="${unidad.idUnidad}">${unidad.tipoVehiculo}</option>`).join('');
    } catch (error) {
        console.error('Error al cargar unidades:', error);
        mostrarError('Error', 'Error al cargar unidades');
    }
}

async function cargarTiposGastos() {
    const selects = document.querySelectorAll(".tipoGasto");
    if (!selects.length)
        return;
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/gasto/getAllTipoGasto');
        const datos = await response.json();
        if (datos.error) {
            mostrarError('Error', 'Error al cargar tipos de gasto');
            return;
        }
        tiposGasto = datos;
        selects.forEach(select => {
            select.innerHTML = '<option value="">Seleccionar tipo de gasto</option>' + datos.map(gasto => `<option value="${gasto.idTipoGasto}">${gasto.descripcion}</option>`).join('');
        });
    } catch (error) {
        console.error('Error al cargar tipos de gasto:', error);
        mostrarError('Error', 'Error al obtener tipos de gasto');
    }
}

async function llenarComboboxTipoGasto(selectElement) {
    if (!selectElement)
        return;
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/gasto/getAllTipoGasto');
        const datos = await response.json();
        if (datos.error) {
            mostrarError('Error', 'Error al cargar tipos de gasto');
            return;
        }
        tiposGasto = datos;
        selectElement.innerHTML = '<option value="">Seleccionar...</option>' + datos.map(gasto => `<option value="${gasto.idTipoGasto}">${gasto.descripcion}</option>`).join('');
    } catch (error) {
        console.error('Error al cargar tipos de gasto:', error);
        mostrarError('Error', 'Error al obtener tipos de gasto');
    }
}

function volver(event) {
    event.preventDefault();
    const pendingTrips = JSON.parse(localStorage.getItem('pendingTrips') || '[]');
    const isIniciarFormVisible = !iniciarForm?.classList.contains('hidden');
    if (hayDatosNoGuardados()) {
        mostrarAlerta('¿Estás seguro?', 'Tienes datos no guardados. Si sales, se perderán los datos del formulario y los gastos registrados.').then(result => {
            if (result.isConfirmed) {
                resetForms();
                if (isIniciarFormVisible && pendingTrips.length > 0) {
                    setDetalleVisible(false);
                    cargarNotasUsuario();
                } else {
                    window.location.href = '/menu';
                }
            }
        });
    } else {
        if (isIniciarFormVisible && pendingTrips.length > 0) {
            setDetalleVisible(false);
            cargarNotasUsuario();
        } else {
            window.location.href = '/menu';
        }
    }
}

function mostrarVistaPrevia(event, idVistaPrevia) {
    const archivo = event.target.files[0];
    const vistaPrevia = document.getElementById(idVistaPrevia);
    if (archivo) {
        const reader = new FileReader();
        reader.onload = e => vistaPrevia.innerHTML = `<img src="${e.target.result}" alt="Vista previa" class="max-w-full h-auto rounded-lg">`;
        reader.readAsDataURL(archivo);
    }
}

function convertirABase64(file) {
    return new Promise((resolve, reject) => {
        if (!file)
            return resolve(null);
        const img = new Image();
        const reader = new FileReader();
        reader.onload = e => {
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 800, MAX_HEIGHT = 600;
                let width = img.width, height = img.height;
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
                resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
            };
            img.onerror = () => reject("Error al cargar la imagen");
        };
        reader.onerror = () => reject("Error al leer el archivo");
        reader.readAsDataURL(file);
    });
}

function obtenerGastos() {
    const gastosCards = document.querySelectorAll("#gastosCards .gasto-card");
    const gastos = [];
    let total = 0;
    gastosCards.forEach((card, index) => {
        const tipoGastoSelect = card.querySelector(".tipoGasto");
        const tipoGastoId = parseInt(tipoGastoSelect.value) || 0;
        const tipoGastoText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex].text;
        const subTotal = parseFloat(card.querySelector(".subTotal").value) || 0;
        const tipoPago = card.querySelector(".tipoPago").value;
        if (tipoGastoId <= 0 || subTotal <= 0 || !tipoPago)
            return;
        total += subTotal;
        const gasto = {
            noGasto: index + 1,
            cantidad: 1,
            tipoGasto: {idTipoGasto: tipoGastoId},
            tipoPago: tipoPago,
            subTotal: subTotal,
            total: subTotal,
            costoUnitario: subTotal
        };
        if (tipoGastoText === "Combustible") {
            gasto.tipoGas = card.querySelector(".tipoGas").value;
            gasto.valorLitro = parseFloat(card.querySelector(".valorLitro").value) || 0;
        }
        if (tipoGastoText === "Caseta") {
            const detallesCasetas = Array.from(card.querySelectorAll(".caseta-row")).map(caseta => {
                const nombre = caseta.querySelector(".nombreCaseta")?.value;
                const costo = parseFloat(caseta.querySelector(".costoCaseta")?.value) || 0;
                return nombre && costo > 0 ? {nombreCaseta: nombre, costoCaseta: costo} : null;
            }).filter(Boolean);
            if (detallesCasetas.length)
                gasto.detalleCaseta = JSON.stringify(detallesCasetas);
        }
        gastos.push(gasto);
    });
    return {gastos, total};
}

async function cargarClientes() {
    const select = document.getElementById("nombreCliente");
    if (!select)
        return;
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/cliente/getAll');
        const clientes = await response.json();
        if (clientes.error) {
            mostrarError('Error', 'Error al cargar clientes');
            return;
        }
        const opciones = clientes
                .filter(cliente => cliente.activoCliente === 1)
                .map(cliente => {
                    const persona = cliente.persona || {};
                    const nombreCompleto = [persona.nombre, persona.apellidoPaterno, persona.apellidoMaterno]
                            .filter(Boolean)
                            .join(' ')
                            .trim();
                    return nombreCompleto ? {value: cliente.nombreCliente, text: nombreCompleto} : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.text.localeCompare(b.text, 'es', {sensitivity: 'base'}));

        select.innerHTML = '<option value="">Seleccione un cliente</option>' +
                opciones.map(opcion => `<option value="${opcion.value}">${opcion.text}</option>`).join('');
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        mostrarError('Error', 'Error al obtener clientes');
    }
}

document.getElementById('viajePendiente')?.addEventListener('change', function () {
    const selectedIdNota = this.value;
    if (selectedIdNota) {
        localStorage.setItem('idNota', selectedIdNota);
        mostrarDatosNota(selectedIdNota);
    } else {
        localStorage.removeItem('idNota');
        document.getElementById('datosNota').innerHTML = `
            <button type="button" id="registrarOtroViaje" class="bg-green-600 text-white py-2 px-6 rounded flex items-center gap-2 hover:bg-green-700 transition mt-4 hidden">
                <i class="fas fa-plus"></i> Registrar Otro Viaje
            </button>`;
    }
});
