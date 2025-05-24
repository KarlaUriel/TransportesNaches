package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerLogin;
import com.naches.model.Usuario;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import java.sql.SQLException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;


@Path("principal")
public class RESTLogin {

 @POST
@Path("login")
@Produces(MediaType.APPLICATION_JSON)
public Response Resolver(@FormParam("datosLog") @DefaultValue("") String datosLog) throws Exception {
    String out;
    ControllerLogin userLog = new ControllerLogin();
    Gson gson = new Gson();
    Usuario us = gson.fromJson(datosLog, Usuario.class);

    try {
        userLog.ValidarDatos(us);

        if (us.isIngreso()) {
            out = gson.toJson(us);
            return Response.status(Response.Status.OK)
                    .entity(out)
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
 // ✅ Este método permite responder al preflight OPTIONS
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
