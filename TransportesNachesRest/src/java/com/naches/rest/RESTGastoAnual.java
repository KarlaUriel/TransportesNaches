package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerGastoAnual;
import com.naches.model.GastoAnual;
import com.naches.seguridad.JWTUtil;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("gastoAnual")
public class RESTGastoAnual {

    // Método para verificar el token en el encabezado Authorization
    private Response validateToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Token no proporcionado o inválido.\"}")
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }

        String token = authHeader.substring("Bearer ".length()).trim();
        if (!JWTUtil.validateToken(token)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Token inválido o expirado.\"}")
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }

        return null; // Token válido, continuar con la solicitud
    }

    @POST
    @Path("insert")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response insert(String datosGastoAnual, @HeaderParam("Authorization") String authHeader) {
        
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        
        String out = null;
        ControllerGastoAnual controller = new ControllerGastoAnual();
        Gson gson = new Gson();

        try {
            GastoAnual gasto = gson.fromJson(datosGastoAnual, GastoAnual.class);
            controller.insertar(gasto);
            out = """
                  {"Correcto":"Gasto anual guardado correctamente."}
                  """;
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
                  """;
        }

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @PUT
    @Path("update")
    @Produces(MediaType.APPLICATION_JSON)
    public Response update(@FormParam("datosGastoAnual") @DefaultValue("") String datosGastoAnual,
            @HeaderParam("Authorization") String authHeader) {
        
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        
        String out;
        ControllerGastoAnual controller = new ControllerGastoAnual();
        Gson gson = new Gson();

        System.out.println("Los datos llegados del servidor: " + datosGastoAnual);

        try {
            GastoAnual gasto = gson.fromJson(datosGastoAnual, GastoAnual.class);
            controller.actualizar(gasto);

        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
                  """;
            System.out.println(e);
        }

        out = """
                  {"success":"Actualizado correctamente."}
                  """;

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();

    }

    @POST
    @Path("delete")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@FormParam("idGastoAnual") int idGastoAnual, @HeaderParam("Authorization") String authHeader) {
        
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        
        String out = null;
        ControllerGastoAnual controller = new ControllerGastoAnual();

        try {
            if (idGastoAnual < 1) {
                out = """
                      {"error":"ID de gasto anual inválido"}
                      """;
            } else {
                controller.eliminar(idGastoAnual);
                out = """
                      {"Correcto":"Gasto anual eliminado correctamente."}
                      """;
            }
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
                  """;
        }

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAll(@HeaderParam("Authorization") String authHeader) {
        
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        
        String out = null;
        ControllerGastoAnual controller = new ControllerGastoAnual();

        try {
            List<GastoAnual> gastos = controller.getAll();
            out = new Gson().toJson(gastos);
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
                  """;
        }

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }
}
