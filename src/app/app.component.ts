import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { StoreStateService } from './shared/services/private_services/store-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    ButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  collapsed = false;
  mode: 'seller' | 'buyer' = 'seller';
  store: any;

  constructor(private router: Router, private storeState: StoreStateService) {}

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  ngOnInit() {
    this.router.events.subscribe(() => {
      const url = this.router.url;

      if (url.startsWith('/store/')) {
        this.mode = 'buyer';
        this.storeState.store$.subscribe((s) => {
          this.store = s;
        });
      } else {
        this.mode = 'seller';
        this.storeState.clearStore();
        this.store = null;
      }
    });
  }
}
