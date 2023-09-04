import {Platform} from 'react-native';
import SpInAppUpdates, {IAUUpdateKind, StartUpdateOptions} from 'sp-react-native-in-app-updates';
import {isDevEnv, customVersionComparator} from './utils';

interface IappCheckUpdates {
	buildNumber: string;
	isDebug?: boolean;
}

const appCheckUpdates = async ({buildNumber, isDebug = false}: IappCheckUpdates) => {
	const isDevEnvironment = isDevEnv();
	try {
		if (typeof buildNumber !== 'string' || !buildNumber) {
			return null;
		}
		const inAppUpdates = await new SpInAppUpdates(isDebug);

		const storeResponse = await inAppUpdates.checkNeedsUpdate({
			curVersion: buildNumber,
			customVersionComparator,
		});

		if (storeResponse?.shouldUpdate) {
			let updateOptions: StartUpdateOptions = {};
			if (Platform.OS === 'android') {
				// android only, on iOS the user will be promped to go to your app store page
				updateOptions = {
					updateType: IAUUpdateKind.FLEXIBLE,
				};
			}
			await inAppUpdates.startUpdate(updateOptions);
		}
		return true;
	} catch (error) {
		if (isDevEnvironment) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		return false;
	}
};

export default appCheckUpdates;
