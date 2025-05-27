package com.naches.rest;

import com.google.gson.Gson;
import com.naches.controller.ControllerNotaGasto;
import com.naches.model.Contabilidad;
import com.naches.model.NotaGasto;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
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
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 *
 * @author karla
 */
@Path("nota")
public class RESTNotaGasto {

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAll(@QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();
        try {
            List<NotaGasto> notas = cng.getAll(page, size);
            long totalElements = cng.countAll(); // Add method to count total notes
            Map<String, Object> response = new HashMap<>();
            response.put("content", notas);
            response.put("totalElements", totalElements);
            response.put("totalPages", (int) Math.ceil((double) totalElements / size));
            response.put("pageNumber", page);
            response.put("pageSize", size);
            out = new Gson().toJson(response);
        } catch (Exception e) {
            e.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas de El Zarape.\"}";
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
    public Response buscar(@FormParam("idNota") String idNotaStr,
            @FormParam("fechaInicio") String fechaInicio,
            @FormParam("fechaFin") String fechaFin) {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();
        try {
            Integer idNota = idNotaStr != null && !idNotaStr.isEmpty() ? Integer.parseInt(idNotaStr) : null;
            List<NotaGasto> result = cng.buscar(idNota, fechaInicio, fechaFin);
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
            cng.updateGeneralInfo(ng);
            out = "{\"result\":\"Información general actualizada correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }
    
    
    @POST
    @Path("delete")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteNota(@FormParam("idNota") String idNotaStr) {
        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            if (idNotaStr == null || idNotaStr.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\":\"El parámetro idNota es requerido.\"}").build();
            }
            int idNota = Integer.parseInt(idNotaStr);
            cng.deleteNotaGasto(idNota);
            out = "{\"result\":\"Nota eliminada correctamente.\"}";
        } catch (NumberFormatException ex) {
            ex.printStackTrace();
            out = "{\"error\":\"El idNota debe ser un número válido.\"}";
            return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"Error al eliminar la nota: %s\"}", ex.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return Response.ok(out).build();
    }

    
}
