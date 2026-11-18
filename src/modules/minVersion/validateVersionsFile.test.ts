import {isValidMinVersion, isValidVersionsFile} from './validateVersionsFile';

const minVersion = {
	buildNumber: '2400',
	warningStartsAt: '2026-12-01T00:00:00.000Z',
	blockingStartsAt: '2027-01-01T00:00:00.000Z',
};

const versionsFile = {
	currentVersion: '2.10.0',
	currentBuildNumber: '2500',
	minVersions: [minVersion],
};

describe('isValidVersionsFile', () => {
	it.each([
		['with min versions', versionsFile],
		['without min versions', {currentVersion: '2.10.0', currentBuildNumber: '2500'}],
	])('accepts a file %s', (_, data) => {
		expect(isValidVersionsFile(data)).toBe(true);
	});

	it.each([
		['null', null],
		['a string', 'versions'],
		['an array', [versionsFile]],
		['a file without currentVersion', {...versionsFile, currentVersion: undefined}],
		['a file with a numeric currentBuildNumber', {...versionsFile, currentBuildNumber: 2500}],
		['a file whose minVersions is not an array', {...versionsFile, minVersions: 'x'}],
	])('rejects %s', (_, data) => {
		expect(isValidVersionsFile(data)).toBe(false);
	});
});

describe('isValidMinVersion', () => {
	it('accepts a numeric build with valid dates', () => {
		expect(isValidMinVersion(minVersion)).toBe(true);
	});

	it.each([
		['null', null],
		['a non numeric build', {...minVersion, buildNumber: 'abc'}],
		['an empty build', {...minVersion, buildNumber: ''}],
		['a build that is not a string', {...minVersion, buildNumber: 2400 as unknown as string}],
		['an invalid warning date', {...minVersion, warningStartsAt: 'tomorrow'}],
		['a missing blocking date', {...minVersion, blockingStartsAt: undefined}],
	])('rejects %s', (_, data) => {
		expect(isValidMinVersion(data)).toBe(false);
	});
});
