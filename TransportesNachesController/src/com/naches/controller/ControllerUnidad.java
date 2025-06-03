package com.naches.controller;

import com.naches.db.ConexionMySQL;
import com.naches.model.MantenimientoUnidad;
import com.naches.model.Unidad;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;

public class ControllerUnidad {

    public void insertarUnidad(Unidad u) throws Exception {
        String sql = "{CALL insertarUnidad( ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);

        cstmt.setString(1, u.getTipoVehiculo());
        cstmt.setString(2, u.getPlacas());
        cstmt.setDouble(3, u.getRendimientoUnidad());
        cstmt.setString(4, u.getCapacidad());
        cstmt.setString(5, u.getFechaVencimientoPol());
        cstmt.setInt(6, u.getActivoUnidad());
        cstmt.setString(7, u.getDisponibilidad());
        cstmt.setInt(8, u.getKmMantenimiento());
        cstmt.registerOutParameter(9, Types.INTEGER);

        cstmt.execute();
        u.setIdUnidad(cstmt.getInt(9));

        cstmt.close();
        connMySQL.close();
    }

    public void actualizarUnidad(Unidad u) throws Exception {
        String sql = "{CALL actualizarUnidad(?, ?, ?, ?, ?, ?, ?, ?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);

        cstmt.setInt(1, u.getIdUnidad());
        cstmt.setString(2, u.getTipoVehiculo());
        cstmt.setString(3, u.getPlacas());
        cstmt.setDouble(4, u.getRendimientoUnidad());
        cstmt.setString(5, u.getCapacidad());
        cstmt.setString(6, u.getFechaVencimientoPol());
        cstmt.setString(7, u.getDisponibilidad());
        cstmt.setInt(8, u.getKmMantenimiento());

        cstmt.executeUpdate();
        cstmt.close();
        connMySQL.close();
    }

    public void deleteUnidad(int idUnidad) throws Exception {
        String sql = "UPDATE unidad SET activoUnidad = 0 WHERE idUnidad = ?";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setInt(1, idUnidad);
        pstmt.executeUpdate();
        pstmt.close();
        connMySQL.close();
    }

    public List<Unidad> getAll() throws Exception {
        List<Unidad> unidades = new ArrayList<>();
        String sql = "SELECT * FROM v_unidad";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery();
        Unidad un = null;
        while (rs.next()) {
            un = fill(rs);
            unidades.add(un);
        }
        rs.close();
        pstmt.close();
        connMySQL.close();
        return unidades;
    }

    private Unidad fill(ResultSet rs) throws Exception {
        Unidad u = new Unidad();
        u.setIdUnidad(rs.getInt("idUnidad"));
        u.setTipoVehiculo(rs.getString("tipoVehiculo"));
        u.setPlacas(rs.getString("placas"));
        u.setRendimientoUnidad(rs.getDouble("rendimientoUnidad"));
        u.setCapacidad(rs.getString("capacidad"));
        u.setFechaVencimientoPol(rs.getString("fechaVencimientoPol"));
        u.setActivoUnidad(rs.getInt("activoUnidad"));
        u.setDisponibilidad(rs.getString("disponibilidad"));
        return u;
    }

    public List<Unidad> getAllVehiculo() throws Exception {
        List<Unidad> vehiculos = new ArrayList<>();
        String sql = "SELECT * FROM v_unidad";
        ConexionMySQL conexionMySQL = new ConexionMySQL();
        Connection conn = conexionMySQL.open();
        PreparedStatement pstm = conn.prepareStatement(sql);
        ResultSet rs = pstm.executeQuery();
        Unidad u;
        while (rs.next()) {
            u = fillVehiculo(rs);
            vehiculos.add(u);
        }
        rs.close();
        pstm.close();
        conexionMySQL.close();
        return vehiculos;
    }

    private Unidad fillVehiculo(ResultSet rs) throws Exception {
        Unidad un = new Unidad();
        un.setIdUnidad(rs.getInt("idUnidad"));
        un.setTipoVehiculo(rs.getString("tipoVehiculo"));
        return un;
    }

    public boolean reactivarUnidad(int idUnidad) throws Exception {
        String sql = "UPDATE unidad SET activoUnidad = 1 WHERE idUnidad = ?";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = null;
        PreparedStatement pstmt = null;
        int rowsUpdated = 0;
        try {
            conn = connMySQL.open();
            pstmt = conn.prepareStatement(sql);
            pstmt.setInt(1, idUnidad);
            rowsUpdated = pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error al ejecutar la consulta: " + e.getMessage());
            throw new Exception("Error al reactivar la unidad: " + e.getMessage());
        } finally {
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
        return rowsUpdated > 0;
    }

    public void registrarMantenimiento(MantenimientoUnidad m) throws Exception {
        String sql = "INSERT INTO mantenimiento (idUnidad, tipoMantenimiento, fechaMantenimiento, kmActual) VALUES (?, ?, ?, ?)";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);

        //eliminé la inserción por id, para poder colocar directamente desde el objeto unidad
        pstmt.setInt(1, m.getUnidad().getIdUnidad());
        
        pstmt.setString(2, m.getTipoMantenimiento());
        
        //cambié el formato de la fecha para poder ponerlo en un formato común
         java.sql.Date fechaMantenimientoSql = null;
    if (m.getFechaMantenimiento() != null && !m.getFechaMantenimiento().isEmpty()) {
        try {
            fechaMantenimientoSql = java.sql.Date.valueOf(m.getFechaMantenimiento()); // Expects YYYY-MM-DD
        } catch (IllegalArgumentException e) {
            throw new Exception("Invalid date format. Expected YYYY-MM-DD: " + e.getMessage());
        }
    } else {
        fechaMantenimientoSql = java.sql.Date.valueOf(LocalDate.now());
    }
    pstmt.setDate(3, fechaMantenimientoSql);
        pstmt.setInt(4, m.getKmActual() != null ? m.getKmActual() : 0);

        pstmt.executeUpdate();
        pstmt.close();
        connMySQL.close();
    }

    public List<MantenimientoUnidad> getMantenimientosPorUnidad(int idUnidad) throws Exception {
        List<MantenimientoUnidad> lista = new ArrayList<>();

        //cambié la consulta de sql ya que necesitaba para los mantenimientos los kmMantenimiento
        //de cada unidad
        String sql = "SELECT m.idMantenimiento, u.idUnidad, u.kmMantenimiento, m.tipoMantenimiento, m.fechaMantenimiento, m.kmActual " +
             "FROM mantenimiento m " +
             "LEFT JOIN unidad u ON m.idUnidad = u.idUnidad " +
             "WHERE m.idUnidad = ? " +
             "ORDER BY m.fechaMantenimiento DESC";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setInt(1, idUnidad);
        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            MantenimientoUnidad m = new MantenimientoUnidad();
            Unidad u = new Unidad();
            m.setIdMantenimiento(rs.getInt("idMantenimiento"));
            u.setIdUnidad(rs.getInt("idUnidad"));
            //agregué mantenimiento a la vista
            u.setKmMantenimiento(rs.getInt("kmMantenimiento"));
            m.setUnidad(u);
            m.setTipoMantenimiento(rs.getString("tipoMantenimiento"));
            
            // conversión de la fecha al formato YYYY-MM-DD
        java.sql.Date fechaMantenimiento = rs.getDate("fechaMantenimiento");
        m.setFechaMantenimiento(fechaMantenimiento != null ? fechaMantenimiento.toString() : null); // "YYYY-MM-DD"
            m.setKmActual(rs.getInt("kmActual"));
            lista.add(m);
        }

        rs.close();
        pstmt.close();
        connMySQL.close();
        return lista;
    }
    
     public int getLatestKilometraje(int idUnidad) throws Exception {
        String sql = "SELECT kmFinal FROM v_nota_gasto WHERE idUnidad = ? ORDER BY fechaLlegada DESC LIMIT 1";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setInt(1, idUnidad);
        ResultSet rs = pstmt.executeQuery();

        // en lugar de kilometraje le puse kmActual
        int kmActual = 0;
        if (rs.next()) {
            kmActual = rs.getInt("kmFinal");
        }

        rs.close();
        pstmt.close();
        connMySQL.close();
        return kmActual;
    }
}