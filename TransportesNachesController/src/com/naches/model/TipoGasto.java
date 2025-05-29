package com.naches.model;

import java.io.Serializable;

public class TipoGasto implements Serializable{
    
    private static final long serialVersionUID = 1L;
    private int idTipoGasto;
    private String descripcion;

    public int getIdTipoGasto() {
        return idTipoGasto;
    }

    public void setIdTipoGasto(int idTipoGasto) {
        this.idTipoGasto = idTipoGasto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    
    
    
}
