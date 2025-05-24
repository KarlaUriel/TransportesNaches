let todasLasNotas = [];
let gastosAnuales = [];
let currentFilters = {
    mes: 'todos',
    semana: 'todos',
    operador: 'todos',
    cliente: 'todos',
    search: ''
};

function openFilterModal() {
    const modal = document.getElementById('filterModal');
    modal.style.display = 'block';
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    modal.style.display = 'none';
}

function clearCache() {
    sessionStorage.removeItem('gastosAnuales');
    console.log('Cache cleared');
}

async function cargarNotas() {
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/nota/getAll', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        const data = await response.json();
        console.log("Datos recibidos:", data);
        if (!Array.isArray(data)) {
            throw new Error("La respuesta no es un array");
        }
        todasLasNotas = data.sort((a, b) => b.idNota - a.idNota);
        console.log('Tamaño de todasLasNotas:', new Blob([JSON.stringify(todasLasNotas)]).size / 1024, 'KB');

        await cargarGastosAnuales();
        llenarSelectores(todasLasNotas);
        mostrarNotas(todasLasNotas);
        verificarNotasPendientes(todasLasNotas);
    } catch (error) {
        console.error("Error al cargar datos:", error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar los datos. Por favor, intenta de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

async function cargarGastosAnuales() {
    try {
        const cachedGastos = sessionStorage.getItem('gastosAnuales');
        if (cachedGastos) {
            gastosAnuales = JSON.parse(cachedGastos);
            mostrarGastosAnuales(gastosAnuales);
            return;
        }
        const response = await fetch('https://transportesnaches.com.mx/api/gastoAnual/getAll', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("La respuesta no es un array");
        }
        gastosAnuales = data;
        try {
            const gastosData = JSON.stringify(gastosAnuales);
            console.log('Tamaño de gastosAnuales:', new Blob([gastosData]).size / 1024, 'KB');
            sessionStorage.setItem('gastosAnuales', gastosData);
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                console.warn('sessionStorage quota exceeded for gastosAnuales, clearing cache.');
                clearCache();
            } else {
                console.error('Error storing gastosAnuales in sessionStorage:', e);
            }
        }
        mostrarGastosAnuales(gastosAnuales);
    } catch (error) {
        console.error("Error al cargar gastos anuales:", error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar los gastos anuales',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

function llenarSelectores(notas) {
    const filtroMes = document.getElementById('filtroMes');
    const filtroOperador = document.getElementById('filtroOperador');
    const filtroCliente = document.getElementById('filtroCliente');
    const filtroSemana = document.getElementById('filtroSemana');
    const mesesUnicos = new Set();
    const semanasUnicas = new Set();

    notas.forEach(nota => {
        if (nota.fechaSalida) {
            const fecha = new Date(nota.fechaSalida);
            const mes = fecha.getMonth();
            const anio = fecha.getFullYear();
            mesesUnicos.add(`${mes}-${anio}`);
        }
    });

    const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    Array.from(mesesUnicos)
            .sort((a, b) => {
                const [mesA, anioA] = a.split('-').map(Number);
                const [mesB, anioB] = b.split('-').map(Number);
                return anioA - anioB || mesA - mesB;
            })
            .forEach(mesAnio => {
                const [mes, anio] = mesAnio.split('-').map(Number);
                const option = document.createElement('option');
                option.value = mesAnio;
                option.textContent = `${mesesNombres[mes]} ${anio}`;
                filtroMes.appendChild(option);
            });

    notas.forEach(nota => {
        if (nota.fechaSalida) {
            const fecha = new Date(nota.fechaSalida);
            const diaSemana = fecha.getDay();
            const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
            const semanaInicio = new Date(fecha.setDate(diff));
            const semanaFin = new Date(semanaInicio);
            semanaFin.setDate(semanaInicio.getDate() + 6);
            const semanaKey = `${semanaInicio.toISOString().split('T')[0]}`;
            semanasUnicas.add(semanaKey);
        }
    });

    Array.from(semanasUnicas)
            .sort((a, b) => new Date(a) - new Date(b))
            .forEach(semanaKey => {
                const semanaInicio = new Date(semanaKey);
                const semanaFin = new Date(semanaInicio);
                semanaFin.setDate(semanaInicio.getDate() + 6);
                const option = document.createElement('option');
                option.value = semanaKey;
                option.textContent = `${semanaInicio.toLocaleDateString()} - ${semanaFin.toLocaleDateString()}`;
                filtroSemana.appendChild(option);
            });

    const operadoresUnicos = new Set();
    notas.forEach(nota => {
        if (nota.operador?.nombreOperador) {
            operadoresUnicos.add(nota.operador.nombreOperador);
        }
    });

    Array.from(operadoresUnicos)
            .sort()
            .forEach(nombreOperador => {
                const option = document.createElement('option');
                option.value = nombreOperador;
                option.textContent = nombreOperador;
                filtroOperador.appendChild(option);
            });

    const clientesUnicos = new Set();
    notas.forEach(nota => {
        if (nota.cliente?.nombreCliente) {
            clientesUnicos.add(nota.cliente.nombreCliente);
        }
    });

    Array.from(clientesUnicos)
            .sort()
            .forEach(nombreCliente => {
                const option = document.createElement('option');
                option.value = nombreCliente;
                option.textContent = nombreCliente;
                filtroCliente.appendChild(option);
            });
}

function applyFilters() {
    currentFilters.mes = document.getElementById('filtroMes').value;
    currentFilters.semana = document.getElementById('filtroSemana').value;
    currentFilters.operador = document.getElementById('filtroOperador').value;
    currentFilters.cliente = document.getElementById('filtroCliente').value;
    filtrarNotas();
    closeFilterModal();
}

function filtrarNotas() {
    let notasFiltradas = [...todasLasNotas];

    if (currentFilters.mes !== 'todos') {
        const [mes, anio] = currentFilters.mes.split('-').map(Number);
        notasFiltradas = notasFiltradas.filter(nota => {
            if (!nota.fechaSalida)
                return false;
            const fecha = new Date(nota.fechaSalida);
            return fecha.getMonth() === mes && fecha.getFullYear() === anio;
        });
    }

    if (currentFilters.semana !== 'todos') {
        const semanaInicio = new Date(currentFilters.semana);
        const semanaFin = new Date(semanaInicio);
        semanaFin.setDate(semanaInicio.getDate() + 6);
        notasFiltradas = notasFiltradas.filter(nota => {
            if (!nota.fechaSalida)
                return false;
            const fecha = new Date(nota.fechaSalida);
            return fecha >= semanaInicio && fecha <= semanaFin;
        });
    }

    if (currentFilters.operador !== 'todos') {
        notasFiltradas = notasFiltradas.filter(nota => {
            return nota.operador?.nombreOperador === currentFilters.operador;
        });
    }

    if (currentFilters.cliente !== 'todos') {
        notasFiltradas = notasFiltradas.filter(nota => {
            return nota.cliente?.nombreCliente === currentFilters.cliente;
        });
    }

    if (currentFilters.search) {
        notasFiltradas = notasFiltradas.filter(nota => {
            const idNota = nota.idNota?.toString() || '';
            const cliente = nota.cliente?.nombreCliente?.toLowerCase() || '';
            const operador = nota.operador?.nombreOperador?.toLowerCase() || '';
            const ruta = `${nota.origen || ''} ${nota.destino || ''}`.toLowerCase();
            const unidad = nota.unidad?.tipoVehiculo?.toLowerCase() || '';
            const fecha = formatearFecha(nota.fechaSalida)?.toLowerCase() || '';
            return (
                    idNota.includes(currentFilters.search) ||
                    cliente.includes(currentFilters.search) ||
                    operador.includes(currentFilters.search) ||
                    ruta.includes(currentFilters.search) ||
                    unidad.includes(currentFilters.search) ||
                    fecha.includes(currentFilters.search)
                    );
        });
    }

    notasFiltradas = notasFiltradas.sort((a, b) => b.idNota - a.idNota);
    mostrarNotas(notasFiltradas);
}

document.getElementById('searchBar').addEventListener('input', () => {
    currentFilters.search = document.getElementById('searchBar').value.trim().toLowerCase();
    filtrarNotas();
});

document.getElementById('openFilterModal').addEventListener('click', openFilterModal);
document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
document.getElementById('closeFilterModal').addEventListener('click', closeFilterModal);

document.getElementById('descargarExcel').addEventListener('click', () => {
    const mesSeleccionado = currentFilters.mes;
    let notasFiltradas = [...todasLasNotas];
    let gastosAnualesDiarios = 0;
    let gastosAnualesTotal = 0;

    if (mesSeleccionado !== 'todos') {
        const [mes, anio] = mesSeleccionado.split('-').map(Number);
        notasFiltradas = notasFiltradas.filter(nota => {
            if (!nota.fechaSalida)
                return false;
            const fecha = new Date(nota.fechaSalida);
            return fecha.getMonth() === mes && fecha.getFullYear() === anio;
        });
        gastosAnualesTotal = calcularGastosAnualesTotal(anio);
        gastosAnualesDiarios = gastosAnualesTotal / 365;
    } else {
        gastosAnualesTotal = gastosAnuales.reduce((suma, gasto) => suma + (gasto.monto || 0), 0);
        gastosAnualesDiarios = gastosAnualesTotal / 365;
    }

    if (currentFilters.operador !== 'todos') {
        notasFiltradas = notasFiltradas.filter(nota => {
            return nota.operador?.nombreOperador === currentFilters.operador;
        });
    }

    if (currentFilters.cliente !== 'todos') {
        notasFiltradas = notasFiltradas.filter(nota => {
            return nota.cliente?.nombreCliente === currentFilters.cliente;
        });
    }

    notasFiltradas = notasFiltradas.sort((a, b) => b.idNota - a.idNota);

    const datosExcel = notasFiltradas.map(nota => {
        const distancia = (nota.kmFinal && nota.kmInicio) ? nota.kmFinal - nota.kmInicio : 0;
        const rendimiento = nota.unidad?.rendimientoUnidad || 7;
        const precioLitro = nota.valorLitro || 25.50;
        const noEntrega = parseInt(nota.noEntrega) || 0;
        if (nota.idNota === 77) {
            console.log(`Nota 77: distancia=${distancia}, rendimiento=${rendimiento}, precioLitro=${precioLitro}, noEntrega=${noEntrega}`);
        }
        const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        if (nota.idNota === 77) {
            console.log(`Nota 77: pagoViaje=${pagoViaje}`);
        }
        const gastosOperativos = nota.gastos ? nota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(nota.maniobra) || 0;
        const comision = parseFloat(nota.maniobra) || 0;
        const totalGastosNota = gastosOperativos + maniobra + comision + gastosAnualesDiarios;
        const egresos = gastosOperativos + maniobra + comision;
        const saldo = pagoViaje - totalGastosNota;
        const porcentaje = pagoViaje > 0 ? ((saldo / pagoViaje) * 100).toFixed(2) : 0;

        const gastoCategories = {
            combus: 0,
            casetas: 0,
            consumo: 0,
            hospedaje: 0,
            otros: 0
        };
        if (nota.gastos) {
            nota.gastos.forEach(g => {
                const desc = g.tipoGasto?.descripcion?.toLowerCase() || '';
                if (desc.includes('combus'))
                    gastoCategories.combus += g.total || 0;
                else if (desc.includes('caseta'))
                    gastoCategories.casetas += g.total || 0;
                else if (desc.includes('consumo'))
                    gastoCategories.consumo += g.total || 0;
                else if (desc.includes('hospedaje'))
                    gastoCategories.hospedaje += g.total || 0;
                else
                    gastoCategories.otros += g.total || 0;
            });
        }

        return {
            "n bitacora": nota.idNota || 'N/A',
            "No. Factura": nota.cliente?.factura === 1 ? (nota.numeroFactura || generarNumeroFactura(todasLasNotas)) : 'NO FACT',
            "Fecha": formatearFecha(nota.fechaSalida) || 'N/A',
            "Cliente": nota.cliente?.nombreCliente || 'Sin cliente',
            "Operador": nota.operador?.nombreOperador || 'Sin operador',
            "Unidad": nota.unidad?.tipoVehiculo || 'N/A',
            "Ruta": formatRuta(nota.origen, nota.destino) || 'N/A',
            "Ingresos": `$${pagoViaje.toFixed(2)}`,
            "combus": `$${gastoCategories.combus.toFixed(2)}`,
            "casetas": `$${gastoCategories.casetas.toFixed(2)}`,
            "consumo": `$${gastoCategories.consumo.toFixed(2)}`,
            "hospedaje": `$${gastoCategories.hospedaje.toFixed(2)}`,
            "otros": `$${gastoCategories.otros.toFixed(2)}`,
            "Maniobra": `$${maniobra.toFixed(2)}`,
            "Comisión": `$${comision.toFixed(2)}`,
            "Egresos": `$${egresos.toFixed(2)}`,
            "Gastos Anuales (Diarios)": `$${gastosAnualesDiarios.toFixed(2)}`,
            "Total Gastos": `$${totalGastosNota.toFixed(2)}`,
            "Saldo": `$${saldo.toFixed(2)}`,
            "Porcentaje": `${porcentaje}%`,
            "No. Entregas": noEntrega
        };
    });

    // Create a new worksheet
    const worksheet = XLSX.utils.json_to_sheet(datosExcel, {header: Object.keys(datosExcel[0])});

    // Apply styles to cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const nota = notasFiltradas[row - 1];
        const isFinalized = !!nota.fechaLlegada;
        const isPendingInvoice = nota.cliente?.factura === 1 && nota.estadoFact === 'PENDIENTE';

        // Log styling decisions for debugging
        console.log(`Row ${row} (idNota=${nota.idNota}): finalized=${isFinalized}, pendingInvoice=${isPendingInvoice}`);

        // Define row background color
        const rowFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {rgb: isFinalized ? 'CCFFCC' : 'FFCCCC'} // Light green or light red
        };

        // Apply background to all cells in the row
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({r: row, c: col});
            if (!worksheet[cellAddress])
                continue;
            worksheet[cellAddress].s = {
                fill: rowFill,
                alignment: {vertical: 'center', horizontal: 'center'}
            };
        }

        // Apply yellow to "No. Factura" (column B, index 1) if pending
        if (isPendingInvoice) {
            const facturaCell = XLSX.utils.encode_cell({r: row, c: 1});
            if (worksheet[facturaCell]) {
                worksheet[facturaCell].s = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {rgb: 'FFFF99'} // Yellow
                    },
                    alignment: {vertical: 'center', horizontal: 'center'}
                };
                console.log(`Applied yellow to ${facturaCell}`);
            }
        }
    }

    // Ensure headers are unstyled
    for (let col = range.s.c; col <= range.e.c; col++) {
        const headerCell = XLSX.utils.encode_cell({r: 0, c: col});
        if (worksheet[headerCell]) {
            worksheet[headerCell].s = {
                fill: {type: 'pattern', pattern: 'solid', fgColor: {rgb: 'FFFFFF'}},
                alignment: {vertical: 'center', horizontal: 'center'}
            };
        }
    }

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contabilidad');

    // Set column widths for better readability
    worksheet['!cols'] = [
        {wch: 10}, {wch: 12}, {wch: 12}, {wch: 20}, {wch: 20},
        {wch: 15}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 12},
        {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12},
        {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 12}
    ];

    // Generate file name
    let nombreArchivo = 'Contabilidad_Todos.xlsx';
    if (mesSeleccionado !== 'todos') {
        const [mes, anio] = mesSeleccionado.split('-').map(Number);
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        nombreArchivo = `Contabilidad_${mesesNombres[mes]}_${anio}.xlsx`;
    }

    // Write the file
    XLSX.writeFile(workbook, nombreArchivo);
});

function formatearFecha(fecha) {
    if (!fecha)
        return null;
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

function formatRuta(origen, destino) {
    if (!origen || !destino)
        return 'N/A';
    const formattedOrigen = origen.includes('León') ? 'León' : origen;
    const formattedDestino = destino.includes('León') ? 'León' : destino;
    return `${formattedOrigen} - ${formattedDestino}`;
}

function verificarNotasPendientes(notas) {
    const pendientes = notas.filter(nota => nota.cliente?.factura === 1 && nota.estadoFact === 'Pendiente');
    if (pendientes.length > 0) {
        Swal.fire({
            title: 'Notas Pendientes de Facturación',
            text: `Hay ${pendientes.length} nota(s) con estado "Pendiente de Facturación". Por favor, revisa las tarjetas.`,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}

async function actualizarNumeroFactura(idNota, numeroFactura) {
    try {
        const response = await fetch(`https://transportesnaches.com.mx/api/nota/updateFactura`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({idNota, numeroFactura})
        });
        if (!response.ok) {
            throw new Error('Error al actualizar número de factura');
        }
        todasLasNotas = todasLasNotas.map(nota =>
            nota.idNota === idNota ? {...nota, numeroFactura} : nota
        );
        return true;
    } catch (error) {
        console.error(`Error al actualizar la factura para idNota=${idNota}:`, error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el número de factura',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return false;
    }
}

function generarNumeroFactura(notas) {
    const facturas = notas
            .map(nota => nota.numeroFactura)
            .filter(f => f && f.startsWith('FAC-'))
            .map(f => parseInt(f.replace('FAC-', '')))
            .filter(n => !isNaN(n));
    const maxNumero = facturas.length > 0 ? Math.max(...facturas) : 0;
    return `FAC-${String(maxNumero + 1).padStart(3, '0')}`;
}

function calcularGastosAnualesMensuales(mes, anio) {
    return gastosAnuales
            .filter(gasto => gasto.anio === anio)
            .reduce((suma, gasto) => suma + (gasto.monto / 12), 0);
}

function calcularGastosAnualesTotal(anio) {
    return gastosAnuales
            .filter(gasto => gasto.anio === anio)
            .reduce((suma, gasto) => suma + (gasto.monto || 0), 0);
}

function mostrarNotas(notas) {
    const contenedor = document.getElementById('notasContainer');
    contenedor.innerHTML = '';

    let totalGastosOperativos = 0;
    let totalManiobra = 0;
    let totalComision = 0;
    let totalGastos = 0;
    let totalIngresos = 0;
    let totalGananciaNotas = 0;
    let totalNomina = 0;
    let gastosAnualesDiarios = 0;
    let gastosAnualesTotal = 0;
    let gastosMensuales = 0;
    let gananciaMensual = 0;
    let gananciaAnual = 0;

    const mesSeleccionado = currentFilters.mes;
    const operadorSeleccionado = currentFilters.operador;
    const semanaSeleccionada = currentFilters.semana;
    let anioSeleccionado = null;

    if (mesSeleccionado !== 'todos') {
        const [mes, anio] = mesSeleccionado.split('-').map(Number);
        anioSeleccionado = anio;
        gastosAnualesTotal = calcularGastosAnualesTotal(anio);
        gastosAnualesDiarios = gastosAnualesTotal / 365;
    } else {
        gastosAnualesTotal = gastosAnuales.reduce((suma, gasto) => suma + (gasto.monto || 0), 0);
        gastosAnualesDiarios = gastosAnualesTotal / 365;
        anioSeleccionado = new Date().getFullYear();
    }

    notas.forEach(nota => {
        console.log(`Nota ${nota.idNota}: cliente=${nota.cliente?.nombreCliente}, factura=${nota.cliente?.factura}, estadoFact=${nota.estadoFact}, numeroFactura=${nota.numeroFactura}`);

        const distancia = (nota.kmFinal && nota.kmInicio) ? nota.kmFinal - nota.kmInicio : 0;
        const rendimiento = nota.unidad?.rendimientoUnidad || 7;
        const precioLitro = nota.valorLitro || 25.50;
        const noEntrega = parseInt(nota.noEntrega) || 0;
        if (nota.idNota === 77) {
            console.log(`Nota 77: distancia=${distancia}, rendimiento=${rendimiento}, precioLitro=${precioLitro}, noEntrega=${noEntrega}`);
        }
        const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        if (nota.idNota === 77) {
            console.log(`Nota 77: pagoViaje=${pagoViaje}`);
        }
        const gastosOperativos = nota.gastos ? nota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(nota.maniobra) || 0;
        const comision = parseFloat(nota.maniobra) || 0;
        const totalGastosNota = gastosOperativos + maniobra + comision + gastosAnualesDiarios;

        totalGastosOperativos += gastosOperativos;
        totalManiobra += maniobra;
        totalComision += comision;
        totalGastos += totalGastosNota;
        totalIngresos += pagoViaje;

        if (semanaSeleccionada !== 'todos') {
            const semanaInicio = new Date(semanaSeleccionada);
            const semanaFin = new Date(semanaInicio);
            semanaFin.setDate(semanaInicio.getDate() + 6);
            const fecha = new Date(nota.fechaSalida);
            if (fecha >= semanaInicio && fecha <= semanaFin && (operadorSeleccionado === 'todos' || nota.operador?.nombreOperador === operadorSeleccionado)) {
                totalNomina += comision + maniobra;
            }
        } else if (operadorSeleccionado !== 'todos' && nota.operador?.nombreOperador === operadorSeleccionado) {
            totalNomina += comision + maniobra;
        }

        const gananciaCalculada = pagoViaje - totalGastosNota;
        totalGananciaNotas += gananciaCalculada;

        let estadoTexto = '';
        let estadoClase = '';
        let fondoClase = 'bg-white';

        if (!nota.cliente || nota.cliente.factura === undefined) {
            estadoTexto = 'NO FACT';
            estadoClase = 'text-gray-600';
            console.warn(`Nota ${nota.idNota}: Cliente o factura no definido`);
        } else if (nota.cliente.factura === 1) {
            if (nota.estadoFact === 'Pendiente') {
                estadoTexto = 'PENDIENTE';
                estadoClase = 'text-red-600';
                fondoClase = 'bg-red-100';
            } else if (nota.estadoFact === 'Facturado') {
                estadoTexto = 'FACTURADO';
                estadoClase = 'text-green-600';
            } else {
                estadoTexto = 'DESCONOCIDO';
                estadoClase = 'text-yellow-600';
                fondoClase = 'bg-yellow-100';
                console.warn(`Nota ${nota.idNota}: estadoFact inválido (${nota.estadoFact})`);
            }
        } else if (nota.cliente.factura === 0) {
            estadoTexto = 'NO FACT';
            estadoClase = 'text-gray-600';
        } else {
            estadoTexto = 'ERROR';
            estadoClase = 'text-red-600';
            fondoClase = 'bg-red-100';
            console.error(`Nota ${nota.idNota}: Valor de factura inválido (${nota.cliente.factura})`);
        }

        const card = document.createElement('div');
        card.classList.add(
                'card', 'bg-white', 'rounded-lg', 'p-4', 'shadow-md', 'border', 'border-orange-300', 'cursor-pointer',
                fondoClase
                );

        const numeroFactura = nota.cliente?.factura === 1 ? (nota.numeroFactura || generarNumeroFactura(todasLasNotas)) : 'NO FACT';
        const porTipoGasto = nota.gastos?.map(g => `${g.tipoGasto?.descripcion}: $${(g.total || 0).toFixed(2)}`).join(', ') || 'N/A';
        const gananciaText = gananciaCalculada !== undefined && gananciaCalculada !== null ? `$${gananciaCalculada.toFixed(2)} ${gananciaCalculada >= 0 ? '(Positiva)' : '(Negativa)'}` : 'N/A';
        const viajeStatus = nota.fechaLlegada ? 'Finalizado' : 'No Finalizado';
        const viajeStatusColor = nota.fechaLlegada ? 'text-green-600' : 'text-red-600';

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="text-sm font-bold text-gray-800">Nota #${nota.idNota || 'N/D'}</div>
                <div class="flex items-center space-x-2">
                    <div class="text-sm font-semibold ${estadoClase}">
                        ${estadoTexto}
                    </div>
                    <button class="delete-btn text-red-600 hover:text-red-800" data-id="${nota.idNota}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm text-gray-800">
                <div class="flex items-center">
                    <span class="font-semibold mr-1">N.º Facto:</span>
                    <input type="text" value="${numeroFactura}" class="factura-input border border-gray-300 rounded p-1 w-full text-sm" data-id="${nota.idNota}" ${nota.cliente?.factura !== 1 ? 'disabled' : ''}>
                </div>
                <div>
                    <span class="font-semibold">Fecha Elab.:</span> ${formatearFecha(nota.fechaSalida) || 'N/D'}
                </div>
                <div>
                    <span class="font-semibold">Cliente:</span> ${nota.cliente?.nombreCliente || 'Sin cliente'}
                </div>
                <div>
                    <span class="font-semibold">Ruta:</span> ${formatRuta(nota.origen, nota.destino) || 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Operador:</span> ${nota.operador?.nombreOperador || 'Sin operador'}
                </div>
                <div>
                    <span class="font-semibold">Unidad:</span> ${nota.unidad?.tipoVehiculo || 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Viaje:</span> <span class="${viajeStatusColor}">${viajeStatus}</span>
                </div>
                <div class="col-span-2">
                    <span class="font-semibold">Por Tipo de Gasto:</span> ${porTipoGasto}
                </div>
                <div>
                    <span class="font-semibold">Gastos Operativos:</span> ${gastosOperativos ? `$${gastosOperativos.toFixed(2)}` : 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Maniobra:</span> ${maniobra ? `$${maniobra.toFixed(2)}` : 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Comisión:</span> ${comision ? `$${comision.toFixed(2)}` : 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Total Gastos:</span> ${totalGastosNota ? `$${totalGastosNota.toFixed(2)}` : 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Pago Viaje (Calculado):</span> $${pagoViaje.toFixed(2)}
                </div>
                <div>
                    <span class="font-semibold">Ganancia:</span> ${gananciaText}
                </div>
                <div>
                    <span class="font-semibold">No. Entregas:</span> ${noEntrega || '0'}
                </div>
            </div>
        `;

        const input = card.querySelector('.factura-input');
        input.addEventListener('click', e => e.stopPropagation());
        input.addEventListener('change', async e => {
            const idNota = e.target.dataset.id;
            const nuevoNumero = e.target.value.trim();
            if (nuevoNumero && nota.cliente?.factura === 1) {
                const exito = await actualizarNumeroFactura(idNota, nuevoNumero);
                if (exito) {
                    nota.numeroFactura = nuevoNumero;
                    Swal.fire({
                        title: 'Éxito',
                        text: 'Número de factura actualizado',
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#f97316',
                    });
                }
            }
        });

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn') && !e.target.closest('.factura-input')) {
                window.location.href = `/detalle?id=${nota.idNota}`;
            }
        });

        contenedor.appendChild(card);
    });

    const totalGastosConAnuales = totalGastos;
    const gananciaNeta = totalIngresos - totalGastos;
    gastosMensuales = (totalGastosOperativos + totalManiobra + totalComision + gastosAnualesTotal) / 12;
    gananciaMensual = gananciaNeta / 12;
    gananciaAnual = gananciaNeta;

    const resumenContainer = document.getElementById('resumenFinancieroContainer');
    resumenContainer.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-orange-300 pb-2">Resumen Financiero</h2>
        <div class="space-y-4">
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-orange-600 mb-2">Ingresos</h3>
                <ul class="list-disc list-inside pl-4 text-gray-700">
                    <li><span class="font-medium">Total de Ingresos:</span> $${totalIngresos.toFixed(2)}</li>
                </ul>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-orange-600 mb-2">Gastos</h3>
                <ul class="list-disc list-inside pl-4 text-gray-700">
                    <li><span class="font-medium">Gastos Operativos:</span> $${totalGastosOperativos.toFixed(2)}</li>
                    <li><span class="font-medium">Maniobra:</span> $${totalManiobra.toFixed(2)}</li>
                    <li><span class="font-medium">Comisión:</span> $${totalComision.toFixed(2)}</li>
                    <li><span class="font-medium">Total Gastos de Notas:</span> $${(totalGastosOperativos + totalManiobra + totalComision).toFixed(2)}</li>
                    <li class="ml-4">
                        <span class="font-medium">Gastos Anuales Fijos (Diarios):</span> $${gastosAnualesDiarios.toFixed(2)}
                        <ul class="list-circle list-inside pl-4">
                            <li><span class="font-medium">Gastos Anuales Fijos (Total):</span> $${gastosAnualesTotal.toFixed(2)}</li>
                        </ul>
                    </li>
                    <li class="font-medium mt-2">Total de Gastos:</span> $${totalGastosConAnuales.toFixed(2)}</li>
                </ul>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-orange-600 mb-2">Ganancias</h3>
                <ul class="list-disc list-inside pl-4 text-gray-700">
                    <li><span class="font-medium">Ganancia Neta:</span> $${gananciaNeta.toFixed(2)} ${gananciaNeta >= 0 ? '(Positiva)' : '(Negativa)'}</li>
                    <li class="ml-4"><span class="font-medium">Ganancia Mensual:</span> $${gananciaMensual.toFixed(2)}</li>
                    <li class="ml-4"><span class="font-medium">Ganancia Anual:</span> $${gananciaAnual.toFixed(2)}</li>
                </ul>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-orange-600 mb-2">Nómina</h3>
                <ul class="list-disc list-inside pl-4 text-gray-700">
                    <li><span class="font-medium">Total Nómina:</span> $${totalNomina.toFixed(2)}</li>
                </ul>
            </div>
        </div>
    `;

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idNota = parseInt(btn.dataset.id);
            Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás deshacer esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f97316',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`https://transportesnaches.com.mx/api/nota/delete`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                            body: `idNota=${idNota}`
                        });
                        const result = await response.json();
                        if (result.error) {
                            throw new Error(result.error);
                        }
                        todasLasNotas = todasLasNotas.filter(nota => nota.idNota !== idNota);
                        mostrarNotas(todasLasNotas);
                        Swal.fire({
                            title: 'Eliminado',
                            text: 'La nota ha sido eliminada',
                            icon: 'success',
                            confirmButtonColor: '#f97316'
                        });
                    } catch (error) {
                        Swal.fire({
                            title: 'Error',
                            text: error.message || 'No se pudo eliminar la nota',
                            icon: 'error',
                            confirmButtonColor: '#f97316'
                        });
                    }
                }
            });
        });
    });
}

function mostrarGastosAnuales(gastos) {
    const tableBody = document.getElementById('gastosAnualesTableBody');
    tableBody.innerHTML = '';

    gastos.forEach(gasto => {
        const fechasPago = Array.isArray(gasto.fechasPago) ? gasto.fechasPago.join(', ') : gasto.fechasPago || 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2 px-4 border-b">${gasto.descripcion}</td>
            <td class="py-2 px-4 border-b">$${gasto.monto.toFixed(2)}</td>
            <td class="py-2 px-4 border-b">${gasto.anio}</td>
            <td class="py-2 px-4 border-b">${formatearFecha(gasto.fechaInicio) || 'N/A'}</td>
            <td class="py-2 px-4 border-b">${fechasPago}</td>
            <td class="py-2 px-4 border-b">
                <button class="edit-btn2 text-blue-600 hover:text-blue-800 mr-2" data-id="${gasto.idGastoAnual}">Editar</button>
                <button class="delete-btn2 text-red-600 hover:text-red-800" data-id="${gasto.idGastoAnual}">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn2').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const gasto = gastosAnuales.find(g => g.idGastoAnual === id);
            document.getElementById('idGastoAnual').value = gasto.idGastoAnual;
            document.getElementById('descripcionGasto').value = gasto.descripcion;
            document.getElementById('montoGasto').value = gasto.monto;
            document.getElementById('anioGasto').value = gasto.anio;
            document.getElementById('fechaInicio').value = gasto.fechaInicio || '';
            const fechasPagoInput = document.getElementById('fechasPago');
            fechasPagoInput._flatpickr.setDate(Array.isArray(gasto.fechasPago) ? gasto.fechasPago : gasto.fechasPago ? gasto.fechasPago.split(',').map(f => f.trim()) : []);
            document.getElementById('submitGastoBtn').textContent = 'Actualizar';
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            
            // Scroll to the form and focus the first input
            const formContainer = document.getElementById('gastosFormContainer');
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('descripcionGasto').focus();
        });
    });

    document.querySelectorAll('.delete-btn2').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idGastoAnual = parseInt(btn.dataset.id);
            console.log(`Intentando eliminar gasto con idGastoAnual: ${idGastoAnual}`);

            if (!idGastoAnual || isNaN(idGastoAnual)) {
                console.error('ID de gasto inválido:', idGastoAnual);
                Swal.fire({
                    title: 'Error',
                    text: 'ID de gasto inválido. No se puede proceder con la eliminación.',
                    icon: 'error',
                    confirmButtonColor: '#f97316'
                });
                return;
            }

            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás deshacer esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f97316',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                try {
                    const response = await fetch(`https://transportesnaches.com.mx/api/gastoAnual/delete`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: `idGastoAnual=${idGastoAnual}`
                    });

                    console.log('Respuesta del servidor:', response.status, response.statusText);

                    let result = {};
                    try {
                        result = await response.json();
                    } catch (e) {
                        if (response.ok) {
                            result = {success: true};
                        } else {
                            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
                        }
                    }

                    if (!response.ok) {
                        throw new Error(result.error || `Error del servidor: ${response.status} ${response.statusText}`);
                    }

                    gastosAnuales = gastosAnuales.filter(g => g.idGastoAnual !== idGastoAnual);
                    console.log(`Gastos después de eliminar: ${gastosAnuales.length}`);

                    try {
                        sessionStorage.setItem('gastosAnuales', JSON.stringify(gastosAnuales));
                    } catch (e) {
                        if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                            console.warn('sessionStorage quota exceeded for gastosAnuales update, clearing cache.');
                            clearCache();
                        } else {
                            console.error('Error al actualizar sessionStorage:', e);
                        }
                    }

                    mostrarGastosAnuales(gastosAnuales);
                    mostrarNotas(todasLasNotas);

                    Swal.fire({
                        title: 'Eliminado',
                        text: 'El gasto ha sido eliminado correctamente',
                        icon: 'success',
                        confirmButtonColor: '#f97316'
                    });
                } catch (error) {
                    console.error('Error al eliminar gasto:', error);
                    Swal.fire({
                        title: 'Error',
                        text: `No se pudo eliminar el gasto: ${error.message}`,
                        icon: 'error',
                        confirmButtonColor: '#f97316'
                    });
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const modalGastos = document.getElementById('gastosAnualesModal');
    const btnGastos = document.getElementById('gastosAnualesBtn');
    const spanGastos = document.getElementById('spanGastos');
    const formGastos = document.getElementById('gastosAnualesForm');
    const cancelBtnGastos = document.getElementById('cancelEditBtn');

    const modalResumen = document.getElementById('resumenFinancieroModal');
    const btnResumen = document.getElementById('mostrarResumenBtn');
    const spanResumen = document.getElementById('spanResumen');

    // Initialize Flatpickr for fechasPago
    const fechasPagoInput = document.getElementById('fechasPago');
    flatpickr(fechasPagoInput, {
        mode: 'multiple',
        dateFormat: 'Y-m-d',
        onChange: function (selectedDates) {
            fechasPagoInput.value = selectedDates.map(date => date.toISOString().split('T')[0]).join(', ');
        }
    });

    if (btnGastos && modalGastos && spanGastos) {
        btnGastos.onclick = function () {
            modalGastos.style.display = 'block';
        };

        spanGastos.onclick = function () {
            modalGastos.style.display = 'none';
            resetFormGastos();
        };
    }

    if (btnResumen && modalResumen && spanResumen) {
        btnResumen.onclick = function () {
            modalResumen.style.display = 'block';
        };

        spanResumen.onclick = function () {
            modalResumen.style.display = 'none';
        };
    }

    window.onclick = function (event) {
        if (event.target == modalGastos) {
            modalGastos.style.display = 'none';
            resetFormGastos();
        }
        if (event.target == modalResumen) {
            modalResumen.style.display = 'none';
        }
        if (event.target == document.getElementById('filterModal')) {
            closeFilterModal();
        }
    };

    if (cancelBtnGastos && formGastos) {
        cancelBtnGastos.onclick = function () {
            resetFormGastos();
        };

        formGastos.onsubmit = async function (e) {
            e.preventDefault();
            const idGastoAnual = parseInt(document.getElementById('idGastoAnual').value) || 0;
            const descripcion = document.getElementById('descripcionGasto').value.trim();
            const monto = parseFloat(document.getElementById('montoGasto').value);
            const anio = parseInt(document.getElementById('anioGasto').value);
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechasPagoInput = document.getElementById('fechasPago').value.trim();
            const fechasPago = fechasPagoInput ? fechasPagoInput.split(',').map(f => f.trim()) : [];

            if (!descripcion || isNaN(monto) || monto <= 0 || isNaN(anio) || !fechaInicio || !fechasPago.length) {
                Swal.fire({
                    title: 'Error',
                    text: 'Por favor, completa todos los campos correctamente',
                    icon: 'error',
                    confirmButtonColor: '#f97316'
                });
                return;
            }

            try {
                let response;
                const payload = {idGastoAnual, descripcion, monto, anio, fechaInicio, fechasPago};
                if (idGastoAnual) {
                    response = await fetch(`https://transportesnaches.com.mx/api/gastoAnual/update`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    console.log(payload);
                } else {
                    response = await fetch(`https://transportesnaches.com.mx/api/gastoAnual/insert`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                }

                const result = await response.json();
                if (result.error) {
                    throw new Error(result.error);
                }

                if (idGastoAnual) {
        const index = gastosAnuales.findIndex(g => g.idGastoAnual === idGastoAnual);
                    gastosAnuales[index] = {idGastoAnual, descripcion, monto, anio, fechaInicio, fechasPago};
                } else {
                    gastosAnuales.push({idGastoAnual: result.idGastoAnual || (gastosAnuales.length + 1), descripcion, monto, anio, fechaInicio, fechasPago});
                }

                try {
                    sessionStorage.setItem('gastosAnuales', JSON.stringify(gastosAnuales));
                } catch (e) {
                    if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                        console.warn('sessionStorage quota exceeded for gastosAnuales update, clearing cache.');
                        clearCache();
                    }
                }

                mostrarGastosAnuales(gastosAnuales);
                mostrarNotas(todasLasNotas);
                resetFormGastos();
                modalGastos.style.display = 'none';
                Swal.fire({
                    title: 'Éxito',
                    text: idGastoAnual ? 'Gasto actualizado correctamente' : 'Gasto añadido correctamente',
                    icon: 'success',
                    confirmButtonColor: '#f97316'
                });
            } catch (error) {
                console.error('Error al guardar gasto:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'No se pudo guardar el gasto',
                    icon: 'error',
                    confirmButtonColor: '#f97316'
                });
            }
        };
    }

    function resetFormGastos() {
        document.getElementById('gastosAnualesForm').reset();
        document.getElementById('idGastoAnual').value = '';
        document.getElementById('fechaInicio').value = '';
        document.getElementById('fechasPago')._flatpickr.clear();
        document.getElementById('submitGastoBtn').textContent = 'Guardar';
        document.getElementById('cancelEditBtn').classList.add('hidden');
    }

    cargarNotas();
});