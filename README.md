# Gestor de Reservas / Citas

App full stack (MongoDB + Express + React + Node) para que un emprendimiento chico/mediano
gestione turnos: los clientes reservan online y vos administrás todo desde un panel.

## Estructura

```
gestor-reservas/
├── backend/     API REST (Express + Mongoose)
└── frontend/    App React (Vite + Tailwind)
```

## Funcionalidad incluida

- **Reserva pública** (sin login): el cliente elige servicio → fecha → horario disponible → carga sus datos → confirma.
- **Cálculo de disponibilidad real**: cruza el horario de atención configurado con los turnos ya ocupados, respetando colchón entre turnos y anticipación mínima.
- **Panel admin** (con login):
  - Ver y gestionar turnos del día (confirmar, marcar completado, cancelar).
  - CRUD de servicios (nombre, duración, precio, activo/inactivo).
  - Configuración de horarios de atención por día de la semana, duración de la grilla de turnos, colchón entre turnos, días cerrados (feriados/vacaciones).
  - Cronograma del día: vista imprimible (o "Guardar como PDF" desde el diálogo de impresión del navegador) y botón para mandarlo por WhatsApp al número del negocio.
- **Notificaciones automáticas por WhatsApp** (vía Twilio) al confirmarse una reserva:
  - Al cliente: confirmación con fecha, horario, servicio y precio.
  - Al negocio: aviso de nueva reserva con los datos del cliente.

## WhatsApp (Twilio)

El envío es automático pero **opcional**: si no configurás las credenciales de Twilio, el sistema sigue funcionando normal (solo se salta el envío y lo deja registrado en el log del servidor).

1. Creá una cuenta gratis en [twilio.com](https://www.twilio.com) y activá el **WhatsApp Sandbox** (Messaging → Try it out → Send a WhatsApp message). Te da un número y un código que cada número de prueba tiene que "unir" al sandbox mandándole un WhatsApp (esto es solo para pruebas; en producción se solicita un número de WhatsApp Business propio, que Twilio aprueba en unos días).
2. Copiá tu `Account SID` y `Auth Token` desde el [Console de Twilio](https://console.twilio.com) al `.env` del backend.
3. Completá `TWILIO_WHATSAPP_FROM` con el número que te dio el sandbox (formato `whatsapp:+14155238886`).
4. Desde el panel admin → **Horarios y configuración**, cargá el WhatsApp del negocio (`adminWhatsapp`) y activá/desactivá los dos tipos de aviso.
5. Los números de clientes que no incluyan código de país se completan automáticamente con `DEFAULT_COUNTRY_CODE` (54 = Argentina). Para evitar ambigüedades, lo ideal es que el campo de teléfono en la reserva pida el número completo con característica.

**Nota sobre números argentinos**: Twilio a veces requiere el "9" después del código de país para celulares argentinos (ej. `+549381...`). Si los mensajes no llegan, es lo primero para revisar.

## Requisitos

- Node.js 18+
- MongoDB corriendo localmente (o una URI de MongoDB Atlas)

## 1. Backend

```bash
cd backend
cp .env.example .env
# editá .env si tu Mongo no corre en localhost, o si querés cambiar el admin inicial
npm install
npm run seed   # crea el usuario admin, la configuración inicial y 3 servicios de ejemplo
npm run dev    # levanta la API en http://localhost:4000
```

Usuario admin por defecto (definido en `.env`):
- Email: `admin@negocio.com`
- Contraseña: `admin1234`

**Importante**: cambiá `JWT_SECRET` y la contraseña del admin antes de usarlo en producción.

## 2. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # http://localhost:5173
```

- `http://localhost:5173/` → página pública de reserva
- `http://localhost:5173/admin/login` → panel admin

## Flujo de datos clave

- `BusinessConfig`: un único documento con el horario semanal, duración de grilla y días cerrados.
- `Service`: servicios que ofrece el negocio (duración y precio propios).
- `Appointment`: cada turno reservado, con snapshot del servicio (nombre/precio/duración) al momento de la reserva, para que si después cambiás el precio de un servicio, los turnos ya tomados no se alteren.
- La disponibilidad (`GET /api/appointments/availability`) se recalcula en cada consulta: no se guardan "slots" vacíos en la base, se generan al vuelo según el horario configurado menos los turnos ya tomados.

## Próximos pasos posibles (decime si querés que los agreguemos)

- Notificaciones por email al cliente (confirmación/recordatorio) con Nodemailer.
- Múltiples profesionales/empleados con calendarios propios.
- Cancelación por parte del cliente vía link único (sin necesitar login).
- Reportes de ingresos y ocupación.
- Deploy (backend en Render/Railway, frontend en Vercel/Netlify, Mongo Atlas).
