import SpInAppUpdates, {IAUInstallStatus, IAUUpdateKind} from 'sp-react-native-in-app-updates';
import updateFromJanis from './updateFromJanis';
import getInstallSource from './getInstallSource';
import Crashlytics from '../crashlytics';
import type {JanisAppInfo} from '../appInfo';

export type UpdateResult = 'started' | 'unavailable' | 'failed';

export type UpdateMode = 'immediate' | 'flexible';

interface IupdateApp extends JanisAppInfo {
	newVersionNumber: string;
	mode: UpdateMode;
}

const updateFromPlayStore = async (
	buildNumber: string,
	mode: UpdateMode
): Promise<UpdateResult> => {
	const inAppUpdates = new SpInAppUpdates(false);
	const {shouldUpdate} = await inAppUpdates.checkNeedsUpdate({curVersion: buildNumber});

	if (!shouldUpdate) {
		return 'unavailable';
	}

	if (mode === 'immediate') {
		await inAppUpdates.startUpdate({updateType: IAUUpdateKind.IMMEDIATE});
		return 'started';
	}

	// Same as the previous flexible flow: installs (and restarts the app) as soon as the download ends
	inAppUpdates.addStatusUpdateListener(({status}) => {
		if (status === IAUInstallStatus.DOWNLOADED) {
			inAppUpdates.installUpdate();
		}
	});
	await inAppUpdates.startUpdate({updateType: IAUUpdateKind.FLEXIBLE});
	return 'started';
};

/**
 * @name updateApp
 * @description updates the app through the channel it was installed from: Play Store update or Janis download
 * @param {string} env environment of janis
 * @param {string} app App name
 * @param {string} buildNumber current build number of the App
 * @param {string} newVersionNumber version to download from Janis, as `${currentVersion}.${currentBuildNumber}`
 * @param {string} mode Play Store update mode: 'immediate' blocks until installed, 'flexible' downloads in the background
 * @returns {string} 'started' | 'unavailable' (Play Store does not offer the update yet) | 'failed'
 */
const updateApp = async ({
	env,
	app,
	buildNumber,
	newVersionNumber,
	mode,
}: IupdateApp): Promise<UpdateResult> => {
	try {
		Crashlytics.log('updateApp:', {env, app, buildNumber, newVersionNumber, mode});
		if ((await getInstallSource()) === 'playStore') {
			return await updateFromPlayStore(buildNumber, mode);
		}

		const isDownloaded = await updateFromJanis({env, app, newVersionNumber});
		return isDownloaded ? 'started' : 'failed';
	} catch (error: unknown) {
		Crashlytics.recordError(error, 'error updating app to min version');
		return 'failed';
	}
};

export default updateApp;
