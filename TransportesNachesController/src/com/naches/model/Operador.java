package com.naches.model;

import java.util.ArrayList;
import java.util.List;

public class Operador {
    
    private int idOperador;
    private String nombreOperador;
    private int activoOperador;
    private Persona Persona;
    private Usuario Usuario;
    private List<NotaGasto> notasGasto = new ArrayList<>();

    public String getNombreOperador() {
        return nombreOperador;
    }

    public void setNombreOperador(String nombreOperador) {
        this.nombreOperador = nombreOperador;
    }
    
    public int getIdOperador() {
        return idOperador;
    }

    public void setIdOperador(int idOperador) {
        this.idOperador = idOperador;
    }

    public int getActivoOperador() {
        return activoOperador;
    }

    public void setActivoOperador(int activoOperador) {
        this.activoOperador = activoOperador;
    }

    public Persona getPersona() {
        return Persona;
    }

    public void setPersona(Persona Persona) {
        this.Persona = Persona;
    }

    public Usuario getUsuario() {
        return Usuario;
    }

    public void setUsuario(Usuario Usuario) {
        this.Usuario = Usuario;
    }

    public List<NotaGasto> getNotasGasto() {
        return notasGasto;
    }
    
    public void setNotasGasto(List<NotaGasto> notasGasto) {
        this.notasGasto = notasGasto;
    }

}
