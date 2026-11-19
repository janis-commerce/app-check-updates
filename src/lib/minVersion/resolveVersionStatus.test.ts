import resolveVersionStatus from './resolveVersionStatus';

const minVersions = [
	{
		buildNumber: '2400',
		warningStartsAt: '2026-12-01T00:00:00.000Z',
		blockingStartsAt: '2027-01-01T00:00:00.000Z',
	},
	{
		buildNumber: '2500',
		warningStartsAt: '2026-12-15T00:00:00.000Z',
		blockingStartsAt: '2027-02-01T00:00:00.000Z',
	},
];

describe('resolveVersionStatus', () => {
	it('returns ok when the build is equal or greater than every min version', () => {
		expect(
			resolveVersionStatus({
				minVersions,
				buildNumber: '2500',
				now: Date.parse('2027-03-01T00:00:00.000Z'),
			})
		).toEqual({status: 'ok', blockingDate: null});
	});

	it('returns ok when no warning has started yet', () => {
		expect(
			resolveVersionStatus({
				minVersions,
				buildNumber: '2300',
				now: Date.parse('2026-11-30T00:00:00.000Z'),
			})
		).toEqual({status: 'ok', blockingDate: null});
	});

	it('returns warning with the earliest blocking date among the started warnings', () => {
		expect(
			resolveVersionStatus({
				minVersions: [...minVersions].reverse(),
				buildNumber: '2300',
				now: Date.parse('2026-12-20T00:00:00.000Z'),
			})
		).toEqual({status: 'warning', blockingDate: '2027-01-01T00:00:00.000Z'});
	});

	it('returns blocked once a blocking date has passed, even if another min version is only warning', () => {
		expect(
			resolveVersionStatus({
				minVersions,
				buildNumber: '2300',
				now: Date.parse('2027-01-01T00:00:00.000Z'),
			})
		).toEqual({status: 'blocked', blockingDate: '2027-01-01T00:00:00.000Z'});
	});

	it('returns blocked with the earliest of the passed blocking dates', () => {
		expect(
			resolveVersionStatus({
				minVersions: [...minVersions].reverse(),
				buildNumber: '2300',
				now: Date.parse('2027-03-01T00:00:00.000Z'),
			})
		).toEqual({status: 'blocked', blockingDate: '2027-01-01T00:00:00.000Z'});
	});

	it('only applies the min versions above the installed build', () => {
		expect(
			resolveVersionStatus({
				minVersions,
				buildNumber: '2400',
				now: Date.parse('2027-01-15T00:00:00.000Z'),
			})
		).toEqual({status: 'warning', blockingDate: '2027-02-01T00:00:00.000Z'});
	});

	it('compares builds as numbers', () => {
		expect(
			resolveVersionStatus({
				minVersions: [{...minVersions[0], buildNumber: '1000'}],
				buildNumber: '999',
				now: Date.parse('2027-01-15T00:00:00.000Z'),
			})
		).toEqual({status: 'blocked', blockingDate: '2027-01-01T00:00:00.000Z'});
	});

	it('skips malformed min versions instead of blocking', () => {
		expect(
			resolveVersionStatus({
				minVersions: [
					{...minVersions[0], buildNumber: 'abc'},
					{...minVersions[0], blockingStartsAt: 'tomorrow'},
				],
				buildNumber: '2300',
				now: Date.parse('2027-03-01T00:00:00.000Z'),
			})
		).toEqual({status: 'ok', blockingDate: null});
	});
});
