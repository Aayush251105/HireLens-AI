import { RouteObject } from 'react-router-dom';
import HomePage from './pages/index';
import ProfilePage from './pages/profile';
import SignInPage from './pages/sign-in';
import SignUpPage from './pages/sign-up';

// Lazy load components for code splitting (except HomePage for instant loading)
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
    <h1 className="text-4xl font-bold mb-2">404</h1>
    <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    <a href="/" className="mt-4 text-primary hover:underline font-medium">Back to Home</a>
  </div>
);

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/sign-in/*', element: <SignInPage /> },
  { path: '/sign-up/*', element: <SignUpPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export type Path = '/' | '/profile' | '/sign-in' | '/sign-up';
export type Params = Record<string, string | undefined>;
