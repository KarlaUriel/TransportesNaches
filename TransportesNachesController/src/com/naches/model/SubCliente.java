package com.naches.model;

public class SubCliente {
    private int idSubcliente;
    private int idCliente; // Foreign key to Cliente
    private int activoSubcliente;
    private String nombre;
    private String ubicacion; // Google Maps location string

    public SubCliente() {}

    public SubCliente(String nombre, String ubicacion) {
        this.nombre = nombre;
        this.ubicacion = ubicacion;
    }

    public int getActivoSubcliente() {
        return activoSubcliente;
    }

    public void setActivoSubcliente(int activoSubcliente) {
        this.activoSubcliente = activoSubcliente;
    }


    
    // Getters and Setters
    public int getIdSubcliente() { return idSubcliente; }
    public void setIdSubcliente(int idSubcliente) { this.idSubcliente = idSubcliente; }
    public int getIdCliente() { return idCliente; }
    public void setIdCliente(int idCliente) { this.idCliente = idCliente; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
}