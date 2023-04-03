import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Nip76Wallet, PrivateChannel } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
import { NavigationService } from '../../services/navigation';
import { UIService } from '../../services/ui';
import { Nip76Service } from '../nip76.service';

enum DisplayType {
  GuestUser = 'GuestUser',
  ChannelList = 'ChannelList',
  SingleChannel = 'SingleChannel',
  SentRSVPs = 'SentRSVPs',
}
@Component({
  selector: 'app-nip76',
  templateUrl: './nip76-main.component.html',
  styleUrls: ['./nip76-main.component.scss']
})
export class Nip76MainComponent {

  DisplayType = DisplayType;
  editChannel?: PrivateChannel;
  activeChannelId!: string | null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    public navigation: NavigationService,
    public appState: ApplicationState,
    public ui: UIService,
    public nip76Service: Nip76Service,
  ) { }

  async ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.activeChannelId = params.get('channelPubKey');
    });
  }

  get displayType(): DisplayType {
    if (!this.wallet || this.wallet.isGuest) {
      return DisplayType.GuestUser;
    } else {
      if (this.activeChannelId) {
        const channel = this.nip76Service.findChannel(this.activeChannelId);
        if (channel) {
          return DisplayType.SingleChannel;
        } 
      } if( this.router.url.endsWith('/sent-rsvps')) {
        return DisplayType.SentRSVPs;
      } else {
        return DisplayType.ChannelList;
      }
    }
  }

  get wallet(): Nip76Wallet {
    return this.nip76Service.wallet;
  }

  get activeChannel(): PrivateChannel | undefined {
    if (this.activeChannelId) {
      if (!this.wallet.isGuest && this.wallet.isInSession) {
        const channel = this.nip76Service.findChannel(this.activeChannelId);
        if (channel) {
          return channel;
        }
      }
      this.listChannels();
    }
    return undefined;
  }

  randomizeKey() {
    this.wallet.reKey();
    this.editChannel = this.wallet.channels[0];
    this.editChannel.editing = true;
    this.editChannel.content.name = 'Example Channel 1';
    this.editChannel.content.about = 'My First Private Channel 1';
    this.editChannel.ready = true;
  }

  async saveConfiguration() {
    const savedLocal = await this.nip76Service.saveWallet();
    const savedRemote = await this.nip76Service.saveChannel(this.editChannel!);
    location.reload();
  }

  async readInvitation() {
    const channel = await this.nip76Service.readInvitationDialog();
    if (channel) {
      this.activeChannelId = channel.dkxPost.signingParent.nostrPubKey;
      this.router.navigate(['/private-channels', this.activeChannelId, 'notes']);
    }
  }

  createChannel() {
    let newChannel = this.wallet.createChannel();
    newChannel.ready = newChannel.editing = true;
    this.editChannel = newChannel;
    this.router.navigate(['/private-channels']);
  }

  listChannels() {
    this.router.navigate(['/private-channels']);
  }

  sentRvps() {
    this.router.navigate(['/private-channels', 'sent-rsvps']);
  }
}
