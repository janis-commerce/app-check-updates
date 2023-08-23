import mock from '../src/mock.json';
/* eslint-disable no-undef */

jest.mock('sp-react-native-in-app-updates', () => () => {
  return {
    checkNeedsUpdate: jest.fn(() => mock),
    startUpdate: jest.fn(),
    installUpdate: jest.fn(),
    addStatusUpdateListener: jest.fn(),
    removeStatusUpdateListener: jest.fn(),
    addIntentSelectionListener: jest.fn(),
    removeIntentSelectionListener: jest.fn(),
  };
});
