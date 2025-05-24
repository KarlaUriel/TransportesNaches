package com.naches.model;

import java.util.List;

public class Cliente {

    private int idCliente;
    private String nombreCliente;
    private String calificaciones;
    private int activoCliente;
    private Persona persona;
    private String tipoCliente;
    private int factura;
    private List<SubCliente> subclientes; // New field for subclients

    public int getFactura() {
        return factura;
    }

    public void setFactura(int factura) {
        this.factura = factura;
    }

    
    
    // Getters and Setters
    public List<SubCliente> getSubclientes() { return subclientes; }
    public void setSubclientes(List<SubCliente> subclientes) { this.subclientes = subclientes; }
    // Existing getters and setters...

    public String getTipoCliente() {
        return tipoCliente;
    }

    public void setTipoCliente(String tipoCliente) {
        this.tipoCliente = tipoCliente;
    }
    
    

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public int getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(int idCliente) {
        this.idCliente = idCliente;
    }

    public String getCalificaciones() {
        return calificaciones;
    }

    public void setCalificaciones(String calificaciones) {
        this.calificaciones = calificaciones;
    }

    public Persona getPersona() {
        return persona;
    }

    public void setPersona(Persona persona) {
        this.persona = persona;
    }

    public int getActivoCliente() {
        return activoCliente;
    }

    public void setActivoCliente(int activoCliente) {
        this.activoCliente = activoCliente;
    }
    
}
