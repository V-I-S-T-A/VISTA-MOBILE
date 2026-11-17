import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, motion, sizes, space } from '../../theme/tokens';

export default function SubPageHeader({ onBack, disabled = false }) {
  const navigation = useNavigation();
  const handleBack = onBack || (() => navigation?.goBack?.());

  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handleBack}
        disabled={disabled}
        activeOpacity={motion.pressedOpacity}
        style={[styles.backButton, disabled && { opacity: motion.disabledOpacity }]}
      >
        <Feather name="arrow-left" size={20} color={colors.navy} />
      </TouchableOpacity>
      <Image
        source={require('../../assets/logo.webp')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: sizes.accountHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.xs,
  },
  backButton: {
    width: sizes.touch,
    height: sizes.touch,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
  },
  spacer: {
    width: sizes.touch,
    height: sizes.touch,
  },
});
