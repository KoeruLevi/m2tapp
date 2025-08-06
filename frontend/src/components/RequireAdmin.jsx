import { useUser } from '../context/UserContext';
import { Navigate } from 'react-router-dom';

const RequireAdmin = ({ children }) => {
    const { user } = useUser();
    if (!user || user.rol !== "admin") return <Navigate to="/dashboard" />;
    return children;
};
export default RequireAdmin;