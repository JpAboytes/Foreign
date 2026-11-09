# Foreign — Roadmap a producción

Estado: **Fase 3 (Supabase) en `main`; Firebase retirado** · Actualizado: 2026-10-28

## 1. Diagnóstico del estado actual

| Área | Hallazgo | Severidad |
|---|---|---|
| Stack | Expo SDK 53.0.12, RN 0.79.4, React 19.0, expo-router 5 (actualizado a SDK 58 el 2026-10-23) | Resuelto |
| Backend | Firebase 10.7 (JS SDK): Firestore (13 colecciones), Realtime DB (`messages`), Storage y Auth (email + Google) | Se migra a Supabase |
| Calidad | `tsc` da **18 errores**; `expo-doctor` falla 4 de 18 checks (esquema de config, `metro.config.js` con override, versiones nativas) | Alta |
| Tests | 1 solo test (plantilla `StyledText-test.js`) | Alta |
| Secretos | `MyApp/.env` está ignorado por el `.gitignore` raíz, pero `google-services.json` y `GoogleService-Info.plist` están versionados; la clave de Google Places está escrita en código (`'APIKEY'` en `app/extra/useMarkers.tsx`) | Media |
| Chatbot | `app/extra/chatbot.tsx` llama a un endpoint público de magicloops.dev; `services/chatbotService.ts` solo da respuestas fijas | Alta: sin control, sin auth ni moderación |
| Admin | El rol admin sale de `users.isAdmin`, leído en el cliente. La seguridad real depende de reglas de Firestore que no están en el repo | Crítica: hay que reimplementarlo con RLS |
| Identidad | `name: "MyApp"`, `slug: "MyApp"`, `scheme: "myapp"`; el redirect de auth apunta a `@jesse05/MyApp` (otra cuenta de Expo) | Bloqueante para las tiendas |
| Código | Archivos gigantes: `map.tsx` (1731 líneas), `manageUsers.tsx` (957). Mezcla de `firebase.ts` legado y `services/firebase/*` | Media |
| Notificaciones | `NotificationContext` es solo in-app (Firestore + RTDB); push real en la app vía `expo-notifications` (registro de token en `push_tokens`, listeners y navegación en `services/pushService.ts`); falta validarlo en dispositivo y programar el envío | Alta: el README promete push |

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
- [x] Eliminar el chatbot (`app/extra/chatbot.tsx`, `services/chatbotService.ts`, `hooks/useChatbot.ts`, componentes y entradas de navegación)
- [x] Errores de `tsc` corregidos (18 → 0) y `expo-doctor` en verde (SDK 58)
- [x] `metro.config.js` y `babel.config.js` eliminados (solo tenían valores por defecto; Firebase ya bundlea con package exports). Clave de Google Places ya en `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`; pendiente: crearla en Google Cloud y definirla con `eas env:create`
- [x] CI en GitHub Actions: `tsc`, jest y `expo-doctor` en cada PR (`.github/workflows/ci.yml`)

### Fase 2 — Upgrade de Expo (`expo-upgrader`)
- [x] Subir al SDK más reciente: SDK 58 (React Native 0.88, React 19.3, TypeScript 6, Reanimated 4 + worklets); `expo-doctor` vuelve a ser bloqueante en CI y la CI usa Node 22
- [ ] Migrar a `expo-image` y `expo-apple-authentication` (`expo-notifications` ya instalado: push real, ver Fase 3) — `expo-image` hecho (2026-11-06): dependencia añadida y todos los `Image` de react-native (app/ y components/) migrados a `expo-image` con `contentFit`, `cachePolicy="memory-disk"` y `transition={200}`; pendiente de validar visualmente en dispositivo. `expo-apple-authentication` ya está instalado, en el plugin de `app.config.js` y usado en `services/auth.ts` (Sign in with Apple, Fase 3); la casilla sigue abierta hasta confirmarlo en un build de dispositivo
- [ ] Development build con EAS en iOS y Android funcionando

### Fase 3 — Supabase (`supabase-architect` + `app-migrator`)
- [x] Proyecto creado: `Foreign` (`zoidnphuqxuvocoelrfj`, us-east-1), vacío
- [x] Esquema (migraciones `supabase/migrations/2026102000000{1,2,3}`, aplicadas en `zoidnphuqxuvocoelrfj`): `profiles`, `posts`, `post_likes`, `comments`, `forum_questions`, `forum_answers`, `map_locations`, `mentors`, `chat_sessions`, `messages`, `notifications`, `friendships`, `raites`, `reports`, `blocks`
- [x] RLS en todas las tablas; rol admin vía tabla `user_roles` o custom claim (nunca un flag editable por el cliente)
- [~] Auth: email, Google y Apple; deep links con el scheme nuevo — código en `main` (cliente, `services/auth.ts`, perfiles, avatar en Storage, Sign in with Apple). Apple y Google (web + iOS) ya configurados en Supabase; login con email probado en local (2026-10-28); falta el cliente Android de Google (tras el primer build de EAS)
- [x] Migrar todos los dominios de la app a Supabase (auth/perfiles, posts/feed, foro, mapa, mentores/chat, amistades/notificaciones, admin/ajustes, raites); entró a `main` en #28 el 2026-10-28. Migraciones 0001–0011 aplicadas. Pendientes: marcar mensajes como leídos al abrir un chat, probar con un usuario admin real (el borrado de Storage al eliminar cuenta está en Fase 4)
- [x] Storage: buckets `avatars` y `post-images` con políticas
- [~] Realtime para chat y notificaciones; trigger que encola push en `push_queue` (migración `20261021000005` aplicada en `zoidnphuqxuvocoelrfj`) y Edge Function `send-push` desplegada (`supabase/functions/send-push`). La app ya registra/borra `push_tokens` (`expo-notifications`, `services/pushService.ts`) y navega al tocar la notificación. Pendiente: programar la invocación de `send-push` (pg_cron / Database Webhook) y validar el push de punta a punta en un build de desarrollo (`eas build --profile development`; requiere credenciales APNs/FCM)
- [x] Retirar Firebase: dependencia `firebase`, `firebase.ts`, `services/firebase/`, `metro.config.js`, `extra.firebase`, `google-services.json` y `GoogleService-Info.plist` eliminados (2026-10-28)

### Fase 4 — Cumplimiento y calidad (`security-compliance` + `qa-engineer`)
- [~] Reportar y bloquear: `services/moderationService.ts` (reportar, bloquear, desbloquear) con tests; en las publicaciones del feed se puede reportar y bloquear al autor y el feed oculta a los bloqueados. Ampliado (rama `agents/2026-11-04-reportar-bloquear-ampliado`): reportar/bloquear en comentarios, foro (preguntas y respuestas) y perfiles, con `ModerationActions`/`useModeration` compartidos; el foro y los comentarios ocultan a bloqueados; pantalla `extra/blockedUsers` desde Configuración (`listBlockedUsers`). Pendiente: chat/mensajes, probar con dos usuarios reales. Cola de moderación en el panel admin (`(adminTabs)/reports.tsx`, `listOpenReports`/`resolveReport`, con tests); migración `20261103000014` aplicada en `zoidnphuqxuvocoelrfj` (2026-11-03); pendiente probarla con un admin real · [~] Aceptación de términos en el registro: migración `20261101000013` (columnas `terms_accepted_at`/`terms_version`; el trigger `handle_new_user` fecha la aceptación), casilla en `SignupForm`, pantalla `TermsGate` para altas con Google/Apple, `docs/web/terminos.html` (borrador por revisar por el dueño/abogado) y `EXPO_PUBLIC_TERMS_URL`. Migración aplicada en `zoidnphuqxuvocoelrfj` (2026-11-01) y advisors sin avisos nuevos. Pendiente: probar RLS con dos usuarios, publicar `terminos.html` y fijar `EXPO_PUBLIC_TERMS_URL`, revisión legal del texto
- [~] Borrado de cuenta completo: Edge Function `delete-account` (borra Storage `avatars`/`post-images` y luego `auth.users`; el JWT define el usuario) y `deleteMyAccount` la invoca, con test; página `docs/web/borrar-cuenta.html` lista. Función desplegada en `zoidnphuqxuvocoelrfj` (verify_jwt activo, 2026-10-29) y migración 0012 revoca `delete_my_account` a `authenticated`. Pendiente: probar el borrado de punta a punta con un usuario real, publicar la URL (y darla en Play Console), confirmar el correo `privacidad@foreign.mx` y enrutar `admin_delete_user` por una función que también limpie Storage
- [~] Política de privacidad y términos publicados (borrador `docs/web/privacidad.html` creado y enlazado desde registro y TermsGate con `EXPO_PUBLIC_PRIVACY_URL`; pendiente: revisión legal, confirmar `privacidad@foreign.mx` y publicar las URL públicas) · [x] Privacy Manifest y textos de permisos (es-MX) en `app.config.js`
- [~] Partir `map.tsx` (hecho: 1578 → 189 líneas, hooks y componentes en `components/map/`) y `manageUsers.tsx` (hecho: 896 → 102 líneas; `hooks/useManageUsers.ts`, `utils/adminFilters.ts` con tests y `components/admin/`); estados de carga, error y vacío (pendiente: pantalla de error con reintento en manageUsers y en map)
- [ ] Monitoreo de errores (Sentry) y analítica básica
- [ ] E2E con Maestro de los flujos críticos: registro, login, post, foro, chat, borrar cuenta

### Fase 5 — Lanzamiento (`release-manager`)
- [~] Perfiles de `eas.json` con entorno y canal por perfil (development/preview/production; variables con `eas env:create --environment <env>`) — hecho 2026-11-04. Pendiente: proyecto Supabase de staging (el plan puede generar gasto; decisión del dueño) y crear las variables en EAS
- [ ] Credenciales gestionadas por EAS; App Store Connect API key; service account de Play
- [ ] TestFlight + Play Internal Testing → cerrado → producción
- [ ] Fichas de las tiendas: textos, screenshots, clasificación por edad, Data Safety, cuenta demo
- [ ] EAS Update en el canal `production` para hotfixes

## 4. Decisiones del dueño (2026-10-18)
1. Bundle ID / package: **`mx.foreign.app`**; nombre visible "Foreign"; scheme `foreign`.
2. **Arranque en limpio**: no se migran datos de Firebase (se omite el script de migración).
3. **El chatbot queda fuera del lanzamiento**: se elimina la pantalla, el servicio y la ruta, y no se crea la Edge Function.
4. Expo: se usa el proyecto "foreign" que ya existe en la cuenta de Expo (falta enlazar su `projectId`/`owner` en `app.config.js`).
