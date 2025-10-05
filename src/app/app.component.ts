import { Component, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { StoreStateService } from './shared/services/private_services/store-state.service';
import { SidebarModule } from 'primeng/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    ButtonModule,
    SidebarModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  collapsed = false;
  sidebarVisible = false; // 👈 overlay mobile
  isMobile = false; // 👈 flag mobile
  mode: 'seller' | 'buyer' = 'seller';
  store: any;

  constructor(private router: Router, private storeState: StoreStateService) {}

  ngOnInit() {
    this.checkMobile();
    this.router.events.subscribe(() => {
      const url = this.router.url;

      if (url.startsWith('/store/')) {
        this.mode = 'buyer';
        this.storeState.store$.subscribe((s) => {
          this.store = s;

          if (this.store) {
    const root = document.documentElement;
    root.style.setProperty('--primary', this.store.primary_color || '#ff4081');
    root.style.setProperty('--secondary', this.store.secondary_color || '#00bfa5');
    root.style.setProperty(
      '--bg',
      this.store.background_color === 'dark' ? '#202123' : '#ffffff'
    );
    root.style.setProperty(
      '--text',
      this.store.background_color === 'dark' ? '#f5f5f5' : '#111827'
    );
    root.style.setProperty(
      '--surface',
      this.store.background_color === 'dark' ? '#2a2b32' : '#f9fafb'
    );
  }
});
      } else {
        this.mode = 'seller';
        this.storeState.clearStore();
        this.store = null;
      }
    });
  }

  // Detectar cambio de tamaño
  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  private checkMobile() {
    this.isMobile = window.innerWidth < 768; // md breakpoint
    if (this.isMobile) {
      this.collapsed = true; // sidebar colapsado por defecto
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.sidebarVisible = !this.sidebarVisible;
    } else {
      this.collapsed = !this.collapsed;
    }
  }
}
