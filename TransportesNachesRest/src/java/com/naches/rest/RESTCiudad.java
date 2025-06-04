package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.naches.controller.ControllerCiudad;
import com.naches.model.Ciudad;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("ciudad")
public class RESTCiudad {

    @GET
    @Path("getAllCiudades")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllCiudades(@QueryParam("query") String query) {
        String out = null;
        ControllerCiudad cci = new ControllerCiudad();
        List<Ciudad> ciudades = null;
        try {
            System.out.println("Parámetro query recibido: " + query); // Depuración
            ciudades = cci.getAllCiudades(query); // Pasar el parámetro query
            out = new Gson().toJson(ciudades);
            System.out.println("Respuesta enviada: " + out); // Depuración
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error" : "Error interno del Servidor, comunicate al area de Sistemas"}
                  """;
        }
        return Response.ok(out).build();
    }

    @POST
    @Path("save")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response save(String datosCiudad) {
        String out;
        ControllerCiudad cci = new ControllerCiudad();
        Ciudad ci;
        Gson gson = new Gson();

        // Verificar los datos recibidos
        System.out.println("Datos de ciudad: " + datosCiudad);

        try {
            ci = gson.fromJson(datosCiudad, Ciudad.class);

            // Determinar si se realizará un INSERT o un UPDATE
            if (ci.getIdCiudad() < 1) {
                cci.insertarCiudad(ci); // Cambiado a insertEmpleados
            } else {
                cci.updateCiudad(ci);
            }

            // Convertir el objeto cliente a JSON para devolverlo con los IDs generados
            out = gson.toJson(ci);
        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = "{\"error\":\"El JSON recibido no es correcto.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas." + ex + "\"}";
        }

        return Response.ok(out).build();
    }

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllCiudades() {
        String out = null;
        ControllerCiudad cci = new ControllerCiudad();
        List<Ciudad> ciudades = null;
        try {

            ciudades = cci.getAll();
            out = new Gson().toJson(ciudades);
        } catch (Exception e) {
            e.printStackTrace();
            out = """
                  {"error" : "Error interno del Servidor, comunicate al area de Sistemas"}
                  """;
        }
        return Response.ok(out).build();
    }

    @DELETE
    @Path("delete/{idCiudad}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteCiudad(@PathParam("idCiudad") int idCiudad) {
        String out;
        ControllerCiudad cci = new ControllerCiudad();

        try {
            // Verify the received ID
            System.out.println("ID de ciudad a eliminar: " + idCiudad);

            // Check if the ID is valid
            if (idCiudad < 1) {
                out = "{\"error\":\"El ID de la ciudad no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            // Call the controller to delete the city
            cci.deleteCiudad(idCiudad);

            // Return success message
            out = "{\"success\":\"Ciudad eliminada correctamente.\"}";
            return Response.ok(out).build();

        } catch (Exception e) {
            e.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas: " + e.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }
    }

}
