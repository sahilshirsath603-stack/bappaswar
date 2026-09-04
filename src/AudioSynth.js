// Devotional Audio Engine & Music Player
import { MUSIC_CATALOG } from './musicData.js';

export class DevotionalPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.currentMode = null; // 'shlok' | 'aarti' | 'songs'
    this.currentSongIndex = 0;
    this.currentAartiIndex = 0;
    this.currentTrack = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.85;
    this.audio.volume = this.volume;

    // Web Audio Context for Devotional Soundscapes (Bells, Shankh, Chimes)
    this.ctx = null;

    // Event listeners
    this.callbacks = {
      onTrackChange: [],
      onStateChange: [],
      onTimeUpdate: [],
      onVolumeChange: []
    };

    this.bindAudioEvents();
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
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
      console.warn('Audio playback error:', e);
    });
  }

  handleTrackEnded() {
    if (this.currentMode === 'songs') {
      // Advance smoothly to next devotional song in the other songs list ONLY
      this.nextSong(true);
    } else if (this.currentMode === 'aarti') {
      // Advance to next Aarti in the Aarti collection ONLY (never mixing into other songs)
      this.nextSong(true);
    } else {
      // For Shlok, stop peacefully
      this.isPlaying = false;
      this.notifyStateChange();
    }
  }

  loadAndPlay(track, autoplay = true) {
    this.initCtx();
    if (!track || !track.src) return;

    const isSameSrc = this.audio.src.endsWith(track.src.replace(/^\.\//, ''));
    this.currentTrack = track;

    if (!isSameSrc) {
      this.audio.src = track.src;
      this.audio.load();
    }

    this.notifyTrackChange();

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
      this.audio.src = this.currentTrack.src;
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
      }).catch(err => {
        console.warn('Autoplay prevented or interrupted:', err);
        this.isPlaying = false;
        this.notifyStateChange();
      });
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

    if (this.currentMode === 'songs') {
      // ONLY cycle through other songs (bhaktigeete)
      const total = MUSIC_CATALOG.songs.length;
      if (total === 0) return;
      this.currentSongIndex = (this.currentSongIndex + 1) % total;
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

    if (this.currentMode === 'songs') {
      // ONLY cycle through other songs (bhaktigeete)
      const total = MUSIC_CATALOG.songs.length;
      if (total === 0) return;
      this.currentSongIndex = (this.currentSongIndex - 1 + total) % total;
      const prevTrack = MUSIC_CATALOG.songs[this.currentSongIndex];
      this.loadAndPlay(prevTrack, autoplay);
      return;
    }
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
    this.audio.volume = this.volume;
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    this.notifyVolumeChange();
  }

  toggleMute() {
    if (this.isMuted) {
      this.isMuted = false;
      this.audio.volume = this.volume > 0 ? this.volume : 0.85;
    } else {
      this.isMuted = true;
      this.audio.volume = 0;
    }
    this.notifyVolumeChange();
  }

  // Subscribe to events
  onTrackChange(fn) { this.callbacks.onTrackChange.push(fn); }
  onStateChange(fn) { this.callbacks.onStateChange.push(fn); }
  onTimeUpdate(fn) { this.callbacks.onTimeUpdate.push(fn); }
  onVolumeChange(fn) { this.callbacks.onVolumeChange.push(fn); }

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
