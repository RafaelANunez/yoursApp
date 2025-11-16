import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU5g0uyStfZWYnN7V0mkibsWHZxqUSvfs",
  authDomain: "location-share-aa9f9.firebaseapp.com",
  databaseURL: "https://location-share-aa9f9-default-rtdb.firebaseio.com/",
  projectId: "location-share-aa9f9",
  storageBucket: "location-share-aa9f9.firebasestorage.app",
  messagingSenderId: "703348835775",
  appId: "1:703348835775:web:6c00ab785a9cd0dd2e0d0a"
};

// Initialize Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { app, database };
