# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.3.0-beta.3] - 2025-10-28

### Removed

- intent extra to replicate native alert to open new app

## [3.3.0-beta.2] - 2025-10-22

### Added

- New `checkIfJustUpdated()` function to detect when the app was just updated
- Post-installation detection system using SharedPreferences
- Automatic cleanup of old APK files after successful installation
- Support for "What's New" dialogs and post-update actions
- Comprehensive test coverage for update detection (100% coverage maintained)

### Changed

- `ApkInstallerModule` now saves update state before opening installer
- Enhanced native module with `checkUpdateCompleted()` method for detecting completed installations
- Updated TypeScript interfaces to include new `checkUpdateCompleted` method

### Technical

- Added SharedPreferences storage for tracking pending updates
- Implemented automatic APK file cleanup after installation
- Added Platform OS check to ensure Android-only functionality
- Updated documentation with usage examples for post-update detection
- Added 5 new unit tests for update detection scenarios

## [3.3.0-beta.1] - 2025-10-22

### Added

- Native Android module for automatic APK installation after download
- Automatic installation flow: download, uninstall old version, and install new APK transparently
- React Native autolinking configuration for native module integration

### Changed

- Removed dependency on external APK installer libraries (obsolete/deprecated packages)
- Updated Android library structure with custom native module implementation
- Improved error handling during APK installation process

### Technical

- Added `ApkInstallerModule.java` - Native Android module for APK installation
- Added `ApkInstallerPackage.java` - Package registration for React Native autolinking
- Added `react-native.config.js` - Autolinking configuration
- Updated `AndroidManifest.xml` - Added `REQUEST_INSTALL_PACKAGES` permission
- Updated README with FileProvider configuration instructions for consuming apps

## [3.2.0] - 2025-09-08

### Changed

- folder name to save apk

### Added

- Different folder for each env

## [3.1.0] - 2025-09-04

### Added

- Integrated crash reporting across update flows for improved error tracking.
  Bug Fixes

- Update process now clears APK directory before downloading new versions, reducing failed installs; improved error reporting.

- CI/publish workflows modernized (Node 18, deterministic installs, linting) with dynamic prerelease tagging and updated notifications.
- Android build adjusted for newer Gradle plugin compatibility; version bumped to 3.1.0-beta.4.

## [3.1.0-beta.4] - 2025-09-02

- updated crashlytics logs report and build gradle configuration

## [3.1.0-beta.3] - 2025-09-01

### Changed

- fixed npm publish workflows

## [3.1.0-beta.1] - 2025-09-01

### Changed

- added storage folder removal before app new version download.

## [3.0.1] - 2024-01-04

### Fixed

- Fixed react native required versions.

## [3.0.0] - 2023-12-19

### Breaking Changes

### Added

- The package now exports two functions
- `appCheckUpdates()` - Updates from playstore if it is available, if not, returns a boolean to indicating if it is necessary to download apk. It also returns the new version number.
- `updateFromJanis()` - Receives environment, app name, and new version number. It download the apk and save in downloads folder.

## [2.0.0] - 2023-12-14

### Breaking Changes

### Added

- The main function exported appCheckUpdates(), now returns an object instead of a boolean value.
- The object properties are the following:

* `hasCheckedUpdate`: `boolean` - Necessary to know if it was correctly checked if there is a new version.
* `shouldUpdateFromJanis`: `boolean` - Indicates if the update from playstore wasn't able, and there is a new apk available in janis service.
* `updateFromJanis`: `null` | `() => void` - The function to download the apk and save it in Downloads/ folder.

## [1.1.0] - 2023-12-13

### Added

- Added the possibilty to download the apk from janis, if the update from playstore fails.

### Fixed

## [1.0.4] - 2023-09-27

- Fixed npm publish github action

## [1.0.3] - 2023-09-27

- Fixed listener to update the app automatically after download

## [1.0.2] - 2023-09-05

### Fixed

- Fixed script to send slack message
- Fixed files dist in package json

## [1.0.1] - 2023-09-05

### Fixed

- Fixed command test:coverage in github actions

## [1.0.0] - 2023-09-05

### Added

- Added function to check if there is an update needed
- Added configuration for github actions
