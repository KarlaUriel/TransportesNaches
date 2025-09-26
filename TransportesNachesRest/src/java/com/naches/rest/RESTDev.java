package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerDesarrollador;
import com.naches.model.Formula;
import com.naches.seguridad.JWTUtil;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("dev")
public class RESTDev {

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

    @GET
    @Path("getAllFormula")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllFormula(@HeaderParam("Authorization") String authHeader) {

        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerDesarrollador cd = new ControllerDesarrollador();
        List<Formula> formulas;

        try {
            formulas = cd.getAll();
            out = new Gson().toJson(formulas);
        } catch (Exception e) {
            e.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + e.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return Response.ok(out).build();

    }

    @POST
    @Path("saveFormula")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response saveFormulas(String datosFormula,
            @HeaderParam("Authorization") String authHeader) {

        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerDesarrollador cd = new ControllerDesarrollador();
        Formula f;
        Gson gson = new Gson();
        
        try {
            f = gson.fromJson(datosFormula, Formula.class);
            
            cd.insertarFormula(f);
            
            out = gson.toJson(f);
            
        } catch (Exception e) {
            e.printStackTrace();
            out = "{\"error\":\"El JSON recibido no es correcto.\"}";
            return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
        }
        
        return Response.ok(out).build();
    }

}
