/**
 * @fileoverview Controller for handling nota details, including general info, contabilidad, expenses, and photos.
 * @requires Swal from sweetalert2 for user notifications
 * @requires fetch for API calls
 * @requires localStorage for token and user role
 */

// Global state
let notaData = null;
let isEditingGeneral = false;
let isEditingContabilidad = false;
let operadores = [];
let clientes = [];
let unidades = [];
let updatedPhotos = {
    fotoTablero: null,
    fotoAcuse: null,
    fotoOtraInicio: null,
    fotoOtraFin: null
};
const token = localStorage.getItem("token");
const COMBUSTIBLE_ID = 2; // ID for combustible expense type
const API_BASE_URL = 'https://transportesnaches.com.mx/api';

// Utility function to handle API errors
const handleApiError = (error, message) => {
    console.error(message, error);
    Swal.fire({
        title: 'Error',
        text: `${message}: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#f97316',
    });
    return null;
};

// Fetch tipo pago (replace with actual API call if available)
const fetchTipoPago = () => Promise.resolve([
        {idTipoPago: 1, descripcion: 'Efectivo'},
        {idTipoPago: 2, descripcion: 'Tarjeta'},
        {idTipoPago: 3, descripcion: 'Toka'},
        {idTipoPago: 4, descripcion: 'Tag'}
    ]);

// Fetch operadores
const fetchOperadores = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/operador/getAll`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        operadores = await response.json() || [];
        if (operadores.length === 0)
            console.warn('No operadores found');
        populateSelect('nombreOperadorSelect', operadores, 'nombreOperador', 'nombreOperador');
    } catch (error) {
        handleApiError(error, 'Error fetching operadores');
        operadores = [];
    }
};

// Fetch clientes
const fetchClientes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/cliente/getAll`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        clientes = await response.json() || [];
        let clientsToDisplay = clientes.filter(cliente => cliente.activoCliente === 1);
        if (notaData?.cliente?.nombreCliente) {
            const currentClient = clientes.find(c => c.nombreCliente === notaData.cliente.nombreCliente) ||
                    {nombreCliente: notaData.cliente.nombreCliente, activoCliente: 0};
            if (currentClient && !clientsToDisplay.some(c => c.nombreCliente === currentClient.nombreCliente)) {
                clientsToDisplay = [...clientsToDisplay, currentClient];
            }
        }
        if (clientsToDisplay.length === 0)
            console.warn('No active clientes found');
        populateSelect('nombreClienteSelect', clientsToDisplay, 'nombreCliente', 'nombreCliente');
        if (notaData?.cliente?.nombreCliente) {
            const select = document.getElementById('nombreClienteSelect');
            if (!select.querySelector(`option[value="${notaData.cliente.nombreCliente}"]`)) {
                const option = document.createElement('option');
                option.value = notaData.cliente.nombreCliente;
                option.textContent = notaData.cliente.nombreCliente;
                select.appendChild(option);
            }
            select.value = notaData.cliente.nombreCliente;
        }
    } catch (error) {
        handleApiError(error, 'Error fetching clientes');
        clientes = [];
    }
};

// Fetch unidades
const fetchUnidades = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/unidad/getAll`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        unidades = await response.json() || [];
        if (unidades.length === 0)
            console.warn('No unidades found');
        populateSelect('tipoVehiculoSelect', unidades, 'tipoVehiculo', 'tipoVehiculo');
    } catch (error) {
        handleApiError(error, 'Error fetching unidades');
        unidades = [];
    }
};

// Populate select elements
const populateSelect = (selectId, items, valueField, textField) => {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element with ID ${selectId} not found`);
        return;
    }
    select.innerHTML = '<option value="">Seleccionar</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField] || '';
        option.textContent = item[textField] || 'N/A';
        select.appendChild(option);
    });
};

// Fetch invoice number
const fetchInvoiceNumber = async (idNota) => {
    try {
        const response = await fetch(`${API_BASE_URL}/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        return data.numeroFactura || 'FAC-001';
    } catch (error) {
        console.error('Error fetching invoice number:', error);
        return 'FAC-001';
    }
};

// Preload contabilidad data
const preloadContabilidadData = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/nota/getAll`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        const notas = await response.json();
        const slimNotas = notas.map(nota => ({
                idNota: nota.idNota,
                numeroFactura: nota.numeroFactura,
                maniobra: nota.maniobra,
                comision: nota.comision,
                gananciaCalculada: nota.gananciaCalculada,
                pago: nota.pago,
                fechaPago: nota.fechaPago,
                estadoFact: nota.estadoFact,
                estado: nota.fechaLlegada ? 'COMPLETADA' : 'PENDIENTE'
            }));
        const cacheData = JSON.stringify({data: slimNotas, timestamp: Date.now()});
        const sizeInKB = new Blob([cacheData]).size / 1024;
        console.log(`Contabilidad cache size: ${sizeInKB.toFixed(2)} KB`);
        try {
            sessionStorage.setItem('contabilidadCache', cacheData);
            console.log('Contabilidad data cached');
        } catch (storageError) {
            console.warn('Failed to cache contabilidad data:', storageError);
            sessionStorage.removeItem('contabilidadCache');
        }
    } catch (error) {
        console.error('Error preloading contabilidad data:', error);
    }
};

// Handle photo upload
const handlePhotoUpload = (event, photoType) => {
    const file = event.target.files[0];
    if (!file)
        return;
    if (!file.type.startsWith('image/')) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, selecciona un archivo de imagen válido.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        updatedPhotos[photoType] = reader.result.split(',')[1];
        const imgElement = document.getElementById(`${photoType}Img`);
        imgElement.src = reader.result;
        imgElement.classList.remove('hidden');
        document.getElementById(`${photoType}Placeholder`).classList.add('hidden');
    };
    reader.readAsDataURL(file);
};

// Save photos
const savePhotos = async () => {
    const photosToUpdate = Object.fromEntries(
            Object.entries(updatedPhotos).filter(([_, value]) => value)
            );
    if (!Object.keys(photosToUpdate).length) {
        Swal.fire({
            title: 'Advertencia',
            text: 'No se han seleccionado nuevas fotos.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/nota/updatePhotos`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({
                idNota: notaData.idNota,
                photos: JSON.stringify(photosToUpdate)
            })
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        updatedPhotos = {fotoTablero: null, fotoAcuse: null, fotoOtraInicio: null, fotoOtraFin: null};
        await cargarDetallesNota();
        Swal.fire({
            title: 'Éxito',
            text: 'Fotos actualizadas correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    } catch (error) {
        handleApiError(error, 'Error actualizando fotos');
    }
};

// Fetch tipo gasto
const fetchTipoGasto = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/gasto/getAllTipoGasto`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        return await response.json() || [];
    } catch (error) {
        console.error('Error fetching tipo gasto:', error);
        return [];
    }
};

// Populate tipo gasto combobox
const llenarComboboxTipoGasto = async (tipoGastoSelect) => {
    const tipoGasto = await fetchTipoGasto();
    tipoGastoSelect.innerHTML = '<option value="">Seleccionar...</option>';
    tipoGasto.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.idTipoGasto.toString();
        option.textContent = tipo.descripcion;
        tipoGastoSelect.appendChild(option);
    });
};

// Populate tipo pago combobox based on tipo gasto
const llenarComboboxTipoPago = async (tipoPagoSelect, tipoGastoDescripcion) => {
    try {
        const tiposPago = await fetchTipoPago();
        tipoPagoSelect.innerHTML = '<option value="">Seleccionar...</option>';
        const allowedTiposPago = tipoGastoDescripcion === 'Caseta'
                ? tiposPago.filter(tipo => ['Efectivo', 'Tag'].includes(tipo.descripcion))
                : tipoGastoDescripcion === 'Combustible'
                ? tiposPago.filter(tipo => ['Efectivo', 'Toka'].includes(tipo.descripcion))
                : tiposPago.filter(tipo => ['Efectivo', 'Tarjeta'].includes(tipo.descripcion));
        allowedTiposPago.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.idTipoPago.toString();
            option.textContent = tipo.descripcion;
            tipoPagoSelect.appendChild(option);
        });
    } catch (error) {
        handleApiError(error, 'Error llenando tipos de pago');
    }
};

// Calculate subtotal for casetas
const calcularSubTotal = (card, casetasContainer) => {
    const casetaInputs = casetasContainer.querySelectorAll('.casetaInput');
    let total = 0;
    casetaInputs.forEach(input => {
        total += parseFloat(input.dataset.costo) || 0;
        12
    });
    const subTotalInput = card.querySelector('.subTotal');
    subTotalInput.value = total.toFixed(2);
    calcularTotal();
};

// Calculate total gastos operativos
const calcularTotal = () => {
    const subTotalInputs = document.querySelectorAll('.subTotal');
    let total = 0;
    subTotalInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    const gastosOperativos = document.getElementById('gastosOperativos');
    if (gastosOperativos) {
        gastosOperativos.textContent = `$${total.toFixed(2)}`;
    }
};

// Add caseta input
const agregarCaseta = (card, casetasContainer) => {
    const casetaDiv = document.createElement('div');
    casetaDiv.classList.add('flex', 'items-center', 'gap-2', 'mb-2');
    casetaDiv.innerHTML = `
        <input type="text" class="casetaInput w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" placeholder="Nombre caseta" readonly>
        <button type="button" class="buscarCasetaBtn bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
            <i class="fas fa-search"></i>
        </button>
        <button type="button" class="eliminarCasetaBtn bg-red-500 text-white p-2 rounded hover:bg-red-600 transition">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    casetasContainer.appendChild(casetaDiv);

    casetaDiv.querySelector('.buscarCasetaBtn').addEventListener('click', async () => {
        const casetaInput = casetaDiv.querySelector('.casetaInput');
        const casetas = await fetchCasetas();
        Swal.fire({
            title: 'Seleccionar Caseta',
            input: 'select',
            inputOptions: casetas.reduce((options, caseta) => {
                options[caseta.idCaseta] = `${caseta.nombreCaseta} ($${caseta.costo.toFixed(2)})`;
                return options;
            }, {}),
            inputPlaceholder: 'Selecciona una caseta',
            showCancelButton: true,
            confirmButtonText: 'Seleccionar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#d33',
        }).then(result => {
            if (result.isConfirmed && result.value) {
                const selectedCaseta = casetas.find(c => c.idCaseta == result.value);
                casetaInput.value = selectedCaseta.nombreCaseta;
                casetaInput.dataset.idCaseta = selectedCaseta.idCaseta;
                casetaInput.dataset.costo = selectedCaseta.costo;
                calcularSubTotal(card, casetasContainer);
            }
        });
    });

    casetaDiv.querySelector('.eliminarCasetaBtn').addEventListener('click', () => {
        casetaDiv.remove();
        calcularSubTotal(card, casetasContainer);
    });
};

// Fetch casetas
const fetchCasetas = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/caseta/getAll`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        return await response.json() || [];
    } catch (error) {
        console.error('Error fetching casetas:', error);
        return [];
    }
};

// Open expense modal
const openExpenseModal = async (gasto = null, index = - 1) => {
    const modal = document.getElementById('modalGasto');
    const form = document.getElementById('gastoForm');
    form.innerHTML = '';
    form.dataset.index = index;

    const card = document.createElement('div');
    card.classList.add('gasto-card', 'bg-white', 'p-4', 'rounded-lg', 'shadow-md', 'border', 'border-orange-200', 'mb-4');
    card.innerHTML = `
        <div class="card-field flex justify-between items-center mb-2">
            <h3 class="text-lg font-semibold text-gray-800">Gasto #${index >= 0 ? index + 1 : (notaData.gastos?.length + 1 || 1)}</h3>
            <button type="button" class="btnEliminar text-red-500 hover:text-red-700">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
        <div class="card-field mb-2">
            <label class="block text-sm font-medium text-gray-700">Tipo de Gasto:</label>
            <select id="tipoGasto" class="tipoGasto w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" required>
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
            <select id="tipoGas" class="tipoGas w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm">
                <option value="">Seleccionar...</option>
                <option value="Diésel">Diésel</option>
                <option value="Gasolina">Gasolina</option>
            </select>
        </div>
        <div class="card-field valorLitroCell hidden mb-2">
            <label class="block text-sm font-medium text-gray-700">Valor por Litro:</label>
            <input type="number" id="valorLitro" step="0.01" class="valorLitro w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" placeholder="Ej. 23.50">
        </div>
        <div class="card-field tipoPagoCell mb-2">
            <label class="block text-sm font-medium text-gray-700">Tipo de Pago:</label>
            <select id="tipoPago" class="tipoPago w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm">
                <option value="">Seleccionar...</option>
            </select>
        </div>
        <div class="card-field mb-2">
            <label class="block text-sm font-medium text-gray-700">Sub Total:</label>
            <input type="number" id="subTotal" step="0.01" class="subTotal w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" required>
        </div>
       
    `;
    form.appendChild(card);

    const tipoGastoSelect = card.querySelector('.tipoGasto');
    const tipoPagoSelect = card.querySelector('.tipoPago');
    const subTotalInput = card.querySelector('.subTotal');
    const cantidadInput = card.querySelector('.cantidad');

    await llenarComboboxTipoGasto(tipoGastoSelect);
    console.log(`Tipos de gasto cargados para gasto ${index >= 0 ? index + 1 : (notaData.gastos?.length + 1 || 1)}`);

    const toggleColumns = async () => {
        const selectedTipoGastoId = tipoGastoSelect.value; // Fixed: Replaced tipo_unused with tipoGastoSelect.value
        const selectedTipoGastoText = tipoGastoSelect.options[tipoGastoSelect.selectedIndex]?.text || '';
        const detalleCasetaCell = card.querySelector('.detalleCasetaCell');
        const tipoGasCell = card.querySelector('.tipoGasCell');
        const valorLitroCell = card.querySelector('.valorLitroCell');
        const tipoPagoCell = card.querySelector('.tipoPagoCell');
        [detalleCasetaCell, tipoGasCell, valorLitroCell, tipoPagoCell].forEach(cell => cell.classList.add('hidden'));
        subTotalInput.removeAttribute('required');
        await llenarComboboxTipoPago(tipoPagoSelect, selectedTipoGastoText);
        if (selectedTipoGastoText === 'Caseta') {
            detalleCasetaCell.classList.remove('hidden');
            tipoPagoCell.classList.remove('hidden');
            tipoPagoSelect.setAttribute('required', 'true');
            subTotalInput.readOnly = true;
            const casetasContainer = card.querySelector('.casetasContainer');
            if (casetasContainer.children.length === 0) {
                agregarCaseta(card, casetasContainer);
            }
            calcularSubTotal(card, casetasContainer);
        } else if (selectedTipoGastoText === 'Combustible') {
            tipoGasCell.classList.remove('hidden');
            valorLitroCell.classList.remove('hidden');
            tipoPagoCell.classList.remove('hidden');
            card.querySelector('.tipoGas').setAttribute('required', 'true');
            card.querySelector('.valorLitro').setAttribute('required', 'true');
            tipoPagoSelect.setAttribute('required', 'true');
            subTotalInput.setAttribute('required', 'true');
            subTotalInput.readOnly = false;
            cantidadInput.readOnly = false;
        } else if (selectedTipoGastoId) {
            tipoPagoCell.classList.remove('hidden');
            tipoPagoSelect.setAttribute('required', 'true');
            subTotalInput.setAttribute('required', 'true');
            subTotalInput.readOnly = false;
            cantidadInput.readOnly = false;
        }
    };

    tipoGastoSelect.addEventListener('change', toggleColumns);
    subTotalInput.addEventListener('input', calcularTotal);
    card.querySelector('.agregarCasetaBtn')?.addEventListener('click', () => {
        agregarCaseta(card, card.querySelector('.casetasContainer'));
    });
    card.querySelector('.btnEliminar').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    if (gasto) {
        tipoGastoSelect.value = gasto.tipoGasto?.descripcion || '';
        await toggleColumns();
        card.querySelector('#tipoGasto').value = gasto.tipoGasto?.descripcion || '';
        card.querySelector('#tipoGas').value = gasto.tipoGas || '';
        card.querySelector('#valorLitro').value = gasto.valorLitro || 23.5;
        card.querySelector('#tipoPago').value = gasto.tipoPago?.toString || '';
        card.querySelector('#subTotal').value = gasto.subTotal || '';
        if (gasto.tipoGasto?.descripcion === 'Caseta' && gasto.detalleCaseta && gasto.detalleCaseta !== 'N/A') {
            const casetasContainer = card.querySelector('.casetasContainer');
            let casetaName = gasto.detalleCaseta;
            try {
                const casetaData = JSON.parse(gasto.detalleCaseta);
                if (Array.isArray(casetaData) && casetaData.length > 0 && casetaData[0].nombreCaseta) {
                    casetaName = casetaData[0].nombreCaseta;
                }
            } catch (e) {
                console.warn(`Error parsing detalleCaseta for editing gasto ${gasto.idGasto}:`, e);
            }
            casetasContainer.innerHTML = `<input type="text" class="casetaInput w-full p-2 border border-orange-300 rounded bg-orange-50 text-gray-800 text-sm" value="${casetaName}" data-id-caseta="${gasto.idCaseta || ''}" data-costo="${gasto.costoUnitario || 0}" readonly>`;
            calcularSubTotal(card, casetasContainer);
        }
    } else {
        await toggleColumns();
    }

    modal.classList.remove('hidden');
};

// Save expense
const saveExpense = async () => {
    const { gastos, total } = obtenerGastos();

    // Validations for each expense
    for (const gasto of gastos) {
        if (!gasto.tipoGasto.idTipoGasto || !gasto.tipoPago || gasto.cantidad <= 0 || gasto.subTotal <= 0) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor, completa todos los campos requeridos: tipo de gasto, tipo de pago, cantidad y subtotal.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        if (gasto.tipoGasto.idTipoGasto === COMBUSTIBLE_ID && (!gasto.tipoGas || gasto.tipoGas === 'N/A' || !gasto.costoUnitario)) {
            Swal.fire({
                title: 'Error',
                text: 'Para gastos de combustible, selecciona un tipo de gas y especifica el costo unitario.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
            return;
        }
    }

    try {
        console.log('Enviando gastos:', gastos);
        const response = await fetch(`${API_BASE_URL}/nota/updateGastos`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({
                idNota: notaData.idNota.toString(),
                gastos: JSON.stringify(gastos)
            })
        });

        const responseData = await response.json();
        if (!response.ok)
            throw new Error(responseData.error || `HTTP Error: ${response.status}`);

        if (responseData.result === 'Gastos actualizados correctamente.') {
            // Update notaData.gastos with the new expenses
            notaData.gastos = gastos;
            await cargarDetallesNota();
            sessionStorage.removeItem('contabilidadCache');
            await preloadContabilidadData();
            document.getElementById('modalGasto').classList.add('hidden');
            Swal.fire({
                title: 'Éxito',
                text: 'Gastos guardados correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
        } else {
            throw new Error(responseData.error || 'Respuesta inesperada del servidor');
        }
    } catch (error) {
        handleApiError(error, 'Error guardando gastos');
    }
};

// Load nota details
const cargarDetallesNota = async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('hidden');
    const urlParams = new URLSearchParams(window.location.search);
    const idNota = urlParams.get('id');
    if (!idNota) {
        Swal.fire({
            title: 'Error',
            text: 'No se proporcionó un ID de nota',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        }).then(() => {
            window.location.href = '/contabilidad';
        });
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        notaData = await response.json();
        console.log('Nota recibida:', notaData);

        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        document.querySelectorAll('.admin-only').forEach(item => {
            item.style.display = isAdmin ? 'block' : 'none';
        });

        await Promise.all([fetchOperadores(), fetchClientes(), fetchUnidades()]);

        updateDisplayAndSelect('nombreOperador', 'nombreOperadorSelect', notaData.nombreOperador || '');
        updateDisplayAndSelect('nombreCliente', 'nombreClienteSelect', notaData.cliente?.nombreCliente || '');
        updateDisplayAndSelect('tipoVehiculo', 'tipoVehiculoSelect', notaData.unidad?.tipoVehiculo || '');

        const photoContainers = [
            {id: 'fotoTablero', modalId: 'fotoTableroModal', placeholderId: 'fotoTableroPlaceholder', imgId: 'fotoTableroImg', inputId: 'fotoTableroInput'},
            {id: 'fotoAcuse', modalId: 'fotoAcuseModal', placeholderId: 'fotoAcusePlaceholder', imgId: 'fotoAcuseImg', inputId: 'fotoAcuseInput'},
            {id: 'fotoOtraInicio', modalId: 'fotoOtraInicioModal', placeholderId: 'fotoOtraInicioPlaceholder', imgId: 'fotoOtraInicioImg', inputId: 'fotoOtraInicioInput'},
            {id: 'fotoOtraFin', modalId: 'fotoOtraFinModal', placeholderId: 'fotoOtraFinPlaceholder', imgId: 'fotoOtraFinImg', inputId: 'fotoOtraFinInput'}
        ];
        photoContainers.forEach(({ id, placeholderId, imgId, inputId }) => {
            const div = document.getElementById(id);
            div.innerHTML = `
                <p class="font-medium text-gray-700 text-sm mb-1">${id.replace('foto', '')}</p>
                <div id="${placeholderId}" class="text-gray-500 text-sm ${notaData[id] ? 'hidden' : ''}">Sin imagen</div>
                <img id="${imgId}" src="${notaData[id] ? `data:image/jpeg;base64,${notaData[id]}` : ''}" alt="${id}" class="w-full h-32 object-contain rounded-lg ${notaData[id] ? '' : 'hidden'} cursor-pointer">
                <input type="file" id="${inputId}" accept="image/*" class="mt-2 hidden">
                <button class="upload-photo-btn bg-primary-orange text-white py-1 px-2 rounded mt-2 text-sm hover:bg-secondary-orange transition" data-photo="${id}">
                    <i class="fas fa-upload"></i> ${notaData[id] ? 'Actualizar Foto' : 'Subir Foto'}
                </button>
            `;
        });

        const distancia = notaData.kmFinal && notaData.kmInicio ? notaData.kmFinal - notaData.kmInicio : (notaData.distancia || 258);
        const rendimiento = notaData.unidad?.rendimientoUnidad || 7;
        const precioLitro = parseFloat(notaData.precioLitro || 25.50);
        const noEntrega = parseInt(notaData.noEntrega) || 0;
        const pagoViaje = notaData.pagoViaje != null ? notaData.pagoViaje : ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        const gastosOperativos = notaData.gastos ? notaData.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(notaData.maniobra) || 0;
        const comision = parseFloat(notaData.comision) || 0;
        const totalGastosNota = gastosOperativos + maniobra + comision;
        const gananciaCalculada = pagoViaje - totalGastosNota;


        document.getElementById('idNota').textContent = notaData.idNota || 'N/A';
        const factura = notaData.cliente?.factura || 0;
        const numeroFactura = factura === 0 ? 'No Fact' : (notaData.numeroFactura || '');
        document.getElementById('numeroFactura').value = numeroFactura;
        document.getElementById('numeroFacturaSpan').textContent = numeroFactura || 'N/A';
        document.getElementById('estadoFactSelect').value = notaData.estadoFact || 'Pendiente';
        document.getElementById('estadoFact').textContent = notaData.estadoFact || 'Pendiente'; // Added
        document.getElementById('isPaidSelect').value = notaData.pago ? 'Sí' : 'No';
        document.getElementById('isPaid').textContent = notaData.pago ? 'Sí' : 'No'; // Added
        document.getElementById('fechaPagoInput').value = notaData.fechaPago ? new Date(notaData.fechaPago).toISOString().split('T')[0] : '';
        document.getElementById('fechaPago').textContent = notaData.fechaPago ? formatearDate(notaData.fechaPago) : 'N/A'; // Added
        document.getElementById('maniobraInput').value = notaData.maniobra || '0';
        document.getElementById('maniobra').textContent = `$${parseFloat(notaData.maniobra || 0).toFixed(2)}`; // Added
        document.getElementById('comisionInput').value = notaData.comision || '0';
        document.getElementById('comision').textContent = `$${parseFloat(notaData.comision || 0).toFixed(2)}`; // Added
        document.getElementById('gananciaCalculada').textContent = gananciaCalculada >= 0
                ? `$${parseFloat(gananciaCalculada || 0).toFixed(2)} (Positiva)`
                : `-$${Math.abs(parseFloat(gananciaCalculada || 0)).toFixed(2)} (Negativa)`; // Updated
        document.getElementById('pagoViajeInput').value = pagoViaje.toFixed(2);
        document.getElementById('pagoViaje').textContent = `$${pagoViaje.toFixed(2)}`; // Updated

        document.getElementById('estado').textContent = notaData.fechaLlegada ? 'COMPLETADA' : 'PENDIENTE';
        const numeroFacturaInput = document.getElementById('numeroFactura');
        const estadoFact = notaData.estadoFact || 'Pendiente';
        numeroFacturaInput.disabled = factura === 0 || estadoFact === 'Facturado';
        numeroFacturaInput.placeholder = factura === 0 ? 'No Fact' : estadoFact === 'Facturado' ? 'Factura ya asignada' : 'Ej.: FACTO-001';

        // In cargarDetallesNota function, replace the gastosContainer section with this:
        const gastosContainer = document.getElementById('gastosContainer');
        gastosContainer.innerHTML = '';

        if (notaData.gastos && Array.isArray(notaData.gastos) && notaData.gastos.length > 0) {
            notaData.gastos.forEach((gasto, index) => {
                const gastoCard = document.createElement('div');
                gastoCard.classList.add('card', 'border', 'border-gray-200', 'relative', 'p-4', 'rounded-lg', 'shadow-md', 'animate-slide-in');
                const campos = [];

                if (gasto.tipoGasto?.descripcion && gasto.tipoGasto.descripcion !== 'N/A') {
                    campos.push(`<p class="text-sm"><strong>Tipo Gasto:</strong> ${gasto.tipoGasto.descripcion}</p>`);
                }
                if (gasto.subTotal && gasto.subTotal !== 'N/A') {
                    campos.push(`<p class="text-sm"><strong>Total:</strong> $${parseFloat(gasto.subTotal).toFixed(2)}</p>`);
                }
                if (gasto.detalleCaseta && gasto.detalleCaseta !== 'N/A') {
                    let casetaDisplay = gasto.detalleCaseta;
                    try {
                        // Parse the string as JSON
                        const casetaData = JSON.parse(gasto.detalleCaseta);
                        if (Array.isArray(casetaData) && casetaData.length > 0) {
                            // Map caseta names and join them (e.g., comma-separated)
                            const casetaNames = casetaData
                                    .filter(caseta => caseta.nombreCaseta)
                                    .map(caseta => `nombreCaseta: ${caseta.nombreCaseta}`);
                            casetaDisplay = casetaNames.join('<br>'); // Separate lines
                            // Alternative: casetaDisplay = `nombreCaseta: ${casetaNames.join(', ')}`; // Comma-separated
                        }
                    } catch (e) {
                        console.warn(`Error parsing detalleCaseta for gasto ${gasto.idGasto}:`, e);
                        casetaDisplay = 'nombreCaseta: N/A';
                    }
                    campos.push(`<p class="text-sm"><strong>Caseta:</strong> ${casetaDisplay}</p>`);
                }
                if (gasto.tipoGas && gasto.tipoGas !== 'N/A') {
                    campos.push(`<p class="text-sm"><strong>Tipo Gas:</strong> ${gasto.tipoGas}</p>`);
                }
                if (gasto.tipoPago && gasto.tipoPago !== 'N/A') {
                    campos.push(`<p class="text-sm"><strong>Tipo Pago:</strong> ${gasto.tipoPago}</p>`);
                }
                if (gasto.detalleCaseta && gasto.detalleCaseta !== 'N/A' && !campos.some(c => c.includes('<strong>Caseta:</strong>'))) {
                    campos.push(`<p class="text-sm"><strong>Comentario:</strong> ${gasto.detalleCaseta}</p>`);
                }
                if (campos.length > 0) {
                    gastoCard.innerHTML = `
                <div class="absolute top-2 right-2 flex gap-2">
                    <button class="edit-gasto-btn text-blue-500 hover:text-blue-500" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-gasto-btn text-red-600 hover:text-red-800" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ${campos.join('')}
            `;
                    gastosContainer.appendChild(gastoCard);
                }
            });

            document.querySelectorAll('.edit-gasto-btn').forEach(btn => {
                btn.addEventListener('click', () => openExpenseModal(notaData.gastos[parseInt(btn.dataset.index)], parseInt(btn.dataset.index)));
            });

            document.querySelectorAll('.delete-gasto-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const index = parseInt(btn.dataset.index);
                    const gasto = notaData.gastos[index];
                    const result = await Swal.fire({
                        title: '¿Eliminar gasto?',
                        text: `¿Estás seguro de eliminar este gasto (${gasto.tipoGasto.descripcion})?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Eliminar',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#f97316',
                        cancelButtonColor: '#d33',
                    });
                    if (result.isConfirmed) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/gasto/deleteGasto?idGasto=${gasto.idGasto}`, {
                                method: 'DELETE',
                                headers: {'Authorization': `Bearer ${token}`}
                            });
                            if (!response.ok)
                                throw new Error(`HTTP Error: ${response.status}`);
                            notaData.gastos.splice(index, 1);
                            await cargarDetallesNota();
                            Swal.fire({
                                title: 'Éxito',
                                text: 'Gasto eliminado correctamente',
                                icon: 'success',
                                confirmButtonText: 'Aceptar',
                                confirmButtonColor: '#f97316',
                            });
                        } catch (error) {
                            handleApiError(error, 'Error eliminando gasto');
                        }
                    }
                });
            });
        } else {
            gastosContainer.innerHTML = '<p class="text-gray-500 text-center text-sm">No hay gastos operativos registrados.</p>';
        }

        const totalGastos = gastosOperativos + maniobra + comision;
        document.getElementById('gastosOperativos').textContent = `$${gastosOperativos.toFixed(2)}`;
        document.getElementById('maniobraTotal').textContent = `$${maniobra.toFixed(2)}`;
        document.getElementById('comisionTotal').textContent = `$${comision.toFixed(2)}`;
        document.getElementById('totalGastos').textContent = `$${totalGastos.toFixed(2)}`;
        document.getElementById('gananciaCalculada').textContent = gananciaCalculada >= 0
                ? `$${gananciaCalculada.toFixed(2)} (Positiva)`
                : `-$${Math.abs(gananciaCalculada).toFixed(2)} (Negativa)`;
        document.getElementById('pagoViaje').textContent = `$${pagoViaje.toFixed(2)}`;

        ['gastosOperativos', 'maniobra', 'comision', 'totalGastos', 'gananciaCalculada', 'pagoViaje'].forEach(field => {
            document.getElementById(`${field}Modal`).textContent = document.getElementById(field === 'maniobra' || field === 'comision' ? `${field}Total` : field).textContent;
        });

        function formatRuta(origen, destino) {
            if (!origen || !destino)
                return 'N/A';
            const formattedOrigen = origen.includes('León') ? 'León' : origen;
            const formattedDestino = destino;
            return `${formattedOrigen} - ${formattedDestino}`;
        }
        document.getElementById('ruta').textContent = formatRuta(notaData.origen, notaData.destino) || 'N/A';
        document.getElementById('origen').value = processCityName(notaData.origen) || '';
        document.getElementById('destino').value = processCityName(notaData.destino) || '';
        document.getElementById('noEntrega').textContent = notaData.noEntrega || 'N/A';
        document.getElementById('noEntregaInput').value = notaData.noEntrega || '';
        document.getElementById('fechaSalida').textContent = formatearDate(notaData.fechaSalida) || 'N/A';
        document.getElementById('fechaSalidaInput').value = notaData.fechaSalida ? new Date(notaData.fechaSalida).toISOString().split('T')[0] : '';
        document.getElementById('horaSalida').textContent = notaData.horaSalida || 'N/A';
        document.getElementById('horaSalidaInput').value = notaData.horaSalida || '';
        document.getElementById('fechaLlegada').textContent = formatearDate(notaData.fechaLlegada) || 'N/A';
        document.getElementById('fechaLlegadaInput').value = notaData.fechaLlegada ? new Date(notaData.fechaLlegada).toISOString().split('T')[0] : '';
        document.getElementById('horaLlegada').textContent = notaData.horaLlegada || 'N/A';
        document.getElementById('horaLlegadaInput').value = notaData.horaLlegada || '';
        document.getElementById('kmInicio').textContent = notaData.kmInicio ? `${notaData.kmInicio} km` : 'N/A';
        document.getElementById('kmInicioInput').value = notaData.kmInicio || '';
        document.getElementById('kmFinal').textContent = notaData.kmFinal ? `${notaData.kmFinal} km` : 'N/A';
        document.getElementById('kmFinalInput').value = notaData.kmFinal || '';
        document.getElementById('gasolinaInicio').textContent = notaData.gasolinaInicio ? 'Sí' : 'No';
        document.getElementById('gasolinaInicioSelect').value = notaData.gasolinaInicio ? 'true' : 'false';
        document.getElementById('gasolinaLevel').textContent = notaData.gasolinaLevel || 'N/A';
        document.getElementById('gasolinaLevelInput').value = notaData.gasolinaLevel || '';
        document.getElementById('llantasInicio').textContent = notaData.llantasInicio ? 'Sí' : 'No';
        document.getElementById('llantasInicioSelect').value = notaData.llantasInicio ? 'true' : 'false';
        document.getElementById('aceiteInicio').textContent = notaData.aceiteInicio ? 'Sí' : 'No';
        document.getElementById('aceiteInicioSelect').value = notaData.aceiteInicio ? 'true' : 'false';
        document.getElementById('anticongelanteInicio').textContent = notaData.anticongelanteInicio ? 'Sí' : 'No';
        document.getElementById('anticongelanteInicioSelect').value = notaData.anticongelanteInicio ? 'true' : 'false';
        document.getElementById('liquidoFrenosInicio').textContent = notaData.liquidoFrenosInicio ? 'Sí' : 'No';
        document.getElementById('liquidoFrenosInicioSelect').value = notaData.liquidoFrenosInicio ? 'true' : 'false';
        document.getElementById('comentarioEstado').textContent = notaData.comentarioEstado || 'Sin comentarios';
        document.getElementById('comentarioEstadoInput').value = notaData.comentarioEstado || '';

        photoContainers.forEach(({ inputId, id }) => {
            const input = document.getElementById(inputId);
            const uploadBtn = document.querySelector(`.upload-photo-btn[data-photo="${id}"]`);
            if (input && uploadBtn) {
                uploadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    input.click();
                });
                input.addEventListener('change', (event) => handlePhotoUpload(event, id));
        }
        });

        loadingOverlay.classList.add('hidden');
        await preloadContabilidadData();
    } catch (error) {
        loadingOverlay.classList.add('hidden');
        handleApiError(error, 'Error cargando detalles de la nota').then(() => {
            window.location.href = '/contabilidad';
        });
    }
};

// Update display and select elements
const updateDisplayAndSelect = (displayId, selectId, value) => {
    const display = document.getElementById(displayId);
    const select = document.getElementById(selectId);
    if (display && select) {
        display.textContent = value || 'N/A';
        if (value && !select.querySelector(`option[value="${value}"]`)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        }
        select.value = value || '';
        select.dispatchEvent(new Event('change'));
        console.log(`Set ${selectId}.value to ${value}, actual value: ${select.value}`);
    } else {
        console.warn(`Element display (${displayId}) or select (${selectId}) not found`);
    }
};

// Format date
const formatearDate = (fecha) => {
    if (!fecha)
        return 'N/A';
    const date = new Date(fecha);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

// Toggle contabilidad edit mode
const toggleEditContabilidad = () => {
    isEditingContabilidad = !isEditingContabilidad;
    const fields = ['numeroFactura', 'estadoFact', 'isPaid', 'fechaPago', 'maniobra', 'comision', 'pagoViaje'];
    fields.forEach(field => {
        const span = document.getElementById(field === 'numeroFactura' ? 'numeroFacturaSpan' : field);
        const input = document.getElementById(field === 'numeroFactura' ? 'numeroFactura' :
                field === 'estadoFact' ? 'estadoFactSelect' :
                field === 'isPaid' ? 'isPaidSelect' :
                field === 'fechaPago' ? 'fechaPagoInput' :
                `${field}Input`);
        if (span && input) {
            span.classList.toggle('hidden', isEditingContabilidad);
            input.classList.toggle('hidden', !isEditingContabilidad);
            if (isEditingContabilidad) {
                if (field === 'numeroFactura') {
                    input.disabled = notaData.cliente?.factura === 0 || notaData.estadoFact === 'Facturado';
                } else {
                    input.removeAttribute('disabled');
                    input.classList.remove('disabled-input');
                }
            } else {
                input.setAttribute('disabled', 'true');
                input.classList.add('disabled-input');
            }
        }
    });
    document.getElementById('editarContabilidadBtn').classList.toggle('hidden', isEditingContabilidad);
    document.getElementById('guardarContabilidadContainer').classList.toggle('hidden', !isEditingContabilidad);
};

// Toggle general info edit mode
const toggleEditGeneral = () => {
    isEditingGeneral = !isEditingGeneral;
    const fields = [
        'nombreOperador', 'nombreCliente', 'tipoVehiculo', 'ruta', 'noEntrega',
        'fechaSalida', 'horaSalida', 'fechaLlegada', 'horaLlegada', 'kmInicio',
        'kmFinal', 'gasolinaInicio', 'gasolinaLevel', 'llantasInicio', 'aceiteInicio',
        'anticongelanteInicio', 'liquidoFrenosInicio', 'comentarioEstado'
    ];
    fields.forEach(field => {
        const span = document.getElementById(field);
        const inputId = field === 'ruta' ? 'rutaInputs' :
                field === 'comentarioEstado' ? 'comentarioEstadoInput' :
                ['gasolinaInicio', 'llantasInicio', 'aceiteInicio', 'anticongelanteInicio', 'liquidoFrenosInicio'].includes(field) ? `${field}Select` :
                ['nombreOperador', 'nombreCliente', 'tipoVehiculo'].includes(field) ? `${field}Select` : `${field}Input`;
        const input = document.getElementById(inputId);
        if (span && input) {
            span.classList.toggle('hidden', isEditingGeneral);
            input.classList.toggle('hidden', !isEditingGeneral);
            if (isEditingGeneral) {
                input.removeAttribute('disabled');
                input.classList.remove('disabled-input');
                if (field === 'nombreCliente' && notaData?.cliente?.nombreCliente) {
                    if (!input.querySelector(`option[value="${notaData.cliente.nombreCliente}"]`)) {
                        const option = document.createElement('option');
                        option.value = notaData.cliente.nombreCliente;
                        option.textContent = notaData.cliente.nombreCliente;
                        input.appendChild(option);
                    }
                    input.value = notaData.cliente.nombreCliente;
                }
            } else {
                input.setAttribute('disabled', 'true');
                input.classList.add('disabled-input');
            }
        }
    });
    document.getElementById('editarInfoGeneralBtn').classList.toggle('hidden', isEditingGeneral);
    document.getElementById('guardarInfoGeneralContainer').classList.toggle('hidden', !isEditingGeneral);
};

// Save general info
const guardarInfoGeneral = async () => {
    const idNota = document.getElementById('idNota').textContent;
    const nombreClienteSelect = document.getElementById('nombreClienteSelect');
    const datosActualizados = {
        idNota: parseInt(idNota),
        nombreOperador: document.getElementById('nombreOperadorSelect').value || null,
        cliente: {nombreCliente: nombreClienteSelect.value || notaData.cliente?.nombreCliente || null},
        unidad: {tipoVehiculo: document.getElementById('tipoVehiculoSelect').value || null},
        origen: document.getElementById('origen').value || null,
        destino: document.getElementById('destino').value || null,
        noEntrega: parseInt(document.getElementById('noEntregaInput').value) || 0,
        fechaSalida: document.getElementById('fechaSalidaInput').value ? new Date(document.getElementById('fechaSalidaInput').value).toISOString() : null,
        horaSalida: document.getElementById('horaSalidaInput').value || null,
        fechaLlegada: document.getElementById('fechaLlegadaInput').value ? new Date(document.getElementById('fechaLlegadaInput').value).toISOString() : null,
        horaLlegada: document.getElementById('horaLlegadaInput').value || null,
        kmInicio: parseFloat(document.getElementById('kmInicioInput').value) || 0,
        kmFinal: parseFloat(document.getElementById('kmFinalInput').value) || 0,
        gasolinaInicio: document.getElementById('gasolinaInicioSelect').value === 'true',
        gasolinaLevel: document.getElementById('gasolinaLevelInput').value || null,
        llantasInicio: document.getElementById('llantasInicioSelect').value === 'true',
        aceiteInicio: document.getElementById('aceiteInicioSelect').value === 'true',
        anticongelanteInicio: document.getElementById('anticongelanteInicioSelect').value === 'true',
        liquidoFrenosInicio: document.getElementById('liquidoFrenosInicioSelect').value === 'true',
        comentarioEstado: document.getElementById('comentarioEstadoInput').value || null
    };

    if (datosActualizados.kmInicio && datosActualizados.kmFinal && datosActualizados.kmFinal < datosActualizados.kmInicio) {
        Swal.fire({
            title: 'Error',
            text: 'El kilómetro final debe ser mayor o igual al kilómetro inicial.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    if (!datosActualizados.nombreOperador || !datosActualizados.cliente.nombreCliente || !datosActualizados.unidad.tipoVehiculo) {
        Swal.fire({
            title: 'Error',
            text: 'Selecciona un operador, cliente y unidad válidos.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    try {
        console.log('Enviando datos generales:', datosActualizados);
        const response = await fetch(`${API_BASE_URL}/nota/updateGeneralInfo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({datosNota: JSON.stringify(datosActualizados)})
        });

        const contentType = response.headers.get('Content-Type');
        const rawResponse = await response.text();
        console.log('Raw server response:', rawResponse);

        let responseData;
        try {
            if (contentType && contentType.includes('application/json')) {
                responseData = JSON.parse(rawResponse);
            } else {
                // Handle non-JSON response
                responseData = {status: 'success', message: rawResponse};
            }
        } catch (parseError) {
            console.warn('Non-JSON response received:', parseError);
            responseData = {status: 'success', message: rawResponse};
        }

        if (!response.ok) {
            throw new Error(responseData.error || `HTTP Error: ${response.status} - ${rawResponse}`);
        }

        if (responseData.status === 'success') {
            await cargarDetallesNota();
            sessionStorage.removeItem('contabilidadCache');
            await preloadContabilidadData();
            toggleEditGeneral();
            Swal.fire({
                title: 'Éxito',
                text: responseData.message || 'Información general actualizada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
        } else {
            throw new Error(responseData.message || 'Respuesta inesperada del servidor');
        }
    } catch (error) {
        handleApiError(error, 'Error actualizando información general');
    }
};

// Save contabilidad
const guardarContabilidad = async () => {
    const idNota = document.getElementById('idNota').textContent;
    const numeroFacturaInput = document.getElementById('numeroFactura');
    const estadoFactSelect = document.getElementById('estadoFactSelect');
    const isPaidSelect = document.getElementById('isPaidSelect');
    const fechaPagoInput = document.getElementById('fechaPagoInput');
    const maniobraInput = document.getElementById('maniobraInput').value;
    const comisionInput = document.getElementById('comisionInput').value;
    const pagoViajeInput = document.getElementById('pagoViajeInput').value;

    const numeroFactura = numeroFacturaInput.value.trim();
    const estadoFact = estadoFactSelect.value;
    const pago = isPaidSelect.value === 'Sí';
    const fechaPago = fechaPagoInput.value || null;
    const maniobra = parseFloat(maniobraInput) || 0;
    const comision = parseFloat(comisionInput) || 0;
    const gastosOperativos = notaData.gastos ? notaData.gastos.reduce((sum, g) => sum + (parseFloat(g.subTotal) || 0), 0) : 0;
    const gananciaCalculada = parseFloat(pagoViajeInput) - (gastosOperativos + maniobra + comision);
    const pagoViaje = parseFloat(pagoViajeInput) || 0;

    // Validate inputs
    if (isNaN(maniobra) || isNaN(comision) || isNaN(pagoViaje)) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, ingrese valores numéricos válidos para maniobra, comisión, ganancia y pago viaje.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    if (numeroFactura && numeroFactura !== 'No Fact' && !/^[A-Z0-9-]+$/.test(numeroFactura)) {
        Swal.fire({
            title: 'Error',
            text: 'El número de factura debe contener solo letras mayúsculas, números y guiones.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    const notaResponse = await fetch(`${API_BASE_URL}/nota/getById?idNota=${idNota}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
    });
    const nota = await notaResponse.json();

    const datosActualizados = {
        idNota,
        numeroFactura: numeroFactura === 'No Fact' ? null : numeroFactura,
        maniobra,
        comision,
        gananciaCalculada,
        pago,
        fechaPago,
        estadoFact,
        pagoViaje,
        estado: nota.fechaLlegada ? 'COMPLETADA' : 'PENDIENTE'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/nota/updateContabilidad`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({datosNota: JSON.stringify(datosActualizados)})
        });

        const responseData = await response.json();
        if (!response.ok)
            throw new Error(responseData.error || `HTTP Error: ${response.status}`);

        notaData = await (await fetch(`${API_BASE_URL}/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        })).json();

        const gastosOperativos = notaData.gastos ? notaData.gastos.reduce((sum, g) => sum + (parseFloat(g.subTotal) || 0), 0) : 0;
        const totalGastos = gastosOperativos + maniobra + comision;

        document.getElementById('numeroFactura').value = notaData.cliente?.factura === 0 ? 'No Fact' : (notaData.numeroFactura || '');
        document.getElementById('numeroFacturaSpan').textContent = notaData.cliente?.factura === 0 ? 'No Fact' : (notaData.numeroFactura || 'N/A');
        document.getElementById('estadoFactSelect').value = notaData.estadoFact || 'Pendiente';
        document.getElementById('isPaidSelect').value = notaData.pago ? 'Sí' : 'No';
        document.getElementById('fechaPagoInput').value = notaData.fechaPago ? new Date(notaData.fechaPago).toISOString().split('T')[0] : '';
        document.getElementById('maniobraInput').value = maniobra;
        document.getElementById('comisionInput').value = comision;
        document.getElementById('pagoViajeInput').value = pagoViaje.toFixed(2);

        document.getElementById('maniobra').textContent = `$${maniobra.toFixed(2)}`;
        document.getElementById('comision').textContent = `$${comision.toFixed(2)}`;
        document.getElementById('gananciaCalculada').textContent = gananciaCalculada >= 0
                ? `$${gananciaCalculada.toFixed(2)} (Positiva)`
                : `-$${Math.abs(gananciaCalculada).toFixed(2)} (Negativa)`;
        document.getElementById('pagoViaje').textContent = `$${pagoViaje.toFixed(2)}`;
        document.getElementById('maniobraTotal').textContent = `$${maniobra.toFixed(2)}`;
        document.getElementById('comisionTotal').textContent = `$${comision.toFixed(2)}`;
        document.getElementById('totalGastos').textContent = `$${totalGastos.toFixed(2)}`;

        // Ensure contabilidad fields remain visible
        document.getElementById('numeroFacturaSpan').classList.remove('hidden');
        document.getElementById('estadoFactSelect').classList.add('hidden');
        document.getElementById('isPaidSelect').classList.add('hidden');
        document.getElementById('fechaPagoInput').classList.add('hidden');
        document.getElementById('maniobraInput').classList.add('hidden');
        document.getElementById('comisionInput').classList.add('hidden');
        document.getElementById('pagoViajeInput').classList.add('hidden');

        sessionStorage.removeItem('contabilidadCache');
        await preloadContabilidadData();
        toggleEditContabilidad();
        Swal.fire({
            title: 'Éxito',
            text: 'Datos de contabilidad actualizados correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    } catch (error) {
        handleApiError(error, 'Error actualizando contabilidad');
    }
};

// Configure buttons
const configurarBotones = () => {
    const buttons = [
        {id: 'guardarContabilidadBtn', handler: guardarContabilidad},
        {id: 'volverBtn', handler: () => {
                document.body.style.opacity = '0';
                setTimeout(() => {
                    if (window.history.length > 1 && document.referrer.includes('/contabilidad')) {
                        history.back();
                    } else {
                        window.location.href = '/contabilidad';
                    }
                }, 300);
            }},
        {id: 'cerrarSesion', handler: cerrarSesion},
        {id: 'verDesgloseCompletoBtn', handler: () => document.getElementById('modalDesgloseCompleto').classList.remove('hidden')},
        {id: 'cerrarModalBtn', handler: () => document.getElementById('modalDesgloseCompleto').classList.add('hidden')},
        {id: 'editarInfoGeneralBtn', handler: toggleEditGeneral},
        {id: 'guardarInfoGeneralBtn', handler: guardarInfoGeneral},
        {id: 'cancelarEdicionBtn', handler: () => {
                toggleEditGeneral();
                updateDisplayAndSelect('nombreOperador', 'nombreOperadorSelect', notaData.nombreOperador || '');
                updateDisplayAndSelect('nombreCliente', 'nombreClienteSelect', notaData.cliente?.nombreCliente || '');
                updateDisplayAndSelect('tipoVehiculo', 'tipoVehiculoSelect', notaData.unidad?.tipoVehiculo || '');
                document.getElementById('origen').value = notaData.origen ? processCityName(notaData.origen) : '';
                document.getElementById('destino').value = notaData.destino ? processCityName(notaData.destino) : '';
                document.getElementById('noEntregaInput').value = notaData.noEntrega || '';
                document.getElementById('fechaSalidaInput').value = notaData.fechaSalida ? new Date(notaData.fechaSalida).toISOString().split('T')[0] : '';
                document.getElementById('horaSalidaInput').value = notaData.horaSalida || '';
                document.getElementById('fechaLlegadaInput').value = notaData.fechaLlegada ? new Date(notaData.fechaLlegada).toISOString().split('T')[0] : '';
                document.getElementById('horaLlegadaInput').value = notaData.horaLlegada || '';
                document.getElementById('kmInicioInput').value = notaData.kmInicio || '';
                document.getElementById('kmFinalInput').value = notaData.kmFinal || '';
                document.getElementById('gasolinaInicioSelect').value = notaData.gasolinaInicio ? 'true' : 'false';
                document.getElementById('gasolinaLevelInput').value = notaData.gasolinaLevel || '';
                document.getElementById('llantasInicioSelect').value = notaData.llantasInicio ? 'true' : 'false';
                document.getElementById('aceiteInicioSelect').value = notaData.aceiteInicio ? 'true' : 'false';
                document.getElementById('anticongelanteInicioSelect').value = notaData.anticongelanteInicio ? 'true' : 'false';
                document.getElementById('liquidoFrenosInicioSelect').value = notaData.liquidoFrenosInicio ? 'true' : 'false';
                document.getElementById('comentarioEstadoInput').value = notaData.comentarioEstado || '';
                document.getElementById('nombreClienteSelect').value = notaData.cliente?.nombreCliente || '';
            }},
        {id: 'editarContabilidadBtn', handler: toggleEditContabilidad},
        {id: 'cancelarContabilidadBtn', handler: () => {
                toggleEditContabilidad();
                document.getElementById('numeroFactura').value = notaData.cliente?.factura === 0 ? 'No Fact' : (notaData.numeroFactura || '');
                document.getElementById('numeroFacturaSpan').textContent = notaData.cliente?.factura === 0 ? 'No Fact' : (notaData.numeroFactura || 'N/A');
                document.getElementById('estadoFactSelect').value = notaData.estadoFact || 'Pendiente';
                document.getElementById('isPaidSelect').value = notaData.pago ? 'Sí' : 'No';
                document.getElementById('fechaPagoInput').value = notaData.fechaPago ? new Date(notaData.fechaPago).toISOString().split('T')[0] : '';
                document.getElementById('maniobraInput').value = notaData.maniobra || '0';
                document.getElementById('comisionInput').value = notaData.comision || '0';
                document.getElementById('pagoViajeInput').value = notaData.pagoViaje || '0';
            }},
        {id: 'toggleSidebarBtn', handler: toggleSidebar},
        {id: 'addGastoBtn', handler: () => openExpenseModal()},
        {id: 'savePhotosBtn', handler: savePhotos},
        {id: 'closeGastoModalBtn', handler: () => document.getElementById('modalGasto').classList.add('hidden')},
        {id: 'saveGastoBtn', handler: saveExpense},
        {id: 'cancelGastoBtn', handler: () => document.getElementById('modalGasto').classList.add('hidden')}
    ];

    buttons.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element)
            element.addEventListener('click', handler);
    });

    const estadoFactSelect = document.getElementById('estadoFactSelect');
    if (estadoFactSelect) {
        estadoFactSelect.addEventListener('change', async () => {
            if (estadoFactSelect.value === 'Facturado' && isEditingContabilidad) {
                const result = await Swal.fire({
                    title: '¿Ya se facturó esta nota?',
                    text: 'Esta acción actualizará el estado de la factura.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, facturado',
                    cancelButtonText: 'No, cancelar',
                    confirmButtonColor: '#f97316',
                    cancelButtonColor: '#d33',
                });
                if (!result.isConfirmed) {
                    estadoFactSelect.value = 'Pendiente';
                }
            }
        });
    }

    const photoContainers = [
        {id: 'fotoTablero', modalId: 'fotoTableroModal', imgId: 'fotoTableroImg'},
        {id: 'fotoAcuse', modalId: 'fotoAcuseModal', imgId: 'fotoAcuseImg'},
        {id: 'fotoOtraInicio', modalId: 'fotoOtraInicioModal', imgId: 'fotoOtraInicioImg'},
        {id: 'fotoOtraFin', modalId: 'fotoOtraFinModal', imgId: 'fotoOtraFinImg'}
    ];
    photoContainers.forEach(({ id, modalId, imgId }) => {
        const img = document.getElementById(imgId);
        if (img)
            img.addEventListener('click', () => openImageModal(modalId));
    });

    document.querySelectorAll('.image-modal-close').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.image-modal');
            if (modal)
                closeImageModal(modal.id);
        });
    });

    const modalDesgloseCompleto = document.getElementById('modalDesgloseCompleto');
    modalDesgloseCompleto.addEventListener('click', (e) => {
        if (e.target === modalDesgloseCompleto)
            modalDesgloseCompleto.classList.add('hidden');
    });
};

// Toggle sidebar
const toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
};

// Toggle gestion menu
const toggleGestionMenu = () => {
    document.getElementById('gestionSubmenu').classList.toggle('hidden');
};

// Open image modal
const openImageModal = (modalId) => {
    const modal = document.getElementById(modalId);
    const modalImg = document.getElementById(modalId + 'Img');
    const originalImg = document.getElementById(modalId.replace('Modal', '')).querySelector('img');
    if (modal && modalImg && originalImg && !originalImg.classList.contains('hidden')) {
        modalImg.src = originalImg.src;
        modal.style.display = 'block';
    } else {
        Swal.fire({
            title: 'Advertencia',
            text: 'No se puede abrir la imagen. No está disponible.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
};

// Close image modal
const closeImageModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal)
        modal.style.display = 'none';
};

// Process city name
const processCityName = (location) => location ? location.split(',')[0].trim() : '';

// Logout
const cerrarSesion = () => {
    localStorage.clear();
    window.location.href = '/login';
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.transition = 'opacity 0.3s ease-in-out';
    document.body.style.opacity = '1';
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
    const userRole = localStorage.getItem('isAdmin') === 'true' ? 'Administrador' : 'usuario';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = userRole === 'Administrador' ? '' : 'none';
    });
    cargarDetallesNota();
    configurarBotones();
});