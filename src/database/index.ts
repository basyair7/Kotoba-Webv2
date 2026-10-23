import { Firebase, FirestoreDB } from "./firebase";
import { path_RBDB, path_Collection } from "./firebaseKeys/path";

function requiredPublicEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const firebaseConfig = {
    apiKey: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    databaseURL: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
    projectId: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export {
    Firebase,
    FirestoreDB,
    firebaseConfig,
    path_RBDB,
    path_Collection,
};