let todasLasNotas = [];
let gastosAnuales = [];
let currentFilters = {
    mes: 'todos',
    semana: 'todos',
    operador: 'todos',
    cliente: 'todos',
    search: '',
    resumenMes: 'todos',
    resumenAnio: 'todos'
};
let notasPorPagina = 20;
let notasMostradas = 0;


function clearCache() {
    sessionStorage.removeItem('gastosAnuales');
    console.log('Cache cleared');
}

async function cargarNotas() {
    try {
        console.time('cargarNotas');
        let allNotas = [];
        let page = 0;
        let size = 100; // Tamaño grande para reducir llamadas
        let hasMore = true;

        // Cargar todas las notas desde la API
        while (hasMore) {
            const response = await fetch(`https://transportesnaches.com.mx/api/nota/getAll?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            let notasArray = Array.isArray(data) ? data : data.content;
            if (!Array.isArray(notasArray)) {
                console.error("Estructura de datos inesperada:", data);
                throw new Error("La respuesta no contiene un array de notas");
            }
            allNotas = [...allNotas, ...notasArray];
            hasMore = notasArray.length === size;
            page++;
        }
        console.timeEnd('cargarNotas');
        console.time('processNotas');

        const newNotas = allNotas.map(nota => ({
                ...nota,
                noFact: nota.noFact || '',
                estado: nota.estado || 'N/A',
                ganancia: nota.ganancia || 0,
                estadoFact: nota.estadoFact || 'PENDIENTE'
            }));

        todasLasNotas = [...todasLasNotas.filter(n1 => !newNotas.some(n2 => n2.idNota === n1.idNota)), ...newNotas]
                .sort((a, b) => b.idNota - a.idNota);
        console.log('Tamaño de todasLasNotas:', new Blob([JSON.stringify(todasLasNotas)]).size / 1024, 'KB');

        await cargarGastosAnuales();
        notasMostradas = 0; // Reiniciar contador
        // Mostrar solo notas del mes actual
        const notasMesActual = getNotasMesActual();
        mostrarNotas(notasMesActual.slice(0, notasPorPagina));
        actualizarBotonCargarMas(notasMesActual);
        setTimeout(() => {
            llenarSelectores(todasLasNotas); // Usar todas las notas para los filtros
            verificarNotasPendientes(todasLasNotas);
        }, 0);
        console.timeEnd('processNotas');
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

function getNotasMesActual() {
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    return todasLasNotas.filter(nota => {
        if (!nota.fechaSalida)
            return false;
        const fecha = new Date(nota.fechaSalida);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    }).sort((a, b) => b.idNota - a.idNota);
}

function actualizarBotonCargarMas(notas) {
    const cargarMasBtn = document.getElementById('cargarMasBtn');
    if (notasMostradas < notas.length) {
        cargarMasBtn.classList.remove('hidden');
    } else {
        cargarMasBtn.classList.add('hidden');
    }
}

function cargarMasNotas() {
    notasMostradas += notasPorPagina;
    const notasMesActual = getNotasMesActual();
    mostrarNotas(notasMesActual.slice(0, notasMostradas));
    actualizarBotonCargarMas(notasMesActual);
}

function filtrarNotasSinMostrar() {
    let notasFiltradas = [...todasLasNotas];

    // Filtrar por mes
    if (currentFilters.mes !== 'todos') {
        const [mes, anio] = currentFilters.mes.split('-').map(Number);
        notasFiltradas = notasFiltradas.filter(nota => {
            if (!nota.fechaSalida)
                return false;
            const fecha = new Date(nota.fechaSalida);
            return fecha.getMonth() === mes && fecha.getFullYear() === anio;
        });
    }

    // Filtrar por semana (del mes seleccionado)
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

    // Filtrar por operador
    if (currentFilters.operador !== 'todos') {
        notasFiltradas = notasFiltradas.filter(nota => {
            return nota.nombreOperador === currentFilters.operador;
        });
    }

    // Filtrar por cliente
    if (currentFilters.cliente !== 'todos') {
        notasFiltradas = notasFiltradas.filter(nota => {
            return nota.cliente?.nombreCliente === currentFilters.cliente;
        });
    }

    // Filtrar por búsqueda (si aplica)
    if (currentFilters.search) {
        notasFiltradas = notasFiltradas.filter(nota => {
            const idNota = nota.idNota?.toString() || '';
            const cliente = nota.cliente?.nombreCliente?.toLowerCase() || '';
            const operador = nota.nombreOperador?.toLowerCase() || '';
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

    return notasFiltradas.sort((a, b) => b.idNota - a.idNota);
}

async function cargarNotasPorFecha(mes, anio) {
    try {
        const fechaInicio = mes === 'todos' ? null : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
        const fechaFin = mes === 'todos' ? null : `${anio}-${String(mes + 1).padStart(2, '0')}-${new Date(anio, mes + 1, 0).getDate()}`;
        const formData = new FormData();
        if (fechaInicio && fechaFin) {
            formData.append('fechaInicio', fechaInicio);
            formData.append('fechaFin', fechaFin);
        }

        const response = await fetch('https://transportesnaches.com.mx/api/nota/buscar', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams(formData).toString()
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        let notasArray = Array.isArray(data) ? data : data.content || [];
        if (!Array.isArray(notasArray)) {
            throw new Error("Respuesta no válida para notas por fecha");
        }

        const newNotas = notasArray.map(nota => ({
                ...nota,
                noFact: nota.noFact || '',
                estadoViaje: nota.estadoViaje || 'N/A',
                ganancia: nota.ganancia || 0,
                estado: nota.estado || 'PENDIENTE'
            }));

        todasLasNotas = [...todasLasNotas.filter(n1 => !newNotas.some(n2 => n2.idNota === n1.idNota)), ...newNotas]
                .sort((a, b) => b.idNota - a.idNota);
        notasMostradas = notasPorPagina; // Reiniciar al cargar notas por fecha
        const notasFiltradas = filtrarNotasSinMostrar();
        mostrarNotas(notasFiltradas.slice(0, notasMostradas));
        actualizarBotonCargarMas(notasFiltradas);
        return true;
    } catch (error) {
        console.error("Error al cargar notas por fecha:", error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar notas para el período seleccionado.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return false;
    }
}


async function cargarGastosAnuales() {
    try {
        const cachedGastos = sessionStorage.getItem('gastosAnuales');
        if (cachedGastos) {
            try {
                gastosAnuales = JSON.parse(cachedGastos);
                console.log('Gastos cargados desde cache:', gastosAnuales);
                if (!Array.isArray(gastosAnuales)) {
                    console.warn('Cached gastosAnuales no es un array, limpiando cache');
                    clearCache();
                    return await cargarGastosAnuales(); // Reintentar sin cache
                }
                mostrarGastosAnuales(gastosAnuales);
                return;
            } catch (e) {
                console.error('Error parsing cached gastosAnuales:', e);
                clearCache();
            }
        }
        console.log('Fetching gastosAnuales from API');
        const response = await fetch('https://transportesnaches.com.mx/api/gastoAnual/getAll', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API response for gastosAnuales:', data);
        if (!Array.isArray(data)) {
            throw new Error("La respuesta no es un array");
        }
        gastosAnuales = data;
        console.log('gastosAnuales asignados:', gastosAnuales);
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
    console.time('llenarSelectores');
    const filtroMes = document.getElementById('filtroMes');
    const filtroOperador = document.getElementById('filtroOperador');
    const filtroCliente = document.getElementById('filtroCliente');
    const filtroSemana = document.getElementById('filtroSemana');
    const filtroResumenMes = document.getElementById('filtroResumenMes');
    const filtroResumenAnio = document.getElementById('filtroResumenAnio');

    filtroMes.innerHTML = '<option value="todos">Todos los meses</option>';
    filtroOperador.innerHTML = '<option value="todos">Todos los operadores</option>';
    filtroCliente.innerHTML = '<option value="todos">Todos los clientes</option>';
    filtroSemana.innerHTML = '<option value="todos">Todas las semanas</option>';
    if (filtroResumenMes)
        filtroResumenMes.innerHTML = '<option value="todos">Todos los meses</option>';
    if (filtroResumenAnio)
        filtroResumenAnio.innerHTML = '<option value="todos">Todos los años</option>';

    const mesesUnicos = new Set();
    const aniosUnicos = new Set();
    const semanasUnicas = new Set();
    const operadoresUnicos = new Set();
    const clientesUnicos = new Set();

    notas.forEach(nota => {
        if (nota.fechaSalida) {
            const fecha = new Date(nota.fechaSalida);
            const mes = fecha.getMonth();
            const anio = fecha.getFullYear();
            mesesUnicos.add(`${mes}-${anio}`);
            aniosUnicos.add(anio);

            const diaSemana = fecha.getDay();
            const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
            const semanaInicio = new Date(fecha);
            semanaInicio.setDate(diff);
            const semanaKey = semanaInicio.toISOString().split('T')[0];
            semanasUnicas.add(semanaKey);
        }
        if (nota.nombreOperador)
            operadoresUnicos.add(nota.nombreOperador);
        if (nota.cliente?.nombreCliente)
            clientesUnicos.add(nota.cliente.nombreCliente);
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
                if (filtroResumenMes) {
                    const resumenOption = document.createElement('option');
                    resumenOption.value = mes;
                    resumenOption.textContent = mesesNombres[mes];
                    if (!Array.from(filtroResumenMes.options).some(opt => opt.value === String(mes))) {
                        filtroResumenMes.appendChild(resumenOption);
                    }
                }
            });

    Array.from(aniosUnicos)
            .sort((a, b) => a - b)
            .forEach(anio => {
                if (filtroResumenAnio) {
                    const option = document.createElement('option');
                    option.value = anio;
                    option.textContent = anio;
                    filtroResumenAnio.appendChild(option);
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

    Array.from(operadoresUnicos)
            .sort()
            .forEach(nombreOperador => {
                const opcion = document.createElement('option');
                opcion.value = nombreOperador;
                opcion.textContent = nombreOperador;
                filtroOperador.appendChild(opcion);
            });

    Array.from(clientesUnicos)
            .sort()
            .forEach(nombreCliente => {
                const option = document.createElement('option');
                option.value = nombreCliente;
                option.textContent = nombreCliente;
                filtroCliente.appendChild(option);
            });

    console.timeEnd('llenarSelectores');
}

function applyFilters() {
    currentFilters.mes = document.getElementById('filtroMes').value;
    currentFilters.semana = document.getElementById('filtroSemana').value;
    currentFilters.operador = document.getElementById('filtroOperador').value;
    currentFilters.cliente = document.getElementById('filtroCliente').value;
    filtrarNotas();
    closeFilterPanel();

}


function clearFilters() {
    // Reset filter inputs
    document.getElementById('filtroMes').value = 'todos';
    document.getElementById('filtroSemana').value = 'todos';
    document.getElementById('filtroOperador').value = 'todos';
    document.getElementById('filtroCliente').value = 'todos';
    document.getElementById('searchBar').value = '';

    // Reset filter object
    currentFilters = {
        mes: 'todos',
        semana: 'todos',
        operador: 'todos',
        cliente: 'todos',
        search: '',
        resumenMes: 'todos',
        resumenAnio: 'todos'
    };

    // Reapply filters and update display
    notasMostradas = notasPorPagina;
    const notasFiltradas = filtrarNotasSinMostrar();
    mostrarNotas(notasFiltradas.slice(0, notasMostradas));
    actualizarBotonCargarMas(notasFiltradas);
    closeFilterPanel();
}




function filtrarNotas() {
    // Obtener los valores de los filtros del panel
    currentFilters.mes = document.getElementById('filtroMes').value;
    currentFilters.semana = document.getElementById('filtroSemana').value;
    currentFilters.operador = document.getElementById('filtroOperador').value;
    currentFilters.cliente = document.getElementById('filtroCliente').value;

    // Filtrar las notas con los valores actuales
    const notasFiltradas = filtrarNotasSinMostrar();
    notasMostradas = notasPorPagina; // Reiniciar al filtrar
    mostrarNotas(notasFiltradas.slice(0, notasMostradas));
    actualizarBotonCargarMas(notasFiltradas);

    // Cerrar el panel después de aplicar los filtros
    closeFilterPanel();
}

// Asignar el evento al botón de aplicar filtros
document.getElementById('applyFiltersBtn').addEventListener('click', filtrarNotas);

document.getElementById('searchBar').addEventListener('input', () => {
    currentFilters.search = document.getElementById('searchBar').value.trim().toLowerCase();
    filtrarNotas();
});


document.addEventListener('DOMContentLoaded', () => {
    const notasPorPaginaSelect = document.getElementById('notasPorPagina');
    if (notasPorPaginaSelect) {
        notasPorPaginaSelect.addEventListener('change', () => {
            notasPorPagina = parseInt(notasPorPaginaSelect.value);
            cargarNotas(0, notasPorPagina);
        });
    }
});

document.getElementById('descargarExcel').addEventListener('click', () => {
    let notasFiltradas = [...todasLasNotas];
    let gastosAnualesDiarios = 0;
    let gastosAnualesTotal = 0;

    if (currentFilters.resumenMes !== 'todos' && currentFilters.resumenAnio !== 'todos') {
        const mes = parseInt(currentFilters.resumenMes);
        const anio = parseInt(currentFilters.resumenAnio);
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
            return nota.nombreOperador === currentFilters.operador;
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
        const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        const gastosOperativos = nota.gastos ? nota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(nota.maniobra) || 0;
        const comision = parseFloat(nota.comision) || 0;
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
            "Operador": nota.nombreOperador || 'Sin operador',
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

    const worksheet = XLSX.utils.json_to_sheet(datosExcel, {header: Object.keys(datosExcel[0])});

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const nota = notasFiltradas[row - 1];
        const isFinalized = !!nota.fechaLlegada;
        const isPendingInvoice = nota.cliente?.factura === 1 && nota.estadoFact ? 'Pendiente' : 'Facturado';

        const rowFill = {
            patternType: 'solid',
            fgColor: {rgb: isFinalized ? 'CCFFCC' : 'FFCCCC'}
        };

        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({r: row, c: col});
            if (!worksheet[cellAddress])
                continue;
            worksheet[cellAddress].s = {
                fill: rowFill,
                alignment: {vertical: 'center', horizontal: 'center'}
            };
        }

        if (isPendingInvoice) {
            const facturaCell = XLSX.utils.encode_cell({r: row, c: 1});
            if (worksheet[facturaCell]) {
                worksheet[facturaCell].s = {
                    fill: {patternType: 'solid', fgColor: {rgb: 'FFFF99'}},
                    alignment: {vertical: 'center', horizontal: 'center'}
                };
            }
        }
    }

    for (let col = range.s.c; col <= range.e.c; col++) {
        const headerCell = XLSX.utils.encode_cell({r: 0, c: col});
        if (worksheet[headerCell]) {
            worksheet[headerCell].s = {
                fill: {patternType: 'solid', fgColor: {rgb: 'FFFFFF'}},
                alignment: {vertical: 'center', horizontal: 'center'}
            };
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contabilidad');

    worksheet['!cols'] = [
        {wch: 10}, {wch: 12}, {wch: 12}, {wch: 20}, {wch: 20},
        {wch: 15}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 12},
        {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12},
        {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 12}
    ];

    let nombreArchivo = 'Contabilidad_Todos.xlsx';
    if (currentFilters.resumenMes !== 'todos' && currentFilters.resumenAnio !== 'todos') {
        const mes = parseInt(currentFilters.resumenMes);
        const anio = parseInt(currentFilters.resumenAnio);
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        nombreArchivo = `Contabilidad_${mesesNombres[mes]}_${anio}.xlsx`;
    }

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
        console.error(`Error al actualizar factura para idNota=${idNota}:`, error);
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
    console.time('mostrarNotas');
    const contenedor = document.getElementById('notasContainer');
    const fragment = document.createDocumentFragment();

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
    let totalGastosConAnuales = 0;
    let totalGastosConAnualesD = 0;

    // Usar todasLasNotas para cálculos financieros
    let notasFinancieras = [...todasLasNotas];
    let anioSeleccionado = currentFilters.resumenAnio === 'todos' ? new Date().getFullYear() : parseInt(currentFilters.resumenAnio);
    if (currentFilters.resumenMes !== 'todos' && currentFilters.resumenAnio !== 'todos') {
        const mes = parseInt(currentFilters.resumenMes);
        notasFinancieras = notasFinancieras.filter(nota => {
            if (!nota.fechaSalida)
                return false;
            const fecha = new Date(nota.fechaSalida);
            return fecha.getMonth() === mes && fecha.getFullYear() === parseInt(currentFilters.resumenAnio);
        });
    }

    const operadorSeleccionado = currentFilters.operador;
    const semanaSeleccionada = currentFilters.semana;

    if (currentFilters.resumenMes !== 'todos' && currentFilters.resumenAnio !== 'todos') {
        gastosAnualesTotal = calcularGastosAnualesTotal(anioSeleccionado);
        gastosAnualesDiarios = gastosAnualesTotal / 365;
    } else {
        gastosAnualesTotal = gastosAnuales.reduce((suma, gasto) => suma + (gasto.monto || 0), 0);
        gastosAnualesDiarios = gastosAnualesTotal / 365;
    }

    // Calcular totales con todasLasNotas
    notasFinancieras.forEach(nota => {
        const distancia = (nota.kmFinal && nota.kmInicio) ? nota.kmFinal - nota.kmInicio : 0;
        const rendimiento = nota.unidad?.rendimientoUnidad || 7;
        const precioLitro = nota.valorLitro || 25.50;
        const noEntrega = parseInt(nota.noEntrega) || 0;
        const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        const gastosOperativos = nota.gastos ? nota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(nota.maniobra) || 0;
        const comision = parseFloat(nota.comision) || 0;
        const totalGastosNota = gastosOperativos + maniobra + comision;
        

        totalGastosOperativos += gastosOperativos;
        totalManiobra += maniobra;
        totalComision += comision;
        totalIngresos += pagoViaje;
        totalNomina += comision + maniobra;

        totalGastos = totalGastosOperativos + totalManiobra + totalComision;
        totalGastosConAnuales = totalGastos + gastosAnualesTotal;
        totalGastosConAnualesD = totalGastosConAnuales / 365;



        if (semanaSeleccionada !== 'todos') {
            const semanaInicio = new Date(semanaSeleccionada);
            const semanaFin = new Date(semanaInicio);
            semanaFin.setDate(semanaInicio.getDate() + 6);
            const fecha = new Date(nota.fechaSalida);
            if (fecha >= semanaInicio && fecha <= semanaFin && (operadorSeleccionado === 'todos' || nota.nombreOperador === operadorSeleccionado)) {
                totalNomina += comision + maniobra;
            }
        } else if (operadorSeleccionado !== 'todos' && nota.nombreOperador === operadorSeleccionado) {
            totalNomina += comision + maniobra;
        }

        const gananciaCalculada = pagoViaje - totalGastosNota;
        totalGananciaNotas += gananciaCalculada;
    });

    // Mostrar solo las notas recibidas (del mes actual o filtradas)
    notas.forEach(nota => {
        let estadoTexto = '';
        let estadoClase = '';
        let fondoClase = 'bg-white';

        if (!nota.cliente || nota.cliente.factura === undefined) {
            estadoTexto = 'NO FACT';
            estadoClase = 'text-gray-600';
            console.warn(`Nota ${nota.idNota}: Cliente o factura no definido`);
        } else if (nota.cliente.factura === 1) {
            if (nota.estadoFact === 'Pendiente' || nota.estadoFact === 'PENDIENTE') {
                estadoTexto = 'PENDIENTE';
                estadoClase = 'text-red-600';
                fondoClase = 'bg-red-100';
            } else if (nota.estadoFact === 'Facturado') {
                estadoTexto = 'FACTURADO';
                estadoClase = 'text-green-600';
                fondoClase = 'bg-green-100';
            } else {
                estadoTexto = 'DESCONOCIDO';
                estadoClase = 'text-yellow-600';
                fondoClase = 'bg-yellow-100';
            }
        } else if (nota.cliente.factura === 0) {
            estadoTexto = 'NO FACT';
            estadoClase = 'text-gray-600';
        } else {
            estadoTexto = 'ERROR';
            estadoClase = 'text-red-600';
            fondoClase = 'bg-red-100';
        }

        const card = document.createElement('div');
        card.classList.add(
                'card', 'bg-white', 'rounded-lg', 'p-4', 'shadow-md', 'border', 'border-orange-300', 'cursor-pointer',
                fondoClase
                );

        const numeroFactura = nota.cliente?.factura === 1 ? (nota.numeroFactura || generarNumeroFactura(todasLasNotas)) : 'NO FACT';
        const porTipoGasto = nota.gastos?.map(g => `${g.tipoGasto?.descripcion}: $${(g.total || 0).toFixed(2)}`).join(', ') || 'N/A';
        const distancia = (nota.kmFinal && nota.kmInicio) ? nota.kmFinal - nota.kmInicio : 0;
        const rendimiento = nota.unidad?.rendimientoUnidad || 7;
        const precioLitro = nota.valorLitro || 25.50;
        const noEntrega = parseInt(nota.noEntrega) || 0;
        const pagoViaje = ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        const gastosOperativos = nota.gastos ? nota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(nota.maniobra) || 0;
        const comision = parseFloat(nota.comision) || 0;
        const totalGastosNota = gastosOperativos + maniobra + comision;
        const gananciaCalculada = pagoViaje - totalGastosNota;
        const gananciaText = gananciaCalculada !== undefined ? `$${gananciaCalculada.toFixed(2)} ${gananciaCalculada >= 0 ? '(Positiva)' : '(Negativa)'}` : 'N/A';
        const viajeStatus = nota.fechaLlegada ? 'Finalizado' : 'Pendiente';
        const viajeStatusColor = nota.fechaLlegada ? 'text-green-600' : 'text-red-600';

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
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
                <div>
                    <span class="font-semibold">N.º Nota.:</span> ${nota.idNota || 'N/A'}
                </div>
                <div class="flex items-center">
                    <span class="font-semibold mr-1">N.º Factura:</span> ${numeroFactura || 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Fecha Elab.:</span> ${formatearFecha(nota.fechaSalida) || 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Cliente:</span> ${nota.cliente?.nombreCliente || 'Sin cliente'}
                </div>
                <div>
                    <span class="font-semibold">Ruta:</span> ${formatRuta(nota.origen, nota.destino) || 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Operador:</span> ${nota.nombreOperador || 'Sin operador'}
                </div>
                <div>
                    <span class="font-semibold">Vehículo:</span> ${nota.unidad?.tipoVehiculo || 'N/A'}
                </div>
                <div>
                    <span class="font-semibold">Viaje:</span> <span class="${viajeStatusColor}">${viajeStatus}</span>
                </div>
                <div class="col-span-2">
                    <span class="font-semibold">Por Tipo de Gasto:</span> ${porTipoGasto}
                </div>
                <div>
                    <span class="font-semibold">Gastos Operativos:</span> ${gastosOperativos ? `$${gastosOperativos.toFixed(2)}` : '0'}
                </div>
                <div>
                    <span class="font-semibold">Maniobra:</span> ${maniobra ? `$${maniobra.toFixed(2)}` : '0'}
                </div>
                <div>
                    <span class="font-semibold">Comisión:</span> ${comision ? `$${comision.toFixed(2)}` : '0'}
                </div>
                <div>
                    <span class="font-semibold">Total Gastos:</span> ${totalGastosNota ? `$${totalGastosNota.toFixed(2)}` : '0'}
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



        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn') && !e.target.closest('.factura-input')) {
                window.location.href = `/detalle?id=${nota.idNota}`;
            }
        });

        fragment.appendChild(card);
    });

    contenedor.innerHTML = '';
    contenedor.appendChild(fragment);

    const gananciaNeta = totalIngresos - totalGastos;
    const margenGanancia = totalIngresos > 0 ? ((gananciaNeta / totalIngresos) * 100).toFixed(2) : 0;
    const porcentajeGastosOperativos = totalGastos > 0 ? ((totalGastosOperativos / totalGastos) * 100).toFixed(2) : 0;
    const porcentajeManiobra = totalGastos > 0 ? ((totalManiobra / totalGastos) * 100).toFixed(2) : 0;
    const porcentajeComision = totalGastos > 0 ? ((totalComision / totalGastos) * 100).toFixed(2) : 0;
    const porcentajeGastosAnualesDiarios = totalGastos > 0 ? ((gastosAnualesDiarios / totalGastos) * 100).toFixed(2) : 0;
    const porcentajeGastosAnualesTotal = totalGastos > 0 ? ((gastosAnualesTotal / totalGastos) * 100).toFixed(2) : 0;
    const porcentajeNomina = totalGastos > 0 ? ((totalNomina / totalGastos) * 100).toFixed(2) : 0;
    const resumenContainer = document.getElementById('resumenFinancieroContainer');


    resumenContainer.innerHTML = `
        <div class="financial-panel">
            <h2 class="financial-header">
                <i class="fas fa-chart-line mr-2"></i> Resumen Financiero
            </h2>
            

        <div class="financial-panel">
            <h3 class="financial-subheader">Indicadores Clave</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="kpi-card">
                    <h4>Total Ingresos</h4>
                    <p id="kpiIngresos">$${totalIngresos}</p>
                </div>
                <div class="kpi-card">
                    <h4>Total Gastos</h4>
                    <p id="kpiGastos">$${totalGastos.toFixed(2)}</p>
                </div>
                <div class="kpi-card">
                    <h4>Ganancia Neta</h4>
                    <p id="kpiGananciaNeta">$${gananciaNeta.toFixed(2)}</p>
                </div>
                <div class="kpi-card">
                    <h4>Margen de Ganancia</h4>
                    <p id="kpiMargenGanancia">${margenGanancia}%</p>
                </div>
            </div>
        </div>

        <div class="financial-panel">
            <h3 class="financial-subheader">Ingresos</h3>
            <table class="financial-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>% del Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total de Ingresos</td>
                        <td class="value" id="totalIngresos">$${totalIngresos}</td>
                        <td>100%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="financial-panel">
            <h3 class="financial-subheader">Gastos</h3>
            <table class="financial-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>% del Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Gastos Operativos</td>
                        <td class="value" id="gastosOperativos">$${totalGastosOperativos ? `${totalGastosOperativos.toFixed(2)}` : 'N/A'}</td>
                        <td id="porcentajeGastosOperativos">${porcentajeGastosOperativos}%</td>
                    </tr>
                    <tr>
                        <td>Maniobra</td>
                        <td class="value" id="maniobra">$${totalManiobra ? `${totalManiobra.toFixed(2)}` : 'N/A' }</td>
                        <td id="porcentajeManiobra">${porcentajeManiobra}%</td>
                    </tr>
                    <tr>
                        <td>Comisión</td>
                        <td class="value" id="comision">$${totalComision ? `${totalComision.toFixed(2)}` : 'N/A'}</td>
                        <td id="porcentajeComision">${porcentajeComision}%</td>
                    </tr>
                    <tr>
                        <td>Gastos Anuales Fijos (Diarios)</td>
                        <td class="value" id="gastosAnualesDiarios">$${gastosAnualesDiarios.toFixed(2)}</td>
                        <td id="porcentajeGastosAnualesDiarios">${porcentajeGastosAnualesDiarios}%</td>
                    </tr>
                    <tr>
                        <td>Gastos Anuales Fijos (Total)</td>
                        <td class="value" id="gastosAnualesTotal">$${gastosAnualesTotal.toFixed(2)}</td>
                        <td id="porcentajeGastosAnualesTotal">${porcentajeGastosAnualesTotal}%</td>
                    </tr>
                    <tr class="font-semibold bg-gray-50">
                        <td>Total de Gastos sin Anuales</td>
                        <td class="value" id="totalGastos">$${totalGastos}</td>
                        <td>100%</td>
                    </tr>
                    <tr class="font-semibold bg-gray-50">
                        <td>Total de Gastos + Anuales (Diario) </td>
                        <td class="value" id="totalGastosConAnualesD">$${totalGastosConAnualesD.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="financial-panel">
            <h3 class="financial-subheader">Ganancias</h3>
            <table class="financial-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Ganancia Neta</td>
                        <td class="value" id="gananciaNeta">$${gananciaNeta.toFixed(2)}</td>
                        <td id="estadoGananciaNeta" class="${gananciaNeta >= 0 ? 'positive' : 'negative'}">${gananciaNeta >= 0 ? 'Positiva' : 'Negativa'}</td>
                    </tr>
                    <tr>
                        <td>Ganancia Mensual</td>
                        <td class="value" id="gananciaMensual">$${gananciaNeta.toFixed(2)}</td>
                        <td id="estadoGananciaMensual" class="${gananciaNeta >= 0 ? 'positive' : 'negative'}">${gananciaNeta >= 0 ? 'Positiva' : 'Negativa'}</td>
                    </tr>
                    <tr>
                        <td>Ganancia Anual</td>
                        <td class="value" id="gananciaAnual">$${gananciaNeta.toFixed(2)}</td>
                        <td id="estadoGananciaAnual" class="${gananciaNeta >= 0 ? 'positive' : 'negative'}">${gananciaNeta >= 0 ? 'Positiva' : 'Negativa'}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="financial-panel">
            <h3 class="financial-subheader">Nómina</h3>
            <table class="financial-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>% del Total de Gastos</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total Nómina</td>
                        <td class="value" id="totalNomina">$${totalNomina.toFixed(2)}</td>
                        <td id="porcentajeNomina">${porcentajeNomina}%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="financial-panel">
            <h3 class="financial-subheader">Análisis Gráfico</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="chart-container">
                    <h4 class="text-center font-medium text-gray-600 mb-2">Resumen General</h4>
                    <canvas id="financialChart" class="w-full"></canvas>
                </div>
                <div class="chart-container">
                    <h4 class="text-center font-medium text-gray-600 mb-2">Desglose de Gastos</h4>
                    <canvas id="expenseBreakdownChart" class="w-full"></canvas>
                </div>
            </div>
        </div>
    `;


    // Reinitialize charts
    let financialChartInstance = Chart.getChart('financialChart');
    if (financialChartInstance) {
        financialChartInstance.destroy();
    }
    const ctxFinancial = document.getElementById('financialChart').getContext('2d');
    financialChartInstance = new Chart(ctxFinancial, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Gastos', 'Ganancia Neta'],
            datasets: [{
                    label: 'Monto ($)',
                    data: [totalIngresos, gastosAnualesTotal, gananciaNeta],
                    backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                    borderColor: ['#064e3b', '#991b1b', '#1e40af'],
                    borderWidth: 1
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations for cleaner rendering
            scales: {
                y: {
                    type: 'logarithmic', // Use logarithmic scale for large numbers
                    beginAtZero: false,
                    min: 1, // Ensure positive values
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    },
                    ticks: {
                        callback: function (value) {
                            return new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN', notation: 'compact'}).format(value);
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10 // Smaller font for labels
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    let expenseBreakdownChartInstance = Chart.getChart('expenseBreakdownChart');
    if (expenseBreakdownChartInstance) {
        expenseBreakdownChartInstance.destroy();
    }
    const ctxExpense = document.getElementById('expenseBreakdownChart').getContext('2d');
    expenseBreakdownChartInstance = new Chart(ctxExpense, {
        type: 'pie',
        data: {
            labels: ['Operativos', 'Maniobra', 'Comisión', 'Anuales Diarios', 'Anuales Total'],
            datasets: [{
                    label: 'Gastos ($)',
                    data: [totalGastosOperativos, totalManiobra, totalComision, gastosAnualesDiarios, gastosAnualesTotal],
                    backgroundColor: [
                        '#ff6384',
                        '#36a2eb',
                        '#ffcd56',
                        '#4bc0c0',
                        '#9966ff'
                    ],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Update chart functions
    window.updateFinancialChart = function (totalIngresos, totalGastos, gananciaNeta) {
        financialChartInstance.data.datasets[0].data = [totalIngresos, totalGastos, gananciaNeta];
        financialChartInstance.update('none'); // Update without animation
    };

    window.updateExpenseBreakdownChart = function (gastosOperativos, maniobra, comision, gastosAnualesDiarios, gastosAnualesTotal) {
        expenseBreakdownChartInstance.data.datasets[0].data = [
            gastosOperativos,
            maniobra,
            comision,
            gastosAnualesDiarios,
            gastosAnualesTotal
        ];
        expenseBreakdownChartInstance.update('none');
    };

    // Call update functions
    window.updateFinancialChart(totalIngresos, totalGastosConAnuales, gananciaNeta);
    window.updateExpenseBreakdownChart(totalGastosOperativos, totalManiobra, totalComision, gastosAnualesDiarios, gastosAnualesTotal);

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
                        notasMostradas = Math.min(notasMostradas, getNotasMesActual().length);
                        const notas = currentFilters.mes === 'todos' ? getNotasMesActual() : filtrarNotasSinMostrar();
                        mostrarNotas(notas.slice(0, notasMostradas));
                        actualizarBotonCargarMas(notas);
                        Swal.fire({
                            title: 'Eliminado',
                            text: 'La nota ha sido eliminada.',
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

    // Reinitialize charts when modal is opened
    document.getElementById('mostrarResumenBtn').addEventListener('click', () => {
        setTimeout(() => {
            financialChartInstance.resize();
            expenseBreakdownChartInstance.resize();
        }, 100);
    });

    console.timeEnd('mostrarNotas');
}

function mostrarGastosAnuales(gastos) {
    console.log('mostrarGastosAnuales called with gastos:', gastos);
    const tableBody = document.getElementById('gastosAnualesTableBody');
    if (!tableBody) {
        console.error('Elemento gastosAnualesTableBody no encontrado en el DOM');
        return;
    }
    tableBody.innerHTML = '';

    gastos.forEach(gasto => {
        const fechasPago = Array.isArray(gasto.fechasPago) ? gasto.fechasPago.join(', ') : gasto.fechasPago || 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
        </tr>
            <td class="py-2 px-4 border-b">${gasto.descripcion}</td>
            <td class="py-2 px-4 border-b">$${gasto.monto.toFixed(2)}</td>
            <td class="py-2 px-4 border-b">${gasto.anio}</td>
            <td class="py-2 px-4 border-b">${formatearFecha(gasto.fechaCreacion) || 'N/A'}</td>
            <td class="py-2 px-4 border-b">${gasto.fechaActualizacion}</td>
            <td class="py-2 px-4 border-b">
                <button class="edit-btn2 text-blue-600 hover:text-blue-800 mr-2" data-id="${gasto.idGastoAnual}">Editar</button>
                <button class="delete-btn2 text-red-600 hover:text-red-800" data-id="${gasto.idGastoAnual}">Eliminar</button>
            </td>
        </tr>`;
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
            document.getElementById('fechaInicio').value = gasto.fechaCreacion || '';
            const fechasPagoInput = document.getElementById('fechasPago');
            fechasPagoInput._flatpickr.setDate(
                    Array.isArray(gasto.fechasPago)
                    ? gasto.fechaActulizacion
                    : gasto.fechaActulizacion && typeof gasto.fechaActulizacion === 'string'
                    ? gasto.fechaActulizacion.split(',').map(f => f.trim())
                    : []
                    );
            document.getElementById('submitGastoBtn').textContent = 'Actualizar';
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            const formContainer = document.getElementById('gastosFormContainer');
            formContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
        });
    });

    document.querySelectorAll('.delete-btn2').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idGastoAnual = parseInt(btn.dataset.id);
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
                    const result = await response.json();
                    if (result.error) {
                        throw new Error(result.error);
                    }
                    gastosAnuales = gastosAnuales.filter(g => g.idGastoAnual !== idGastoAnual);
                    try {
                        sessionStorage.setItem('gastosAnuales', JSON.stringify(gastosAnuales));
                    } catch (e) {
                        if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                            console.warn('sessionStorage quota exceeded for gastosAnuales, clearing cache.');
                            clearCache();
                        } else {
                            console.error('Error storing gastosAnuales in sessionStorage:', e);
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
    const cancelBtnGasto = document.getElementById('cancelEditBtn');

    const modalResumen = document.getElementById('resumenFinancieroModal');
    const btnResumen = document.getElementById('mostrarResumenBtn');
    const spanResumen = document.getElementById('spanResumen');

    const fechasPagoInput = document.getElementById('fechasPago');

    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

    // Asegúrate de que applyFilters también esté asignado
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);

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
            resetForm();
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
            resetForm();
        }
        if (event.target == modalResumen) {
            modalResumen.style.display = 'none';
        }
    };

    if (cancelBtnGasto && formGastos) {
        cancelBtnGasto.onclick = function () {
            resetForm();
        };

        formGastos.onsubmit = async function (e) {
            e.preventDefault();
            const idGastoAnual = document.getElementById('idGastoAnual').value || 0;
            const descripcion = document.getElementById('descripcionGasto').value.trim();
            const monto = parseFloat(document.getElementById('montoGasto').value);
            const anio = parseInt(document.getElementById('anioGasto').value);
            const fechaCreacion = document.getElementById('fechaInicio').value;
            const fechaActualización = document.getElementById('fechasPago').value.trim();

            if (!descripcion || isNaN(monto) || monto <= 0 || isNaN(anio) || !fechaCreacion || !fechaActualización) {
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
                const payload = {idGastoAnual, descripcion, monto, anio, fechaCreacion, fechaActualización};
                if (idGastoAnual) {
                    response = await fetch(`https://transportesnaches.com.mx/api/gastoAnual/update`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: new URLSearchParams({datosGastoAnual: JSON.stringify(payload)})
                    });
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
                    gastosAnuales[index] = {idGastoAnual, descripcion, monto, anio, fechaCreacion, fechaActualización};
                } else {
                    gastosAnuales.push({idGastoAnual: result.idGastoAnual || (gastosAnuales.length + 1), descripcion, monto, anio, fechaCreacion, fechaActualización});
                }
                ;

                try {
                    sessionStorage.setItem('gastosAnuales', JSON.stringify(gastosAnuales));
                } catch (e) {
                    if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                        console.warn('sessionStorage quota exceeded for gastos anuales update, clearing cache.');
                        clearCache();
                    }
                }

                mostrarGastosAnuales(gastosAnuales);
                notasMostradas = notasPorPagina; // Reset
                const notas = currentFilters.mes === 'todos' ? getNotasMesActual() : filtrarNotasSinMostrar();
                mostrarNotas(notas.slice(0, notasMostradas));
                actualizarBotonCargarMas(notas);
                resetForm();
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

    // Añadir manejador para el botón "Cargar más"
    const cargarMasBtn = document.getElementById('cargarMasBtn');
    if (cargarMasBtn) {
        cargarMasBtn.addEventListener('click', cargarMasNotas);
    }

    cargarNotas();
});