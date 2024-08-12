import { Component } from '@angular/core';

@Component({
    selector: 'app-import-modal',
    templateUrl: './import-modal.component.html',
    styleUrls: ['./import-modal.component.scss'],
})
export class ImportModalComponent {
    selectedFile: File | null = null;

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (!target || !target.files) return;
        this.selectedFile = target.files[0];
    }
}
