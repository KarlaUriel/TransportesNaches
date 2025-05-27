package com.naches.rest;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import java.util.Timer;
import java.util.TimerTask;
import com.naches.db.ConexionMySQL;

@WebListener
public class SchedulerServlet implements ServletContextListener {
    private Timer timer;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        timer = new Timer(true);
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                new com.naches.email.NotasPendientes().checkAndSendPendingNotes();
            }
        }, 0, 24 * 60 * 60 * 1000); // Run every 24 hours
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (timer != null) {
            timer.cancel();
        }
        ConexionMySQL.shutdownCleanupThread(); // Shut down MySQL cleanup thread
    }
}