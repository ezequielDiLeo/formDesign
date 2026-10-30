import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIcon, MatTooltip],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements OnInit {
  collapsed = signal(false);

  ngOnInit(): void {
    const savedState = localStorage.getItem('formflow_sidebar_collapsed');
    if (savedState === 'true') {
      this.collapsed.set(true);
    }
  }

  toggleSidebar(): void {
    this.collapsed.update(val => {
      const newState = !val;
      localStorage.setItem('formflow_sidebar_collapsed', String(newState));
      return newState;
    });
  }

}
