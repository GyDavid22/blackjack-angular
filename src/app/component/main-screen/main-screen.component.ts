import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-main-screen',
  imports: [],
  templateUrl: './main-screen.component.html',
  styleUrl: './main-screen.component.css'
})
export class MainScreenComponent {
  @Output()
  click: EventEmitter<void> = new EventEmitter();
}
