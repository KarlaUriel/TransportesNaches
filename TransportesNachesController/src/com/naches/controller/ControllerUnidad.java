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
import java.sql.Date;
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

        // Determine idUnidad: prefer unidad.idUnidad, fallback to direct idUnidad
        int idUnidad = 0;
        if (m.getUnidad() != null && m.getUnidad().getIdUnidad() > 0) {
            idUnidad = m.getUnidad().getIdUnidad();
        } else if (m.getIdUnidad() > 0) {
            idUnidad = m.getIdUnidad();
        }
        System.out.println("idUnidad used: " + idUnidad); // Debug log
        if (idUnidad <= 0) {
            throw new Exception("Invalid idUnidad: " + idUnidad);
        }

        pstmt.setInt(1, idUnidad);
        pstmt.setString(2, m.getTipoMantenimiento());
        pstmt.setDate(3, m.getFechaMantenimiento() != null ? new Date(m.getFechaMantenimiento().getTime()) : Date.valueOf(LocalDate.now()));
        pstmt.setInt(4, m.getKmActual() != null ? m.getKmActual() : 0);

        pstmt.executeUpdate();
        pstmt.close();
        connMySQL.close();
    }

    public List<MantenimientoUnidad> getMantenimientosPorUnidad(int idUnidad) throws Exception {
        List<MantenimientoUnidad> lista = new ArrayList<>();
        String sql = "SELECT * FROM mantenimiento WHERE idUnidad = ? ORDER BY fechaMantenimiento DESC";
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
            m.setUnidad(u);
            m.setTipoMantenimiento(rs.getString("tipoMantenimiento"));
            m.setFechaMantenimiento(rs.getDate("fechaMantenimiento"));
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

        int kilometraje = 0;
        if (rs.next()) {
            kilometraje = rs.getInt("kmFinal");
        }

        rs.close();
        pstmt.close();
        connMySQL.close();
        return kilometraje;
    }
}
