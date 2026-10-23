import {
  Firebase,
  FirestoreDB,
  firebaseConfig,
  path_Collection,
  path_RBDB,
} from "../database";

export interface KotobaWord {
  kanji?: string;
  furigana?: string;
  romaji?: string;
  indonesia?: string;
}

export type KotobaChapter = Record<string, KotobaWord>;
export type KotobaData = Record<string, KotobaChapter>;

interface FirestoreKotobaDocument extends KotobaWord {
  id: string;
  parent?: string;
}

function asKotobaWord(value: KotobaWord): KotobaWord {
  return {
    kanji: value.kanji,
    furigana: value.furigana,
    romaji: value.romaji,
    indonesia: value.indonesia,
  };
}

export class dbModelsRealtime {
  private static readonly firebase = new Firebase(firebaseConfig);

  static async getAll(): Promise<KotobaData | null> {
    try {
      return await this.firebase.dbGet<KotobaData>(path_RBDB.kotoba_root);
    } catch (error) {
      console.error("Error dbModelsRealtime.getAll():", error);
      return null;
    }
  }

  static async getByBab(bab: string): Promise<KotobaChapter | null> {
    try {
      return await this.firebase.dbGet<KotobaChapter>(
        `${path_RBDB.kotoba_root}/${bab}`,
      );
    } catch (error) {
      console.error("Error dbModelsRealtime.getByBab:", error);
      return null;
    }
  }
}

export class dbModelsFirestore {
  private static readonly firestore = new FirestoreDB(firebaseConfig);

  static async getAll(): Promise<KotobaData | null> {
    try {
      const documents = await this.firestore.dbGetCollectionGroup(
        path_Collection.kotoba_root,
      ) as FirestoreKotobaDocument[];
      const result: KotobaData = {};

      for (const document of documents) {
        if (!document.parent) continue;
        result[document.parent] ??= {};
        result[document.parent][document.id] = asKotobaWord(document);
      }

      return result;
    } catch (error) {
      console.error("Error dbModelsFirestore.getAll:", error);
      return null;
    }
  }

  static async getByBab(bab: string): Promise<KotobaChapter | null> {
    try {
      const data = await this.firestore.dbGetDoc(path_Collection.kotoba_root, bab);
      return data ? data as KotobaChapter : null;
    } catch (error) {
      console.error("Error dbModelsFirestore.getByBab:", error);
      return null;
    }
  }
}
