import SpInAppUpdates, { IAUUpdateKind, } from 'sp-react-native-in-app-updates';
const checkUpdateNeeded = async ({ curVersion, isAndroid = true, isDebug = false, }) => {
    try {
        const inAppUpdates = await new SpInAppUpdates(isDebug);
        const storeResponse = await inAppUpdates.checkNeedsUpdate({ curVersion });
        console.log('storeResponse :', storeResponse);
        if (storeResponse.shouldUpdate) {
            let updateOptions = {};
            if (isAndroid) {
                // android only, on iOS the user will be promped to go to your app store page
                updateOptions = {
                    updateType: IAUUpdateKind.FLEXIBLE,
                };
            }
            inAppUpdates.startUpdate(updateOptions);
        }
    }
    catch (error) {
        console.error(error);
    }
};
export { checkUpdateNeeded };
