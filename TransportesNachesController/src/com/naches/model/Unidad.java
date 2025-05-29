package com.naches.model;

import java.io.Serializable;

public class Unidad implements Serializable{

    private static final long serialVersionUID = 1L;
    private int idUnidad;
    private String tipoVehiculo;
    private String placas;
    private double rendimientoUnidad;
    private String capacidad;
    private String fechaVencimientoPol;
    private int activoUnidad;
    private String disponibilidad;
    private int kmMantenimiento;

    public int getKmMantenimiento() {
        return kmMantenimiento;
    }

    public void setKmMantenimiento(int kmMantenimiento) {
        this.kmMantenimiento = kmMantenimiento;
    }

    
    public int getIdUnidad() {
        return idUnidad;
    }

    public void setIdUnidad(int idUnidad) {
        this.idUnidad = idUnidad;
    }

    public String getTipoVehiculo() {
        return tipoVehiculo;
    }

    public void setTipoVehiculo(String tipoVehiculo) {
        this.tipoVehiculo = tipoVehiculo;
    }

    public String getPlacas() {
        return placas;
    }

    public void setPlacas(String placas) {
        this.placas = placas;
    }

    public double getRendimientoUnidad() {
        return rendimientoUnidad;
    }

    public void setRendimientoUnidad(double rendimientoUnidad) {
        this.rendimientoUnidad = rendimientoUnidad;
    }

    public String getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(String capacidad) {
        this.capacidad = capacidad;
    }

    public String getFechaVencimientoPol() {
        return fechaVencimientoPol;
    }

    public void setFechaVencimientoPol(String fechaVencimientoPol) {
        this.fechaVencimientoPol = fechaVencimientoPol;
    }

    public int getActivoUnidad() {
        return activoUnidad;
    }

    public void setActivoUnidad(int activoUnidad) {
        this.activoUnidad = activoUnidad;
    }

    public String getDisponibilidad() {
        return disponibilidad;
    }

    public void setDisponibilidad(String disponibilidad) {
        this.disponibilidad = disponibilidad;
    }

}
