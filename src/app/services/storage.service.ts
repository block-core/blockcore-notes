// import { Injectable } from '@angular/core';
// import { Level } from 'level';
// import { NostrDocument, NostrEventDocument } from './interfaces';
// import { sleep } from './utilities.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class StorageService {
//   #db: Level<string, NostrDocument<NostrEventDocument> | any>;
//   // sequence = 0;

//   // database(): Level<string, NostrDocument<NostrEvent> | any> {
//   //   return this.db;
//   // }

//   get database() {
//     return this.#db;
//   }

//   constructor() {
//     this.#db = new Level<string, NostrDocument<NostrEventDocument> | any>('blockcore-notes', { keyEncoding: 'utf8', valueEncoding: 'json' });
//   }

//   table<T>(name: string) {
//     return this.#db.sublevel<string, T>(name, { keyEncoding: 'utf8', valueEncoding: 'json' });
//   }

//   async initialize() {
//     // const lastItem = await this.db
//     //   .sublevel('update')
//     //   .keys({ reverse: true, limit: 1, keyEncoding: lexint.default('hex') })
//     //   .all();
//     // if (lastItem != null && lastItem.length > 0) {
//     //   this.sequence = Number(lastItem[0]);
//     // } else {
//     //   this.sequence = 0;
//     // }
//     // console.log('Current sequence: ', this.sequence);
//   }

//   async open() {
//     while (this.#db.status === 'opening' || this.#db.status === 'closing') {
//       await sleep(150);
//     }

//     if (this.#db.status === 'open') {
//       return;
//     }

//     return this.#db.open();
//   }

//   async close() {
//     while (this.#db.status === 'opening' || this.#db.status === 'closing') {
//       await sleep(150);
//     }

//     if (this.#db.status === 'closed') {
//       return;
//     }

//     return this.#db.close();
//   }

//   async wipe() {
//     for await (const [key, value] of this.#db.iterator({})) {
//       console.log('Delete:', key);
//       console.log('Data:', value);
//       await this.#db.del(key);
//     }
//   }

//   /** This is to be used by server administrators. */
//   async delete(id: string, sublevel?: string) {
//     if (sublevel) {
//       return this.#db.sublevel(sublevel).del(id);
//     } else {
//       return this.#db.del(id);
//     }
//   }

//   async get<T>(id: string, sublevel?: string): Promise<T | undefined> {
//     try {
//       if (sublevel) {
//         const entry = await this.#db.sublevel(sublevel).get<string, T>(id, { keyEncoding: 'utf8', valueEncoding: 'json' });
//         return entry;
//       } else {
//         const entry = await this.#db.get<string, T>(id, { keyEncoding: 'utf8', valueEncoding: 'json' });
//         return entry;
//       }
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (err: any) {
//       if (err.code === 'LEVEL_NOT_FOUND') {
//         return undefined;
//       } else {
//         console.log('HERE?!?!?');
//         throw err;
//       }
//     }
//   }
// }
