import {Platform} from 'react-native';
import SpInAppUpdates, {IAUUpdateKind, StartUpdateOptions} from 'sp-react-native-in-app-updates';
import {isDevEnv, customVersionComparator, onStatusUpdate, isString} from '../../utils';
import Crashlytics from '../../utils/crashlytics';

interface IappCheckUpdates {
	buildNumber: string;
	isDebug?: boolean;
}

const defaultResponse = {hasCheckedUpdate: false, needCheckInJanis: false};

/**
 * @name updateFromStore
 * @description check and download new versions in the store
 * @param {boolean} isDebug is debug mode
 * @param {string} buildNumber current buildNumber of the app
 * @returns {object} { hasCheckedUpdate: boolean, needCheckInJanis: boolean}
 */
const updateFromStore = async ({buildNumber, isDebug = false}: IappCheckUpdates) => {
	const isDevEnvironment = isDevEnv();
	try {
		Crashlytics.log('updateFromStore:', {buildNumber});
		if (!isString(buildNumber) || !buildNumber) {
			throw new Error('the parameters are incorrect');
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
	} catch (error: unknown) {
		if (isDevEnvironment) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		Crashlytics.recordError(error, 'error updating app by updateFromStore');
		if (error instanceof Error && error.message.includes('checkNeedsUpdate')) {
			return {...defaultResponse, needCheckInJanis: true};
		}
		return defaultResponse;
	}
};

export default updateFromStore;
