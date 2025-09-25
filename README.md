
-----

# 🚚 Transportes Naches - Sistema de Gestión Logística

Un sistema de gestión integral para empresas de transporte, diseñado para administrar operaciones de logística, contabilidad y recursos humanos. Construido con una arquitectura moderna de API RESTful y una interfaz web modular, todo sobre la plataforma Java.

-----

## 🌟 Características Principales

Este sistema ofrece un conjunto completo de herramientas para optimizar la gestión de una empresa de transporte:

  * **👥 Gestión de Entidades**: Administración centralizada de clientes, subclientes, operadores, unidades, casetas y ciudades.
  * **💰 Contabilidad y Finanzas**: Módulos robustos para registrar y controlar gastos (diarios y anuales), notas de gasto y un panorama financiero completo.
  * **🔐 Seguridad Robusta**: Autenticación y autorización gestionadas mediante **JSON Web Tokens (JWT)** para proteger los datos y las operaciones.
  * **🖥️ Interfaz Web Intuitiva**: Una interfaz de usuario limpia, modular y fácil de usar, construida con HTML, CSS y JavaScript, que facilita la interacción con todas las funciones del sistema.
  * **🔄 API RESTful**: Una capa de servicios REST bien definida que comunica el frontend y el backend, permitiendo operaciones CRUD (Crear, Leer, Actualizar, Borrar) de manera eficiente y estandarizada.
  * **📧 Notificaciones por Correo Electrónico**: Un módulo integrado para el envío automatizado de correos, ideal para notificar sobre notas pendientes, recordatorios y alertas.

## 🛠️ Tecnologías Utilizadas

El proyecto está construido sobre una base tecnológica sólida y probada:

  * **Lenguaje Principal**: **Java**
  * **Base de Datos**: **MySQL**
  * **Backend**:
      * Java Servlets para la lógica del servidor.
      * Clases de Modelo (POJOs) para la representación de datos.
      * Implementación de JWT para la capa de seguridad.
  * **Frontend**:
      * **HTML5** para la estructura.
      * **CSS3** para el diseño y la presentación.
      * **JavaScript** para la interactividad y la lógica del cliente.

## 📂 Estructura del Proyecto

El repositorio está organizado en módulos claros que separan las responsabilidades, siguiendo las mejores prácticas de la arquitectura de software.

```
TransportesNaches/
├── 📂 TransportesNachesController/  # Lógica de negocio, modelos (POJOs) y DAOs
├── 📂 TransportesNachesRest/       # Capa de la API RESTful (Endpoints)
├── 📂 naches_controller/           # Módulo de controladores específicos
├── 📂 naches_web/                  # Módulo principal de la aplicación web
└── 📂 web/                         # Raíz de los archivos públicos del frontend
    ├── css/                        # Hojas de estilo
    ├── js/
    │   └── controller_*.js       # Controladores JavaScript para cada vista
    ├── view/
    │   └── view_*.html           # Vistas y componentes de la interfaz
    └── index.html                  # Punto de entrada de la aplicación
```

## 🚀 Puesta en Marcha (Getting Started)

Para ejecutar este proyecto en tu entorno local, sigue estos pasos:

### Prerrequisitos

  * JDK 8 o superior.
  * Servidor de bases de datos MySQL.
  * Un servidor de aplicaciones web Java como Apache Tomcat.
  * Maven o Gradle (dependiendo del gestor de dependencias utilizado).

### Instalación

1.  **Clona el repositorio:**
    ```sh
    git clone https://github.com/tu-usuario/TransportesNaches.git
    ```
2.  **Configura la base de datos:**
      * Crea una base de datos en MySQL.
      * Importa el script SQL (`schema.sql` o similar) para crear las tablas y relaciones necesarias.
3.  **Configura las credenciales:**
      * Busca el archivo de configuración de la base de datos (generalmente un `.properties` o `.xml`) dentro del módulo de `Controller`.
      * Actualiza la URL de la base de datos, el usuario y la contraseña.
4.  **Compila y empaqueta el proyecto:**
    ```sh
    # Si usas Maven
    mvn clean install
    ```
5.  **Despliega el archivo `.war`** generado en tu servidor de aplicaciones (ej. Apache Tomcat).
6.  **Accede a la aplicación** a través de tu navegador en la URL correspondiente (ej. `http://localhost:8080/TransportesNaches/`).
