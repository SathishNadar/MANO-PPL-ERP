import { useState } from 'react';
import LoginForm from './Login';
import SignupForm from './Signup';
import ForgotPasswordForm from './ForgotPassword';

const AuthPage = () => {
  const [view, setView] = useState('login');

  return (
    <div className="auth-page">
      {view === 'login' && <LoginForm onSwitch={setView} />}
      {view === 'signup' && <SignupForm onSwitch={setView} />}
      {view === 'forgot' && <ForgotPasswordForm onSwitch={setView} />}
    </div>
  );
};

export default AuthPage;