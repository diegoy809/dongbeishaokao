import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWKDKAWvSt8ukmW6YtgxGHoK4HQczTia4",
  authDomain: "dongbeishaokao-cfc3d.firebaseapp.com",
  databaseURL: "https://dongbeishaokao-cfc3d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dongbeishaokao-cfc3d",
  storageBucket: "dongbeishaokao-cfc3d.firebasestorage.app",
  messagingSenderId: "509212341963",
  appId: "1:509212341963:web:a56019fb18674ba0320d4e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
