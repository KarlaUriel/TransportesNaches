package com.naches.controller;

import com.naches.model.Usuario;

public class TestControllerLogin {
    public static void main(String[] args) {
        // Crear un objeto Usuario con un nombre de usuario y contraseña de prueba
        Usuario usuario = new Usuario();
        usuario.setNombreUsuario("usuarioPrueba");  // Asegúrate de que este usuario exista en la base de datos
        usuario.setContrasenia("contrasenia123");  // Asegúrate de que esta contraseña esté correcta para ese usuario
        
        // Crear una instancia de ControllerLogin
        ControllerLogin controller = new ControllerLogin();
        
        try {
            // Validar los datos del usuario
            controller.ValidarDatos(usuario);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
