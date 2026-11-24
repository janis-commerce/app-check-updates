import Storage from '@janiscommerce/app-storage';
import {
	isNewVersionPostponed,
	isWarningPostponed,
	postponeNewVersion,
	postponeWarning,
} from './index';

const storage = new Storage();
const mockStorageGet = storage.get as jest.Mock;
const mockStorageSet = storage.set as jest.Mock;

describe('postponements', () => {
	let saved: Record<string, unknown>;

	beforeEach(() => {
		saved = {};
		mockStorageGet.mockImplementation((key: string) => saved[key] ?? null);
		mockStorageSet.mockImplementation((key: string, value: unknown) => {
			saved[key] = value;
		});
	});

	it('saves the postponement with its TTL so the storage expires it', () => {
		postponeWarning(120);

		expect(mockStorageSet).toHaveBeenCalledWith('postponed.warning', true, {expiresAt: 120});
	});

	it('is postponed until the storage expires it', () => {
		postponeNewVersion(120);
		expect(isNewVersionPostponed()).toBe(true);

		saved = {};
		expect(isNewVersionPostponed()).toBe(false);
	});

	it('keeps the warning and the new version independent', () => {
		postponeWarning(120);
		expect(isNewVersionPostponed()).toBe(false);

		saved = {};
		postponeNewVersion(120);
		expect(isWarningPostponed()).toBe(false);
	});
});
