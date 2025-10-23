import {NativeModules, Platform} from 'react-native';
import updateFromStore from './modules/updateFromStore';
import updateFromJanis from './modules/updateFromJanis';
import {checkNeedsUpdateInJanis, defaultResponse} from './utils';

interface IappCheckUpdates {
	buildNumber: string;
	isDebug?: boolean;
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
}
/**
 * @name appCheckUpdates
 * @description check and download new versions from the store or from janis as appropriate
 * @param {string} buildNumber current version of the App
 * @param {boolean} isDebug is debug mode
 * @param {string} env environment of janis
 * @param {string} app App name
 * @returns {object} { hasCheckedUpdate: boolean, shouldUpdateFromJanis: boolean, newVersionNumber: string}
 */
const appCheckUpdates = async ({buildNumber, isDebug = false, env, app}: IappCheckUpdates) => {
	const {hasCheckedUpdate, needCheckInJanis} = await updateFromStore({buildNumber, isDebug});

	if (hasCheckedUpdate) {
		return {
			...defaultResponse,
			hasCheckedUpdate,
		};
	}

	if (needCheckInJanis) {
		return checkNeedsUpdateInJanis({buildNumber, env, app});
	}
	return defaultResponse;
};

/**
 * @name checkIfJustUpdated
 * @description Verifica si la app acaba de actualizarse y limpia los archivos temporales
 * @returns {Promise<boolean>} true si la app se actualizó recientemente
 */
const checkIfJustUpdated = async (): Promise<boolean> => {
	try {
		// Solo disponible en Android
		if (Platform.OS !== 'android') {
			return false;
		}

		const ApkInstaller = NativeModules.ApkInstaller;
		if (ApkInstaller && ApkInstaller.checkUpdateCompleted) {
			return await ApkInstaller.checkUpdateCompleted();
		}
		return false;
	} catch (error) {
		// Ignorar errores si el módulo no está disponible
		return false;
	}
};

export {appCheckUpdates, updateFromJanis, checkIfJustUpdated};
