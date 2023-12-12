import {Platform} from 'react-native';
import SpInAppUpdates, {IAUUpdateKind, StartUpdateOptions} from 'sp-react-native-in-app-updates';
import {isDevEnv, customVersionComparator, onStatusUpdate} from '../../utils';

interface IappCheckUpdates {
	buildNumber: string;
	isDebug?: boolean;
}

const defaultResponse = {hasCheckedUpdate: false, needCheckInJanis: false};

const updateFromStore = async ({buildNumber, isDebug = false}: IappCheckUpdates) => {
	const isDevEnvironment = isDevEnv();
	try {
		if (typeof buildNumber !== 'string' || !buildNumber) {
			return defaultResponse;
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
			/* istanbul ignore next */
			await inAppUpdates.addStatusUpdateListener((status) => onStatusUpdate(status, inAppUpdates));
			await inAppUpdates.startUpdate(updateOptions);
		}
		return {
			...defaultResponse,
			hasCheckedUpdate: true,
		};
	} catch (error) {
		if (isDevEnvironment) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		if (error instanceof Error && error.message.includes('checkNeedsUpdate')) {
			return {...defaultResponse, needCheckInJanis: true};
		}
		return defaultResponse;
	}
};

export default updateFromStore;
