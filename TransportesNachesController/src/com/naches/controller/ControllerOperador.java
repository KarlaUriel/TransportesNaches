package com.naches.controller;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import com.naches.db.ConexionMySQL;
import com.naches.model.NotaGasto;
import com.naches.model.Operador;
import com.naches.model.Persona;
import com.naches.model.Rol;
import com.naches.model.Usuario;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.sql.Types;
import java.sql.SQLException;

public class ControllerOperador {
    
    // Método para insertar un operador
    public void insertarOperador(Operador o) throws Exception {
        String sql = "{CALL insertarOperador(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros de entrada
        cstmt.setString(1, o.getPersona().getNombre());
        cstmt.setString(2, o.getPersona().getApellidoPaterno());
        cstmt.setString(3, o.getPersona().getApellidoMaterno());
        cstmt.setString(4, o.getPersona().getTelefono());
        cstmt.setString(5, o.getPersona().getCorreo());

        cstmt.setString(6, o.getUsuario().getNombreUsuario());
        cstmt.setString(7, o.getUsuario().getContrasenia());
        cstmt.setString(8, o.getUsuario().getRol().name()); // Convierte el enum a String
        cstmt.setInt(9, o.getUsuario().getActivoUsuario());
        cstmt.setInt(10, o.getActivoOperador());

        // Registrar los parámetros de salida
        cstmt.registerOutParameter(11, Types.INTEGER); // var_idPersona
        cstmt.registerOutParameter(12, Types.INTEGER); // var_idUsuario
        cstmt.registerOutParameter(13, Types.INTEGER); // var_idOperador

        // Ejecutar el procedimiento
        cstmt.execute();

        // Obtener los valores generados
        o.getPersona().setIdPersona(cstmt.getInt(11));
        o.getUsuario().setIdUsuario(cstmt.getInt(12));
        o.setIdOperador(cstmt.getInt(13));

        // Cerrar recursos
        cstmt.close();
        connMySQL.close();
    }

    // Método para actualizar un operador
    public void actualizarOperador(Operador operador) throws Exception {
        String sql = "{CALL actualizarOperador(?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?)}"; // Procedimiento almacenado

        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros de entrada
        cstmt.setInt(1, operador.getIdOperador());
        cstmt.setInt(2,operador.getActivoOperador());
        cstmt.setInt(3, operador.getPersona().getIdPersona());
        cstmt.setString(4, operador.getPersona().getNombre());
        cstmt.setString(5, operador.getPersona().getApellidoPaterno());
        cstmt.setString(6, operador.getPersona().getApellidoMaterno());
        cstmt.setString(7, operador.getPersona().getTelefono());
        cstmt.setString(8, operador.getPersona().getCorreo());
        cstmt.setInt(9, operador.getUsuario().getIdUsuario());
        cstmt.setString(10, operador.getUsuario().getNombreUsuario());
        cstmt.setString(11, operador.getUsuario().getContrasenia());


        // Ejecutar el procedimiento
        cstmt.executeUpdate();
        cstmt.close();
        connMySQL.close();
    }

    // Método para eliminar un operador (eliminación lógica)
    public void deleteOperador(int idOperador) throws Exception {
        String sql = "UPDATE operador SET activoOperador = 0 WHERE idOperador = ?";

        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        PreparedStatement pstmt = conn.prepareStatement(sql);

        pstmt.setInt(1, idOperador);

        pstmt.executeUpdate();
        pstmt.close();
        connMySQL.close();
    }

    // Método para obtener todos los operadores
    public List<Operador> getAll() throws Exception {
        List<Operador> operadores = new ArrayList<>();

        String sql = "SELECT * FROM v_operador"; // Utiliza la vista `v_operador`

        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        PreparedStatement pstmt = conn.prepareStatement(sql);

        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            Operador operador = fill(rs);
            operadores.add(operador);
        }

        rs.close();
        pstmt.close();
        connMySQL.close();

        return operadores;
    }
      
    // Método auxiliar para llenar un objeto Operador a partir de un ResultSet
    private Operador fill(ResultSet rs) throws Exception {
        Operador operador = new Operador();
        Usuario usuario = new Usuario();
        Persona persona = new Persona();

        persona.setIdPersona(rs.getInt("idPersona"));
        persona.setNombre(rs.getString("nombre"));
        persona.setApellidoPaterno(rs.getString("apellidoPaterno"));
        persona.setApellidoMaterno(rs.getString("apellidoMaterno"));
        persona.setTelefono(rs.getString("telefono"));
        persona.setCorreo(rs.getString("correo"));

        usuario.setIdUsuario(rs.getInt("idUsuario"));
        usuario.setNombreUsuario(rs.getString("nombreUsuario"));
        usuario.setContrasenia(rs.getString("contrasenia"));
        usuario.setRol(Rol.valueOf(rs.getString("rol")));
        usuario.setActivoUsuario(rs.getInt("activoUsuario"));

        operador.setIdOperador(rs.getInt("idOperador"));
        operador.setActivoOperador(rs.getInt("activoOperador"));
        operador.setNombreOperador(rs.getString("nombreOperador"));
        operador.setPersona(persona);
        operador.setUsuario(usuario);

        return operador;
    }
  
public boolean reactivarOperador(int idOperador) throws Exception {
    // Definir la consulta SQL para reactivar el operador
    String sql = "UPDATE operador SET activoOperador = 1 WHERE idOperador = ?";

    // Inicializar las variables
    ConexionMySQL connMySQL = new ConexionMySQL();
    Connection conn = null;
    PreparedStatement pstmt = null;
    int rowsUpdated = 0;

    try {
        // Abrir la conexión con la base de datos
        conn = connMySQL.open();

        // Preparar el PreparedStatement
        pstmt = conn.prepareStatement(sql);

        // Establecer el parámetro
        pstmt.setInt(1, idOperador);

        // Ejecutar la actualización
        rowsUpdated = pstmt.executeUpdate();

    } catch (SQLException e) {
        // Manejo de excepciones SQL
        System.err.println("Error al ejecutar la consulta: " + e.getMessage());
        throw new Exception("Error al reactivar el operador: " + e.getMessage());
    } finally {
        // Cerrar recursos
        if (pstmt != null) {
            try {
                pstmt.close();
            } catch (SQLException e) {
                System.err.println("Error al cerrar PreparedStatement: " + e.getMessage());
            }
        }
        if (conn != null) {
            try {
                connMySQL.close();
            } catch (SQLException e) {
                System.err.println("Error al cerrar la conexión: " + e.getMessage());
            }
        }
    }

    // Si se actualizó al menos una fila, el operador fue reactivado correctamente
    return rowsUpdated > 0;
}
}
