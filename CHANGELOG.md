# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
