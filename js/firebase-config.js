import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAX5TX9z3cTxL5HKfXxAx8ra3OqtqOmiNQ",
  authDomain: "stssm-f2796.firebaseapp.com",
  projectId: "stssm-f2796",
  storageBucket: "stssm-f2796.firebasestorage.app",
  messagingSenderId: "988305675822",
  appId: "1:988305675822:web:669b7dff5843fb09d2f1bf"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
