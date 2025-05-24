package com.naches.model;

import java.util.Date;

public class Contabilidad {
    
    private int idNota;
    private String numeroFactura;
    private double maniobra;
    private double comision;
    private String estadoFact;
    private double pagoViaje;
    private boolean pago;
    private Date fechaPago;

    public boolean isPago() {
        return pago;
    }

    public void setPago(boolean pago) {
        this.pago = pago;
    }

    public Date getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(Date fechaPago) {
        this.fechaPago = fechaPago;
    }
    
    
    

    // Getters y setters
    public int getIdNota() { return idNota; }
    public void setIdNota(int idNota) { this.idNota = idNota; }
    public String getNumeroFactura() { return numeroFactura; }
    public void setNumeroFactura(String numeroFactura) { this.numeroFactura = numeroFactura; }
    public double getManiobra() { return maniobra; }
    public void setManiobra(double maniobra) { this.maniobra = maniobra; }
    public double getComision() { return comision; }
    public void setComision(double comision) { this.comision = comision; }
    public String getEstadoFact() { return estadoFact; }
    public void setEstadoFact(String estadoFact) { this.estadoFact = estadoFact; }
    public double getPagoViaje() { return pagoViaje; }
    public void setPagoViaje(double pagoViaje) { this.pagoViaje = pagoViaje; }
}
