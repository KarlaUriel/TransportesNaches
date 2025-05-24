package com.naches.db;

import java.sql.Connection;
import java.sql.DriverManager;

public class ConexionMySQL {

    private Connection conn;

    public Connection open() throws Exception {
        String ruta = "jdbc:mysql://38.242.245.16:3306/transportesNaches";
        String usuario = "GermanVN";
        String password = "Naches0252*";

        // Registramos el Driver de MySQL apara que este disponible
        // y nos podaoms conectar con MYSQL
        Class.forName("com.mysql.cj.jdbc.Driver");

        conn = DriverManager.getConnection(ruta, usuario, password);

        return conn;
    }

    public void close() throws Exception {

        if (conn != null) {
            conn.close();
        }
    }
}
