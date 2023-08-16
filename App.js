import React from 'react';
import {View, Text} from 'react-native';
import {checkUpdateNeeded} from './src';

const App = () => {
  checkUpdateNeeded();

  return (
    <View>
      <Text>checkUpdateNeeded</Text>
    </View>
  );
};

export default App;
