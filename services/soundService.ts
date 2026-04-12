
class SoundService {
  private sounds: Record<string, HTMLAudioElement | null> = {};
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSound('boop', 'https://www.soundjay.com/buttons/sounds/button-16.mp3');
      this.loadSound('cluck', 'https://www.soundjay.com/animals/sounds/chicken-cluck-1.mp3');
      this.loadSound('success', 'https://www.soundjay.com/buttons/sounds/button-3.mp3');
      this.loadSound('error', 'https://www.soundjay.com/buttons/sounds/button-10.mp3');
      this.loadSound('pop', 'https://www.soundjay.com/buttons/sounds/button-21.mp3');
      this.loadSound('message', 'https://www.soundjay.com/buttons/sounds/button-37.mp3');
      this.loadSound('levelUp', 'https://www.soundjay.com/buttons/sounds/button-09.mp3');
      this.loadSound('click', 'https://www.soundjay.com/buttons/sounds/button-11.mp3');
    }
  }

  private loadSound(name: string, url: string) {
    const audio = new Audio(url);
    audio.load();
    this.sounds[name] = audio;
  }

  play(name: string) {
    if (this.enabled && this.sounds[name]) {
      const sound = this.sounds[name];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log(`Audio play blocked for ${name}`, e));
      }
    }
  }

  playBoop() { this.play('boop'); }
  playCluck() { this.play('cluck'); }
  playSuccess() { this.play('success'); }
  playError() { this.play('error'); }
  playPop() { this.play('pop'); }
  playMessage() { this.play('message'); }
  playLevelUp() { this.play('levelUp'); }
  playClick() { this.play('click'); }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundService = new SoundService();
