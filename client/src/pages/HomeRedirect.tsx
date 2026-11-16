import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// "/" sends each role to its main screen
export default function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'owner' ? '/owner/today' : '/book'} replace />;
}
