package com.naches.controller;

import com.naches.db.ConexionMySQL;
import com.naches.model.GastoAnual;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ControllerGastoAnual {

    public void insertar(GastoAnual gastoAnual) throws Exception {
        String sql = "{CALL sp_InsertarGastoAnual(?, ?, ?, ?, ?, ?)}";

        ConexionMySQL conexionMySQL = new ConexionMySQL();
        Connection conn = conexionMySQL.open();

        CallableStatement cstmt = conn.prepareCall(sql);

        cstmt.setString(1, gastoAnual.getDescripcion());
        cstmt.setBigDecimal(2, gastoAnual.getMonto());
        cstmt.setInt(3, gastoAnual.getAnio());
        cstmt.setDate(4, gastoAnual.getFechaCreacion() != null ? new java.sql.Date(gastoAnual.getFechaCreacion().getTime()) : null);
        cstmt.setDate(5, gastoAnual.getFechaActualizacion() != null ? new java.sql.Date(gastoAnual.getFechaActualizacion().getTime()) : null);
        cstmt.registerOutParameter(6, java.sql.Types.INTEGER);

        cstmt.execute();

        gastoAnual.setIdGastoAnual(cstmt.getInt(6));

        cstmt.close();
        conexionMySQL.close();
    }

    public void actualizar(GastoAnual gastoAnual) throws Exception {
        String sql = "{CALL sp_ActualizarGastoAnual(?, ?, ?, ?, ?, ?)}";

        ConexionMySQL conexionMySQL = new ConexionMySQL();
        Connection conn = conexionMySQL.open();

        CallableStatement cstmt = conn.prepareCall(sql);

        cstmt.setInt(1, gastoAnual.getIdGastoAnual());
        cstmt.setString(2, gastoAnual.getDescripcion());
        cstmt.setBigDecimal(3, gastoAnual.getMonto());
        cstmt.setInt(4, gastoAnual.getAnio());
        cstmt.setDate(5, gastoAnual.getFechaCreacion() != null ? new java.sql.Date(gastoAnual.getFechaCreacion().getTime()) : null);
        cstmt.setDate(6, gastoAnual.getFechaActualizacion() != null ? new java.sql.Date(gastoAnual.getFechaActualizacion().getTime()) : null);

        cstmt.execute();

        cstmt.close();
        conexionMySQL.close();
    }

   public void eliminar(int idGastoAnual) throws SQLException, Exception {
        String sql = "{CALL sp_EliminarGastoAnual(?)}";
        ConexionMySQL conexionMySQL = new ConexionMySQL();
        try (Connection conn = conexionMySQL.open();
             CallableStatement cstmt = conn.prepareCall(sql)) {
            conn.setAutoCommit(true); // Ensure auto-commit is enabled
            cstmt.setInt(1, idGastoAnual);
            cstmt.executeUpdate();
        } catch (SQLException e) {
            // Log the error for debugging
            System.err.println("Error al eliminar gasto anual con id: " + idGastoAnual + ", Error: " + e.getMessage());
            throw new SQLException("No se pudo eliminar el gasto anual: " + e.getMessage(), e);
        }
    }

    public List<GastoAnual> getAll() throws Exception {
        List<GastoAnual> gastosAnuales = new ArrayList<>();

        String sql = "SELECT * FROM v_gastosAnuales";

        ConexionMySQL conexionMySQL = new ConexionMySQL();
        Connection conn = conexionMySQL.open();

        PreparedStatement pstmt = conn.prepareStatement(sql);

        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            GastoAnual gasto = fill(rs);
            gastosAnuales.add(gasto);
        }

        rs.close();
        pstmt.close();
        conexionMySQL.close();

        return gastosAnuales;
    }

    private GastoAnual fill(ResultSet rs) throws Exception {
        GastoAnual gasto = new GastoAnual();

        gasto.setIdGastoAnual(rs.getInt("idGastoAnual"));
        gasto.setDescripcion(rs.getString("descripcion"));
        gasto.setMonto(rs.getBigDecimal("monto"));
        gasto.setAnio(rs.getInt("anio"));
        gasto.setFechaCreacion(rs.getDate("fechaCreacion"));
        gasto.setFechaActualizacion(rs.getDate("fechaActualizacion"));

        return gasto;
    }
}
