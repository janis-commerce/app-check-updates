import 'react-native';
import checkUpdateNeeded from './index';

const checkNeedUpdateMock = jest.fn();

jest.doMock('sp-react-native-in-app-updates', () => () => {
  return {
    checkNeedsUpdate: checkNeedUpdateMock,
  };
});

describe('app check updates funtion', () => {
  describe('returns null because curVersion is not passed correctly', () => {
    it('curVersion is not a string', () => {
      // expect.assertions(1);
      expect(checkUpdateNeeded({curVersion: ''})).resolves.toBe(null);
    });
  });

  describe('works correctly', () => {
    it('checkNeedsUpdate is called', async () => {
      await checkUpdateNeeded({curVersion: '0.0.1'});

      expect(checkNeedUpdateMock).toHaveBeenCalled();
    });
  });
});
