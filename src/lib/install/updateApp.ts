import SpInAppUpdates, {IAUUpdateKind} from 'sp-react-native-in-app-updates';
import updateFromJanis from './updateFromJanis';
import getInstallSource from './getInstallSource';
import Crashlytics from '../crashlytics';

export type UpdateResult = 'started' | 'unavailable' | 'failed';

interface IupdateApp {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
	buildNumber: string;
	newVersionNumber: string;
}

const updateFromPlayStore = async (buildNumber: string): Promise<UpdateResult> => {
	const inAppUpdates = new SpInAppUpdates(false);
	const {shouldUpdate} = await inAppUpdates.checkNeedsUpdate({curVersion: buildNumber});

	if (!shouldUpdate) {
		return 'unavailable';
	}

	await inAppUpdates.startUpdate({updateType: IAUUpdateKind.IMMEDIATE});
	return 'started';
};

/**
 * @name updateApp
 * @description updates the app through the channel it was installed from: Play Store immediate update or Janis download
 * @param {string} env environment of janis
 * @param {string} app App name
 * @param {string} buildNumber current build number of the App
 * @param {string} newVersionNumber version to download from Janis, as `${currentVersion}.${currentBuildNumber}`
 * @returns {string} 'started' | 'unavailable' (Play Store does not offer the update yet) | 'failed'
 */
const updateApp = async ({
	env,
	app,
	buildNumber,
	newVersionNumber,
}: IupdateApp): Promise<UpdateResult> => {
	try {
		Crashlytics.log('updateApp:', {env, app, buildNumber, newVersionNumber});
		if ((await getInstallSource()) === 'playStore') {
			return await updateFromPlayStore(buildNumber);
		}

		const isDownloaded = await updateFromJanis({env, app, newVersionNumber});
		return isDownloaded ? 'started' : 'failed';
	} catch (error: unknown) {
		Crashlytics.recordError(error, 'error updating app to min version');
		return 'failed';
	}
};

export default updateApp;
