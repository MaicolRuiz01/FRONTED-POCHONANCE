import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-card.component.html',
  styleUrls: ['./mi-card.component.css']
})
export class CardListComponent {
  @Input() data: any[] = [];
  @Input() columns: { label: string, field: string }[] = [];

  @ContentChild('cardActionTemplate') cardActionTemplate!: TemplateRef<any>;
}
