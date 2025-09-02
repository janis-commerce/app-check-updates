import {PermissionsAndroid, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {isDevEnv, isString} from '../../utils';
import Crashlytics from '../../utils/crashlytics';

interface IappCheckUpdates {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
	newVersionNumber: string;
	DownloadProgressCallback?: () => void;
}

/**
 * @name updateFromJanis
 * @description It is responsible for downloading the apk with the latest version of the app from janis
 * @param {string} env environment of janis
 * @param {string} app App name
 * @param {string} newVersion new version of the app
 * @param {function} DownloadProgressCallback function that monitors the download progress
 * @returns {boolean} if you can download the new apk correctly
 */
const updateFromJanis = async ({
	env,
	app,
	newVersionNumber,
	DownloadProgressCallback,
}: IappCheckUpdates) => {
	const isDevEnvironment = isDevEnv();
	try {
		Crashlytics.log('updateFromJanis started', {env, app, newVersionNumber});
		if (
			!isString(env) ||
			!env ||
			!isString(app) ||
			!app ||
			!isString(newVersionNumber) ||
			!newVersionNumber
		) {
			throw new Error('the parameters are incorrect');
		}

		const validUrl = `https://mobile.${env}.in/api/download/${app}/android/latest`;
		const apiVersion = Platform.Version;

		if (Number(apiVersion) < 33) {
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
				throw new Error('You do not have permissions for external storage');
			}
		}

		const envVersion = {
			janisdev: '-beta',
			janisqa: '-qa',
			janis: '',
		};

		const targetDir = `${RNFS.DownloadDirectoryPath}/${app}-apk`;
		const dirExists = await RNFS.exists(targetDir);

		if (dirExists) {
			await RNFS.unlink(targetDir);
		}

		await RNFS.mkdir(targetDir);

		/* istanbul ignore next */
		const progress =
			typeof DownloadProgressCallback === 'function' ? DownloadProgressCallback : () => {};

		const response = await RNFS.downloadFile({
			fromUrl: validUrl,
			toFile: `${RNFS.DownloadDirectoryPath}/${app}-apk/${app}${envVersion[env]}.${newVersionNumber}.apk`,
			progress,
		}).promise;

		return response.statusCode === 200;
	} catch (error: unknown) {
		if (isDevEnvironment) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		Crashlytics.recordError(error, 'error updating app by updateFromJanis');

		return Promise.reject(error);
	}
};

export default updateFromJanis;
