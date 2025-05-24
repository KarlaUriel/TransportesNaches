package com.naches.model;

import java.math.BigDecimal;
import java.util.Date;

public class GastoAnual {
    private int idGastoAnual;
    private String descripcion;
    private BigDecimal monto;
    private int anio;
    private Date fechaCreacion;
    private Date fechaActualizacion;

    public Date getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(Date fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public Date getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(Date fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    

    // Getters and Setters
    public int getIdGastoAnual() {
        return idGastoAnual;
    }

    public void setIdGastoAnual(int idGastoAnual) {
        this.idGastoAnual = idGastoAnual;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public int getAnio() {
        return anio;
    }

    public void setAnio(int anio) {
        this.anio = anio;
    }
}