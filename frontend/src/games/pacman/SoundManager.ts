import { PACMAN_CONFIG } from "../config/config";

export class SoundManager
{
  private wakaAudio: HTMLAudioElement;    
  private introAudio: HTMLAudioElement; 
  private deathAudio: HTMLAudioElement; 

  private wakaInterval: number | null = null; 
  private lastEatTime = 0;                    

  constructor()
  {
    this.wakaAudio = this.createAudio(PACMAN_CONFIG.SOUNDS.WAKA, PACMAN_CONFIG.SOUND.WAKA_VOLUME);
    this.introAudio = this.createAudio(PACMAN_CONFIG.SOUNDS.INTRO, PACMAN_CONFIG.SOUND.INTRO_VOLUME);
    this.deathAudio = this.createAudio(PACMAN_CONFIG.SOUNDS.DEATH, PACMAN_CONFIG.SOUND.DEATH_VOLUME);
  }

  private createAudio(src: string, volume: number): HTMLAudioElement
  {
    const audio = new Audio(src);
    audio.volume = volume;
    return audio;
  }

  async playIntro(onEnd: () => void): Promise<void>
  {
    try
    {
      this.introAudio.currentTime = 0;
      await this.introAudio.play();
      
      this.introAudio.onended = () => onEnd();
    } catch {
      onEnd();
    }
  }

  isIntroPlaying(): boolean
  {
    return !this.introAudio.paused;
  }

  async playDeath(onEnd: () => void): Promise<void>
  {
    try
    {
      this.deathAudio.currentTime = 0;
      await this.deathAudio.play();
      
      this.deathAudio.onended = () => onEnd();
    } catch {
      onEnd();
    }
  }

  playWaka(): void
  {
    this.lastEatTime = performance.now();
    
    if (!this.wakaInterval)
    {
      this.loopWaka();
    }
  }

  private loopWaka(): void
  {
    this.wakaInterval = window.setInterval(() => {
      const now = performance.now();
      const timeSinceLastEat = now - this.lastEatTime;

      if (timeSinceLastEat > PACMAN_CONFIG.SOUND.WAKA_INTERVAL_MS)
      {
        this.stopWaka();
        return;
      }

      const clonedAudio = this.wakaAudio.cloneNode(true) as HTMLAudioElement;
      clonedAudio.volume = PACMAN_CONFIG.SOUND.WAKA_VOLUME;
      clonedAudio.play().catch(() => {});
    }, PACMAN_CONFIG.SOUND.WAKA_INTERVAL_MS);
  }

  private stopWaka(): void
  {
    if (this.wakaInterval)
    {
      clearInterval(this.wakaInterval);
      this.wakaInterval = null;
    }
  }
}