package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import com.naches.controller.ControllerCaseta;
import com.naches.model.Caseta;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PathParam;

@Path("caseta")
public class RESTCaseta {
     
    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAll() {
        String out;
        ControllerCaseta cca = new ControllerCaseta();
        List<Caseta> ca;

        try {
            ca = cca.getAll();
            out = new Gson().toJson(ca);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas.\"}";
        }

        return Response.ok(out).build();
    }

    @POST
    @Path("save")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response save(String datosCaseta) {
        String out;
        ControllerCaseta cca = new ControllerCaseta();
        Caseta ca;
        Gson gson = new Gson();

        // Verificar los datos recibidos
        System.out.println("Datos de caseta: " + datosCaseta);

        try {
            ca = gson.fromJson(datosCaseta, Caseta.class);

            // Determinar si se realizará un INSERT o un UPDATE
            if (ca.getIdCaseta()< 1) {
                cca.insertarCaseta(ca); // Cambiado a insertEmpleados
            } else {
                cca.updateCaseta(ca);
            }

            // Convertir el objeto cliente a JSON para devolverlo con los IDs generados
            out = gson.toJson(ca);
        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = "{\"error\":\"El JSON recibido no es correcto.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas." + ex + "\"}";
        }

        return Response.ok(out).build();
    }
    
    @DELETE
    @Path("delete/{idCaseta}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("idCaseta") int idCaseta) {
        String out;
        ControllerCaseta cca = new ControllerCaseta();

        try {
            cca.deleteCaseta(idCaseta);
            out = "{\"message\":\"Caseta eliminada exitosamente\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor, comunícate al área de sistemas: " + ex.getMessage() + "\"}";
        }

        return Response.ok(out).build();
    }

}
