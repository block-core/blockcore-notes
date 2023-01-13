import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { NostrProfileDocument } from './interfaces';
import { ProfileService } from './profile';

@Injectable({
  providedIn: 'root',
})
export class UIService {
  constructor(private profileService: ProfileService) {
    this.pubkey$.subscribe((pubkey) => {
      if (!pubkey) {
        return;
      }

      this.profileService.getProfile(pubkey).subscribe((profile) => {
        this.#profile = profile;
        this.#profileChanged.next(this.#profile);
      });
    });
  }

  #pubkey: string | undefined = undefined;

  get pubkey() {
    return this.#pubkey;
  }

  #pubkeyChanged: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.pubkey);

  get pubkey$(): Observable<string | undefined> {
    return this.#pubkeyChanged.asObservable();
  }

  setPubKey(pubkey: string) {
    this.#pubkey = pubkey;
    this.#pubkeyChanged.next(this.#pubkey);
  }

  #profile: NostrProfileDocument | undefined = undefined;

  get profile() {
    return this.#profile;
  }

  #profileChanged: BehaviorSubject<NostrProfileDocument | undefined> = new BehaviorSubject<NostrProfileDocument | undefined>(this.profile);

  get profile$(): Observable<NostrProfileDocument | undefined> {
    return this.#profileChanged.asObservable();
  }

  //   get profile$(): Observable<NostrProfileDocument | undefined> {
  //     return this.#pubkeyChanged.pipe((pubkey) => {
  //       if (!pubkey) {
  //         return null;
  //       }

  //       return this.profileService.getProfile(pubkey);
  //     });
  //   }
}
