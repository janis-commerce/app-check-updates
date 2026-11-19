import {isString} from '../utils';
import type {VersionsFile} from './getVersionsInfo';
import type {MinVersion} from '../minVersion/resolveVersionStatus';

const isDate = (value: unknown) => isString(value) && !Number.isNaN(Date.parse(value as string));

const isBuildNumber = (value: unknown) =>
	isString(value) && value !== '' && !Number.isNaN(Number(value));

/**
 * @name isValidVersionsFile
 * @description checks that versions.json has what the app needs before trusting and saving it
 * @param {unknown} data parsed versions.json
 * @returns {boolean}
 */
export const isValidVersionsFile = (data: unknown): data is VersionsFile => {
	if (!data || typeof data !== 'object') {
		return false;
	}

	const {currentVersion, currentBuildNumber, minVersions} = data as Partial<VersionsFile>;

	// minVersions is optional until the mobile service publishes it
	return (
		isString(currentVersion) &&
		isString(currentBuildNumber) &&
		(minVersions === undefined || Array.isArray(minVersions))
	);
};

/**
 * @name isValidMinVersion
 * @description checks that a published min version has a numeric build and valid dates
 * @param {object} minVersion entry of minVersions
 * @returns {boolean}
 */
export const isValidMinVersion = (minVersion: Partial<MinVersion> | null) =>
	isBuildNumber(minVersion?.buildNumber) &&
	isDate(minVersion?.warningStartsAt) &&
	isDate(minVersion?.blockingStartsAt);
