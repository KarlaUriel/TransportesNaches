package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.naches.controller.ControllerNotaGasto;
import com.naches.controller.ControllerUnidad;
import com.naches.model.Contabilidad;
import com.naches.model.NotaGasto;
import com.naches.model.PushSubscription;
import com.naches.model.Unidad;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.sql.SQLException;

/**
 *
 * @author karla
 */
@Path("nota")
public class RESTNotaGasto {

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAll() {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();
        List<NotaGasto> notas;

        try {
            notas = cng.getAll();
            out = new Gson().toJson(notas);
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas de El Zarape."}                              
                  """;
        }

        return Response.ok(out).build();
    }

    @POST
    @Path("iniciarViaje")
    @Produces(MediaType.APPLICATION_JSON)
    public Response iniciarViaje(@FormParam("datosNota") @DefaultValue("") String datosNota) {
        String out;
        Gson gson = new Gson();
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            System.out.println("=== DATOS RECIBIDOS EN iniciarViaje ===");
            System.out.println(datosNota); // Aquí imprime lo que llega

            NotaGasto ng = gson.fromJson(datosNota, NotaGasto.class);
            int idNota = cng.iniciarNota(ng); // Capturar el idNota devuelto
            out = String.format("{\"result\":\"Viaje iniciado correctamente.\", \"idNota\":%d}", idNota);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"Error interno: %s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }

    @POST
    @Path("finalizarViaje")
    @Produces(MediaType.APPLICATION_JSON)
    public Response finalizarViaje(@FormParam("datosNota") @DefaultValue("") String datosNota) {
        String out;
        Gson gson = new Gson();
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            NotaGasto ng = gson.fromJson(datosNota, NotaGasto.class);
            cng.finalizarNota(ng);
            out = "{\"result\":\"Viaje finalizado correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }

    @POST
    @Path("buscar")
    @Produces(MediaType.APPLICATION_JSON)
    public Response buscar(
            @FormParam("idNota") @DefaultValue("") String idNotaStr
    ) {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            Integer idNota = idNotaStr.isEmpty() ? null : Integer.parseInt(idNotaStr);
            List<NotaGasto> result = cng.buscar(idNota);
            out = new Gson().toJson(result);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }

    @GET
    @Path("getById")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getById(@QueryParam("idNota") @DefaultValue("0") int idNota) {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            NotaGasto nota = cng.getById(idNota);
            out = new Gson().toJson(nota);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }

    @GET
    @Path("getAllByUser")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllByUser(@QueryParam("idUsuario") int idUsuario) {
        try {
            ControllerNotaGasto controller = new ControllerNotaGasto();
            List<NotaGasto> notas = controller.getAllByUser(idUsuario);
            String json = new Gson().toJson(notas);
            return Response.ok(json).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"Error al obtener las notas: " + e.getMessage() + "\"}")
                    .build();
        }
    }

    @PUT
    @Path("updateContabilidad")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateContabilidad(@FormParam("datosNota") @DefaultValue("") String datosNota) {
        String out;
        Gson gson = new Gson();
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            System.out.println("=== DATOS RECIBIDOS EN updateContabilidad ===");
            System.out.println(datosNota); // Imprimir los datos recibidos para depuración

            Contabilidad ct = gson.fromJson(datosNota, Contabilidad.class);
            cng.updateContabilidad(ct);
            out = "{\"result\":\"Datos de contabilidad actualizados correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }

    @GET
    @Path("getNotasPendientes")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getNotasPendientes() throws Exception {
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            List<NotaGasto> notas = cng.getNotasPendientes();
            return Response.ok(notas).build();
        } catch (SQLException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error al obtener notas pendientes: " + e.getMessage()).build();
        }
    }

    @POST
    @Path("/savePushSubscription")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response savePushSubscription(PushSubscription subscription) throws Exception {
        ControllerNotaGasto ntg = new ControllerNotaGasto();
        try {
            ntg.savePushSubscription(subscription.getToken());
            return Response.ok().build();
        } catch (SQLException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error al guardar suscripción: " + e.getMessage()).build();
        }
    }

    @POST
    @Path("delete")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteNotaPost(@FormParam("idNota") @DefaultValue("0") int idNota) {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            if (idNota <= 0) {
                out = "{\"error\":\"El idNota debe ser un número válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            cng.deleteNotaGasto(idNota);
            out = "{\"result\":\"Nota eliminada correctamente.\"}";
            return Response.ok(out).build();
        } catch (Exception e) {
            e.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }
    }
    
    
    @PUT
@Path("updateGeneralInfo")
@Produces(MediaType.APPLICATION_JSON)
public Response updateGeneralInfo(@FormParam("datosNota") @DefaultValue("") String datosNota) {
    String out;
    Gson gson = new Gson();
    ControllerNotaGasto cng = new ControllerNotaGasto();

    try {
        System.out.println("=== DATOS RECIBIDOS EN updateGeneralInfo ===");
        System.out.println(datosNota); // Imprimir los datos recibidos para depuración

        NotaGasto ng = gson.fromJson(datosNota, NotaGasto.class);
        // Update the note with the new general information
        // Note: You'll need to implement logic in ControllerNotaGasto to update these fields
        cng.updateGeneralInfo(ng); // Add this method to ControllerNotaGasto
        out = "{\"result\":\"Información general actualizada correctamente.\"}";
    } catch (Exception ex) {
        ex.printStackTrace();
        out = String.format("{\"error\":\"%s\"}", ex.getMessage());
    }

    return Response.ok(out).build();
}

}
