import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Modal, ScreenActions, Typography} from '@janiscommerce/ui-native';
import {UpdateResult} from './updateApp';
import {VersionCheckTexts} from './texts';

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
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);

	const feedbackByResult: Partial<Record<UpdateResult, string>> = {
		unavailable: texts.updateUnavailable,
		failed: texts.updateFailed,
	};
	const feedback = updateResult && feedbackByResult[updateResult];

	const handleUpdate = async () => {
		setIsUpdating(true);
		setUpdateResult(await onUpdate());
		setIsUpdating(false);
	};

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
