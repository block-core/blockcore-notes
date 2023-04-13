import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpacesService {
  constructor() {
    this.load();
  }

  spaces: any[] = [];

  load() {
    let spaces = localStorage.getItem('blockcore:notes:nostr:spaces');

    if (spaces) {
      this.spaces = JSON.parse(spaces);
    } else {
      this.spaces = [
        {
          name: 'SondreB',
          title: 'sondreb.com',
          comment: 'Liberstad Membership Organization',
          npub: 'npub1zl3g38a6qypp6py2z07shggg45cu8qex992xpss7d8zrl28mu52s4cjajh',
          picture: 'https://nostr.build/i/nostr.build_11eaf429c0c74a9b7822072531e1c6d54a7e4c084b49d0aab776dbb13d81ef27.jpg',
          banner: 'https://nostr.build/i/nostr.build_74ee63e85287e5b3351d757724e57d53d17b9f029bfad7d77dcb913b325727bb.png',
          relayCount: 1,
          relaySync: false,
        },
        {
          name: 'SondreB',
          title: 'sondreb.com',
          comment: 'Public Space',
          npub: 'npub1zl3g38a6qypp6py2z07shggg45cu8qex992xpss7d8zrl28mu52s4cjajh',
          picture: 'https://nostr.build/i/nostr.build_11eaf429c0c74a9b7822072531e1c6d54a7e4c084b49d0aab776dbb13d81ef27.jpg',
          banner: 'https://nostr.build/i/nostr.build_74ee63e85287e5b3351d757724e57d53d17b9f029bfad7d77dcb913b325727bb.png',
          relayCount: 12,
          relaySync: true,
        },
        {
          name: 'Liberstad',
          title: 'liberstad.com',
          comment: 'Public Space',
          npub: 'npub1qutr6g66j7fpd4dyly9u2dwmkta8cywc9lucm4ze8p7xdtrlkhcsn2n9hn',
          picture: 'https://nostr.build/i/p/nostr.build_392926c2220b31a78708d11afeb92a9aa4731e19b233a130c34a81211c4bca3e.png',
          banner: 'https://nostr.build/i/nostr.build_955535ae6cc45caa1d8639e72dbdf69b0ade7c92d519877eeefaf1d586caad6e.jpg',
          relayCount: 10,
          relaySync: true,
        },
        {
          name: 'Liberstad',
          title: 'liberstad.com',
          comment: 'Liberstad Membership Organization',
          npub: 'npub1qutr6g66j7fpd4dyly9u2dwmkta8cywc9lucm4ze8p7xdtrlkhcsn2n9hn',
          picture: 'https://nostr.build/i/p/nostr.build_392926c2220b31a78708d11afeb92a9aa4731e19b233a130c34a81211c4bca3e.png',
          banner: 'https://nostr.build/i/nostr.build_955535ae6cc45caa1d8639e72dbdf69b0ade7c92d519877eeefaf1d586caad6e.jpg',
          relayCount: 1,
          relaySync: false,
        },
      ];
    }
  }
}
