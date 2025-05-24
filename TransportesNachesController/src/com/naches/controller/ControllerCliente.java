package com.naches.controller;

import java.util.List;
import java.sql.Connection;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import com.naches.db.ConexionMySQL;
import com.naches.model.Cliente;
import com.naches.model.Persona;
import com.naches.model.SubCliente;
import java.sql.Types;
import java.sql.SQLException;

public class ControllerCliente {

    public void insertarCliente(Cliente c) throws Exception {
        // Definir el procedimiento almacenado con 11 placeholders (9 IN + 2 OUT)
        String sql = "{CALL insertarCliente(?,?,?,?,?,?,?,?,?,?,?)}";

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement
        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros de entrada
        cstmt.setString(1, c.getPersona().getNombre());
        cstmt.setString(2, c.getPersona().getApellidoPaterno());
        cstmt.setString(3, c.getPersona().getApellidoMaterno());
        cstmt.setString(4, c.getPersona().getTelefono());
        cstmt.setString(5, c.getPersona().getCorreo());
        cstmt.setString(6, c.getTipoCliente());
        cstmt.setString(7, c.getCalificaciones());
        cstmt.setInt(8, c.getActivoCliente());
        cstmt.setInt(9, c.getFactura());

        // Registrar los parámetros de salida
        cstmt.registerOutParameter(10, Types.INTEGER); // var_idPersona
        cstmt.registerOutParameter(11, Types.INTEGER); // var_idCliente

        // Ejecutar la consulta
        cstmt.execute();

        // Obtener los valores generados
        c.getPersona().setIdPersona(cstmt.getInt(10));
        c.setIdCliente(cstmt.getInt(11));

        // Cerrar recursos
        cstmt.close();
        connMySQL.close();
    }

    public void updateCliente(Cliente c) throws Exception {
        // Definir el procedimiento almacenado con 10 parámetros
        String sql = "{CALL actualizarCliente(?,?,?,?,?,?,?,?,?,?)}";

        // Abrir la conexión con la base de datos
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        // Preparar el CallableStatement
        CallableStatement cstmt = conn.prepareCall(sql);

        // Establecer los parámetros
        cstmt.setInt(1, c.getIdCliente());
        cstmt.setInt(2, c.getPersona().getIdPersona());
        cstmt.setString(3, c.getTipoCliente());
        cstmt.setString(4, c.getCalificaciones());
        cstmt.setString(5, c.getPersona().getNombre());
        cstmt.setString(6, c.getPersona().getApellidoPaterno());
        cstmt.setString(7, c.getPersona().getApellidoMaterno());
        cstmt.setString(8, c.getPersona().getTelefono());
        cstmt.setString(9, c.getPersona().getCorreo());
        cstmt.setInt(10, c.getFactura());

        // Ejecutar el procedimiento
        cstmt.executeUpdate();

        // Cerrar recursos
        cstmt.close();
        connMySQL.close();
    }

    public void deleteCliente(int idCliente) throws Exception {
        String sql = "UPDATE cliente SET activoCliente = 0 WHERE idCliente = ?";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setInt(1, idCliente);
        pstmt.executeUpdate();
        pstmt.close();
        connMySQL.close();
    }

    public List<Cliente> getAll() throws Exception {
        List<Cliente> clientes = new ArrayList<>();
        String sql = "SELECT * FROM v_cliente";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        PreparedStatement pstmt = conn.prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            Cliente cli = fill(rs);
            clientes.add(cli);
        }

        rs.close();
        pstmt.close();
        connMySQL.close();
        return clientes;
    }

    private Cliente fill(ResultSet rs) throws Exception {
        Cliente c = new Cliente();
        Persona p = new Persona();
        c.setPersona(p);

        c.setIdCliente(rs.getInt("idCliente"));
        c.setNombreCliente(rs.getString("nombreCliente"));
        c.setTipoCliente(rs.getString("tipoCliente"));
        c.setCalificaciones(rs.getString("calificacion"));
        c.setActivoCliente(rs.getInt("activoCliente"));
        c.setFactura(rs.getInt("factura")); // Mapear el campo factura

        p.setIdPersona(rs.getInt("idPersona"));
        p.setNombre(rs.getString("nombre"));
        p.setApellidoPaterno(rs.getString("apellidoPaterno"));
        p.setApellidoMaterno(rs.getString("apellidoMaterno"));
        p.setTelefono(rs.getString("telefono"));
        p.setCorreo(rs.getString("correo"));

        return c;
    }

    public boolean reactivarCliente(int idCliente) throws Exception {
        String sql = "UPDATE cliente SET activoCliente = 1 WHERE idCliente = ?";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = null;
        PreparedStatement pstmt = null;
        int rowsUpdated = 0;

        try {
            conn = connMySQL.open();
            pstmt = conn.prepareStatement(sql);
            pstmt.setInt(1, idCliente);
            rowsUpdated = pstmt.executeUpdate();
        } catch (SQLException e) {
            throw new Exception("Error al reactivar el cliente: " + e.getMessage());
        } finally {
            if (pstmt != null) try { pstmt.close(); } catch (SQLException e) {}
            if (conn != null) try { connMySQL.close(); } catch (SQLException e) {}
        }

        return rowsUpdated > 0;
    }

    public void insertarSubclientes(int idCliente, List<SubCliente> subclientes) throws Exception {
        String sql = "{CALL insertarSubcliente(?,?,?,?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        for (SubCliente subcliente : subclientes) {
            if (subcliente.getNombre() == null || subcliente.getUbicacion() == null) {
                continue;
            }
            CallableStatement cstmt = conn.prepareCall(sql);
            cstmt.setInt(1, idCliente);
            cstmt.setString(2, subcliente.getNombre());
            cstmt.setString(3, subcliente.getUbicacion());
            cstmt.registerOutParameter(4, Types.INTEGER);
            cstmt.execute();
            subcliente.setIdSubcliente(cstmt.getInt(4));
            cstmt.close();
        }

        connMySQL.close();
    }

    public void actualizarSubclientes(int idCliente, List<SubCliente> subclientes) throws Exception {
        String sqlInsert = "{CALL insertarSubcliente(?,?,?,?)}";
        String sqlUpdate = "{CALL actualizarSubcliente(?,?,?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        for (SubCliente subcliente : subclientes) {
            if (subcliente.getNombre() == null || subcliente.getUbicacion() == null) {
                continue;
            }
            if (subcliente.getIdSubcliente() > 0) {
                CallableStatement cstmt = conn.prepareCall(sqlUpdate);
                cstmt.setInt(1, subcliente.getIdSubcliente());
                cstmt.setString(2, subcliente.getNombre());
                cstmt.setString(3, subcliente.getUbicacion());
                cstmt.executeUpdate();
                cstmt.close();
            } else {
                CallableStatement cstmt = conn.prepareCall(sqlInsert);
                cstmt.setInt(1, idCliente);
                cstmt.setString(2, subcliente.getNombre());
                cstmt.setString(3, subcliente.getUbicacion());
                cstmt.registerOutParameter(4, Types.INTEGER);
                cstmt.execute();
                subcliente.setIdSubcliente(cstmt.getInt(4));
                cstmt.close();
            }
        }

        connMySQL.close();
    }

    public void eliminarSubcliente(int idSubcliente) throws Exception {
        String sql = "{CALL eliminarSubcliente(?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);
        cstmt.setInt(1, idSubcliente);
        cstmt.executeUpdate();
        cstmt.close();
        connMySQL.close();
    }

    public List<SubCliente> getSubclientes(int idCliente) throws Exception {
        List<SubCliente> subclientes = new ArrayList<>();
        String sql = "{CALL obtenerSubclientesPorCliente(?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);
        cstmt.setInt(1, idCliente);
        ResultSet rs = cstmt.executeQuery();

        while (rs.next()) {
            SubCliente sub = new SubCliente();
            sub.setIdSubcliente(rs.getInt("idSubcliente"));
            sub.setIdCliente(rs.getInt("idCliente"));
            sub.setNombre(rs.getString("nombre"));
            sub.setUbicacion(rs.getString("ubicacion"));
            sub.setActivoSubcliente(rs.getInt("activoSubcliente"));
            subclientes.add(sub);
        }

        rs.close();
        cstmt.close();
        connMySQL.close();
        return subclientes;
    }
}