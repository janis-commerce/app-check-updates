import 'react-native';
import checkUpdateNeeded from './index';
import mock from './mock.json';

const mockCheckNeedUpdate = jest.fn(() => mock);
const mockStartUpdate = jest.fn();

jest.mock('sp-react-native-in-app-updates', () => () => {
  return {
    checkNeedsUpdate: mockCheckNeedUpdate,
    startUpdate: mockStartUpdate,
  };

  // return {
  //   __esModule: true,
  //   default: {
  //     checkNeedsUpdate: mockCheckNeedUpdate,
  //     startUpdate: mockStartUpdate,
  //   },
  //   IAUUpdateKind: {
  //     FLEXIBLE: 1,
  //   },
  // };
});

describe('app check updates funtion', () => {
  describe('returns null because curVersion is not passed correctly', () => {
    it('curVersion is not a string', () => {
      expect(checkUpdateNeeded({curVersion: ''})).resolves.toBe(null);
    });
  });

  describe('works correctly', () => {
    it('checkNeedsUpdate is called', async () => {
      await checkUpdateNeeded({curVersion: '0.0.1', isAndroid: true});

      expect(mockCheckNeedUpdate).toHaveBeenCalled();
    });

    it('startUpdate is called', async () => {
      await checkUpdateNeeded({curVersion: '0.0.1', isAndroid: true});

      expect(mockStartUpdate).toHaveBeenCalled();
    });
  });
});
