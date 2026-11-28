# App Privacy (Apple) y Data Safety (Google): borrador

Estado: borrador derivado del código al 2026-11-28 (`MyApp/app.config.js`, `MyApp/services/`, `supabase/migrations/`, `docs/web/privacidad.html`). No revisado por el dueño ni por asesoría legal. Coordinar con el agente `security-compliance`. Debe coincidir con la política de privacidad publicada; si cambia una, cambian las dos y el manifiesto de privacidad de iOS.

## Hechos del código que sustentan las respuestas
- Backend: Supabase (auth, base de datos, storage, funciones). Todo viaja por HTTPS (cifrado en tránsito).
- Inicio de sesión: correo y contraseña, Google, Sign in with Apple.
- Permisos: ubicación solo en uso (`ACCESS_COARSE/FINE_LOCATION`, `NSLocationWhenInUse`); cámara; fotos (`READ_MEDIA_IMAGES`); notificaciones. Sin ubicación en segundo plano.
- Ubicación: se lee en el dispositivo para centrar el mapa. `saveUserLocation` no persiste nada. Se guardan coordenadas solo si el usuario crea un lugar en el mapa (coordenadas del lugar) o una solicitud de raite (origen opcional y destino), y estas últimas son visibles solo para los amigos destinatarios (RLS). Al buscar lugares se envían coordenadas aproximadas y texto a Google Places (`googlePlacesService.ts`).
- Sentry (`services/monitoring.ts`): `sendDefaultPii: false`, `tracesSampleRate: 0.1`; solo activo si hay DSN. Envía errores y diagnóstico (tipo de dispositivo y SO, versión de la app, trazas), no se establece identidad de usuario en el código revisado.
- Sin SDK de analítica ni de publicidad; sin tracking entre apps (no se usa ATT).
- Borrado de cuenta dentro de la app (Configuración) y por correo; borra perfil, contenido, mensajes, tokens y archivos.
- Moderación: reportar, bloquear, cola de reportes para admin, aceptación de términos (fecha y versión).

## Apple: App Privacy (etiquetas de nutrición)
Tracking: **No**. Ningún dato se usa para rastrear (no hay publicidad ni intercambio con data brokers). No se requiere ATT.

| Tipo de dato (categoría Apple) | Recolectado | Vinculado al usuario | Tracking | Propósito |
|---|---|---|---|---|
| Contact Info: Email Address | Sí | Sí | No | Funcionalidad de la app (cuenta e inicio de sesión) |
| Contact Info: Name | Sí | Sí | No | Funcionalidad (perfil visible a otros) |
| Identifiers: User ID | Sí | Sí | No | Funcionalidad (cuenta, relaciones, moderación) |
| Identifiers: Device ID (token push) | Sí | Sí | No | Funcionalidad (notificaciones push). Duda 3 |
| User Content: Photos or Videos | Sí | Sí | No | Funcionalidad (foto de perfil, publicaciones, fotos de lugares) |
| User Content: Other User Content | Sí | Sí | No | Funcionalidad (publicaciones, comentarios, foro, calificaciones, lugares, bio, universidad, origen, intereses) |
| User Content: Customer Support | Sí | Sí | No | Funcionalidad (reportes enviados a moderación). Duda 4 |
| Messages (Other User Content: mensajes) | Sí | Sí | No | Funcionalidad (chat con mentores y amigos). Apple lo clasifica como "Messages: Emails or Text Messages"; elegir "Other User Content" o "Messages" según la opción disponible |
| Location: Coarse Location | Sí (solo cuando se publica un lugar o raite o se busca con Places) | Sí | No | Funcionalidad (mapa, recomendaciones cercanas, raites). Duda 1 |
| Location: Precise Location | Sí (mismo caso; coordenadas exactas del GPS en raite/Places) | Sí | No | Funcionalidad. Duda 1 |
| Diagnostics: Crash Data / Performance Data / Other Diagnostic Data | Sí (Sentry, si hay DSN) | No, mientras no se asocie identidad. Duda 2 | No | Análisis y funcionalidad de la app (detección y corrección de errores) |
| Sensitive Info, Health, Financial, Contacts, Browsing/Search History, Purchases, Usage Data | No | n/a | n/a | n/a |

Notas: Sign in with Apple y Google pueden aportar correo (posiblemente relay privado), nombre y foto, ya contemplados arriba. El contenido de usuario (fotos, publicaciones) es público para otros usuarios; Apple lo trata como "recolectado" igualmente.

## Google Play: Data Safety
Preguntas generales:
- ¿La app recolecta o comparte datos requeridos? **Sí**.
- ¿Todos los datos se cifran en tránsito? **Sí** (HTTPS).
- ¿Los usuarios pueden pedir que se eliminen sus datos? **Sí**. URL de eliminación: PENDIENTE (publicar `docs/web/borrar-cuenta.html`); la app también ofrece borrado dentro de Configuración.
- Prácticas de seguridad: cifrado en tránsito; RLS por usuario. Cifrado en reposo lo da Supabase, pero no se declara como casilla de Play salvo que el dueño lo confirme.
- Compartir con terceros: ver notas. Los proveedores que tratan datos por cuenta de Foreign (Supabase, Expo/FCM/APNs, Sentry) se consideran **proveedores de servicio**, que Google no cuenta como "compartir". Google Places recibe coordenadas y texto de búsqueda: puede contar como compartir con un tercero. Duda 5.

| Categoría y tipo (Google) | Recolectado | Compartido | Opcional | Propósito |
|---|---|---|---|---|
| Personal info: Email address | Sí | No | No (necesario para la cuenta) | Funcionalidad de la app, Administración de cuentas |
| Personal info: Name | Sí | No | No | Funcionalidad, Administración de cuentas |
| Personal info: User IDs | Sí | No | No | Funcionalidad, Administración de cuentas |
| Personal info: Other info (universidad, origen, intereses, bio) | Sí | No | Sí | Funcionalidad |
| Location: Approximate location | Sí | Sí con Google Places al buscar (Duda 5) | Sí (permiso opcional) | Funcionalidad |
| Location: Precise location | Sí | Igual | Sí | Funcionalidad |
| Photos and videos: Photos | Sí | No | Sí | Funcionalidad |
| Messages: Other in-app messages | Sí | No | No | Funcionalidad |
| App activity: Other user-generated content (publicaciones, foro, calificaciones, lugares, reportes) | Sí | No | Sí | Funcionalidad, Seguridad y prevención de fraude (moderación) |
| App info and performance: Crash logs, Diagnostics | Sí (Sentry, si hay DSN) | No (proveedor de servicio) | No | Análisis |
| Device or other IDs (token push) | Sí | No (Expo/FCM/APNs como proveedores de servicio) | Sí (si se aceptan notificaciones) | Funcionalidad |
| Financial info, Health, Contacts, Calendar, Audio, Files, Web browsing | No | n/a | n/a | n/a |

Funciones declaradas de la app: contenido generado por usuarios (UGC), con enlace a la política y mecanismos de reporte y bloqueo (política de UGC de Google).

## Manifiesto de privacidad de iOS
`app.config.js` declara `NSPrivacyAccessedAPITypes` (UserDefaults CA92.1, FileTimestamp C617.1, DiskSpace E174.1, SystemBootTime 35F9.1). Falta verificar en un build real que el `PrivacyInfo.xcprivacy` agregado coincida con los de las dependencias (Sentry incluye el suyo) y que `NSPrivacyTracking` sea false.

## Dudas para el dueño
1. Ubicación: ¿se declara como precisa y gruesa? Propuesta: ambas, porque el GPS exacto se guarda en raites (origen opcional) y se envía a Places.
2. Sentry: ¿se asocia algún identificador de usuario (`Sentry.setUser`)? En el código revisado no. Si se agrega, pasar diagnóstico a "vinculado al usuario". Confirmar también que DSN estará activo en producción.
3. Token push: Apple lo trata como Device ID; confirmar si se declara así.
4. Reportes: se guardan con el ID del autor; confirmar la retención (la política dice "por definir").
5. Google Places: ¿contar como compartición con terceros en Play? Propuesta conservadora: sí, para ubicación aproximada.
6. Edad mínima y menores: la política dice "no dirigida a menores de 13" pero falta fijar la edad mínima (ver `clasificacion-edad.md`). Si la app se dirige a menores, cambian las reglas de Families y de Data Safety.
7. Copias de seguridad de Supabase y su plazo de retención.
8. Verificar que ninguna librería nueva agregue analítica o publicidad antes de publicar (la política lo dice "por reconfirmar").
