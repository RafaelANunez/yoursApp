# yours_App

The "Yours" app is a powerful personal safety tool designed to help users document incidents, alert loved ones, and get help in emergencies. Building it for both iOS and Android requires a solid technical plan focused on reliability, security, and user experience.

## Features

- **Journey Sharing**: Share your real-time location with friends and family
- **Location Tracking**: Track friends' locations with encrypted end-to-end security
- **Discreet Mode**: Quickly hide the app in emergency situations
- **Location History**: View your past location sharing sessions
- **Emergency Quick Exit**: Sudoku puzzle login for discreet access

## Environment Setup

This project uses environment variables to securely store Firebase configuration and other sensitive data.

### First Time Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yoursApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase credentials**

   Open the `.env` file and fill in your actual Firebase credentials:

   - If you're a team member, ask the project maintainer for the Firebase credentials
   - If you're setting up your own Firebase project:
     1. Go to [Firebase Console](https://console.firebase.google.com/)
     2. Create a new project or select your existing project
     3. Go to Project Settings (gear icon)
     4. Scroll to "Your apps" section and create a Web app if you haven't
     5. Copy the config values to your `.env` file

5. **Start the development server**
   ```bash
   npx expo start -c
   ```

   The `-c` flag clears the cache to ensure environment variables are loaded properly.

### Environment Variables

The following environment variables are required in your `.env` file:

```
EXPO_PUBLIC_FIREBASE_API_KEY=<your_api_key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
EXPO_PUBLIC_FIREBASE_DATABASE_URL=<your_database_url>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your_app_id>
```

**Important**: All variables must be prefixed with `EXPO_PUBLIC_` to be accessible in Expo.

### Troubleshooting

**Error: "Missing required Firebase environment variables"**
- Make sure `.env` file exists in the project root
- Verify all variables start with `EXPO_PUBLIC_`
- Restart the dev server with `npx expo start -c` (cache clear)

**Firebase connection issues**
- Check that values in `.env` match your Firebase project configuration
- Ensure there are no extra spaces or quotes around values
- Verify your Firebase project is active in the Firebase Console

**Changes to .env not taking effect**
- Always restart the dev server with cache clear: `npx expo start -c`
- Expo caches environment variables, so clearing cache is essential

## Security Notes

🔒 **Important Security Practices**

**DO NOT:**
- ❌ Commit `.env` to git (it's already in `.gitignore`)
- ❌ Share your `.env` file publicly or in screenshots
- ❌ Hardcode credentials directly in the code
- ❌ Include `.env` in documentation or issues

**DO:**
- ✅ Keep `.env` in `.gitignore` (already configured)
- ✅ Share credentials securely (encrypted messages, password managers)
- ✅ Commit `.env.example` as a template for other developers
- ✅ Update `.env` when Firebase credentials change
- ✅ Use environment variables for all sensitive configuration

## Running the App

### Development Mode (Expo Go)

```bash
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

### Production Build

For production builds with background location tracking:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

**Note**: Background location tracking requires a development build and will not work in Expo Go.

## Project Structure

```
yoursApp/
├── components/          # React components
│   ├── JourneySharing/  # Location sharing features
│   └── ...
├── services/            # Firebase and background services
│   ├── firebase.js      # Firebase initialization
│   ├── firebaseService.js # Firebase operations
│   └── backgroundLocationService.js
├── utils/               # Utility functions
│   └── journeySharing/  # Journey sharing utilities
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Template for environment variables
└── App.js               # Main application entry point
```

## Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform and build tools
- **Firebase Realtime Database** - Real-time location data storage
- **expo-location** - Location tracking and background updates
- **expo-task-manager** - Background task management
- **crypto-js** - End-to-end encryption for location data

## Contributing

When contributing to this project:

1. Never commit the `.env` file
2. Always test with `npx expo start -c` to ensure environment variables load correctly
3. Update `.env.example` if you add new environment variables
4. Follow the existing code style and structure
5. Test all features before submitting a pull request

## License

[Add your license information here]
