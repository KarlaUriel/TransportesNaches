package com.naches.model;

import java.time.LocalDate;


public class MantenimientoUnidad {
    private int idMantenimiento;
    private Unidad unidad;
    private String tipoMantenimiento;
    private String fechaMantenimiento;
    private Integer kmActual;
    private int idUnidad;

    public int getIdMantenimiento() { return idMantenimiento; }
    public void setIdMantenimiento(int idMantenimiento) { this.idMantenimiento = idMantenimiento; }
    public Unidad getUnidad() { return unidad; }
    public void setUnidad(Unidad unidad) { this.unidad = unidad; }
    public String getTipoMantenimiento() { return tipoMantenimiento; }
    public void setTipoMantenimiento(String tipoMantenimiento) { this.tipoMantenimiento = tipoMantenimiento; }
    public String getFechaMantenimiento() { return fechaMantenimiento; }
    public void setFechaMantenimiento(String fechaMantenimiento) { this.fechaMantenimiento = fechaMantenimiento; }
    public Integer getKmActual() { return kmActual; }
    public void setKmActual(Integer kmActual) { this.kmActual = kmActual; }
    public int getIdUnidad() { return idUnidad; }
    public void setIdUnidad(int idUnidad) { this.idUnidad = idUnidad; }
}