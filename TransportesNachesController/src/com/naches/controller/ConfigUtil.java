package com.naches.controller;

import java.io.InputStream;
import java.util.Properties;

public class ConfigUtil {
    private static final Properties props = new Properties();

    static {
        try (InputStream input = ConfigUtil.class.getResourceAsStream("/WEB-INF/application.properties")) {
            if (input != null) {
                props.load(input);
            } else {
                throw new RuntimeException("No se encontró application.properties en WEB-INF");
            }
        } catch (Exception e) {
            System.err.println("Error al cargar application.properties: " + e.getMessage());
        }
    }

    public static String getProperty(String key) {
        return props.getProperty(key);
    }
}