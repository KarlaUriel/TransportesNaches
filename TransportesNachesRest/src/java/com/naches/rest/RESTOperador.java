package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.naches.controller.ControllerLogin;
import com.naches.controller.ControllerOperador;
import com.naches.model.Operador;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("operador")
public class RESTOperador {

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getAll() {
        String out;
        ControllerOperador co = new ControllerOperador();
        List<Operador> operador;

        try {

            operador = co.getAll();
            out = new Gson().toJson(operador);

        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas de El Zarape."}                              
                  """;
        }

               return Response.status(Response.Status.OK)
                .entity(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();

    }

    @POST
    @Path("save")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response save(String datosOperador) {
        String out;
        ControllerOperador co = new ControllerOperador();
        Operador o;
        Gson gson = new Gson();

        try {

            o = gson.fromJson(datosOperador, Operador.class);

            if (o.getIdOperador() < 1) {
                co.insertarOperador(o);
            } else {
                co.actualizarOperador(o);
            }

            out = gson.toJson(o);

        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = """
                  {"error":"El JSON recibido no es correcto."}
                  """;
        } catch (Exception ex) {
            ex.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas de El Zarape.%s"}
                  """;
            out = String.format(out, ex);
        }

               return Response.status(Response.Status.OK)
                .entity(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();

    }

    @POST
    @Path("delete/{idOperador}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("idOperador") int idOperador) {
        String out;
        ControllerOperador co = new ControllerOperador();

        try {
            co.deleteOperador(idOperador);
            out = """
                  {"result":"Registro eliminado de forma correcta."}
                  """;
        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = """
                  {"error":"El JSON recibido no es correcto."}
                  """;
        } catch (Exception ex) {
            ex.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas de El Zarape."}
                  """;
        }

                return Response.status(Response.Status.OK)
                .entity(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @POST
    @Path("reactivar/{idOperador}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response reactivarOperador(@PathParam("idOperador") int idOperador) {
        String out;
        ControllerOperador cc = new ControllerOperador();

        try {
            // Verifica si el ID de operador es válido
            if (idOperador <= 0) {
                out = "{\"error\":\"El ID de operador no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            // Llama al servicio de reactivación de operador
            boolean reactivado = cc.reactivarOperador(idOperador);

            if (reactivado) {
                out = "{\"result\":\"Operador reactivado correctamente.\"}";
            } else {
                out = "{\"error\":\"No se pudo reactivar el operador, verifique que el operador existe o ya está activo.\"}";
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas de El Zarape.\"}";
        }

                return Response.status(Response.Status.OK)
                .entity(out)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }
    
    @OPTIONS
    @Path("operador")
    public Response handlePreflight() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }
}

