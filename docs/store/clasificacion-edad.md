# Clasificación por edad: respuestas propuestas (borrador)

Estado: propuesta para revisión del dueño (2026-11-28). Los cuestionarios cambian con frecuencia; reconfirmar cada pregunta en la consola al capturarla.

## Hechos del código relevantes
- Contenido generado por usuarios (UGC) sin filtro previo: feed, comentarios, foro, lugares del mapa con fotos, perfiles. Se publica de inmediato; no hay filtro automático de texto ni de imágenes.
- Chat directo entre usuarios (amigos y mentores). Puede incluir texto libre.
- Ubicación: el mapa lee la ubicación solo en uso. Se comparte con otros usuarios solo (a) el lugar que el usuario publica a propósito (visible a todos) y (b) en una solicitud de raite, el destino y el origen opcional, visibles solo para los amigos elegidos como destinatarios. No hay seguimiento en vivo ni ubicación en segundo plano.
- Moderación existente: reportar contenido o usuario (motivos: spam, acoso o discurso de odio, contenido sexual o violento, información falsa, otro), bloquear usuarios (con lista en la app), cola de reportes para admin, aceptación de Términos al registrarse (fecha y versión guardadas), borrado de cuenta in-app.
- Sin compras, sin publicidad, sin apuestas, sin acceso web abierto, sin contenido propio con violencia, sexo o drogas (el contenido de ese tipo solo podría venir de usuarios).

## Apple: cuestionario de clasificación (App Store Connect)
| Pregunta | Respuesta propuesta | Motivo |
|---|---|---|
| Frecuencia de: violencia caricaturesca o fantástica, violencia realista, violencia gráfica, armas, sexual/desnudez, desnudez, temas sexuales sugestivos, profanidad o humor crudo, temas de terror, alcohol/tabaco/drogas, apuestas simuladas, concursos | Ninguna en todas | La app no contiene contenido propio de estos tipos |
| Medicina o tratamientos | Ninguna | |
| Apuestas con dinero real / loterías | No | |
| Mensajería y chat | **Sí** | Chat entre usuarios |
| Contenido generado por usuarios | **Sí** | Feed, foro, perfiles, mapa |
| Publicidad | No | |
| Acceso web sin restricciones | No | |
| Controles parentales / verificación de edad | No (ver Duda 1) | |
| Compartir ubicación con otros | Sí, limitado (raites a amigos y lugares publicados) | Duda 2 |

Resultado esperado: con UGC y chat sin filtro previo, Apple suele subir la clasificación (típicamente 12+ o 17+ en el esquema nuevo 13+/16+/18+). Propuesta: **13+** (o 12+ en el esquema anterior), siempre que el dueño confirme que la moderación cumple 1.2 de las App Store Review Guidelines. Si Apple o el cuestionario fuerzan 17+/18+, aceptarlo en lugar de bajar respuestas.

Requisitos de la guía 1.2 (UGC), estado:
- Filtro de contenido objetable: **no hay filtro automático** (Duda 3).
- Mecanismo para reportar: sí. Bloquear usuarios: sí.
- Respuesta a reportes en 24 h: **por definir** (hay cola admin, falta compromiso operativo y responsable).
- Contacto de soporte visible: PENDIENTE de URL pública.
- Aceptación de términos que prohíben contenido objetable: sí (`TermsGate`); revisar que `docs/web/terminos.html` lo diga y se publique.

## Google Play: cuestionario IARC
Categoría: **Redes sociales, comunicación, o mensajería** (no "Juego"). Respuestas propuestas:

| Pregunta | Respuesta propuesta |
|---|---|
| Violencia, sexualidad/desnudez, lenguaje vulgar, sustancias controladas, miedo | No (contenido propio) |
| ¿Los usuarios pueden interactuar o intercambiar contenido? | **Sí** |
| ¿Se comparte la ubicación del usuario con otros usuarios? | **Sí, limitado**: raite a amigos elegidos y lugares publicados por el usuario (Duda 2) |
| ¿Se pueden hacer compras digitales? | No |
| ¿Contiene publicidad? | No |
| Apuestas / juegos de azar | No |
| Funciones de redes sociales con contenido sin moderar | Sí (hay moderación reactiva, no previa) |

Resultado esperado: IARC suele dar **Teen / PEGI 12 / ESRB Teen / "Interacción de usuarios" y "Comparte ubicación"** como descriptores. Aceptar el resultado de la calculadora.

Otras declaraciones de Play: público objetivo 18+ o 13+ (ver Duda 1; no marcar menores de 13 para evitar la política Families), UGC con reporte y bloqueo, URL de eliminación de cuenta, no es app de noticias ni de salud.

## Dudas para el dueño
1. Edad mínima y público objetivo. La app apunta a estudiantes de nivel superior, así que se propone público objetivo **18+** (y clasificación de contenido 13+ por UGC) o, si se acepta preparatoria, 13+/16+. Falta decidirlo con asesoría legal y reflejarlo en términos y política.
2. Compartir ubicación: confirmar la descripción propuesta (solo lugares publicados y raites a amigos) al responder ambos cuestionarios.
3. Moderación: ¿se agregará un filtro de palabras o imágenes antes de publicar? Hoy es solo reactiva. Falta SLA de 24 h y responsable que revise la cola.
4. Si algún revisor pide más restricción (por ejemplo, ocultar chat a menores), ¿se acepta subir la clasificación?
