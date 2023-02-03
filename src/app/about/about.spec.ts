import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AboutComponent } from './about';
import { AboutModule } from './about.module';
import { LicensesComponent } from './licenses/licenses';

describe('AboutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutModule],
    }).compileComponents();
  });

  it('should create the about component', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should create the licenses component', () => {
    const fixture = TestBed.createComponent(LicensesComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
