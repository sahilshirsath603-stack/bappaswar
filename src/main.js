// Main Devotional Experience & UI Controller
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GaneshaImageModel, MURTI_IMAGES } from './GaneshaImageMesh.js';
import { TempleSanctum } from './TempleSanctum.js';
import { ParticleEngine } from './ParticleEngine.js';
import { GalaxyBackground } from './GalaxyBackground.js';
import { PostProcessingManager } from './PostProcessing.js';
import { player, SOUND_PROFILES } from './AudioSynth.js';
import { MUSIC_CATALOG } from './musicData.js';

class ExperienceApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.mouse = new THREE.Vector2();
    this.targetMouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.currentTheme = 'gold'; // Warm devotional saffron & gold sanctuary

    // 1. Initialize all UI and audio systems FIRST so user can immediately play music
    this.initMusicPlayerUI();
    this.initOfferingsUI();
    this.initModals();
    this.completeLoading();
    this.registerServiceWorker();
    this.initPwaInstall();

    // 2. Only initialize Three.js if canvas container is actually visible
    const isCanvasVisible = this.container && window.getComputedStyle(this.container).display !== 'none';
    if (isCanvasVisible) {
      this.init3D();
    } else {
      console.log('[Bappa Swar] Devotional Studio Sanctuary active (0% GPU load, maximum battery efficiency & zero crash).');
    }
  }

  init3D() {
    try {
      this.initRenderer();
      this.initScene();
      this.initCamera();
      this.initLighting();
      this.initWorld();
      this.initPostProcessing();
      this.initEvents();
      this.setTheme('gold');

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    } catch (err) {
      console.warn('[Bappa Swar] 3D initialization bypassed:', err);
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      });
    }
  }

  // Seamless 1-Click Device Installation (Android, iOS, Desktop PWA)
  initPwaInstall() {
    const btnInstall = document.getElementById('btn-install-pwa');
    const modalInstall = document.getElementById('install-modal');
    const btnCloseInstall = document.getElementById('close-install-modal');
    const btnModalAction = document.getElementById('btn-modal-install-action');
    let deferredPrompt = null;

    if (!btnInstall) return;

    // Detect if already installed in standalone window mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      btnInstall.innerHTML = '<span class="install-icon">✓</span><span class="install-text">Installed</span>';
      btnInstall.classList.add('installed');
      btnInstall.title = 'Bappa Swar App is already installed on this device';
      btnInstall.disabled = true;
      return;
    }

    // Capture browser native install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      btnInstall.classList.add('pulse');
      if (btnModalAction) btnModalAction.style.display = 'inline-flex';
    });

    const triggerInstall = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          console.log('[Bappa Swar] User accepted app installation');
          btnInstall.innerHTML = '<span class="install-icon">✓</span><span class="install-text">Installed</span>';
          btnInstall.classList.add('installed');
          btnInstall.disabled = true;
          if (modalInstall) modalInstall.classList.remove('show');
        }
        deferredPrompt = null;
      } else {
        // iOS or browsers where native prompt is unavailable: show guided modal
        if (modalInstall) {
          modalInstall.classList.add('show');
        }
      }
    };

    btnInstall.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerInstall();
    });

    if (btnModalAction) {
      btnModalAction.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerInstall();
      });
    }

    if (btnCloseInstall) {
      btnCloseInstall.addEventListener('click', () => {
        modalInstall.classList.remove('show');
      });
    }

    if (modalInstall) {
      modalInstall.addEventListener('click', (e) => {
        if (e.target === modalInstall) modalInstall.classList.remove('show');
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('[Bappa Swar] App successfully installed on device!');
      btnInstall.innerHTML = '<span class="install-icon">✓</span><span class="install-text">Installed</span>';
      btnInstall.classList.add('installed');
      btnInstall.disabled = true;
      if (modalInstall) modalInstall.classList.remove('show');
    });
  }

  initRenderer() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Cap device pixel ratio on mobile to prevent VRAM and fill-rate exhaustion
    const maxDPR = this.isMobile ? 1.5 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDPR));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isMobile ? THREE.BasicShadowMap : THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Context loss handlers to prevent Android black screen/freeze
    this.isContextLost = false;
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost. Pausing render.');
      this.isContextLost = true;
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.warn('WebGL context restored. Reinitializing.');
      this.isContextLost = false;
    }, false);
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Warm devotional deep maroon-night fog
    this.scene.fog = new THREE.FogExp2(0x140204, 0.014);
    this.scene.background = new THREE.Color(0x140204);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    // Well-framed perspective showcasing the Ganpati murti centrally
    this.defaultCameraPos = new THREE.Vector3(0, 2.7, 9.4);
    this.defaultTarget = new THREE.Vector3(0, 2.5, 0);

    this.camera.position.copy(this.defaultCameraPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
    this.controls.target.copy(this.defaultTarget);
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 14.0;
    this.controls.maxPolarAngle = Math.PI * 0.52;
    this.controls.minPolarAngle = Math.PI * 0.15;
    this.controls.autoRotate = false;
  }

  initLighting() {
    this.lightsGroup = new THREE.Group();

    // Devotional Warm Ambient
    this.ambientLight = new THREE.AmbientLight(0x40100a, 1.4);
    this.lightsGroup.add(this.ambientLight);

    // Key Front-Right Warm Golden Light
    this.keyLight = new THREE.DirectionalLight(0xffecd1, 2.4);
    this.keyLight.position.set(3.5, 6.5, 5.0);
    this.keyLight.castShadow = true;
    const shadowRes = this.isMobile ? 1024 : 2048;
    this.keyLight.shadow.mapSize.width = shadowRes;
    this.keyLight.shadow.mapSize.height = shadowRes;
    this.keyLight.shadow.camera.near = 1.0;
    this.keyLight.shadow.camera.far = 20.0;
    this.keyLight.shadow.bias = -0.0005;
    this.lightsGroup.add(this.keyLight);

    // Warm Saffron / Amber Rim Light
    this.rimLight = new THREE.DirectionalLight(0xff9100, 2.2);
    this.rimLight.position.set(-3.5, 5.5, -4.0);
    this.lightsGroup.add(this.rimLight);

    // Soft Golden Uplight on Sacred Lotus Throne
    this.pedestalLight = new THREE.PointLight(0xffb703, 1.8, 7.5, 1.8);
    this.pedestalLight.position.set(0, 0.4, 1.8);
    this.lightsGroup.add(this.pedestalLight);

    // Sacred Spotlight directly on the Ganpati Murti
    this.spotLight = new THREE.SpotLight(0xfff3d6, 2.8, 12, Math.PI * 0.3, 0.35, 1.0);
    this.spotLight.position.set(0, 4.5, 5.2);
    this.spotLight.target.position.set(0, 2.7, 0);
    this.lightsGroup.add(this.spotLight);
    this.lightsGroup.add(this.spotLight.target);

    this.scene.add(this.lightsGroup);
  }

  initWorld() {
    // 1. Cosmic Temple Background
    this.galaxy = new GalaxyBackground(this.scene);

    // 2. 3D Sacred Ganpati Murti Centerpiece with high-res portrait
    this.ganesha = new GaneshaImageModel();
    this.scene.add(this.ganesha.group);

    // 3. Temple Sanctum with bells and brass lamps
    this.sanctum = new TempleSanctum();
    this.scene.add(this.sanctum.group);

    // 4. Floating Devotional Particles
    this.particles = new ParticleEngine(this.scene);
  }

  initPostProcessing() {
    this.postProcessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera
    );
  }

  initEvents() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.postProcessing.resize(width, height);
    });

    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Tap temple bells to ring
    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#hud-ui') || e.target.closest('.modal')) return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.sanctum.group.children, true);

      for (let hit of intersects) {
        let cur = hit.object;
        while (cur) {
          if (cur.userData && cur.userData.isBell) {
            this.sanctum.ringBell(cur.userData.index);
            player.playTempleBell(0.9 + Math.random() * 0.2);
            return;
          }
          cur = cur.parent;
        }
      }
    });

    // Double-tap to reset camera view
    let lastTap = 0;
    window.addEventListener('pointerup', (e) => {
      if (e.target.closest('#hud-ui') || e.target.closest('.modal')) return;
      const now = Date.now();
      if (now - lastTap < 300) {
        this.resetCamera();
      }
      lastTap = now;
    });
  }

  resetCamera() {
    const startPos = this.camera.position.clone();
    const startTime = performance.now();
    const duration = 900;

    const animateReset = (now) => {
      const elapsed = (now - startTime) / duration;
      const t = Math.min(1.0, elapsed);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, this.defaultCameraPos, ease);
      this.controls.target.lerp(this.defaultTarget, ease);
      this.controls.update();

      if (t < 1.0) {
        requestAnimationFrame(animateReset);
      }
    };
    requestAnimationFrame(animateReset);
  }

  // =========================================================
  // MUSIC PLAYER & PLAYLIST LOGIC
  // =========================================================

  initMusicPlayerUI() {
    // 3 Primary Mode Cards
    const btnShlok = document.getElementById('btn-mode-shlok');
    const btnAarti = document.getElementById('btn-mode-aarti');
    const btnSongs = document.getElementById('btn-mode-songs');
    const modeCards = [btnShlok, btnAarti, btnSongs];

    // Player Controls Elements
    const btnPlayPause = document.getElementById('btn-play-pause');
    const iconPlay = btnPlayPause.querySelector('.icon-play');
    const iconPause = btnPlayPause.querySelector('.icon-pause');
    const btnStop = document.getElementById('btn-stop');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    // Track Info Elements
    const trackCategory = document.getElementById('track-category');
    const trackStatus = document.getElementById('track-status');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');

    // Progress Bar & Time
    const seekerBar = document.getElementById('seeker-bar');
    const seekerFill = document.getElementById('seeker-fill');
    const seekerHandle = document.getElementById('seeker-handle');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');

    // Volume Elements
    const volumeSlider = document.getElementById('volume-slider');
    const btnMute = document.getElementById('btn-mute');
    const iconVolHigh = btnMute.querySelector('.icon-vol-high');
    const iconVolMuted = btnMute.querySelector('.icon-vol-muted');

    // Format mm:ss helper
    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Mode Buttons Click Handlers ---
    btnShlok.addEventListener('click', () => {
      player.selectMode('shlok', true);
      if (this.particles) this.particles.triggerFlowerShower();
    });

    btnAarti.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-aarti-menu')) return;
      player.selectMode('aarti', true);
      if (this.sanctum) this.sanctum.toggleAarti();
      player.playShankh();
    });

    btnSongs.addEventListener('click', () => {
      player.selectMode('songs', true);
    });

    // --- Core Player Controls ---
    btnPlayPause.addEventListener('click', () => {
      player.togglePlayPause();
    });

    btnStop.addEventListener('click', () => {
      player.stop();
      btnStop.classList.add('pulse');
      setTimeout(() => btnStop.classList.remove('pulse'), 400);
    });

    btnPrev.addEventListener('click', () => {
      player.prevSong(true);
      btnPrev.classList.add('pulse');
      setTimeout(() => btnPrev.classList.remove('pulse'), 400);
    });

    btnNext.addEventListener('click', () => {
      player.nextSong(true);
      btnNext.classList.add('pulse');
      setTimeout(() => btnNext.classList.remove('pulse'), 400);
    });

    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        const isShuffle = player.toggleShuffle();
        btnShuffle.classList.toggle('active', isShuffle);
        btnShuffle.title = isShuffle ? 'Shuffle Mode (Active)' : 'Shuffle Mode (Off)';
        btnShuffle.classList.add('pulse');
        setTimeout(() => btnShuffle.classList.remove('pulse'), 300);
      });

      player.onShuffleChange((isShuffle) => {
        btnShuffle.classList.toggle('active', isShuffle);
        btnShuffle.title = isShuffle ? 'Shuffle Mode (Active)' : 'Shuffle Mode (Off)';
      });
    }

    // --- Seeker Bar Click & Drag ---
    let isDraggingSeeker = false;

    const handleSeek = (e) => {
      const rect = seekerBar.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = (clickX / rect.width) * 100;
      seekerFill.style.width = `${percentage}%`;
      seekerHandle.style.left = `${percentage}%`;
      player.seek(percentage);
    };

    seekerBar.addEventListener('mousedown', (e) => {
      isDraggingSeeker = true;
      handleSeek(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingSeeker) handleSeek(e);
    });

    window.addEventListener('mouseup', () => {
      isDraggingSeeker = false;
    });

    // Touch support for seeker
    seekerBar.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        isDraggingSeeker = true;
        const rect = seekerBar.getBoundingClientRect();
        const touchX = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        player.seek((touchX / rect.width) * 100);
      }
    }, { passive: true });

    seekerBar.addEventListener('touchmove', (e) => {
      if (isDraggingSeeker && e.touches.length > 0) {
        const rect = seekerBar.getBoundingClientRect();
        const touchX = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        player.seek((touchX / rect.width) * 100);
      }
    }, { passive: true });

    seekerBar.addEventListener('touchend', () => {
      isDraggingSeeker = false;
    });

    // --- Volume Slider & Mute ---
    volumeSlider.addEventListener('input', (e) => {
      player.setVolume(parseFloat(e.target.value));
    });

    btnMute.addEventListener('click', () => {
      player.toggleMute();
    });

    // --- Repeat Button (if present) ---
    const btnRepeat = document.getElementById('btn-repeat');
    if (btnRepeat) {
      btnRepeat.addEventListener('click', () => {
        const isRepeat = player.toggleRepeat();
        btnRepeat.classList.toggle('active', isRepeat);
        btnRepeat.classList.add('pulse');
        setTimeout(() => btnRepeat.classList.remove('pulse'), 400);
      });
      if (player.onRepeatChange) {
        player.onRepeatChange((isRepeat) => {
          btnRepeat.classList.toggle('active', isRepeat);
        });
      }
    }

    // --- Top Bar Actions ---
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // --- Player Callbacks & UI Sync ---
    player.onTrackChange((track, mode, songIndex) => {
      if (!track) return;

      // Update Track Info
      trackCategory.textContent = track.category || (mode === 'shlok' ? 'श्लोक' : mode === 'aarti' ? 'आरती' : 'भक्तिगीत');
      trackTitle.textContent = track.title;
      trackArtist.textContent = `${track.artist} • ${track.subtitle || ''}`;

      // Update Active Mode Card
      modeCards.forEach(c => c.classList.remove('active'));
      if (mode === 'shlok') {
        btnShlok.classList.add('active');
        if (track.duration) {
          totalDurationEl.textContent = track.duration;
        }
      } else if (mode === 'aarti') {
        btnAarti.classList.add('active');
        const cardAartiSub = document.getElementById('card-aarti-sub');
        if (cardAartiSub) {
          cardAartiSub.textContent = `${track.title} • ${track.artist}`;
        }
        if (track.duration) {
          totalDurationEl.textContent = track.duration;
        }
      } else if (mode === 'songs') {
        btnSongs.classList.add('active');
        const cardSongsSub = document.getElementById('card-songs-sub');
        if (cardSongsSub) {
          cardSongsSub.textContent = `${track.title} • ${track.artist}`;
        }
        if (track.duration) {
          totalDurationEl.textContent = track.duration;
        }
      }

      // Prev & Next Buttons state: active in songs and aarti modes
      const canNavigate = mode === 'songs' || mode === 'aarti';
      btnPrev.disabled = !canNavigate;
      btnNext.disabled = !canNavigate;

      // Update active item in aarti menu
      document.querySelectorAll('.aarti-menu-item').forEach((item, idx) => {
        if (mode === 'aarti' && idx === player.currentAartiIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Update active item in playlist drawer
      document.querySelectorAll('.playlist-item').forEach((item, idx) => {
        if (mode === 'songs' && idx === songIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    });

    player.onStateChange((isPlaying, mode) => {
      if (isPlaying) {
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
        trackStatus.textContent = 'वाजत आहे (Playing)';
        trackStatus.style.color = 'var(--gold-primary)';

        // Animate active card equalizer bars
        modeCards.forEach(c => c.classList.remove('playing'));
        if (mode === 'shlok') btnShlok.classList.add('playing');
        else if (mode === 'aarti') btnAarti.classList.add('playing');
        else if (mode === 'songs') btnSongs.classList.add('playing');
      } else {
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
        trackStatus.textContent = 'विराम (Paused)';
        trackStatus.style.color = 'var(--text-muted)';
        modeCards.forEach(c => c.classList.remove('playing'));
      }
    });

    player.onTimeUpdate((currentTime, duration, progressPercent) => {
      currentTimeEl.textContent = formatTime(currentTime);
      if (duration && !isNaN(duration) && duration > 0) {
        totalDurationEl.textContent = formatTime(duration);
      }

      if (!isDraggingSeeker) {
        seekerFill.style.width = `${progressPercent}%`;
        seekerHandle.style.left = `${progressPercent}%`;
      }
    });

    player.onVolumeChange((volume, isMuted) => {
      volumeSlider.value = isMuted ? 0 : volume;
      if (isMuted || volume === 0) {
        iconVolHigh.style.display = 'none';
        iconVolMuted.style.display = 'block';
      } else {
        iconVolHigh.style.display = 'block';
        iconVolMuted.style.display = 'none';
      }
    });

    // Populate Aarti Menu (Dedicated only for Aarti)
    this.initAartiMenu();

    // Populate Playlist Drawer
    this.initPlaylistDrawer();

    // Initialize Spotify-Grade Hi-Fi Studio Sound Enhancer
    this.initHiFiStudioUI();

    // Feature the fresh random Bhakti song on the mode card for instant discovery
    const initialRandomSong = MUSIC_CATALOG.songs && MUSIC_CATALOG.songs[player.currentSongIndex];
    if (initialRandomSong) {
      const cardSongsSub = document.getElementById('card-songs-sub');
      if (cardSongsSub) {
        cardSongsSub.textContent = `अखंड भक्तिगीते • ${initialRandomSong.title}`;
      }
    }
  }

  // =========================================================
  // DEDICATED ALL AARTIS MENU (ONLY FOR AARTI)
  // =========================================================

  initAartiMenu() {
    const aartiContainer = document.getElementById('aarti-list-container');
    const modalAarti = document.getElementById('aarti-modal');
    const btnOpenAarti = document.getElementById('btn-open-aarti-menu');
    const btnCloseAarti = document.getElementById('close-aarti-modal');

    if (!aartiContainer || !modalAarti) return;

    aartiContainer.innerHTML = '';
    const aartis = MUSIC_CATALOG.aartis || [MUSIC_CATALOG.aarti];

    aartis.forEach((aarti, idx) => {
      const item = document.createElement('div');
      item.className = `aarti-menu-item ${idx === player.currentAartiIndex ? 'active' : ''}`;
      item.dataset.index = idx;
      item.innerHTML = `
        <div class="aarti-item-num">${(idx + 1).toString().padStart(2, '0')}</div>
        <div class="aarti-item-icon">🪔</div>
        <div class="aarti-item-info">
          <div class="aarti-item-title">${aarti.title}</div>
          <div class="aarti-item-sub">${aarti.artist} • ${aarti.subtitle}</div>
        </div>
        <div class="aarti-item-duration">${aarti.duration || ''}</div>
      `;

      item.addEventListener('click', () => {
        player.selectAartiByIndex(idx, true);
        if (this.sanctum) this.sanctum.toggleAarti();
        player.playShankh();
        modalAarti.classList.remove('show');
      });

      aartiContainer.appendChild(item);
    });

    if (btnOpenAarti) {
      btnOpenAarti.addEventListener('click', (e) => {
        e.stopPropagation();
        modalAarti.classList.add('show');
      });
    }

    if (btnCloseAarti) {
      btnCloseAarti.addEventListener('click', () => {
        modalAarti.classList.remove('show');
      });
    }

    modalAarti.addEventListener('click', (e) => {
      if (e.target === modalAarti) modalAarti.classList.remove('show');
    });
  }

  initPlaylistDrawer() {
    const playlistContainer = document.getElementById('playlist-container');
    const modalPlaylist = document.getElementById('playlist-modal');
    const btnOpenPlaylist = document.getElementById('btn-playlist-drawer');
    const btnClosePlaylist = document.getElementById('close-playlist');

    if (!playlistContainer || !modalPlaylist || !btnOpenPlaylist) return;

    playlistContainer.innerHTML = '';
    MUSIC_CATALOG.songs.forEach((song, idx) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.innerHTML = `
        <div class="playlist-item-num">${(idx + 1).toString().padStart(2, '0')}</div>
        <div class="playlist-item-details">
          <div class="playlist-item-title">${song.title}</div>
          <div class="playlist-item-sub">${song.artist}</div>
        </div>
        <div class="playlist-item-badge">भक्तिगीत</div>
      `;

      item.addEventListener('click', () => {
        player.selectSongByIndex(idx, true);
        modalPlaylist.classList.remove('show');
      });

      playlistContainer.appendChild(item);
    });

    btnOpenPlaylist.addEventListener('click', () => {
      modalPlaylist.classList.add('show');
    });

    btnClosePlaylist.addEventListener('click', () => {
      modalPlaylist.classList.remove('show');
    });

    modalPlaylist.addEventListener('click', (e) => {
      if (e.target === modalPlaylist) modalPlaylist.classList.remove('show');
    });
  }

  // =========================================================
  // SPOTIFY-GRADE HI-FI STUDIO SOUND ENHANCER UI
  // =========================================================

  initHiFiStudioUI() {
    const btnOpenHiFi = document.getElementById('btn-open-hifi');
    const modalHiFi = document.getElementById('hifi-modal');
    const btnCloseHiFi = document.getElementById('close-hifi');
    const masterToggle = document.getElementById('hifi-master-toggle');
    const badgeStatus = document.getElementById('hifi-badge-status');
    const statusText = document.getElementById('hifi-status-text');
    const profilesGrid = document.getElementById('hifi-profiles-grid');
    const canvas = document.getElementById('hifi-spectrum-canvas');

    if (!btnOpenHiFi || !modalHiFi) return;

    // 1. Render Sound Profile Cards
    const renderProfiles = () => {
      if (!profilesGrid) return;
      profilesGrid.innerHTML = '';
      Object.values(SOUND_PROFILES).forEach(profile => {
        const isSelected = player.currentProfile === profile.id;
        const card = document.createElement('div');
        card.className = `hifi-profile-card ${isSelected ? 'active' : ''}`;
        card.dataset.profileId = profile.id;
        card.innerHTML = `
          <div class="profile-card-top">
            <span class="profile-icon">${profile.icon}</span>
            <span class="profile-badge">${profile.badge}</span>
          </div>
          <div class="profile-name">${profile.name}</div>
          <div class="profile-tagline">${profile.tagline}</div>
          <div class="profile-check">${isSelected ? '✓' : ''}</div>
        `;
        card.addEventListener('click', () => {
          player.setProfile(profile.id);
          renderProfiles();
          updateUIState();
        });
        profilesGrid.appendChild(card);
      });
    };

    // 2. Update UI state based on player settings
    const updateUIState = () => {
      const active = player.isEnhancerActive;
      btnOpenHiFi.classList.toggle('active', active);
      if (masterToggle) masterToggle.checked = active;

      if (badgeStatus) {
        badgeStatus.textContent = active ? 'HD ACTIVE' : 'BYPASS (OFF)';
        badgeStatus.className = `hifi-status-badge ${active ? 'active' : 'inactive'}`;
      }

      if (statusText) {
        const current = SOUND_PROFILES[player.currentProfile] || SOUND_PROFILES['spotify-master'];
        statusText.textContent = active 
          ? `${current.name} • ${current.tagline}` 
          : 'Original Raw Audio (Mastering DSP bypassed for A/B testing)';
      }

      // Update UI State completed
    };

    renderProfiles();
    updateUIState();

    // 3. Toggle Master Enhancer (Instant A/B Testing)
    if (masterToggle) {
      masterToggle.addEventListener('change', (e) => {
        player.setEnhancerActive(e.target.checked);
        updateUIState();
        renderProfiles();
      });
    }

    // 4. Open/Close Modal
    btnOpenHiFi.addEventListener('click', (e) => {
      e.stopPropagation();
      modalHiFi.classList.add('show');
      updateUIState();
      renderProfiles();
    });

    if (btnCloseHiFi) {
      btnCloseHiFi.addEventListener('click', () => {
        modalHiFi.classList.remove('show');
      });
    }

    modalHiFi.addEventListener('click', (e) => {
      if (e.target === modalHiFi) modalHiFi.classList.remove('show');
    });

    // 6. Listen for changes from player
    player.onEnhancerChange(() => {
      updateUIState();
      renderProfiles();
    });

    player.onProfileChange(() => {
      updateUIState();
      renderProfiles();
    });

    // 7. Real-Time Frequency Spectrum Visualizer & Reactive Equalizer
    let canvasCtx = canvas ? canvas.getContext('2d') : null;

    const drawVisualizer = () => {
      requestAnimationFrame(drawVisualizer);

      const freqData = player.getFrequencyData();
      if (!freqData) return;

      // Real-time animation of card playing bars to match actual frequency energy
      if (player.isPlaying) {
        const activeCardBars = document.querySelectorAll('.music-mode-card.playing .playing-bars span');
        if (activeCardBars.length === 4) {
          const b0 = Math.max(4, (freqData[2] / 255) * 22);
          const b1 = Math.max(6, (freqData[8] / 255) * 22);
          const b2 = Math.max(5, (freqData[22] / 255) * 22);
          const b3 = Math.max(4, (freqData[50] / 255) * 22);
          activeCardBars[0].style.height = `${b0}px`;
          activeCardBars[1].style.height = `${b1}px`;
          activeCardBars[2].style.height = `${b2}px`;
          activeCardBars[3].style.height = `${b3}px`;
        }
      }

      // Draw canvas spectrum only if modal is visible to save CPU/GPU cycles
      if (!canvas || !canvasCtx || !modalHiFi.classList.contains('show')) return;

      const width = canvas.width;
      const height = canvas.height;
      canvasCtx.clearRect(0, 0, width, height);

      const numBars = 42;
      const barWidth = (width / numBars) - 2;
      const step = Math.floor(freqData.length / numBars);

      for (let i = 0; i < numBars; i++) {
        const binIndex = Math.min(i * step, freqData.length - 1);
        const val = player.isPlaying ? freqData[binIndex] : 8;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * (height - 8));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Devotional Gold / Saffron Gradient with warm studio radiance
        const grad = canvasCtx.createLinearGradient(0, height, 0, y);
        grad.addColorStop(0, '#ff7518');
        grad.addColorStop(0.55, '#ffb703');
        grad.addColorStop(1, '#fff2a8');

        canvasCtx.fillStyle = grad;
        canvasCtx.shadowColor = 'rgba(255, 183, 3, 0.4)';
        canvasCtx.shadowBlur = 4;
        canvasCtx.fillRect(x, y, barWidth, barHeight);

        // Crisp white peak cap
        canvasCtx.fillStyle = '#ffffff';
        canvasCtx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
      }
    };

    requestAnimationFrame(drawVisualizer);
  }

  // =========================================================
  // SACRED OFFERINGS QUICK DOCK
  // =========================================================

  initOfferingsUI() {
    // 1. Flower Shower (Pushpa Vrishti)
    const btnFlowers = document.getElementById('btn-flowers');
    if (btnFlowers) {
      btnFlowers.addEventListener('click', () => {
        if (this.particles) this.particles.triggerFlowerShower();
        player.playFlowerChime();
        btnFlowers.classList.add('pulse');
        setTimeout(() => btnFlowers.classList.remove('pulse'), 500);
      });
    }

    // 2. Ring Temple Bell
    const btnBell = document.getElementById('btn-bell');
    if (btnBell) {
      btnBell.addEventListener('click', () => {
        if (this.sanctum) this.sanctum.ringRandomBell();
        player.playTempleBell();
        btnBell.classList.add('pulse');
        setTimeout(() => btnBell.classList.remove('pulse'), 500);
      });
    }

    // 3. Maha Aarti Mode
    const btnAartiMode = document.getElementById('btn-aarti-mode');
    if (btnAartiMode) {
      btnAartiMode.addEventListener('click', () => {
        const active = this.sanctum ? this.sanctum.toggleAarti() : true;
        if (active) {
          btnAartiMode.classList.add('active');
          if (this.controls) {
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.7;
          }
          player.playShankh();
        } else {
          btnAartiMode.classList.remove('active');
          if (this.controls) this.controls.autoRotate = false;
        }
      });
    }

    // 4. Wallpaper Screenshot
    const btnCapture = document.getElementById('btn-capture');
    if (btnCapture) {
      btnCapture.addEventListener('click', () => {
        this.captureWallpaper();
        btnCapture.classList.add('pulse');
        setTimeout(() => btnCapture.classList.remove('pulse'), 500);
      });
    }

    // 5. Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  // =========================================================
  // MODALS (Murti Gallery & Info)
  // =========================================================

  initModals() {
    // Murti Gallery
    const btnMurti = document.getElementById('btn-murti');
    const modalMurti = document.getElementById('murti-modal');
    const btnCloseMurti = document.getElementById('close-murti');
    const murtiGrid = document.getElementById('murti-grid');
    const subtitleElem = document.getElementById('murti-subtitle');

    if (murtiGrid) {
      murtiGrid.innerHTML = '';
      MURTI_IMAGES.forEach((murti, idx) => {
        const isCurrent = this.ganesha ? idx === this.ganesha.currentIndex : idx === 0;
        const item = document.createElement('div');
        item.className = `murti-item ${isCurrent ? 'active' : ''}`;
        item.innerHTML = `
          <img src="${murti.src}" class="murti-thumb" alt="${murti.name}">
          <span class="murti-name">${murti.name}</span>
        `;
        item.addEventListener('click', () => {
          if (this.ganesha) this.ganesha.setMurtiIndex(idx);
          document.querySelectorAll('.murti-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          if (subtitleElem) {
            subtitleElem.textContent = `${murti.name} • विघ्नहर्ता darshan`;
          }
          if (modalMurti) modalMurti.classList.remove('show');
          if (this.particles) this.particles.triggerFlowerShower();
          player.playFlowerChime();
        });
        murtiGrid.appendChild(item);
      });
    }

    if (btnMurti && modalMurti) {
      btnMurti.addEventListener('click', () => {
        modalMurti.classList.add('show');
      });
    }
    if (btnCloseMurti && modalMurti) {
      btnCloseMurti.addEventListener('click', () => {
        modalMurti.classList.remove('show');
      });
    }
    if (modalMurti) {
      modalMurti.addEventListener('click', (e) => {
        if (e.target === modalMurti) modalMurti.classList.remove('show');
      });
    }

    // Sacred Info Modal
    const btnInfo = document.getElementById('btn-info');
    const modalInfo = document.getElementById('info-modal');
    const btnCloseInfo = document.getElementById('close-info');

    if (btnInfo && modalInfo) {
      btnInfo.addEventListener('click', () => {
        modalInfo.classList.add('show');
      });
    }
    if (btnCloseInfo && modalInfo) {
      btnCloseInfo.addEventListener('click', () => {
        modalInfo.classList.remove('show');
      });
    }
    if (modalInfo) {
      modalInfo.addEventListener('click', (e) => {
        if (e.target === modalInfo) modalInfo.classList.remove('show');
      });
    }

    // Creator Modal (Meet the Creator)
    const btnCreator = document.getElementById('nav-btn-creator');
    const modalCreator = document.getElementById('creator-modal');
    const btnCloseCreator = document.getElementById('close-creator-modal');
    const btnBackHomeCreator = document.getElementById('btn-creator-back-to-home');

    const openCreatorModal = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (modalCreator) modalCreator.classList.add('show');
    };

    const closeCreatorModal = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (modalCreator) modalCreator.classList.remove('show');
    };

    if (btnCreator && modalCreator) {
      btnCreator.addEventListener('click', openCreatorModal);
      btnCreator.addEventListener('touchend', openCreatorModal, { passive: false });
    }
    if (btnCloseCreator && modalCreator) {
      btnCloseCreator.addEventListener('click', closeCreatorModal);
      btnCloseCreator.addEventListener('touchend', closeCreatorModal, { passive: false });
    }
    if (btnBackHomeCreator && modalCreator) {
      btnBackHomeCreator.addEventListener('click', closeCreatorModal);
      btnBackHomeCreator.addEventListener('touchend', closeCreatorModal, { passive: false });
    }
    if (modalCreator) {
      modalCreator.addEventListener('click', (e) => {
        if (e.target === modalCreator) closeCreatorModal(e);
      });
    }
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    if (this.ganesha) this.ganesha.setTheme(themeName);
    if (this.sanctum) this.sanctum.setTheme(themeName);
    if (this.galaxy) this.galaxy.setTheme(themeName);

    if (themeName === 'gold' && this.scene) {
      this.scene.background.set(0x140204);
      this.scene.fog.color.set(0x140204);
      if (this.ambientLight) this.ambientLight.color.set(0x3a1208);
      if (this.rimLight) this.rimLight.color.set(0xff9100);
      if (this.keyLight) this.keyLight.color.set(0xfff0d9);
    }
  }

  captureWallpaper() {
    if (this.renderer && this.postProcessing) {
      const time = (performance.now() - this.startTime) / 1000;
      this.postProcessing.render(time);
      const dataUrl = this.renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Ganpati_Bappa_Darshan_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } else {
      const heroImg = document.getElementById('hero-bappa-img');
      const link = document.createElement('a');
      link.download = `Ganpati_Bappa_Darshan_${Date.now()}.png`;
      link.href = heroImg ? heroImg.src : '/images/bappa_theme_hero.png';
      link.click();
    }
  }

  completeLoading() {
    const loader = document.getElementById('loading-screen');
    const progressBar = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (!loader) return;

    let isDismissed = false;
    const dismissLoader = () => {
      if (isDismissed) return;
      isDismissed = true;
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 700);
    };

    // Guaranteed failsafe: Never leave user stuck on loading screen longer than 2.8s
    setTimeout(dismissLoader, 2800);

    let p = 0;
    const updateProgress = () => {
      if (isDismissed) return;
      const increment = Math.floor(Math.random() * 4) + 3;
      p = Math.min(100, p + increment);

      if (progressBar) progressBar.style.width = `${p}%`;
      if (progressText) progressText.textContent = `${p}%`;

      if (p < 100) {
        setTimeout(updateProgress, 35);
      } else {
        setTimeout(dismissLoader, 200);
      }
    };

    setTimeout(updateProgress, 80);
  }

  animate() {
    if (!this.renderer || this.isContextLost) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    try {
      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      const time = (now - this.startTime) / 1000;
      this.lastTime = now;

      if (this.controls) this.controls.update();
      if (this.galaxy) this.galaxy.update(time, delta);
      if (this.ganesha) this.ganesha.update(time, delta);
      if (this.sanctum) this.sanctum.update(time, delta);
      if (this.particles) this.particles.update(time, delta);

      if (this.postProcessing) {
        this.postProcessing.render(time);
      } else if (this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (e) {
      console.warn('Render loop handled safely:', e);
    }
  }
}

function initApp() {
  try {
    new ExperienceApp();
  } catch (err) {
    console.error('Failed to initialize ExperienceApp:', err);
    // Dismiss loading screen so UI remains accessible even if WebGL fails
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
