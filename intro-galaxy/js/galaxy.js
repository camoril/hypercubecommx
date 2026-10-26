/*
 * galaxy.js
 * Controlador del prototipo Intro Galaxy.
 * Depende de config.js y js/galaxy-core.js.
 */
(function () {
  'use strict';

  var Core = window.GalaxyCore;
  var config = window.GALAXY_CONFIG || {};
  var layout = config.layout || {};
  var motionMode = layout.motionMode || 'bowl';
  var cubeConfig = config.cube || {};
  var projects = (config.projects || []).slice();
  var labels = config.labels || {};
  var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  var state = {
    cards: [],
    profile: null,
    viewport: null,
    bowlParams: null,
    paused: false,
    motionEnabled: !(reducedMotionQuery && reducedMotionQuery.matches),
    reduced: !!(reducedMotionQuery && reducedMotionQuery.matches),
    boosted: -1,
    spin: 0,
    motionTime: 0,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    pointerActive: false,
    lastTime: 0,
    rafId: 0,
    stageVisible: true,
    saveData: !!(navigator.connection && navigator.connection.saveData),
    fps: 0,
    frames: 0,
    fpsTime: 0,
    debug: false,
    observer: null
  };

  var el = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function init() {
    el.stage = byId('galaxy-stage');
    el.galaxy = byId('galaxy');
    el.hero = byId('galaxy-hero');
    el.detail = byId('galaxy-detail');
    el.detailTitle = byId('galaxy-detail-title');
    el.detailText = byId('galaxy-detail-text');
    el.detailTag = byId('galaxy-detail-tag');
    el.detailLink = byId('galaxy-detail-link');
    el.list = byId('project-list');
    el.hud = byId('galaxy-hud');
    el.pauseBtn = byId('galaxy-pause');
    el.motionBtn = byId('galaxy-motion');
    el.debugBtn = byId('galaxy-debug');
    el.cube = byId('galaxy-cube');
    el.cubeImg = byId('galaxy-cube-img');

    if (el.cube) {
      if (cubeConfig.enabled === false) {
        el.cube.hidden = true;
      } else if (el.cubeImg && cubeConfig.src) {
        el.cubeImg.src = cubeConfig.src;
      }
    }

    if (!Core || !el.stage || !el.galaxy) {
      showError('No se pudo inicializar GalaxyCore o faltan nodos del DOM.');
      return;
    }

    applyQueryFlags();
    measure();
    buildCards();
    renderList();
    bindEvents();
    observeStage();
    renderFrame(0);
    updateMotionUi();
    updateHud();

    if (state.motionEnabled && !state.paused) {
      startLoop();
    } else {
      stopLoop();
    }
  }

  function applyQueryFlags() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('debug')) {
      state.debug = params.get('debug') !== '0';
    }
    if (params.has('freeze')) {
      state.paused = true;
      state.motionEnabled = true;
    }
    if (params.has('static')) {
      state.paused = true;
      state.motionEnabled = false;
      state.reduced = true;
    }
    if (params.has('reduced')) {
      state.paused = false;
      state.motionEnabled = true;
      state.reduced = true;
    }
    if (params.has('mode')) {
      motionMode = params.get('mode') === 'galaxy' ? 'galaxy' : 'bowl';
    }
    if (state.debug && el.hud) {
      el.hud.hidden = false;
    }
  }

  function measure() {
    state.viewport = Core.computeViewport(window.innerWidth, window.innerHeight);
    var next = Core.computeProfile(state.viewport, layout);
    var changed = !state.profile ||
      state.profile.cardCount !== next.cardCount ||
      state.profile.arms !== next.arms ||
      state.profile.mobile !== next.mobile;
    state.profile = next;
    return changed;
  }

  function buildCards() {
    el.galaxy.innerHTML = '';
    state.cards = [];
    state.boosted = -1;
    hideDetail();

    var count = Math.min(state.profile.cardCount, projects.length);
    for (var i = 0; i < count; i += 1) {
      var card = createCard(projects[i], i, count);
      state.cards.push(card);
      el.galaxy.appendChild(card.el);
    }

    if (motionMode === 'bowl') {
      updateBowlParams();
      initBowlStates(count);
    }
  }

  function updateBowlParams() {
    var first = state.cards[0];
    var halfW = first ? first.el.offsetWidth / 2 : 90;
    var halfH = first ? first.el.offsetHeight / 2 : 56;
    state.bowlParams = Core.computeBowlParams(
      state.viewport,
      layout,
      halfW,
      halfH,
      state.profile.mobile
    );
  }

  function initBowlStates(count) {
    for (var i = 0; i < state.cards.length; i += 1) {
      state.cards[i].bowl = Core.createBowlState(i, count, state.bowlParams, i + 1);
    }
  }

  function scaleBowlStates(oldViewport, newViewport) {
    if (!oldViewport || !newViewport || !state.cards.length) {
      return;
    }
    var sx = newViewport.width / oldViewport.width;
    var sy = newViewport.height / oldViewport.height;
    for (var i = 0; i < state.cards.length; i += 1) {
      var bowl = state.cards[i].bowl;
      if (!bowl) {
        continue;
      }
      bowl.x *= sx;
      bowl.y *= sy;
      bowl.vx *= sx;
      bowl.vy *= sy;
    }
  }

  function createCard(project, index, count) {
    var article = document.createElement('article');
    article.className = 'galaxy-card';
    article.setAttribute('aria-hidden', 'true');
    article.dataset.index = String(index);

    var media = document.createElement('div');
    media.className = 'galaxy-card__media';

    // Capa base: poster real o degradado generado.
    if (project.poster) {
      var poster = document.createElement('img');
      poster.className = 'galaxy-card__poster';
      poster.src = project.poster;
      poster.alt = '';
      poster.loading = 'lazy';
      poster.decoding = 'async';
      media.appendChild(poster);
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'galaxy-card__poster galaxy-card__poster--generated';
      placeholder.style.setProperty('--i', String(index));
      placeholder.textContent = String(index + 1).padStart(2, '0');
      media.appendChild(placeholder);
    }

    var video = null;
    if (project.video && !state.saveData) {
      video = document.createElement('video');
      video.className = 'galaxy-card__video';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      if (project.poster) {
        video.poster = project.poster;
      }
      if (project.video) {
        var sourceWebm = document.createElement('source');
        sourceWebm.src = project.video;
        sourceWebm.type = project.video.indexOf('.webm') !== -1 ? 'video/webm' : 'video/mp4';
        video.appendChild(sourceWebm);
      }
      if (project.videoMp4) {
        var sourceMp4 = document.createElement('source');
        sourceMp4.src = project.videoMp4;
        sourceMp4.type = 'video/mp4';
        video.appendChild(sourceMp4);
      }
      video.addEventListener('error', function () {
        article.classList.add('has-error');
      }, true);
      video.addEventListener('loadeddata', function () {
        article.classList.add('is-ready');
      });
      video.addEventListener('loadedmetadata', function () {
        if (isFinite(video.duration) && video.duration > 0) {
          video.currentTime = (index * 1.37) % video.duration;
        }
        video.playbackRate = 0.85 + (index % 5) * 0.06;
      });
      media.appendChild(video);
    }

    var scrim = document.createElement('div');
    scrim.className = 'galaxy-card__scrim';

    var meta = document.createElement('div');
    meta.className = 'galaxy-card__meta';
    var tag = document.createElement('span');
    tag.className = 'galaxy-card__tag';
    tag.textContent = project.tag || '';
    var title = document.createElement('h3');
    title.className = 'galaxy-card__title';
    title.textContent = project.title || '';
    meta.appendChild(tag);
    meta.appendChild(title);

    var hit = document.createElement('button');
    hit.type = 'button';
    hit.className = 'galaxy-card__hit';
    hit.tabIndex = -1;
    hit.setAttribute('aria-hidden', 'true');
    hit.setAttribute('aria-label', 'Ampliar ' + (project.title || 'proyecto'));

    article.appendChild(media);
    article.appendChild(scrim);
    article.appendChild(meta);
    article.appendChild(hit);

    var card = {
      index: index,
      project: project,
      el: article,
      video: video,
      arm: index % state.profile.arms,
      phase: Core.initialPhase(index, count, state.profile.arms, state.profile.armJitter),
      bowl: null,
      renderZ: 0,
      boost: false,
      hover: false,
      videoActive: false,
      lastTransform: ''
    };

    hit.addEventListener('pointerenter', function () {
      card.hover = true;
      article.classList.add('is-hover');
    });
    hit.addEventListener('pointerleave', function () {
      card.hover = false;
      article.classList.remove('is-hover');
    });
    hit.addEventListener('click', function (event) {
      event.stopPropagation();
      toggleBoost(card.index);
    });

    return card;
  }

  function renderList() {
    if (!el.list) {
      return;
    }
    el.list.innerHTML = '';
    projects.forEach(function (project) {
      var item = document.createElement('article');
      item.className = 'project-item';

      var tag = document.createElement('span');
      tag.className = 'project-item__tag';
      tag.textContent = project.tag || '';

      var title = document.createElement('h3');
      title.className = 'project-item__title';
      title.textContent = project.title || '';

      var desc = document.createElement('p');
      desc.className = 'project-item__desc';
      desc.textContent = project.description || '';

      var links = document.createElement('p');
      links.className = 'project-item__links';
      if (project.url) {
        var demo = document.createElement('a');
        demo.href = project.url;
        demo.target = '_blank';
        demo.rel = 'noopener noreferrer';
        demo.textContent = 'Demo';
        links.appendChild(demo);
      }
      if (project.repo) {
        var repo = document.createElement('a');
        repo.href = project.repo;
        repo.target = '_blank';
        repo.rel = 'noopener noreferrer';
        repo.textContent = 'Código';
        links.appendChild(repo);
      }

      item.appendChild(tag);
      item.appendChild(title);
      item.appendChild(desc);
      item.appendChild(links);
      el.list.appendChild(item);
    });
  }

  function renderFrame(dt) {
    var profile = state.profile;
    var viewport = state.viewport;
    if (!profile || !viewport) {
      return;
    }

    var motionFactor = state.reduced ? 0.22 : 1;

    if (state.motionEnabled && !state.paused) {
      state.motionTime += dt * motionFactor;
    }
    var motionTime = state.motionTime;

    if (state.reduced || !state.motionEnabled) {
      state.targetX = 0;
      state.targetY = 0;
      state.pointerActive = false;
      if (el.cube) {
        el.cube.style.setProperty('--cube-rx', '0deg');
        el.cube.style.setProperty('--cube-ry', '0deg');
        el.cube.style.setProperty('--cube-x', '0px');
        el.cube.style.setProperty('--cube-y', '0px');
      }
    }

    if (state.motionEnabled && !state.paused) {
      if (motionMode === 'bowl') {
        var pointer = {
          x: state.targetX * viewport.width / 2,
          y: state.targetY * viewport.height / 2,
          active: state.pointerActive
        };
        for (var b = 0; b < state.cards.length; b += 1) {
          var bowlCard = state.cards[b];
          if (!bowlCard.hover && !bowlCard.boost && bowlCard.bowl) {
            bowlCard.bowl = Core.stepBowl(bowlCard.bowl, state.bowlParams, dt * motionFactor, motionTime, pointer);
          }
        }
        var bowls = state.cards.map(function (card) {
          return card.bowl;
        });
        if (bowls.length === state.cards.length && bowls[0]) {
          var separated = Core.applySeparation(bowls, state.bowlParams, dt * motionFactor);
          var resolved = Core.resolveCollisions(separated, state.bowlParams, dt * motionFactor);
          for (var s = 0; s < state.cards.length; s += 1) {
            if (!state.cards[s].hover && !state.cards[s].boost) {
              state.cards[s].bowl = resolved[s];
            }
          }
        }
      } else {
        state.spin = (state.spin + profile.spinDegPerSecond * dt * motionFactor) % 360;
        var speed = profile.journeysPerMinute / 60;
        for (var i = 0; i < state.cards.length; i += 1) {
          var card = state.cards[i];
          if (!card.hover && !card.boost) {
            card.phase = Core.wrap01(card.phase + speed * dt * motionFactor);
          }
        }
      }
    }

    var ease = Math.min(1, dt * 6) || 0.1;
    state.pointerX += (state.targetX - state.pointerX) * ease;
    state.pointerY += (state.targetY - state.pointerY) * ease;

    if (el.cube && !el.cube.hidden && state.motionEnabled && !state.reduced) {
      var cubeTiltX = cubeConfig.tiltMaxX != null ? cubeConfig.tiltMaxX : 12;
      var cubeTiltY = cubeConfig.tiltMaxY != null ? cubeConfig.tiltMaxY : 16;
      var cubeOffset = cubeConfig.floatOffset != null ? cubeConfig.floatOffset : 6;
      el.cube.style.setProperty('--cube-rx', (state.pointerY * cubeTiltX).toFixed(2) + 'deg');
      el.cube.style.setProperty('--cube-ry', (state.pointerX * cubeTiltY).toFixed(2) + 'deg');
      el.cube.style.setProperty('--cube-x', (state.pointerX * cubeOffset).toFixed(1) + 'px');
      el.cube.style.setProperty('--cube-y', (state.pointerY * cubeOffset).toFixed(1) + 'px');
    }

    if (el.galaxy) {
      if (motionMode === 'bowl' && state.bowlParams) {
        el.galaxy.style.transform =
          'rotateX(' + (state.pointerY * state.bowlParams.tiltMax).toFixed(2) + 'deg) ' +
          'rotateY(' + (state.pointerX * state.bowlParams.tiltMax).toFixed(2) + 'deg)';
      } else {
        el.galaxy.style.transform =
          'rotateX(' + (state.pointerY * profile.tiltMax).toFixed(2) + 'deg) ' +
          'rotateY(' + (state.pointerX * profile.tiltMax).toFixed(2) + 'deg) ' +
          'rotateZ(' + state.spin.toFixed(2) + 'deg)';
      }
    }

    for (var j = 0; j < state.cards.length; j += 1) {
      var current = state.cards[j];
      var tr;
      if (motionMode === 'bowl' && current.bowl && state.bowlParams) {
        tr = Core.computeBowlRender(current.bowl, state.bowlParams, motionTime, current.boost, current.hover);
      } else {
        tr = Core.computeCardTransform({
          phase: current.phase,
          arm: current.arm,
          profile: profile,
          viewport: viewport,
          spinDeg: state.spin,
          boost: current.boost,
          hover: current.hover
        });
      }
      current.renderZ = tr.z;

      var transform = 'translate3d(' + tr.x.toFixed(1) + 'px,' + tr.y.toFixed(1) + 'px,' + tr.z.toFixed(1) + 'px) ' +
        'rotateX(' + tr.rotX.toFixed(2) + 'deg) ' +
        'rotateY(' + tr.rotY.toFixed(2) + 'deg) ' +
        'rotateZ(' + tr.rotZ.toFixed(2) + 'deg) ' +
        'scale(' + tr.scale.toFixed(3) + ')';

      if (transform !== current.lastTransform) {
        current.el.style.transform = transform;
        current.lastTransform = transform;
      }
      current.el.style.opacity = tr.opacity.toFixed(3);
      current.el.style.filter = tr.blur > 0.15 ? 'blur(' + tr.blur.toFixed(2) + 'px)' : 'none';
      current.el.style.zIndex = current.boost ? '10000' : String(Math.round(5000 + tr.z));
    }

    updateVideos();
  }

  function updateVideos() {
    var profile = state.profile;
    if (!profile) {
      return;
    }
    var canPlay = state.motionEnabled && !state.paused && !state.reduced &&
      state.stageVisible && !document.hidden && !state.saveData;

    for (var i = 0; i < state.cards.length; i += 1) {
      var card = state.cards[i];
      if (!card.video) {
        continue;
      }
      var active;
      if (motionMode === 'bowl') {
        var threshold = state.bowlParams
          ? state.bowlParams.depthAmp * state.bowlParams.videoZThreshold
          : -20;
        active = canPlay && i < profile.videoSlots && card.renderZ > threshold;
      } else {
        active = canPlay &&
          i < profile.videoSlots &&
          card.phase > profile.videoStart &&
          card.phase < profile.videoEnd;
      }

      if (active !== card.videoActive) {
        card.videoActive = active;
        if (active) {
          var promise = card.video.play();
          if (promise && promise.catch) {
            promise.catch(function () {});
          }
        } else {
          card.video.pause();
        }
      }
    }
  }

  function toggleBoost(index) {
    if (state.boosted === index) {
      unboost();
      return;
    }
    unboost();
    var card = state.cards[index];
    if (!card) {
      return;
    }
    state.boosted = index;
    card.boost = true;
    card.el.classList.add('is-boosted');
    showDetail(card.project);
    if (card.video) {
      var promise = card.video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }
  }

  function unboost() {
    if (state.boosted < 0) {
      return;
    }
    var card = state.cards[state.boosted];
    if (card) {
      card.boost = false;
      card.el.classList.remove('is-boosted');
    }
    state.boosted = -1;
    hideDetail();
  }

  function showDetail(project) {
    if (!el.detail) {
      return;
    }
    var localized = (window.GALAXY_TRANSLATIONS && window.GALAXY_TRANSLATIONS[project.id]) || project;
    if (el.detailTitle) {
      el.detailTitle.textContent = localized.title || project.title || '';
    }
    if (el.detailText) {
      el.detailText.textContent = localized.description || project.description || '';
    }
    if (el.detailTag) {
      el.detailTag.textContent = localized.tag || project.tag || '';
    }
    if (el.detailLink) {
      if (project.url) {
        el.detailLink.href = project.url;
        el.detailLink.hidden = false;
      } else {
        el.detailLink.hidden = true;
      }
    }
    el.detail.classList.add('is-visible');
    el.detail.setAttribute('aria-hidden', 'false');
  }

  function hideDetail() {
    if (!el.detail) {
      return;
    }
    el.detail.classList.remove('is-visible');
    el.detail.setAttribute('aria-hidden', 'true');
  }

  function bindEvents() {
    el.stage.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') {
        return;
      }
      state.pointerActive = true;
      state.targetX = Core.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      state.targetY = Core.clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
    });

    el.stage.addEventListener('pointerleave', function () {
      state.pointerActive = false;
      state.targetX = 0;
      state.targetY = 0;
    });

    el.stage.addEventListener('click', function (event) {
      if (event.target === el.stage || event.target === el.galaxy) {
        unboost();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        unboost();
      }
      if (event.key.toLowerCase() === 'd' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        toggleDebug();
      }
    });

    if (el.pauseBtn) {
      el.pauseBtn.addEventListener('click', togglePause);
    }
    if (el.motionBtn) {
      el.motionBtn.addEventListener('click', toggleMotion);
    }
    if (el.debugBtn) {
      el.debugBtn.addEventListener('click', toggleDebug);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        pauseVideos();
        stopLoop();
      } else if (state.motionEnabled && !state.paused) {
        startLoop();
        updateVideos();
      }
    });

    window.addEventListener('resize', debounce(function () {
      var oldViewport = state.viewport;
      var changed = measure();
      if (changed) {
        buildCards();
      } else if (motionMode === 'bowl' && oldViewport) {
        scaleBowlStates(oldViewport, state.viewport);
        updateBowlParams();
      }
      renderFrame(0);
      updateHud();
    }, 200));

    if (reducedMotionQuery && reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', function () {
        if (reducedMotionQuery.matches) {
          state.motionEnabled = false;
          state.reduced = true;
          state.paused = false;
          pauseVideos();
          stopLoop();
        } else {
          state.motionEnabled = true;
          state.reduced = false;
          if (!state.paused) {
            startLoop();
          }
        }
        updateMotionUi();
        renderFrame(0);
      });
    }
  }

  function togglePause() {
    state.paused = !state.paused;
    if (state.paused) {
      pauseVideos();
      stopLoop();
    } else if (state.motionEnabled) {
      startLoop();
    }
    updateMotionUi();
  }

  function toggleMotion() {
    if (!state.motionEnabled) {
      // Estaba detenido (por ejemplo, por preferencia del sistema):
      // se activa con movimiento reducido.
      state.motionEnabled = true;
      state.reduced = true;
      state.paused = false;
    } else if (!state.reduced) {
      // Pasa de movimiento completo a movimiento reducido.
      state.reduced = true;
    } else {
      // Vuelve al movimiento completo.
      state.reduced = false;
    }

    if (!state.motionEnabled) {
      pauseVideos();
      stopLoop();
    } else if (!state.paused) {
      startLoop();
    }
    updateMotionUi();
    renderFrame(0);
  }

  function toggleDebug() {
    state.debug = !state.debug;
    if (el.hud) {
      el.hud.hidden = !state.debug;
    }
    updateHud();
  }

  function pauseVideos() {
    state.cards.forEach(function (card) {
      if (card.video) {
        card.video.pause();
        card.videoActive = false;
      }
    });
  }

  function updateMotionUi() {
    var labelPause = labels.pause || 'Pausar';
    var labelResume = labels.resume || 'Reanudar';
    var labelReduce = labels.reduce || 'Reducir movimiento';
    var labelNormal = labels.normal || 'Movimiento normal';
    var labelEnable = labels.enable || 'Activar movimiento';

    if (el.pauseBtn) {
      el.pauseBtn.textContent = state.paused ? labelResume : labelPause;
      el.pauseBtn.setAttribute('aria-pressed', String(state.paused));
    }
    if (el.motionBtn) {
      var motionLabel = !state.motionEnabled
        ? labelEnable
        : (state.reduced ? labelNormal : labelReduce);
      el.motionBtn.textContent = motionLabel;
      el.motionBtn.setAttribute('aria-pressed', String(state.reduced || !state.motionEnabled));
    }
    if (el.debugBtn) {
      el.debugBtn.setAttribute('aria-pressed', String(state.debug));
    }
    if (el.stage) {
      el.stage.classList.toggle('is-paused', state.paused || !state.motionEnabled);
      el.stage.classList.toggle('is-reduced', state.reduced && state.motionEnabled && !state.paused);
    }
    if (el.hero) {
      el.hero.classList.toggle('is-static', !state.motionEnabled);
    }
  }

  function startLoop() {
    if (state.rafId) {
      return;
    }
    state.lastTime = 0;
    state.rafId = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
    }
    state.rafId = 0;
  }

  function loop(now) {
    if (!state.lastTime) {
      state.lastTime = now;
    }
    var dt = Math.min((now - state.lastTime) / 1000, 0.05);
    state.lastTime = now;
    renderFrame(dt);
    updateFps(dt);
    state.rafId = window.requestAnimationFrame(loop);
  }

  function updateFps(dt) {
    state.frames += 1;
    state.fpsTime += dt;
    if (state.fpsTime >= 0.5) {
      state.fps = state.frames / state.fpsTime;
      state.frames = 0;
      state.fpsTime = 0;
      updateHud();
    }
  }

  function updateHud() {
    if (!el.hud || el.hud.hidden || !state.profile) {
      return;
    }
    var activeVideos = state.cards.filter(function (card) {
      return card.videoActive;
    }).length;
    var fpsLabel = state.fpsTime === 0 && state.frames === 0 ? '--' : state.fps.toFixed(0);
    el.hud.textContent =
      'FPS ' + fpsLabel +
      ' · tarjetas ' + state.cards.length +
      ' · videos ' + activeVideos +
      ' · ' + (state.profile.mobile ? 'móvil' : 'escritorio') +
      ' · ' + (motionMode === 'bowl' ? 'pecera' : 'galaxia') +
      (state.paused ? ' · pausado' : '') +
      (state.reduced ? ' · movimiento reducido' : '') +
      (state.motionEnabled ? '' : ' · detenido');
  }

  function observeStage() {
    if (!('IntersectionObserver' in window) || !el.stage) {
      return;
    }
    state.observer = new IntersectionObserver(function (entries) {
      state.stageVisible = entries[0].isIntersecting;
      if (!state.stageVisible) {
        pauseVideos();
        stopLoop();
      } else if (state.motionEnabled && !state.paused) {
        startLoop();
        updateVideos();
      }
    }, { threshold: 0.05 });
    state.observer.observe(el.stage);
  }

  function debounce(fn, wait) {
    var timer = 0;
    return function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, wait);
    };
  }

  function showError(message) {
    var banner = byId('galaxy-error');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'galaxy-error';
      banner.className = 'galaxy-error';
      document.body.appendChild(banner);
    }
    banner.textContent = 'Error en el prototipo: ' + message;
    banner.hidden = false;
  }

  window.addEventListener('error', function (event) {
    showError(event.message || 'error desconocido');
  });

  window.addEventListener('unhandledrejection', function (event) {
    showError(String(event.reason || 'promesa rechazada'));
  });

  window.GalaxyIntro = {
    setLabels: function (next) {
      labels = next || {};
      updateMotionUi();
    },
    refreshUi: updateMotionUi
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
