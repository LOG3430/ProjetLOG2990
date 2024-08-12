import { TestBed } from '@angular/core/testing';
import { panicSong } from '@app/constants/audio.constants';
import { AudioService } from './audio.service';

describe('AudioService', () => {
    let service: AudioService;
    let mockAudio: jasmine.SpyObj<HTMLAudioElement>;
    beforeEach(() => {
        mockAudio = jasmine.createSpyObj('Audio', ['play', 'pause', 'load']);
        spyOn(window, 'Audio').and.returnValue(mockAudio);
        TestBed.configureTestingModule({});
        service = TestBed.inject(AudioService);
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('playAudio', () => {
        it('should call load on the audio object with panic song', () => {
            spyOn(service, 'setPanicAudio');
            service.playAudio();
            expect(service.setPanicAudio).toHaveBeenCalled();
            expect(mockAudio.play).toHaveBeenCalled();
            expect(service['isAudioPlaying']).toBeTrue();
        });
    });

    describe('pauseAudio', () => {
        it('should call the pause method for the audio if audio is playing', () => {
            service['isAudioPlaying'] = true;
            service.pauseAudio();
            expect(mockAudio.pause).toHaveBeenCalled();
            expect(service['isAudioPlaying']).toBeFalse();
        });

        it('should not call the pause method for the audio if audio is not playing', () => {
            service['isAudioPlaying'] = false;
            service.pauseAudio();
            expect(mockAudio.pause).not.toHaveBeenCalled();
            expect(service['isAudioPlaying']).toBeFalse();
        });
    });

    describe('pauseAudio', () => {
        it('should do nothing if the song is already the panic song', () => {
            service['audio'].src = panicSong;
            service.setPanicAudio();
            expect(mockAudio.load).not.toHaveBeenCalled();
        });
        it('should change to the panic song and load it if its not set', () => {
            const notPanicSong = 'not the panic song';
            service['audio'].src = notPanicSong;
            service.setPanicAudio();
            expect(mockAudio.load).toHaveBeenCalled();
            expect(service['audio'].src).toEqual(panicSong);
        });
    });
});
