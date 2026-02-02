import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-contact.component.html',
  styleUrl: './floating-contact.component.scss',
})
export class FloatingContactComponent {
  @Input() phone: string = '';
  @Input() zalo: string = '';
}
