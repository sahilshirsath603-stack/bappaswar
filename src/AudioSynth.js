// Devotional Audio Engine & Music Player
import { MUSIC_CATALOG } from './musicData.js';

// Studio Sound Profiles (Spotify-Grade Mastering Presets)
export const SOUND_PROFILES = {
  'spotify-master': {
    id: 'spotify-master',
    name: 'Spotify Hi-Fi Master',
    tagline: 'Deep punchy bass, pristine vocal clarity & silky air',
    icon: '✨',
    badge: 'STUDIO MASTER',
    subBass: 3.8,
    midBass: 3.4,
    mudCut: -2.2,
    presence: 3.6,
    treble: 4.5,
    bassBoost: 2.5,
    warmth: 1.25,
    width: 1.35,
    compressor: { threshold: -20, knee: 24, ratio: 3.5, attack: 0.003, release: 0.22 }
  },
  'bass-boost': {
    id: 'bass-boost',
    name: 'Bass Boost (Dhol Tasha Punch)',
    tagline: 'Powerful low-end thunder for festive devotional beats',
    icon: '🥁',
    badge: 'DHOL PUNCH',
    subBass: 6.5,
    midBass: 5.5,
    mudCut: -1.0,
    presence: 2.0,
    treble: 2.5,
    bassBoost: 6.0,
    warmth: 1.45,
    width: 1.20,
    compressor: { threshold: -22, knee: 20, ratio: 4.0, attack: 0.004, release: 0.25 }
  },
  'vocal-clarity': {
    id: 'vocal-clarity',
    name: 'Devotional & Vocal Clarity',
    tagline: 'Crisp, upfront vocals for Sukhkarta Aarti & Mantras',
    icon: '🪔',
    badge: 'PURE VOCALS',
    subBass: -0.5,
    midBass: 0.5,
    mudCut: -3.0,
    presence: 5.5,
    treble: 4.8,
    bassBoost: 0.0,
    warmth: 1.0,
    width: 1.20,
    compressor: { threshold: -18, knee: 25, ratio: 2.8, attack: 0.002, release: 0.20 }
  },
  'sanctum-3d': {
    id: 'sanctum-3d',
    name: 'Spiritual Sanctum 3D',
    tagline: 'Expansive spatial soundstage & majestic temple ambience',
    icon: '🏛️',
    badge: 'SPATIAL 3D',
    subBass: 3.0,
    midBass: 2.5,
    mudCut: -1.8,
    presence: 3.0,
    treble: 4.0,
    bassBoost: 2.0,
    warmth: 1.2,
    width: 1.80,
    compressor: { threshold: -19, knee: 26, ratio: 3.2, attack: 0.004, release: 0.30 }
  },
  'original': {
    id: 'original',
    name: 'Original (Flat / Bypass)',
    tagline: 'Raw unenhanced audio for direct A/B comparison',
    icon: '🔈',
    badge: 'FLAT RAW',
    subBass: 0,
    midBass: 0,
    mudCut: 0,
    presence: 0,
    treble: 0,
    bassBoost: 0,
    warmth: 1.0,
    width: 1.0,
    compressor: { threshold: 0, knee: 40, ratio: 1.0, attack: 0.01, release: 0.25 }
  }
};

function createWarmthCurve(amount = 1.2) {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}

export class DevotionalPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    this.currentMode = null; // 'shlok' | 'aarti' | 'songs'
    // Auto-randomize Bhakti song index so every time app and web open, a fresh random song is ready
    const totalSongs = (MUSIC_CATALOG.songs && MUSIC_CATALOG.songs.length) || 1;
    this.currentSongIndex = Math.floor(Math.random() * totalSongs);
    this.currentAartiIndex = 0;
    this.currentTrack = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.85;
    this.audio.volume = this.volume;

    // Web Audio Context for Devotional Soundscapes & Studio DSP Chain
    this.ctx = null;
    this.dspInitialized = false;

    // DSP Nodes
    this.mediaSourceNode = null;
    this.preampGain = null;
    this.subBassFilter = null;
    this.midBassFilter = null;
    this.mudCutFilter = null;
    this.presenceFilter = null;
    this.trebleFilter = null;
    this.bassBooster = null;
    this.warmthNode = null;
    this.sideGain = null;
    this.compressorNode = null;
    this.analyser = null;
    this.frequencyDataArray = null;
    this.masterGainNode = null;

    // Hi-Fi Enhancer Settings (Persisted in LocalStorage)
    let savedProfile = 'spotify-master';
    let savedEnhancer = true;
    let savedBass = 0;
    let savedTreble = 0;
    try {
      const p = localStorage.getItem('bappa_audio_profile');
      if (p && SOUND_PROFILES[p]) savedProfile = p;
      const e = localStorage.getItem('bappa_audio_enhancer');
      if (e !== null) savedEnhancer = e === 'true';
      const b = parseFloat(localStorage.getItem('bappa_audio_bass'));
      if (!isNaN(b)) savedBass = b;
      const t = parseFloat(localStorage.getItem('bappa_audio_treble'));
      if (!isNaN(t)) savedTreble = t;
    } catch (err) {}

    this.isEnhancerActive = savedEnhancer;
    this.currentProfile = savedProfile;
    this.userBassOffset = savedBass;
    this.userTrebleOffset = savedTreble;
    this.userWidth = 1.0;

    // Shuffle & loop states
    this.isShuffle = true; // Auto-shuffle enabled by default for devotional songs!
    this.isRepeat = false;
    this.playedSongIndices = [];

    // Event listeners
    this.callbacks = {
      onTrackChange: [],
      onStateChange: [],
      onTimeUpdate: [],
      onVolumeChange: [],
      onShuffleChange: [],
      onEnhancerChange: [],
      onProfileChange: []
    };

    this.bindAudioEvents();
  }

  initCtx() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.ctx && !this.dspInitialized) {
        this.initDspChain();
      }
    } catch (e) {
      console.warn('Web Audio initialization error (non-fatal):', e);
    }
  }

  initDspChain() {
    if (this.dspInitialized || !this.ctx) return;
    try {
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audio);

      // 1. Preamp Stage
      this.preampGain = this.ctx.createGain();
      this.preampGain.gain.value = 1.06;

      // 2. Sub-Bass Shelf (55 Hz)
      this.subBassFilter = this.ctx.createBiquadFilter();
      this.subBassFilter.type = 'lowshelf';
      this.subBassFilter.frequency.value = 55;

      // 3. Mid-Bass Punch (140 Hz)
      this.midBassFilter = this.ctx.createBiquadFilter();
      this.midBassFilter.type = 'peaking';
      this.midBassFilter.frequency.value = 140;
      this.midBassFilter.Q.value = 1.2;

      // 4. Low-Mid De-Mudding Dip (360 Hz)
      this.mudCutFilter = this.ctx.createBiquadFilter();
      this.mudCutFilter.type = 'peaking';
      this.mudCutFilter.frequency.value = 360;
      this.mudCutFilter.Q.value = 1.1;

      // 5. Vocal & Lead Presence (3200 Hz)
      this.presenceFilter = this.ctx.createBiquadFilter();
      this.presenceFilter.type = 'peaking';
      this.presenceFilter.frequency.value = 3200;
      this.presenceFilter.Q.value = 1.0;

      // 6. High-Shelf Air / Sparkle (11500 Hz)
      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 11500;

      // 7. Dedicated Bass Punch Booster (85 Hz)
      this.bassBooster = this.ctx.createBiquadFilter();
      this.bassBooster.type = 'peaking';
      this.bassBooster.frequency.value = 85;
      this.bassBooster.Q.value = 1.4;

      // 8. Harmonic Warmth WaveShaper (Enriches mobile/earbud reproduction)
      this.warmthNode = this.ctx.createWaveShaper();
      this.warmthNode.curve = createWarmthCurve(1.2);
      this.warmthNode.oversample = '2x';
      this.warmthNode.channelCount = 2;
      this.warmthNode.channelCountMode = 'explicit';

      // 9. Stereo Spatial Widener (Mid / Side Processing)
      this.msSplitter = this.ctx.createChannelSplitter(2);
      this.midGain = this.ctx.createGain();
      this.midGain.gain.value = 0.5;

      this.sideGain = this.ctx.createGain();
      this.sideGain.gain.value = 0.5 * 1.35;

      this.invRight = this.ctx.createGain();
      this.invRight.gain.value = -1.0;

      this.invSide = this.ctx.createGain();
      this.invSide.gain.value = -1.0;

      this.leftSum = this.ctx.createGain();
      this.leftSum.gain.value = 1.0;

      this.rightSum = this.ctx.createGain();
      this.rightSum.gain.value = 1.0;

      this.msMerger = this.ctx.createChannelMerger(2);

      // 10. Studio Dynamics Compressor (Spotify Loudness & Punch)
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -20;
      this.compressorNode.knee.value = 24;
      this.compressorNode.ratio.value = 3.5;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.22;

      // 11. Real-time Analyser for live frequency visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.frequencyDataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // 12. Master Volume & Limiter Gain
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.volume;

      // Connect Signal Chain
      this.mediaSourceNode.connect(this.preampGain);
      this.preampGain.connect(this.subBassFilter);
      this.subBassFilter.connect(this.midBassFilter);
      this.midBassFilter.connect(this.mudCutFilter);
      this.mudCutFilter.connect(this.presenceFilter);
      this.presenceFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.bassBooster);
      this.bassBooster.connect(this.warmthNode);

      // Connect Mid/Side Stereo Widener
      this.warmthNode.connect(this.msSplitter);

      // Mid: L + R
      this.msSplitter.connect(this.midGain, 0);
      this.msSplitter.connect(this.midGain, 1);

      // Side: L - R
      this.msSplitter.connect(this.sideGain, 0);
      this.msSplitter.connect(this.invRight, 1);
      this.invRight.connect(this.sideGain);

      // Sum: L = Mid + Side, R = Mid - Side
      this.midGain.connect(this.leftSum);
      this.midGain.connect(this.rightSum);

      this.sideGain.connect(this.leftSum);
      this.sideGain.connect(this.invSide);
      this.invSide.connect(this.rightSum);

      this.leftSum.connect(this.msMerger, 0, 0);
      this.rightSum.connect(this.msMerger, 0, 1);

      // Connect to Dynamics Compressor, Analyser, Master Gain, and Output
      this.msMerger.connect(this.compressorNode);
      this.compressorNode.connect(this.analyser);
      this.analyser.connect(this.masterGainNode);
      this.masterGainNode.connect(this.ctx.destination);

      this.dspInitialized = true;
      this.applyCurrentProfile();
      console.log('[Bappa Swar] Spotify Hi-Fi Studio Audio DSP Engine initialized.');
    } catch (err) {
      console.warn('[Bappa Swar] Web Audio DSP initialization fallback:', err);
    }
  }

  applyCurrentProfile() {
    if (!this.dspInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = 0.04;

    const profile = SOUND_PROFILES[this.currentProfile] || SOUND_PROFILES['spotify-master'];

    if (!this.isEnhancerActive || profile.id === 'original') {
      // Bypass / Original flat sound
      this.subBassFilter.gain.setTargetAtTime(0, now, rampTime);
      this.midBassFilter.gain.setTargetAtTime(0, now, rampTime);
      this.mudCutFilter.gain.setTargetAtTime(0, now, rampTime);
      this.presenceFilter.gain.setTargetAtTime(0, now, rampTime);
      this.trebleFilter.gain.setTargetAtTime(0, now, rampTime);
      this.bassBooster.gain.setTargetAtTime(0, now, rampTime);
      this.sideGain.gain.setTargetAtTime(0.5, now, rampTime);
      this.compressorNode.ratio.setTargetAtTime(1.0, now, rampTime);
      this.compressorNode.threshold.setTargetAtTime(0, now, rampTime);
      this.preampGain.gain.setTargetAtTime(1.0, now, rampTime);
      return;
    }

    // Active Profile + Custom User Offsets
    const finalSub = profile.subBass + this.userBassOffset;
    const finalMidBass = profile.midBass + (this.userBassOffset * 0.7);
    const finalBassBoost = profile.bassBoost + this.userBassOffset;
    const finalTreble = profile.treble + this.userTrebleOffset;
    const finalPresence = profile.presence + (this.userTrebleOffset * 0.5);

    this.subBassFilter.gain.setTargetAtTime(finalSub, now, rampTime);
    this.midBassFilter.gain.setTargetAtTime(finalMidBass, now, rampTime);
    this.mudCutFilter.gain.setTargetAtTime(profile.mudCut, now, rampTime);
    this.presenceFilter.gain.setTargetAtTime(finalPresence, now, rampTime);
    this.trebleFilter.gain.setTargetAtTime(finalTreble, now, rampTime);
    this.bassBooster.gain.setTargetAtTime(finalBassBoost, now, rampTime);

    // Stereo width: 0.5 * profile.width * userWidth
    const widthFactor = 0.5 * (profile.width || 1.35) * (this.userWidth || 1.0);
    this.sideGain.gain.setTargetAtTime(widthFactor, now, rampTime);

    // Compressor settings for punchy radio loudness
    const c = profile.compressor;
    if (c) {
      this.compressorNode.threshold.setTargetAtTime(c.threshold, now, rampTime);
      this.compressorNode.knee.setTargetAtTime(c.knee, now, rampTime);
      this.compressorNode.ratio.setTargetAtTime(c.ratio, now, rampTime);
      this.compressorNode.attack.setTargetAtTime(c.attack, now, rampTime);
      this.compressorNode.release.setTargetAtTime(c.release, now, rampTime);
    }
    this.preampGain.gain.setTargetAtTime(1.06, now, rampTime);
  }

  bindAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyStateChange();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyStateChange();
    });

    this.audio.addEventListener('timeupdate', () => {
      const cur = this.audio.currentTime || 0;
      const dur = this.audio.duration || 0;
      const progress = dur > 0 ? (cur / dur) * 100 : 0;
      this.callbacks.onTimeUpdate.forEach(fn => fn(cur, dur, progress));
    });

    this.audio.addEventListener('durationchange', () => {
      const cur = this.audio.currentTime || 0;
      const dur = this.audio.duration || 0;
      const progress = dur > 0 ? (cur / dur) * 100 : 0;
      this.callbacks.onTimeUpdate.forEach(fn => fn(cur, dur, progress));
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error encountered:', e, 'Current src:', this.audio.src);
      this.isPlaying = false;
      this.notifyStateChange();
    });
  }

  handleTrackEnded() {
    console.log('[Bappa Swar] Track ended naturally. Advancing to next track. Current mode:', this.currentMode);
    if (this.currentMode === 'songs') {
      // In Songs mode, auto-play next song (shuffled or sequential) without stopping
      this.nextSong(true);
    } else if (this.currentMode === 'aarti') {
      // In Aarti mode, advance to next Aarti in the collection
      this.nextSong(true);
    } else if (this.currentMode === 'shlok') {
      if (this.isRepeat) {
        this.seek(0);
        this.play();
      } else {
        this.isPlaying = false;
        this.notifyStateChange();
      }
    } else {
      this.nextSong(true);
    }
  }

  normalizeSrc(src) {
    if (!src) return '';
    // Ensure absolute root path /song/... so relative directory issues never occur
    if (src.startsWith('./')) {
      return '/' + src.slice(2);
    }
    if (!src.startsWith('/') && !src.startsWith('http')) {
      return '/' + src;
    }
    return src;
  }

  loadAndPlay(track, autoplay = true) {
    this.initCtx();
    if (!track || !track.src) return;

    const resolvedSrc = this.normalizeSrc(track.src);
    const isSameSrc = this.audio.src.endsWith(resolvedSrc.replace(/^\//, ''));
    this.currentTrack = track;

    if (!isSameSrc) {
      this.audio.src = resolvedSrc;
      this.audio.load();
    }

    this.notifyTrackChange();
    this.updateMediaSession();

    // Immediately notify UI of duration if known (e.g. Shlok 37:28)
    if (track.durationSeconds) {
      this.callbacks.onTimeUpdate.forEach(fn => fn(0, track.durationSeconds, 0));
    }

    if (autoplay) {
      this.play();
    }
  }

  play() {
    this.initCtx();
    if (!this.audio.src && this.currentTrack) {
      this.audio.src = this.normalizeSrc(this.currentTrack.src);
    }

    if (!this.audio.src) {
      // Default to Shlok if nothing is loaded yet
      this.selectMode('shlok', true);
      return;
    }

    const promise = this.audio.play();
    if (promise !== undefined) {
      promise.then(() => {
        this.isPlaying = true;
        this.notifyStateChange();
        this.updateMediaSession();
      }).catch(err => {
        console.warn('Playback waiting for user gesture or interrupted:', err);
        this.isPlaying = false;
        this.notifyStateChange();
      });
    }
  }

  updateMediaSession() {
    if ('mediaSession' in navigator && this.currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.currentTrack.title || '॥ बाप्पा स्वर ॥',
          artist: this.currentTrack.artist || 'Devotional Chants',
          album: '॥ बाप्पा स्वर ॥ Bappa Swar',
          artwork: [
            { src: '/images/bappa_theme_hero.png', sizes: '512x512', type: 'image/png' },
            { src: '/images/player_thumb.jpg', sizes: '192x192', type: 'image/jpeg' }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prevSong(true));
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSong(true));
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && this.audio.duration) {
            this.audio.currentTime = details.seekTime;
          }
        });
      } catch (e) {
        // mediaSession non-critical
      }
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.notifyStateChange();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.notifyStateChange();
    this.callbacks.onTimeUpdate.forEach(fn => fn(0, this.audio.duration || 0, 0));
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  selectMode(mode, autoplay = true) {
    this.initCtx();

    if (mode === 'shlok') {
      if (this.currentMode === 'shlok' && this.currentTrack) {
        if (!this.isPlaying && autoplay) this.play();
        return;
      }
      this.currentMode = 'shlok';
      this.loadAndPlay(MUSIC_CATALOG.shlok, autoplay);
    } else if (mode === 'aarti') {
      if (this.currentMode === 'aarti' && this.currentTrack) {
        if (!this.isPlaying && autoplay) this.play();
        return;
      }
      this.currentMode = 'aarti';
      const aarti = (MUSIC_CATALOG.aartis && MUSIC_CATALOG.aartis[this.currentAartiIndex]) || MUSIC_CATALOG.aarti;
      this.loadAndPlay(aarti, autoplay);
    } else if (mode === 'songs') {
      if (this.currentMode === 'songs' && this.currentTrack) {
        // Do not restart from beginning if already in songs mode!
        if (!this.isPlaying && autoplay) this.play();
        return;
      }
      this.currentMode = 'songs';
      const song = MUSIC_CATALOG.songs[this.currentSongIndex] || MUSIC_CATALOG.songs[0];
      this.loadAndPlay(song, autoplay);
    }
  }

  selectAartiByIndex(index, autoplay = true) {
    if (!MUSIC_CATALOG.aartis || index < 0 || index >= MUSIC_CATALOG.aartis.length) return;
    this.currentMode = 'aarti';
    this.currentAartiIndex = index;
    const aarti = MUSIC_CATALOG.aartis[index];
    this.loadAndPlay(aarti, autoplay);
  }

  nextSong(autoplay = true) {
    if (this.currentMode === 'aarti') {
      // ONLY cycle through Aartis
      const total = (MUSIC_CATALOG.aartis && MUSIC_CATALOG.aartis.length) || 1;
      this.currentAartiIndex = (this.currentAartiIndex + 1) % total;
      this.loadAndPlay(MUSIC_CATALOG.aartis[this.currentAartiIndex], autoplay);
      return;
    }

    if (this.currentMode === 'shlok') {
      // Shlok is a dedicated track: restart from 0, never switch to other songs
      this.seek(0);
      if (autoplay) this.play();
      return;
    }

    if (this.currentMode === 'songs' || !this.currentMode) {
      const total = MUSIC_CATALOG.songs.length;
      if (total === 0) return;

      if (this.isShuffle && total > 1) {
        // Track history to avoid repeating recent songs
        if (this.playedSongIndices.length >= total) {
          this.playedSongIndices = [];
        }
        if (!this.playedSongIndices.includes(this.currentSongIndex)) {
          this.playedSongIndices.push(this.currentSongIndex);
        }

        let unplayed = [];
        for (let i = 0; i < total; i++) {
          if (!this.playedSongIndices.includes(i)) {
            unplayed.push(i);
          }
        }
        if (unplayed.length === 0) {
          this.playedSongIndices = [this.currentSongIndex];
          unplayed = Array.from({ length: total }, (_, i) => i).filter(i => i !== this.currentSongIndex);
        }

        const nextIdx = unplayed[Math.floor(Math.random() * unplayed.length)];
        this.currentSongIndex = nextIdx;
      } else {
        this.currentSongIndex = (this.currentSongIndex + 1) % total;
      }

      this.currentMode = 'songs';
      const nextTrack = MUSIC_CATALOG.songs[this.currentSongIndex];
      this.loadAndPlay(nextTrack, autoplay);
      return;
    }
  }

  prevSong(autoplay = true) {
    if (this.currentMode === 'aarti') {
      // ONLY cycle through Aartis
      const total = (MUSIC_CATALOG.aartis && MUSIC_CATALOG.aartis.length) || 1;
      this.currentAartiIndex = (this.currentAartiIndex - 1 + total) % total;
      this.loadAndPlay(MUSIC_CATALOG.aartis[this.currentAartiIndex], autoplay);
      return;
    }

    if (this.currentMode === 'shlok') {
      // Shlok is a dedicated track: restart from 0, never switch to other songs
      this.seek(0);
      if (autoplay) this.play();
      return;
    }

    if (this.currentMode === 'songs' || !this.currentMode) {
      const total = MUSIC_CATALOG.songs.length;
      if (total === 0) return;

      if (this.playedSongIndices.length > 0) {
        this.currentSongIndex = this.playedSongIndices.pop();
      } else {
        this.currentSongIndex = (this.currentSongIndex - 1 + total) % total;
      }

      this.currentMode = 'songs';
      const prevTrack = MUSIC_CATALOG.songs[this.currentSongIndex];
      this.loadAndPlay(prevTrack, autoplay);
      return;
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.callbacks.onShuffleChange.forEach(fn => fn(this.isShuffle));
    return this.isShuffle;
  }

  onShuffleChange(fn) {
    this.callbacks.onShuffleChange.push(fn);
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    if (this.callbacks.onRepeatChange) {
      this.callbacks.onRepeatChange.forEach(fn => fn(this.isRepeat));
    }
    return this.isRepeat;
  }

  onRepeatChange(fn) {
    if (!this.callbacks.onRepeatChange) this.callbacks.onRepeatChange = [];
    this.callbacks.onRepeatChange.push(fn);
  }

  selectSongByIndex(index, autoplay = true) {
    if (index < 0 || index >= MUSIC_CATALOG.songs.length) return;
    this.currentMode = 'songs';
    this.currentSongIndex = index;
    const track = MUSIC_CATALOG.songs[index];
    this.loadAndPlay(track, autoplay);
  }

  seek(percentage) {
    if (!this.audio.duration || isNaN(this.audio.duration)) return;
    const target = (percentage / 100) * this.audio.duration;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, target));
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    if (this.masterGainNode && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGainNode.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
      this.audio.volume = 1.0;
    } else {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    this.notifyVolumeChange();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGainNode && this.ctx) {
      const target = this.isMuted ? 0 : (this.volume > 0 ? this.volume : 0.85);
      this.masterGainNode.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
      this.audio.volume = 1.0;
    } else {
      this.audio.volume = this.isMuted ? 0 : (this.volume > 0 ? this.volume : 0.85);
    }
    this.notifyVolumeChange();
  }

  // --- Hi-Fi Studio DSP Controls ---
  setProfile(profileId) {
    if (!SOUND_PROFILES[profileId]) return;
    this.currentProfile = profileId;
    try { localStorage.setItem('bappa_audio_profile', profileId); } catch(e) {}
    this.applyCurrentProfile();
    this.callbacks.onProfileChange.forEach(fn => fn(this.currentProfile, SOUND_PROFILES[this.currentProfile]));
  }

  toggleEnhancer() {
    this.isEnhancerActive = !this.isEnhancerActive;
    try { localStorage.setItem('bappa_audio_enhancer', String(this.isEnhancerActive)); } catch(e) {}
    this.applyCurrentProfile();
    this.callbacks.onEnhancerChange.forEach(fn => fn(this.isEnhancerActive));
    return this.isEnhancerActive;
  }

  setEnhancerActive(active) {
    this.isEnhancerActive = !!active;
    try { localStorage.setItem('bappa_audio_enhancer', String(this.isEnhancerActive)); } catch(e) {}
    this.applyCurrentProfile();
    this.callbacks.onEnhancerChange.forEach(fn => fn(this.isEnhancerActive));
  }

  setUserBass(offset) {
    this.userBassOffset = Math.max(-8, Math.min(8, offset));
    try { localStorage.setItem('bappa_audio_bass', String(this.userBassOffset)); } catch(e) {}
    this.applyCurrentProfile();
  }

  setUserTreble(offset) {
    this.userTrebleOffset = Math.max(-8, Math.min(8, offset));
    try { localStorage.setItem('bappa_audio_treble', String(this.userTrebleOffset)); } catch(e) {}
    this.applyCurrentProfile();
  }

  setUserWidth(factor) {
    this.userWidth = Math.max(0.5, Math.min(2.5, factor));
    this.applyCurrentProfile();
  }

  getFrequencyData() {
    if (!this.analyser || !this.frequencyDataArray) return null;
    this.analyser.getByteFrequencyData(this.frequencyDataArray);
    return this.frequencyDataArray;
  }

  // Subscribe to events
  onTrackChange(fn) { this.callbacks.onTrackChange.push(fn); }
  onStateChange(fn) { this.callbacks.onStateChange.push(fn); }
  onTimeUpdate(fn) { this.callbacks.onTimeUpdate.push(fn); }
  onVolumeChange(fn) { this.callbacks.onVolumeChange.push(fn); }
  onEnhancerChange(fn) { this.callbacks.onEnhancerChange.push(fn); }
  onProfileChange(fn) { this.callbacks.onProfileChange.push(fn); }

  notifyTrackChange() {
    this.callbacks.onTrackChange.forEach(fn => fn(this.currentTrack, this.currentMode, this.currentSongIndex));
  }

  notifyStateChange() {
    this.callbacks.onStateChange.forEach(fn => fn(this.isPlaying, this.currentMode));
  }

  notifyVolumeChange() {
    this.callbacks.onVolumeChange.forEach(fn => fn(this.volume, this.isMuted));
  }

  // --- Devotional Sound Effects ---
  // Interactive Temple Bell (Ghanta) on clicking bells
  playTempleBell(pitchMultiplier = 1.0) {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 840 * pitchMultiplier;

    const partials = [
      { ratio: 1.0, gain: 0.45, decay: 3.0 },
      { ratio: 2.02, gain: 0.35, decay: 2.4 },
      { ratio: 3.01, gain: 0.28, decay: 1.8 },
      { ratio: 4.25, gain: 0.18, decay: 1.2 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.ratio, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(p.gain * 0.35, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    });
  }

  // Sacred Shankh blow
  playShankh() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 220;

    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq * 0.95, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.02, now + 0.8);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.0, now + 2.5);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq * 2.0, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(440, now);
    filter.frequency.linearRampToValueAtTime(880, now + 0.5);
    filter.frequency.linearRampToValueAtTime(550, now + 2.8);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.9);
    gain.gain.setValueAtTime(0.3, now + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 3.4);
    subOsc.stop(now + 3.4);
  }

  // Soft chimes for Pushpa Vrishti
  playFlowerChime() {
    this.initCtx();
    if (!this.ctx) return;

    const chord = [1046.5, 1318.5, 1567.98, 2093.0];
    chord.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.1);
      }, i * 70);
    });
  }
}

export const player = new DevotionalPlayer();
export const audio = player; // backwards compatibility

// Mobile browser user-gesture unlock
if (typeof window !== 'undefined') {
  const unlockAudioEngine = () => {
    player.initCtx();
    window.removeEventListener('pointerdown', unlockAudioEngine);
    window.removeEventListener('touchstart', unlockAudioEngine);
    window.removeEventListener('click', unlockAudioEngine);
  };
  window.addEventListener('pointerdown', unlockAudioEngine, { passive: true });
  window.addEventListener('touchstart', unlockAudioEngine, { passive: true });
  window.addEventListener('click', unlockAudioEngine, { passive: true });
}
