# Intro Galaxy — prototipo aislado

Prototipo de portada animada para el portafolio Hypercube. Presenta los
proyectos como **peces en una pecera**: tarjetas que nadan dentro de un área
segura, se separan entre sí, reaccionan al puntero y se pueden ampliar con un
clic. También conserva un modo galaxia/espiral como alternativa.

- **No modifica** el `index.html` principal del portafolio.
- Es una página independiente dentro de `intro-galaxy/`.
- Usa **CSS 3D + JavaScript vanilla**, sin Three.js ni frameworks.
- Incluye una **lista accesible** de proyectos y un fallback sin JavaScript.
- Está marcada con `noindex, nofollow` mientras sea un prototipo.

## Cómo ejecutarlo

Sírvelo desde la **raíz del portafolio** para que el enlace “Volver al portafolio”
resuelva correctamente:

```bash
cd "/home/ernesto/Documents/VSCode Workspace/html/hypercubecommx"
python3 -m http.server 8080
```

Abre `http://localhost:8080/intro-galaxy/`.

También puedes usar VS Code Live Server abriendo `intro-galaxy/index.html`.
En ese caso el enlace de vuelta al portafolio puede no resolver, pero el
prototipo funciona igual.

### Flags de diagnóstico

| URL | Efecto |
|-----|--------|
| `?debug=1` | Muestra FPS, tarjetas activas y videos reproduciéndose |
| `?freeze=1` | Congela la animación en un fotograma determinista |
| `?static=1` | Fuerza el modo detenido |
| `?reduced=1` | Fuerza el modo de movimiento reducido |

## Estructura

```text
intro-galaxy/
├── index.html
├── config.js              # proyectos, videos y parámetros
├── css/galaxy.css         # estilos del escenario 3D
├── js/galaxy-core.js      # geometría pura (probada con Node)
├── js/galaxy.js           # controlador de animación e interacción
├── tests/core.test.js     # pruebas del motor de geometría
├── tools/optimize-video.sh
└── assets/
    ├── videos/            # clips .webm / .mp4
    └── posters/           # posters .webp
```

## Modos de movimiento

`config.js` define `layout.motionMode`:

- **`bowl` (por defecto):** pecera. Las tarjetas nadan dentro de un elenco
  elíptico seguro, con velocidad variable, giros suaves, separación entre
  ellas, resolución de colisiones con solapamiento máximo configurable,
  rebote ligero, profundidad, flotación y una zona central reservada para la
  portada. No se pierden en los bordes.
- **`galaxy`:** la espiral original de tarjetas viajando hacia afuera.

Puedes probar el modo galaxia sin editar el archivo:

`http://localhost:8080/intro-galaxy/?mode=galaxy`

## Cubo flotante

El prototipo reutiliza el SVG original del sitio como elemento decorativo
flotante sobre la portada. El archivo se copió a `assets/hypercube.svg` para
que el prototipo sea autocontenido. Tiene:

- Flotación vertical continua.
- Giro suave.
- Inclinación ligera que sigue al puntero.
- Pausa cuando la animación está pausada.
- Desactivación automática con `prefers-reduced-motion`.

Se configura en `config.js`:

```js
cube: {
  enabled: true,
  src: 'assets/hypercube.svg',
  tiltMaxX: 12,
  tiltMaxY: 16,
  floatOffset: 6
}
```

Pon `enabled: false` para ocultarlo. El SVG es una copia del asset original
dentro de `assets/`, así que el prototipo funciona aunque se sirva desde su
propia carpeta.

## Añadir tus videos

1. Coloca el clip original en cualquier carpeta temporal.
2. Ejecuta:

```bash
./tools/optimize-video.sh /ruta/al/clip.mp4 gw2
```

Esto genera:

- `assets/videos/gw2.webm` (VP9, sin audio)
- `assets/videos/gw2.mp4` (H.264 de respaldo)
- `assets/posters/gw2.webp` (poster)

3. Edita `config.js` y rellena el proyecto correspondiente:

```js
{
  id: 'gw2',
  title: 'GW2 Roster Manager',
  video: 'assets/videos/gw2.webm',
  videoMp4: 'assets/videos/gw2.mp4',
  poster: 'assets/posters/gw2.webp'
}
```

Si dejas `video` vacío, la tarjeta usa el poster o un degradado generado.

### Especificaciones recomendadas

- **Cantidad:** 6 a 8 clips.
- **Duración:** 4 a 8 segundos en bucle.
- **Resolución:** 960×600 o 1280×800. Evita 4K.
- **Peso:** menos de 1.5 MB por clip.
- **Audio:** sin audio (`-an`).
- **Formato:** WebM VP9/AV1 + MP4 H.264.
- **Contenido:** captura de la interfaz o animación breve; evita texto pequeño.

## Parámetros principales de `config.js`

| Parámetro | Qué controla |
|-----------|--------------|
| `motionMode` | `bowl` (pecera) o `galaxy` (espiral) |
| `bowlOuterXFrac` / `bowlOuterYFrac` | Límite exterior seguro del cuenco |
| `bowlInnerXFrac` / `bowlInnerYFrac` | Zona central reservada para la portada |
| `bowlSpeedDesktop` / `bowlSpeedMobile` | Velocidad base de nado |
| `bowlWanderAmp` / `bowlWanderFreq` | Cuánto y con qué frecuencia cambian de rumbo |
| `bowlSeparation` / `bowlSeparationForce` | Distancia mínima y fuerza entre tarjetas |
| `bowlOverlapFactor` | Máximo solapamiento permitido (`0.12` = 12%) |
| `bowlRestitution` | Rebote entre tarjetas (`0.25` = ligero) |
| `bowlCollisionIterations` | Iteraciones de resolución por fotograma |
| `bowlPointerRadius` / `bowlPointerForce` | Radio y fuerza de reacción al puntero |
| `bowlDepthAmp` / `bowlBobAmp` | Profundidad 3D y flotación vertical |
| `armsDesktop` / `armsMobile` | Brazos de la espiral (solo modo galaxia) |
| `cardCountDesktop` / `cardCountMobile` | Tarjetas simultáneas |
| `turnsDesktop` / `turnsMobile` | Vueltas por brazo (solo modo galaxia) |
| `journeysPerMinute*` | Velocidad de recorrido (solo modo galaxia) |
| `birthFrac` | Radio donde nacen las tarjetas (solo modo galaxia) |
| `rMaxFrac*` | Radio máximo antes de salir (solo modo galaxia) |
| `depth*` | Profundidad 3D (solo modo galaxia) |
| `blurMaxDesktop` | Desenfoque de entrada y salida (solo modo galaxia) |
| `tiltMaxDesktop` | Inclinación al mover el puntero (solo modo galaxia) |
| `spinDegPerSecond` | Giro continuo (solo modo galaxia) |
| `boostScale` | Cuánto crece una tarjeta al hacer clic |
| `videoSlots*` | Cuántos videos pueden reproducirse a la vez |

## Controles de la interfaz

- **Pausar / Reanudar:** detiene por completo giro, recorrido, flotación y videos.
- **Reducir movimiento:** mantiene una deriva lenta y calmada, sin videos, sin
  reacción al puntero y con el cubo detenido. El botón cambia a
  **Movimiento normal** para volver al modo completo.
- **Métricas:** muestra FPS, tarjetas y videos activos.
- **Clic en tarjeta:** amplía la tarjeta y muestra su detalle.
- **Escape:** cierra el detalle.
- **Tecla `D`:** alterna métricas.

## Rendimiento

El costo real no es la geometría, sino la decodificación de video:

- Solo se reproducen videos mientras la tarjeta está en la zona visible.
- En móvil se limita a 2 videos simultáneos y 5 tarjetas.
- Si `navigator.connection.saveData` está activo, no se cargan videos.
- Se pausa todo cuando la pestaña o el escenario salen de pantalla.
- El modo `prefers-reduced-motion` desactiva la animación.

## Accesibilidad

- La galaxia es decorativa (`aria-hidden="true"`).
- La lista de proyectos es el contenido real, con enlaces y teclado.
- Existe un enlace “Saltar la animación”.
- Se respeta `prefers-reduced-motion`.
- Hay fallback `<noscript>`.

## Validación

```bash
node --check config.js
node --check js/galaxy-core.js
node --check js/galaxy.js
node tests/core.test.js
```

## Integración futura en el portafolio

Cuando el prototipo esté validado, se puede:

1. Portar `config.js` al modelo de proyectos del portafolio.
2. Convertir el HTML de la lista a Tailwind para mantener consistencia.
3. Añadir el escenario como sección de portada sin sustituir el contenido real.
4. Mantener el fallback accesible y el modo de movimiento reducido.

## Nota legal

El efecto está inspirado en el concepto visual de
[ArtCraft](https://getartcraft.com/), pero esta implementación es propia:
no reutiliza su código, sus videos, sus shaders ni su identidad gráfica.
