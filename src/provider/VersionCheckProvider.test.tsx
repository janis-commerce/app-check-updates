import React from 'react';
import TestRenderer, {act, ReactTestRenderer} from 'react-test-renderer';
import Storage from '@janiscommerce/app-storage';
import {Button, Modal, ScreenActions, Typography} from '@janiscommerce/ui-native';
import getJanisAppInfo from '../lib/appInfo';
import getVersionsInfo from '../lib/versions/getVersionsInfo';
import updateApp from '../lib/install/updateApp';
import isUpdateAvailable from '../lib/install/isUpdateAvailable';
import UpdatePromptModal from '../ui/UpdatePromptModal';
import BlockingScreen from '../ui/BlockingScreen';
import {VersionCheckProvider, useVersionCheck} from './VersionCheckProvider';

jest.mock('../lib/appInfo', () => ({__esModule: true, default: jest.fn()}));
jest.mock('../lib/versions/getVersionsInfo', () => ({__esModule: true, default: jest.fn()}));
jest.mock('../lib/install/updateApp', () => ({__esModule: true, default: jest.fn()}));
jest.mock('../lib/install/isUpdateAvailable', () => ({__esModule: true, default: jest.fn()}));

const mockGetJanisAppInfo = getJanisAppInfo as jest.Mock;
const mockGetVersionsInfo = getVersionsInfo as jest.Mock;
const mockUpdateApp = updateApp as jest.Mock;
const mockIsUpdateAvailable = isUpdateAvailable as jest.Mock;

const storage = new Storage();
const mockStorageGet = storage.get as jest.Mock;
const mockStorageSet = storage.set as jest.Mock;

const versionsFile = {
	currentVersion: '2.10.0',
	currentBuildNumber: '2500',
	minVersions: [
		{
			buildNumber: '2400',
			warningStartsAt: '2026-12-01T12:00:00.000Z',
			blockingStartsAt: '2027-01-15T12:00:00.000Z',
		},
	],
};
const BEFORE_WARNING_TIME = Date.parse('2026-11-20T12:00:00.000Z');
const WARNING_TIME = Date.parse('2026-12-20T12:00:00.000Z');
const BLOCKING_TIME = Date.parse('2027-01-20T12:00:00.000Z');

const texts = {
	warningTitle: 'Warning title',
	warningMessage: (date: Date) => `Works until ${date.toISOString()}`,
	blockingTitle: 'Blocking title',
	blockingMessage: (date: Date) => `Blocked since ${date.toISOString()}`,
	updateAvailableTitle: 'New version title',
	updateAvailableMessage: 'New version message',
	updateButton: 'Update',
	laterButton: 'Later',
	updateUnavailable: 'Update unavailable',
	updateFailed: 'Update failed',
};

let checkVersion: () => Promise<void>;
const Probe = () => {
	({checkVersion} = useVersionCheck());
	return null;
};

const renderProvider = (props = {}) => {
	let renderer!: ReactTestRenderer;
	act(() => {
		renderer = TestRenderer.create(
			<VersionCheckProvider texts={texts} {...props}>
				<Probe />
			</VersionCheckProvider>
		);
	});
	return renderer;
};

const runCheck = async (now: number, file: object | null = versionsFile) => {
	mockGetVersionsInfo.mockResolvedValueOnce({versionsFile: file, now});
	await act(async () => {
		await checkVersion();
	});
};

const getTexts = (renderer: ReactTestRenderer) =>
	renderer.root.findAllByType(Typography).map(({props}) => props.children);

const getPrompt = (renderer: ReactTestRenderer) =>
	renderer.root.findAllByType(UpdatePromptModal)[0];

const pressButton = async (renderer: ReactTestRenderer, value: string) => {
	await act(async () => {
		await renderer.root
			.findAllByType(Button)
			.find(({props}) => props.value === value)
			?.props.onPress();
	});
};

const getUpdateAction = (renderer: ReactTestRenderer) =>
	renderer.root.findByType(ScreenActions).props.actions[0];

describe('VersionCheckProvider', () => {
	let saved: Record<string, unknown>;

	// app-storage drops expired keys by itself, so emptying it is how a TTL expiry looks from here
	const expireDismissals = () => {
		saved = {};
	};

	beforeEach(() => {
		saved = {};
		mockStorageGet.mockImplementation((key: string) => saved[key] ?? null);
		mockStorageSet.mockImplementation((key: string, value: unknown) => {
			saved[key] = value;
		});
		mockIsUpdateAvailable.mockResolvedValue(false);
		mockGetJanisAppInfo.mockReturnValue({env: 'janisqa', app: 'picking', buildNumber: '2300'});
	});

	it('renders the children and checks the versions of its env and app', async () => {
		const renderer = renderProvider();
		await runCheck(BEFORE_WARNING_TIME);

		expect(renderer.root.findAllByType(Probe)).toHaveLength(1);
		expect(mockGetVersionsInfo).toHaveBeenCalledWith({env: 'janisqa', app: 'picking'});
	});

	it('does nothing when the app is not a Janis one', async () => {
		mockGetJanisAppInfo.mockReturnValue(null);
		renderProvider();

		await act(async () => {
			await checkVersion();
		});

		expect(mockGetVersionsInfo).not.toHaveBeenCalled();
	});

	it.each([
		['the build is up to date and there is no new version', BLOCKING_TIME, versionsFile, '2400'],
		['there is no saved versions file', BLOCKING_TIME, null, '2300'],
		[
			'the file has no min versions and no new version',
			BLOCKING_TIME,
			{currentVersion: '2.10.0'},
			'2300',
		],
	])('shows nothing when %s', async (_, now, file, buildNumber) => {
		mockGetJanisAppInfo.mockReturnValue({env: 'janisqa', app: 'picking', buildNumber});
		const renderer = renderProvider();
		await runCheck(now, file);

		expect(renderer.root.findAllByType(UpdatePromptModal)).toHaveLength(0);
		expect(renderer.root.findAllByType(BlockingScreen)).toHaveLength(0);
	});

	describe('warning', () => {
		it('shows the blocking date', async () => {
			const renderer = renderProvider();
			await runCheck(WARNING_TIME);

			expect(getPrompt(renderer).props.title).toBe(texts.warningTitle);
			expect(getTexts(renderer)).toContain('Works until 2027-01-15T12:00:00.000Z');
		});

		it('stays hidden after Later until its TTL expires, even across restarts', async () => {
			const renderer = renderProvider();
			await runCheck(WARNING_TIME);
			await pressButton(renderer, texts.laterButton);

			expect(getPrompt(renderer)).toBeUndefined();
			expect(mockStorageSet).toHaveBeenCalledWith('dismissed.warning', true, {expiresAt: 120});

			const restarted = renderProvider();
			await runCheck(WARNING_TIME);
			expect(getPrompt(restarted)).toBeUndefined();

			expireDismissals();
			await runCheck(WARNING_TIME);
			expect(getPrompt(restarted).props.title).toBe(texts.warningTitle);
		});

		it('is postponed when closed from the modal itself', async () => {
			const renderer = renderProvider();
			await runCheck(WARNING_TIME);

			act(() => renderer.root.findByType(Modal).props.oncloseCallback());

			expect(getPrompt(renderer)).toBeUndefined();
			expect(mockStorageSet).toHaveBeenCalledWith('dismissed.warning', true, {expiresAt: 120});
		});

		it('uses the TTL the app configures', async () => {
			const renderer = renderProvider({warningTtl: 30});
			await runCheck(WARNING_TIME);
			await pressButton(renderer, texts.laterButton);

			expect(mockStorageSet).toHaveBeenCalledWith('dismissed.warning', true, {expiresAt: 30});
		});

		it('updates to the latest version from the warning', async () => {
			mockUpdateApp.mockResolvedValueOnce('failed');
			const renderer = renderProvider();
			await runCheck(WARNING_TIME);

			await pressButton(renderer, texts.updateButton);

			expect(mockUpdateApp).toHaveBeenCalledWith({
				env: 'janisqa',
				app: 'picking',
				buildNumber: '2300',
				newVersionNumber: '2.10.0.2500',
			});
			expect(getTexts(renderer)).toContain(texts.updateFailed);
		});

		it.each([
			['shown', false],
			['postponed', true],
		])('replaces the new version modal while it is %s', async (_, isPostponed) => {
			saved = isPostponed ? {'dismissed.warning': true} : {};
			mockIsUpdateAvailable.mockResolvedValue(true);
			const renderer = renderProvider();

			await runCheck(WARNING_TIME);

			expect(mockIsUpdateAvailable).not.toHaveBeenCalled();
			expect(getPrompt(renderer)?.props.title).not.toBe(texts.updateAvailableTitle);
		});
	});

	describe('new version available', () => {
		beforeEach(() => {
			mockIsUpdateAvailable.mockResolvedValue(true);
		});

		it('is offered when the install channel has a newer build', async () => {
			const renderer = renderProvider();
			await runCheck(BEFORE_WARNING_TIME);

			expect(mockIsUpdateAvailable).toHaveBeenCalledWith({
				buildNumber: '2300',
				currentBuildNumber: '2500',
			});
			expect(getPrompt(renderer).props.title).toBe(texts.updateAvailableTitle);
		});

		it('is not offered when the install channel has nothing newer', async () => {
			mockIsUpdateAvailable.mockResolvedValue(false);
			const renderer = renderProvider();
			await runCheck(BEFORE_WARNING_TIME);

			expect(getPrompt(renderer)).toBeUndefined();
		});

		it('stays hidden after Later until its TTL expires, without asking the store meanwhile', async () => {
			const renderer = renderProvider();
			await runCheck(BEFORE_WARNING_TIME);
			await pressButton(renderer, texts.laterButton);

			expect(mockStorageSet).toHaveBeenCalledWith('dismissed.updateAvailable', true, {
				expiresAt: 120,
			});

			mockIsUpdateAvailable.mockClear();
			await runCheck(BEFORE_WARNING_TIME);
			expect(getPrompt(renderer)).toBeUndefined();
			expect(mockIsUpdateAvailable).not.toHaveBeenCalled();

			expireDismissals();
			await runCheck(BEFORE_WARNING_TIME);
			expect(getPrompt(renderer).props.title).toBe(texts.updateAvailableTitle);
		});

		it('uses the TTL the app configures', async () => {
			const renderer = renderProvider({updateAvailableTtl: 15});
			await runCheck(BEFORE_WARNING_TIME);
			await pressButton(renderer, texts.laterButton);

			expect(mockStorageSet).toHaveBeenCalledWith('dismissed.updateAvailable', true, {
				expiresAt: 15,
			});
		});

		it('updates to the latest version', async () => {
			mockUpdateApp.mockResolvedValueOnce('unavailable');
			const renderer = renderProvider();
			await runCheck(BEFORE_WARNING_TIME);

			await pressButton(renderer, texts.updateButton);

			expect(mockUpdateApp).toHaveBeenCalledWith(
				expect.objectContaining({newVersionNumber: '2.10.0.2500'})
			);
			expect(getTexts(renderer)).toContain(texts.updateUnavailable);
		});
	});

	describe('blocking', () => {
		it('shows only the blocking screen, without a way to close it', async () => {
			const renderer = renderProvider();
			await runCheck(WARNING_TIME);
			await runCheck(BLOCKING_TIME);

			expect(getPrompt(renderer)).toBeUndefined();
			expect(renderer.root.findByType(Modal).props).toEqual(
				expect.objectContaining({fullScreen: true, canClose: false})
			);
			expect(getTexts(renderer)).toContain('Blocked since 2027-01-15T12:00:00.000Z');
		});

		it('does not ask the store for new versions while blocked', async () => {
			renderProvider();

			await runCheck(BLOCKING_TIME);

			expect(mockIsUpdateAvailable).not.toHaveBeenCalled();
		});

		it('blocks even when the user postponed the warning', async () => {
			saved = {'dismissed.warning': true};
			const renderer = renderProvider();

			await runCheck(BLOCKING_TIME);

			expect(renderer.root.findAllByType(BlockingScreen)).toHaveLength(1);
		});

		it('stays blocked when a later check no longer blocks', async () => {
			const renderer = renderProvider();
			await runCheck(BLOCKING_TIME);

			await runCheck(WARNING_TIME);

			expect(renderer.root.findAllByType(BlockingScreen)).toHaveLength(1);
			expect(getPrompt(renderer)).toBeUndefined();
		});

		it('updates to the latest version and shows loading meanwhile', async () => {
			let resolveUpdate!: (result: string) => void;
			mockUpdateApp.mockReturnValueOnce(new Promise((resolve) => (resolveUpdate = resolve)));
			const renderer = renderProvider();
			await runCheck(BLOCKING_TIME);

			act(() => {
				getUpdateAction(renderer).onPress();
			});

			expect(getUpdateAction(renderer).isLoading).toBe(true);
			expect(mockUpdateApp).toHaveBeenCalledWith({
				env: 'janisqa',
				app: 'picking',
				buildNumber: '2300',
				newVersionNumber: '2.10.0.2500',
			});

			await act(async () => resolveUpdate('started'));

			expect(getUpdateAction(renderer).isLoading).toBe(false);
			expect(getTexts(renderer)).not.toContain(texts.updateFailed);
		});

		it.each([
			['unavailable', texts.updateUnavailable],
			['failed', texts.updateFailed],
		])('explains when the update is %s', async (result, text) => {
			mockUpdateApp.mockResolvedValueOnce(result);
			const renderer = renderProvider();
			await runCheck(BLOCKING_TIME);

			await act(async () => {
				await getUpdateAction(renderer).onPress();
			});

			expect(getTexts(renderer)).toContain(text);
		});
	});
});

describe('useVersionCheck', () => {
	it('does nothing outside the provider', async () => {
		act(() => {
			TestRenderer.create(<Probe />);
		});

		await expect(checkVersion()).resolves.toBeUndefined();
		expect(mockGetVersionsInfo).not.toHaveBeenCalled();
	});
});
