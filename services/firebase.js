import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Load Firebase configuration from environment variables
// All Firebase config must be prefixed with EXPO_PUBLIC_ to be accessible in Expo
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all required environment variables are present
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  varName => !process.env[varName]
);

if (missingVars.length > 0) {
  const errorMessage =
    `❌ Missing required Firebase environment variables: ${missingVars.join(', ')}\n\n` +
    '📝 To fix this:\n' +
    '1. Create a .env file in the project root\n' +
    '2. Copy the template from .env.example\n' +
    '3. Fill in your actual Firebase credentials\n' +
    '4. Restart the dev server with: npx expo start -c\n\n' +
    'See README.md for detailed setup instructions.';

  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Initialize Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);

  console.log('==========================================');
  console.log('✅ Firebase initialized successfully');
  console.log('📱 Using environment variables from .env');
  console.log('🔥 Project ID:', firebaseConfig.projectId);
  console.log('🗄️  Database URL:', firebaseConfig.databaseURL);
  console.log('==========================================');
} catch (error) {
  console.error('==========================================');
  console.error('❌ Error initializing Firebase:', error.message);
  console.error('==========================================');
  throw error;
}

export { app, database };
