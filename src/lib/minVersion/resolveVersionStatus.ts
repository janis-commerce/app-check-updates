import {isValidMinVersion} from '../versions/validateVersionsFile';

export interface MinVersion {
	buildNumber: string;
	warningStartsAt: string;
	blockingStartsAt: string;
}

interface IresolveVersionStatus {
	minVersions: MinVersion[];
	buildNumber: string;
	now: number;
}

const getEarliestBlockingDate = (minVersions: MinVersion[]) =>
	minVersions
		.map(({blockingStartsAt}) => blockingStartsAt)
		.sort((a, b) => Date.parse(a) - Date.parse(b))[0];

/**
 * @name resolveVersionStatus
 * @description resolves whether the installed build must be warned or blocked by the published minimum versions
 * @param {array} minVersions minimum versions published in versions.json
 * @param {string} buildNumber current build number of the App
 * @param {number} now trusted current time in milliseconds
 * @returns {object} { status: 'ok' | 'warning' | 'blocked', blockingDate: string | null }
 */
const resolveVersionStatus = ({minVersions, buildNumber, now}: IresolveVersionStatus) => {
	// A malformed entry is skipped instead of blocking: a wrong block would stop every user
	// Builds are compared as numbers: as strings, '999' would rank above '1000'
	const pendingMinVersions = minVersions
		.filter(isValidMinVersion)
		.filter((minVersion) => Number(minVersion.buildNumber) > Number(buildNumber));

	const startedBy = (date: 'warningStartsAt' | 'blockingStartsAt') =>
		pendingMinVersions.filter((minVersion) => Date.parse(minVersion[date]) <= now);

	const blockingMinVersions = startedBy('blockingStartsAt');
	if (blockingMinVersions.length) {
		return {status: 'blocked' as const, blockingDate: getEarliestBlockingDate(blockingMinVersions)};
	}

	const warningMinVersions = startedBy('warningStartsAt');
	if (warningMinVersions.length) {
		return {status: 'warning' as const, blockingDate: getEarliestBlockingDate(warningMinVersions)};
	}

	return {status: 'ok' as const, blockingDate: null};
};

export default resolveVersionStatus;
