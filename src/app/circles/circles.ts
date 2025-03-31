import { Component, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Circle } from '../services/interfaces';
import { CircleService } from '../services/circle';
import { ProfileService } from '../services/profile';
import { MatDialog } from '@angular/material/dialog';
import { CircleDialog } from '../shared/create-circle-dialog/create-circle-dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'app-circles',
    templateUrl: './circles.html',
    styleUrls: ['./circles.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatListModule,
      MatMenuModule
    ]
})
export class CirclesComponent {
  circles = signal<Circle[]>([]);
  publicCircles = signal<Circle[]>([]);
  privateCircles = signal<Circle[]>([]);
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private appState: ApplicationState,
    public circleService: CircleService,
    public profileService: ProfileService
  ) {
    // Create effect to sort circles when they change
    effect(() => {
      const allCircles = this.circleService.circles;
      this.circles.set(allCircles);
      
      // Filter public and private circles
      this.publicCircles.set(allCircles.filter(c => c.public));
      this.privateCircles.set(allCircles.filter(c => !c.public));
    });
  }

  async ngOnInit() {
    this.appState.updateTitle('Circles');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'add_circle',
        tooltip: 'Create Circle',
        click: () => {
          this.createCircle();
        },
      },
    ];

    // Load circles
    await this.circleService.load();
  }

  createCircle(): void {
    const dialogRef = this.dialog.open(CircleDialog, {
      data: {},
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.circleService.create({
          id: 0,
          name: result.name,
          description: result.description,
          public: result.public,
          style: result.style || 1,
          modified: Math.floor(Date.now() / 1000),
        });
      }
    });
  }

  async setDefault(id?: number): Promise<void> {
    await this.circleService.setDefault(id);
  }

  async delete(id?: number): Promise<void> {
    await this.circleService.delete(id);
  }

  editCircle(circle: Circle): void {
    const dialogRef = this.dialog.open(CircleDialog, {
      data: circle,
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        circle.name = result.name;
        circle.description = result.description;
        circle.public = result.public;
        circle.style = result.style || 1;
        circle.modified = Math.floor(Date.now() / 1000);
        
        await this.circleService.update(circle);
      }
    });
  }
}
