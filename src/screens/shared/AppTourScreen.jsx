import OnboardingScreen from '../auth/OnboardingScreen';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

// Replay stays inside the authenticated stack; it never clears completion or tokens.
export default function AppTourScreen({ navigation }) {
  const { role } = useAuth();
  return <OnboardingScreen replay initialAudience={role === ROLES.STUDENT ? 'student' : 'staff'} onComplete={() => navigation.goBack()} />;
}
