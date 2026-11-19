jest.mock('@janiscommerce/app-device-info', () => ({
	getAppInfo: jest.fn(),
	getBuildNumber: jest.fn(),
	getBundleId: jest.fn(),
}));

// @ts-ignore the package ships no type declarations
import {getAppInfo, getBuildNumber, getBundleId} from '@janiscommerce/app-device-info';
import getJanisAppInfo from './index';

const mockDevice = ({bundleId, janisEnv}: {bundleId: string | null; janisEnv: string}) => {
	(getBundleId as jest.Mock).mockReturnValue(bundleId);
	(getAppInfo as jest.Mock).mockReturnValue({appName: 'Janis Orders App', janisEnv});
	(getBuildNumber as jest.Mock).mockReturnValue('5968');
};

describe('getJanisAppInfo', () => {
	it.each([
		['in.janis.picking', 'janis', 'picking'],
		['in.janis.delivery.qa', 'janisqa', 'delivery'],
		['in.janis.wms.beta', 'janisdev', 'wms'],
	])('reads %s as %s / %s', (bundleId, janisEnv, app) => {
		mockDevice({bundleId, janisEnv});

		expect(getJanisAppInfo()).toEqual({env: janisEnv, app, buildNumber: '5968'});
	});

	it.each([
		['the bundle is not a Janis one', 'com.other.picking', ''],
		['the bundle is a Janis app this package does not know', 'in.janis.views', 'janis'],
		['the bundle id cannot be read', null, ''],
	])('returns null when %s', (_, bundleId, janisEnv) => {
		mockDevice({bundleId, janisEnv});

		expect(getJanisAppInfo()).toBeNull();
	});
});
