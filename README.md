# ALTIORAM

## Introducción

ALTIORAM es una aplicación web full-stack orientada a la gestión integral de salones de belleza y peluquerías. El proyecto nace para solucionar problemas habituales en pequeños negocios del sector, como la gestión manual de citas, el control limitado del inventario y la falta de herramientas analíticas.

La plataforma permite:

**A los clientes:**
- Buscar peluquerías.
- Reservar servicios.
- Comprar productos online.

**A propietarios y empleados:**
- Gestionar reservas.
- Administrar inventario.
- Publicar contenido.
- Gestionar empleados.
- Consultar estadísticas del negocio.

---

## Objetivos del proyecto

### Objetivo general

Desarrollar una plataforma web completa para la gestión de peluquerías que cubra tanto las necesidades de clientes como las del personal del negocio.

### Objetivos específicos

- Implementar autenticación segura mediante JWT y bcrypt.
- Gestionar reservas dinámicas con empleados y horarios.
- Incorporar tienda online con control de stock y facturación.
- Añadir analítica y exportación de datos a PDF.
- Integrar servicios externos como:
  - Cloudinary.
  - SMTP.
  - Telegram Bot API.

---

## Análisis de mercado

El proyecto compara soluciones existentes como:

- Treatwell.
- Booksy.
- Versum.
- Soluciones genéricas como Excel o WhatsApp.
- Plataformas open source como Odoo o Cal.com.

### Diferencias principales de ALTIORAM

- Sin costes de suscripción ni comisiones.
- Código abierto y autohospedable.
- Control total de los datos.
- Integración de reservas, inventario y tienda online.
- Bot de Telegram integrado.

---

## Funcionalidades principales

### Gestión de usuarios

- Registro y login.
- Recuperación de contraseña.
- Roles diferenciados: `ADMIN`, `DUEÑO`, `PERSONAL`, `CLIENTE`.
- Actualización de perfil.
- Vinculación con Telegram.

### Sistema de reservas

- Consulta de servicios disponibles.
- Selección de empleado.
- Generación dinámica de horarios.
- Gestión de estados de reserva.
- Consulta de agenda para empleados y dueños.
- Historial de citas.

### Tienda online

- Gestión de productos.
- Carrito de compra.
- Checkout con transacciones SQL.
- Facturación automática.
- Control de stock por peluquería.

### Integración con Telegram

El bot permite:

- Reservar citas.
- Consultar reservas.
- Vincular cuentas mediante tokens temporales.
- Gestionar conversaciones mediante una máquina de estados.

---

## Arquitectura del sistema

ALTIORAM utiliza una arquitectura cliente-servidor desacoplada.

### Frontend

| Tecnología | Uso |
|---|---|
| React | Framework UI |
| TypeScript | Tipado estático |
| Vite | Bundler |
| Tailwind CSS | Estilos |
| React Router DOM | Enrutamiento |
| Recharts | Gráficas |

### Backend

| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor HTTP |
| TypeScript | Tipado estático |
| mysql2 | Acceso a BD |
| JWT | Autenticación |
| bcryptjs | Hash de contraseñas |
| Multer | Subida de archivos |
| Cloudinary SDK | Gestión de imágenes |
| Nodemailer | Envío de emails |

### Infraestructura

- Docker y Docker Compose.
- TiDB Cloud (compatible con MySQL).

---

## Seguridad

- Contraseñas hasheadas con bcrypt.
- Tokens JWT para autenticación stateless.
- Middleware de autorización por roles.
- Tokens de recuperación almacenados con SHA-256.
- Protección de endpoints mediante middlewares.

---

## Diseño e implementación

### Patrón arquitectónico

Se utiliza una variante del patrón MVC:

```
Routes → Controllers → Services → Database
```

Esto separa: enrutamiento, lógica HTTP, lógica de negocio y acceso a datos.

### Características destacadas

#### Checkout transaccional

El sistema garantiza atomicidad mediante transacciones SQL:

- Inserción de facturas.
- Inserción de detalles.
- Actualización de stock.
- Rollback automático en errores.

#### Gestión de imágenes

Las imágenes se suben:

- Con Multer en memoria.
- A Cloudinary mediante streams.
- Sin escritura en disco.

---

## Pruebas

### Pruebas funcionales (caja negra)

Validan: registro, login, reservas, compras y gestión de usuarios.

### Pruebas de integración API

Realizadas con Postman para verificar: autenticación, roles, respuestas HTTP y estructura JSON.

---

## Despliegue

El sistema está preparado para ejecutarse mediante Docker Compose:

```bash
docker compose up
```

Incluye: backend, frontend, variables de entorno, certificados SSL e integración con TiDB Cloud.

---

## Limitaciones actuales

- No incluye pasarela de pago real.
- El bot usa polling en lugar de webhooks.
- No se han realizado pruebas de escalabilidad.
- El despliegue principal está pensado para entorno local.

---

## Mejoras futuras

- Integración con Stripe.
- Aplicación móvil con React Native.
- Sistema de reseñas.
- Geolocalización avanzada.
- Notificaciones push.
- Panel ADMIN global.

---

## Conclusión

ALTIORAM representa una solución moderna y flexible para la gestión de peluquerías, combinando reservas online, gestión empresarial, e-commerce, analítica e integraciones externas.

El proyecto destaca especialmente por:

- Su arquitectura escalable.
- La separación clara entre frontend y backend.
- El uso de tecnologías actuales del mercado.
- La integración con Telegram como canal conversacional innovador.
