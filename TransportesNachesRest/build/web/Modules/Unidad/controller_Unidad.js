document.addEventListener("DOMContentLoaded", function () {
// DOM elements
    const elements = {
        btnNuevaUnidad: document.getElementById("btnNuevaUnidad"),
        btnRecargar: document.getElementById("btnRecargar"),
        btnGuardar: document.getElementById("btnGuardar"),
        btnCancelar: document.getElementById("btnCancelar"),
        formUnidad: document.getElementById("formUnidad"),
        tblUnidad: document.getElementById("tblUnidad"),
        tblEncabezado: document.getElementById("tblEncabezado"),
        txtBuscar: document.getElementById("txtBuscar"),
        mantenimientoModal: document.getElementById("mantenimientoModal"),
        nuevoMantenimientoModal: document.getElementById("nuevoMantenimientoModal"),
        btnNuevoMantenimiento: document.getElementById("btnNuevoMantenimiento"),
        btnCancelarNuevoMantenimiento: document.getElementById("btnCancelarNuevoMantenimiento"),
        formNuevoMantenimiento: document.getElementById("formNuevoMantenimiento"),
        filtroTipo: document.getElementById("filtroTipo"),
        filtroFecha: document.getElementById("filtroFecha"),
        tablaMantenimientosBody: document.getElementById("tablaMantenimientosBody")
    };


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

    // Debug: Verify critical elements
    console.log('btnNuevoMantenimiento:', elements.btnNuevoMantenimiento);
    console.log('nuevoMantenimientoModal:', elements.nuevoMantenimientoModal);
    console.log('mantenimientoModal:', elements.mantenimientoModal);
    // State
    let unidades = [];
    let mantenimientos = [];
    let currentIdUnidad = null;
    const MAINTENANCE_INTERVAL = 10000; // 10,000 km
    const MAINTENANCE_THRESHOLD = 500; // Alert 500 km before
    const POLICY_ALERT_DAYS = 7; // Alert 7 days before policy expiration
    const SESSION_KEY = 'unit_alerts_dismissed';
    // Event listeners
    if (elements.btnNuevaUnidad) {
        elements.btnNuevaUnidad.addEventListener('click', limpiarMostrarFormulario);
    } else {
        console.error('btnNuevaUnidad no encontrado');
    }
    if (elements.btnRecargar) {
        elements.btnRecargar.addEventListener('click', recargarUnidades);
    }
    if (elements.btnCancelar) {
        elements.btnCancelar.addEventListener('click', () => setDetalleVisible(false));
    }
    if (elements.txtBuscar) {
        elements.txtBuscar.addEventListener('input', debounce(buscarUnidades, 300));
    }
    if (elements.formUnidad) {
        elements.formUnidad.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarUnidad();
        });
    }
    if (elements.btnNuevoMantenimiento) {
        elements.btnNuevoMantenimiento.addEventListener('click', abrirNuevoMantenimiento);
        console.log('Event listener added to btnNuevoMantenimiento');
    } else {
        console.error('btnNuevoMantenimiento no encontrado');
    }
    if (elements.btnCancelarNuevoMantenimiento) {
        elements.btnCancelarNuevoMantenimiento.addEventListener('click', cerrarNuevoMantenimiento);
    }
    if (elements.formNuevoMantenimiento) {
        elements.formNuevoMantenimiento.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarMantenimiento();
        });
    }
    if (elements.filtroTipo) {
        elements.filtroTipo.addEventListener('change', filtrarMantenimientos);
    }
    if (elements.filtroFecha) {
        elements.filtroFecha.addEventListener('change', filtrarMantenimientos);
    }
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            if (elements.mantenimientoModal) {
                elements.mantenimientoModal.classList.remove('show');
                elements.mantenimientoModal.style.display = 'none';
            }
            cerrarNuevoMantenimiento();
        });
        closeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeBtn.click();
            }
        });
    });
    window.addEventListener('click', (event) => {
        if (event.target == elements.mantenimientoModal) {
            elements.mantenimientoModal.classList.remove('show');
            elements.mantenimientoModal.style.display = 'none';
        }
        if (event.target == elements.nuevoMantenimientoModal) {
            cerrarNuevoMantenimiento();
        }
    });
    // Initialize
    inicializar();
    // Utility Functions
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function obtenerFechaLocal() {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
    }

    async function handleApiError(response, customMessage) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || customMessage || `HTTP error! status: ${response.status}`);
    }

    function showErrorMessage(inputId, errorId, show) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input && error) {
            if (show) {
                input.classList.add('input-error');
                error.style.display = 'block';
                input.setAttribute('aria-invalid', 'true');
            } else {
                input.classList.remove('input-error');
                error.style.display = 'none';
                input.setAttribute('aria-invalid', 'false');
            }
        }
    }

    // Core Functions
    async function inicializar() {
        setDetalleVisible(false);
        await recargarUnidades();
        if (!sessionStorage.getItem(SESSION_KEY)) {
            await checkAllUnitsForAlerts();
        }
    }

    async function recargarUnidades() {
        try {
            const response = await fetch('https://transportesnaches.com.mx/api/unidad/getAll', {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`}
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudieron cargar las unidades');
            const data = await response.json();
            if (!Array.isArray(data))
                throw new Error('Respuesta no es un array');
            unidades = data;
            console.log('Unidades cargadas:', unidades);
            mostrarUnidades();
        } catch (error) {
            console.error('Error al cargar unidades:', error);
            mostrarError('Error', `No se pudieron cargar las unidades: ${error.message}`);
        }
    }

    function mostrarUnidades() {
        if (!Array.isArray(unidades)) {
            console.error('Datos de unidades no válidos:', unidades);
            return;
        }
        let contenido = '';
        unidades.forEach(unidad => {
            const needsMaintenance = unidad._needsMaintenance || false;
            const policyExpiring = unidad._policyExpiring || false;
            const imageUrl = `/images/unidades/${unidad.idUnidad}.jpg`; // Placeholder for dynamic images
            contenido += `
                <div class="unit-card bg-white rounded-xl overflow-hidden shadow-lg">
                    <div class="unit-image" style="background-image: url('${imageUrl}');"></div>
                    <div class="p-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-500">${new Date().toLocaleDateString('es-MX')}</span>
                            <span class="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">${unidad.disponibilidad}</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${unidad.tipoVehiculo || 'Sin Nombre'}</h3>
                        <p class="text-gray-600 text-sm mb-4">Placas: ${unidad.placas || 'N/A'}</p>
                        <div class="flex justify-between items-center">
                            <div>
                                ${needsMaintenance || policyExpiring ? '<span class="text-red-500 mr-2"><i class="fas fa-exclamation-triangle"></i></span>' : ''}
                                ${unidad.activoUnidad ? `
                                    <button onclick="cargarDetalleUnidad(${unidad.idUnidad})" class="text-blue-500 hover:text-blue-700 mr-2" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="mostrarMantenimientos(${unidad.idUnidad})" class="text-yellow-500 hover:text-yellow-700 mr-2" title="Mantenimientos">
                                        <i class="fas fa-wrench"></i>
                                    </button>
                                    <button onclick="eliminarUnidad(${unidad.idUnidad})" class="text-red-500 hover:text-red-700" title="Desactivar">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                ` : `
                                    <button onclick="reactivarUnidad(${unidad.idUnidad})" class="text-green-500 hover:text-green-700" title="Reactivar">
                                        <i class="fas fa-undo"></i> Reactivar
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center">
                                <img src="/Resource/transportesNaches.png" alt="" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm text-gray-600"></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        elements.tblUnidad.innerHTML = contenido;
    }

    function buscarUnidades() {
        const termino = elements.txtBuscar.value.toLowerCase();
        const cards = elements.tblUnidad.querySelectorAll(".unit-card");
        cards.forEach(card => {
            const tipoVehiculo = card.querySelector("h3").textContent.toLowerCase();
            const placas = card.querySelector("p").textContent.toLowerCase().replace("Placas: ", "");
            card.style.display = tipoVehiculo.includes(termino) || placas.includes(termino) ? '' : 'none';
        });
    }

    function cargarDetalleUnidad(idUnidad) {
        const unidad = unidades.find(u => u.idUnidad === idUnidad);
        if (!unidad) {
            mostrarError('Error', 'Unidad no encontrada');
            return;
        }
        document.getElementById("idUnidad").value = unidad.idUnidad;
        document.getElementById("tipoVehiculo").value = unidad.tipoVehiculo || '';
        document.getElementById("placas").value = unidad.placas || '';
        document.getElementById("rendimientoUnidad").value = unidad.rendimientoUnidad || '';
        document.getElementById("capacidad").value = unidad.capacidad || '';
        document.getElementById("fechaVencimientoPol").value = unidad.fechaVencimientoPol || '';
        document.getElementById("kmMantenimiento").value = unidad.kmMantenimiento || MAINTENANCE_INTERVAL;
        document.getElementById("disponibilidad").value = unidad.disponibilidad || '';
        setDetalleVisible(true);
        document.getElementById("tipoVehiculo").focus();
    }

    async function guardarUnidad() {
        const unidadData = {
            idUnidad: parseInt(document.getElementById("idUnidad").value) || 0,
            tipoVehiculo: document.getElementById("tipoVehiculo").value.trim(),
            placas: document.getElementById("placas").value.trim(),
            rendimientoUnidad: parseFloat(document.getElementById("rendimientoUnidad").value) || 0,
            capacidad: document.getElementById("capacidad").value.trim(),
            fechaVencimientoPol: document.getElementById("fechaVencimientoPol").value,
            kmMantenimiento: parseInt(document.getElementById("kmMantenimiento").value) || MAINTENANCE_INTERVAL,
            disponibilidad: document.getElementById("disponibilidad").value,
            activoUnidad: 1
        };
        if (!unidadData.tipoVehiculo || !unidadData.placas || !unidadData.capacidad || !unidadData.disponibilidad) {
            mostrarError('Error', 'Por favor, completa todos los campos obligatorios.');
            return;
        }

        try {
            const response = await fetch('https://transportesnaches.com.mx/api/unidad/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`},
                body: JSON.stringify(unidadData)
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudo guardar la unidad');
            const data = await response.json();
            mostrarExito('Éxito', data.result || 'Unidad guardada exitosamente');
            await recargarUnidades();
            setDetalleVisible(false);
        } catch (error) {
            console.error('Error al guardar unidad:', error);
            mostrarError('Error', `No se pudo guardar la unidad: ${error.message}`);
        }
    }

    async function eliminarUnidad(idUnidad) {
        const confirmacion = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción desactivará la unidad. ¿Deseas continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar'
        });
        if (!confirmacion.isConfirmed)
            return;
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/unidad/delete/${idUnidad}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`}
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudo desactivar la unidad');
            const data = await response.json();
            mostrarExito('Éxito', data.result || 'Unidad desactivada correctamente');
            await recargarUnidades();
        } catch (error) {
            console.error('Error al desactivar unidad:', error);
            mostrarError('Error', `No se pudo desactivar la unidad: ${error.message}`);
        }
    }

    async function reactivarUnidad(idUnidad) {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/unidad/reactivar/${idUnidad}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudo reactivar la unidad');
            const data = await response.json();
            mostrarExito('Éxito', data.result || 'Unidad reactivada correctamente');
            await recargarUnidades();
        } catch (error) {
            console.error('Error al reactivar unidad:', error);
            mostrarError('Error', `No se pudo reactivar la unidad: ${error.message}`);
        }
    }

    async function mostrarMantenimientos(idUnidad) {
        console.log('mostrarMantenimientos called with idUnidad:', idUnidad);
        currentIdUnidad = idUnidad;
        if (!elements.mantenimientoModal) {
            console.error('mantenimientoModal no encontrado');
            mostrarError('Error', 'No se pudo abrir la ventana de mantenimientos. Contacte al soporte.');
            return;
        }
        try {
            console.log('Fetching mantenimientos for idUnidad:', idUnidad);
            const response = await fetch(`https://transportesnaches.com.mx/api/unidad/getMantenimientosPorUnidad/${idUnidad}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`}
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudieron cargar los mantenimientos');
            const data = await response.json();
            console.log('Mantenimientos recibidos (RAW):', data);
            mantenimientos = Array.isArray(data) ? data : [];
            console.log('Mantenimientos procesados:', mantenimientos);
            actualizarTablaMantenimientos();
            elements.mantenimientoModal.style.display = 'block';
            void elements.mantenimientoModal.offsetHeight; // Force reflow
            elements.mantenimientoModal.classList.add('show');
            console.log('mantenimientoModal displayed');
            console.log('tablaMantenimientosBody content:', elements.tablaMantenimientosBody.innerHTML);
            elements.filtroTipo.focus();
        } catch (error) {
            console.error('Error al cargar mantenimientos:', error);
            mostrarError('Error', `No se pudieron cargar los mantenimientos: ${error.message}`);
        }
    }

    function actualizarTablaMantenimientos() {
        if (!elements.tablaMantenimientosBody) {
            console.error('Cuerpo de tabla de mantenimientos no encontrado');
            mostrarError('Error', 'No se pudo actualizar la tabla de mantenimientos. Contacte al soporte.');
            return;
        }
        console.log('Mantenimientos para mostrar en la tabla:', mantenimientos);
        elements.tablaMantenimientosBody.innerHTML = '';
        if (mantenimientos.length === 0) {
            elements.tablaMantenimientosBody.innerHTML = '<tr><td colspan="3" class="text-center">No hay mantenimientos registrados.</td></tr>';
            return;
        }
        const fragment = document.createDocumentFragment();

        const toLocalDateFormat = (dateStr) => {
            if (!dateStr)
                return 'N/A';
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                console.error(`Invalid date format: ${dateStr}`);
                return 'N/A';
            }
            const [year, month, day] = dateStr.split('-');
            return `${day}-${month}-${year}`; // e.g., "2025-05-28" -> "28-05-2025"
        };

        mantenimientos.forEach(m => {
            console.log('Mantenimiento individual:', m);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2">${toLocalDateFormat(m.fechaMantenimiento)}</td>
                <td class="px-4 py-2">${m.tipoMantenimiento}</td>
                <td class="px-4 py-2">${m.kmActual }</td>
            `;
            fragment.appendChild(row);
        });
        elements.tablaMantenimientosBody.appendChild(fragment);
    }

    function filtrarMantenimientos() {
        const tipo = elements.filtroTipo.value;
        const fecha = elements.filtroFecha.value;
        let filteredMantenimientos = mantenimientos;
        const toLocalDateFormat = (dateStr) => {
            if (!dateStr)
                return 'N/A';
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                console.error(`Invalid date format: ${dateStr}`);
                return 'N/A';
            }
            const [year, month, day] = dateStr.split('-');
            return `${day}-${month}-${year}`; // e.g., "2025-05-28" -> "28-05-2025"
        };
        if (tipo) {
            filteredMantenimientos = filteredMantenimientos.filter(m => m.tipoMantenimiento === tipo);
        }
        if (fecha) {
            const fechaLocal = toLocalDateFormat(fecha); // Convert to DD-MM-YYYYAdd commentMore actions
            filteredMantenimientos = filteredMantenimientos.filter(m => {
                const maintenanceDate = toLocalDateFormat(m.fechaMantenimiento); // Use the string fieldAdd commentMore actions
                console.log(`Comparing fecha: ${fechaLocal} with maintenanceDate: ${maintenanceDate}`);
                return maintenanceDate === fechaLocal;
            });
        }
        console.log('Mantenimientos filtrados:', filteredMantenimientos);
        elements.tablaMantenimientosBody.innerHTML = '';
        if (filteredMantenimientos.length === 0) {
            elements.tablaMantenimientosBody.innerHTML = '<tr><td colspan="3" class="text-center">No hay mantenimientos que coincidan con los filtros.</td></tr>';
            return;
        }
        const fragment = document.createDocumentFragment();
        filteredMantenimientos.forEach(m => {
            console.log('Mantenimiento filtrado:', m);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2">${m.fechaMantenimiento}</td>
                <td class="px-4 py-2">${m.tipoMantenimiento}</td>
                <td class="px-4 py-2">${m.kmActual !== undefined && m.kmActual !== null ? m.kmActual : 'N/A'}</td>
            `;
            fragment.appendChild(row);
        });
        elements.tablaMantenimientosBody.appendChild(fragment);
    }

    async function fetchLatestKilometraje(idUnidad, retryCount = 2) {
        try {
            const response = await fetch(`https://transportesnaches.com.mx/api/unidad/getLatestKilometraje/${idUnidad}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`}
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudo obtener el kilometraje');
            const data = await response.json();
            console.log(`Respuesta de kilometraje para unidad ${idUnidad}:`, data);
            console.log(`Tipo de data.data:`, typeof data.data);
            let kmActual;
            if (data.data !== undefined) {
                kmActual = parseFloat(data.data);
            } else if (typeof data === 'number' || typeof data === 'string') {
                kmActual = parseFloat(data);
            } else {
                kmActual = 0;
            }
            if (isNaN(kmActual) || kmActual < 0) {
                console.warn(`Kilometraje inválido para unidad ${idUnidad}: ${kmActual}`);
                kmActual = 0;
            }
            console.log(`Kilometraje parseado para unidad ${idUnidad}: ${kmActual}`);
            return kmActual;
        } catch (error) {
            console.error(`Error al obtener kilometraje para unidad ${idUnidad}:`, error);
            if (retryCount > 0) {
                console.log(`Reintentando... (${retryCount} intentos restantes)`);
                return fetchLatestKilometraje(idUnidad, retryCount - 1);
            }
            return 0;
    }
    }

    async function checkMaintenanceAlert(idUnidad, kmActual, tipoVehiculo) {
        try {


            const unidad = unidades.find(u => u.idUnidad === idUnidad);
            if (!unidad) {
                console.error(`Unidad ${idUnidad} no encontrada`);
                return {needsMaintenance: false};
            }
            // Ensure kmMantenimiento is a number, default to MAINTENANCE_INTERVAL if invalid
            const kmMantenimiento = Number(unidad.kmMantenimiento) || MAINTENANCE_INTERVAL;
            console.log(`Unidad ${idUnidad}: kmMantenimiento=${kmMantenimiento}`);
            const response = await fetch(`https://transportesnaches.com.mx/api/unidad/getMantenimientosPorUnidad/${idUnidad}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
            });
            if (!response.ok) {
                throw new Error('No se pudieron cargar los mantenimientos');
            }
            const mantenimientos = await response.json();
            console.log(`Mantenimientos para unidad ${idUnidad}:`, mantenimientos);
            if (!Array.isArray(mantenimientos) || mantenimientos.length === 0) {
                console.log(`Unidad ${idUnidad}: Sin mantenimientos previos`);
                return {needsMaintenance: false};
            }
            const latestMantenimiento = mantenimientos[0]; // Sorted by fechaMantenimiento DESC
            const lastKmMantenimiento = Number(latestMantenimiento.kmActual) || 0;
            const threshold = lastKmMantenimiento + (kmMantenimiento || MAINTENANCE_INTERVAL) - MAINTENANCE_THRESHOLD;
            if (kmActual >= threshold) {
                return {
                    needsMaintenance: true,
                    message: `Unidad ${tipoVehiculo} (ID: ${idUnidad}) necesita mantenimiento. Kilometraje actual: ${kmActual} km. Último mantenimiento: ${lastKmMantenimiento} km.`
                };
            }
            return {needsMaintenance: false};
        } catch (error) {
            console.error(`Error al verificar mantenimiento para unidad ${idUnidad}:`, error);
            return {needsMaintenance: false};
        }
    }

    function checkPolicyExpiration(unidad) {
        if (!unidad.fechaVencimientoPol) {
            console.log(`Unidad ${unidad.idUnidad}: Sin fecha de vencimiento de póliza`);
            return {needsAlert: false};
        }
        const today = new Date();
        const expirationDate = new Date(unidad.fechaVencimientoPol);
        const alertDate = new Date(expirationDate);
        alertDate.setDate(expirationDate.getDate() - POLICY_ALERT_DAYS);
        if (today >= alertDate && today <= expirationDate) {
            return {
                needsAlert: true,
                message: `La póliza de la unidad ${unidad.tipoVehiculo} (ID: ${unidad.idUnidad}) vence el ${unidad.fechaVencimientoPol}.`
            };
        }
        return {needsAlert: false};
    }

    async function checkAllUnitsForAlerts() {
        try {
            const alerts = [];
            const activeUnits = unidades.filter(u => u.activoUnidad);
            console.log(`Verificando ${activeUnits.length} unidades activas`);
            const promises = activeUnits.map(async (unidad) => {
                const [kmResult, maintenanceResult, policyResult] = await Promise.all([
                    fetchLatestKilometraje(unidad.idUnidad),
                    checkMaintenanceAlert(unidad.idUnidad, await fetchLatestKilometraje(unidad.idUnidad), unidad.tipoVehiculo),
                    Promise.resolve(checkPolicyExpiration(unidad))
                ]);
                unidad._needsMaintenance = maintenanceResult.needsMaintenance;
                unidad._policyExpiring = policyResult.needsAlert;
                if (maintenanceResult.needsMaintenance) {
                    alerts.push(maintenanceResult.message);
                }
                if (policyResult.needsAlert) {
                    alerts.push(policyResult.message);
                }

                return unidad;
            });
            await Promise.all(promises);
            mostrarUnidades(); // Update table with warning icons

            if (alerts.length > 0) {
                Swal.fire({
                    title: 'Alertas de Unidades',
                    html: alerts.join('<br><br>'),
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316',
                    showCancelButton: true,
                    cancelButtonText: 'No mostrar de nuevo',
                    cancelButtonColor: '#6b7280'
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        sessionStorage.setItem(SESSION_KEY, 'true');
                    }
                });
            }
        } catch (error) {
            console.error('Error al verificar alertas de unidades:', error);
        }
    }

    async function abrirNuevoMantenimiento() {
        console.log('abrirNuevoMantenimiento called, currentIdUnidad:', currentIdUnidad);
        if (!elements.nuevoMantenimientoModal) {
            console.error('nuevoMantenimientoModal no encontrado');
            mostrarError('Error', 'No se pudo abrir el formulario de mantenimiento. Contacte al soporte.');
            return;
        }
        if (!currentIdUnidad) {
            console.error('currentIdUnidad no definido');
            mostrarError('Error', 'No se ha seleccionado una unidad válida. Abra la lista de mantenimientos primero.');
            return;
        }
        try {
            const unidad = unidades.find(u => u.idUnidad === currentIdUnidad);
            if (!unidad) {
                console.error('Unidad no encontrada para idUnidad:', currentIdUnidad);
                throw new Error('Unidad no encontrada');
            }
            console.log('Unidad encontrada:', unidad);
            const kmActual = await fetchLatestKilometraje(currentIdUnidad);
            console.log('Kilometraje obtenido:', kmActual);
            document.getElementById("mantenimientoIdUnidad").value = currentIdUnidad;
            document.getElementById("mantenimientoFecha").value = obtenerFechaLocal();
            document.getElementById("mantenimientoTipo").value = '';
            document.getElementById("mantenimientoKmActual").value = kmActual > 0 ? kmActual : '';
            // Reset form errors
            showErrorMessage('mantenimientoFecha', 'fechaError', false);
            showErrorMessage('mantenimientoTipo', 'tipoError', false);
            showErrorMessage('mantenimientoKmActual', 'kmError', false);
            // Show warning if mileage is unavailable
            const kmWarning = document.getElementById('kmWarning');
            if (kmWarning) {
                kmWarning.style.display = kmActual <= 0 ? 'block' : 'none';
            }
            // Show modal
            elements.nuevoMantenimientoModal.style.display = 'block';
            void elements.nuevoMantenimientoModal.offsetHeight; // Force reflow
            elements.nuevoMantenimientoModal.classList.add('show');
            console.log('nuevoMantenimientoModal displayed');
            document.getElementById("mantenimientoFecha").focus();
            const maintenanceResult = await checkMaintenanceAlert(currentIdUnidad, kmActual, unidad.tipoVehiculo);
            const policyResult = checkPolicyExpiration(unidad);
            const modalAlerts = [];
            if (maintenanceResult.needsMaintenance)
                modalAlerts.push(maintenanceResult.message);
            if (policyResult.needsAlert)
                modalAlerts.push(policyResult.message);
            if (modalAlerts.length > 0) {
                Swal.fire({
                    title: 'Alertas de Unidad',
                    html: modalAlerts.join('<br><br>'),
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316'
                });
            }
        } catch (error) {
            console.error('Error al abrir modal de mantenimiento:', error);
            mostrarError('Error', `No se pudo abrir el formulario de mantenimiento: ${error.message}`);
        }
    }

    function cerrarNuevoMantenimiento() {
        if (elements.nuevoMantenimientoModal) {
            elements.nuevoMantenimientoModal.classList.remove('show');
            elements.nuevoMantenimientoModal.style.display = 'none';
            console.log('nuevoMantenimientoModal cerrado');
        }
    }

    async function guardarMantenimiento() {
        const fecha = document.getElementById("mantenimientoFecha").value;
        const tipo = document.getElementById("mantenimientoTipo").value;
        const idUnidad = parseInt(document.getElementById("mantenimientoIdUnidad").value);
        const kmActual = document.getElementById("mantenimientoKmActual").value;

        if (!fecha || !tipo || !idUnidad || !kmActual) {
            mostrarError('Error', 'Campos del formulario no encontrados.');
            return;
        }
        let isValid = true;
        if (!fecha) {
            showErrorMessage('mantenimientoFecha', 'fechaError', true);
            isValid = false;
        } else {
            showErrorMessage('mantenimientoFecha', 'fechaError', false);
        }
        if (!tipo) {
            showErrorMessage('mantenimientoTipo', 'tipoError', true);
            isValid = false;
        } else {
            showErrorMessage('mantenimientoTipo', 'tipoError', false);
        }
        if (kmActual <= 0 || kmActual.value === '') {
            showErrorMessage('mantenimientoKmActual', 'kmError', true);
            isValid = false;
        } else {
            showErrorMessage('mantenimientoKmActual', 'kmError', false);
        }
        if (!idUnidad || idUnidad <= 0) {
            mostrarError('Error', 'Unidad no válida.');
            return;
        }
        if (!isValid) {
            mostrarError('Error', 'Por favor, completa todos los campos obligatorios con valores válidos.');
            return;
        }
        const mantenimientoData = {
            unidad: {
                idUnidad: idUnidad
            },
            fechaMantenimiento: fecha,
            tipoMantenimiento: tipo,
            kmActual: kmActual
        };
        console.log('Enviando mantenimiento:', mantenimientoData);
        try {
            const response = await fetch('https://transportesnaches.com.mx/api/unidad/registrarMantenimiento', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`},
                body: JSON.stringify(mantenimientoData)
            });
            if (!response.ok)
                await handleApiError(response, 'No se pudo registrar el mantenimiento');
            const data = await response.json();
            console.log('Respuesta del servidor al guardar mantenimiento:', JSON.stringify(data, null, 2));
            mostrarExito('Éxito', data.result || 'Mantenimiento registrado correctamente');
            cerrarNuevoMantenimiento();
            await mostrarMantenimientos(idUnidad);
            await checkAllUnitsForAlerts(); // Refresh alerts after maintenance
        } catch (error) {
            console.error('Error al guardar mantenimiento:', error);
            mostrarError('Error', `No se pudo guardar el mantenimiento: ${error.message}`);
        }
    }

    function limpiarMostrarFormulario() {
        limpiarFormulario();
        setDetalleVisible(true);
    }

    function limpiarFormulario() {
        document.getElementById("idUnidad").value = '';
        document.getElementById("tipoVehiculo").value = '';
        document.getElementById("placas").value = '';
        document.getElementById("rendimientoUnidad").value = '';
        document.getElementById("capacidad").value = '';
        document.getElementById("fechaVencimientoPol").value = '';
        document.getElementById("kmMantenimiento").value = MAINTENANCE_INTERVAL;
        document.getElementById("disponibilidad").value = '';
    }

    function setDetalleVisible(visible) {
        elements.formUnidad.classList.toggle('hidden', !visible);
        elements.tblEncabezado.classList.toggle('hidden', visible);
        elements.tblUnidad.classList.toggle('hidden', visible);
        if (!visible)
            limpiarFormulario();
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

    // Global functions for inline event handlers
    window.cargarDetalleUnidad = cargarDetalleUnidad;
    window.eliminarUnidad = eliminarUnidad;
    window.reactivarUnidad = reactivarUnidad;
    window.mostrarMantenimientos = mostrarMantenimientos;
});