//package com.naches.controller;
//
//import jakarta.servlet.ServletContextEvent;
//import jakarta.servlet.ServletContextListener;
//import jakarta.servlet.annotation.WebListener;
//        
//
//@WebListener
//public class AppContextListener implements ServletContextListener {
//
//    private CorreoScheduler correoScheduler;
//
//    @Override
//    public void contextInitialized(ServletContextEvent sce) {
//        // Iniciar el scheduler cuando la aplicación arranca
//        correoScheduler = new CorreoScheduler();
//        correoScheduler.startScheduler();
//        System.out.println("CorreoScheduler iniciado al arrancar la aplicación.");
//    }
//
//    @Override
//    public void contextDestroyed(ServletContextEvent sce) {
//        // Detener el scheduler cuando la aplicación se detiene
//        if (correoScheduler != null) {
//            correoScheduler.stopScheduler();
//            System.out.println("CorreoScheduler detenido al cerrar la aplicación.");
//        }
//    }
//}