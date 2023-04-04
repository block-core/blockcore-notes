import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Nip76Wallet, Nip76WebWalletStorage, PrivateChannel } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
import { NavigationService } from '../../services/navigation';
import { UIService } from '../../services/ui';
import { defaultSnackBarOpts, Nip76Service } from '../nip76.service';

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
  activeChannelId!: string | null;
  showHelp = false;
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
    setTimeout(() => {
      this.showHelp = this.wallet?.isInSession && this.wallet?.channels?.length === 0;
    }, 3000);
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
      } if (this.router.url.endsWith('/sent-rsvps')) {
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

  async initPrivateChannels() {
    const publicKey = this.nip76Service.profile.pubkey;
    const privateKey = await this.nip76Service.passwordDialog('Create an HD Wallet');
    this.nip76Service.wallet = await Nip76WebWalletStorage.fromStorage({ publicKey, privateKey });
    this.nip76Service.wallet.saveWallet(privateKey);
    location.reload();
  }

  copyDemoInvitation(name: 'Alice') {
    const invitation = {
      'Alice': 'nprivatechan1z5ay69wdt282c54z0m5rnmvqmr5elgsadczlkn5j50d7r2mtll8klfcxm76rzg90eqjdep70c88wur2sgvw0qt90vt3jw9lfser66hkcwywjxqudzfws20zyex2pktzmfjk0hpdehu9d4swanmcsckayfxrr0wgyvzm0j6'
    }[name];
    navigator.clipboard.writeText(invitation);
    this.snackBar.open(`The invitation is now in your clipboard. Click Read Invitation and paste it there.`, 'Hide', defaultSnackBarOpts);
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
    this.router.navigate(['/private-channels']);
  }

  listChannels() {
    this.router.navigate(['/private-channels']);
  }

  sentRvps() {
    this.router.navigate(['/private-channels', 'sent-rsvps']);
  }
}
