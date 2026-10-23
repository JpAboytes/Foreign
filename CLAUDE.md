# Foreign — guía para agentes

App móvil (Expo / React Native) para estudiantes foráneos: feed, foro, mapa de recomendaciones, mentores, chat, chatbot y "raites".
Objetivo actual: **llevarla a production-ready y publicarla en App Store y Google Play**, migrando de Firebase a Supabase.

Plan maestro y estado: `docs/PRODUCTION_ROADMAP.md` (fuente de verdad; actualízalo al cerrar cada tarea).

## Estructura
- `MyApp/` — la app Expo (todo el código vive aquí; ejecuta los comandos desde este directorio).
  - `app/` — rutas de expo-router: `(drawer)/(tabs)` usuario, `(drawer)/(adminTabs)` admin, `extra/` pantallas apiladas.
  - `services/` — acceso a datos. **Toda llamada al backend pasa por aquí**; las pantallas y los hooks no importan el SDK de backend directamente.
  - `hooks/`, `context/`, `components/`, `models/`, `utils/`.
- `.claude/agents/` — definiciones del equipo de agentes.

## Comandos (desde `MyApp/`, Node 22.13+)
- Instalar: `npm ci`
- Typecheck: `npx tsc --noEmit` (debe quedar en 0 errores)
- Salud del proyecto Expo: `npx expo-doctor`
- Tests: `npx jest --watchAll=false`
- Builds y envío a tiendas: `eas build -p <ios|android> --profile <development|preview|production>` y `eas submit`

## Infraestructura
- Supabase: proyecto `Foreign`, ref **`zoidnphuqxuvocoelrfj`** (us-east-1), organización JpAboytes. Por ahora es el único entorno; las variables públicas están en `MyApp/.env.example`.
- Expo/EAS: proyecto "foreign" en la cuenta de Expo (usa el Expo MCP y las skills de Expo para enlazarlo y consultar docs).
- Rama base: `main`. Una rama `agents/<AAAA-MM-DD>-<tarea>` por tarea, con PR contra `main`.

## Reglas
- Una rama y un PR por tarea del roadmap; un PR no mezcla upgrade de SDK, migración de backend y cambios de UI.
- Ningún secreto en git. Las variables públicas van con prefijo `EXPO_PUBLIC_`; las privadas (claves de LLM, la service role de Supabase) solo viven en Edge Functions o en los secretos de EAS.
- Supabase: todo cambio de esquema es una migración versionada en `supabase/migrations/`, y toda tabla nueva lleva RLS activado y políticas desde su creación.
- Antes de abrir un PR: `tsc` sin errores nuevos, `expo-doctor` sin regresiones y tests en verde.
- Textos de UI en español (es-MX).
