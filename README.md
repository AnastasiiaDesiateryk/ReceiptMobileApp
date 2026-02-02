# Receipt Vault - React Native Mobile App

Receipt Vault is a secure, offline-capable receipt management mobile application built with React Native. Capture, edit, organize, view, and share your receipts with ease. The app supports offline drafts, automatic OCR extraction, and cloud syncing.

---

## Features

- User authentication via email and password (JWT-secured)
- Capture receipts using camera (react-native-vision-camera)
- Select images from gallery (react-native-image-picker)
- Receipt editing with OCR-extracted data polling
- Receipt viewing with cached images and temporary signed URLs
- Share receipts via image or secure temporary links (react-native-share)
- Export receipts to PDF (react-native-pdf-lib)
- Organize receipts into Private and Work folders
- Network status detection and automatic draft sync (NetInfo)
- Minimal, clean light-themed UI

---

## Prerequisites


- npm or yarn
- React Native CLI
- Android Studio for Android builds or Xcode for iOS builds
- Java JDK 11 or higher
- Android SDK with platform 33 or higher
- CocoaPods (for iOS)

---

## Installation

1. Clone the repository:

    git clone https://github.com/yourusername/receipt-vault.git
    cd receipt-vault

2. Install dependencies:

    npm install
    # or
    yarn install

3. Install iOS pods (macOS only):

    cd ios && pod install && cd ..

4. Copy `.env.example` to `.env` and fill in your backend API settings:

    cp .env.example .env

---

## Configuration

Edit `.env` file to add your backend API base URL and keys:

- `API_BASE_URL`: Your backend API endpoint.
- `API_TIMEOUT`: Request timeout in milliseconds.
- `AUTH_TOKEN_KEY`: Key name for encrypted storage of auth token.
- `REFRESH_TOKEN_KEY`: Key name for encrypted storage of refresh token.
- `PDF_EXPORT_PATH`: Directory for PDF exports.

---

## Running the App

### Android

1. Start Metro bundler:

       npm start

2. Run on Android device or emulator:

       npm run android

### iOS (macOS only)

1. Start Metro bundler:

       npm start

2. Run on iOS simulator or device:

       npm run ios

---

## Usage

- **Login/Signup:** Use your email and password to authenticate.
- **Receipts List:** Browse receipts by Private or Work folders.
- **Capture Receipt:** Press the "+" button to open the camera, capture or import a receipt.
- **Preview & Edit:** Confirm cropped image and edit receipt details, tags, folder.
- **Offline Drafts:** Save receipts offline; they sync automatically when online.
- **View & Share:** Open receipts to view details, share images or secure links, export PDF.
- **Delete:** Remove receipts with optimistic UI and error rollback.
- **Profile:** View your email and logout securely.

---

## Offline Support

Receipt Vault supports offline capture and editing. Draft receipts are saved locally on your device with their images and metadata.

---

## Testing

Run unit and integration tests with:

    npm test

Tests cover authentication context, receipt context, API integration mocks, and core components.

---

## Project Structure

- `App.js`: App entry point with auth and receipt contexts and navigation.
- `src/api`: API clients and endpoints.
- `src/context`: React contexts for auth and receipts.
- `src/navigation`: Stack and tab navigators.
- `src/components`: UI screens and reusable components.
- `src/services`: Offline storage and sync utilities.
- `src/utils`: Helper functions for date, currency, tags, and API headers.
- `src/hooks`: Custom React hooks.
- `src/typings`: TypeScript interfaces.
- `tests`: Unit and integration tests.

---

## Troubleshooting

- **Camera permission denied:** Enable camera permissions in device settings.
- **Network issues:** Offline drafts will be saved locally and uploaded once online.
- **Build errors:** Ensure all native dependencies are linked and pods installed.
- **Token issues:** Clear app data or logout if authentication errors occur.

For further support, please contact [support@receiptvault.example.com](mailto:support@receiptvault.example.com).

---

Thank you for using Receipt Vault!


This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
