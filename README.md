# @janiscommerce/app-check-updates

![janis-logo](brand-logo.png)

[![Coverage Status](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml/badge.svg)](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates.svg)](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates)

This package provides the functionality to detect when there is a new version of the app and notify the user

## appCheckUpdates

It is checked by two means, in the first instance it is consulted in the store of the corresponding operating system, for cases where you work with apks and do not have access to the store, an api provided bi Janis will be searched, and if you have new versions, will additionally return the new version number.

### Parameters

| Options     | Type              | Description                                  |
| ----------- | ----------------- | -------------------------------------------- |
| buildNumber | (required) String | The build number of your current app version |
| env         | (required) String | Janis environment where we are working       |
| app         | (required) String | Application we work on                       |

## updateFromJanis

This function is responsible for downloading the apk of the new version using an api provided by janis and **automatically installing it** on the device.

### Parameters

| Options          | Type              | Description                            |
| ---------------- | ----------------- | -------------------------------------- |
| newVersionNumber | (required) String | The new version number of the app      |
| env              | (required) String | Janis environment where we are working |
| app              | (required) String | Application we work on                 |

### Automatic Installation

Since version 3.3.0, `updateFromJanis` automatically triggers the APK installation after a successful download. The installation process:

1. Downloads the APK from Janis server
2. Automatically opens Android's installer
3. User only needs to tap "Install"
4. Android handles the app replacement automatically

**Note:** If the installation fails (e.g., due to permissions), the APK remains downloaded and the user can install it manually from their device's file manager.

## Installation

The minimum required versions for using the package are **react: 17.0.2** and **react-native: 0.67.5**.

```sh
npm install @janiscommerce/app-check-updates
```

### Peer Dependencies

This package requires the following peer dependencies to be installed manually in your application:

#### 1. [sp-react-native-in-app-updates](https://www.npmjs.com/package/sp-react-native-in-app-updates/v/1.2.0)

```sh
npm install sp-react-native-in-app-updates@1.2.0
```

#### 2. [react-native-fs](https://www.npmjs.com/package/react-native-fs)

```sh
npm install react-native-fs
```

### Android Configuration

This package includes a **native Android module** for automatic APK installation. The native module is automatically included when you install the package - no additional dependencies required!

To enable automatic APK installation, you need to configure the following in your Android app:

#### 1. Add Permission

Add the installation permission to your `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Required for automatic APK installation (Android 8.0+) -->
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <application>
        <!-- ... -->
    </application>
</manifest>
```

#### 2. Configure FileProvider

Add the FileProvider inside the `<application>` tag in `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <!-- Other configurations -->

    <!-- FileProvider for APK installation (Android 7.0+) -->
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
</application>
```

#### 3. Create File Paths Configuration

Create the file `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external_files" path="." />
    <external-path name="downloads" path="Download/" />
</paths>
```

#### 4. Rebuild Your App

After configuration, rebuild your Android app:

```sh
cd android && ./gradlew clean && cd ..
npm run android
```

**Important Notes:**

- This package includes its own native Android module - no external APK installer libraries needed!
- The FileProvider and permissions are **automatically merged** from this package's AndroidManifest.
- On Android 8.0 (API level 26) and higher, users must explicitly grant permission to install apps from unknown sources. The system will prompt the user automatically when the installation is triggered.
- The FileProvider configuration is required for Android 7.0+ to securely share the APK file with the system installer.

## Usage Examples

### Basic Update Check

```javascript
import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import {appCheckUpdates, updateFromJanis} from '@janiscommerce/app-check-updates';

const App = () => {
	useEffect(async () => {
		const {hasCheckedUpdate, shouldUpdateFromJanis, newVersionNumber} = await appCheckUpdates({
			buildNumber: '2350',
			env: 'janisqa',
			app: 'picking',
		});
		if (shouldUpdateFromJanis) {
			await updateFromJanis({
				env: 'janisqa',
				app: 'picking',
				newVersionNumber: newVersionNumber,
			});
		}
	}, []);

	return (
		<View>
			<Text>app check updates</Text>
		</View>
	);
};

ReactDOM.render(<App />, document.querySelector('#app'));
```

### Detecting App Updates and Showing "What's New"

```javascript
import React, {useEffect, useState} from 'react';
import {View, Text, Modal, Button} from 'react-native';
import {checkIfJustUpdated} from '@janiscommerce/app-check-updates';

const App = () => {
	const [showWhatsNew, setShowWhatsNew] = useState(false);

	useEffect(async () => {
		// Check if app was just updated
		const wasUpdated = await checkIfJustUpdated();

		if (wasUpdated) {
			// Show "What's New" dialog
			setShowWhatsNew(true);
			// The old APK file has been automatically cleaned up
		}
	}, []);

	return (
		<View>
			<Text>My App</Text>

			<Modal visible={showWhatsNew} onRequestClose={() => setShowWhatsNew(false)}>
				<View>
					<Text>What's New in this Version!</Text>
					<Text>• Feature 1</Text>
					<Text>• Feature 2</Text>
					<Button title="Close" onPress={() => setShowWhatsNew(false)} />
				</View>
			</Modal>
		</View>
	);
};

export default App;
```

### Complete Update Flow with Post-Install Detection

```javascript
import React, {useEffect, useState} from 'react';
import {View, Text, Alert} from 'react-native';
import {
	appCheckUpdates,
	updateFromJanis,
	checkIfJustUpdated,
} from '@janiscommerce/app-check-updates';

const App = () => {
	const [isChecking, setIsChecking] = useState(true);

	useEffect(async () => {
		// First, check if we just came back from an update
		const wasUpdated = await checkIfJustUpdated();

		if (wasUpdated) {
			Alert.alert(
				'Update Complete!',
				'Your app has been successfully updated to the latest version.',
				[{text: 'OK'}]
			);
		}

		// Then check for new updates
		const {shouldUpdateFromJanis, newVersionNumber} = await appCheckUpdates({
			buildNumber: '2350',
			env: 'janisqa',
			app: 'picking',
		});

		if (shouldUpdateFromJanis) {
			Alert.alert(
				'Update Available',
				`A new version (${newVersionNumber}) is available. Do you want to update now?`,
				[
					{text: 'Later', style: 'cancel'},
					{
						text: 'Update',
						onPress: async () => {
							await updateFromJanis({
								env: 'janisqa',
								app: 'picking',
								newVersionNumber,
							});
							// After this, the app will close and install
							// When it reopens, checkIfJustUpdated() will return true
						},
					},
				]
			);
		}

		setIsChecking(false);
	}, []);

	if (isChecking) {
		return <Text>Checking for updates...</Text>;
	}

	return (
		<View>
			<Text>My App</Text>
		</View>
	);
};

export default App;
```
