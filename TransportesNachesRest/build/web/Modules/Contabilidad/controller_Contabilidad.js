
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
let formulaGeneral = null;

const token = localStorage.getItem("token");

function formatearNumero(numero) {
    if (typeof numero !== 'number' || isNaN(numero)) {
        return '0.00';
    }
    return numero.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function clearCache() {
    sessionStorage.removeItem('gastosAnuales');
    console.log('Cache cleared');
}


async function cargarFormulas() {
    try {

        const response = await fetch('https://transportesnaches.com.mx/api/dev/getAllFormula', {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
        });
        if (!response.ok)
            throw new Error('Error al cargar formulas');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error cargando fórmulas:', error);
        Swal.fire({title: 'Error', text: 'No se pudo cargar el historial de fórmulas.', icon: 'error', confirmButtonColor: '#f97316'});
        return [];
    }

}

async function guardarFormula(formula, atributos) {

    try {

        const response = await fetch('https://transportesnaches.com.mx/api/dev/saveFormula',
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                    body: JSON.stringify({formula, atributos})
                });

        if (!response.ok)
            throw new Error('Error al guardad');

        formulaGeneral = formula;

        Swal.fire({title: 'Éxito', text: 'Fórmula guardada y aplicada.', icon: 'success', confirmButtonColor: '#f97316'});
        return true;

    } catch (error) {
        console.error('Error guardando fórmula:', error);
        Swal.fire({title: 'Error', text: 'No se pudo guardar la fórmula.', icon: 'error', confirmButtonColor: '#f97316'});
        return false;
    }

}


async function cargarNotas() {
    try {
        console.time('cargarNotas');
        let allNotas = [];
        let page = 0;
        let size = 200; // Tamaño grande para reducir llamadas
        let hasMore = true;

        // Cargar todas las notas desde la API
        while (hasMore) {
            const response = await fetch(`https://transportesnaches.com.mx/api/nota/getAll?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`}
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
        mostrarNotas(todasLasNotas.slice(0, notasPorPagina));
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



async function mostrarModalJson() {
    
    const response = await fetch(`https://transportesnaches.com.mx/api/nota/getAll?page=${1}&size=${1}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`}
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
    // Remover modal existente si lo hay
    const existingModal = document.getElementById('jsonModal');
    if (existingModal) existingModal.remove();

    // Cargar historial de fórmulas
    const formulas = await cargarFormulas();

    const modal = document.createElement('div');
    modal.id = 'jsonModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6 relative">
            <button id="closeJsonModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            <h3 class="text-xl font-semibold mb-4">Datos JSON de la API</h3>
            <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-60">${JSON.stringify(data, null, 2)}</pre>
            <h4 class="text-lg font-semibold mt-4 mb-2">Selecciona atributos para trabajar</h4>
            <div id="atributosSeleccionados" class="space-y-2"></div>
            <div class="mt-4">
                <label class="block text-sm font-medium">Atributos disponibles (ej. noEntregas, idCliente, minComisionLocal, maxComisionForaneo):</label>
                <input id="nuevoAtributo" type="text" class="border p-2 w-full mt-1" placeholder="Ej. noEntregas">
                <button id="agregarAtributoBtn" class="bg-orange-500 text-white px-4 py-2 mt-2 rounded">Agregar</button>
            </div>
            <h4 class="text-lg font-semibold mt-4 mb-2">Construye la fórmula general (usa {atributo})</h4>
            <textarea id="formulaInput" class="border p-2 w-full h-24" placeholder="Ej. {noEntregas} * {minComisionLocal} + {maxComisionForaneo}"></textarea>
            <button id="guardarFormulaBtn" class="bg-green-500 text-white px-4 py-2 mt-2 rounded">Guardar y Aplicar Fórmula</button>
            <h4 class="text-lg font-semibold mt-6 mb-2">Historial de Fórmulas</h4>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr class="bg-orange-200">
                            <th class="py-1.5 px-3 border-b text-left text-xs">ID</th>
                            <th class="py-1.5 px-3 border-b text-left text-xs">Fórmula</th>
                            <th class="py-1.5 px-3 border-b text-left text-xs">Atributos</th>
                            <th class="py-1.5 px-3 border-b text-left text-xs">Fecha Creación</th>
                            <th class="py-1.5 px-3 border-b text-left text-xs">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="formulasTableBody">
                        ${formulas.length > 0 ? formulas.map(formula => `
                            <tr class="hover:bg-gray-50">
                                <td class="py-1.5 px-3 border-b text-xs">${formula.id}</td>
                                <td class="py-1.5 px-3 border-b text-xs">${formula.formula}</td>
                                <td class="py-1.5 px-3 border-b text-xs">${formula.atributos.join(', ')}</td>
                                <td class="py-1.5 px-3 border-b text-xs">${new Date(formula.fechaUltimaModificacion).toLocaleString()}</td>
                                <td class="py-1.5 px-3 border-b text-xs">
                                    <button class="action-btn bg-blue-600 text-white hover:bg-blue-700 aplicar-formula" data-id="${formula.id}" data-formula="${formula.formula}" data-attributes="${formula.attributes.join(',')}">Aplicar</button>
                                    <button class="action-btn bg-yellow-500 text-white hover:bg-yellow-600 editar-formula" data-id="${formula.id}" data-formula="${formula.formula}" data-attributes="${formula.attributes.join(',')}">Editar</button>
                                    <button class="action-btn bg-red-600 text-white hover:bg-red-700 eliminar-formula" data-id="${formula.id}">Eliminar</button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" class="py-1.5 px-3 text-center text-xs">No hay fórmulas guardadas</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const atributosSeleccionados = document.getElementById('atributosSeleccionados');
    let selectedAttrs = ['noEntregas', 'idCliente', 'minComisionLocal', 'maxComisionForaneo'];

    function renderSelectedAttrs() {
        atributosSeleccionados.innerHTML = selectedAttrs.map(attr => `
            <div class="flex items-center justify-between bg-gray-200 p-2 rounded">
                <span>${attr}</span>
                <button class="text-red-600 hover:text-red-800 remove-attr" data-attr="${attr}">Eliminar</button>
            </div>
        `).join('');
        document.querySelectorAll('.remove-attr').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedAttrs = selectedAttrs.filter(a => a !== btn.dataset.attr);
                renderSelectedAttrs();
            });
        });
    }
    renderSelectedAttrs();

    document.getElementById('agregarAtributoBtn').addEventListener('click', () => {
        const nuevo = document.getElementById('nuevoAtributo').value.trim();
        if (nuevo && !selectedAttrs.includes(nuevo)) {
            selectedAttrs.push(nuevo);
            renderSelectedAttrs();
            document.getElementById('nuevoAtributo').value = '';
        }
    });

    document.getElementById('guardarFormulaBtn').addEventListener('click', async () => {
        const formula = document.getElementById('formulaInput').value.trim();
        if (formula) {
            const success = await guardarFormula(formula, selectedAttrs);
            if (success) {
                modal.remove();
                todasLasNotas = todasLasNotas.map(nota => ({
                    ...nota,
                    comisionCalculada: evaluarFormula(nota, formula)
                }));
                mostrarNotas(todasLasNotas.slice(0, notasPorPagina));
                // Reabrir modal para actualizar tabla
                mostrarModalJson();
            }
        }
    });

    // Manejadores para acciones de la tabla
    document.querySelectorAll('.aplicar-formula').forEach(btn => {
        btn.addEventListener('click', async () => {
            const formula = btn.dataset.formula;
            formulaGeneral = formula;
            todasLasNotas = todasLasNotas.map(nota => ({
                ...nota,
                comisionCalculada: evaluarFormula(nota, formula)
            }));
            mostrarNotas(todasLasNotas.slice(0, notasPorPagina));
            Swal.fire({ title: 'Éxito', text: 'Fórmula aplicada.', icon: 'success', confirmButtonColor: '#f97316' });
            modal.remove();
        });
    });

    document.querySelectorAll('.editar-formula').forEach(btn => {
        btn.addEventListener('click', () => {
            const formula = btn.dataset.formula;
            const attributes = btn.dataset.attributes.split(',');
            document.getElementById('formulaInput').value = formula;
            selectedAttrs = attributes;
            renderSelectedAttrs();
            // Opcional: Podrías añadir un campo oculto para el ID si necesitas actualizar en lugar de crear
        });
    });

    document.querySelectorAll('.eliminar-formula').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const success = await eliminarFormula(id);
            if (success) {
                modal.remove();
                mostrarModalJson(); // Actualizar tabla
            }
        });
    });

    document.getElementById('closeJsonModal').addEventListener('click', () => modal.remove());
}

function cargarMasNotas() {
    notasMostradas += notasPorPagina;
    const notasMesActual = getNotasMesActual();
    mostrarNotas(notasMesActual.slice(0, notasMostradas)); // Pass array slice instead of number
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
            headers: {'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`},
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
            headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
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

    // Configurar eventos para los botones de filtros
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Configurar evento para el botón "Cargar más"
    const cargarMasBtn = document.getElementById('cargarMasBtn');
    if (cargarMasBtn) {
        cargarMasBtn.addEventListener('click', cargarMasNotas);
    }

    // Configurar eventos para el panel de filtros
    document.getElementById('toggleFilterPanel').addEventListener('click', toggleFilterPanel);
    document.getElementById('closeFilterPanel').addEventListener('click', closeFilterPanel);

    cargarNotas();



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
        const pagoViaje = nota.pagoViaje !== null ? nota.pagoViaje : ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);

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
            "Distancia": distancia || 'N/A',
            "Ingresos": `$${pagoViaje.toFixed(2)}`,
            "Combus": `$${gastoCategories.combus.toFixed(2)}`,
            "Casetas": `$${gastoCategories.casetas.toFixed(2)}`,
            "Consumo": `$${gastoCategories.consumo.toFixed(2)}`,
            "Hospedaje": `$${gastoCategories.hospedaje.toFixed(2)}`,
            "Otros": `$${gastoCategories.otros.toFixed(2)}`,
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
    const formattedDestino = destino;
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
            headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`},
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
    return `FAC-${String(maxNumero + 0).padStart(3, '0')}`;
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

function mostrarNotas(notas, financialSummary = {}) {
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

    // Use financialSummary from API if available, otherwise calculate client-side
    if (Object.keys(financialSummary).length > 0) {
        totalIngresos = financialSummary.totalIngresos || 0;
        totalGastosOperativos = financialSummary.totalGastosOperativos || 0;
        totalManiobra = financialSummary.totalManiobra || 0;
        totalComision = financialSummary.totalComision || 0;
        totalGastos = financialSummary.totalGastos || 0;
        totalGananciaNotas = financialSummary.totalGananciaNotas || 0;
        totalNomina = financialSummary.totalNomina || 0;
        gastosAnualesDiarios = financialSummary.gastosAnualesDiarios || 0;
        gastosAnualesTotal = financialSummary.gastosAnualesTotal || 0;
        totalGastosConAnuales = financialSummary.totalGastosConAnuales || 0;
        totalGastosConAnualesD = financialSummary.totalGastosConAnualesDiarios || 0;
    } else {
        // Fallback to client-side calculations
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
            gastosAnualesTotal = calcularGastosAnualesTotal ? calcularGastosAnualesTotal(anioSeleccionado) : gastosAnuales.reduce((suma, gasto) => suma + (gasto.monto || 0), 0);
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
            const pagoViaje = nota.pagoViaje !== null ? nota.pagoViaje : ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
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
    }

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
        const pagoViaje = nota.pagoViaje !== null ? nota.pagoViaje : ((distancia / rendimiento) * precioLitro * 3.5) + (noEntrega * 289);
        const gastosOperativos = nota.gastos ? nota.gastos.reduce((sum, g) => sum + (g.total || 0), 0) : 0;
        const maniobra = parseFloat(nota.maniobra) || 0;
        const comision = parseFloat(nota.comision) || 0;
        const totalGastosNota = gastosOperativos + maniobra + comision;
        const gananciaCalculada = pagoViaje - totalGastosNota;
        const gananciaText = formatearNumero(gananciaCalculada) !== undefined ? `$${formatearNumero(gananciaCalculada)} ${gananciaCalculada >= 0 ? '(Positiva)' : '(Negativa)'}` : 'N/A';
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
                    <span class="font-semibold">N.º Nota:</span> ${nota.idNota || 'N/A'}
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
                    <span class="font-semibold">Gastos Operativos:</span> ${formatearNumero(gastosOperativos)}
                </div>
                <div>
                    <span class="font-semibold">Maniobra:</span> ${formatearNumero(maniobra)}
                </div>
                <div>
                    <span class="font-semibold">Comisión:</span> ${formatearNumero(comision)}
                </div>
                <div>
                    <span class="font-semibold">Total Gastos:</span> ${formatearNumero(totalGastosNota)}
                </div>
                <div>
                    <span class="font-semibold">Pago Viaje (Calculado):</span> $${formatearNumero(pagoViaje)}
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

    // Remove existing modal if present to prevent duplicates
    const existingOverlay = document.getElementById('resumenContainer');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create modal but keep it hidden initially
    const overlay = document.createElement('div');
    overlay.id = 'resumenContainer';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 hidden';

    const content = document.createElement('div');
    content.className = 'bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative p-6';

    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => {
        overlay.classList.add('hidden');
    };

    const gananciaNeta = financialSummary.gananciaNeta || totalIngresos - totalGastos;
    const margenGanancia = financialSummary.margenGanancia || (totalIngresos > 0 ? ((gananciaNeta / totalIngresos) * 100).toFixed(2) : 0);
    const porcentajeGastosOperativos = financialSummary.porcentajeGastosOperativos || (totalGastos > 0 ? ((totalGastosOperativos / totalGastos) * 100).toFixed(2) : 0);
    const porcentajeManiobra = financialSummary.porcentajeManiobra || (totalGastos > 0 ? ((totalManiobra / totalGastos) * 100).toFixed(2) : 0);
    const porcentajeComision = financialSummary.porcentajeComision || (totalGastos > 0 ? ((totalComision / totalGastos) * 100).toFixed(2) : 0);
    const porcentajeGastosAnualesDiarios = financialSummary.porcentajeGastosAnualesDiarios || (totalGastos > 0 ? ((gastosAnualesDiarios / totalGastos) * 100).toFixed(2) : 0);
    const porcentajeGastosAnualesTotal = financialSummary.porcentajeGastosAnualesTotal || (totalGastos > 0 ? ((gastosAnualesTotal / totalGastos) * 100).toFixed(2) : 0);
    const porcentajeNomina = financialSummary.porcentajeNomina || (totalGastos > 0 ? ((totalNomina / totalGastos) * 100).toFixed(2) : 0);

    const resumenContainer = document.createElement('div');
    resumenContainer.id = 'resumenFinancieroContainer';
    resumenContainer.className = 'space-y-6';

    resumenContainer.innerHTML = `
        <!-- Header Card -->
        <div class="modal">
            <div class="card-content">
                <div class="flex items-center justify-between">
                    <div class="widget-label">
                        <h3 class="text-xl font-semibold text-gray-700">Resumen Financiero</h3>
                    </div>
                    <span class="icon widget-icon text-blue-500"><i class="mdi mdi-chart-line mdi-24px"></i></span>
                </div>
            </div>
        </div>

        <!-- KPIs Card -->
        <div class="card">
            <div class="card-content">
                <h4 class="text-lg font-semibold text-gray-700 mb-4 border-b border-blue-200 pb-2">Indicadores Clave</h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                        <h5 class="text-sm font-medium text-gray-600">Total Ingresos</h5>
                        <p id="kpiIngresos">$${formatearNumero(totalIngresos)}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                        <h5 class="text-sm font-medium text-gray-600">Total Gastos</h5>
                        <p id="kpiGastos">$${formatearNumero(totalGastos)}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                        <h5 class="text-sm font-medium text-gray-600">Ganancia Neta</h5>
                        <p id="kpiGananciaNeta">$${formatearNumero(gananciaNeta)}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                        <h5 class="text-sm font-medium text-gray-600">Margen de Ganancia</h5>
                        <p id="kpiMargenGanancia">${margenGanancia}%</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ingresos Card -->
        <div class="card">
            <div class="card-content">
                <h4 class="text-lg font-semibold text-gray-700 mb-4 border-b border-blue-200 pb-2">Ingresos</h4>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-blue-100">
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Concepto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Monto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">% del Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Total de Ingresos</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="totalIngresos">$${formatearNumero(totalIngresos)}</td>
                            <td class="py-2 px-4">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Gastos Card -->
        <div class="card">
            <div class="card-content">
                <h4 class="text-lg font-semibold text-gray-700 mb-4 border-b border-blue-200 pb-2">Gastos</h4>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-blue-100">
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Concepto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Monto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">% del Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Gastos Operativos</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="gastosOperativos">$${formatearNumero(totalGastosOperativos)}</td>
                            <td class="py-2 px-4" id="porcentajeGastosOperativos">${porcentajeGastosOperativos}%</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Maniobra</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="maniobra">$${formatearNumero(totalManiobra)}</td>
                            <td class="py-2 px-4" id="porcentajeManiobra">${porcentajeManiobra}%</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Comisión</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="comision">$${formatearNumero(totalComision)}</td>
                            <td class="py-2 px-4" id="porcentajeComision">${porcentajeComision}%</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Gastos Anuales Fijos (Diarios)</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="gastosAnualesDiarios">$${formatearNumero(gastosAnualesDiarios)}</td>
                            <td class="py-2 px-4" id="porcentajeGastosAnualesDiarios">${porcentajeGastosAnualesDiarios}%</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Gastos Anuales Fijos (Total)</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="gastosAnualesTotal">$${formatearNumero(gastosAnualesTotal)}</td>
                            <td class="py-2 px-4" id="porcentajeGastosAnualesTotal">${porcentajeGastosAnualesTotal}%</td>
                        </tr>
                        <tr class="hover:bg-gray-50 bg-gray-100 font-semibold">
                            <td class="py-2 px-4">Total de Gastos sin Anuales</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="totalGastos">$${formatearNumero(totalGastos)}</td>
                            <td class="py-2 px-4">100%</td>
                        </tr>
                        <tr class="hover:bg-gray-50 bg-gray-100 font-semibold">
                            <td class="py-2 px-4">Total de Gastos + Anuales (Diario)</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="totalGastosConAnualesD">$${formatearNumero(totalGastosConAnualesD)}</td>
                            <td class="py-2 px-4">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Ganancias Card -->
        <div class="card">
            <div class="card-content">
                <h4 class="text-lg font-semibold text-gray-700 mb-4 border-b border-blue-200 pb-2">Ganancias</h4>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-blue-100">
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Concepto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Monto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Ganancia Neta</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="gananciaNeta">$${formatearNumero(gananciaNeta)}</td>
                            <td class="py-2 px-4 ${gananciaNeta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}" id="estadoGananciaNeta">${gananciaNeta >= 0 ? 'Positiva' : 'Negativa'}</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Ganancia Mensual</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="gananciaMensual">$${formatearNumero(gananciaNeta)}</td>
                            <td class="py-2 px-4 ${gananciaNeta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}" id="estadoGananciaMensual">${gananciaNeta >= 0 ? 'Positiva' : 'Negativa'}</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Ganancia Anual</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="gananciaAnual">$${formatearNumero(gananciaNeta)}</td>
                            <td class="py-2 px-4 ${gananciaNeta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}" id="estadoGananciaAnual">${gananciaNeta >= 0 ? 'Positiva' : 'Negativa'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Nómina Card -->
        <div class="card">
            <div class="card-content">
                <h4 class="text-lg font-semibold text-gray-700 mb-4 border-b border-blue-200 pb-2">Nómina</h4>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-blue-100">
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Concepto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">Monto</th>
                            <th class="py-2 px-4 text-sm font-semibold text-gray-700">% del Total de Gastos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4">Total Nómina</td>
                            <td class="py-2 px-4 font-medium text-gray-800" id="totalNomina">$${formatearNumero(totalNomina)}</td>
                            <td class="py-2 px-4" id="porcentajeNomina">${porcentajeNomina}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Charts Card -->
        <div class="card">
            <div class="card-content">
                <h4 class="text-lg font-semibold text-gray-700 mb-4 border-b border-blue-200 pb-2">Análisis Gráfico</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-white rounded-lg">
                        <h5 class="text-sm font-medium text-gray-600 mb-2 text-center">Resumen General</h5>
                        <div class="h-64">
                            <canvas id="financialChart" class="w-full h-full"></canvas>
                        </div>
                    </div>
                    <div class="p-4 bg-white rounded-lg">
                        <h5 class="text-sm font-medium text-gray-600 mb-2 text-center">Desglose de Gastos</h5>
                        <div class="h-64">
                            <canvas id="expenseBreakdownChart" class="w-full h-full"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    content.appendChild(closeButton);
    content.appendChild(resumenContainer);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Initialize charts with retry mechanism
    function initializeCharts(retryCount = 0, maxRetries = 5) {
        const financialCanvas = document.getElementById('financialChart');
        const expenseCanvas = document.getElementById('expenseBreakdownChart');

        if (!financialCanvas || !expenseCanvas) {
            if (retryCount < maxRetries) {
                console.warn(`Canvas elements not found, retrying (${retryCount + 1}/${maxRetries})...`);
                setTimeout(() => initializeCharts(retryCount + 1, maxRetries), 100);
            } else {
                console.error('Failed to find canvas elements after maximum retries.');
            }
            return;
        }

        // Destroy existing charts if they exist
        const existingFinancialChart = Chart.getChart(financialCanvas);
        if (existingFinancialChart) {
            existingFinancialChart.destroy();
        }
        const existingExpenseChart = Chart.getChart(expenseCanvas);
        if (existingExpenseChart) {
            existingExpenseChart.destroy();
        }

        // Initialize Financial Chart
        const ctxFinancial = financialCanvas.getContext('2d');
        const financialChart = new Chart(ctxFinancial, {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Gastos', 'Ganancia Neta'],
                datasets: [{
                        label: 'Monto ($)',
                        data: [totalIngresos, totalGastos, gananciaNeta],
                        backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                        borderColor: ['#064e3b', '#991b1b', '#1e40af'],
                        borderWidth: 1
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Monto ($)'
                        },
                        ticks: {
                            callback: function (value) {
                                return new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(value);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
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

        // Initialize Expense Breakdown Chart
        const ctxExpense = expenseCanvas.getContext('2d');
        const expenseBreakdownChart = new Chart(ctxExpense, {
            type: 'pie',
            data: {
                labels: ['Operativos', 'Maniobra', 'Comisión', 'Anuales Diarios', 'Anuales Total'],
                datasets: [{
                        label: 'Gastos ($)',
                        data: [
                            totalGastosOperativos || 0,
                            totalManiobra || 0,
                            totalComision || 0,
                            gastosAnualesDiarios || 0,
                            gastosAnualesTotal || 0
                        ],
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
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed) {
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
            financialChart.data.datasets[0].data = [totalIngresos, totalGastos, gananciaNeta];
            financialChart.update();
        };

        window.updateExpenseBreakdownChart = function (gastosOperativos, maniobra, comision, gastosAnualesDiarios, gastosAnualesTotal) {
            expenseBreakdownChart.data.datasets[0].data = [
                gastosOperativos,
                maniobra,
                comision,
                gastosAnualesDiarios,
                gastosAnualesTotal
            ];
            expenseBreakdownChart.update();
        };

        // Call update chart functions
        window.updateFinancialChart(totalIngresos, totalGastosConAnuales, gananciaNeta);
        window.updateExpenseBreakdownChart(totalGastosOperativos, totalManiobra, totalComision, gastosAnualesDiarios, gastosAnualesTotal);
    }

    // Set up mostrarResumenBtn to show modal and initialize charts
    const mostrarResumenBtn = document.getElementById('mostrarResumenBtn');
    if (mostrarResumenBtn) {
        // Remove existing listeners to prevent duplicates
        const newButton = mostrarResumenBtn.cloneNode(true);
        mostrarResumenBtn.parentNode.replaceChild(newButton, mostrarResumenBtn);
        newButton.addEventListener('click', () => {
            overlay.classList.remove('hidden');
            initializeCharts();
        });
    } else {
        console.warn('mostrarResumenBtn not found in DOM');
    }

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idNota = parseInt(btn.dataset.id);
            window.Swal.fire({
                title: '¿Estás seguro?',
                text: 'No podrás deshacer esta acción',
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
                            headers: {'Content-Type': 'application/x-www-form-urlencoded',
                                'Authorization': `Bearer ${token}`},
                            body: `idNota=${encodeURIComponent(idNota)}`
                        });
                        const responseData = await response.json();
                        if (responseData.error) {
                            throw new Error(responseData.error);
                        }
                        todasLasNotas = todasLasNotas.filter(nota => nota.idNota !== idNota);
                        const notasFiltradas = filtrarNotasSinMostrar();
                        notasMostradas = Math.min(notasMostradas, notasFiltradas.length);
                        const notasToShow = notasFiltradas.slice(0, notasMostradas);
                        mostrarNotas(notasToShow, financialSummary);
                        actualizarBotonCargarMas(todasLasNotas);
                        window.Swal.fire({
                            title: 'Eliminado',
                            text: 'La nota ha sido eliminada.',
                            icon: 'success',
                            confirmButtonColor: '#f97316'
                        });
                    } catch (error) {
                        window.Swal.fire({
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
            <td class="py-2 px-4 border-b">$${formatearNumero(gasto.monto)}</td>
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
                        headers: {'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Bearer ${token}`
                        },
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



async function cargarOperadores() {
    try {
        const response = await fetch('https://transportesnaches.com.mx/api/operador/getAll', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("La respuesta no es un array");
        }
        return data;
    } catch (error) {
        console.error("Error al cargar operadores:", error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar la lista de operadores.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
        return [];
    }
}

function mostrarModalOperadores() {
    const modal = document.getElementById('employeeModal');
    const operatorList = document.getElementById('employeeList');
    const searchInput = document.getElementById('employeeSearch');

    operatorList.innerHTML = '<p class="text-center text-gray-600">Cargando operadores...</p>';

    cargarOperadores().then(operadores => {
        operatorList.innerHTML = '';
        if (operadores.length === 0) {
            operatorList.innerHTML = '<p class="text-center text-gray-600">No se encontraron operadores.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        operadores.forEach(operador => {
            const div = document.createElement('div');
            div.className = 'employee-item';
            const fullName = operador.Persona ?
                    `${operador.Persona.nombre || ''} ${operador.Persona.apellidoPaterno || ''} ${operador.Persona.apellidoMaterno || ''}`.trim() :
                    operador.nombreOperador || 'Sin nombre';
            const idUsuarioSeleccionado = operador.Usuario ? `${operador.Usuario.idUsuario}` : operador.idUsuario;
            div.innerHTML = `
                <span class="text-sm text-gray-800">${fullName}</span>
                <button class="action-btn bg-primary-orange text-white hover:bg-secondary-orange text-xs" data-id="${operador.idOperador}">
                    Seleccionar
                </button>
            `;
            div.querySelector('button').addEventListener('click', () => {
                // Guardar originalNombreCompleto y originalPendingTrips
                if (!localStorage.getItem('originalNombreCompleto')) {
                    localStorage.setItem('originalNombreCompleto', localStorage.getItem('nombreCompleto') || '');
                }
                if (!localStorage.getItem('originalPendingTrips')) {
                    localStorage.setItem('originalPendingTrips', localStorage.getItem('pendingTrips') || '[]');
                }
                if (!localStorage.getItem('originalIdUsuario')) {
                    localStorage.setItem('originalIdUsuario', localStorage.getItem('idUsuario') || '');
                }

                // Actualizar nombreCompleto con el operador seleccionado
                localStorage.setItem('nombreCompleto', fullName);
                // Limpiar pendingTrips para no mostrar viajes de otros operadores
                localStorage.setItem('pendingTrips', '[]');

                localStorage.setItem('idUsuario', idUsuarioSeleccionado);
                // Ocultar modal y redirigir
                modal.style.display = 'none';
                window.location.href = `/bitacora?newTrip=true`; // Agregar parámetro para forzar nuevo viaje
            });
            fragment.appendChild(div);
        });
        operatorList.appendChild(fragment);

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            Array.from(operatorList.children).forEach(item => {
                const nombre = item.querySelector('span').textContent.toLowerCase();
                item.style.display = nombre.includes(query) ? '' : 'none';
            });
        });
    });

    modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const modalGastos = document.getElementById('gastosAnualesModal');
    const btnGastos = document.getElementById('gastosAnualesBtn');
    const spanGastos = document.getElementById('spanGastos');
    const formGastos = document.getElementById('gastosAnualesForm');
    const cancelBtnGasto = document.getElementById('cancelEditBtn');

    const fechasPagoInput = document.getElementById('fechasPago');



    const mostrarJsonBtn = document.getElementById('mostrarJsonBtn');
    if (mostrarJsonBtn) {
        mostrarJsonBtn.addEventListener('click', () => {
            
                mostrarModalJson();
           
            
        });
    }

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



    window.onclick = function (event) {
        if (event.target == modalGastos) {
            modalGastos.style.display = 'none';
            resetForm();
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
                        headers: {'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Bearer ${token}`
                        },
                        body: new URLSearchParams({datosGastoAnual: JSON.stringify(payload)})
                    });
                } else {
                    response = await fetch(`https://transportesnaches.com.mx/api/gastoAnual/insert`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
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



    const nuevaNotaBtn = document.getElementById('nuevaNotaBtn');
    if (nuevaNotaBtn) {
        nuevaNotaBtn.addEventListener('click', mostrarModalOperadores);
    }

    const closeEmployeeModal = document.getElementById('closeEmployeeModal');
    if (closeEmployeeModal) {
        closeEmployeeModal.addEventListener('click', () => {
            document.getElementById('employeeModal').style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('employeeModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

});
    