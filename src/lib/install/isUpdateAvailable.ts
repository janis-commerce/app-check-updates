import SpInAppUpdates from 'sp-react-native-in-app-updates';
import getInstallSource from './getInstallSource';
import Crashlytics from '../crashlytics';

interface IisUpdateAvailable {
	buildNumber: string;
	currentBuildNumber: string;
}

/**
 * @name isUpdateAvailable
 * @description whether the channel the app was installed from offers a newer build
 * @param {string} buildNumber current build number of the App
 * @param {string} currentBuildNumber latest build published in Janis
 * @returns {boolean}
 */
const isUpdateAvailable = async ({buildNumber, currentBuildNumber}: IisUpdateAvailable) => {
	try {
		// Play Store can lag behind the build published in Janis, so only Play knows what it offers
		if ((await getInstallSource()) === 'playStore') {
			const inAppUpdates = new SpInAppUpdates(false);
			const {shouldUpdate} = await inAppUpdates.checkNeedsUpdate({curVersion: buildNumber});
			return shouldUpdate;
		}

		// Compared as numbers: as strings, '999' would rank above '1000'
		return Number(currentBuildNumber) > Number(buildNumber);
	} catch (error: unknown) {
		Crashlytics.recordError(error, 'error checking if an update is available');
		return false;
	}
};

export default isUpdateAvailable;
