package com.naches.model;

import java.util.Date;
import java.util.List;

public class NotaGasto {

    private int idNota;
    private String origen;
    private String destino;
    private Date fechaLlenado;
    private Date fechaSalida;
    private Date fechaLlegada;
    private String horaSalida;
    private String horaLlegada;
    private String nombreOperador;
    private String nombreCliente;
    private double kmInicio;
    private double kmFinal;
    private int noEntrega;
    private boolean gasolinaInicio;
    private String gasolinaLevel;
    private boolean llantasInicio;
    private boolean aceiteInicio;
    private boolean anticongelanteInicio;
    private boolean liquidoFrenosInicio;
    private String comentarioEstado;
    private String fotoTablero;
    private String fotoAcuse;
    private Operador operador;
    private Cliente cliente;
    private Unidad unidad;
    private int idUnidad;
    private int idUsuario;
    private Double maniobra;
    private Double comision;
    private boolean pago;
    private Date fechaPago;
    private String noFact;
    private String estadoFact;
    private String estadoViaje;
    private double pagoViaje;
    private double ganancia;
    private double latitude;
    private double longitude;

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

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    private String estado;
    private String numeroFactura;
    private List<Gasto> gastos;
    private String fotoOtraInicio; // Nuevo campo
    private String fotoOtraFin;

    public String getFotoOtraInicio() {
        return fotoOtraInicio;
    }

    public void setFotoOtraInicio(String fotoOtraInicio) {
        this.fotoOtraInicio = fotoOtraInicio;
    }

    public String getFotoOtraFin() {
        return fotoOtraFin;
    }

    public void setFotoOtraFin(String fotoOtraFin) {
        this.fotoOtraFin = fotoOtraFin;
    }

    public int getIdUnidad() {
        return idUnidad;
    }

    public void setIdUnidad(int idUnidad) {
        this.idUnidad = idUnidad;
    }

    public String getNombreOperador() {
        return nombreOperador;
    }

    public void setNombreOperador(String nombreOperador) {
        this.nombreOperador = nombreOperador;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    // Getters y setters
    public int getIdNota() {
        return idNota;
    }

    public void setIdNota(int idNota) {
        this.idNota = idNota;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public Date getFechaLlenado() {
        return fechaLlenado;
    }

    public void setFechaLlenado(Date fechaLlenado) {
        this.fechaLlenado = fechaLlenado;
    }

    public Date getFechaSalida() {
        return fechaSalida;
    }

    public void setFechaSalida(Date fechaSalida) {
        this.fechaSalida = fechaSalida;
    }

    public Date getFechaLlegada() {
        return fechaLlegada;
    }

    public void setFechaLlegada(Date fechaLlegada) {
        this.fechaLlegada = fechaLlegada;
    }

    public String getHoraSalida() {
        return horaSalida;
    }

    public void setHoraSalida(String horaSalida) {
        this.horaSalida = horaSalida;
    }

    public String getHoraLlegada() {
        return horaLlegada;
    }

    public void setHoraLlegada(String horaLlegada) {
        this.horaLlegada = horaLlegada;
    }

    public double getKmInicio() {
        return kmInicio;
    }

    public void setKmInicio(double kmInicio) {
        this.kmInicio = kmInicio;
    }

    public double getKmFinal() {
        return kmFinal;
    }

    public void setKmFinal(double kmFinal) {
        this.kmFinal = kmFinal;
    }

    public int getNoEntrega() {
        return noEntrega;
    }

    public void setNoEntrega(int noEntrega) {
        this.noEntrega = noEntrega;
    }

    public boolean isGasolinaInicio() {
        return gasolinaInicio;
    }

    public void setGasolinaInicio(boolean gasolinaInicio) {
        this.gasolinaInicio = gasolinaInicio;
    }

    public String getGasolinaLevel() {
        return gasolinaLevel;
    }

    public void setGasolinaLevel(String gasolinaLevel) {
        this.gasolinaLevel = gasolinaLevel;
    }

    public boolean isLlantasInicio() {
        return llantasInicio;
    }

    public void setLlantasInicio(boolean llantasInicio) {
        this.llantasInicio = llantasInicio;
    }

    public boolean isAceiteInicio() {
        return aceiteInicio;
    }

    public void setAceiteInicio(boolean aceiteInicio) {
        this.aceiteInicio = aceiteInicio;
    }

    public boolean isAnticongelanteInicio() {
        return anticongelanteInicio;
    }

    public void setAnticongelanteInicio(boolean anticongelanteInicio) {
        this.anticongelanteInicio = anticongelanteInicio;
    }

    public boolean isLiquidoFrenosInicio() {
        return liquidoFrenosInicio;
    }

    public void setLiquidoFrenosInicio(boolean liquidoFrenosInicio) {
        this.liquidoFrenosInicio = liquidoFrenosInicio;
    }

    public String getComentarioEstado() {
        return comentarioEstado;
    }

    public void setComentarioEstado(String comentarioEstado) {
        this.comentarioEstado = comentarioEstado;
    }

    public String getFotoTablero() {
        return fotoTablero;
    }

    public void setFotoTablero(String fotoTablero) {
        this.fotoTablero = fotoTablero;
    }

    public String getFotoAcuse() {
        return fotoAcuse;
    }

    public void setFotoAcuse(String fotoAcuse) {
        this.fotoAcuse = fotoAcuse;
    }

    public Operador getOperador() {
        return operador;
    }

    public void setOperador(Operador operador) {
        this.operador = operador;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Unidad getUnidad() {
        return unidad;
    }

    public void setUnidad(Unidad unidad) {
        this.unidad = unidad;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Double getManiobra() {
        return maniobra;
    }

    public void setManiobra(Double maniobra) {
        this.maniobra = maniobra;
    }

    public Double getComision() {
        return comision;
    }

    public void setComision(Double comision) {
        this.comision = comision;
    }

    public String getNoFact() {
        return noFact;
    }

    public void setNoFact(String noFact) {
        this.noFact = noFact;
    }

    public String getEstadoFact() {
        return estadoFact;
    }

    public void setEstadoFact(String estadoFact) {
        this.estadoFact = estadoFact;
    }

    public String getEstadoViaje() {
        return estadoViaje;
    }

    public void setEstadoViaje(String estadoViaje) {
        this.estadoViaje = estadoViaje;
    }

    public Double getPagoViaje() {
        return pagoViaje;
    }

    public void setPagoViaje(Double pagoViaje) {
        this.pagoViaje = pagoViaje;
    }

    public double getGanancia() {
        return ganancia;
    }

    public void setGanancia(double ganancia) {
        this.ganancia = ganancia;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getNumeroFactura() {
        return numeroFactura;
    }

    public void setNumeroFactura(String numeroFactura) {
        this.numeroFactura = numeroFactura;
    }

    public List<Gasto> getGastos() {
        return gastos;
    }

    public void setGastos(List<Gasto> gastos) {
        this.gastos = gastos;
    }

    public boolean esPendienteYAntigua() {
        if (!"PENDIENTE".equalsIgnoreCase(estadoFact)) {
            return false; // Si no es pendiente, devolvemos false
        }

        if (fechaLlenado == null) {
            return false; // Si fechaLlenado es nula, devolvemos false
        }

        long milisegundos = System.currentTimeMillis() - fechaLlenado.getTime(); // Diferencia en milisegundos
        long dias = milisegundos / (1000 * 60 * 60 * 24); // Convertimos milisegundos a días

        return dias > 2; // Si han pasado más de 7 días, devolvemos true
    }

    public NotaGasto(int idNota, Date fechaLlegada, String nombreCliente){
        this.idNota = idNota;
        this.fechaLlenado = fechaLlenado;
        this.nombreCliente = nombreCliente;

    }

    public NotaGasto() {
    }

}
