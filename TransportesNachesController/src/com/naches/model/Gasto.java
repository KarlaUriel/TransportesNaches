package com.naches.model;

import java.io.Serializable;

public class Gasto implements Serializable{

    private static final long serialVersionUID = 1L;
    private int idGasto;
    private int noGasto;
    private double cantidad;
    private TipoGasto tipoGasto;
    private String detalleCaseta;
    private String tipoGas;
    private String tipoPago;
    private double costoUnitario;
    private double subTotal;
    private double total;
    private double valorLitro; // Nuevo atributo

    public double getValorLitro() {
        return valorLitro;
    }

    public void setValorLitro(double valorLitro) {
        this.valorLitro = valorLitro;
    }

    
    
    
    public int getIdGasto() {
        return idGasto;
    }

    public void setIdGasto(int idGasto) {
        this.idGasto = idGasto;
    }

    
    
    public int getNoGasto() {
        return noGasto;
    }

    public void setNoGasto(int noGasto) {
        this.noGasto = noGasto;
    }

    public double getCantidad() {
        return cantidad;
    }

    public void setCantidad(double cantidad) {
        this.cantidad = cantidad;
    }

    public TipoGasto getTipoGasto() {
        return tipoGasto;
    }

    public void setTipoGasto(TipoGasto tipoGasto) {
        this.tipoGasto = tipoGasto;
    }

    public String getDetalleCaseta() {
        return detalleCaseta;
    }

    public void setDetalleCaseta(String detalleCaseta) {
        this.detalleCaseta = detalleCaseta;
    }

    public String getTipoGas() {
        return tipoGas;
    }

    public void setTipoGas(String tipoGas) {
        this.tipoGas = tipoGas;
    }

    public String getTipoPago() {
        return tipoPago;
    }

    public void setTipoPago(String tipoPago) {
        this.tipoPago = tipoPago;
    }

    public double getCostoUnitario() {
        return costoUnitario;
    }

    public void setCostoUnitario(double costoUnitario) {
        this.costoUnitario = costoUnitario;
    }

    public double getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(double subTotal) {
        this.subTotal = subTotal;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }
    
    
    
}

