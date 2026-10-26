# Posters

Posters usados como respaldo mientras un video carga o cuando no hay video.

## Convención

```text
assets/posters/<id>.webp
```

El `<id>` debe coincidir con el `id` del proyecto en `config.js`.

## Generarlos automáticamente

`tools/optimize-video.sh` genera el poster a partir del segundo 2 del video:

```bash
./tools/optimize-video.sh /ruta/al/clip-original.mp4 gw2
```

## Especificaciones

- 960 px de ancho como máximo.
- Formato WebP o AVIF.
- Menos de 120 KB.
- Sin texto pequeño.
