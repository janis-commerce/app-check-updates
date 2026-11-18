# @janiscommerce/app-check-updates

![janis-logo](brand-logo.png)

[![Coverage Status](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml/badge.svg)](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates.svg)](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates)

This package provides the functionality to detect when there is a new version of the app and notify the user

## appCheckUpdates

It is checked by two means, in the first instance it is consulted in the store of the corresponding operating system, for cases where you work with apks and do not have access to the store, an api provided by Janis will be searched, and if you have new versions, will additionally return the new version number.

### Parameters

| Options     | Type              | Description                                  |
| ----------- | ----------------- | -------------------------------------------- |
| buildNumber | (required) String | The build number of your current app version |
| env         | (required) String | Janis environment where we are working       |
| app         | (required) String | Application we work on                       |
| isDebug     | (optional) Bool   | Enables the store library debug mode         |

## updateFromJanis

This function is responsible for downloading the apk of the new version using an api provided by janis and **automatically installing it** on the device.

### Parameters

| Options                  | Type                | Description                            |
| ------------------------ | ------------------- | -------------------------------------- |
| newVersionNumber         | (required) String   | The new version number of the app      |
| env                      | (required) String   | Janis environment where we are working |
| app                      | (required) String   | Application we work on                 |
| DownloadProgressCallback | (optional) Function | Receives the download progress         |

### Automatic Installation

Since version 3.3.0, `updateFromJanis` automatically triggers the APK installation after a successful download. The installation process:

1. Downloads the APK from Janis server
2. Automatically opens Android's installer
3. User only needs to tap "Install"
4. Android handles the app replacement automatically

**Note:** If the installation fails (e.g., due to permissions), the APK remains downloaded and the user can install it manually from their device's file manager.

## VersionCheckProvider and useVersionCheck

Warns the user when their build is about to stop working and blocks the app once it did, based on the `minVersions` published in `versions.json`. The provider shows the warning modal and the blocking screen by itself; the app only decides **when** to check.

- The warning shows the blocking date, can be closed and appears once per session.
- The blocking screen can't be closed. Its "Update" button uses the install channel: immediate Play Store update, or APK download from Janis.
- Time comes from the server (`Date` + `Age` headers). Offline, the last saved `versions.json` is applied with the latest of the device clock and the last server time seen, so setting the clock back doesn't skip the block.

### Parameters

| Options     | Type              | Description                                  |
| ----------- | ----------------- | -------------------------------------------- |
| buildNumber | (required) String | The build number of your current app version |
| env         | (required) String | Janis environment where we are working       |
| app         | (required) String | Application we work on                       |
| texts       | (required) Object | Translated texts, see below                  |

`texts` keys: `warningTitle`, `warningButton`, `blockingTitle`, `updateButton`, `updateUnavailable` (Play Store doesn't offer the new version yet), `updateFailed`, and `warningMessage` / `blockingMessage`, which are functions that receive the blocking `Date` so the app formats it in the user's language.

### Usage

Mount the provider in the logged-in part of the app, where the user's language is already set, so the texts arrive translated. The modals open over the whole screen wherever the provider is placed.

```javascript
import {VersionCheckProvider, useVersionCheck} from '@janiscommerce/app-check-updates';

const LoggedApp = ({children}) => (
	<VersionCheckProvider
		env="janisqa"
		app="picking"
		buildNumber="2350"
		texts={{
			warningTitle: t('appCommon.title.updateRequired'),
			warningMessage: (date) =>
				t('appCommon.message.versionStopsWorking', {date: formatDate(date)}),
			warningButton: t('appCommon.action.understood'),
			blockingTitle: t('appCommon.title.versionNotSupported'),
			blockingMessage: (date) =>
				t('appCommon.message.versionStoppedWorking', {date: formatDate(date)}),
			updateButton: t('appCommon.action.update'),
			updateUnavailable: t('appCommon.message.updateNotAvailableYet'),
			updateFailed: t('appCommon.message.updateFailed'),
		}}>
		{children}
	</VersionCheckProvider>
);

// Call it only on safe points (Home and lists before starting a job), so the block never interrupts a job in progress
const Home = () => {
	const {checkVersion} = useVersionCheck();

	useEffect(() => {
		checkVersion();
	}, []);
	// ...
};
```

## Installation

The package supports **react >= 17.0.2 < 20** and **react-native >= 0.71.5 < 0.82**.

```sh
npm install @janiscommerce/app-check-updates
```

### Peer Dependencies

This package requires the following peer dependencies to be installed manually in your application:

#### 1. [sp-react-native-in-app-updates](https://www.npmjs.com/package/sp-react-native-in-app-updates) (>= 1.2.0)

```sh
npm install sp-react-native-in-app-updates
```

#### 2. [react-native-fs](https://www.npmjs.com/package/react-native-fs)

```sh
npm install react-native-fs
```

#### 3. [@janiscommerce/ui-native](https://www.npmjs.com/package/@janiscommerce/ui-native) (>= 2.5.0)

```sh
npm install @janiscommerce/ui-native
```

#### 4. [@janiscommerce/app-storage](https://www.npmjs.com/package/@janiscommerce/app-storage) (>= 1.2.0)

```sh
npm install @janiscommerce/app-storage
```

### Android Configuration

This package includes a **native Android module** for automatic APK installation. The native module is automatically included when you install the package - no additional dependencies required!

To enable automatic APK installation, you need to configure the following in your Android app:

#### 1. Add Permission (Required)

⚠️ **Important:** Your application **must** declare the installation permission in its `android/app/src/main/AndroidManifest.xml`. This permission is **not** included in the package to allow apps to configure it conditionally (e.g., using product flavors):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Required for automatic APK installation (Android 8.0+) -->
    <!-- This MUST be declared in your app's manifest -->
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <application>
        <!-- ... -->
    </application>
</manifest>
```

**Note:** If you're using Android product flavors, you can conditionally include this permission per flavor in your flavor-specific manifest files.

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
    <external-path name="downloads" path="Download" />
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
- The `REQUEST_INSTALL_PACKAGES` permission **must be declared in your app's manifest** - it is not automatically included by this package. This allows you to configure it conditionally per build flavor.
- The `InstallReceiver` component **is automatically merged** from this package's AndroidManifest to handle post-installation cleanup.
- On Android 8.0 (API level 26) and higher, users must explicitly grant permission to install apps from unknown sources. The system will prompt the user automatically when the installation is triggered.
- The FileProvider configuration is required for Android 7.0+ to securely share the APK file with the system installer.

## Usage Examples

### Basic Update Check

```javascript
import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import {appCheckUpdates, updateFromJanis} from '@janiscommerce/app-check-updates';

const App = () => {
	useEffect(() => {
		const checkUpdates = async () => {
			const {shouldUpdateFromJanis, newVersionNumber} = await appCheckUpdates({
				buildNumber: '2350',
				env: 'janisqa',
				app: 'picking',
			});
			if (shouldUpdateFromJanis) {
				await updateFromJanis({
					env: 'janisqa',
					app: 'picking',
					newVersionNumber,
				});
			}
		};
		checkUpdates();
	}, []);

	return (
		<View>
			<Text>app check updates</Text>
		</View>
	);
};

export default App;
```

### Asking the User Before Updating

```javascript
import React, {useEffect, useState} from 'react';
import {View, Text, Alert} from 'react-native';
import {appCheckUpdates, updateFromJanis} from '@janiscommerce/app-check-updates';

const App = () => {
	const [isChecking, setIsChecking] = useState(true);

	const checkUpdates = async () => {
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
							// After the download, Android's installer opens and replaces the app
						},
					},
				]
			);
		}

		setIsChecking(false);
	};

	useEffect(() => {
		checkUpdates();
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
