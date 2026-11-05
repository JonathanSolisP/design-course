# Actividad: Auditoría de seguridad de LabReserva

**Instituto Tecnológico de Costa Rica** · Campus Tecnológico San Carlos · Ingeniería en Computación
**Curso:** Diseño de Software · **Profesor:** Ing. Jonathan Solís Parajeles

- **Fecha:** jueves 12 de noviembre de 2026, en clase
- **Entrega de las Partes A y B:** al final de la clase
- **Entrega de la Parte C:** jueves 19 de noviembre de 2026, 12:30 p. m.
- **Modalidad:** Partes A y B en grupos de 3 o 4 · Parte C individual o en parejas
- **Valor porcentual:** ____%

---

## Contexto

La escuela contrató a un equipo externo para construir **LabReserva**, un sistema para reservar laboratorios. El equipo trabajó con prisa y el sistema **sale a producción la próxima semana**. La dirección les pidió a ustedes, como equipo de seguridad, que lo auditen antes del lanzamiento.

Les entregaron el código (`Semana 14/labreserva-api`) y **una sola cuenta de estudiante**. El sistema funciona, pero tiene fallas de seguridad. Su trabajo es encontrarlas, demostrar que son reales, explicar por qué existen y corregirlas en la capa que corresponde.

```
Parte A (25')              Parte B (60')                 Parte C (en casa)
Modelar amenazas   ──►     Cazar y demostrar     ──►     Corregir y documentar
solo con el README         con el código y la API        cada control en su capa
```

## Reglas de enganche

> ⚠️ **Lean esto antes de empezar.**

1. Todo se hace **contra su propia copia local** (`localhost`). Nunca contra la máquina de otro grupo, la red del TEC ni ningún sistema real.
2. Las técnicas de esta actividad son ilegales contra sistemas sin autorización por escrito del dueño. Aquí la autorización existe solo para LabReserva en su computadora.
3. No publique el proyecto en internet, ni siquiera "para probar".
4. Si rompe la base de datos, reinicie el servidor: los datos vuelven al estado inicial.

## Puesta en marcha

```bash
cd "Semana 14/labreserva-api"
npm install
npm run dev
```

Abrir <http://localhost:3000> e iniciar sesión con `ana@labreserva.test` / `ana12345`. El `README.md` del proyecto describe los roles y los endpoints, y `requests.http` trae ejemplos listos.

---

## Parte A: Modelo de amenazas antes de mirar el código (en grupo, 25')

Un atacante real no empieza leyendo el código. En esta parte **solo pueden leer el `README.md`** del proyecto y usar la aplicación como Ana.

### A.1 DFD (10')

Dibujar el diagrama de flujo de datos de LabReserva (papel, pizarra o [draw.io](https://app.diagrams.net/)):

- **Entidades externas:** quién usa el sistema (piense en los tres roles y en alguien sin cuenta).
- **Procesos:** el frontend en el navegador y la API.
- **Almacenes:** la base de datos, los manuales en disco, la configuración.
- **Flujos:** login, reservas, comentarios, descargas, administración.
- **Fronteras de confianza** con línea punteada: ¿dónde pasan los datos de "no confiable" a "confiable"?

### A.2 Hipótesis STRIDE (15')

Para cada elemento del DFD, preguntar qué podría salir mal. Escribir **al menos 8 hipótesis**, con **al menos una por letra** de STRIDE.

| # | Elemento | STRIDE | Hipótesis: "Un atacante podría..." | Cómo lo probaríamos |
|---|---|---|---|---|
| H1 | `GET /api/reservations/:id` | I | ...ver la reserva de otro usuario cambiando el id | Pedir ids cercanos a los de Ana |
| H2 | | | | |

> 💡 Las hipótesis no tienen que ser correctas. Al final de la Parte B van a marcar cuáles se confirmaron, y comparar el modelo con la realidad es parte del aprendizaje.

---

## Parte B: Cacería de vulnerabilidades (en grupo, 60')

Ahora sí pueden leer **todo el código**. Recomendado: arrancar por sus hipótesis y luego recorrer el código módulo por módulo.

### Herramientas

- La propia aplicación en el navegador y sus **DevTools** (pestañas Network, Application → Local Storage y Console).
- `requests.http` con REST Client, Postman o `curl`.
- [jwt.io](https://jwt.io) para inspeccionar tokens.
- `npm audit` para las dependencias.
- Nada más: no hace falta instalar herramientas de hacking.

### Qué cuenta como hallazgo

Un hallazgo vale **solo si está demostrado**: los pasos exactos para reproducirlo y la evidencia (respuesta de la API, captura o salida de la terminal). "Creemos que podría haber inyección" no cuenta; "con este request obtuvimos los emails de todos los usuarios" sí.

### Formato de cada hallazgo

Copiar este bloque una vez por hallazgo en `HALLAZGOS.md`:

```markdown
## H-01: <título corto, por ejemplo "Un estudiante puede ver reservas ajenas">

- **Severidad:** Crítica | Alta | Media | Baja
- **STRIDE:** S | T | R | I | D | E
- **OWASP Top 10:2025:** A0X <nombre>
- **Dónde:** `src/modules/.../archivo.js`, línea N
- **Hipótesis de la Parte A que confirma:** H# (o "ninguna: no la vimos venir")

**Pasos para reproducir**
1. ...
2. ...

**Evidencia**
(request y respuesta, o captura)

**Impacto:** qué puede hacer un atacante con esto, en una o dos frases.

**Causa raíz:** qué decisión de diseño o de código lo permite.

**Corrección propuesta:** qué cambiar y **en qué capa** (middleware, validación, ruta, repository, configuración, frontend, dependencias).
```

### Cómo decidir la severidad

| Severidad | Criterio |
|---|---|
| **Crítica** | Sin ayuda de nadie, el atacante toma control de cuentas ajenas o de administrador, o lee o borra datos de todos |
| **Alta** | Expone datos sensibles de otros usuarios, o permite modificar o borrar recursos ajenos |
| **Media** | Facilita otros ataques o filtra información útil para el atacante |
| **Baja** | Debilidad real pero difícil de explotar o de poco impacto |

### Puntuación

| Severidad | Puntos por hallazgo |
|---|---|
| Crítica | 5 |
| Alta | 3 |
| Media | 2 |
| Baja | 1 |
| **Cadena**: dos o más hallazgos combinados en un ataque de mayor impacto | +3 |

El profesor lleva la tabla de posiciones en la pizarra. Un hallazgo duplicado (misma causa raíz en otra línea) cuenta una sola vez. La severidad la valida el profesor.

> 💡 **Cada 15 minutos** el profesor revela una pista general para los grupos que estén atascados.

### Entregable de las Partes A y B

Un `HALLAZGOS.md` (o PDF) por grupo, con los integrantes, que contenga:

1. El DFD y la tabla de hipótesis de la Parte A, con cada hipótesis marcada como ✅ confirmada, ❌ descartada o ⏳ sin probar.
2. Todos los hallazgos con el formato anterior, ordenados por severidad.
3. Un párrafo final: **¿qué falla de diseño, no de código, explica la mayoría de los hallazgos?**

---

## Parte C: Corrección (individual o en parejas, para la próxima semana)

Partiendo de LabReserva sin modificar, en un repositorio propio:

1. Corregir **todos los hallazgos Críticos y Altos** del grupo, y **al menos 3** de severidad Media o Baja.
2. Un **commit por hallazgo**, con el ID en el mensaje (`fix(H-03): validar el rol en DELETE /admin/users`).
3. Por cada corrección, agregar a `requests.http` una sección `### H-0X` con el **mismo request del ataque**, que ahora debe fallar con el código HTTP correcto.
4. Cada control va **en la capa que le corresponde**. Por ejemplo, la autorización no se resuelve escondiendo un botón en el frontend, y un rate limit no va dentro de la ruta.

### `SEGURIDAD.md`

- Una tabla: hallazgo → corrección → archivo y capa → request que lo prueba.
- **Dos ADR** con el formato *Contexto · Decisión · Alternativas consideradas · Consecuencias*, para las dos correcciones con más trade-offs. Ideas: cómo hashear contraseñas, dónde guardar el token en el frontend, qué hacer con las sesiones ya emitidas cuando se cambia el secreto del JWT.
- Los hallazgos que **no** corrigió, con su riesgo residual y por qué se aceptan por ahora.

### Restricciones

- No se vale "corregir" quitando la funcionalidad: la búsqueda sigue buscando, los manuales se siguen descargando y el directorio sigue existiendo para los profesores.
- Si cambia la forma en que se guardan las contraseñas, los usuarios del seed tienen que poder seguir entrando.
- Se pueden agregar dependencias (por ejemplo `helmet`, `express-rate-limit`, `bcryptjs`, `zod`), justificándolas en el `SEGURIDAD.md`.

---

## Evaluación

| Rubro | Valor |
|---|---|
| **Partes A y B (grupo)** | **45 %** |
| DFD y al menos 8 hipótesis STRIDE, marcadas al final | 10 % |
| Hallazgos: puntos obtenidos (escalados al máximo del curso) | 25 % |
| Calidad del reporte: reproducible, causa raíz y corrección en la capa correcta | 10 % |
| **Parte C (individual o parejas)** | **55 %** |
| Correcciones de los Críticos y Altos | 25 % |
| Correcciones adicionales (Media o Baja) | 10 % |
| `requests.http`: cada ataque ahora falla con el código correcto | 10 % |
| `SEGURIDAD.md`: tabla, dos ADR y riesgo residual | 10 % |

**Criterio transversal:** si una corrección queda en la capa equivocada (validar el rol solo en el frontend, armar SQL "más seguro" concatenando strings, desactivar un endpoint en vez de protegerlo), se pierde hasta la mitad del puntaje de esa corrección.

## Aspectos administrativos

- Se puede conversar sobre ideas con otros grupos, pero los entregables son propios. Compartir hallazgos entre grupos durante la Parte B anula los puntos de ambos.
- En caso de fraude, ya sea provocado o consentido, la actividad será anulada para todos los involucrados, de acuerdo con el Artículo 75 del Reglamento del Régimen de Enseñanza-Aprendizaje del ITCR.
- Se permite usar asistentes de IA, pero cada estudiante debe poder **explicar y reproducir en vivo** cualquier hallazgo y cualquier corrección.
- Las entregas tardías se penalizan con un 10 % de la nota por cada hora de retraso.
- Todo se entrega en la plataforma oficial del curso.
