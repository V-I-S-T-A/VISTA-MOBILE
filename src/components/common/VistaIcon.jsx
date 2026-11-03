import { Feather } from '@expo/vector-icons';
import { colors, sizes } from '../../theme/tokens';

// One outline family for shared navigation, notifications and document controls.
export default function VistaIcon({ name, size = sizes.icon, color = colors.text, ...props }) {
  return <Feather name={name} size={size} color={color} {...props} />;
}
