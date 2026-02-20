# Nimue — Plataforma para partidas de rol

Nimue es una plataforma web para conectar **Dungeon Masters (DMs)** y **jugadores** alrededor de partidas y campañas de rol.

## Objetivo

Permitir que los DMs publiquen partidas/campañas (presenciales u online), y que los jugadores se inscriban y paguen por adelantado de forma segura.

## Funcionalidades base (MVP)

1. **Publicación de partidas/campañas por DMs**
   - Descripción de la partida.
   - Fecha única o calendario de sesiones.
   - Horario.
   - Duración estimada de cada sesión.
   - Número de plazas disponibles.
   - Modalidad: presencial u online.
2. **Inscripción de jugadores**
   - Un jugador puede reservar una plaza en una sesión/campaña con vacantes.
3. **Pago por adelantado**
   - Rango de precio por sesión por jugador: **0,5€ a 50€**.
   - Comisión de plataforma: **15%**.
   - El DM recibe el **85%** restante.

## Regla de negocio de pagos

- `importe_bruto = precio_sesion * numero_jugadores_confirmados`
- `comision_plataforma = importe_bruto * 0.15`
- `importe_dm = importe_bruto - comision_plataforma`

## Próximos pasos técnicos

- Definir modelo de datos inicial (`db/schema.sql`).
- Exponer API REST inicial (`docs/openapi.yaml`).
- Implementar autenticación por roles (DM/Jugador/Admin).

## Mini app: formulario DM + backend local

Se ha añadido una mini app funcional para que un DM publique partida y sesión.

### Ejecutar en local

```bash
npm start
```

Luego abre:

- `http://localhost:3000/` (landing)
- `http://localhost:3000/dm-publicar.html` (formulario DM)

### Endpoints disponibles

- `POST /api/campaigns`
- `POST /api/campaigns/:campaignId/sessions`
- `GET /api/campaigns`
- `GET /api/health`

Los datos se guardan en `app/data/store.json`.

### Nota sobre GitHub Pages

GitHub Pages sirve contenido **estático**; no ejecuta `app/server.js` ni expone `/api/*`.

- En Pages, `site/dm-publicar.html` funciona en **modo demo local** (guarda borradores en `localStorage`).
- Para publicación real de campañas/sesiones necesitas ejecutar el backend (`npm start`) o desplegar la API en otro hosting.
