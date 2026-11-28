# Fichas de las tiendas (borradores)

Estado: **borradores para revisión del dueño** (2026-11-28). No se ha enviado nada a App Store Connect ni a Play Console (ni `eas submit` ni `eas metadata:push`). Casilla del roadmap: Fase 5, "Fichas de las tiendas" (`[~]`).

## Índice
| Archivo | Contenido |
|---|---|
| `listing.es-MX.md` | Textos de la ficha en español (nombre, subtítulo, descripciones, keywords, promo, categoría, URLs) |
| `listing.en-US.md` | Los mismos textos en inglés |
| `privacidad-tiendas.md` | Borrador de App Privacy (Apple) y Data Safety (Google) |
| `clasificacion-edad.md` | Respuestas propuestas al cuestionario de Apple e IARC de Google |
| `cuenta-demo.md` | Procedimiento de la cuenta demo y notas para revisores (es/en) |

Páginas web ya redactadas (borrador, sin publicar): `docs/web/privacidad.html`, `docs/web/borrar-cuenta.html`, `docs/web/terminos.html`.

## Qué falta para completar la casilla
1. Revisión y aprobación del dueño de todos los textos y de las respuestas de privacidad y edad (ver "Dudas" en cada archivo).
2. Publicar `docs/web/*.html` en un dominio público y reemplazar las URLs marcadas PENDIENTE (soporte, marketing, privacidad, borrado de cuenta, términos). Validar el buzón privacidad@foreign.mx (hoy es un marcador).
3. Producir los assets gráficos de la lista de abajo (screenshots reales de un build de preview/TestFlight, feature graphic).
4. Crear la cuenta demo en el entorno real con datos semilla (`cuenta-demo.md`) y cargar las credenciales en las consolas (nunca en git).
5. Capturar las respuestas en App Store Connect y Play Console, solo con aprobación explícita del dueño; la promoción a revisión y producción también requiere esa aprobación.
6. Decidir el titular del copyright, el nombre del vendedor/desarrollador y la edad mínima (pendientes legales ya anotados en la política de privacidad).

## Checklist de assets
Dimensiones del icono verificadas el 2026-11-28 leyendo la cabecera del PNG (sin librerías de imagen; el PNG es de paleta, 8 bits, y no contiene bloque `tRNS`, es decir, sin transparencia).

| Asset | Requisito | Archivo actual | Estado |
|---|---|---|---|
| Icono iOS | 1024x1024 PNG, sin canal alfa | `MyApp/assets/images/icon.png`: 1024x1024, PNG de paleta, sin `tRNS` | Cumple (sin alfa) |
| Icono Play | 512x512 PNG (32 bits, máx. 1 MB) | Se exporta desde `icon.png` (1024x1024) reducido a 512x512 | Falta exportar; origen válido |
| Icono adaptativo Android | 1024x1024 con primer plano en zona segura | `MyApp/assets/images/adaptive-icon.png`: 1024x1024, PNG de paleta | Dimensiones cumplen; revisar el recorte en un emulador |
| Feature graphic Play | 1024x500 PNG/JPG, sin alfa | No existe | Falta |
| Screenshots iPhone 6.9" | 1320x2868 (o 1290x2796), 3 a 10 | No existen | Falta |
| Screenshots iPhone 6.5" | 1284x2778 o 1242x2688, 3 a 10 (Apple las pide si no se dan las de 6.9") | No existen | Falta |
| Screenshots iPad 13" | 2064x2752 (o 2048x2732), 3 a 10; obligatorias porque `ios.supportsTablet: true` | No existen | Falta (o poner `supportsTablet: false` si no se quiere dar soporte a iPad; decisión del dueño) |
| Screenshots Android teléfono | 2 a 8, lado menor mínimo 320 px, relación máx. 2:1 (recomendado 1080x1920 o mayor) | No existen | Falta |
| Screenshots tableta Android 7" y 10" | Opcionales (recomendadas) | No existen | Opcional |

Pantallas sugeridas para las capturas (con cuenta demo y datos semilla): feed, foro con pregunta y respuestas, mapa con lugares, lista de mentores, chat, solicitud de raite, perfil. Usar solo datos ficticios y sin personas reales.

Notas: la versión de Apple valida dimensiones exactas; los tamaños pueden cambiar, confirmar en App Store Connect al subirlas. El icono no debe tener esquinas redondeadas pre-aplicadas.
