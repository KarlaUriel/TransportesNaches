// controller_Menu.js
export function inicializarMenu() {
    const rol = localStorage.getItem('rol');
    const adminOnlyItems = document.querySelectorAll('.admin-only');
    const currentPage = window.location.pathname.toLowerCase();

    // Definir páginas restringidas
    const restrictedPages = [
        '/Contabilidad/view_Contabilidad.html',
        '/Empleado/view_Empleado.html',
        '/Unidad/view_Unidad.html',
        '/Cliente/view_Cliente.html',
        '/Ciudad/view_Ciudad.html',
        '/Caseta/view_Caseta.html'
    ];

    // Verificar si la página actual es restringida
    if (restrictedPages.some(page => currentPage.includes(page)) && rol !== 'Administrador') {
        Swal.fire({
            title: 'Acceso denegado',
            text: 'Solo los administradores pueden acceder a esta página',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        }).then(() => {
            window.location.href = '../Bitacora/view_Bitacora.html';
        });
        return;
    }

    // Ocultar/mostrar elementos del menú
    if (rol !== 'Administrador') {
        adminOnlyItems.forEach(item => {
            item.style.display = 'none';
        });
    } else {
        adminOnlyItems.forEach(item => {
            item.style.display = 'block';
        });
    }

    // Cerrar sesión
    const cerrarSesionBtn = document.getElementById('cerrarSesion');
    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener('click', () => {
            localStorage.removeItem('idUsuario');
            localStorage.removeItem('rol');
            localStorage.removeItem('nombreOperador');
            window.location.href = '../../index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', inicializarMenu);

