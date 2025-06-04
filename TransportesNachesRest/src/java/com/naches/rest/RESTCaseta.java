package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.naches.controller.ControllerCaseta;
import com.naches.model.Caseta;
import com.naches.seguridad.JWTUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("caseta")
public class RESTCaseta {

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

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAll(@HeaderParam("Authorization") String authHeader) {
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerCaseta cca = new ControllerCaseta();
        List<Caseta> ca;

        try {
            ca = cca.getAll();
            out = new Gson().toJson(ca);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas.\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(out)
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @POST
    @Path("save")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response save(String datosCaseta, @HeaderParam("Authorization") String authHeader) {
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerCaseta cca = new ControllerCaseta();
        Caseta ca;
        Gson gson = new Gson();

        try {
            ca = gson.fromJson(datosCaseta, Caseta.class);

            // Determinar si se realizará un INSERT o un UPDATE
            if (ca.getIdCaseta() < 1) {
                cca.insertarCaseta(ca);
            } else {
                cca.updateCaseta(ca);
            }

            out = gson.toJson(ca);
        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = "{\"error\":\"El JSON recibido no es correcto.\"}";
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(out)
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(out)
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @DELETE
    @Path("delete/{idCaseta}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("idCaseta") int idCaseta, @HeaderParam("Authorization") String authHeader) {
        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        // Opcional: Verificar si el usuario tiene el rol adecuado (por ejemplo, ADMIN)
        String token = authHeader.substring("Bearer ".length()).trim();
        String rol = JWTUtil.getRolFromToken(token);
        if (!"Administrador".equals(rol)) { // Ejemplo: Solo ADMIN puede eliminar
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\":\"No tienes permisos para realizar esta acción.\"}")
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }

        String out;
        ControllerCaseta cca = new ControllerCaseta();

        try {
            cca.deleteCaseta(idCaseta);
            out = "{\"message\":\"Caseta eliminada exitosamente\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(out)
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }

        return Response.ok(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @OPTIONS
    @Path("{path : .*}")
    public Response handlePreflight() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }
}