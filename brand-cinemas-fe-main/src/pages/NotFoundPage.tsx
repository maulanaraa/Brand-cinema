import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-dark-950">
      <div className="text-center max-w-md">
        <Film className="h-16 w-16 text-primary-500 dark:text-primary-400 mx-auto mb-6" />
        <h1 className="text-4xl font-display font-bold mb-4 text-gray-900 dark:text-white">Page Not Found</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6">The screen you are looking for is not in this frontend starter.</p>
        <Link to="/" className="btn btn-primary">Return Home</Link>
      </div>
    </div>
  );
}
