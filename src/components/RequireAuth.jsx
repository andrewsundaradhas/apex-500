import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../api/client.js';

export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!auth.isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
