package com.naches.controller;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.ResultSet;
import com.naches.db.ConexionMySQL;
import com.naches.model.Rol;
import com.naches.model.Usuario;
import com.naches.model.Persona;
import java.sql.Connection;

public class ControllerLogin {

    public void ValidarDatos(Usuario us) throws Exception {
        // Consulta con JOIN para obtener los datos de la persona
        String sql = "SELECT u.idUsuario, u.nombreUsuario, u.contrasenia, u.rol, u.activoUsuario, " +
                     "p.nombre, p.apellidoPaterno, p.apellidoMaterno " +
                     "FROM usuario u " +
                     "INNER JOIN persona p ON u.idPersona = p.idPersona " +
                     "WHERE u.nombreUsuario = ? AND u.contrasenia = ?";

        try {
            ConexionMySQL connMySQL = new ConexionMySQL();
            Connection conn = connMySQL.open();
            PreparedStatement ps = conn.prepareStatement(sql);

            ps.setString(1, us.getNombreUsuario());
            ps.setString(2, us.getContrasenia());

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                us.setIdUsuario(rs.getInt("idUsuario"));
                us.setNombreUsuario(rs.getString("nombreUsuario"));
                us.setContrasenia(rs.getString("contrasenia"));
                us.setRol(Rol.valueOf(rs.getString("rol")));
                us.setActivoUsuario(rs.getInt("activoUsuario"));
                us.setIngreso(true);

                // Crear objeto Persona y asignar datos
                Persona persona = new Persona();
                persona.setNombre(rs.getString("nombre"));
                persona.setApellidoPaterno(rs.getString("apellidoPaterno"));
                persona.setApellidoMaterno(rs.getString("apellidoMaterno"));

                us.setPersona(persona);

                // Concatenar el nombre completo y agregarlo como un atributo en el usuario
            String nombreCompleto = persona.getNombre() + " " + persona.getApellidoPaterno() + " " + 
                                   (persona.getApellidoMaterno() != null ? persona.getApellidoMaterno() : "");
            us.setNombreCompleto(nombreCompleto); // Asegúrate de que Usuario tenga este campo
                
                System.out.println("Acceso concedido: " + us.getNombreUsuario() + 
                                 " - Nombre: " + us.getNombreCompleto() + 
                                 " - Rol: " + us.getRol());
            } else {
                System.out.println("Usuario o contraseña incorrectos.");
                us.setIngreso(false);
            }
            rs.close();
            ps.close();
            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    
    public Integer obtenerIdPorNombre(String nombreUsuario) throws SQLException, Exception {
        Integer idUsuario = null;
        String sql = "SELECT idUsuario FROM usuario WHERE nombreUsuario = ?";

        try {
            ConexionMySQL connMySQL = new ConexionMySQL();
            Connection conn = connMySQL.open();
            PreparedStatement ps = conn.prepareStatement(sql);

            ps.setString(1, nombreUsuario);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                idUsuario = rs.getInt("idUsuario");
            }

            rs.close();
            ps.close();
            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }

        return idUsuario;
    }
    
}
