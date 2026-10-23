import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getDatabase,
  get,
  ref,
  set,
  type Database,
} from "firebase/database";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";

type DatabaseValue =
  | string
  | number
  | boolean
  | null
  | DatabaseValue[]
  | { [key: string]: DatabaseValue };

interface FirestoreDocument extends DocumentData {
  id: string;
}

interface FirestoreGroupDocument extends FirestoreDocument {
  parent?: string;
}

class FirebaseBase {
  protected readonly app;

  constructor(config: FirebaseOptions) {
    this.app = getApps().find((app) => app.name === "[DEFAULT]") ??
      initializeApp(config);
  }
}

export class Firebase extends FirebaseBase {
  private readonly db: Database;

  constructor(config: FirebaseOptions) {
    super(config);
    this.db = getDatabase(this.app, config.databaseURL);
  }

  async dbGet<T>(path: string): Promise<T | null> {
    try {
      const snapshot = await get(ref(this.db, path));
      return snapshot.exists() ? snapshot.val() as T : null;
    } catch (error) {
      console.error("Error reading Realtime Database:", error);
      return null;
    }
  }

  async dbSet(path: string, child: string, value: DatabaseValue): Promise<void> {
    await set(ref(this.db, `${path}/${child}`), value);
  }
}

export class FirestoreDB extends FirebaseBase {
  private readonly db: Firestore;

  constructor(config: FirebaseOptions) {
    super(config);
    this.db = getFirestore(this.app);
  }

  async dbGetDoc(
    collectionName: string,
    docId: string,
  ): Promise<DocumentData | null> {
    try {
      const snapshot = await getDoc(doc(this.db, collectionName, docId));
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.error("Error reading Firestore document:", error);
      return null;
    }
  }

  async dbGetCollection(collectionName: string): Promise<FirestoreDocument[]> {
    try {
      const snapshot = await getDocs(collection(this.db, collectionName));
      return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
    } catch (error) {
      console.error("Error reading Firestore collection:", error);
      return [];
    }
  }

  async dbGetCollectionGroup(
    subCollectionName: string,
  ): Promise<FirestoreGroupDocument[]> {
    try {
      const snapshot = await getDocs(collectionGroup(this.db, subCollectionName));
      return snapshot.docs.map((document) => ({
        id: document.id,
        parent: document.ref.parent.id,
        ...document.data(),
      }));
    } catch (error) {
      console.error("Error reading Firestore collection group:", error);
      return [];
    }
  }

  async dbSetDoc(
    collectionName: string,
    docId: string,
    value: DocumentData,
  ): Promise<void> {
    try {
      await setDoc(doc(this.db, collectionName, docId), value);
    } catch (error) {
      console.error("Error writing Firestore document:", error);
    }
  }
}
