import React from 'react';
import TestRenderer, {act, ReactTestRenderer} from 'react-test-renderer';
import {Button, Modal, ScreenActions, Typography} from '@janiscommerce/ui-native';
import getVersionsInfo from '../lib/versions/getVersionsInfo';
import updateApp from '../lib/install/updateApp';
import WarningModal from '../ui/WarningModal';
import BlockingScreen from '../ui/BlockingScreen';
import {VersionCheckProvider, useVersionCheck} from './VersionCheckProvider';

jest.mock('../lib/versions/getVersionsInfo', () => ({__esModule: true, default: jest.fn()}));
jest.mock('../lib/install/updateApp', () => ({__esModule: true, default: jest.fn()}));

const mockGetVersionsInfo = getVersionsInfo as jest.Mock;
const mockUpdateApp = updateApp as jest.Mock;

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
const WARNING_TIME = Date.parse('2026-12-20T12:00:00.000Z');
const BLOCKING_TIME = Date.parse('2027-01-20T12:00:00.000Z');

let checkVersion: () => Promise<void>;
const Probe = () => {
	({checkVersion} = useVersionCheck());
	return null;
};

const texts = {
	warningTitle: 'Warning title',
	warningMessage: (date: Date) => `Works until ${date.toISOString()}`,
	warningButton: 'Got it',
	blockingTitle: 'Blocking title',
	blockingMessage: (date: Date) => `Blocked since ${date.toISOString()}`,
	updateButton: 'Update',
	updateUnavailable: 'Update unavailable',
	updateFailed: 'Update failed',
};

const renderProvider = (props = {}) => {
	let renderer!: ReactTestRenderer;
	act(() => {
		renderer = TestRenderer.create(
			<VersionCheckProvider env="janisqa" app="picking" buildNumber="2300" texts={texts} {...props}>
				<Probe />
			</VersionCheckProvider>
		);
	});
	return renderer;
};

const runCheck = async (response: object) => {
	mockGetVersionsInfo.mockResolvedValueOnce(response);
	await act(async () => {
		await checkVersion();
	});
};

const getTexts = (renderer: ReactTestRenderer) =>
	renderer.root.findAllByType(Typography).map(({props}) => props.children);

const pressButton = async (renderer: ReactTestRenderer) => {
	await act(async () => {
		await renderer.root.findByType(Button).props.onPress();
	});
};

const getUpdateAction = (renderer: ReactTestRenderer) =>
	renderer.root.findByType(ScreenActions).props.actions[0];

const pressUpdate = async (renderer: ReactTestRenderer) => {
	await act(async () => {
		await getUpdateAction(renderer).onPress();
	});
};

describe('VersionCheckProvider', () => {
	it('renders the children and checks the versions of its env and app', async () => {
		const renderer = renderProvider();
		await runCheck({versionsFile, now: WARNING_TIME});

		expect(renderer.root.findAllByType(Probe)).toHaveLength(1);
		expect(mockGetVersionsInfo).toHaveBeenCalledWith({env: 'janisqa', app: 'picking'});
	});

	it.each([
		[
			'the build is up to date',
			{versionsFile: {...versionsFile, currentBuildNumber: '2400'}, now: 0},
		],
		['there is no saved versions file', {versionsFile: null, now: BLOCKING_TIME}],
		[
			'the file has no min versions',
			{versionsFile: {currentVersion: '2.10.0'}, now: BLOCKING_TIME},
		],
	])('shows nothing when %s', async (_, response) => {
		const renderer = renderProvider({buildNumber: '2400'});
		await runCheck(response);

		expect(renderer.root.findAllByType(WarningModal)).toHaveLength(0);
		expect(renderer.root.findAllByType(BlockingScreen)).toHaveLength(0);
	});

	describe('warning', () => {
		it('shows the blocking date and closes with the button', async () => {
			const renderer = renderProvider();
			await runCheck({versionsFile, now: WARNING_TIME});

			expect(getTexts(renderer)).toContain('Works until 2027-01-15T12:00:00.000Z');

			await pressButton(renderer);

			expect(renderer.root.findAllByType(WarningModal)).toHaveLength(0);
		});

		it('closes from the modal itself', async () => {
			const renderer = renderProvider();
			await runCheck({versionsFile, now: WARNING_TIME});

			act(() => renderer.root.findByType(Modal).props.oncloseCallback());

			expect(renderer.root.findAllByType(WarningModal)).toHaveLength(0);
		});

		it('is shown only once per session', async () => {
			const renderer = renderProvider();
			await runCheck({versionsFile, now: WARNING_TIME});
			await pressButton(renderer);

			await runCheck({versionsFile, now: WARNING_TIME});

			expect(renderer.root.findAllByType(WarningModal)).toHaveLength(0);
		});
	});

	describe('blocking', () => {
		it('shows only the blocking screen, without a way to close it', async () => {
			const renderer = renderProvider();
			await runCheck({versionsFile, now: WARNING_TIME});
			await runCheck({versionsFile, now: BLOCKING_TIME});

			expect(renderer.root.findAllByType(WarningModal)).toHaveLength(0);
			expect(renderer.root.findByType(Modal).props).toEqual(
				expect.objectContaining({fullScreen: true, canClose: false})
			);
			expect(getTexts(renderer)).toContain('Blocked since 2027-01-15T12:00:00.000Z');
		});

		it('updates to the latest version and shows loading meanwhile', async () => {
			let resolveUpdate!: (result: string) => void;
			mockUpdateApp.mockReturnValueOnce(new Promise((resolve) => (resolveUpdate = resolve)));
			const renderer = renderProvider();
			await runCheck({versionsFile, now: BLOCKING_TIME});

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
			await runCheck({versionsFile, now: BLOCKING_TIME});

			await pressUpdate(renderer);

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
