import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Modal, Typography} from '@janiscommerce/ui-native';
import {VersionCheckTexts} from './texts';
import useUpdateAction, {UpdateResult} from './useUpdateAction';

interface UpdatePromptModalProps {
	title: string;
	message: string;
	texts: VersionCheckTexts;
	onUpdate: () => Promise<UpdateResult>;
	onClose: () => void;
}

const styles = StyleSheet.create({
	container: {
		padding: 24,
	},
	message: {
		marginTop: 12,
		marginBottom: 24,
	},
	feedback: {
		marginTop: 16,
	},
	laterButton: {
		marginTop: 12,
	},
});

const UpdatePromptModal = ({title, message, texts, onUpdate, onClose}: UpdatePromptModalProps) => {
	const {isUpdating, feedback, handleUpdate} = useUpdateAction(onUpdate, texts);

	return (
		<Modal visible oncloseCallback={onClose}>
			<View style={styles.container}>
				<Typography type="heading" size="medium">
					{title}
				</Typography>
				<Typography style={styles.message}>{message}</Typography>
				<Button value={texts.updateButton} isLoading={isUpdating} onPress={handleUpdate} />
				<Button
					value={texts.laterButton}
					variant="text"
					style={styles.laterButton}
					onPress={onClose}
				/>
				{!!feedback && <Typography style={styles.feedback}>{feedback}</Typography>}
			</View>
		</Modal>
	);
};

export default UpdatePromptModal;
