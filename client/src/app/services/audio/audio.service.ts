import { Injectable } from '@angular/core';
import { panicSong } from '@app/constants/audio.constants';

@Injectable({
    providedIn: 'root',
})
export class AudioService {
    private audio = new Audio();
    private readonly panicSongLink: string = panicSong;
    private isAudioPlaying = false;

    playAudio(): void {
        this.setPanicAudio();
        this.audio.play();
        this.isAudioPlaying = true;
    }

    pauseAudio(): void {
        if (this.isAudioPlaying) {
            this.audio.pause();
            this.isAudioPlaying = false;
        }
    }

    setPanicAudio(): void {
        if (this.audio.src !== this.panicSongLink) {
            this.audio.src = this.panicSongLink;
            this.audio.load();
        }
    }
}
