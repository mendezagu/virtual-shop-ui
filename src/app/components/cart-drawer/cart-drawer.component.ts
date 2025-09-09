import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CartItem } from '../../shared/services/public_services/cart.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterModule],
  templateUrl: './cart-drawer.component.html',
  styleUrls:  ['./cart-drawer.component.scss'] 
})
export class CartDrawerComponent {
   @Input() open = false;
  @Input() items: CartItem[] = [];
  @Input() total = 0;
  @Input() slug!: string;  

  @Output() close = new EventEmitter<void>();
  @Output() updateQty = new EventEmitter<{ itemId: string; cantidad: number }>();
  @Output() remove = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  // --- swipe to close (mobile) ---
  private touchStartX = 0;
  private touchCurrentX = 0;
  private swiping = false;

  onTouchStart(ev: TouchEvent) {
    if (ev.touches.length !== 1) return;
    this.swiping = true;
    this.touchStartX = ev.touches[0].clientX;
    this.touchCurrentX = this.touchStartX;
  }

  onTouchMove(ev: TouchEvent) {
    if (!this.swiping) return;
    this.touchCurrentX = ev.touches[0].clientX;
    // podrías aplicar translateX en línea para feedback visual si querés
    // (omito por simplicidad; la animación de cierre es suficiente)
  }

  onTouchEnd() {
    if (!this.swiping) return;
    const delta = this.touchCurrentX - this.touchStartX;
    this.swiping = false;

    // si desliza hacia la derecha más de 60px, cerramos
    if (delta > 60) {
      this.close.emit();
    }
  }

}
