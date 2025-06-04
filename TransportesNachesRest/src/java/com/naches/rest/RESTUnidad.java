package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.naches.controller.ControllerOperador;
import com.naches.controller.ControllerUnidad;
import com.naches.model.MantenimientoUnidad;
import com.naches.model.TipoGasto;
import com.naches.model.Unidad;
import com.naches.seguridad.JWTUtil;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("unidad")
public class RESTUnidad {

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
        ControllerUnidad cu = new ControllerUnidad();
        List<Unidad> unidad;

        try {

            unidad = cu.getAll();
            out = new Gson().toJson(unidad);

        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas de El Zarape."}                              
                  """;
        }

        return Response.ok(out).build();

    }

    @GET
    @Path("getAllVehiculo")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllVehiculo() {

        String out = null;

        ControllerUnidad cu = new ControllerUnidad();

        List<Unidad> vehiculos;

        try {
            vehiculos = cu.getAllVehiculo();
            out = new Gson().toJson(vehiculos);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = """
                  {"error":"Error interno del servidor, comunícate al área de sistemas"}
                  """;
        }

        return Response.ok(out).build();

    }

    @POST
    @Path("save")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response save(String datosUnidad, @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerUnidad cu = new ControllerUnidad();
        Unidad u;
        Gson gson = new Gson();

        try {

            u = gson.fromJson(datosUnidad, Unidad.class);

            if (u.getIdUnidad() < 1) {
                cu.insertarUnidad(u);
                out = """
                  {"result":"Registro agregado de forma correcta."}
                  """;
            } else {
                cu.actualizarUnidad(u);
                out = """
                  {"result":"Modificado eliminado de forma correcta."}
                  """;
            }

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

        return Response.ok(out).build();

    }

    @POST
    @Path("delete/{idUnidad}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("idUnidad") int idUnidad,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerUnidad cu = new ControllerUnidad();

        try {
            cu.deleteUnidad(idUnidad);
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

        return Response.ok(out).build();
    }

    @POST
    @Path("reactivar/{idUnidad}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response reactivarUnidad(@PathParam("idUnidad") int idUnidad,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerUnidad cu = new ControllerUnidad();

        try {
            // Verifica si el ID de operador es válido
            if (idUnidad <= 0) {
                out = "{\"error\":\"El ID de unidad no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            // Llama al servicio de reactivación de unidad
            boolean reactivado = cu.reactivarUnidad(idUnidad);

            if (reactivado) {
                out = "{\"result\":\"Unidad reactivada correctamente.\"}";
            } else {
                out = "{\"error\":\"No se pudo reactivar la unidad, verifique que el operador existe o ya está activo.\"}";
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas de El Zarape.\"}";
        }

        return Response.ok(out).build();
    }

    @POST
    @Path("registrarMantenimiento")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response registrarMantenimiento(String json, @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        Gson gson = new Gson();
        ControllerUnidad cu = new ControllerUnidad();

        try {
            MantenimientoUnidad m = gson.fromJson(json, MantenimientoUnidad.class);
            cu.registrarMantenimiento(m);
            out = """
                  {"result":"Mantenimiento registrado correctamente"}
                  """;
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"No se pudo registrar el mantenimiento"}
                  """;
        }

        return Response.ok(out).build();
    }

    @GET
    @Path("getMantenimientosPorUnidad/{idUnidad}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getMantenimientosPorUnidad(@PathParam("idUnidad") int idUnidad,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        ControllerUnidad cu = new ControllerUnidad();

        try {
            List<MantenimientoUnidad> lista = cu.getMantenimientosPorUnidad(idUnidad);
            out = new Gson().toJson(lista);
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"No se pudieron obtener los mantenimientos"}
                  """;
        }

        return Response.ok(out).build();
    }

    @GET
    @Path("getLatestKilometraje/{idUnidad}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLatestKilometraje(@PathParam("idUnidad") int idUnidad,
            @HeaderParam("Authorization") String authHeader) {

        // Validar token
        Response authResponse = validateToken(authHeader);
        if (authResponse != null) {
            return authResponse;
        }

        String out;
        Gson gson = new Gson();
        ControllerUnidad cu = new ControllerUnidad();

        try {
            if (idUnidad <= 0) {
                out = "{\"error\":\"El ID de unidad no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }
            int kmActual = cu.getLatestKilometraje(idUnidad);
            out = gson.toJson(kmActual);
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error":"No se pudo obtener el kilometraje, comunícate al área de sistemas de El Zarape."}
                  """;
        }

        return Response.ok(out).build();
    }

}
