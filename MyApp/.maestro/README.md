# Pruebas E2E con Maestro

Flujos críticos de Foreign (`appId: mx.foreign.app`): registro, login, crear post, foro, chat y borrar cuenta.

## Requisitos
- [Maestro CLI](https://maestro.mobile.dev) instalado.
- Un development o preview build de la app instalado en un emulador/simulador o dispositivo (no Expo Go).
- Un entorno de Supabase de pruebas sin confirmación de correo obligatoria (para el registro).
- Una foto en la galería del dispositivo (flujo de crear post).

## Usuarios de prueba y variables
Nada de credenciales en git. Maestro toma del shell las variables con prefijo `MAESTRO_`:

```bash
export MAESTRO_E2E_EMAIL="..."            # usuario existente, con al menos un amigo (chat)
export MAESTRO_E2E_PASSWORD="..."
export MAESTRO_E2E_SIGNUP_EMAIL="..."     # cuenta NUEVA: la crea el registro y la borra "borrar cuenta"
export MAESTRO_E2E_SIGNUP_PASSWORD="..."
```

El correo de registro debe estar libre antes de cada corrida.

## Correr
Desde `MyApp/`:

```bash
maestro test .maestro                       # todos, en el orden de config.yaml
maestro test .maestro/02_login.yaml         # un solo flujo
```

Los flujos 01 y 06 dependen entre sí (06 borra la cuenta que crea 01). Los flujos 03 a 05 usan el usuario compartido.

## testIDs
Los flujos usan `testID` estables (`login-email`, `signup-submit`, `forum-question-send`, `chat-send`, `settings-delete-confirm`, etc.). No los renombres sin actualizar los flujos.
