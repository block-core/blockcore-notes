// import { Injectable } from '@angular/core';
// import { Circle } from './interfaces';
// import { BehaviorSubject, from, Observable } from 'rxjs';
// import { liveQuery } from 'dexie';
// import { DatabaseService } from './database.service';
// import { CacheService } from './cache.service';
// import { Utilities } from './utilities.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class UserService {
//   private table;

//   circles: Circle[] = [];

//   cache = new CacheService();

//   items$ = liveQuery(() => this.items());

//   async items() {
//     return await this.table.toArray();
//   }

//   constructor(private db: DatabaseService, private utilities: Utilities) {
//     this.table = this.db.notes;
//   }

//   /** Important to call to ensure we have the default circle added */
//   async initialize() {
//     const defaultCircle = await this.table.get(0);

//     if (!defaultCircle) {
//       await this.put(CircleService.DEFAULT);
//     }

//     // Cache the circle so we can lookup quickly.
//     this.items$.subscribe((circles) => {
//       this.circles = circles;
//     });
//   }

//   async get(id?: number) {
//     if (id == null) {
//       return undefined;
//     }

//     // Use the cache if loaded already.
//     if (this.circles.length > 0) {
//       return this.circles.find((c) => c.id == id);
//     } else {
//       return await this.table.get(id);
//     }
//   }

//   async put(document: Circle | any) {
//     const now = this.utilities.now();

//     if (!document.created) {
//       document.created = now;
//     }

//     document.modified = now;
//     await this.table.put(document);
//   }

//   async delete(id: number) {
//     await this.table.delete(id);
//   }

//   /** Wipes all circles. */
//   async wipe() {
//     this.table.clear();
//   }
// }
