async function validarLogin(event) {
    event.preventDefault(); // Evita el envío automático del formulario

    let usuario = document.getElementById("nombreUsuario").value.trim();
    let password = document.getElementById("password").value.trim();

    if (usuario === "" || password === "") {
        Swal.fire({
            title: 'Campos requeridos',
            text: 'Por favor, complete todos los campos.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316', // Naranja
        });
        return;
    }

    let datosLog = { nombreUsuario: usuario, contrasenia: password };

    try {
        let response = await fetch("https://transportesnaches.com.mx/api/principal/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // Set to application/json
            },
            body: JSON.stringify(datosLog) // Send raw JSON
        });

        let data = await response.json();

        if (response.ok) {
            // Guardar datos en localStorage
            localStorage.setItem("nombreUsuario", data.usuario.nombreUsuario);
            localStorage.setItem("nombreCompleto", data.usuario.nombreCompleto);
            localStorage.setItem("nombreOperador", data.usuario.nombreOperador || data.usuario.nombreCompleto.split(' ')[0]); // Primer nombre como fallback
            localStorage.setItem("idUsuario", data.usuario.idUsuario);
            localStorage.setItem("rol", data.usuario.rol);
            localStorage.setItem("token", data.token); // Store the JWT token

            if (data.usuario.rol === "Administrador") {
                Swal.fire({
                    title: 'Éxito',
                    text: 'Inicio de sesión exitoso como Administrador.',
                    icon: 'success',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#f97316',
                }).then(() => {
                    window.location.href = "/menu";
                });
            } else if (data.usuario.rol === "Operador") {
                Swal.fire({
                    title: 'Éxito',
                    text: 'Inicio de sesión exitoso como Operador.',
                    icon: 'success',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#f97316'
                }).then(() => {
                    window.location.href = "/menu";
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Rol no reconocido.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f97316',
                });
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'Usuario o contraseña incorrectos.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#f97316',
            });
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        Swal.fire({
            title: 'Error',
            text: 'Error al conectar con el servidor.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f97316',
        });
    }
}