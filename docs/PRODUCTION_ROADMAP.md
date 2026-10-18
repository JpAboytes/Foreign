# Foreign — Roadmap a producción

Estado: **Fase 0 completada (diagnóstico)** · Fecha: 2026-10-18

## 1. Diagnóstico del estado actual

| Área | Hallazgo | Severidad |
|---|---|---|
| Stack | Expo SDK 53.0.12, RN 0.79.4, React 19.0, expo-router 5, New Architecture activada | Hay que actualizar al SDK más reciente |
| Backend | Firebase 10.7 (JS SDK): Firestore (13 colecciones), Realtime DB (`messages`), Storage y Auth (email + Google) | Se migra a Supabase |
| Calidad | `tsc` da **18 errores**; `expo-doctor` falla 4 de 18 checks (esquema de config, `metro.config.js` con override, versiones nativas) | Alta |
| Tests | 1 solo test (plantilla `StyledText-test.js`) | Alta |
| Secretos | `MyApp/.env` está ignorado por el `.gitignore` raíz, pero `google-services.json` y `GoogleService-Info.plist` están versionados; la clave de Google Places está escrita en código (`'APIKEY'` en `app/extra/useMarkers.tsx`) | Media |
| Chatbot | `app/extra/chatbot.tsx` llama a un endpoint público de magicloops.dev; `services/chatbotService.ts` solo da respuestas fijas | Alta: sin control, sin auth ni moderación |
| Admin | El rol admin sale de `users.isAdmin`, leído en el cliente. La seguridad real depende de reglas de Firestore que no están en el repo | Crítica: hay que reimplementarlo con RLS |
| Identidad | `name: "MyApp"`, `slug: "MyApp"`, `scheme: "myapp"`; el redirect de auth apunta a `@jesse05/MyApp` (otra cuenta de Expo) | Bloqueante para las tiendas |
| Código | Archivos gigantes: `map.tsx` (1731 líneas), `manageUsers.tsx` (957). Mezcla de `firebase.ts` legado y `services/firebase/*` | Media |
| Notificaciones | `NotificationContext` es solo in-app (Firestore + RTDB); **no hay push real** (no está instalado `expo-notifications`) | Alta: el README promete push |

### Requisitos de las tiendas que hoy no se cumplen
- **Apple 4.8**: si se ofrece login con Google hay que ofrecer también **Sign in with Apple**.
- **Apple 1.2 / Google UGC**: la app tiene contenido generado por usuarios (feed, foro, chat), así que necesita **reportar contenido, bloquear usuarios, filtrar contenido y aceptar términos (EULA)**. No existe nada de esto.
- **Borrado de cuenta**: existe en `settings` pero solo borra el usuario de Auth, no sus datos. Google Play además pide una **URL web** para solicitar el borrado.
- **Privacidad**: falta la política de privacidad (URL pública), el Privacy Manifest de iOS (`PrivacyInfo.xcprivacy`), el Data Safety de Play y los textos de permisos (`NSLocationWhenInUseUsageDescription`, cámara, fotos).
- **Metadatos**: icono final, splash, screenshots por tamaño de dispositivo, descripción, clasificación por edad y cuenta demo para los revisores.

## 2. Equipo de agentes

Definidos en `.claude/agents/`. El **tech-lead** orquesta y los demás ejecutan.

| Agente | Responsabilidad | Herramientas clave |
|---|---|---|
| `tech-lead` | Divide el roadmap en tareas, asigna, revisa PRs y mantiene este documento al día | GitHub, todos los agentes |
| `expo-upgrader` | Sube al SDK más reciente, deja `expo-doctor` en verde, migra a config plugins y adopta features nuevas de Expo | Expo MCP, consola, EAS |
| `supabase-architect` | Diseña el esquema Postgres, RLS, Storage, Realtime y Edge Functions, y migra datos desde Firebase | Supabase MCP, consola |
| `app-migrator` | Reescribe `services/` y hooks de Firebase a `supabase-js`, y elimina Firebase | Consola, tsc |
| `security-compliance` | Secretos, RLS, requisitos de Apple/Google (UGC, borrado de cuenta, privacidad, Sign in with Apple) | Supabase advisors, consola |
| `qa-engineer` | Tests unitarios y de integración, E2E con Maestro, matriz de regresión | Consola, Jest, Maestro |
| `release-manager` | `eas.json`, perfiles, credenciales, versionado, EAS Update, `eas submit`, fichas de las tiendas | EAS CLI, Expo MCP |

## 3. Fases

### Fase 1 — Base sana (bloquea todo lo demás)
- [x] Bundle ID/package `mx.foreign.app`, nombre "Foreign" y scheme `foreign`
- [ ] Enlazar `owner`/`projectId`/`updates.url` del proyecto Expo "foreign"
- [ ] Eliminar el chatbot (`app/extra/chatbot.tsx`, `services/chatbotService.ts`, `hooks/useChatbot.ts`, componentes y entradas de navegación)
- [ ] Arreglar los 18 errores de `tsc` y los checks de `expo-doctor`
- [ ] Quitar el override de `metro.config.js` y pasar los secretos a `EXPO_PUBLIC_*` / secretos de EAS
- [ ] CI en GitHub Actions: `tsc`, jest y `expo-doctor` en cada PR

### Fase 2 — Upgrade de Expo (`expo-upgrader`)
- [ ] Subir al SDK más reciente, un SDK por PR si hace falta, siguiendo los changelogs con el Expo MCP
- [ ] Migrar a `expo-image`, `expo-notifications` (push real) y `expo-apple-authentication`
- [ ] Development build con EAS en iOS y Android funcionando

### Fase 3 — Supabase (`supabase-architect` + `app-migrator`)
- [x] Proyecto creado: `Foreign` (`zoidnphuqxuvocoelrfj`, us-east-1), vacío
- [ ] Esquema: `profiles`, `posts`, `post_likes`, `comments`, `forum_questions`, `forum_answers`, `map_locations`, `mentors`, `chat_sessions`, `messages`, `notifications`, `friendships`, `raites`, `reports`, `blocks`
- [ ] RLS en todas las tablas; rol admin vía tabla `user_roles` o custom claim (nunca un flag editable por el cliente)
- [ ] Auth: email, Google y Apple; deep links con el scheme nuevo
- [ ] Storage: buckets `avatars` y `post-images` con políticas
- [ ] Realtime para chat y notificaciones; triggers que encolan push vía Edge Function
- [ ] Retirar Firebase y borrar los archivos `google-services.json` / `GoogleService-Info.plist`

### Fase 4 — Cumplimiento y calidad (`security-compliance` + `qa-engineer`)
- [ ] Reportar y bloquear, cola de moderación en el panel admin, aceptación de términos en el registro
- [ ] Borrado de cuenta completo (Edge Function que borra datos y Storage) + URL web de borrado
- [ ] Política de privacidad y términos publicados, Privacy Manifest, textos de permisos
- [ ] Partir `map.tsx` y `manageUsers.tsx`; estados de carga, error y vacío
- [ ] Monitoreo de errores (Sentry) y analítica básica
- [ ] E2E con Maestro de los flujos críticos: registro, login, post, foro, chat, borrar cuenta

### Fase 5 — Lanzamiento (`release-manager`)
- [ ] Perfiles de `eas.json` con variables por entorno (dev, preview, prod) y proyecto Supabase de staging
- [ ] Credenciales gestionadas por EAS; App Store Connect API key; service account de Play
- [ ] TestFlight + Play Internal Testing → cerrado → producción
- [ ] Fichas de las tiendas: textos, screenshots, clasificación por edad, Data Safety, cuenta demo
- [ ] EAS Update en el canal `production` para hotfixes

## 4. Decisiones del dueño (2026-10-18)
1. Bundle ID / package: **`mx.foreign.app`**; nombre visible "Foreign"; scheme `foreign`.
2. **Arranque en limpio**: no se migran datos de Firebase (se omite el script de migración).
3. **El chatbot queda fuera del lanzamiento**: se elimina la pantalla, el servicio y la ruta, y no se crea la Edge Function.
4. Expo: se usa el proyecto "foreign" que ya existe en la cuenta de Expo (falta enlazar su `projectId`/`owner` en `app.config.js`).
