package com.naches.db;

import java.sql.Connection;
import java.sql.DriverManager;
import com.mysql.cj.jdbc.AbandonedConnectionCleanupThread;

public class ConexionMySQL {
    private Connection conn;
    private static final String URL = "jdbc:mysql://38.242.245.16:3306/transportesNaches?autoReconnect=true&useSSL=false";
    private static final String USER = "GermanVN";
    private static final String PASSWORD = "Naches0252*";

    public Connection open() throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        conn = DriverManager.getConnection(URL, USER, PASSWORD);
        return conn;
    }

    public void close() throws Exception {
        if (conn != null && !conn.isClosed()) {
            conn.close();
            conn = null; // Prevent reuse
        }
    }

    public static void shutdownCleanupThread() {
        try {
            AbandonedConnectionCleanupThread.checkedShutdown();
            // Unregister driver to prevent memory leak
            DriverManager.deregisterDriver(DriverManager.getDriver(URL));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}