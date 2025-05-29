package com.naches.controller;

import com.naches.db.ConexionMySQL;
import com.naches.model.*;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.io.InputStream;
import java.util.Properties;
import org.ehcache.Cache;
import org.ehcache.CacheManager;
import org.ehcache.config.Configuration;
import org.ehcache.config.builders.CacheManagerBuilder;
import org.ehcache.xml.XmlConfiguration;
import java.net.URL;

public class ControllerNotaGasto {

    // Utility to load application.properties
    private static class ConfigUtil {
        private static final Properties props = new Properties();

        static {
            try (InputStream input = ControllerNotaGasto.class.getResourceAsStream("/WEB-INF/application.properties")) {
                if (input != null) {
                    props.load(input);
                } else {
                    throw new RuntimeException("No se encontró application.properties en WEB-INF");
                }
            } catch (Exception e) {
                System.err.println("Error al cargar application.properties: " + e.getMessage());
            }
        }

        public static String getProperty(String key) {
            return props.getProperty(key);
        }
    }

    // EhCache configuration
    private static Cache<String, NotaGasto> notasCache;
    private static CacheManager cacheManager;

    static {
        // Commented out Redisson to avoid NoClassDefFoundError
        /*
        try {
            Config config = new Config();
            config.useSingleServer().setAddress("redis://127.0.0.1:6379");
            redissonClient = Redisson.create(config);
        } catch (Exception e) {
            e.printStackTrace();
        }
         */

        // Initialize EhCache
        try {
            String configPath = ConfigUtil.getProperty("ehcache.config.file");
            URL configUrl = ControllerNotaGasto.class.getResource(configPath);
            if (configUrl == null) {
                throw new RuntimeException("No se encontró ehcache.xml en " + configPath);
            }
            Configuration config = new XmlConfiguration(configUrl);
            cacheManager = CacheManagerBuilder.newCacheManager(config);
            cacheManager.init();
            notasCache = cacheManager.getCache("notasGasto", String.class, NotaGasto.class);
            System.out.println("EhCache inicializado correctamente");
        } catch (Exception e) {
            System.err.println("Error al inicializar EhCache: " + e.getMessage());
        }
    }

    // Method to close EhCache
    public static void closeCache() {
        if (cacheManager != null) {
            cacheManager.close();
            System.out.println("EhCache cerrado");
        }
    }

    public int iniciarNota(NotaGasto ng) throws Exception {
        String sql = "{CALL iniciarNotaGasto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);

        try {
            // Buscar el idCliente basado en el nombreCliente
            int idCliente = 0;
            String sqlCliente = "SELECT idCliente FROM cliente WHERE TRIM(nombreCliente) = TRIM(?) AND activoCliente = 1";
            try (PreparedStatement pstmt = conn.prepareStatement(sqlCliente)) {
                pstmt.setString(1, ng.getNombreCliente().trim());
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    idCliente = rs.getInt("idCliente");
                } else {
                    throw new Exception("No se encontró el cliente con nombre: " + ng.getNombreCliente());
                }
            }

            // Configurar los parámetros del procedimiento almacenado
            cstmt.setString(1, ng.getNombreOperador());
            cstmt.setString(2, ng.getNombreCliente());
            cstmt.setInt(3, idCliente);
            cstmt.setDate(4, ng.getFechaLlenado() != null ? new java.sql.Date(ng.getFechaLlenado().getTime()) : null);
            cstmt.setDate(5, ng.getFechaSalida() != null ? new java.sql.Date(ng.getFechaSalida().getTime()) : null);
            cstmt.setString(6, ng.getHoraSalida());
            cstmt.setString(7, ng.getOrigen());
            cstmt.setString(8, ng.getDestino());
            cstmt.setInt(9, ng.getIdUnidad());
            cstmt.setDouble(10, ng.getKmInicio());
            cstmt.setBoolean(11, ng.isGasolinaInicio());
            cstmt.setString(12, ng.getGasolinaLevel());
            cstmt.setBoolean(13, ng.isLlantasInicio());
            cstmt.setBoolean(14, ng.isAceiteInicio());
            cstmt.setBoolean(15, ng.isAnticongelanteInicio());
            cstmt.setBoolean(16, ng.isLiquidoFrenosInicio());
            cstmt.setString(17, ng.getComentarioEstado());
            cstmt.setInt(18, ng.getIdUsuario());
            cstmt.setString(19, ng.getFotoTablero());
            cstmt.setString(20, ng.getFotoOtraInicio());
            cstmt.registerOutParameter(21, Types.INTEGER);

            cstmt.execute();
            int idNota = cstmt.getInt(21);
            ng.setIdNota(idNota);

            // Insertar registro en contabilidadNota
            String sqlContabilidad = "INSERT INTO contabilidadN (idNota, estado, numeroFactura) VALUES (?, ?, ?)";
            try (PreparedStatement pstmt = conn.prepareStatement(sqlContabilidad)) {
                pstmt.setInt(1, idNota);
                pstmt.setString(2, "Pendiente");
                pstmt.setString(3, null);
                pstmt.executeUpdate();
            }

             if (notasCache != null) {
                notasCache.clear();
                System.out.println("Cache invalidado tras finalizarNota");
            }
            return idNota;
        } finally {
            cstmt.close();
            connMySQL.close();
        }
    }

    public void finalizarNota(NotaGasto ng) throws Exception {
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        try {
            // Finalizar la nota
            String sqlNota = "{CALL finalizarNotaGasto(?, ?, ?, ?, ?, ?, ?, ?)}";
            try (CallableStatement cstmt = conn.prepareCall(sqlNota)) {
                cstmt.setInt(1, ng.getIdNota());
                cstmt.setDate(2, ng.getFechaLlegada() != null ? new java.sql.Date(ng.getFechaLlegada().getTime()) : null);
                cstmt.setString(3, ng.getHoraLlegada());
                cstmt.setDouble(4, ng.getKmFinal());
                cstmt.setInt(5, ng.getNoEntrega());
                cstmt.setString(6, ng.getComentarioEstado());
                cstmt.setString(7, ng.getFotoAcuse());
                cstmt.setString(8, ng.getFotoOtraFin());
                cstmt.execute();
            }

            // Actualizar estado en contabilidadN
            String sqlUpdateEstado = "UPDATE contabilidadN SET estadoFact = 'Pendiente' WHERE idNota = ? AND idGasto IS NULL";
            try (PreparedStatement pstmt = conn.prepareStatement(sqlUpdateEstado)) {
                pstmt.setInt(1, ng.getIdNota());
                pstmt.executeUpdate();
            }

            // Agregar gastos
            String sqlGasto = "{CALL agregarGasto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
            for (Gasto gasto : ng.getGastos()) {
                int idTipoGasto = gasto.getTipoGasto().getIdTipoGasto();
                if (idTipoGasto <= 0) {
                    System.err.println("idTipoGasto is invalid (must be greater than 0) for Gasto with noGasto: " + gasto.getNoGasto());
                    continue;
                }
                try (CallableStatement cstmtGasto = conn.prepareCall(sqlGasto)) {
                    cstmtGasto.setInt(1, ng.getIdNota());
                    cstmtGasto.setInt(2, gasto.getNoGasto());
                    cstmtGasto.setDouble(3, gasto.getCantidad());
                    cstmtGasto.setInt(4, gasto.getTipoGasto().getIdTipoGasto());
                    cstmtGasto.setString(5, gasto.getDetalleCaseta());
                    cstmtGasto.setString(6, gasto.getTipoGas());
                    cstmtGasto.setDouble(7, gasto.getCostoUnitario());
                    cstmtGasto.setDouble(8, gasto.getSubTotal());
                    cstmtGasto.setDouble(9, gasto.getTotal());
                    cstmtGasto.setString(10, gasto.getTipoPago());
                    cstmtGasto.setDouble(11, gasto.getValorLitro());
                    cstmtGasto.execute();
                }
            }
             if (notasCache != null) {
                notasCache.clear();
                System.out.println("Cache invalidado tras finalizarNota");
            }
        } catch (SQLException e) {
            throw new Exception("Error executing stored procedures: " + e.getMessage(), e);
        } finally {
            connMySQL.close();
        }
    }


    public void updateContabilidad(Contabilidad ct) throws Exception {
        String sql = "{CALL update_contabilidadN(?, ?, ?, ?, ?, ?, ?, ?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);

        try {
            cstmt.setInt(1, ct.getIdNota());
            cstmt.setString(2, ct.getNumeroFactura() != null ? ct.getNumeroFactura() : "");
            cstmt.setDouble(3, ct.getManiobra());
            cstmt.setDouble(4, ct.getComision());
            cstmt.setString(5, ct.getEstadoFact() != null ? ct.getEstadoFact() : "Pendiente");
            cstmt.setDouble(6, ct.getPagoViaje());
            cstmt.setBoolean(7, ct.isPago());
            cstmt.setDate(8, ct.getFechaPago() != null ? new java.sql.Date(ct.getFechaPago().getTime()) : null);

            cstmt.execute();

            // Invalidate cache
            if (notasCache != null) {
                notasCache.clear();
                System.out.println("Cache invalidado tras updateContabilidad");
            }
        } catch (SQLException e) {
            throw new Exception("Error al actualizar contabilidad: " + e.getMessage(), e);
        } finally {
            try {
                if (cstmt != null) {
                    cstmt.close();
                }
                if (conn != null) {
                    connMySQL.close();
                }
            } catch (SQLException e) {
                throw new Exception("Error al cerrar recursos: " + e.getMessage(), e);
            }
        }
    }

    public List<NotaGasto> buscar(Integer idNota, String fechaInicio, String fechaFin) throws Exception {
        List<NotaGasto> notas = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
                "SELECT ng.idNota, ng.origen, ng.destino, ng.fechaLlenado, ng.fechaSalida, ng.fechaLlegada, "
                + "ng.horaSalida, ng.horaLlegada, ng.kmInicio, ng.kmFinal, ng.noEntrega, ng.gasolinaInicio, "
                + "ng.gasolinaLevel, ng.llantasInicio, ng.aceiteInicio, ng.anticongelanteInicio, ng.liquidoFrenosInicio, "
                + "ng.comentarioEstado, ng.fotoTablero, ng.fotoAcuse, ng.fotoOtraInicio, ng.fotoOtraFin, "
                + "c.numeroFactura, c.estadoFact, c.pagoViaje, c.comision, c.maniobra, c.fechaPago, c.pago, "
                + "ng.nombreOperador, cl.idCliente, cl.nombreCliente, cl.factura, u.idUnidad, u.tipoVehiculo, "
                + "u.rendimientoUnidad, u.activoUnidad "
                + "FROM notaGasto ng "
                + "LEFT JOIN contabilidadN c ON ng.idNota = c.idNota AND c.idGasto IS NULL "
                + "LEFT JOIN cliente cl ON ng.idCliente = cl.idCliente "
                + "LEFT JOIN unidad u ON ng.idUnidad = u.idUnidad "
                + "WHERE 1=1"
        );

        List<String> params = new ArrayList<>();
        if (idNota != null) {
            sql.append(" AND ng.idNota = ?");
            params.add(idNota.toString());
        }
        if (fechaInicio != null && fechaFin != null) {
            sql.append(" AND ng.fechaSalida BETWEEN ? AND ?");
            params.add(fechaInicio);
            params.add(fechaFin);
        }
        sql.append(" ORDER BY ng.idNota DESC");

        ConexionMySQL connMySQL = new ConexionMySQL();
        try (Connection conn = connMySQL.open(); PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setString(i + 1, params.get(i));
            }
            try (ResultSet rs = pstmt.executeQuery()) {
                Set<Integer> notaIds = new HashSet<>();
                while (rs.next()) {
                    int idNotaRs = rs.getInt("idNota");
                    if (notaIds.add(idNotaRs)) {
                        NotaGasto nota = fill(rs);
                        nota.setGastos(getGastosByNotaId(idNotaRs, conn));
                        notas.add(nota);
                    }
                }
            }
        } finally {
            connMySQL.close();
        }
        return notas;
    }

    public NotaGasto getById(int idNota) throws Exception {
        String sql = "SELECT ng.idNota, ng.origen, ng.destino, ng.fechaLlenado, ng.fechaSalida, ng.fechaLlegada, "
                + "ng.horaSalida, ng.horaLlegada, ng.kmInicio, ng.kmFinal, ng.noEntrega, ng.gasolinaInicio, "
                + "ng.gasolinaLevel, ng.llantasInicio, ng.aceiteInicio, ng.anticongelanteInicio, ng.liquidoFrenosInicio, "
                + "ng.comentarioEstado, ng.fotoTablero, ng.fotoAcuse, ng.fotoOtraInicio, ng.fotoOtraFin, "
                + "c.numeroFactura, c.estadoFact, c.pagoViaje, c.comision, c.maniobra, c.fechaPago, c.pago, "
                + "ng.nombreOperador, cl.idCliente, cl.nombreCliente, cl.factura, u.idUnidad, u.tipoVehiculo, "
                + "u.rendimientoUnidad, u.activoUnidad "
                + "FROM notaGasto ng "
                + "LEFT JOIN contabilidadN c ON ng.idNota = c.idNota AND c.idGasto IS NULL "
                + "LEFT JOIN cliente cl ON ng.idCliente = cl.idCliente "
                + "LEFT JOIN unidad u ON ng.idUnidad = u.idUnidad "
                + "WHERE ng.idNota = ? "
                + "ORDER BY ng.idNota";
        ConexionMySQL connMySQL = new ConexionMySQL();

        try (Connection conn = connMySQL.open(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, idNota);
            try (ResultSet rs = pstmt.executeQuery()) {
                NotaGasto nota = null;
                if (rs.next()) {
                    nota = fill(rs);
                    nota.setGastos(getGastosByNotaId(idNota, conn));
                }
                return nota;
            }
        } finally {
            connMySQL.close();
        }
    }

    public List<NotaGasto> getAll(int page, int size) throws Exception {
        String cacheKeyPrefix = "notasGasto-" + page + "-" + size + "-";
        List<NotaGasto> notas = new ArrayList<>();
        boolean cacheHit = true;

        if (notasCache != null) {
            // Try to retrieve from cache
            for (int i = 0; i < size; i++) {
                String key = cacheKeyPrefix + i;
                NotaGasto nota = notasCache.get(key);
                if (nota != null) {
                    notas.add(nota);
                } else {
                    cacheHit = false;
                    break;
                }
            }
            if (cacheHit && notas.size() == size) {
                System.out.println("Cache hit para page: " + page + ", size: " + size);
                return notas;
            }
        }
        System.out.println("Cache miss para page: " + page + ", size: " + size);

        // Fetch from database
        notas.clear();
        String sql = "SELECT ng.idNota, ng.origen, ng.destino, ng.fechaLlenado, ng.fechaSalida, ng.fechaLlegada, "
                + "ng.horaSalida, ng.horaLlegada, ng.kmInicio, ng.kmFinal, ng.noEntrega, ng.gasolinaInicio, "
                + "ng.gasolinaLevel, ng.llantasInicio, ng.aceiteInicio, ng.anticongelanteInicio, ng.liquidoFrenosInicio, "
                + "ng.comentarioEstado, ng.fotoTablero, ng.fotoAcuse, ng.fotoOtraInicio, ng.fotoOtraFin, "
                + "c.numeroFactura, c.estadoFact, c.pagoViaje, c.comision, c.maniobra, c.fechaPago, c.pago, "
                + "ng.nombreOperador, cl.idCliente, cl.nombreCliente, cl.factura, u.idUnidad, u.tipoVehiculo, "
                + "u.rendimientoUnidad, u.activoUnidad "
                + "FROM notaGasto ng "
                + "LEFT JOIN contabilidadN c ON ng.idNota = c.idNota AND c.idGasto IS NULL "
                + "LEFT JOIN cliente cl ON ng.idCliente = cl.idCliente "
                + "LEFT JOIN unidad u ON ng.idUnidad = u.idUnidad "
                + "ORDER BY ng.idNota DESC "
                + "LIMIT ? OFFSET ?";
        ConexionMySQL connMySQL = new ConexionMySQL();

        try (Connection conn = connMySQL.open(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, size);
            pstmt.setInt(2, page * size);
            try (ResultSet rs = pstmt.executeQuery()) {
                Set<Integer> notaIds = new HashSet<>();
                int index = 0;
                while (rs.next()) {
                    int idNota = rs.getInt("idNota");
                    if (notaIds.add(idNota)) {
                        NotaGasto nota = fill(rs);
                        nota.setGastos(getGastosByNotaId(idNota, conn));
                        notas.add(nota);
                        // Cache individual NotaGasto
                        if (notasCache != null) {
                            notasCache.put(cacheKeyPrefix + index, nota);
                        }
                        index++;
                    }
                }
            }
        } finally {
            connMySQL.close();
        }

        System.out.println("Almacenado en caché " + notas.size() + " notas para page: " + page + ", size: " + size);
        return notas;
    }

    public long countAll() throws Exception {
        String sql = "SELECT COUNT(*) FROM notaGasto";
        ConexionMySQL connMySQL = new ConexionMySQL();
        try (Connection conn = connMySQL.open(); PreparedStatement pstmt = conn.prepareStatement(sql); ResultSet rs = pstmt.executeQuery()) {
            if (rs.next()) {
                return rs.getLong(1);
            }
            return 0;
        } finally {
            connMySQL.close();
        }
    }

    public List<TipoGasto> getAllTipoGasto() throws Exception {
        List<TipoGasto> tipoGastos = new ArrayList<>();
        String sql = "SELECT * FROM tipoGasto";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        try (PreparedStatement pstmt = conn.prepareStatement(sql); ResultSet rs = pstmt.executeQuery()) {
            while (rs.next()) {
                TipoGasto tipoG = fillTipoG(rs);
                tipoGastos.add(tipoG);
            }
        } finally {
            conn.close();
            connMySQL.close();
        }
        return tipoGastos;
    }

    private TipoGasto fillTipoG(ResultSet rs) throws Exception {
        TipoGasto tg = new TipoGasto();
        tg.setIdTipoGasto(rs.getInt("idTipoGasto"));
        tg.setDescripcion(rs.getString("descripcion"));
        return tg;
    }

    public List<NotaGasto> getAllByUser(int idUsuario) throws Exception {
        List<NotaGasto> notas = new ArrayList<>();
        String sql = "SELECT ng.idNota, ng.origen, ng.destino, ng.fechaLlenado, ng.fechaSalida, ng.fechaLlegada, "
                + "ng.horaSalida, ng.horaLlegada, ng.kmInicio, ng.kmFinal, ng.noEntrega, ng.gasolinaInicio, "
                + "ng.gasolinaLevel, ng.llantasInicio, ng.aceiteInicio, ng.anticongelanteInicio, ng.liquidoFrenosInicio, "
                + "ng.comentarioEstado, ng.fotoTablero, ng.fotoAcuse, ng.fotoOtraInicio, ng.fotoOtraFin, "
                + "c.numeroFactura, c.estadoFact, c.pagoViaje, c.comision, c.maniobra, c.fechaPago, c.pago, "
                + "ng.nombreOperador, cl.idCliente, cl.nombreCliente, cl.factura, u.idUnidad, u.tipoVehiculo, "
                + "u.rendimientoUnidad, u.activoUnidad "
                + "FROM notaGasto ng "
                + "LEFT JOIN contabilidadN c ON ng.idNota = c.idNota AND c.idGasto IS NULL "
                + "LEFT JOIN cliente cl ON ng.idCliente = cl.idCliente "
                + "LEFT JOIN unidad u ON ng.idUnidad = u.idUnidad "
                + "WHERE ng.idUsuario = ? "
                + "ORDER BY ng.idNota";
        ConexionMySQL connMySQL = new ConexionMySQL();

        try (Connection conn = connMySQL.open(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, idUsuario);
            try (ResultSet rs = pstmt.executeQuery()) {
                Set<Integer> notaIds = new HashSet<>();
                while (rs.next()) {
                    int idNota = rs.getInt("idNota");
                    if (notaIds.add(idNota)) {
                        NotaGasto nota = fill(rs);
                        nota.setGastos(getGastosByNotaId(idNota, conn));
                        notas.add(nota);
                    }
                }
            }
        } finally {
            connMySQL.close();
        }
        return notas;
    }

    public void updateNumeroFactura(int idNota, String numeroFactura) throws Exception {
        String sql = "UPDATE contabilidadN SET numeroFactura = ? WHERE idNota = ? AND idGasto IS NULL";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, numeroFactura);
            pstmt.setInt(2, idNota);
            int rows = pstmt.executeUpdate();
            if (rows == 0) {
                throw new Exception("No se encontró la contabilidad para la nota con idNota: " + idNota);
            }

            // Invalidate cache
            if (notasCache != null) {
                notasCache.clear();
                System.out.println("Cache invalidado tras updateNumeroFactura");
            }
        } finally {
            connMySQL.close();
        }
    }

    private NotaGasto fill(ResultSet rs) throws Exception {
        NotaGasto ng = new NotaGasto();
        ng.setIdNota(rs.getInt("idNota"));
        ng.setOrigen(rs.getString("origen") != null ? rs.getString("origen") : "");
        ng.setDestino(rs.getString("destino") != null ? rs.getString("destino") : "");
        ng.setFechaLlenado(rs.getDate("fechaLlenado"));
        ng.setFechaSalida(rs.getDate("fechaSalida"));
        ng.setFechaLlegada(rs.getDate("fechaLlegada"));
        ng.setHoraSalida(rs.getString("horaSalida") != null ? rs.getString("horaSalida") : "");
        ng.setHoraLlegada(rs.getString("horaLlegada") != null ? rs.getString("horaLlegada") : "");
        ng.setKmInicio(rs.getDouble("kmInicio"));
        ng.setKmFinal(rs.getDouble("kmFinal"));
        ng.setNoEntrega(rs.getInt("noEntrega"));
        ng.setGasolinaInicio(rs.getBoolean("gasolinaInicio"));
        ng.setGasolinaLevel(rs.getString("gasolinaLevel") != null ? rs.getString("gasolinaLevel") : "");
        ng.setLlantasInicio(rs.getBoolean("llantasInicio"));
        ng.setAceiteInicio(rs.getBoolean("aceiteInicio"));
        ng.setAnticongelanteInicio(rs.getBoolean("anticongelanteInicio"));
        ng.setLiquidoFrenosInicio(rs.getBoolean("liquidoFrenosInicio"));
        ng.setComentarioEstado(rs.getString("comentarioEstado") != null ? rs.getString("comentarioEstado") : "");
        ng.setFotoTablero(rs.getString("fotoTablero") != null ? rs.getString("fotoTablero") : "");
        ng.setFotoAcuse(rs.getString("fotoAcuse") != null ? rs.getString("fotoAcuse") : "");
        ng.setFotoOtraInicio(rs.getString("fotoOtraInicio") != null ? rs.getString("fotoOtraInicio") : "");
        ng.setFotoOtraFin(rs.getString("fotoOtraFin") != null ? rs.getString("fotoOtraFin") : "");
        ng.setNumeroFactura(rs.getString("numeroFactura"));
        ng.setEstadoFact(rs.getString("estadoFact"));
        ng.setPagoViaje(rs.getDouble("pagoViaje"));
        ng.setComision(rs.getDouble("comision"));
        ng.setManiobra(rs.getDouble("maniobra"));
        ng.setFechaPago(rs.getDate("fechaPago"));
        ng.setPago(rs.getBoolean("pago"));
        ng.setNombreOperador(rs.getString("nombreOperador") != null ? rs.getString("nombreOperador") : "");

        Cliente cl = new Cliente();
        cl.setIdCliente(rs.getInt("idCliente"));
        cl.setNombreCliente(rs.getString("nombreCliente") != null ? rs.getString("nombreCliente") : "");
        cl.setFactura(rs.getInt("factura"));
        ng.setCliente(cl);

        Unidad un = new Unidad();
        un.setIdUnidad(rs.getInt("idUnidad"));
        un.setTipoVehiculo(rs.getString("tipoVehiculo") != null ? rs.getString("tipoVehiculo") : "");
        un.setRendimientoUnidad(rs.getDouble("rendimientoUnidad"));
        un.setActivoUnidad(rs.getInt("activoUnidad"));
        ng.setUnidad(un);

        return ng;
    }

    private List<Gasto> getGastosByNotaId(int idNota, Connection conn) throws SQLException {
        List<Gasto> gastos = new ArrayList<>();
        String sql = "SELECT idGasto, noGasto, cantidad, idTipoGasto, detalleCaseta, tipoGas, costoUnitario, subTotal, total, tipoPago, valorLitro, descripcionTipoGasto "
                + "FROM v_nota_gasto "
                + "WHERE idNota = ? AND idGasto IS NOT NULL";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, idNota);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Gasto gasto = new Gasto();
                    gasto.setIdGasto(rs.getInt("idGasto"));
                    gasto.setNoGasto(rs.getInt("noGasto"));
                    gasto.setCantidad(rs.getDouble("cantidad"));
                    TipoGasto tipoGasto = new TipoGasto();
                    tipoGasto.setIdTipoGasto(rs.getInt("idTipoGasto"));
                    tipoGasto.setDescripcion(rs.getString("descripcionTipoGasto") != null ? rs.getString("descripcionTipoGasto") : "");
                    gasto.setTipoGasto(tipoGasto);
                    gasto.setDetalleCaseta(rs.getString("detalleCaseta") != null ? rs.getString("detalleCaseta") : "");
                    gasto.setTipoGas(rs.getString("tipoGas") != null ? rs.getString("tipoGas") : "");
                    gasto.setCostoUnitario(rs.getDouble("costoUnitario"));
                    gasto.setSubTotal(rs.getDouble("subTotal"));
                    gasto.setTotal(rs.getDouble("total"));
                    gasto.setTipoPago(rs.getString("tipoPago") != null ? rs.getString("tipoPago") : "");
                    gasto.setValorLitro(rs.getDouble("valorLitro"));
                    gastos.add(gasto);
                }
            }
        }
        return gastos;
    }

    public List<NotaGasto> getNotasPendientes() throws SQLException, Exception {
        String sql = "{CALL getNotasPendientes()}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        var notas = new ArrayList<NotaGasto>();

        try (Connection conn = connMySQL.open(); CallableStatement cstmt = conn.prepareCall(sql); ResultSet rs = cstmt.executeQuery()) {
            while (rs.next()) {
                var nota = new NotaGasto();
                nota.setIdNota(rs.getInt("idNota"));
                nota.setFechaLlegada(rs.getDate("fechaLlegada"));
                nota.setEstadoFact(rs.getString("estadoFact"));
                notas.add(nota);
            }
        } finally {
            connMySQL.close();
        }
        return notas;
    }

    public void savePushSubscription(String token) throws SQLException, Exception {
        String sql = "INSERT INTO push_subscriptions (token) VALUES (?) ON DUPLICATE KEY UPDATE token = token";
        ConexionMySQL connMySQL = new ConexionMySQL();

        try (Connection conn = connMySQL.open(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, token);
            pstmt.executeUpdate();
        } finally {
            connMySQL.close();
        }
    }

    public void deleteNotaGasto(int idNota) throws Exception {
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();

        try {
            String sql = "{CALL sp_EliminarNotaGasto(?)}";
            try (CallableStatement cstmt = conn.prepareCall(sql)) {
                cstmt.setInt(1, idNota);
                cstmt.execute();
            }

            // Invalidate cache
            if (notasCache != null) {
                notasCache.clear();
                System.out.println("Cache invalidado tras deleteNotaGasto");
            }
        } catch (SQLException e) {
            throw new Exception("Error al eliminar la nota: " + e.getMessage(), e);
        } finally {
            connMySQL.close();
        }
    }

    public void updateGeneralInfo(NotaGasto ng) throws Exception {
        String sql = "{CALL update_nota_gasto_general(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        ConexionMySQL connMySQL = new ConexionMySQL();
        Connection conn = connMySQL.open();
        CallableStatement cstmt = conn.prepareCall(sql);

        try {
            // Fetch existing note to get fields not sent by frontend
            NotaGasto existingNota = getById(ng.getIdNota());
            if (existingNota == null) {
                throw new Exception("Nota con idNota: " + ng.getIdNota() + " no encontrada");
            }

            // Look up idCliente based on nombreCliente
            String nombreCliente = ng.getNombreCliente() != null ? ng.getCliente().getNombreCliente() : "";
            int idCliente = 0;
            if (nombreCliente != null && !nombreCliente.trim().isEmpty()) {
                String sqlCliente = "SELECT idCliente FROM cliente WHERE TRIM(nombreCliente) = TRIM(?) AND activoCliente = 1";
                try (PreparedStatement pstmt = conn.prepareStatement(sqlCliente)) {
                    pstmt.setString(1, nombreCliente.trim());
                    ResultSet rs = pstmt.executeQuery();
                    if (rs.next()) {
                        idCliente = rs.getInt("idCliente");
                    } else {
                        throw new Exception("No se encontró el cliente con nombre: " + nombreCliente);
                    }
                }
            } else {
                idCliente = 1;
            }

            // Debug logging
            System.out.println("Updating notaGasto with idNota: " + ng.getIdNota());
            System.out.println("nombreCliente: " + nombreCliente + ", idCliente: " + idCliente);
            System.out.println("nombreOperador: " + (ng.getOperador() != null ? ng.getOperador().getNombreOperador() : "null"));
            System.out.println("tipoVehiculo: " + (ng.getUnidad() != null ? ng.getUnidad().getTipoVehiculo() : "null"));

            cstmt.setInt(1, ng.getIdNota());
            cstmt.setString(2, ng.getOperador() != null ? ng.getOperador().getNombreOperador() : null);
            cstmt.setString(3, ng.getCliente() != null ? ng.getCliente().getNombreCliente() : null);
            cstmt.setString(4, ng.getUnidad() != null ? ng.getUnidad().getTipoVehiculo() : null);
            String ruta = (ng.getOrigen() != null && ng.getDestino() != null)
                    ? ng.getOrigen() + " - " + ng.getDestino()
                    : (ng.getOrigen() != null ? ng.getOrigen() : ng.getDestino() != null ? ng.getDestino() : "");
            cstmt.setString(5, ruta.isEmpty() ? null : ruta);
            cstmt.setInt(6, ng.getNoEntrega());
            cstmt.setDate(7, ng.getFechaSalida() != null ? new java.sql.Date(ng.getFechaSalida().getTime()) : null);
            cstmt.setString(8, ng.getHoraSalida());
            cstmt.setDate(9, ng.getFechaLlegada() != null ? new java.sql.Date(ng.getFechaLlegada().getTime()) : null);
            cstmt.setString(10, ng.getHoraLlegada());
            cstmt.setDouble(11, ng.getKmInicio());
            cstmt.setDouble(12, ng.getKmFinal());
            cstmt.setBoolean(13, ng.isGasolinaInicio());
            cstmt.setString(14, existingNota.getGasolinaLevel() != null ? existingNota.getGasolinaLevel() : null);
            cstmt.setBoolean(15, existingNota.isLlantasInicio());
            cstmt.setBoolean(16, existingNota.isAceiteInicio());
            cstmt.setBoolean(17, existingNota.isAnticongelanteInicio());
            cstmt.setBoolean(18, existingNota.isLiquidoFrenosInicio());
            cstmt.setString(19, ng.getComentarioEstado());

            cstmt.execute();

            // Invalidate cache
            if (notasCache != null) {
                notasCache.clear();
                System.out.println("Cache invalidado tras updateGeneralInfo");
            }
        } catch (SQLException e) {
            throw new Exception("Error al actualizar información general: " + e.getMessage(), e);
        } finally {
            cstmt.close();
            connMySQL.close();
        }
    }
}