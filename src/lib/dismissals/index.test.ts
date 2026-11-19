import Storage from '@janiscommerce/app-storage';
import {dismiss, isDismissed} from './index';

const storage = new Storage();
const mockStorageGet = storage.get as jest.Mock;
const mockStorageSet = storage.set as jest.Mock;

describe('dismissals', () => {
	let saved: Record<string, unknown>;

	beforeEach(() => {
		saved = {};
		mockStorageGet.mockImplementation((key: string) => saved[key] ?? null);
		mockStorageSet.mockImplementation((key: string, value: unknown) => {
			saved[key] = value;
		});
	});

	it('saves the dismissal with its TTL so the storage expires it', () => {
		dismiss('warning', 120);

		expect(mockStorageSet).toHaveBeenCalledWith('dismissed.warning', true, {expiresAt: 120});
	});

	it('is dismissed until the storage expires it', () => {
		dismiss('updateAvailable', 120);
		expect(isDismissed('updateAvailable')).toBe(true);

		saved = {};
		expect(isDismissed('updateAvailable')).toBe(false);
	});

	it('keeps each modal independent', () => {
		dismiss('warning', 120);

		expect(isDismissed('updateAvailable')).toBe(false);
	});
});
