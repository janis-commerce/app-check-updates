import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

interface IcheckUpdateNeeded {
  curVersion: string;
  isAndroid?: boolean;
  isDebug?: boolean;
}

const checkUpdateNeeded = async ({
  curVersion,
  isAndroid = true,
  isDebug = false,
}: IcheckUpdateNeeded) => {
  try {
    if (typeof curVersion !== 'string' || !curVersion) {
      return null;
    }
    const inAppUpdates = await new SpInAppUpdates(isDebug);

    const storeResponse = await inAppUpdates.checkNeedsUpdate({curVersion});
    console.log('storeResponse :', storeResponse);

    if (storeResponse?.shouldUpdate) {
      let updateOptions: StartUpdateOptions = {};
      if (isAndroid) {
        // android only, on iOS the user will be promped to go to your app store page
        updateOptions = {
          updateType: IAUUpdateKind.FLEXIBLE,
        };
      }
      inAppUpdates.startUpdate(updateOptions);
    }
  } catch (error) {
    console.error(error);
  }
};

export default checkUpdateNeeded;
