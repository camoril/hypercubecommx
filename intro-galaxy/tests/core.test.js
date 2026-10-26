/*
 * Pruebas del motor de geometría. Se ejecutan con:
 *   node tests/core.test.js
 */
'use strict';

const assert = require('assert');
const Core = require('../js/galaxy-core.js');

let checks = 0;
function ok(label, condition) {
  assert.ok(condition, label);
  checks += 1;
  console.log('  ok -', label);
}

console.log('GalaxyCore');

ok('clamp limita por abajo', Core.clamp(-5, 0, 10) === 0);
ok('clamp limita por arriba', Core.clamp(50, 0, 10) === 10);
ok('lerp interpola', Math.abs(Core.lerp(0, 10, 0.25) - 2.5) < 1e-9);
ok('wrap01 envuelve negativos', Math.abs(Core.wrap01(-0.25) - 0.75) < 1e-9);
ok('wrap01 envuelve mayores a 1', Math.abs(Core.wrap01(1.25) - 0.25) < 1e-9);

const desktop = Core.computeViewport(1440, 900);
const mobile = Core.computeViewport(390, 844);
ok('viewport calcula semidiagonal', desktop.halfDiagonal > 0);
ok('viewport calcula área en megapíxeles', desktop.areaMpx > 1);

const layout = {
  armsDesktop: 4,
  armsMobile: 2,
  cardCountDesktop: 8,
  cardCountMobile: 5,
  turnsDesktop: 0.95,
  turnsMobile: 0.6,
  journeysPerMinuteDesktop: 2.2,
  journeysPerMinuteMobile: 1.4,
  birthFrac: 0.06,
  rMaxFracDesktop: 0.95,
  rMaxFracMobile: 0.9,
  depthDesktop: 0.5,
  depthMobile: 0.32,
  blurMaxDesktop: 6,
  tiltMaxDesktop: 7,
  spinDegPerSecond: 4.5,
  armJitter: 0.76,
  boostScale: 1.6,
  videoSlotsDesktop: 6,
  videoSlotsMobile: 2
};

const pDesktop = Core.computeProfile(desktop, layout);
const pMobile = Core.computeProfile(mobile, layout);

ok('perfil escritorio usa 4 brazos', pDesktop.arms === 4);
ok('perfil escritorio usa 8 tarjetas', pDesktop.cardCount === 8);
ok('perfil móvil usa menos brazos', pMobile.arms < pDesktop.arms);
ok('perfil móvil usa menos tarjetas', pMobile.cardCount < pDesktop.cardCount);
ok('perfil móvil desactiva blur', pMobile.blurMax === 0);
ok('perfil móvil desactiva tilt', pMobile.tiltMax === 0);
ok('perfil móvil limita videos', pMobile.videoSlots < pDesktop.videoSlots);

const count = pDesktop.cardCount;
const phases = [];
for (let i = 0; i < count; i += 1) {
  const phase = Core.initialPhase(i, count, pDesktop.arms, pDesktop.armJitter);
  phases.push(phase);
  ok('fase ' + i + ' está entre 0 y 1', phase >= 0 && phase < 1);
}
const unique = new Set(phases.map((value) => value.toFixed(4)));
ok('las fases iniciales no se repiten todas', unique.size > 1);

for (const phase of [0, 0.25, 0.5, 0.75, 0.999]) {
  const tr = Core.computeCardTransform({
    phase: phase,
    arm: 1,
    profile: pDesktop,
    viewport: desktop,
    spinDeg: 12,
    pointerX: 0.2,
    pointerY: -0.3,
    boost: false,
    hover: false
  });
  ok('transform x finito en fase ' + phase, Number.isFinite(tr.x));
  ok('transform y finito en fase ' + phase, Number.isFinite(tr.y));
  ok('transform z finito en fase ' + phase, Number.isFinite(tr.z));
  ok('escala positiva en fase ' + phase, tr.scale > 0);
  ok('opacidad entre 0 y 1 en fase ' + phase, tr.opacity >= 0 && tr.opacity <= 1);
  ok('blur no negativo en fase ' + phase, tr.blur >= 0);
  ok('radio dentro del máximo en fase ' + phase, tr.radiusPx <= desktop.halfDiagonal * pDesktop.rMaxFrac + 1e-6);
}

const boosted = Core.computeCardTransform({
  phase: 0.5,
  arm: 0,
  profile: pDesktop,
  viewport: desktop,
  spinDeg: 0,
  boost: true
});
const normal = Core.computeCardTransform({
  phase: 0.5,
  arm: 0,
  profile: pDesktop,
  viewport: desktop,
  spinDeg: 0,
  boost: false
});
ok('el clic amplía la tarjeta', boosted.scale > normal.scale);

const atBirth = Core.computeCardTransform({ phase: 0.001, arm: 0, profile: pDesktop, viewport: desktop, spinDeg: 0 });
const atExit = Core.computeCardTransform({ phase: 0.999, arm: 0, profile: pDesktop, viewport: desktop, spinDeg: 0 });
ok('la tarjeta nace casi invisible', atBirth.opacity < 0.1);
ok('la tarjeta termina casi invisible', atExit.opacity < 0.1);

// --- Modo pecera ---
const bowlViewportDesktop = Core.computeViewport(1440, 900);
const bowlViewportMobile = Core.computeViewport(390, 844);
const bowlParamsDesktop = Core.computeBowlParams(bowlViewportDesktop, layout, 140, 88, false);
const bowlParamsMobile = Core.computeBowlParams(bowlViewportMobile, layout, 82, 51, true);

ok('bowl desktop tiene límites positivos', bowlParamsDesktop.outerX > 0 && bowlParamsDesktop.outerY > 0);
ok('bowl desktop respeta el interior', bowlParamsDesktop.innerX < bowlParamsDesktop.outerX);
ok('bowl móvil respeta el interior', bowlParamsMobile.innerX < bowlParamsMobile.outerX);
ok('bowl móvil es más lento', bowlParamsMobile.speed < bowlParamsDesktop.speed);

const bowlStates = [];
for (let i = 0; i < 8; i += 1) {
  const s = Core.createBowlState(i, 8, bowlParamsDesktop, i + 1);
  bowlStates.push(s);
  const e = Math.hypot(s.x / bowlParamsDesktop.outerX, s.y / bowlParamsDesktop.outerY);
  ok('estado pecera ' + i + ' dentro del cuenco', e <= 1.0001);
  ok(
    'estado pecera ' + i + ' es finito',
    Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.vx) && Number.isFinite(s.vy)
  );
}

let bowlSim = bowlStates.map((s) => Object.assign({}, s));
let escaped = false;
for (let frame = 0; frame < 600; frame += 1) {
  const time = frame / 60;
  bowlSim = bowlSim.map((s) => Core.stepBowl(s, bowlParamsDesktop, 1 / 60, time, null));
  bowlSim = Core.applySeparation(bowlSim, bowlParamsDesktop, 1 / 60);
  for (const s of bowlSim) {
    const e = Math.hypot(s.x / bowlParamsDesktop.outerX, s.y / bowlParamsDesktop.outerY);
    if (e > 1.05) {
      escaped = true;
    }
  }
}
ok('ninguna tarjeta escapa del cuenco', !escaped);

const finalMinInner = Math.min.apply(
  null,
  bowlSim.map((s) => Math.hypot(s.x / bowlParamsDesktop.innerX, s.y / bowlParamsDesktop.innerY))
);
ok('las tarjetas terminan fuera de la zona central', finalMinInner > 0.7);

const bowlRender = Core.computeBowlRender(bowlSim[0], bowlParamsDesktop, 2.5, false, false);
ok(
  'render pecera finito',
  Number.isFinite(bowlRender.x) && Number.isFinite(bowlRender.y) && Number.isFinite(bowlRender.z)
);
ok('render pecera escala positiva', bowlRender.scale > 0);
ok('render pecera opacidad válida', bowlRender.opacity >= 0 && bowlRender.opacity <= 1);
ok('render pecera blur no negativo', bowlRender.blur >= 0);

const boostedBowl = Core.computeBowlRender(bowlSim[0], bowlParamsDesktop, 2.5, true, false);
ok('el clic amplía en modo pecera', boostedBowl.scale > bowlRender.scale);

const pairA = { x: 0, y: 0, vx: 0, vy: 0, heading: 0, speed: 30, seed: 1, wanderPhase: 0, bobPhase: 0, depthPhase: 0 };
const pairB = { x: 1, y: 0, vx: 0, vy: 0, heading: 0, speed: 30, seed: 2, wanderPhase: 0, bobPhase: 0, depthPhase: 0 };
const separatedPair = Core.applySeparation([pairA, pairB], bowlParamsDesktop, 1 / 60);
ok('la separación empuja las tarjetas', separatedPair[0].vx < 0 && separatedPair[1].vx > 0);

let centerSim = { x: 0, y: 0, vx: 0, vy: 0, heading: 0, speed: 30, seed: 0.5, wanderPhase: 0, bobPhase: 0, depthPhase: 0 };
for (let frame = 0; frame < 240; frame += 1) {
  centerSim = Core.stepBowl(centerSim, bowlParamsDesktop, 1 / 60, frame / 60, null);
}
const centerRadius = Math.hypot(centerSim.x / bowlParamsDesktop.innerX, centerSim.y / bowlParamsDesktop.innerY);
ok('una tarjeta en el centro sale de la zona reservada', centerRadius > 0.9);

// --- Colisiones ---
const collisionParams = Core.computeBowlParams(desktop, layout, 140, 88, false);
const overlapA = { x: 0, y: 0, vx: 10, vy: 0, heading: 0, speed: 30, seed: 1, wanderPhase: 0, bobPhase: 0, depthPhase: 0 };
const overlapB = { x: 200, y: 0, vx: -10, vy: 0, heading: 0, speed: 30, seed: 2, wanderPhase: 0, bobPhase: 0, depthPhase: 0 };
const resolvedPair = Core.resolveCollisions([overlapA, overlapB], collisionParams, 1 / 60);
const resolvedDx = Math.abs(resolvedPair[1].x - resolvedPair[0].x);
const resolvedOverlapX = Math.max(0, collisionParams.cardHalfW * 2 - resolvedDx);
const allowedOverlapX = collisionParams.overlapFactor * collisionParams.cardHalfW * 2;
ok('la colisión reduce el solapamiento', resolvedOverlapX <= allowedOverlapX + 0.5);
ok('la colisión genera rebote', resolvedPair[0].vx < overlapA.vx && resolvedPair[1].vx > overlapB.vx);
ok('la colisión no produce NaN', Number.isFinite(resolvedPair[0].x) && Number.isFinite(resolvedPair[1].vx));

let collisionSim = bowlStates.map((s) => Object.assign({}, s));
let maxOverlapFraction = 0;
let overlapSum = 0;
let overlapSamples = 0;
let collisionEscaped = false;
for (let frame = 0; frame < 600; frame += 1) {
  const time = frame / 60;
  collisionSim = collisionSim.map((s) => Core.stepBowl(s, collisionParams, 1 / 60, time, null));
  collisionSim = Core.applySeparation(collisionSim, collisionParams, 1 / 60);
  collisionSim = Core.resolveCollisions(collisionSim, collisionParams, 1 / 60);
  for (let i = 0; i < collisionSim.length; i += 1) {
    for (let j = i + 1; j < collisionSim.length; j += 1) {
      const dx = Math.abs(collisionSim[j].x - collisionSim[i].x);
      const dy = Math.abs(collisionSim[j].y - collisionSim[i].y);
      const ox = Math.max(0, collisionParams.cardHalfW * 2 - dx);
      const oy = Math.max(0, collisionParams.cardHalfH * 2 - dy);
      if (ox > 0 && oy > 0) {
        const fraction = Math.min(ox / (collisionParams.cardHalfW * 2), oy / (collisionParams.cardHalfH * 2));
        maxOverlapFraction = Math.max(maxOverlapFraction, fraction);
        overlapSum += fraction;
        overlapSamples += 1;
      }
    }
    const edge = Math.hypot(collisionSim[i].x / collisionParams.outerX, collisionSim[i].y / collisionParams.outerY);
    if (edge > 1.05) {
      collisionEscaped = true;
    }
  }
}
const averageOverlap = overlapSamples ? overlapSum / overlapSamples : 0;
ok('el solapamiento promedio es bajo', averageOverlap <= 0.15);
ok('el solapamiento máximo se mantiene controlado', maxOverlapFraction <= 0.25);
ok('las colisiones no sacan las tarjetas del cuenco', !collisionEscaped);

console.log('\n' + checks + ' comprobaciones superadas.');
