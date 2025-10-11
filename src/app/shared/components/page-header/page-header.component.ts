import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {
  @Input() title = 'Título de la página';
  @Input() subtitle = 'Subtítulo o descripción corta.';
  @Input() icon = 'pi pi-star';
  @Input() primaryColor = '#ec4899';  // rosa
  @Input() secondaryColor = '#7e22ce'; // violeta
}
