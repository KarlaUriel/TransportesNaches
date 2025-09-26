package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.naches.controller.ControllerNotaGasto;
import com.naches.model.Contabilidad;
import com.naches.model.Gasto;
import com.naches.model.NotaGasto;
import com.naches.model.NotaGastoResponse;
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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.lang.reflect.Type;
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
    public Response getAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("year") Integer year,
            @QueryParam("month") Integer month,
            @QueryParam("operator") String operator,
            @QueryParam("weekStart") String weekStart,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerNotaGasto cng = new ControllerNotaGasto();
        try {
            // Use the updated getAll method that returns NotaGastoResponse
            NotaGastoResponse notaGastoResponse = cng.getAll(page, size, year, month, operator, weekStart);

            // Build the response map
            Map<String, Object> response = new HashMap<>();
            response.put("content", notaGastoResponse.getContent());
            response.put("totalElements", notaGastoResponse.getTotalElements());
            response.put("totalPages", (int) Math.ceil((double) notaGastoResponse.getTotalElements() / size));
            response.put("pageNumber", page);
            response.put("pageSize", size);
            response.put("financialSummary", notaGastoResponse.getFinancialSummary());

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
    public Response iniciarViaje(@FormParam("datosNota") @DefaultValue("") String datosNota,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
    public Response finalizarViaje(@FormParam("datosNota") @DefaultValue("") String datosNota,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
            @FormParam("fechaFin") String fechaFin,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
    public Response getById(@QueryParam("idNota") @DefaultValue("0") int idNota,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
    public Response getAllByUser(@QueryParam("idUsuario") int idUsuario,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
    public Response updateContabilidad(@FormParam("datosNota") @DefaultValue("") String datosNota,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
    public Response getNotasPendientes(@HeaderParam("Authorization") String authHeader) throws Exception {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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
    public Response updateGeneralInfo(@FormParam("datosNota") @DefaultValue(" ") String datosNota,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        Gson gson = new Gson();
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            NotaGasto ng = gson.fromJson(datosNota, NotaGasto.class);
            cng.updateGeneralInfo(ng);
            return Response.ok("Información general actualizada correctamente").build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error al actualizar información general: " + e.getMessage())
                    .build();
        }

    }

    @POST
    @Path("delete")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteNota(@FormParam("idNota") String idNotaStr,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

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

    @PUT
    @Path("updateGastos")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateGastos(@FormParam("idNota") int idNota,
            @FormParam("gastos") @DefaultValue("[]") String gastosJson,
            @HeaderParam("Authorization") String authHeader) {
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        Gson gson = new Gson();
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            System.out.println("=== DATOS RECIBIDOS EN updateGastos ===");
            System.out.println("idNota: " + idNota);
            System.out.println("gastos: " + gastosJson);

            // Deserializar la lista de gastos desde el JSON
            Type listType = new TypeToken<List<Gasto>>() {
            }.getType();
            List<Gasto> gastos = gson.fromJson(gastosJson, listType);

            // Validar que la lista de gastos no esté vacía
            if (gastos == null || gastos.isEmpty()) {
                out = "{\"error\":\"La lista de gastos está vacía o es inválida.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            // Llamar al método updateGastos del controlador
            cng.updateGastos(idNota, gastos);
            out = "{\"result\":\"Gastos actualizados correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"Error al actualizar gastos: %s\"}", ex.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return Response.ok(out).build();
    }

    @PUT
    @Path("updatePhotos")
    @Produces(MediaType.APPLICATION_JSON)
    public Response updatePhotos(@FormParam("idNota") int idNota,
            @FormParam("photos") @DefaultValue("{}") String photosJson,
            @HeaderParam("Authorization") String authHeader) {
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        Gson gson = new Gson();
        ControllerNotaGasto cng = new ControllerNotaGasto();

        try {
            System.out.println("=== DATOS RECIBIDOS EN updatePhotos ===");
            System.out.println("idNota: " + idNota);
            System.out.println("photos: " + photosJson);

            Type mapType = new TypeToken<Map<String, String>>() {
            }.getType();
            Map<String, String> photos = gson.fromJson(photosJson, mapType);
            cng.updatePhotos(idNota, photos);
            out = "{\"result\":\"Fotos actualizadas correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = String.format("{\"error\":\"%s\"}", ex.getMessage());
        }

        return Response.ok(out).build();
    }

}
