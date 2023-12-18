import SpInAppUpdates, {IAUInstallStatus, StatusUpdateEvent} from 'sp-react-native-in-app-updates';
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
 * @function isString
 * @param {any} str - Value to validate.
 * @description If the type of the argument is a string, return true, otherwise return false.
 * @returns {bool}
 */

export const isString = (str: any) => typeof str === 'string';

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

/**
 * @name onStatusUpdate
 * @description listen to the download status from the store and when it is ready, start the update
 * @param {object} StatusUpdateEvent download status
 * @param {object} inAppUpdates update package instance
 * @returns {void}
 */
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
};

/**
 * @name checkNeedsUpdateInJanis
 * @description check if new updates are available on janis
 * @param {string} env environment of janis
 * @param {string} app App name
 * @param {string} buildNumber current version of the App
 * @returns {object} { hasCheckedUpdate: boolean, shouldUpdateFromJanis: boolean, updateFromJanis: func | null}
 */
export const checkNeedsUpdateInJanis = async ({
	env,
	app,
	buildNumber,
}: IcheckNeedsUpdateInJanis) => {
	try {
		if (
			!isString(buildNumber) ||
			!buildNumber ||
			!isString(env) ||
			!env ||
			!isString(app) ||
			!app
		) {
			throw new Error('the parameters are incorrect');
		}

		const validUrl = `https://cdn.mobile.${env}.in/${app}/android/versions.json`;
		const response = await fetch(validUrl);
		const {currentBuildNumber, currentVersion} = await response.json();

		if (
			!currentBuildNumber ||
			!isString(currentBuildNumber) ||
			!currentVersion ||
			!isString(currentVersion)
		) {
			throw new Error('API response with incorrect parameters');
		}

		const vCompRes = customVersionComparator(currentBuildNumber, buildNumber);

		return {
			hasCheckedUpdate: true,
			shouldUpdateFromJanis: vCompRes > 0,
		};
	} catch (error) {
		if (isDevEnv()) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		return defaultResponse;
	}
};
