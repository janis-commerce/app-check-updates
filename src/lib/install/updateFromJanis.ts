import {PermissionsAndroid, Platform, NativeModules} from 'react-native';
import RNFS from 'react-native-fs';
import Crashlytics from '../crashlytics';
import type {JanisAppInfo} from '../appInfo';

const {ApkInstaller} = NativeModules;

interface IupdateFromJanis extends Pick<JanisAppInfo, 'env' | 'app'> {
	newVersionNumber: string;
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
 * @param {string} newVersionNumber new version of the app, used to name the APK
 * @returns {boolean} if you can download the new apk correctly
 */
const updateFromJanis = async ({env, app, newVersionNumber}: IupdateFromJanis) => {
	try {
		Crashlytics.log('updateFromJanis:', {env, app, newVersionNumber});

		const validUrl = `https://mobile.${env}.in/api/download/${app}/android/latest`;

		if (Number(Platform.Version) < 33) {
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

		// Removing the whole folder drops the APKs left by a previous download
		if (await RNFS.exists(targetDir)) {
			await RNFS.unlink(targetDir);
		}
		await RNFS.mkdir(targetDir);

		const apkPath = `${targetDir}/${app}${targetEnv}.${newVersionNumber}.apk`;

		const response = await RNFS.downloadFile({
			fromUrl: validUrl,
			toFile: apkPath,
		}).promise;

		if (response.statusCode === 200) {
			await ApkInstaller.install(apkPath)
				.then(() => {
					Crashlytics.log('APK installation started successfully');
				})
				.catch((installError: unknown) => {
					Crashlytics.recordError(installError, 'error installing APK');
					// Dev-only console output: Crashlytics already records the error, nothing to assert
					/* istanbul ignore next */
					if (__DEV__) {
						// eslint-disable-next-line no-console
						console.error('Install error:', installError);
					}
				});
			return true;
		}

		return false;
	} catch (error: unknown) {
		/* istanbul ignore next */
		if (__DEV__) {
			// eslint-disable-next-line no-console
			console.error(error);
		}
		Crashlytics.recordError(error, 'error updating app by updateFromJanis');

		throw error;
	}
};

export default updateFromJanis;
