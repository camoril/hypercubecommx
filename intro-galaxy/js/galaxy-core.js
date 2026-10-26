/*
 * galaxy-core.js
 * Funciones puras de geometría y perfiles. No toca el DOM.
 * Se puede cargar en el navegador (window.GalaxyCore) o en Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GalaxyCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TAU = Math.PI * 2;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function wrap01(value) {
    return ((value % 1) + 1) % 1;
  }

  function computeViewport(width, height) {
    var w = Math.max(1, width);
    var h = Math.max(1, height);
    return {
      width: w,
      height: h,
      halfDiagonal: Math.hypot(w, h) / 2,
      aspect: w / h,
      areaMpx: (w * h) / 1000000
    };
  }

  function computeProfile(viewport, layout) {
    var L = layout || {};
    var mobile = viewport.width < 768 ||
      viewport.areaMpx < (L.mobileBreakpointMpx != null ? L.mobileBreakpointMpx : 0.62);

    return {
      mobile: mobile,
      arms: Math.max(1, Math.round(mobile ? (L.armsMobile || 2) : (L.armsDesktop || 4))),
      cardCount: Math.max(3, Math.round(mobile ? (L.cardCountMobile || 5) : (L.cardCountDesktop || 8))),
      turns: mobile ? (L.turnsMobile || 0.6) : (L.turnsDesktop || 0.95),
      journeysPerMinute: mobile ? (L.journeysPerMinuteMobile || 1.4) : (L.journeysPerMinuteDesktop || 2.2),
      birthFrac: L.birthFrac != null ? L.birthFrac : 0.06,
      rMaxFrac: mobile ? (L.rMaxFracMobile || 0.9) : (L.rMaxFracDesktop || 0.95),
      depth: mobile ? (L.depthMobile || 0.32) : (L.depthDesktop || 0.5),
      blurMax: mobile ? 0 : (L.blurMaxDesktop || 6),
      tiltMax: mobile ? 0 : (L.tiltMaxDesktop || 7),
      spinDegPerSecond: L.spinDegPerSecond != null ? L.spinDegPerSecond : 4.5,
      armJitter: L.armJitter != null ? L.armJitter : 0.76,
      boostScale: L.boostScale != null ? L.boostScale : 1.6,
      videoSlots: mobile ? (L.videoSlotsMobile || 2) : (L.videoSlotsDesktop || 6),
      videoStart: L.videoStart != null ? L.videoStart : 0.05,
      videoEnd: L.videoEnd != null ? L.videoEnd : 0.7
    };
  }

  /*
   * Fase inicial (0..1) de cada tarjeta. Reparte las tarjetas entre brazos
   * y aplica un desfase por brazo para que no nazcan todas en anillo.
   */
  function initialPhase(index, count, arms, armJitter) {
    var safeArms = Math.max(1, arms || 1);
    var arm = index % safeArms;
    var slot = Math.floor(index / safeArms);
    var perArm = Math.max(1, Math.ceil(count / safeArms));
    var base = perArm > 1 ? slot / perArm : 0;
    var jitter = (armJitter != null ? armJitter : 0.76) * (arm / safeArms);
    return wrap01(base + jitter);
  }

  /*
   * Calcula la transformación de una tarjeta en un instante dado.
   * Devuelve pixeles y grados listos para CSS.
   */
  function computeCardTransform(options) {
    var phase = wrap01(options.phase);
    var profile = options.profile;
    var viewport = options.viewport;
    var spinDeg = options.spinDeg || 0;
    var boost = !!options.boost;
    var hover = !!options.hover;

    var birth = profile.birthFrac;
    var rMax = profile.rMaxFrac;
    var radiusFrac = lerp(birth, rMax, phase);
    var radiusPx = radiusFrac * viewport.halfDiagonal;

    var theta = (options.arm * (TAU / profile.arms)) + (profile.turns * TAU * phase);
    var x = Math.cos(theta) * radiusPx;
    var y = Math.sin(theta) * radiusPx;
    var z = (phase - 0.18) * profile.depth * viewport.halfDiagonal;

    var opacity = smoothstep(0, 0.1, phase) * (1 - smoothstep(0.82, 1, phase));
    var scaleBase = lerp(0.55, 1.15, phase);
    var scale = scaleBase * (boost ? profile.boostScale : (hover ? 1.05 : 1));
    var blur = profile.blurMax * (1 - smoothstep(0, 0.16, phase)) +
      profile.blurMax * 0.5 * smoothstep(0.86, 1, phase);

    return {
      phase: phase,
      arm: options.arm,
      theta: theta,
      radiusPx: radiusPx,
      x: x,
      y: y,
      z: z,
      opacity: clamp(opacity, 0, 1),
      scale: scale,
      blur: Math.max(0, blur),
      // El contenedor gira; la tarjeta contrarresta el giro para seguir legible.
      rotZ: -spinDeg + Math.sin(theta) * 5 + phase * 6,
      rotY: Math.cos(theta) * 14,
      rotX: Math.sin(theta) * 7
    };
  }

  function seededRandom(seed) {
    var value = (seed || 1) >>> 0;
    return function () {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  /*
   * Parámetros del modo pecera. Calcula límites seguros para que las
   * tarjetas queden completamente dentro del viewport.
   */
  function computeBowlParams(viewport, layout, cardHalfW, cardHalfH, mobile) {
    var L = layout || {};
    var halfW = cardHalfW || 90;
    var halfH = cardHalfH || 56;

    var outerXFrac = mobile
      ? (L.bowlOuterXFracMobile != null ? L.bowlOuterXFracMobile : 0.46)
      : (L.bowlOuterXFrac != null ? L.bowlOuterXFrac : 0.44);
    var outerYFrac = mobile
      ? (L.bowlOuterYFracMobile != null ? L.bowlOuterYFracMobile : 0.4)
      : (L.bowlOuterYFrac != null ? L.bowlOuterYFrac : 0.37);
    var innerXFrac = mobile
      ? (L.bowlInnerXFracMobile != null ? L.bowlInnerXFracMobile : 0.1)
      : (L.bowlInnerXFrac != null ? L.bowlInnerXFrac : 0.22);
    var innerYFrac = mobile
      ? (L.bowlInnerYFracMobile != null ? L.bowlInnerYFracMobile : 0.2)
      : (L.bowlInnerYFrac != null ? L.bowlInnerYFrac : 0.16);

    var outerX = Math.max(60, viewport.width * outerXFrac - halfW);
    var outerY = Math.max(50, viewport.height * outerYFrac - halfH);
    var innerX = Math.max(20, viewport.width * innerXFrac);
    var innerY = Math.max(20, viewport.height * innerYFrac);

    if (innerX > outerX * 0.85) {
      innerX = outerX * 0.85;
    }
    if (innerY > outerY * 0.85) {
      innerY = outerY * 0.85;
    }

    return {
      outerX: outerX,
      outerY: outerY,
      innerX: innerX,
      innerY: innerY,
      cardHalfW: halfW,
      cardHalfH: halfH,
      speed: mobile
        ? (L.bowlSpeedMobile != null ? L.bowlSpeedMobile : 20)
        : (L.bowlSpeedDesktop != null ? L.bowlSpeedDesktop : 34),
      speedVariance: L.bowlSpeedVariance != null ? L.bowlSpeedVariance : 0.35,
      wanderAmp: L.bowlWanderAmp != null ? L.bowlWanderAmp : 1.4,
      wanderFreq: L.bowlWanderFreq != null ? L.bowlWanderFreq : 0.55,
      turn: L.bowlTurn != null ? L.bowlTurn : 2.4,
      boundary: L.bowlBoundary != null ? L.bowlBoundary : 260,
      innerPush: L.bowlInnerPush != null ? L.bowlInnerPush : 220,
      separation: L.bowlSeparation != null ? L.bowlSeparation : Math.max(80, halfW * 2 * 0.95),
      separationForce: L.bowlSeparationForce != null ? L.bowlSeparationForce : 220,
      overlapFactor: L.bowlOverlapFactor != null ? L.bowlOverlapFactor : 0.1,
      restitution: L.bowlRestitution != null ? L.bowlRestitution : 0.3,
      collisionRelaxation: L.bowlCollisionRelaxation != null ? L.bowlCollisionRelaxation : 0.9,
      collisionIterations: L.bowlCollisionIterations != null ? L.bowlCollisionIterations : 6,
      maxCollisionImpulse: L.bowlMaxCollisionImpulse != null ? L.bowlMaxCollisionImpulse : 160,
      pointerRadius: L.bowlPointerRadius != null ? L.bowlPointerRadius : 190,
      pointerForce: L.bowlPointerForce != null ? L.bowlPointerForce : 260,
      bobAmp: L.bowlBobAmp != null ? L.bowlBobAmp : 7,
      bobFreq: L.bowlBobFreq != null ? L.bowlBobFreq : 0.45,
      depthAmp: L.bowlDepthAmp != null ? L.bowlDepthAmp : 110,
      depthFreq: L.bowlDepthFreq != null ? L.bowlDepthFreq : 0.28,
      scaleMin: L.bowlScaleMin != null ? L.bowlScaleMin : 0.86,
      scaleMax: L.bowlScaleMax != null ? L.bowlScaleMax : 1.06,
      opacityMin: L.bowlOpacityMin != null ? L.bowlOpacityMin : 0.72,
      blurMax: L.bowlBlurMax != null ? L.bowlBlurMax : 2.2,
      rotFactor: L.bowlRotFactor != null ? L.bowlRotFactor : 0.05,
      rotYMax: L.bowlRotYMax != null ? L.bowlRotYMax : 14,
      rotXMax: L.bowlRotXMax != null ? L.bowlRotXMax : 8,
      rotBob: L.bowlRotBob != null ? L.bowlRotBob : 1.6,
      tiltMax: L.bowlTiltMax != null ? L.bowlTiltMax : 2.5,
      videoZThreshold: L.bowlVideoZThreshold != null ? L.bowlVideoZThreshold : -0.25,
      boostScale: L.boostScale != null ? L.boostScale : 1.5
    };
  }

  /*
   * Estado inicial de una tarjeta en modo pecera. La distribuye en un anillo
   * entre el radio interior reservado y el borde seguro del cuenco.
   */
  function createBowlState(index, count, params, seed) {
    var rand = seededRandom((seed != null ? seed : index + 1) * 7919 + 13);
    var slot = count > 0 ? index / count : 0;
    var angle = slot * TAU + (rand() - 0.5) * 0.7;
    var radial = 0.25 + 0.65 * ((index * 0.61803398875) % 1) + (rand() - 0.5) * 0.12;
    radial = clamp(radial, 0.05, 1);

    var radiusX = lerp(params.innerX, params.outerX, radial);
    var radiusY = lerp(params.innerY, params.outerY, radial);
    var x = Math.cos(angle) * radiusX;
    var y = Math.sin(angle) * radiusY;
    var heading = angle + Math.PI / 2 + (rand() - 0.5) * 0.8;
    var speed = params.speed * (1 - params.speedVariance + rand() * params.speedVariance * 2);

    return {
      x: x,
      y: y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      heading: heading,
      speed: speed,
      seed: rand() * TAU,
      wanderPhase: rand() * TAU,
      bobPhase: rand() * TAU,
      depthPhase: rand() * TAU
    };
  }

  /*
   * Avanza un estado de pecera. Devuelve un estado nuevo para facilitar
   * las pruebas y evitar mutaciones inesperadas.
   */
  function stepBowl(state, params, dt, time, pointer) {
    var s = {
      x: state.x,
      y: state.y,
      vx: state.vx,
      vy: state.vy,
      heading: state.heading,
      speed: state.speed,
      seed: state.seed,
      wanderPhase: state.wanderPhase,
      bobPhase: state.bobPhase,
      depthPhase: state.depthPhase
    };

    var step = clamp(dt, 0, 0.05);
    if (step <= 0) {
      return s;
    }

    // Nado errático suave: dos frecuencias para que no sea predecible.
    s.wanderPhase += params.wanderFreq * step;
    s.heading += Math.sin(s.wanderPhase + s.seed) * params.wanderAmp * step;
    s.heading += Math.sin(time * 0.7 + s.seed) * params.wanderAmp * 0.35 * step;

    // Velocidad con pequeñas aceleraciones y frenadas.
    var speedNow = s.speed * (0.85 + 0.3 * Math.sin(time * 0.35 + s.seed));
    var desiredVx = Math.cos(s.heading) * speedNow;
    var desiredVy = Math.sin(s.heading) * speedNow;
    var turn = Math.min(1, params.turn * step);
    s.vx += (desiredVx - s.vx) * turn;
    s.vy += (desiredVy - s.vy) * turn;

    // Si intenta salir del cuenco, se le empuja hacia dentro.
    var ex = s.x / params.outerX;
    var ey = s.y / params.outerY;
    var e = ex * ex + ey * ey;
    if (e > 1) {
      var edgeDist = Math.hypot(s.x, s.y) || 1;
      var overshoot = Math.sqrt(e) - 1;
      s.vx += (-s.x / edgeDist) * overshoot * params.boundary * step;
      s.vy += (-s.y / edgeDist) * overshoot * params.boundary * step;
    }

    // Si entra en la zona central reservada, se le empuja hacia afuera.
    var ix = s.x / params.innerX;
    var iy = s.y / params.innerY;
    var inner = ix * ix + iy * iy;
    if (inner < 1) {
      var centerDist = Math.hypot(s.x, s.y);
      var ux;
      var uy;
      if (centerDist < 0.001) {
        ux = Math.cos(s.seed);
        uy = Math.sin(s.seed);
      } else {
        ux = s.x / centerDist;
        uy = s.y / centerDist;
      }
      var depth = 1 - Math.sqrt(inner);
      s.vx += ux * depth * params.innerPush * step;
      s.vy += uy * depth * params.innerPush * step;
    }

    // Repulsión suave del puntero: los peces esquivan la mano.
    if (pointer && pointer.active) {
      var dx = s.x - pointer.x;
      var dy = s.y - pointer.y;
      var pointerDist = Math.hypot(dx, dy);
      if (pointerDist < params.pointerRadius && pointerDist > 0.001) {
        var strength = 1 - pointerDist / params.pointerRadius;
        s.vx += (dx / pointerDist) * strength * params.pointerForce * step;
        s.vy += (dy / pointerDist) * strength * params.pointerForce * step;
      }
    }

    s.x += s.vx * step;
    s.y += s.vy * step;

    // Limita la velocidad para que no se disparen.
    var speed = Math.hypot(s.vx, s.vy);
    var maxSpeed = params.speed * 2.2;
    var minSpeed = params.speed * 0.35;
    if (speed > maxSpeed) {
      s.vx = (s.vx / speed) * maxSpeed;
      s.vy = (s.vy / speed) * maxSpeed;
    } else if (speed < minSpeed && speed > 0.001) {
      s.vx = (s.vx / speed) * minSpeed;
      s.vy = (s.vy / speed) * minSpeed;
    }
    s.heading = Math.atan2(s.vy, s.vx);

    // Corrección dura: nunca debe quedar fuera del elenco.
    var edge = Math.hypot(s.x / params.outerX, s.y / params.outerY);
    if (edge > 1) {
      s.x /= edge;
      s.y /= edge;
    }

    return s;
  }

  function cloneState(state) {
    return {
      x: state.x,
      y: state.y,
      vx: state.vx,
      vy: state.vy,
      heading: state.heading,
      speed: state.speed,
      seed: state.seed,
      wanderPhase: state.wanderPhase,
      bobPhase: state.bobPhase,
      depthPhase: state.depthPhase
    };
  }

  /*
   * Separación entre tarjetas para que no se amontonen como peces.
   * Devuelve una lista nueva de estados.
   */
  function applySeparation(states, params, dt) {
    var result = states.map(cloneState);
    var step = clamp(dt, 0, 0.05);

    for (var i = 0; i < result.length; i += 1) {
      for (var j = i + 1; j < result.length; j += 1) {
        var a = result[i];
        var b = result[j];
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.hypot(dx, dy);
        if (dist > 0.001 && dist < params.separation) {
          var force = (1 - dist / params.separation) * params.separationForce * step;
          var ux = dx / dist;
          var uy = dy / dist;
          a.vx -= ux * force;
          a.vy -= uy * force;
          b.vx += ux * force;
          b.vy += uy * force;
        } else if (dist <= 0.001) {
          a.vx -= Math.cos(a.seed) * params.separationForce * step;
          a.vy -= Math.sin(a.seed) * params.separationForce * step;
          b.vx += Math.cos(b.seed) * params.separationForce * step;
          b.vy += Math.sin(b.seed) * params.separationForce * step;
        }
      }
    }

    return result;
  }

  /*
   * Resolución de colisiones con superposición máxima permitida.
   * Separa las tarjetas que se encimen más del porcentaje configurado y
   * aplica un rebote ligero.
   */
  function resolveCollisions(states, params, dt) {
    var result = states.map(cloneState);
    var iterations = Math.max(1, Math.round(params.collisionIterations || 2));
    var sumHalfW = (params.cardHalfW || 90) * 2;
    var sumHalfH = (params.cardHalfH || 56) * 2;
    var overlapFactor = params.overlapFactor != null ? params.overlapFactor : 0.12;
    var allowedX = overlapFactor * sumHalfW;
    var allowedY = overlapFactor * sumHalfH;
    var relaxation = params.collisionRelaxation != null ? params.collisionRelaxation : 0.7;
    var restitution = params.restitution != null ? params.restitution : 0.25;
    var maxImpulse = params.maxCollisionImpulse != null ? params.maxCollisionImpulse : 140;

    for (var iteration = 0; iteration < iterations; iteration += 1) {
      for (var i = 0; i < result.length; i += 1) {
        for (var j = i + 1; j < result.length; j += 1) {
          var a = result[i];
          var b = result[j];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var overlapX = sumHalfW - Math.abs(dx);
          var overlapY = sumHalfH - Math.abs(dy);

          if (overlapX <= allowedX || overlapY <= allowedY) {
            continue;
          }

          var penX = overlapX - allowedX;
          var penY = overlapY - allowedY;
          var nx;
          var ny;
          var penetration;

          if (dx === 0 && dy === 0) {
            nx = Math.cos(a.seed);
            ny = Math.sin(a.seed);
            penetration = Math.max(penX, penY);
          } else if (penX < penY) {
            nx = dx >= 0 ? 1 : -1;
            ny = 0;
            penetration = penX;
          } else {
            nx = 0;
            ny = dy >= 0 ? 1 : -1;
            penetration = penY;
          }

          var push = penetration * 0.5 * relaxation;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          // Rebote ligero: solo si se están acercando.
          var relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relativeVelocity < 0) {
            var impulse = Math.min(maxImpulse, -(1 + restitution) * relativeVelocity * 0.5);
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
            b.vx += impulse * nx;
            b.vy += impulse * ny;
          }
        }
      }
    }

    // Mantener todas las tarjetas dentro del cuenco tras los empujes.
    for (var k = 0; k < result.length; k += 1) {
      var state = result[k];
      var edge = Math.hypot(state.x / params.outerX, state.y / params.outerY);
      if (edge > 1) {
        state.x /= edge;
        state.y /= edge;
      }
    }

    return result;
  }

  /*
   * Convierte el estado de pecera en valores listos para CSS.
   */
  function computeBowlRender(state, params, time, boost, hover) {
    var bob = Math.sin(time * params.bobFreq + state.bobPhase) * params.bobAmp;
    var depth = Math.sin(time * params.depthFreq + state.depthPhase);
    var depthNorm = (depth + 1) / 2;
    var scale = lerp(params.scaleMin, params.scaleMax, depthNorm) *
      (boost ? params.boostScale : (hover ? 1.05 : 1));
    var headingDeg = state.heading * 180 / Math.PI;

    return {
      x: state.x,
      y: state.y + bob,
      z: depth * params.depthAmp,
      scale: scale,
      opacity: clamp(lerp(params.opacityMin, 1, depthNorm), 0, 1),
      blur: Math.max(0, params.blurMax * (1 - depthNorm)),
      rotZ: headingDeg * params.rotFactor +
        Math.sin(time * params.bobFreq * 0.7 + state.bobPhase) * params.rotBob,
      rotY: Math.cos(state.heading) * params.rotYMax,
      rotX: Math.sin(state.heading) * params.rotXMax
    };
  }

  return {
    TAU: TAU,
    clamp: clamp,
    lerp: lerp,
    smoothstep: smoothstep,
    wrap01: wrap01,
    computeViewport: computeViewport,
    computeProfile: computeProfile,
    initialPhase: initialPhase,
    computeCardTransform: computeCardTransform,
    computeBowlParams: computeBowlParams,
    createBowlState: createBowlState,
    stepBowl: stepBowl,
    applySeparation: applySeparation,
    resolveCollisions: resolveCollisions,
    computeBowlRender: computeBowlRender
  };
});
