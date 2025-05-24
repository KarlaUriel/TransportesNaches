//package com.naches.controller;
//
//import com.naches.controller.ControllerNotaGasto;
//import com.naches.model.NotaGasto;
//import java.util.List;
//import java.util.concurrent.Executors;
//import java.util.concurrent.ScheduledExecutorService;
//import java.util.concurrent.TimeUnit;
//
//public class CorreoScheduler {
//
//    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
//    private final ControllerNotaGasto controllerNotaGasto;
//    private final Correo correoService;
//
//    public CorreoScheduler() {
//        this.controllerNotaGasto = new ControllerNotaGasto();
//        this.correoService = new Correo();
//    }
//
//    public void startScheduler() {
//        // Programar la tarea para ejecutarse cada hora
//        scheduler.scheduleAtFixedRate(this::verificarNotasPendientes, 0, 1, TimeUnit.HOURS);
//    }
//
//    private void verificarNotasPendientes() {
//        try {
//            // Obtener todas las notas pendientes
//            List<NotaGasto> notasPendientes = controllerNotaGasto.getNotasPendientes();
//            System.out.println("Verificando notas pendientes: " + notasPendientes.size() + " encontradas.");
//
//            // Verificar cada nota y enviar correo si es necesario
//            for (NotaGasto nota : notasPendientes) {
//                correoService.verificarYEnviarCorreo(nota, "luisurielz17@gmail.com");
//            }
//        } catch (Exception e) {
//            System.err.println("Error al verificar notas pendientes: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }
//
//    public void stopScheduler() {
//        scheduler.shutdown();
//        try {
//            if (!scheduler.awaitTermination(60, TimeUnit.SECONDS)) {
//                scheduler.shutdownNow();
//            }
//        } catch (InterruptedException e) {
//            scheduler.shutdownNow();
//        }
//    }
//}