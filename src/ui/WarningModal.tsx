import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Modal, Typography} from '@janiscommerce/ui-native';
import {VersionCheckTexts} from './texts';

interface WarningModalProps {
	blockingDate: string;
	texts: VersionCheckTexts;
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
});

const WarningModal = ({blockingDate, texts, onClose}: WarningModalProps) => (
	<Modal visible oncloseCallback={onClose}>
		<View style={styles.container}>
			<Typography type="heading" size="medium">
				{texts.warningTitle}
			</Typography>
			<Typography style={styles.message}>{texts.warningMessage(new Date(blockingDate))}</Typography>
			<Button value={texts.warningButton} onPress={onClose} />
		</View>
	</Modal>
);

export default WarningModal;
