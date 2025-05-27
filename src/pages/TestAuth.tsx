import { useAuth } from '../contexts/AuthContext';

export default function TestAuth() {
  const auth = useAuth();
  return <div>Auth user: {auth.user ? auth.user.email : 'none'}</div>;
} 