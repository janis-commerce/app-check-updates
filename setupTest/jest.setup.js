/* eslint-disable no-undef */
jest.mock('sp-react-native-in-app-updates', () => () => {
  const sp = jest.requireActual('sp-react-native-in-app-updates');
  return {
    __esModule: true,
    default: {...sp},
    IAUUpdateKind: {
      FLEXIBLE: 1,
    },
  };
});
