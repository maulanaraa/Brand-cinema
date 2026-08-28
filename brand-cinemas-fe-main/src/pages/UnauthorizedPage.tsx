import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-dark-950">
      <div className="text-center max-w-md">
        <ShieldAlert className="h-16 w-16 text-primary-500 dark:text-primary-400 mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-4 text-gray-900 dark:text-white">Unauthorized</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6">
          This demo route is reserved for the mock admin role. Frontend route guards are not security controls.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-secondary">Back Home</Link>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
