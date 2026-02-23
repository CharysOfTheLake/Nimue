# Especificación MVP

## Roles

- **Dungeon Master (DM):** crea partidas/campañas y define sesiones, plazas y precio.
- **Jugador:** explora partidas, se inscribe y paga.
- **Admin (futuro):** modera contenidos y gestiona incidencias.

## Casos de uso principales

### DM

1. Registrarse/iniciar sesión como DM.
2. Crear anuncio de partida o campaña con:
   - Título y descripción.
   - Modalidad (online/presencial).
   - Ubicación (si presencial) o enlace de plataforma (si online).
   - Calendario de sesiones.
   - Duración por sesión.
   - Plazas por sesión.
   - Precio por jugador/sesión (0,5€–50€).
3. Ver inscritos por sesión.
4. Recibir pagos netos (descontando 15%).

### Jugador

1. Registrarse/iniciar sesión como jugador.
2. Buscar y filtrar partidas/campañas.
3. Ver detalle y plazas disponibles.
4. Inscribirse y pagar por adelantado.
5. Ver historial de reservas/pagos.

## Reglas de negocio

1. **Precio permitido:** `0.5 <= precio_sesion <= 50`.
2. **Aforo:** no se permiten inscripciones por encima de `plazas_totales`.
3. **Comisión fija:** 15% sobre el importe bruto cobrado.
4. **Estado de reserva:** `pending`, `paid`, `cancelled`, `refunded`.
5. **Estado de sesión:** `scheduled`, `completed`, `cancelled`.

## Entidades mínimas

- `users`
- `campaigns`
- `sessions`
- `enrollments`
- `payments`
- `payouts`

## Flujo de pago (resumen)

1. Jugador solicita inscripción.
2. Se crea reserva `pending`.
3. Se captura pago -> reserva `paid`.
4. Se calcula comisión 15% y neto DM.
5. Se registra payout pendiente para DM.
