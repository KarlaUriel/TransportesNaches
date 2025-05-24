package com.naches.controller;

import com.naches.db.ConexionMySQL;
import com.naches.model.Ciudad;
import com.naches.model.Estado;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.sql.Types;
import java.sql.CallableStatement;

/**
 *
 * @author karla
 */
public class ControllerCiudad {

    public void insertarCiudad(Ciudad ci) throws Exception {
        // Definir la consulta SQL o procedimiento almacenado para insertar una caseta
        String sql = "{CALL insertarCiudad(?, ?, ?, ?)}"; // Procedimiento almacenado de mysql

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement para llamar al procedimiento almacenado
        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros del procedimiento almacenado
        cstmt.setString(1, ci.getNombreCiudad());
        cstmt.setString(2, ci.getEstado().getNombreEstado());

        // Registrar los parámetros de salida **antes** de ejecutar
        cstmt.registerOutParameter(3, Types.INTEGER); // var_idEstado
        cstmt.registerOutParameter(4, Types.INTEGER); // var_idCiudad

        // Ejecutar la consulta
        cstmt.execute();

        // Obtener los valores generados
        ci.getEstado().setIdEstado(cstmt.getInt(3)); // Asignamos el idEstado
        ci.setIdCiudad(cstmt.getInt(4)); // Asignamos el idEstado

        // Cerrar la conexión
        cstmt.close();
        connMySQL.close();
    }

    public void updateCiudad(Ciudad ci) throws Exception {
        // Definir la consulta SQL o procedimiento almacenado para actualizar un empleado
        String sql = "{CALL actualizarCiudad(?, ?, ?, ?)}"; // Procedimiento almacenado hipotético

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement para llamar al procedimiento almacenado
        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros del procedimiento almacenado
        cstmt.setInt(1, ci.getIdCiudad());
        cstmt.setString(2, ci.getNombreCiudad());
        cstmt.setInt(3, ci.getEstado().getIdEstado());
        cstmt.setString(4, ci.getEstado().getNombreEstado());

        // Ejecutar el procedimiento almacenado
        cstmt.executeUpdate();

        // Cerrar la conexión
        cstmt.close();
        connMySQL.close();
    }

    public List<Ciudad> getAll() throws Exception {
        List<Ciudad> ciudades = new ArrayList<>();
        // Se define la consulta SQL:
        String sql = "SELECT * FROM v_ciudad";

        // Abrimos la conexion con la BD:
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar la sentencia SQL
        PreparedStatement pstmt = conn.prepareStatement(sql);

        // Ejecutar la consulta
        ResultSet rs = pstmt.executeQuery();

        Ciudad ci = null;

        // Recorrer los resultados y llenar la lista de clientes
        while (rs.next()) {
            ci = fillCiudad(rs);  // Método que rellena el objeto cliente
            ciudades.add(ci);
        }

        rs.close();
        pstmt.close();
        connMySQL.close();

        return ciudades;
    }

    public List<Ciudad> getAllCiudades(String query) throws Exception {
        List<Ciudad> ciudad = new ArrayList<>();
        // Modified SQL query to prioritize matches starting with the query
        String sql = "SELECT * FROM v_ciudad WHERE ciudad LIKE ? OR ciudad LIKE ? ORDER BY CASE WHEN ciudad LIKE ? THEN 0 ELSE 1 END";

        // Open the database connection
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        // Set parameters: first for starts-with, second for contains, third for ordering
        pstmt.setString(1, query + "%"); // Matches cities starting with query
        pstmt.setString(2, "%" + query + "%"); // Matches cities containing query
        pstmt.setString(3, query + "%"); // Used in ORDER BY to prioritize starts-with
        ResultSet rs = pstmt.executeQuery();

        Ciudad ciud = null;

        // Iterate through the results
        while (rs.next()) {
            ciud = fillCiudad(rs);
            ciudad.add(ciud);
        }

        rs.close();
        pstmt.close();
        connMySQL.close();

        return ciudad;
    }

    private Ciudad fillCiudad(ResultSet rs) throws Exception {
        Ciudad c = new Ciudad();
        Estado e = new Estado();
        c.setIdCiudad(rs.getInt("idCiudad"));
        c.setNombreCiudad(rs.getString("nombreCiudad"));
        e.setIdEstado(rs.getInt("idEstado"));
        e.setNombreEstado(rs.getString("nombreEstado"));
        // Concatenar ciudad y estado
        String ciudad = rs.getString("nombreCiudad") + ", " + rs.getString("nombreEstado");
        c.setCiudad(ciudad);
        c.setEstado(e);
        return c;
    }

}
