package com.naches.seguridad;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Date;

public class JWTUtil {
    // Clave secreta codificada en Base64 (almacena esto en un archivo de configuración o variable de entorno)
    private static final String SECRET_KEY = Base64.getEncoder().encodeToString("tu_clave_secreta_muy_segura_1234567890".getBytes());
    private static final long EXPIRATION_TIME = 864_000_000; // 10 días en milisegundos

    // Generar un token JWT con username y rol
    public static String generateToken(String username, String rol) {
        byte[] secretKeyBytes = Base64.getDecoder().decode(SECRET_KEY);
        SecretKeySpec key = new SecretKeySpec(secretKeyBytes, "HmacSHA256"); // Use "HmacSHA256" for HS256
        return Jwts.builder()
                .setSubject(username)
                .claim("rol", rol) // Agregar el rol como claim
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    // Validar un token JWT
    public static boolean validateToken(String token) {
        try {
            byte[] secretKeyBytes = Base64.getDecoder().decode(SECRET_KEY);
            SecretKeySpec key = new SecretKeySpec(secretKeyBytes, "HmacSHA256");
            Jwts.parser().setSigningKey(key).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Extraer el nombre de usuario del token
    public static String getUsernameFromToken(String token) {
        byte[] secretKeyBytes = Base64.getDecoder().decode(SECRET_KEY);
        SecretKeySpec key = new SecretKeySpec(secretKeyBytes, "HmacSHA256");
        Claims claims = Jwts.parser().setSigningKey(key).parseClaimsJws(token).getBody();
        return claims.getSubject();
    }

    // Extraer el rol del token
    public static String getRolFromToken(String token) {
        byte[] secretKeyBytes = Base64.getDecoder().decode(SECRET_KEY);
        SecretKeySpec key = new SecretKeySpec(secretKeyBytes, "HmacSHA256");
        Claims claims = Jwts.parser().setSigningKey(key).parseClaimsJws(token).getBody();
        return claims.get("rol", String.class);
    }
}