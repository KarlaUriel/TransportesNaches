package com.naches.email;

import com.naches.db.ConexionMySQL;
import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.sql.*;
import java.util.Properties;
import java.util.ArrayList;
import java.util.List;

public class NotasPendientes {
    private String smtpHost = "smtp.gmail.com";
    private String smtpPort = "587";
    private String emailFrom = "notificacion.factura.naches@gmail.com";
    private String emailTo = "zavalaurieloficial@gmail.com";
    private String emailPassword = "mjxm kwcw qnxm fkmq";

    public static class NotaGasto {
        private int idNota;
        private String fechaLlegada;
        private String nombreCliente;
        
        public NotaGasto(int idNota, String fechaLlegada, String nombreCliente) {
            this.idNota = idNota;
            this.fechaLlegada = fechaLlegada;
            this.nombreCliente = nombreCliente;
        }
        
        @Override
        public String toString() {
            return "No. Nota: " + idNota + ", Finalizado en: " + fechaLlegada + ", Nombre del Cliente: " + nombreCliente;
        }
    }
    
    public List<NotaGasto> getPendingNotes() throws Exception {
        List<NotaGasto> notes = new ArrayList<>();
        String query = "SELECT ng.*, cn.* FROM notaGasto ng " +
                      "INNER JOIN contabilidadN cn ON ng.idNota = cn.idNota " +
                      "WHERE cn.estadoFact = 'Pendiente' " +
                      "AND ng.fechaLlegada <= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        
        ConexionMySQL conexion = new ConexionMySQL();
        try (Connection conn = conexion.open();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                notes.add(new NotaGasto(
                    rs.getInt("idNota"),
                    rs.getString("fechaLlegada"),
                    rs.getString("nombreCliente")
                ));
            }
        } finally {
            conexion.close();
        }
        return notes;
    }
    
    public void sendEmail(List<NotaGasto> notes) throws MessagingException {
        if (notes.isEmpty()) {
            System.out.println("No hay notas pendientes para enviar.");
            return;
        }
        
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", smtpHost);
        props.put("mail.smtp.port", smtpPort);
        props.put("mail.debug", "true");
        
        Session session = Session.getInstance(props, new Authenticator() { // Line 60
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(emailFrom, emailPassword);
            }
        });
        
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(emailFrom));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(emailTo));
        message.setSubject("Notas de Gasto Pendientes por Facturar");
        
        StringBuilder emailBody = new StringBuilder();
        emailBody.append("Lista de notas de gasto pendientes por facturar (más de 7 días):\n\n");
        for (NotaGasto note : notes) {
            emailBody.append(note.toString()).append("\n");
        }
        
        message.setText(emailBody.toString());
        Transport.send(message);
        System.out.println("Correo enviado exitosamente.");
    }
    
    public void checkAndSendPendingNotes() {
        try {
            List<NotaGasto> pendingNotes = getPendingNotes();
            sendEmail(pendingNotes);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}