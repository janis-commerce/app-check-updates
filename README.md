# @janiscommerce/app-check-updates

![janis-logo](brand-logo.png)

[![Coverage Status](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml/badge.svg)](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates.svg)](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates)

This package provides the functionality to detect when there is a new version of the app and notify the user

## Installation

The minimum required versions for using the package are **react: 17.0.2** and **react-native: 0.67.5**.

```sh
npm install @janiscommerce/app-check-updates
```

This package uses [sp-react-native-in-app-updates](https://www.npmjs.com/package/sp-react-native-in-app-updates/v/1.2.0) as a peer dependency, you have to install it manually in your application.

```sh
npm install sp-react-native-in-app-updates@1.2.0
```

## Usage Example

```sh
import React from 'react';
import {View, Text} from 'react-native';
import appCheckUpdates from '@janiscommerce/app-check-updates';

const App = () => {
  appCheckUpdates({curVersion:"0.0.1"});
	return (
		<View>
			<Text>app check updates</Text>
		</View>
	);
};

ReactDOM.render(<App />, document.querySelector('#app'));
```

##### Notes:

- You can uses [react-native-device-info](https://github.com/react-native-device-info/react-native-device-info) to get curVersion

- In-app updates are available only to user accounts that own the app. So, make sure the account you’re using has downloaded your app from Google Play at least once before using the account to test in-app updates.

### Parameters

| Options    | Type              | Description                            |
| ---------- | ----------------- | -------------------------------------- |
| curVersion | (required) String | The semver of your current app version |
