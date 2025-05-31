package com.naches.controller;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;

public class CacheShutdownListener implements ServletContextListener {
    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        ControllerNotaGasto.closeCache();
    }
}