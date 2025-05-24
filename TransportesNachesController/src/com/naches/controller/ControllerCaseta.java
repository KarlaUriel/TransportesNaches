package com.naches.controller;


import com.naches.db.ConexionMySQL;
import com.naches.model.Caseta;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;

public class ControllerCaseta {
     public void insertarCaseta(Caseta ca) throws Exception {
        // Definir la consulta SQL o procedimiento almacenado para insertar una caseta
        String sql = "{CALL insertarCaseta(?,?)}"; // Procedimiento almacenado de mysql

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement para llamar al procedimiento almacenado
        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros del procedimiento almacenado

        cstmt.setString(1, ca.getNombre());
      // Registrar los parámetros de salida **antes** de ejecutar
        cstmt.registerOutParameter(2, Types.INTEGER); // var_idCaseta

        // Ejecutar la consulta
        cstmt.execute();

        // Obtener los valores generados
        ca.setIdCaseta(cstmt.getInt(2)); // Asignamos el idCaseta


        // Cerrar la conexión
        cstmt.close();
        connMySQL.close();
    }

    public void updateCaseta(Caseta ca) throws Exception {
        // Definir la consulta SQL o procedimiento almacenado para actualizar un empleado
        String sql = "{CALL actualizarCaseta(?, ?)}"; // Procedimiento almacenado hipotético

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement para llamar al procedimiento almacenado
        CallableStatement cstmt = conn.prepareCall(sql);

        
        
        // Establecer los parámetros del procedimiento almacenado
        cstmt.setInt(1, ca.getIdCaseta());
        cstmt.setString(2, ca.getNombre());
        
        // Ejecutar el procedimiento almacenado
        cstmt.executeUpdate();

        // Cerrar la conexión
        cstmt.close();
        connMySQL.close();
    }

    public List<Caseta> getAll() throws Exception {
        List<Caseta> casetas = new ArrayList<>();

        // Definir la consulta SQL para obtener todos los clientes
        String sql = "SELECT * FROM v_caseta"; 

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar la sentencia SQL
        PreparedStatement pstmt = conn.prepareStatement(sql);

        // Ejecutar la consulta
        ResultSet rs = pstmt.executeQuery();

        Caseta ca = null;

        // Recorrer los resultados y llenar la lista de clientes
        while (rs.next()) {
            ca = fillCaseta(rs);  // Método que rellena el objeto cliente
            casetas.add(ca);
        }

        // Cerrar la conexión
        rs.close();
        pstmt.close();
        connMySQL.close();

        return casetas;
    }

    private Caseta fillCaseta(ResultSet rs) throws Exception {
        Caseta ca = new Caseta();
        ca.setIdCaseta(rs.getInt("idCaseta"));
        ca.setNombre(rs.getString("nombre"));
        return ca;
    }
    
    public void deleteCaseta(int idCaseta) throws Exception {
        // Definir la consulta SQL o procedimiento almacenado para eliminar una caseta
        String sql = "{CALL eliminarCaseta(?)}"; // Procedimiento almacenado hipotético

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement para llamar al procedimiento almacenado
        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros del procedimiento almacenado
        cstmt.setInt(1, idCaseta);

        // Ejecutar el procedimiento almacenado
        cstmt.executeUpdate();

        // Cerrar la conexión
        cstmt.close();
        connMySQL.close();
    }
}
