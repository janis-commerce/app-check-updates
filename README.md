# @janiscommerce/app-check-updates

![janis-logo](brand-logo.png)

[![Coverage Status](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml/badge.svg)](https://github.com/janis-commerce/app-check-updates/actions/workflows/coverage-status.yml)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates.svg)](https://badge.fury.io/js/%40janiscommerce%2Fapp-check-updates)

This package provides the functionality to detect when there is a new version of the app and notify the user

It is checked by two means, in the first instance it is consulted in the store of the corresponding operating system, for cases where you work with apks and do not have access to the store, an api provided bi Janis will be searched, and if you have new versions, a funtion will be provided to download it.

## Installation

The minimum required versions for using the package are **react: 17.0.2** and **react-native: 0.67.5**.

```sh
npm install @janiscommerce/app-check-updates
```

This package uses peer dependencies that you have to install it manually in your application.

[sp-react-native-in-app-updates](https://www.npmjs.com/package/sp-react-native-in-app-updates/v/1.2.0).

```sh
npm install sp-react-native-in-app-updates@1.2.0
```

[react-native-fs](https://www.npmjs.com/package/react-native-fs).

```sh
npm i react-native-fs
```

## Usage Example

```sh
import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import appCheckUpdates from '@janiscommerce/app-check-updates';

const App = () => {
	useEffect(async () => {
  		const {hasCheckedUpdate, shouldUpdateFromJanis, updateFromJanis} = await appCheckUpdates({
			buildNumber: "2350",
			env: "janisqa",
			app: 'picking',
		});
	}, []);

	return (
		<View>
			<Text>app check updates</Text>
		</View>
	);
};

ReactDOM.render(<App />, document.querySelector('#app'));
```

##### Notes:

- In-app updates are available only to user accounts that own the app. So, make sure the account you’re using has downloaded your app from Google Play at least once before using the account to test in-app updates.

### Parameters

| Options    | Type              | Description                            |
| ---------- | ----------------- | -------------------------------------- |
| buildNumber | (required) String | The build number of your current app version |
| env | (required) String | Janis environment where we are working |
| app | (required) String | Application we work on |
