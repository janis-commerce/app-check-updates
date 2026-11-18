import Storage from '@janiscommerce/app-storage';
import Crashlytics from '../../utils/crashlytics';
import getVersionsInfo from './getVersionsInfo';

const storage = new Storage();
const mockStorageGet = storage.get as jest.Mock;
const mockStorageSet = storage.set as jest.Mock;

const versionsFile = {
	currentVersion: '2.10.0',
	currentBuildNumber: '2500',
	minVersions: [],
};

const SERVER_DATE = 'Wed, 18 Nov 2026 12:00:00 GMT';
const DEVICE_TIME = Date.parse('2026-11-18T10:00:00.000Z');

const mockFetch = ({
	ok = true,
	headers = {},
	body = versionsFile,
}: {
	ok?: boolean;
	headers?: Record<string, string>;
	body?: unknown;
}) => {
	global.fetch = jest.fn(() =>
		Promise.resolve({
			ok,
			status: ok ? 200 : 500,
			json: () => Promise.resolve(body),
			headers: {get: (name: string) => headers[name] ?? null},
		})
	) as jest.Mock;
};

const mockSavedData = (savedData: Record<string, unknown>) =>
	mockStorageGet.mockImplementation((key: string) => savedData[key] ?? null);

describe('getVersionsInfo', () => {
	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(DEVICE_TIME);
		mockSavedData({});
	});

	afterEach(() => {
		jest.spyOn(Date, 'now').mockRestore();
	});

	it('requests versions.json skipping the local http cache', async () => {
		mockFetch({headers: {date: SERVER_DATE}});

		await getVersionsInfo({env: 'janisqa', app: 'picking'});

		expect(global.fetch).toHaveBeenCalledWith(
			'https://cdn.mobile.janisqa.in/picking/android/versions.json',
			{headers: {'Cache-Control': 'no-cache'}}
		);
		expect(Crashlytics.log).toHaveBeenCalledWith('getVersionsInfo:', {
			validUrl: 'https://cdn.mobile.janisqa.in/picking/android/versions.json',
		});
	});

	it('returns the server time from Date plus Age and saves both file and time', async () => {
		const serverTime = Date.parse(SERVER_DATE) + 120 * 1000;
		mockFetch({headers: {date: SERVER_DATE, age: '120'}});

		const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

		expect(response).toEqual({versionsFile, now: serverTime});
		expect(mockStorageSet).toHaveBeenCalledWith('versionsFile', versionsFile);
		expect(mockStorageSet).toHaveBeenCalledWith('lastServerTime', serverTime);
	});

	it('uses the server time even when the device clock is ahead', async () => {
		jest.spyOn(Date, 'now').mockReturnValue(Date.parse(SERVER_DATE) + 999999);
		mockFetch({headers: {date: SERVER_DATE}});

		const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

		expect(response.now).toBe(Date.parse(SERVER_DATE));
	});

	it('falls back to the latest of device time and saved server time when Date is missing', async () => {
		const lastServerTime = DEVICE_TIME + 1000;
		mockSavedData({lastServerTime});
		mockFetch({headers: {}});

		const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

		expect(response).toEqual({versionsFile, now: lastServerTime});
		expect(mockStorageSet).not.toHaveBeenCalledWith('lastServerTime', expect.anything());
	});

	it('returns the saved file when the response is not ok', async () => {
		const savedFile = {...versionsFile, currentBuildNumber: '2400'};
		mockSavedData({versionsFile: savedFile});
		mockFetch({ok: false, headers: {date: SERVER_DATE}});

		const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

		expect(response).toEqual({versionsFile: savedFile, now: DEVICE_TIME});
		expect(mockStorageSet).not.toHaveBeenCalled();
	});

	it('keeps the saved file when the downloaded one is invalid', async () => {
		mockSavedData({versionsFile});
		mockFetch({body: {...versionsFile, minVersions: 'x'}, headers: {date: SERVER_DATE}});

		const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

		expect(response).toEqual({versionsFile, now: DEVICE_TIME});
		expect(mockStorageSet).not.toHaveBeenCalled();
	});

	describe('offline', () => {
		beforeEach(() => {
			global.fetch = jest.fn(() =>
				Promise.reject(new Error('Network request failed'))
			) as jest.Mock;
		});

		it('uses the saved server time when the device clock was set back', async () => {
			const lastServerTime = DEVICE_TIME + 60 * 60 * 1000;
			mockSavedData({versionsFile, lastServerTime});

			const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

			expect(response).toEqual({versionsFile, now: lastServerTime});
		});

		it('uses the device time when it is ahead of the saved server time', async () => {
			mockSavedData({versionsFile, lastServerTime: DEVICE_TIME - 1000});

			const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

			expect(response).toEqual({versionsFile, now: DEVICE_TIME});
		});

		it('returns no file and the device time when nothing was saved', async () => {
			const response = await getVersionsInfo({env: 'janisqa', app: 'picking'});

			expect(response).toEqual({versionsFile: null, now: DEVICE_TIME});
		});
	});
});
