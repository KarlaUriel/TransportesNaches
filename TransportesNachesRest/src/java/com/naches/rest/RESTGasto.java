package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerNotaGasto;
import com.naches.model.Gasto;
import com.naches.model.TipoGas;
import com.naches.model.TipoGasto;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("gasto")
public class RESTGasto {
//
//    @GET
//    @Path("getAll")
//    @Produces(MediaType.APPLICATION_JSON)
//    public Response getAll(){
//        
//        String out = null;
//        
//        ControllerGasto cg = new ControllerGasto();
//        
//        List<Gasto> gastos;
//        
//        try {
//            gastos = cg.getAll();
//            out = new Gson().toJson(gastos);
//        } catch (Exception ex) {
//            ex.printStackTrace();
//            out = """
//                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
//                  """;
//        }
//        
//        return Response.ok(out)
//                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
//                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
//                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
//                .header("Access-Control-Allow-Credentials", "true")
//                .build();
//        
//    }
//    
    @GET
    @Path("getAllTipoGasto")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllTipoG(){
        
        String out = null;
        
        ControllerNotaGasto cg = new ControllerNotaGasto();
        
        List<TipoGasto> tipoGastos;
        
        try {
            tipoGastos = cg.getAllTipoGasto();
            out = new Gson().toJson(tipoGastos);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
                  """;
        }
        
        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
        
    }
//    
//    @GET
//    @Path("getAllTipoGas")
//    @Produces(MediaType.APPLICATION_JSON)
//    public Response getAllTipoGas(){
//        
//        String out = null;
//        
//        ControllerNotaGasto cg = new ControllerNotaGasto();
//        
//        List<TipoGas> tipoGas;
//        
//        try {
//            tipoGas = cg.getAllTipoGas();
//            out = new Gson().toJson(tipoGas);
//        } catch (Exception ex) {
//            ex.printStackTrace();
//            out = """
//                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
//                  """;
//        }
//        
//        return Response.ok(out)
//                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
//                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
//                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
//                .header("Access-Control-Allow-Credentials", "true")
//                .build();
//        
//    }
//    
//    @POST
//    @Path("save")
//    @Produces(MediaType.APPLICATION_JSON)
//    public Response save(@FormParam("datosGasto") @DefaultValue("") String datosGasto) throws Exception{
//        
//        String out = null;
//        ControllerGasto cg = new ControllerGasto();
//        Gson gson = new Gson();
//        Gasto gas;
//        
//        try {
//        
//            gas = gson.fromJson(datosGasto, Gasto.class);
//            
//            if (gas.getIdGasto() < 1) {
//                        cg.insertar(gas);
//                    } else {
//                        cg.insertar(gas);
//                    }
//            out = """
//                  {"Correcto":"Se guardo de manera exitosa en la base de datos."}
//                  """;
//             
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//        
//        return Response.ok(out)
//                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
//                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
//                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
//                .header("Access-Control-Allow-Credentials", "true")
//                .build();
//        
//    }
}
