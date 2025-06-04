package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerLogin;
import com.naches.model.Usuario;
import com.naches.seguridad.JWTUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("principal")
public class RESTLogin {

    @POST
    @Path("login")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON) // Expect JSON input
    public Response Resolver(String datosLog) throws Exception { // Remove @FormParam
        String out;
        ControllerLogin userLog = new ControllerLogin();
        Gson gson = new Gson();
        Usuario us;

        try {
            // Parse the JSON input into a Usuario object
            us = gson.fromJson(datosLog, Usuario.class);

            // Validate user credentials
            userLog.ValidarDatos(us);

            if (us.isIngreso()) {
                // Generate JWT token
                String token = JWTUtil.generateToken(us.getNombreUsuario(), us.getRol().toString());
                
                // Create response with token and user data
                String responseJson = String.format("{\"token\": \"%s\", \"usuario\": %s}", token, gson.toJson(us));
                
                return Response.status(Response.Status.OK)
                        .entity(responseJson)
                        .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                        .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                        .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                        .header("Access-Control-Allow-Credentials", "true")
                        .build();
            } else {
                out = "{\"error\": \"Usuario o contraseña incorrectos\"}";
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(out)
                        .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                        .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                        .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                        .header("Access-Control-Allow-Credentials", "true")
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            out = "{\"error\": \"Error interno del servidor\", \"message\": \"" + e.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(out)
                    .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                    .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Allow-Credentials", "true")
                    .build();
        }
    }

    @OPTIONS
    @Path("login")
    public Response handlePreflight() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }
}