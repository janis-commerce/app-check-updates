import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Modal, ScreenActions, Typography} from '@janiscommerce/ui-native';
import {VersionCheckTexts} from './texts';
import useUpdateAction, {UpdateResult} from './useUpdateAction';

interface BlockingScreenProps {
	blockingDate: string;
	texts: VersionCheckTexts;
	onUpdate: () => Promise<UpdateResult>;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	message: {
		marginTop: 12,
	},
	feedback: {
		marginTop: 16,
	},
});

const BlockingScreen = ({blockingDate, texts, onUpdate}: BlockingScreenProps) => {
	const {isUpdating, feedback, handleUpdate} = useUpdateAction(onUpdate, texts);

	return (
		<Modal visible fullScreen canClose={false}>
			<View style={styles.container}>
				<View style={styles.content}>
					<Typography type="heading" size="medium">
						{texts.blockingTitle}
					</Typography>
					<Typography style={styles.message}>
						{texts.blockingMessage(new Date(blockingDate))}
					</Typography>
					{!!feedback && <Typography style={styles.feedback}>{feedback}</Typography>}
				</View>
				<ScreenActions
					actions={[{value: texts.updateButton, isLoading: isUpdating, onPress: handleUpdate}]}
				/>
			</View>
		</Modal>
	);
};

export default BlockingScreen;
