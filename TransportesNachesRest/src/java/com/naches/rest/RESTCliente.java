package com.naches.rest;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import com.naches.controller.ControllerCliente;
import com.naches.model.Cliente;
import com.naches.model.SubCliente;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;

@Path("cliente")
public class RESTCliente {

    private Response buildResponse(String output) {
        return Response.ok(output)
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    private Response buildPreflightResponse() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "https://transportesnaches.com.mx")
                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    @POST
    @Path("save")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response save(String datosCliente) {
        String out;
        ControllerCliente cc = new ControllerCliente();
        Cliente c;
        Gson gson = new Gson();

        try {
            c = gson.fromJson(datosCliente, Cliente.class);

            // Validar datos básicos
            if (c == null || c.getPersona() == null || c.getPersona().getNombre() == null) {
                out = "{\"error\":\"Los datos del cliente son inválidos.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            // Determinar si es INSERT o UPDATE
            if (c.getIdCliente() < 1) {
                cc.insertarCliente(c);
            } else {
                cc.updateCliente(c);
            }

            out = gson.toJson(c);
        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = "{\"error\":\"El JSON recibido no es correcto.\"}";
            return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("save")
    public Response handlePreflightSave() {
        return buildPreflightResponse();
    }

    @POST
    @Path("delete/{idCliente}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("idCliente") int idCliente) {
        String out;
        ControllerCliente cc = new ControllerCliente();

        try {
            if (idCliente <= 0) {
                out = "{\"error\":\"El ID de cliente no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            cc.deleteCliente(idCliente);
            out = "{\"result\":\"Cliente desactivado correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("delete/{idCliente}")
    public Response handlePreflightDelete() {
        return buildPreflightResponse();
    }

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getAll() {
        String out;
        ControllerCliente cc = new ControllerCliente();
        List<Cliente> clientes;

        try {
            clientes = cc.getAll();
            out = new Gson().toJson(clientes);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("getAll")
    public Response handlePreflightGetAll() {
        return buildPreflightResponse();
    }

    @POST
    @Path("reactivar/{idCliente}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response reactivarCliente(@PathParam("idCliente") int idCliente) {
        String out;
        ControllerCliente cc = new ControllerCliente();

        try {
            if (idCliente <= 0) {
                out = "{\"error\":\"El ID de cliente no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            boolean reactivado = cc.reactivarCliente(idCliente);
            if (reactivado) {
                out = "{\"result\":\"Cliente reactivado correctamente.\"}";
            } else {
                out = "{\"error\":\"No se pudo reactivar el cliente.\"}";
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("reactivar/{idCliente}")
    public Response handlePreflightReactivar() {
        return buildPreflightResponse();
    }

    @POST
    @Path("saveSubclients/{idCliente}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response saveSubclients(@PathParam("idCliente") int idCliente, String datosSubclientes) {
        String out;
        ControllerCliente cc = new ControllerCliente();
        Gson gson = new Gson();

        try {
            if (idCliente <= 0) {
                out = "{\"error\":\"El ID de cliente no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            // Deserializar la lista de subclientes
            Type listType = new TypeToken<List<SubCliente>>(){}.getType();
            List<SubCliente> subclientes = gson.fromJson(datosSubclientes, listType);

            if (subclientes == null || subclientes.isEmpty()) {
                out = "{\"result\":\"No se proporcionaron subclientes.\"}";
                return buildResponse(out);
            }

            cc.actualizarSubclientes(idCliente, subclientes);
            out = "{\"result\":\"Subclientes guardados correctamente.\"}";
        } catch (JsonParseException jpe) {
            jpe.printStackTrace();
            out = "{\"error\":\"El JSON recibido no es correcto.\"}";
            return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("saveSubclients/{idCliente}")
    public Response handlePreflightSaveSubclients() {
        return buildPreflightResponse();
    }

    @POST
    @Path("deleteSubclient/{idSubcliente}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteSubclient(@PathParam("idSubcliente") int idSubcliente) {
        String out;
        ControllerCliente cc = new ControllerCliente();

        try {
            if (idSubcliente <= 0) {
                out = "{\"error\":\"El ID de subcliente no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            cc.eliminarSubcliente(idSubcliente);
            out = "{\"result\":\"Subcliente desactivado correctamente.\"}";
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("deleteSubclient/{idSubcliente}")
    public Response handlePreflightDeleteSubclient() {
        return buildPreflightResponse();
    }

    @GET
    @Path("getSubclients/{idCliente}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSubclients(@PathParam("idCliente") int idCliente) {
        String out;
        ControllerCliente cc = new ControllerCliente();

        try {
            if (idCliente <= 0) {
                out = "{\"error\":\"El ID de cliente no es válido.\"}";
                return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
            }

            List<SubCliente> subclientes = cc.getSubclientes(idCliente);
            out = new Gson().toJson(subclientes);
        } catch (Exception ex) {
            ex.printStackTrace();
            out = "{\"error\":\"Error interno del servidor: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }

        return buildResponse(out);
    }

    @OPTIONS
    @Path("getSubclients/{idCliente}")
    public Response handlePreflightGetSubclients() {
        return buildPreflightResponse();
    }
}