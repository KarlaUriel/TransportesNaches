//
//package com.naches.controller;
//
//import com.naches.model.Gasto;
//import com.naches.model.TipoGasto;
//import com.naches.db.ConexionMySQL;
//import com.naches.model.TipoGas;
//import java.sql.CallableStatement;
//import java.sql.Connection;
//import java.sql.PreparedStatement;
//import java.sql.ResultSet;
//import java.util.ArrayList;
//import java.util.List;
//
//public class ControllerGasto {
//
//    public void insertar(Gasto gasto) throws Exception{
//        
//        String sql = "{CALL insertarGasto(?,?,?,?,?,?,?,?)}"; 
//        
//        ConexionMySQL conexionMySQL = new ConexionMySQL();
//        Connection conn = conexionMySQL.open();
//        
//        CallableStatement csmt = conn.prepareCall(sql);
//        
//        csmt.setDouble(1, gasto.getCantidad());
//        csmt.setString(2, gasto.getNota());
//        csmt.setDouble(3, gasto.getSubTotal());
//        csmt.setDouble(4, gasto.getImporte());
//        csmt.setDouble(5, gasto.getTotal());
//        csmt.setString(6, gasto.getTipoGasto().getDescripcion());
//        
//        csmt.executeQuery();
//        
//        gasto.getTipoGasto().setIdTipoGasto(csmt.getInt(7));
//        gasto.setIdGasto(csmt.getInt(8));
//        
//        csmt.close();
//        conexionMySQL.close();
//        
//        
//    }
//    
//    public void update(Gasto gasto) throws Exception{
//        
//        String sql = "{CALL actualizarCliente(?, ?, ?, ?,?)}"; 
//        
//        ConexionMySQL conexionMySQL = new ConexionMySQL();
//        Connection conn = conexionMySQL.open();
//        
//        CallableStatement csmt = conn.prepareCall(sql);
//        
//        
//    }
//
//    public List<Gasto> getAll() throws Exception{
//        
//        List<Gasto> gastos = new ArrayList<>();
//        
//        String sql = "SELECT * FROM v_gasto"; 
//        
//        ConexionMySQL conexionMySQL = new ConexionMySQL();
//        Connection conn = conexionMySQL.open();
//        
//        PreparedStatement pstm = conn.prepareCall(sql);
//        
//        ResultSet rs = pstm.executeQuery();
//        
//        Gasto gas;
//        
//        while (rs.next()) {            
//            gas = fill(rs);
//            gastos.add(gas);
//        }
//        
//        rs.close();
//        pstm.close();
//        conexionMySQL.close();
//        
//        return gastos;
//        
//    }
//    
//    private Gasto fill(ResultSet rs) throws Exception{
//        
//        Gasto gas = new Gasto();
//        TipoGasto tg = new TipoGasto();
//        TipoGas tgas = new TipoGas();
//        
//        gas.setIdGasto(rs.getInt("idGasto"));
//        gas.setCantidad(rs.getDouble("cantidad"));
//        gas.setNota(rs.getString("nota"));
//        gas.setSubTotal(rs.getDouble("subTotal"));
//        gas.setImporte(rs.getDouble("importe"));
//        gas.setTotal(rs.getDouble("total"));
//        tg.setIdTipoGasto(rs.getInt("idTipoGasto"));
//        tg.setDescripcion(rs.getString("descripcion"));
//        tgas.setIdTipoGas(rs.getInt("idTipoGas"));
//        tgas.setNombreGas(rs.getString("nombreGas"));
//        gas.setTipoGasto(tg);
//        
//        gas.setTipoGasto(tg);
//        gas.setTipoGas(tgas);
//        
//        return gas;
//        
//    }
//public List<TipoGasto> getAllTipoGasto() throws Exception{
//        
//        List<TipoGasto> tipoGastos = new ArrayList<>();
//        
//        String sql = "SELECT * FROM tipoGasto"; 
//        
//        ConexionMySQL conexionMySQL = new ConexionMySQL();
//        Connection conn = conexionMySQL.open();
//        
//        PreparedStatement pstm = conn.prepareCall(sql);
//        
//        ResultSet rs = pstm.executeQuery();
//        
//        TipoGasto tipoG;
//        
//        while (rs.next()) {            
//            tipoG = fillTipoG(rs);
//            tipoGastos.add(tipoG);
//        }
//        
//        rs.close();
//        pstm.close();
//        conexionMySQL.close();
//        
//        return tipoGastos;
//        
//    }
//    
//    private TipoGasto fillTipoG(ResultSet rs) throws Exception{
//        
//        TipoGasto tg = new TipoGasto();
//        
//        tg.setIdTipoGasto(rs.getInt("idTipoGasto"));
//        tg.setDescripcion(rs.getString("descripcion"));
//  
//        return tg;
//        
//    }
// public List<TipoGas> getAllTipoGas() throws Exception{
//        
//        List<TipoGas> tipoGas = new ArrayList<>();
//        
//        String sql = "SELECT * FROM tipoGas"; 
//        
//        ConexionMySQL conexionMySQL = new ConexionMySQL();
//        Connection conn = conexionMySQL.open();
//        
//        PreparedStatement pstm = conn.prepareCall(sql);
//        
//        ResultSet rs = pstm.executeQuery();
//        
//        TipoGas tipoG;
//        
//        while (rs.next()) {            
//            tipoG = fillTipoGas(rs);
//            tipoGas.add(tipoG);
//        }
//        
//        rs.close();
//        pstm.close();
//        conexionMySQL.close();
//        
//        return tipoGas;
//        
//    }
//    
//    private TipoGas fillTipoGas(ResultSet rs) throws Exception{
//        
//        TipoGas tgas = new TipoGas();
//        
//        tgas.setIdTipoGas(rs.getInt("idTipoGas"));
//        tgas.setNombreGas(rs.getString("nombreGas"));
//  
//        return tgas;
//        
//    }
//    
//}
