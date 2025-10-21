# Apple App Store Deployment Guide

This guide will walk you through deploying your RK TaskBook mobile app to the Apple App Store.

## Prerequisites Checklist

- [ ] macOS computer (required for iOS development)
- [ ] Xcode installed
- [ ] Node.js and npm installed
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Apple Developer Program membership ($99/year)
- [ ] Apple ID

## Step 1: Apple Developer Program Enrollment

1. Visit [Apple Developer Program](https://developer.apple.com/programs/)
2. Click "Enroll" and sign in with your Apple ID
3. Follow the enrollment steps
4. Pay the $99 annual fee
5. Wait for approval (usually takes 24-48 hours)

## Step 2: Create App ID in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Click "Certificates, Identifiers & Profiles"
3. Select "Identifiers" from the sidebar
4. Click the "+" button to create a new identifier
5. Select "App IDs" and click "Continue"
6. Select "App" and click "Continue"
7. Fill in the details:
   - **Description**: RK TaskBook
   - **Bundle ID**: `com.alnubras.rktaskbook` (or your custom bundle ID)
8. Select any capabilities your app needs
9. Click "Continue" then "Register"

## Step 3: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click "My Apps"
3. Click the "+" button and select "New App"
4. Fill in the required information:
   - **Platforms**: iOS
   - **Name**: RK TaskBook (or your app name)
   - **Primary Language**: English
   - **Bundle ID**: Select the one you created (com.alnubras.rktaskbook)
   - **SKU**: rk-taskbook-001 (unique identifier)
   - **User Access**: Full Access
5. Click "Create"

## Step 4: Prepare Your App Metadata

Before building, prepare the following:

### App Information
- App name
- Subtitle (optional)
- App description (up to 4000 characters)
- Keywords (comma-separated, max 100 characters)
- Support URL
- Marketing URL (optional)
- Privacy Policy URL (required if you collect data)

### Screenshots
You need screenshots for different device sizes:
- iPhone 6.7" (1290 x 2796 pixels) - at least 1
- iPhone 6.5" (1242 x 2688 pixels) - at least 1
- iPhone 5.5" (1242 x 2208 pixels) - at least 1
- iPad Pro (2048 x 2732 pixels) - at least 1

### App Icon
- 1024 x 1024 pixels
- PNG format
- No transparency
- No rounded corners

### Privacy Information
- Privacy policy URL
- Data collection practices

## Step 5: Configure Your Project

### Install Dependencies

```bash
cd mobile
npm install
```

### Login to Expo

```bash
expo login
```

### Initialize EAS

```bash
eas build:configure
```

## Step 6: Build Your App

### Create Production Build

```bash
eas build --platform ios --profile production
```

This will:
1. Upload your code to Expo's build servers
2. Compile your app for iOS
3. Sign it with your Apple Developer credentials
4. Generate an IPA file

**Note**: The first build will prompt you to:
- Authenticate with Apple
- Generate or select a distribution certificate
- Generate or select a provisioning profile

The build process typically takes 15-30 minutes.

## Step 7: Submit to App Store

Once the build completes, submit to App Store:

```bash
eas submit --platform ios --latest
```

This will:
1. Download your latest build
2. Upload it to App Store Connect
3. Make it available for review submission

## Step 8: Complete App Store Connect Listing

1. Go back to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app
3. Click on the version number (e.g., "1.0.0")
4. Complete all required sections:

### App Information
- Name
- Subtitle
- Category (Productivity)
- Content Rights

### Pricing and Availability
- Select countries
- Set price (Free or Paid)

### App Privacy
- Click "Get Started"
- Answer questions about data collection
- Link to your privacy policy

### General App Information
- Upload app icon
- Select age rating
- Enter copyright information

### Screenshots and Previews
- Upload screenshots for required device sizes
- Optionally add app preview videos

### Description
- Write a compelling app description
- Add what's new in this version

### App Review Information
- Contact information for review team
- Optional: Demo account credentials
- Notes for reviewer

### Version Release
- Choose release option:
  - Manually release
  - Automatically release after approval

## Step 9: Submit for Review

1. Review all sections to ensure everything is complete
2. Click "Add for Review" or "Submit for Review"
3. Confirm submission

## Step 10: Wait for Review

- **Initial review**: Usually 1-3 days
- **Status updates**: Check App Store Connect for status
- **Possible outcomes**:
  - ✅ **Approved**: App goes live (or waits for manual release)
  - ❌ **Rejected**: Review feedback provided, fix issues and resubmit

## Common Rejection Reasons

1. **Incomplete information**: Missing metadata or screenshots
2. **Crashes**: App crashes during review
3. **Missing features**: Promised features not working
4. **Privacy issues**: Missing privacy policy or data collection disclosure
5. **Guideline violations**: Not following App Store Review Guidelines

## Post-Approval

Once approved:
1. App will be live on the App Store
2. Users can search and download it
3. Monitor reviews and ratings
4. Respond to user feedback

## Updating Your App

To release updates:

1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.1.0",
       "ios": {
         "buildNumber": "2"
       }
     }
   }
   ```

2. Build new version:
   ```bash
   eas build --platform ios --profile production
   ```

3. Submit update:
   ```bash
   eas submit --platform ios --latest
   ```

4. Complete App Store Connect with "What's New" information
5. Submit for review

## Troubleshooting

### Build Fails
- Check your Apple Developer account status
- Verify bundle identifier matches
- Ensure certificates are valid

### Submission Fails
- Check App Store Connect for error messages
- Verify all required metadata is complete
- Ensure build is production-ready

### App Rejected
- Read review feedback carefully
- Make necessary changes
- Respond to reviewer if needed
- Resubmit

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Check submission status
eas submit:list

# Configure project
eas build:configure

# Update credentials
eas credentials
```

## Resources

- [Apple Developer Program](https://developer.apple.com/programs/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## Support

For help:
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/
- Apple Developer Forums: https://developer.apple.com/forums/

## Estimated Timeline

- **Setup**: 1-2 hours
- **Build preparation**: 2-4 hours
- **First build**: 15-30 minutes
- **App Store listing**: 1-2 hours
- **Review process**: 1-3 days
- **Total time to launch**: 3-7 days

Good luck with your App Store submission!
