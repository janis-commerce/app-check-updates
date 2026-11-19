# @janiscommerce/app-check-updates

![janis-logo](brand-logo.png)

[![Coverage Status](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml/badge.svg)](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates.svg)](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates)

Warns the user when a new version of the app is available, warns before their version stops working and blocks it once it did.

## VersionCheckProvider and useVersionCheck

Wrap the logged-in part of the app with `VersionCheckProvider` and call `checkVersion()` on the safe points (Home and lists before starting a job). The provider downloads `versions.json` and shows, by itself, one of these, in this priority:

1. **Blocking screen**: the installed build is below a min version whose blocking date passed. It can't be closed and stays until the app restarts.
2. **Warning**: the installed build is below a min version whose warning started. Shows the blocking date.
3. **New version available**: the install channel offers a newer build.

The warning and the new version modal have **Update** and **Later**. Later hides the modal for its TTL, saved in storage so it survives restarts. While the warning applies, the new version modal is not shown: the warning already asks to update.

**Update** uses the channel the app was installed from: immediate Play Store update for Play installs, APK download from Janis for the rest. If Play does not offer the new build yet, the modal says so.

The current time comes from the server (`Date` + `Age` headers). Offline, the last valid `versions.json` is applied with the latest of the device clock and the last server time seen, so setting the clock back doesn't skip the block.

`env`, `app` and the build number are read from the installed package (`in.janis.<app>`, with `.beta` or `.qa` outside production), so the app doesn't pass them. Outside a Janis bundle `checkVersion()` does nothing.

> The build number is Android's `versionCode`, so it must match the build published in Janis. Keep APK splits per CPU architecture disabled: they rewrite `versionCode` as `build * 1000 + abi`.

### Props

| Prop               | Type              | Description                                                                                                           |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| texts              | (required) Object | Translated texts, see below                                                                                           |
| warningTtl         | (optional) Number | Minutes the warning stays hidden after Later. Default 120                                                             |
| updateAvailableTtl | (optional) Number | Minutes the new version modal stays hidden after Later. Default 120                                                   |
| debug              | (optional) Bool   | Also checks on development builds (`__DEV__`), to try the flows locally. Published builds always check. Default false |

`texts` keys: `warningTitle`, `blockingTitle`, `updateAvailableTitle`, `updateAvailableMessage`, `updateButton`, `laterButton`, `updateUnavailable` (Play Store doesn't offer the new version yet), `updateFailed`, and `warningMessage` / `blockingMessage`, which are functions that receive the blocking `Date` so the app formats it in the user's language.

### Usage

Mount the provider in the logged-in part of the app, where the user's language is already set, so the texts arrive translated. The modals open over the whole screen wherever the provider is placed.

```javascript
import {VersionCheckProvider, useVersionCheck} from '@janiscommerce/app-check-updates';

const LoggedApp = ({children}) => (
	<VersionCheckProvider
		texts={{
			warningTitle: t('appCommon.title.updateRequired'),
			warningMessage: (date) =>
				t('appCommon.message.versionStopsWorking', {date: formatDate(date)}),
			blockingTitle: t('appCommon.title.versionNotSupported'),
			blockingMessage: (date) =>
				t('appCommon.message.versionStoppedWorking', {date: formatDate(date)}),
			updateAvailableTitle: t('appCommon.title.newVersionAvailable'),
			updateAvailableMessage: t('appCommon.message.newVersionAvailable'),
			updateButton: t('appCommon.action.update'),
			laterButton: t('appCommon.action.later'),
			updateUnavailable: t('appCommon.message.updateNotAvailableYet'),
			updateFailed: t('appCommon.message.updateFailed'),
		}}>
		{children}
	</VersionCheckProvider>
);

// Call it only on safe points, so the block never interrupts a job in progress
const Home = () => {
	const {checkVersion} = useVersionCheck();

	useFocusEffect(
		useCallback(() => {
			checkVersion();
		}, [checkVersion])
	);
	// ...
};
```

### Migrating from 3.x

`appCheckUpdates` and `updateFromJanis` are no longer exported. Remove the app's update check (`askForUpdates`) and its `AskForUpdatesModal`: the provider checks and offers new versions itself.

## Installation

The package supports **react >= 17.0.2 < 20** and **react-native >= 0.71.5 < 0.82**.

```sh
npm install @janiscommerce/app-check-updates
```

### Peer Dependencies

This package requires the following peer dependencies to be installed in your application:

| Package                                                                                        | Version   |
| ---------------------------------------------------------------------------------------------- | --------- |
| [sp-react-native-in-app-updates](https://www.npmjs.com/package/sp-react-native-in-app-updates) | >= 1.2.0  |
| [react-native-fs](https://www.npmjs.com/package/react-native-fs)                               | >= 2.20.0 |
| [@janiscommerce/ui-native](https://www.npmjs.com/package/@janiscommerce/ui-native)             | >= 2.5.0  |
| [@janiscommerce/app-storage](https://www.npmjs.com/package/@janiscommerce/app-storage)         | >= 1.3.0  |
| [@janiscommerce/app-device-info](https://www.npmjs.com/package/@janiscommerce/app-device-info) | >= 1.4.0  |
| [@janiscommerce/app-crashlytics](https://www.npmjs.com/package/@janiscommerce/app-crashlytics) | >= 2.1.0  |

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
