package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerGastoAnual;
import com.naches.model.GastoAnual;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("gastoAnual")
public class RESTGastoAnual {

    @POST
    @Path("insert")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response insert(String datosGastoAnual) {
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
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response update(String datosGastoAnual) {
        String out = null;
        ControllerGastoAnual controller = new ControllerGastoAnual();
        Gson gson = new Gson();

        try {
            GastoAnual gasto = gson.fromJson(datosGastoAnual, GastoAnual.class);
            if (gasto.getIdGastoAnual() < 1) {
                out = """
                      {"error":"ID de gasto anual inválido"}
                      """;
            } else {
                controller.actualizar(gasto);
                out = """
                      {"Correcto":"Gasto anual actualizado correctamente."}
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

    @POST
    @Path("delete")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@FormParam("idGastoAnual") int idGastoAnual) {
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
    public Response getAll() {
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