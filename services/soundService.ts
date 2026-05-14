import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

// Static require map for all 19 engine sounds
export const SOUND_FILES: Record<number, ReturnType<typeof require>> = {
  1: require("../assets/sounds/sound1.mp3"),
  2: require("../assets/sounds/sound2.mp3"),
  3: require("../assets/sounds/sound3.mp3"),
  4: require("../assets/sounds/sound4.mp3"),
  5: require("../assets/sounds/sound5.mp3"),
  6: require("../assets/sounds/sound6.mp3"),
  7: require("../assets/sounds/sound7.mp3"),
  8: require("../assets/sounds/sound8.mp3"),
  9: require("../assets/sounds/sound9.mp3"),
  10: require("../assets/sounds/sound10.mp3"),
  11: require("../assets/sounds/sound11.mp3"),
  12: require("../assets/sounds/sound12.mp3"),
  13: require("../assets/sounds/sound13.mp3"),
  14: require("../assets/sounds/sound14.mp3"),
  15: require("../assets/sounds/sound15.mp3"),
  16: require("../assets/sounds/sound16.mp3"),
  17: require("../assets/sounds/sound17.mp3"),
  18: require("../assets/sounds/sound18.mp3"),
  19: require("../assets/sounds/sound19.mp3"),
};

export const SOUND_NAMES: Record<number, string> = {
  1: "V8 Growl",
  2: "Turbo Spool",
  3: "Flat Six",
  4: "V10 Scream",
  5: "Twin Turbo",
  6: "Supercharged",
  7: "Race Start",
  8: "Cold Start",
  9: "Rev Limiter",
  10: "Exhaust Pop",
  11: "Idle Rev",
  12: "Wide Open Throttle",
  13: "Italian Thunder",
  14: "British Roar",
  15: "German Precision",
  16: "American Muscle",
  17: "Track Day",
  18: "Midnight Run",
  19: "Launch Control",
};

let audioConfigured = false;
async function ensureAudioConfigured() {
  if (audioConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldDuckAndroid: false,
      staysActiveInBackground: true,
    });
    audioConfigured = true;
  } catch (_) {}
}

class SoundService {
  private currentPlayer: AudioPlayer | null = null;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private generation = 0;

  async playSound(
    soundId: number,
    loop = true,
    fadeIn = true,
    onFinished?: () => void,
    onProgress?: (positionMillis: number, durationMillis: number) => void,
  ) {
    const gen = ++this.generation;

    this.clearFade();
    const prev = this.currentPlayer;
    this.currentPlayer = null;
    if (prev) {
      try { prev.pause(); } catch (_) {}
      try { prev.remove(); } catch (_) {}
    }

    if (gen !== this.generation) return;

    const file = SOUND_FILES[soundId];
    if (!file) return;

    await ensureAudioConfigured();
    if (gen !== this.generation) return;

    try {
      const player = createAudioPlayer(file, { updateInterval: 250 });
      player.loop = loop;
      player.volume = fadeIn ? 0.01 : 1;

      if (gen !== this.generation) {
        try { player.remove(); } catch (_) {}
        return;
      }

      this.currentPlayer = player;
      player.play();

      if (!loop && (onFinished || onProgress)) {
        player.addListener("playbackStatusUpdate", (status) => {
          if (onProgress && status.duration > 0) {
            onProgress(status.currentTime * 1000, status.duration * 1000);
          }
          if (onFinished && status.didJustFinish) {
            onFinished();
          }
        });
      }

      if (fadeIn) {
        this.startFadeIn(player, gen);
      }
    } catch (e) {
      console.warn("[SoundService] Failed to play sound:", soundId, e);
    }
  }

  private startFadeIn(player: AudioPlayer, gen: number) {
    this.clearFade();
    let vol = 0.01;
    this.fadeInterval = setInterval(() => {
      if (gen !== this.generation || !this.currentPlayer) {
        this.clearFade();
        return;
      }
      vol = Math.min(1, vol + 0.06);
      try { player.volume = vol; } catch (_) {}
      if (vol >= 1) this.clearFade();
    }, 100);
  }

  private clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  async stopSound() {
    this.generation++;
    this.clearFade();
    const p = this.currentPlayer;
    this.currentPlayer = null;
    if (p) {
      try { p.pause(); } catch (_) {}
      try { p.remove(); } catch (_) {}
    }
  }

  isPlaying(): boolean {
    return this.currentPlayer !== null;
  }
}

export const soundService = new SoundService();
