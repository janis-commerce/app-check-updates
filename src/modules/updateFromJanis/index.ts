import {PermissionsAndroid, Platform, NativeModules} from 'react-native';
import RNFS from 'react-native-fs';
import {isDevEnv, isString} from '../../utils';
import Crashlytics from '../../utils/crashlytics';

const {ApkInstaller} = NativeModules;

interface IappCheckUpdates {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
	newVersionNumber: string;
	DownloadProgressCallback?: () => void;
}

const envMapper = {
	janisdev: '-beta',
	janisqa: '-qa',
	janis: '',
} as const;

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
		Crashlytics.log('updateFromJanis:', {env, app, newVersionNumber});
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

		const targetEnv = envMapper[env];
		const targetDir = `${RNFS.DownloadDirectoryPath}/${app}${targetEnv}-apk`;

		const targetDirExists = await RNFS.exists(targetDir);

		if (targetDirExists) {
			const files = await RNFS.readDir(targetDir);

			for (const file of files) {
				await RNFS.unlink(file.path);
			}
		} else {
			await RNFS.mkdir(targetDir);
		}

		/* istanbul ignore next */
		const downloadProgressHandler =
			typeof DownloadProgressCallback === 'function' ? DownloadProgressCallback : () => {};

		const apkPath = `${targetDir}/${app}${targetEnv}.${newVersionNumber}.apk`;

		const response = await RNFS.downloadFile({
			fromUrl: validUrl,
			toFile: apkPath,
			progress: downloadProgressHandler,
		}).promise;

		if (response.statusCode === 200) {
			// Instalar automáticamente la APK descargada
			await ApkInstaller.install(apkPath)
				.then(() => {
					Crashlytics.log('APK installation started successfully');
				})
				.catch((installError: unknown) => {
					Crashlytics.recordError(installError, 'error installing APK');
					if (isDevEnvironment) {
						// eslint-disable-next-line no-console
						console.error('Install error:', installError);
					}
				});
			return true;
		}

		return false;
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
