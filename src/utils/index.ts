import SpInAppUpdates, {IAUInstallStatus, StatusUpdateEvent} from 'sp-react-native-in-app-updates';
import updateFromJanis from '../modules/updateFromJanis';
/* istanbul ignore next */
/**
 * @name isDevEnv
 * @returns true if node env is development
 */
export const isDevEnv = () => {
	const {env} = process;
	const {NODE_ENV} = env;
	return NODE_ENV !== 'production';
};

/**
 * @name customVersionComparator
 * @description compares 2 versions of the app to determine if an update is necessary
 * @param {string} newAppV new version of the App
 * @param {string} appVersion current version of the App
 * @returns {number} returns 1 if the new version is greater, -1 if it is less, and 0 if they are equal
 */
export const customVersionComparator = (newAppV: string, appVersion: string): 0 | 1 | -1 => {
	if (newAppV > appVersion) {
		return 1;
	}

	if (newAppV < appVersion) {
		return -1;
	}
	return 0;
};

export const onStatusUpdate = async ({status}: StatusUpdateEvent, inAppUpdates: SpInAppUpdates) => {
	if (status === IAUInstallStatus.DOWNLOADED) {
		await inAppUpdates.installUpdate();
	}
};

interface IcheckNeedsUpdateInJanis {
	buildNumber: string;
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
}

export const defaultResponse = {
	hasCheckedUpdate: false,
	shouldUpdateFromJanis: false,
	updateFromJanis: null,
};

export const checkNeedsUpdateInJanis = async ({
	env,
	app,
	buildNumber,
}: IcheckNeedsUpdateInJanis) => {
	try {
		if (
			typeof buildNumber !== 'string' ||
			!buildNumber ||
			typeof env !== 'string' ||
			!env ||
			typeof app !== 'string' ||
			!app
		) {
			return defaultResponse;
		}

		const validUrl = `https://cdn.mobile.${env}.in/${app}/android/versions.json`;
		const response = await fetch(validUrl);
		const {currentBuildNumber, currentVersion} = await response.json();

		if (
			!currentBuildNumber ||
			typeof currentBuildNumber !== 'string' ||
			!currentVersion ||
			typeof currentVersion !== 'string'
		) {
			return defaultResponse;
		}

		const vCompRes = customVersionComparator(currentBuildNumber, buildNumber);

		return {
			hasCheckedUpdate: true,
			shouldUpdateFromJanis: vCompRes > 0,
			updateFromJanis: updateFromJanis({
				env,
				app,
				currentVersion,
				buildNumber: currentBuildNumber,
			}),
		};
	} catch (error) {
		if (isDevEnv()) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		return defaultResponse;
	}
};
