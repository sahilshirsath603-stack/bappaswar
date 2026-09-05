// Main Devotional Experience & UI Controller
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GaneshaImageModel, MURTI_IMAGES } from './GaneshaImageMesh.js';
import { TempleSanctum } from './TempleSanctum.js';
import { ParticleEngine } from './ParticleEngine.js';
import { GalaxyBackground } from './GalaxyBackground.js';
import { PostProcessingManager } from './PostProcessing.js';
import { player } from './AudioSynth.js';
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

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initWorld();
    this.initPostProcessing();
    this.initEvents();
    this.initMusicPlayerUI();
    this.initOfferingsUI();
    this.initModals();

    this.setTheme('gold');

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    this.completeLoading();
    this.registerServiceWorker();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      });
    }
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
      this.particles.triggerFlowerShower();
    });

    btnAarti.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-aarti-menu')) return;
      player.selectMode('aarti', true);
      this.sanctum.toggleAarti();
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

    // --- Shuffle & Repeat Buttons ---
    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        btnShuffle.classList.toggle('active');
        btnShuffle.classList.add('pulse');
        setTimeout(() => btnShuffle.classList.remove('pulse'), 400);
      });
    }

    const btnRepeat = document.getElementById('btn-repeat');
    if (btnRepeat) {
      btnRepeat.addEventListener('click', () => {
        btnRepeat.classList.toggle('active');
        btnRepeat.classList.add('pulse');
        setTimeout(() => btnRepeat.classList.remove('pulse'), 400);
      });
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
        this.sanctum.toggleAarti();
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
  // SACRED OFFERINGS QUICK DOCK
  // =========================================================

  initOfferingsUI() {
    // 1. Flower Shower (Pushpa Vrishti)
    const btnFlowers = document.getElementById('btn-flowers');
    if (btnFlowers) {
      btnFlowers.addEventListener('click', () => {
        this.particles.triggerFlowerShower();
        player.playFlowerChime();
        btnFlowers.classList.add('pulse');
        setTimeout(() => btnFlowers.classList.remove('pulse'), 500);
      });
    }

    // 2. Ring Temple Bell
    const btnBell = document.getElementById('btn-bell');
    if (btnBell) {
      btnBell.addEventListener('click', () => {
        this.sanctum.ringRandomBell();
        player.playTempleBell();
        btnBell.classList.add('pulse');
        setTimeout(() => btnBell.classList.remove('pulse'), 500);
      });
    }

    // 3. Maha Aarti Mode
    const btnAartiMode = document.getElementById('btn-aarti-mode');
    if (btnAartiMode) {
      btnAartiMode.addEventListener('click', () => {
        const active = this.sanctum.toggleAarti();
        if (active) {
          btnAartiMode.classList.add('active');
          this.controls.autoRotate = true;
          this.controls.autoRotateSpeed = 0.7;
          player.playShankh();
        } else {
          btnAartiMode.classList.remove('active');
          this.controls.autoRotate = false;
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
        const item = document.createElement('div');
        item.className = `murti-item ${idx === this.ganesha.currentIndex ? 'active' : ''}`;
        item.innerHTML = `
          <img src="${murti.src}" class="murti-thumb" alt="${murti.name}">
          <span class="murti-name">${murti.name}</span>
        `;
        item.addEventListener('click', () => {
          this.ganesha.setMurtiIndex(idx);
          document.querySelectorAll('.murti-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          if (subtitleElem) {
            subtitleElem.textContent = `${murti.name} • विघ्नहर्ता darshan`;
          }
          if (modalMurti) modalMurti.classList.remove('show');
          this.particles.triggerFlowerShower();
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
    this.ganesha.setTheme(themeName);
    this.sanctum.setTheme(themeName);
    if (this.galaxy) this.galaxy.setTheme(themeName);

    if (themeName === 'gold') {
      this.scene.background.set(0x140204);
      this.scene.fog.color.set(0x140204);
      this.ambientLight.color.set(0x3a1208);
      this.rimLight.color.set(0xff9100);
      this.keyLight.color.set(0xfff0d9);
    }
  }

  captureWallpaper() {
    const time = (performance.now() - this.startTime) / 1000;
    this.postProcessing.render(time);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Ganpati_Bappa_Darshan_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
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
    this.animFrameId = requestAnimationFrame(this.animate);
    if (this.isContextLost) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    const time = (now - this.startTime) / 1000;
    this.lastTime = now;

    this.mouse.lerp(this.targetMouse, 0.05);
    this.camera.position.x += (this.mouse.x * 0.35 - (this.camera.position.x - this.defaultCameraPos.x)) * 0.02;

    this.controls.update();
    if (this.galaxy) this.galaxy.update(time, delta);
    this.ganesha.update(time, delta);
    this.sanctum.update(time, delta);
    this.particles.update(time, delta);

    this.postProcessing.render(time);
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
