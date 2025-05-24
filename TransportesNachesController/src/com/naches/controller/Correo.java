// HOLAAAAAAA XD


//package com.naches.controller;
//
//import com.naches.model.NotaGasto;
//import java.util.Properties;
//import javax.mail.*;
//import javax.mail.internet.*;
//
//public class Correo {
//
//    private final Properties props;
//    private final Session session;
//
//    public Correo() {
//        // Configuración de las propiedades de la conexión
//        props = new Properties();
//        props.put("mail.smtp.auth", "true");
//        props.put("mail.smtp.starttls.enable", "true");
//        props.put("mail.smtp.starttls.required", "true");
//        props.put("mail.smtp.ssl.protocols", "TLSv1.2");
//        props.put("mail.smtp.host", "smtp.gmail.com");
//        props.put("mail.smtp.port", "587");
//
//        // Configuración de la autenticación
//        session = Session.getInstance(props, new Authenticator() {
//            @Override
//            protected PasswordAuthentication getPasswordAuthentication() {
//                return new PasswordAuthentication("zavalaurieloficial@gmail.com", "ylwt fowf xmyh pjht");
//            }
//        });
//    }
//
//    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
//        try {
//            Message message = new MimeMessage(session);
//            message.setFrom(new InternetAddress("zavalaurieloficial@gmail.com"));
//            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario));
//            message.setSubject(asunto);
//            message.setText(cuerpo);
//
//            Transport.send(message);
//            System.out.println("Correo enviado correctamente a " + destinatario);
//        } catch (MessagingException e) {
//            System.err.println("Error al enviar correo: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }
//
//    public void verificarYEnviarCorreo(NotaGasto nota, String destinatario) {
//        if (nota.esPendienteYAntigua()) {
//            String asunto = "Notificación: Nota de Gasto Pendiente";
//            String cuerpo = "La nota de gasto con ID " + nota.getIdNota() + " está pendiente y es antigua.\n" +
//                           "Detalles:\n" +
//                           "Operador: " + nota.getOperador().getNombreOperador() + "\n" +
//                           "Cliente: " + nota.getCliente().getNombreCliente() + "\n" +
//                           "Fecha de Salida: " + nota.getFechaSalida() + "\n" +
//                           "Por favor, revisa esta nota.";
//            enviarCorreo(destinatario, asunto, cuerpo);
//        }
//    }
//}