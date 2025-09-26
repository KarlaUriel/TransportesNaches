export function mostrarError(titulo, mensaje) {
    Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor:'f97316',
        customClass: {
            popup: 'z-50', // Tailwind equivalent to z-index: 50, adjust as needed
            container: 'z-40' // Tailwind equivalent to z-index: 40
        }
    });
}

export function mostrarExito(titulo, mensaje) {
    Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'success',
        confirmButtonText: 'Aceptar',
          confirmButtonColor:'f97316',
        customClass: {
            popup: 'z-50', // Tailwind equivalent to z-index: 50, adjust as needed
            container: 'z-40' // Tailwind equivalent to z-index: 40
        }
    });
}
export function mostrarAlerta(titulo,mensaje) {
    Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, estoy seguro',
        cancelButtonText: 'No, cancelar',
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#6b7280',
        customClass: {
            popup: 'z-50', // Tailwind equivalent to z-index: 50, adjust as needed
            container: 'z-40' // Tailwind equivalent to z-index: 40
        }
        });
}


