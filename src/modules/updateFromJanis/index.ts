import {PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';
import {isDevEnv, isString} from '../../utils';

interface IappCheckUpdates {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
	buildNumber: string;
	currentVersion: string;
}

/**
 * @name updateFromJanis
 * @description It is responsible for downloading the apk with the latest version of the app from janis
 * @param {string} env environment of janis
 * @param {string} app App name
 * @param {string} currentVersion new version of the app
 * @param {string} buildNumber new buildNumber of the app
 * @returns {boolean} if you can download the new apk correctly
 */
const updateFromJanis = ({env, app, currentVersion, buildNumber}: IappCheckUpdates) => {
	return async (DownloadProgressCallback?: () => void) => {
		const isDevEnvironment = isDevEnv();
		try {
			if (
				!isString(env) ||
				!env ||
				!isString(app) ||
				!app ||
				!isString(buildNumber) ||
				!buildNumber ||
				!isString(currentVersion) ||
				!currentVersion
			) {
				return false;
			}
			const validUrl = `https://mobile.${env}.in/api/download/${app}/android/latest`;

			await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
				PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
			]);

			const readGranted = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
			);
			const writeGranted = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
			);
			if (!readGranted || !writeGranted) {
				return false;
			}
			const envVersion = {
				janisdev: '-beta',
				janisqa: '-qa',
				janis: '',
			};

			await RNFS.mkdir(`${RNFS.DownloadDirectoryPath}/${app}-apk`);

			/* istanbul ignore next */
			const progress =
				typeof DownloadProgressCallback === 'function' ? DownloadProgressCallback : () => {};

			const response = await RNFS.downloadFile({
				fromUrl: validUrl,
				toFile: `${RNFS.DownloadDirectoryPath}/${app}-apk/${app}${envVersion[env]}.${currentVersion}.${buildNumber}.apk`,
				progress,
			}).promise;

			return response.statusCode === 200;
		} catch (error) {
			if (isDevEnvironment) {
				// eslint-disable-next-line no-console
				console.error(error);
			}
			return false;
		}
	};
};

export default updateFromJanis;
