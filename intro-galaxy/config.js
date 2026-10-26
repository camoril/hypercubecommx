/*
 * Intro Galaxy - configuración del prototipo
 * ------------------------------------------
 * Este archivo es lo único que necesitas tocar para:
 *   1. Añadir tus videos cortos (assets/videos/).
 *   2. Añadir posters (assets/posters/).
 *   3. Ajustar la geometría, velocidad y cantidad de tarjetas.
 *
 * Los videos se reproducen silenciados, en bucle y solo mientras la tarjeta
 * está en la zona visible de la espiral. En móvil se limita la cantidad.
 */
window.GALAXY_CONFIG = {
  brand: {
    name: 'Hypercube',
    kicker: 'Prototipo aislado · Intro Galaxy',
    title: 'Engineering the Digital Backbone',
    subtitle: 'Infraestructura, ciberseguridad y desarrollo a medida.',
    primaryCta: { label: 'Ver proyectos', href: '#proyectos' }
  },

  /*
   * Cubo flotante decorativo. Reutiliza el SVG del sitio original.
   * Pon enabled: false para ocultarlo.
   */
  cube: {
    enabled: true,
    src: 'assets/hypercube.svg',
    tiltMaxX: 12,
    tiltMaxY: 16,
    floatOffset: 6
  },

  layout: {
    // Modo de movimiento: 'bowl' (pecera) o 'galaxy' (espiral)
    motionMode: 'bowl',

    // --- Modo galaxia (opcional) ---
    armsDesktop: 3,
    armsMobile: 2,
    cardCountDesktop: 8,
    cardCountMobile: 5,
    turnsDesktop: 1.1,
    turnsMobile: 0.8,
    journeysPerMinuteDesktop: 1.8,
    journeysPerMinuteMobile: 1.2,
    birthFrac: 0.07,
    rMaxFracDesktop: 0.88,
    rMaxFracMobile: 0.85,
    depthDesktop: 0.42,
    depthMobile: 0.3,
    blurMaxDesktop: 5,
    tiltMaxDesktop: 7,
    spinDegPerSecond: 3.5,
    armJitter: 0.76,
    videoStart: 0.05,
    videoEnd: 0.7,

    // --- Modo pecera ---
    // Límites del cuenco como fracción del viewport.
    // Se resta el tamaño de la tarjeta para que nunca se corte en los bordes.
    bowlOuterXFrac: 0.44,
    bowlOuterYFrac: 0.37,
    bowlInnerXFrac: 0.22,
    bowlInnerYFrac: 0.16,
    bowlOuterXFracMobile: 0.46,
    bowlOuterYFracMobile: 0.4,
    bowlInnerXFracMobile: 0.1,
    bowlInnerYFracMobile: 0.2,

    // Nado
    bowlSpeedDesktop: 34,
    bowlSpeedMobile: 20,
    bowlSpeedVariance: 0.35,
    bowlWanderAmp: 1.4,
    bowlWanderFreq: 0.55,
    bowlTurn: 2.4,

    // Fuerzas del cuenco
    bowlBoundary: 260,
    bowlInnerPush: 220,
    // bowlSeparation se calcula automáticamente según el tamaño de la tarjeta.
    bowlSeparationForce: 220,
    bowlOverlapFactor: 0.1,
    bowlRestitution: 0.3,
    bowlCollisionRelaxation: 0.9,
    bowlCollisionIterations: 6,
    bowlMaxCollisionImpulse: 160,
    bowlPointerRadius: 190,
    bowlPointerForce: 260,

    // Aspecto y profundidad
    bowlBobAmp: 7,
    bowlBobFreq: 0.45,
    bowlDepthAmp: 110,
    bowlDepthFreq: 0.28,
    bowlScaleMin: 0.86,
    bowlScaleMax: 1.06,
    bowlOpacityMin: 0.72,
    bowlBlurMax: 2.2,
    bowlRotFactor: 0.05,
    bowlRotYMax: 14,
    bowlRotXMax: 8,
    bowlRotBob: 1.6,
    bowlTiltMax: 2.5,
    bowlVideoZThreshold: -0.25,

    // Interacción de clic y videos
    boostScale: 1.5,
    videoSlotsDesktop: 6,
    videoSlotsMobile: 2,

    // Perfil móvil cuando el área del viewport baja de este valor (megapíxeles)
    mobileBreakpointMpx: 0.62
  },

  /*
   * Proyectos mostrados en la galaxia y en la lista accesible.
   *
   * Para activar un video:
   *   video: 'assets/videos/mi-clip.webm',
   *   videoMp4: 'assets/videos/mi-clip.mp4',
   *   poster: 'assets/posters/mi-clip.webp',
   *
   * Usa tools/optimize-video.sh para generar las tres versiones.
   * Si dejas video vacío, la tarjeta usa el poster o un degradado generado.
   */
  projects: [
    {
      id: 'interventor',
      title: 'Interventor',
      tag: 'Service Management',
      description: 'Sistema web para gestionar intervenciones de servicio técnico con firma digital del cliente, generación de PDF, roles de usuario y despliegue con Docker.',
      url: 'https://github.com/camoril/interventor',
      repo: 'https://github.com/camoril/interventor',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'subnet',
      title: 'Subnet Calculator',
      tag: 'Networking',
      description: 'Calculadora visual de subredes IPv4 con árbol binario y persistencia de estado.',
      url: 'https://globalincom.com.mx/subnet',
      repo: 'https://github.com/camoril/subnet',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'ipv6',
      title: 'IPv6 Subnet Calculator',
      tag: 'Networking',
      description: 'Visualizador de redes IPv6 con precisión de 128 bits, cálculo EUI-64 y generación PTR.',
      url: 'https://globalincom.com.mx/subnet6',
      repo: 'https://github.com/camoril/subnet6',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'globalincom',
      title: 'GlobalIncom SPA',
      tag: 'Corporate Web',
      description: 'SPA corporativa con enrutamiento por hash, modo oscuro y optimización SEO.',
      url: 'https://globalincom.com.mx',
      repo: 'https://github.com/camoril/globalincommx',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'genetic',
      title: 'Genetic Algorithm',
      tag: 'AI / Algorithms',
      description: 'Implementación interactiva de selección, cruce y mutación para resolver problemas de optimización.',
      url: 'https://hypercube.com.mx/genetic/',
      repo: 'https://github.com/camoril/php',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'loan',
      title: 'Loan Calculator',
      tag: 'Finance',
      description: 'Herramienta financiera para calcular tablas de amortización con distintas frecuencias de pago.',
      url: 'https://hypercube.com.mx/prestamos/',
      repo: 'https://github.com/camoril/php',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'cdr',
      title: 'Call Rating System',
      tag: 'Reporting',
      description: 'Auditoría y reportes de Call Detail Records con exportación CSV y filtrado dinámico.',
      url: 'https://hypercube.com.mx/tarifas/',
      repo: 'https://github.com/camoril/php',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    },
    {
      id: 'lastfm',
      title: 'Last.fm Visualizer',
      tag: 'API / Music',
      description: 'Dashboard musical en tiempo real con carátulas, estado de favoritos e indicador de reproducción.',
      url: 'https://hypercube.com.mx/lastfm/',
      repo: 'https://github.com/camoril/last.fm',
      video: 'assets/videos/hexagons.webm',
      videoMp4: 'assets/videos/hexagons.mp4',
      poster: 'assets/posters/hexagons.webp'
    }
  ]
};
