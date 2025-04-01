import {Component, EventEmitter, Input, Output} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { UserModel } from 'src/app/services/interfaces';
import { UserService } from 'src/app/services/user.service';
import { StatusComponent } from '../status/status.component';


@Component({
  selector: 'app-user-item',
  templateUrl: './user-item.component.html',
  styleUrls: ['./user-item.component.scss'],
  imports: [MatListModule, StatusComponent],
})
export class UserItemComponent {
  @Output() openSidebar: EventEmitter<string> = new EventEmitter();
  @Input()user!: UserModel;


  constructor(private service: UserService) {
  }

  showProfile() {
    this.service.active.next(this.user);
    this.openSidebar.emit(this.user.name);
  }
}
