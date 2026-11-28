# Cuenta demo para revisores (procedimiento)

Estado: procedimiento. **No se ha creado ninguna cuenta.** No escribir contraseñas, tokens ni correos reales en este archivo ni en git. Las credenciales viven solo en App Store Connect, Play Console y en el gestor de contraseñas del dueño.

## 1. Crear la cuenta
1. Usar un correo dedicado que controle el dueño (por ejemplo un alias `revision@` del dominio de Foreign; PENDIENTE de definir) y una contraseña larga generada por un gestor.
2. Registrarla desde la app con correo y contraseña (los revisores no pueden depender de Google ni de Apple, así que debe poder entrar con correo). Aceptar los Términos en el registro.
3. Hacerlo contra el entorno que usarán los revisores (hoy el único: proyecto Supabase `zoidnphuqxuvocoelrfj`). Si hay confirmación de correo activa, confirmar el correo.
4. La cuenta debe ser un usuario normal, **no admin**. Opcional: una segunda cuenta admin demo para mostrar la moderación, solo si el dueño lo aprueba.
5. Registrar quién creó la cuenta y la fecha en un lugar privado, no en el repositorio.

## 2. Datos semilla (para que no se vea vacía)
Crearlos con cuentas auxiliares ficticias (2 o 3 usuarios "Demo ...") por la app o con SQL de semilla guardado fuera del repositorio. Usar contenido neutral, sin personas ni marcas reales.
- Perfil de la cuenta demo: nombre, universidad, origen, intereses y foto.
- Feed: 4 a 6 publicaciones, con y sin imagen, con algunos comentarios y me gusta.
- Foro: 3 preguntas con al menos 1 respuesta y comentarios.
- Mapa: 6 a 10 lugares de tipos distintos con calificaciones y fotos en una zona fija (la ciudad de la ficha). Aclarar a los revisores que la ubicación del dispositivo puede estar fuera de esa zona.
- Mentores: 2 a 3 mentores demo visibles en la lista de mentores, con un chat con mensajes de ejemplo.
- Amistades y chat: una amistad aceptada con una cuenta auxiliar, una conversación con 3 a 5 mensajes, y una solicitud de amistad pendiente.
- Raites: al menos un amigo para poder abrir el flujo de pedir raite.
- Notificaciones: generar actividad (un comentario, un mensaje) para que haya notificaciones.
- Contenido para probar la moderación: una cuenta auxiliar "Demo Bloqueable" cuyo contenido el revisor pueda reportar y bloquear.
- Verificar el flujo completo en un build de preview antes de enviar. No usar la cuenta demo para borrar la cuenta (si se borra hay que recrearla): avisar en las notas que el borrado es real y existe una segunda cuenta "Demo Borrar" para probarlo, o dejar que lo prueben con su propio registro.

## 3. Dónde se captura
- **App Store Connect**: App > versión > App Review Information > Sign-in required: activar; Username y Password de la cuenta demo; Notes con el texto de abajo; contacto de revisión (nombre, correo y teléfono, PENDIENTE).
- **Play Console**: Policy and programs > App content > App access > "All or some functionality is restricted" > Add new instructions: usuario, contraseña y las instrucciones de abajo.
- Si se cambia la contraseña por seguridad, actualizarla en ambas consolas antes de cada envío; mantener la cuenta activa durante toda la revisión.

## 4. Notas para revisores (copiar a las consolas)

### Español (es-MX)
```
Cuenta demo: usuario y contraseña en los campos de acceso. Inicia sesión con correo y contraseña (no necesitas Google ni Apple).
Funciones: Feed, Foro, Mapa (recomendaciones), Mentores, Mensajes y Solicitudes de amistad (menú lateral), Perfil y Configuración.
Ubicación: es opcional; la app funciona sin el permiso. Los lugares de ejemplo están en [CIUDAD, PENDIENTE]. Para probar raites, abre el Mapa, activa la opción de raite, elige un destino y selecciona a un amigo.
Reportar: en cualquier publicación, comentario, pregunta, respuesta o perfil, abre el menú de opciones y elige Reportar, luego el motivo. El equipo de moderación revisa los reportes en un panel de administración.
Bloquear: en el perfil o en el menú del contenido de otra persona elige Bloquear. La lista de bloqueados está en la app (pantalla de usuarios bloqueados) y desde ahí puedes desbloquear.
Borrar cuenta: Configuración > Eliminar cuenta (pide la contraseña para confirmar). Se elimina de inmediato la cuenta y sus datos. Este paso es real: usa la cuenta "Demo Borrar" [credenciales PENDIENTES] si quieres probarlo. También hay una página pública con instrucciones: [URL PENDIENTE].
Términos: se aceptan al registrarse. Contacto de soporte: [PENDIENTE].
```

### English (en-US)
```
Demo account: username and password are in the sign-in fields. Sign in with email and password (Google or Apple are not required).
Features: Feed, Forum, Map (recommendations), Mentors, Messages and Friend requests (side menu), Profile and Settings.
Location: optional; the app works without the permission. Sample places are in [CITY, PENDING]. To try rides, open the Map, enable the ride option, pick a destination and choose a friend.
Report: on any post, comment, question, answer or profile, open the options menu and choose Report, then the reason. The moderation team reviews reports in an admin panel.
Block: on a person's profile or content menu choose Block. The blocked users list is in the app and you can unblock from there.
Delete account: Settings > Delete account (asks for the password to confirm). The account and its data are removed immediately. This is real: use the "Demo Delete" account [credentials PENDING] to test it. There is also a public page with instructions: [URL PENDING].
Terms: accepted at sign-up. Support contact: [PENDING].
```

## Verificar antes de usar las notas
Las rutas y etiquetas exactas (dónde está el menú de Reportar y Bloquear, nombre de la opción de raite, y si Eliminar cuenta pide contraseña para cuentas con correo) se tomaron de `docs/web/borrar-cuenta.html` y de la estructura de pantallas; confirmarlas en un build real y ajustar el texto.
