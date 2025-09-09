import { Component } from '@angular/core';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';
import { MatIcon } from "@angular/material/icon";


@Component({
  selector: 'app-best-sellers',
  standalone: true,
  imports: [MatProgressBarModule, MatMenuModule, MatDividerModule, MatIcon],
  templateUrl: './best-sellers.component.html',
  styleUrl: './best-sellers.component.scss'
})
export class BetSellersComponent {

}
