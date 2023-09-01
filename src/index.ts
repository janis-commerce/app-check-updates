import {Platform} from 'react-native';
import SpInAppUpdates, {IAUUpdateKind, StartUpdateOptions} from 'sp-react-native-in-app-updates';
import {isDevEnv} from './utils';

interface IappCheckUpdates {
	curVersion: string;
	isDebug?: boolean;
}

const appCheckUpdates = async ({curVersion, isDebug = false}: IappCheckUpdates) => {
	const isNotProductionEnv = isDevEnv();
	try {
		if (typeof curVersion !== 'string' || !curVersion) {
			return null;
		}
		const inAppUpdates = await new SpInAppUpdates(isDebug);

		const storeResponse = await inAppUpdates.checkNeedsUpdate({curVersion});

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
		if (isNotProductionEnv) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		return false;
	}
};

export default appCheckUpdates;
