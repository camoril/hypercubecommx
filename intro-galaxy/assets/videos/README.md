# Videos

Coloca aquí los clips optimizados del prototipo.

## Convención

```text
assets/videos/<id>.webm   # VP9 o AV1, sin audio
assets/videos/<id>.mp4    # H.264 de respaldo
```

El `<id>` debe coincidir con el `id` del proyecto en `config.js`.

## Generarlos automáticamente

Desde la raíz de `intro-galaxy/`:

```bash
./tools/optimize-video.sh /ruta/al/clip-original.mp4 gw2
```

## Especificaciones

- 4 a 8 segundos, en bucle.
- 960×600 o 1280×800.
- Menos de 1.5 MB por clip.
- Sin audio.
- Evitar texto pequeño: se verá reducido y con desenfoque.

## Nota sobre Git

`.gitignore` ignora los videos nuevos por defecto para evitar binarios grandes.
Si quieres versionar tus clips, elimina la regla `assets/videos/*` o usa
`git add -f`.
