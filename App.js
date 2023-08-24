import React from 'react';
import {View, Text} from 'react-native';
import appCheckUpdates from './src';

const App = () => {
	appCheckUpdates();

	return (
		<View>
			<Text>app check updates</Text>
		</View>
	);
};

export default App;
