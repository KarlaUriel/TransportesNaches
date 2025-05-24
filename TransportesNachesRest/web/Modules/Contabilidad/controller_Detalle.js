let notaData = null;
let isEditingGeneral = false;
let isEditingContabilidad = false;
let operadores = [];
let clientes = [];
let unidades = [];

async function fetchOperadores() {
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/operador/getAll', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        operadores = await response.json();
        populateSelect('nombreOperadorSelect', operadores, 'nombreOperador', 'nombreOperador');
    } catch (error) {
        console.error('Error fetching operadores:', error);
    }
}

async function fetchClientes() {
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/cliente/getAll', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        clientes = await response.json();
        populateSelect('nombreClienteSelect', clientes, 'nombreCliente', 'nombreCliente');
    } catch (error) {
        console.error('Error fetching clientes:', error);
    }
}

async function fetchUnidades() {
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/unidad/getAll', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        unidades = await response.json();
        populateSelect('tipoVehiculoSelect', unidades, 'tipoVehiculo', 'tipoVehiculo');
    } catch (error) {
        console.error('Error fetching unidades:', error);
    }
}

function populateSelect(selectId, items, valueField, textField) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccionar</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        select.appendChild(option);
    });
}

async function fetchInvoiceNumber(idNota) {
    try {
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        return data.numeroFactura || 'FAC-001';
    } catch (error) {
        console.error('Error fetching invoice number:', error);
        return 'FAC-001';
    }
}

async function preloadContabilidadData() {
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/nota/getAll', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const notas = await response.json();

        // Select only essential fields to reduce data size
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

        const cacheData = JSON.stringify({
            data: slimNotas,
            timestamp: Date.now()
        });

        // Estimate size in KB
        const sizeInKB = new Blob([cacheData]).size / 1024;
        console.log(`Contabilidad cache size: ${sizeInKB.toFixed(2)} KB`);

        // Attempt to store, handle quota errors
        try {
            sessionStorage.setItem('contabilidadCache', cacheData);
            console.log('Contabilidad data preloaded and cached');
        } catch (storageError) {
            console.warn('Failed to cache contabilidad data due to storage limits:', storageError);
            sessionStorage.removeItem('contabilidadCache');
            console.log('Cleared sessionStorage to free space');
        }
    } catch (error) {
        console.error('Error preloading contabilidad data:', error);
    }
}

async function cargarDetallesNota() {
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
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        notaData = await response.json();
        console.log('Nota recibida:', notaData);

        const adminOnlyItems = document.querySelectorAll('.admin-only');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        adminOnlyItems.forEach(item => {
            item.style.display = isAdmin ? 'block' : 'none';
        });

        await Promise.all([fetchOperadores(), fetchClientes(), fetchUnidades()]);

        const fotoTableroDiv = document.getElementById('fotoTablero');
        const fotoAcuseDiv = document.getElementById('fotoAcuse');
        const fotoOtraInicioDiv = document.getElementById('fotoOtraInicio');
        const fotoOtraFinDiv = document.getElementById('fotoOtraFin');

        fotoTableroDiv.innerHTML = notaData.fotoTablero
            ? `<img src="data:image/jpeg;base64,${notaData.fotoTablero}" alt="Foto Tablero" class="w-full h-full object-contain rounded-lg">`
            : '<span class="text-gray-500">Sin imagen</span>';
        fotoAcuseDiv.innerHTML = notaData.fotoAcuse
            ? `<img src="data:image/jpeg;base64,${notaData.fotoAcuse}" alt="Foto Acuse" class="w-full h-full object-contain rounded-lg">`
            : '<span class="text-gray-500">Sin imagen</span>';
        fotoOtraInicioDiv.innerHTML = notaData.fotoOtraInicio
            ? `<img src="data:image/jpeg;base64,${notaData.fotoOtraInicio}" alt="Otra Foto Inicio" class="w-full h-full object-contain rounded-lg">`
            : '<span class="text-gray-500">Sin imagen</span>';
        fotoOtraFinDiv.innerHTML = notaData.fotoOtraFin
            ? `<img src="data:image/jpeg;base64,${notaData.fotoOtraFin}" alt="Otra Foto Fin" class="w-full h-full object-contain rounded-lg">`
            : '<span class="text-gray-500">Sin imagen</span>';

        const distancia = notaData.kmFinal && notaData.kmInicio ? notaData.kmFinal - notaData.kmInicio : (notaData.distancia || 258);
        const rendimiento = notaData.unidad?.rendimientoUnidad || 7;
        const precioLitro = notaData.precioLitro || 25.50;
        const noEntrega = parseInt(notaData.noEntrega) || 0;
        const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);

        document.getElementById('idNota').textContent = notaData.idNota || 'N/A';
        document.getElementById('numeroFactura').value = await fetchInvoiceNumber(idNota);
        document.getElementById('maniobra').textContent = notaData.maniobra ? `$${parseFloat(notaData.maniobra).toFixed(2)}` : 'N/A';
        document.getElementById('maniobraInput').value = notaData.maniobra || '0';
        document.getElementById('comision').textContent = notaData.comision ? `$${parseFloat(notaData.comision).toFixed(2)}` : 'N/A';
        document.getElementById('comisionInput').value = notaData.comision || '0';
        document.getElementById('isPaid').value = notaData.pago ? 'true' : 'false';
        document.getElementById('fechaPago').value = notaData.fechaPago ? new Date(notaData.fechaPago).toISOString().split('T')[0] : '';
        const estadoFactValue = notaData.estadoFact && ['Pendiente', 'Facturado'].includes(notaData.estadoFact) ? notaData.estadoFact : 'Pendiente';
        document.getElementById('estadoFact').value = estadoFactValue;
        document.getElementById('pagoViaje').value = pagoViaje.toFixed(2);
        document.getElementById('estado').textContent = notaData.fechaLlegada ? 'COMPLETADA' : 'PENDIENTE';

        const numeroFacturaInput = document.getElementById('numeroFactura');
        const factura = notaData.cliente?.factura || 0;
        const estadoFact = notaData.estadoFact || 'Pendiente';
        if (factura === 0) {
            numeroFacturaInput.disabled = true;
            numeroFacturaInput.placeholder = 'Cliente no factura';
            numeroFacturaInput.value = '';
        } else if (estadoFact === 'Facturado') {
            numeroFacturaInput.disabled = true;
            numeroFacturaInput.placeholder = 'Factura ya asignada';
        } else {
            numeroFacturaInput.disabled = true;
            numeroFacturaInput.placeholder = 'Ej: FAC-001';
        }

        const gastosContainer = document.getElementById('gastosContainer');
        gastosContainer.innerHTML = '';
        let gastosOperativos = 0;
        if (notaData.gastos && Array.isArray(notaData.gastos) && notaData.gastos.length > 0) {
            notaData.gastos.forEach(gasto => {
                const gastoCard = document.createElement('div');
                gastoCard.classList.add('card', 'border', 'border-gray-200');
                const campos = [];
                if (gasto.tipoGasto?.descripcion && gasto.tipoGasto.descripcion !== 'N/A') campos.push(`<p><strong>Tipo Gasto:</strong> ${gasto.tipoGasto.descripcion}</p>`);
                if (gasto.total && gasto.total !== 'N/A') campos.push(`<p><strong>Total:</strong> $${parseFloat(gasto.total).toFixed(2)}</p>`);
                if (gasto.caseta && gasto.caseta !== 'N/A') campos.push(`<p><strong>Caseta:</strong> ${gasto.caseta}</p>`);
                if (gasto.tipoGas && gasto.tipoGas !== 'N/A') campos.push(`<p><strong>Tipo Gasolina:</strong> ${gasto.tipoGas}</p>`);
                if (gasto.tipoPago && gasto.tipoPago !== 'N/A') campos.push(`<p><strong>Tipo Pago:</strong> ${gasto.tipoPago}</p>`);
                if (gasto.cantidad && gasto.cantidad !== 'N/A') campos.push(`<p><strong>Cantidad:</strong> ${gasto.cantidad}</p>`);
                if (gasto.cantidadGas && gasto.cantidadGas !== 'N/A') campos.push(`<p><strong>Cantidad Gasolina:</strong> ${gasto.cantidadGas}</p>`);
                if (gasto.costo && gasto.costo !== 'N/A') campos.push(`<p><strong>Costo Unitario:</strong> $${parseFloat(gasto.costo).toFixed(2)}</p>`);
                if (gasto.subTotal && gasto.subTotal !== 'N/A') campos.push(`<p><strong>Subtotal:</strong> $${parseFloat(gasto.subTotal).toFixed(2)}</p>`);
                if (gasto.comentarioGasto && gasto.comentarioGasto !== 'N/A') campos.push(`<p><strong>Comentario:</strong> ${gasto.comentarioGasto}</p>`);
                if (campos.length > 0) {
                    gastoCard.innerHTML = `<div class="grid grid-cols-1 gap-2 text-sm text-gray-800">${campos.join('')}</div>`;
                    gastosContainer.appendChild(gastoCard);
                    gastosOperativos += parseFloat(gasto.total) || 0;
                }
            });
        } else {
            gastosContainer.innerHTML = '<p class="text-gray-500 text-center">No hay gastos operativos registrados para esta nota.</p>';
        }

        const maniobra = parseFloat(notaData.maniobra) || 0;
        const comision = parseFloat(notaData.comision) || 0;
        const totalGastos = gastosOperativos + maniobra + comision;

        document.getElementById('gastosOperativos').textContent = gastosOperativos ? `$${gastosOperativos.toFixed(2)}` : '$0.00';
        document.getElementById('maniobraTotal').textContent = maniobra ? `$${maniobra.toFixed(2)}` : '$0.00';
        document.getElementById('comisionTotal').textContent = comision ? `$${comision.toFixed(2)}` : '$0.00';
        document.getElementById('totalGastos').textContent = totalGastos ? `$${totalGastos.toFixed(2)}` : '$0.00';

        const gananciaCalculada = notaData.gananciaCalculada || (pagoViaje - totalGastos);
        const gananciaText = gananciaCalculada >= 0 
            ? `$${gananciaCalculada.toFixed(2)} (Positiva)`
            : `-$${Math.abs(gananciaCalculada).toFixed(2)} (Negativa)`;
        document.getElementById('gananciaCalculada').textContent = gananciaText;
        document.getElementById('gananciaCalculadaInput').value = gananciaCalculada.toFixed(2);

        document.getElementById('nombreOperador').textContent = notaData.operador?.nombreOperador || 'Sin operador';
        document.getElementById('nombreOperadorSelect').value = notaData.operador?.nombreOperador || '';
        document.getElementById('nombreCliente').textContent = notaData.cliente?.nombreCliente || 'Sin cliente';
        document.getElementById('nombreClienteSelect').value = notaData.cliente?.nombreCliente || '';
        document.getElementById('tipoVehiculo').textContent = notaData.unidad?.tipoVehiculo || 'N/A';
        document.getElementById('tipoVehiculoSelect').value = notaData.unidad?.tipoVehiculo || '';

        // Process route to show only city names
        const processCityName = (location) => {
            if (!location) return '';
            const parts = location.split(',');
            return parts[0].trim();
        };
        const origenCity = processCityName(notaData.origen);
        const destinoCity = processCityName(notaData.destino);
        document.getElementById('ruta').textContent = origenCity && destinoCity ? `${origenCity} - ${destinoCity}` : 'N/A';
        document.getElementById('origen').value = origenCity || '';
        document.getElementById('destino').value = destinoCity || '';

        document.getElementById('noEntrega').textContent = notaData.noEntrega || 'N/A';
        document.getElementById('noEntregaInput').value = notaData.noEntrega || '';
        document.getElementById('fechaSalida').textContent = formatearFecha(notaData.fechaSalida) || 'N/A';
        document.getElementById('fechaSalidaInput').value = notaData.fechaSalida ? new Date(notaData.fechaSalida).toISOString().split('T')[0] : '';
        document.getElementById('horaSalida').textContent = notaData.horaSalida || 'N/A';
        document.getElementById('horaSalidaInput').value = notaData.horaSalida || '';
        document.getElementById('fechaLlegada').textContent = formatearFecha(notaData.fechaLlegada) || 'N/A';
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
        document.getElementById('llantasInicio').textContent = notaData.llantasInicio ? 'Sí' : 'No';
        document.getElementById('aceiteInicio').textContent = notaData.aceiteInicio ? 'Sí' : 'No';
        document.getElementById('anticongelanteInicio').textContent = notaData.anticongelanteInicio ? 'Sí' : 'No';
        document.getElementById('liquidoFrenosInicio').textContent = notaData.liquidoFrenosInicio ? 'Sí' : 'No';
        document.getElementById('comentarioEstado').textContent = notaData.comentarioEstado || 'Sin comentarios';
        document.getElementById('comentarioEstadoInput').value = notaData.comentarioEstado || '';

        loadingOverlay.classList.add('hidden');
        preloadContabilidadData();
    } catch (error) {
        console.error('Error cargando detalles:', error);
        loadingOverlay.classList.add('hidden');
        Swal.fire({
            title: 'Error',
            text: `No se pudieron cargar los detalles de la nota: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        }).then(() => {
            window.location.href = '/contabilidad';
        });
    }
}

function formatearFecha(fecha) {
    if (!fecha) return null;
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

async function guardarContabilidad() {
    const idNota = document.getElementById('idNota').textContent;
    const numeroFacturaInput = document.getElementById('numeroFactura');
    const maniobraInput = document.getElementById('maniobraInput').value;
    const comisionInput = document.getElementById('comisionInput').value;
    const gananciaCalculadaInput = document.getElementById('gananciaCalculadaInput').value;
    const pago = document.getElementById('isPaid').value === 'true';
    const fechaPago = document.getElementById('fechaPago').value || null;
    let estadoFact = document.getElementById('estadoFact').value;

    const maniobra = parseFloat(maniobraInput) || 0;
    const comision = parseFloat(comisionInput) || 0;
    const gananciaCalculada = parseFloat(gananciaCalculadaInput) || 0;

    if (isNaN(maniobra) || isNaN(comision) || isNaN(gananciaCalculada)) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, ingrese valores numéricos válidos para maniobra, comisión y ganancia',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    if (!estadoFact) {
        estadoFact = 'Pendiente';
    }

    const response = await fetch(`https://transportesnaches.com.mx/api/nota/getById?idNota=${idNota}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const nota = await response.json();
    const factura = nota.cliente?.factura || 0;
    const distancia = nota.kmFinal && nota.kmInicio ? nota.kmFinal - nota.kmInicio : (nota.distancia || 258);
    const rendimiento = nota.unidad?.rendimientoUnidad || 7;
    const precioLitro = nota.precioLitro || 25.50;
    const noEntrega = parseInt(nota.noEntrega) || 0;
    const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
    const estado = nota.fechaLlegada ? 'COMPLETADA' : 'PENDIENTE';

    let numeroFactura = numeroFacturaInput.value;
    if (factura === 0 || estadoFact === 'Facturado') {
        numeroFactura = null;
    }

    const datosActualizados = {
        idNota,
        numeroFactura: numeroFactura === 'N/A' ? null : numeroFactura,
        maniobra,
        comision,
        gananciaCalculada,
        pago,
        fechaPago,
        estadoFact,
        pagoViaje,
        estado
    };

    try {
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/updateContabilidad`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ datosNota: JSON.stringify(datosActualizados) })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const responseData = await fetch(`https://transportesnaches.com.mx/api/nota/getById?idNota=${idNota}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const updatedNota = await responseData.json();
        notaData = updatedNota;
        const gastosOperativos = updatedNota.gastos ? updatedNota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const totalGastos = gastosOperativos + maniobra + comision;

        document.getElementById('pagoViaje').value = pagoViaje.toFixed(2);
        document.getElementById('maniobra').textContent = maniobra ? `$${maniobra.toFixed(2)}` : 'N/A';
        document.getElementById('maniobraInput').value = maniobra;
        document.getElementById('comision').textContent = comision ? `$${comision.toFixed(2)}` : 'N/A';
        document.getElementById('comisionInput').value = comision;
        document.getElementById('gananciaCalculada').textContent = gananciaCalculada >= 0 
            ? `$${gananciaCalculada.toFixed(2)} (Positiva)`
            : `-$${Math.abs(gananciaCalculada).toFixed(2)} (Negativa)`;
        document.getElementById('gananciaCalculadaInput').value = gananciaCalculada.toFixed(2);
        document.getElementById('maniobraTotal').textContent = maniobra ? `$${maniobra.toFixed(2)}` : '$0.00';
        document.getElementById('comisionTotal').textContent = comision ? `$${comision.toFixed(2)}` : '$0.00';
        document.getElementById('totalGastos').textContent = totalGastos ? `$${totalGastos.toFixed(2)}` : '$0.00';

        sessionStorage.removeItem('contabilidadCache');
        preloadContabilidadData();

        toggleEditContabilidad();
        Swal.fire({
            title: 'Éxito',
            text: 'Datos de contabilidad actualizados correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    } catch (error) {
        console.error('Error actualizando contabilidad:', error);
        Swal.fire({
            title: 'Error',
            text: `No se pudo actualizar la contabilidad: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

function toggleEditContabilidad() {
    isEditingContabilidad = !isEditingContabilidad;
    const fields = ['maniobra', 'comision', 'gananciaCalculada'];
    const inputs = ['numeroFactura', 'estadoFact', 'isPaid', 'fechaPago'];

    fields.forEach(field => {
        const span = document.getElementById(field);
        const input = document.getElementById(`${field}Input`);
        if (span && input) {
            span.classList.toggle('hidden', isEditingContabilidad);
            input.classList.toggle('hidden', !isEditingContabilidad);
        }
    });

    inputs.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            if (isEditingContabilidad) {
                element.removeAttribute('disabled');
                element.classList.remove('disabled-input');
            } else {
                element.setAttribute('disabled', 'true');
                element.classList.add('disabled-input');
            }
        }
    });

    document.getElementById('editarContabilidadBtn').classList.toggle('hidden', isEditingContabilidad);
    document.getElementById('guardarContabilidadContainer').classList.toggle('hidden', !isEditingContabilidad);
}

function toggleEditGeneral() {
    isEditingGeneral = !isEditingGeneral;
    const fields = [
        'nombreOperador', 'nombreCliente', 'tipoVehiculo', 'ruta', 'noEntrega',
        'fechaSalida', 'horaSalida', 'fechaLlegada', 'horaLlegada', 'kmInicio',
        'kmFinal', 'gasolinaInicio', 'comentarioEstado'
    ];

    fields.forEach(field => {
        const span = document.getElementById(field);
        const input = document.getElementById(`${field}${field === 'ruta' ? 'Inputs' : field === 'comentarioEstado' ? 'Input' : field === 'gasolinaInicio' ? 'Select' : 'Input'}`);
        if (span && input) {
            span.classList.toggle('hidden', isEditingGeneral);
            input.classList.toggle('hidden', !isEditingGeneral);
        }
    });

    document.getElementById('editarInfoGeneralBtn').classList.toggle('hidden', isEditingGeneral);
    document.getElementById('guardarInfoGeneralContainer').classList.toggle('hidden', !isEditingGeneral);
}

async function guardarInfoGeneral() {
    const idNota = document.getElementById('idNota').textContent;
    const nombreOperador = document.getElementById('nombreOperadorSelect').value || null;
    const nombreCliente = document.getElementById('nombreClienteSelect').value || "";
    const tipoVehiculo = document.getElementById('tipoVehiculoSelect').value || null;
    const origen = document.getElementById('origen').value || null;
    const destino = document.getElementById('destino').value || null;
    const noEntrega = document.getElementById('noEntregaInput').value || null;
    const fechaSalida = document.getElementById('fechaSalidaInput').value || null;
    const horaSalida = document.getElementById('horaSalidaInput').value || null;
    const fechaLlegada = document.getElementById('fechaLlegadaInput').value || null;
    const horaLlegada = document.getElementById('horaLlegadaInput').value || null;
    const kmInicio = document.getElementById('kmInicioInput').value || null;
    const kmFinal = document.getElementById('kmFinalInput').value || null;
    const gasolinaInicio = document.getElementById('gasolinaInicioSelect').value ? document.getElementById('gasolinaInicioSelect').value === 'true' : null;
    const comentarioEstado = document.getElementById('comentarioEstadoInput').value || null;

    if (kmInicio && kmFinal && parseFloat(kmFinal) < parseFloat(kmInicio)) {
        Swal.fire({
            title: 'Error',
            text: 'El kilómetro final debe ser mayor o igual al kilómetro inicial',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return;
    }

    const datosActualizados = {
        idNota,
        operador: nombreOperador ? { nombreOperador } : null,
        cliente: { nombreCliente },
        unidad: tipoVehiculo ? { tipoVehiculo } : null,
        origen,
        destino,
        noEntrega: noEntrega ? parseInt(noEntrega) : null,
        fechaSalida,
        horaSalida,
        fechaLlegada,
        horaLlegada,
        kmInicio: kmInicio ? parseFloat(kmInicio) : null,
        kmFinal: kmFinal ? parseFloat(kmFinal) : null,
        gasolinaInicio,
        comentarioEstado
    };

    try {
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/updateGeneralInfo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ datosNota: JSON.stringify(datosActualizados) })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        await cargarDetallesNota();
        sessionStorage.removeItem('contabilidadCache');
        preloadContabilidadData();
        toggleEditGeneral();
        Swal.fire({
            title: 'Éxito',
            text: 'Información general actualizada correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    } catch (error) {
        console.error('Error actualizando información general:', error);
        Swal.fire({
            title: 'Error',
            text: `No se pudo actualizar la información general: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

function configurarBotones() {
    const guardarContabilidadBtn = document.getElementById('guardarContabilidadBtn');
    const volverBtn = document.getElementById('volverBtn');
    const cerrarSesionBtn = document.getElementById('cerrarSesion');
    const estadoFactSelect = document.getElementById('estadoFact');
    const verDesgloseCompletoBtn = document.getElementById('verDesgloseCompletoBtn');
    const cerrarModalBtn = document.getElementById('cerrarModalBtn');
    const modalDesgloseCompleto = document.getElementById('modalDesgloseCompleto');
    const editarInfoGeneralBtn = document.getElementById('editarInfoGeneralBtn');
    const guardarInfoGeneralBtn = document.getElementById('guardarInfoGeneralBtn');
    const cancelarEdicionBtn = document.getElementById('cancelarEdicionBtn');
    const editarContabilidadBtn = document.getElementById('editarContabilidadBtn');
    const cancelarContabilidadBtn = document.getElementById('cancelarContabilidadBtn');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');

    // Photo containers
    const photoContainers = [
        { id: 'fotoTablero', modalId: 'fotoTableroModal' },
        { id: 'fotoAcuse', modalId: 'fotoAcuseModal' },
        { id: 'fotoOtraInicio', modalId: 'fotoOtraInicioModal' },
        { id: 'fotoOtraFin', modalId: 'fotoOtraFinModal' }
    ];

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.image-modal-close');

    if (guardarContabilidadBtn) {
        guardarContabilidadBtn.addEventListener('click', guardarContabilidad);
    }

    if (volverBtn) {
        volverBtn.addEventListener('click', () => {
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = '/contabilidad';
            }, 300);
        });
    }

    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener('click', cerrarSesion);
    }

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

    if (verDesgloseCompletoBtn) {
        verDesgloseCompletoBtn.addEventListener('click', () => {
            modalDesgloseCompleto.classList.remove('hidden');
        });
    }

    if (cerrarModalBtn) {
        cerrarModalBtn.addEventListener('click', () => {
            modalDesgloseCompleto.classList.add('hidden');
        });
    }

    if (editarInfoGeneralBtn) {
        editarInfoGeneralBtn.addEventListener('click', toggleEditGeneral);
    }

    if (guardarInfoGeneralBtn) {
        guardarInfoGeneralBtn.addEventListener('click', guardarInfoGeneral);
    }

    if (cancelarEdicionBtn) {
        cancelarEdicionBtn.addEventListener('click', () => {
            toggleEditGeneral();
            document.getElementById('nombreOperadorSelect').value = notaData.operador?.nombreOperador || '';
            document.getElementById('nombreClienteSelect').value = notaData.cliente?.nombreCliente || '';
            document.getElementById('tipoVehiculoSelect').value = notaData.unidad?.tipoVehiculo || '';
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
            document.getElementById('comentarioEstadoInput').value = notaData.comentarioEstado || '';
        });
    }

    if (editarContabilidadBtn) {
        editarContabilidadBtn.addEventListener('click', toggleEditContabilidad);
    }

    if (cancelarContabilidadBtn) {
        cancelarContabilidadBtn.addEventListener('click', () => {
            toggleEditContabilidad();
            document.getElementById('numeroFactura').value = notaData.numeroFactura || '';
            document.getElementById('estadoFact').value = notaData.estadoFact || 'Pendiente';
            document.getElementById('isPaid').value = notaData.isPaid ? 'true' : 'false';
            document.getElementById('fechaPago').value = notaData.fechaPago ? new Date(notaData.fechaPago).toISOString().split('T')[0] : '';
            document.getElementById('maniobraInput').value = notaData.maniobra || '0';
            document.getElementById('comisionInput').value = notaData.comision || '0';
            document.getElementById('gananciaCalculadaInput').value = notaData.gananciaCalculada || '0';
        });
    }

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Add event listeners for photo containers
    photoContainers.forEach(({ id, modalId }) => {
        const container = document.getElementById(id);
        if (container) {
            container.addEventListener('click', () => openImageModal(modalId));
        }
    });

    // Add event listeners for modal close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.image-modal');
            if (modal) {
                closeImageModal(modal.id);
            }
        });
    });

    modalDesgloseCompleto.addEventListener('click', (e) => {
        if (e.target === modalDesgloseCompleto) {
            modalDesgloseCompleto.classList.add('hidden');
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

function toggleGestionMenu() {
    const menu = document.getElementById('gestionSubmenu');
    menu.classList.toggle('hidden');
}

function openImageModal(modalId) {
    const modal = document.getElementById(modalId);
    const modalImg = document.getElementById(modalId + 'Img');
    const originalImg = document.getElementById(modalId.replace('Modal', '')).querySelector('img');
    
    if (modal && modalImg && originalImg) {
        modalImg.src = originalImg.src;
        modal.style.display = 'block';
    } else {
        console.warn(`No se pudo abrir el modal: ${modalId}. Verifique que la imagen esté disponible.`);
        Swal.fire({
            title: 'Advertencia',
            text: 'No se puede abrir la imagen. No está disponible.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

function closeImageModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function processCityName(location) {
    if (!location) return '';
    const parts = location.split(',');
    return parts[0].trim();
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.transition = 'opacity 0.3s ease-in-out';
    document.body.style.opacity = '1';
    cargarDetallesNota();
    configurarBotones();
    const userRole = localStorage.getItem('isAdmin') === 'true' ? 'administrador' : 'usuario';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = userRole === 'administrador' ? '' : 'none';
    });
});