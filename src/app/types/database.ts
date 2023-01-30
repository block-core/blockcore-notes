// import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, DBSchema } from 'idb';
// import { NostrProfileDocument } from '../services/interfaces';

// /** Make sure you read and learn: https://github.com/jakearchibald/idb */

// interface NotesDB extends DBSchema {
//   'favourite-number': {
//     key: string;
//     value: number;
//   };
//   profiles: {
//     value: NostrProfileDocument;
//     key: string;
//     indexed: { created_at: number };
//   };
//   products: {
//     value: {
//       name: string;
//       price: number;
//       productCode: string;
//     };
//     key: string;
//     indexes: { 'by-price': number };
//   };
// }

// export class Storage {
//   public db!: IDBPDatabase<NotesDB>;

//   constructor(private name: string, private version: number) {
//     // let db;
//     // const request = indexedDB.open('MyTestDatabase');
//     // request.onerror = (event) => {
//     //   console.error("Why didn't you allow my web app to use IndexedDB?!");
//     // };
//     // request.onsuccess = (event) => {
//     //   db = event.target.result;
//     // };
//     // // This event is only implemented in recent browsers
//     // request.onupgradeneeded = (event) => {
//     //   // Save the IDBDatabase interface
//     //   const db = event.target.result;
//     //   // Create an objectStore for this database
//     //   const objectStore = db.createObjectStore('name', { keyPath: 'myKey' });
//     // };
//   }

//   async open() {
//     this.db = await openDB<NotesDB>(this.name, this.version, {
//       upgrade(db, oldVersion, newVersion, transaction, event) {
//         // …
//         console.log('CREATE/UPGRADE DB!!!');

//         db.createObjectStore('favourite-number');

//         const productStore = db.createObjectStore('products', {
//           keyPath: 'productCode',
//         });

//         productStore.createIndex('by-price', 'price');

//         const profilesStore = db.createObjectStore('profiles', {
//           keyPath: 'pubkey',
//         });

//         // profilesStore.createIndex('by-pubkey', 'pubkey');
//         // profilesStore.createIndex('by-created_at', 'created_at');
//       },
//       blocked(currentVersion, blockedVersion, event) {
//         // …
//       },
//       blocking(currentVersion, blockedVersion, event) {
//         // …
//       },
//       terminated() {
//         // …
//       },
//     });
//   }

//   close() {
//     this.db.close();
//   }

//   async get(table: string, key: any) {
//     return this.db.get(table, key);
//   }

//   async put(table: string, key: any, value: any) {
//     return this.db.put(table, value, key);
//   }

//   async delete() {
//     await deleteDB(this.name, {
//       blocked() {
//         // …
//       },
//     });
//   }
// }
