// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeoEbZeOXGl7K2zTge3JePvowsjVkoQQQ",
  authDomain: "trabalho-final---pweb.firebaseapp.com",
  projectId: "trabalho-final---pweb",
  storageBucket: "trabalho-final---pweb.firebasestorage.app",
  messagingSenderId: "23061504678",
  appId: "1:23061504678:web:a49937871599aa5c5cca67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };