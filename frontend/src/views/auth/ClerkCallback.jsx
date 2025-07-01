import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { clerkLogin } from '../../utils/auth';

const ClerkCallback = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isSignedIn) {
        console.log('Callback timeout, redirecting to login');
        navigate('/login?error=callback_timeout', { replace: true });
      }
    }, 10000);

    const handleCallback = async () => {
      console.log('ClerkCallback - Debug info:', {
        isLoaded,
        isSignedIn,
        clerk: !!clerk,
      });

      if (!isLoaded) {
        console.log('Clerk not loaded yet, waiting...');
        return;
      }

      if (isSignedIn) {
        try {
          const result = await clerkLogin();
          if (result.error) {
            console.error('Backend authentication failed:', result.error);
            navigate('/login?error=backend_auth_failed', { replace: true });
            return;
          }
          console.log('User signed in successfully, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Error during clerkLogin:', error);
          navigate('/login?error=backend_auth_failed', { replace: true });
        }
        return;
      }

      try {
        await clerk.handleRedirectCallback({
          redirectUrl: '/dashboard',
          continueSignUpUrl: '/dashboard',
        });
        if (clerk.user) {
          const result = await clerkLogin();
          if (result.error) {
            console.error('Backend authentication failed:', result.error);
            navigate('/login?error=backend_auth_failed', { replace: true });
            return;
          }
          navigate('/dashboard', { replace: true });
        } else {
          console.log('No user found after callback, redirecting to login');
          navigate('/login?error=callback_failed', { replace: true });
        }
      } catch (error) {
        console.error('Error handling Clerk callback:', error);
        navigate('/login?error=callback_failed', { replace: true });
      }
    };

    handleCallback();
    return () => clearTimeout(timeoutId);
  }, [isLoaded, isSignedIn, navigate, clerk]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div id="clerk-captcha" className="mb-4"></div> {/* Thêm phần tử clerk-captcha */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

export default ClerkCallback;