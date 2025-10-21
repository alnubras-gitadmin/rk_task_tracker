# RK TaskBook Mobile App

An AI-powered project management mobile application built with React Native and Expo.

## Features

- User authentication with Supabase
- Project and task management
- AI-powered task generation using OpenAI
- N8N webhook integrations
- Cross-platform support (iOS and Android)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Xcode (for iOS development on macOS)
- Android Studio (for Android development)

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://n8n.rktaskbook.alnubras.co/webhook/
```

### 3. Update app.json

Edit `app.json` and update the following fields:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1
    },
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      "EXPO_PUBLIC_OPENAI_API_KEY": process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      "EXPO_PUBLIC_N8N_WEBHOOK_URL": process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL
    }
  }
}
```

## Development

### Run on iOS Simulator

```bash
npm run ios
```

### Run on Android Emulator

```bash
npm run android
```

### Run on Physical Device

```bash
npm start
```

Then scan the QR code with the Expo Go app.

## Deploying to Apple App Store

### 1. Create an Expo Account

```bash
expo login
```

### 2. Configure EAS

Initialize EAS in your project:

```bash
eas build:configure
```

### 3. Update EAS Configuration

Edit `eas.json` and update the submit configuration:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### 4. Join Apple Developer Program

- Visit [Apple Developer Program](https://developer.apple.com/programs/)
- Enroll in the program ($99/year)
- Complete the enrollment process

### 5. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click "My Apps"
3. Click "+" to create a new app
4. Fill in the required information:
   - Platform: iOS
   - Name: Your app name
   - Primary Language: English
   - Bundle ID: Must match your app.json bundleIdentifier
   - SKU: Unique identifier (e.g., your-app-sku)

### 6. Build for iOS

Build your app for iOS:

```bash
eas build --platform ios
```

Choose build type:
- **development**: For testing on your devices
- **preview**: For internal testing (TestFlight)
- **production**: For App Store submission

### 7. Submit to App Store

Once the build completes:

```bash
eas submit --platform ios
```

Follow the prompts to submit your app to App Store Connect.

### 8. Configure App Store Listing

In App Store Connect:

1. Add app screenshots (required sizes for iPhone and iPad)
2. Write app description
3. Add app icon (1024x1024px)
4. Set pricing and availability
5. Fill in all required metadata
6. Submit for review

## Building for Android (Google Play Store)

### 1. Create Google Play Developer Account

- Visit [Google Play Console](https://play.google.com/console/)
- Pay one-time registration fee ($25)
- Complete the account setup

### 2. Build for Android

```bash
eas build --platform android
```

### 3. Submit to Google Play

```bash
eas submit --platform android
```

## Common Issues

### iOS Build Failures

- Ensure your Apple Developer account is active
- Check that your bundleIdentifier is unique
- Verify your Apple Team ID is correct

### Android Build Failures

- Verify your package name is unique
- Check that your keystore is properly configured

### Environment Variables Not Loading

- Make sure variables are prefixed with `EXPO_PUBLIC_`
- Restart the Expo dev server after changing .env

## App Store Review Guidelines

Before submitting, ensure your app:

- Has a clear, descriptive name
- Includes high-quality screenshots
- Has a detailed description
- Provides a privacy policy (if collecting user data)
- Complies with Apple's App Store Review Guidelines
- Has proper error handling
- Works offline (if applicable)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Apple App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)

## Support

For issues or questions:
- Check the [Expo Forums](https://forums.expo.dev/)
- Review [Supabase Documentation](https://supabase.com/docs)
- Contact support at support@rktaskbook.com
