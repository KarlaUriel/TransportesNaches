package com.naches.services;

import com.naches.db.ConexionMySQL;
import com.naches.model.NotaGasto;
import java.sql.*;
import java.util.*;
import java.util.Date;

public class NotaDAO {

    public List<NotaGasto> obtenerNotasPendientes() throws Exception {
        List<NotaGasto> notas = new ArrayList<>();

        String sql = "SELECT idNota, estadoFact, fechaLlenado FROM notas WHERE estadoFact = 'PENDIENTE'";

        // Conexión a la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        
        // Preparar la consulta
        PreparedStatement stmt = conn.prepareStatement(sql);
        ResultSet rs = stmt.executeQuery();

        // Procesar los resultados
        while (rs.next()) {
            int id = rs.getInt("idNota");
            String estadoFact = rs.getString("estadoFact");
            Date fecha = rs.getDate("fechaLlenado"); // Obtenemos el valor de fechaLlenado

            // Crear el objeto NotaGasto y agregarlo a la lista
            notas.add(new NotaGasto(id, estadoFact, fecha));
        }

        return notas;
    }
}