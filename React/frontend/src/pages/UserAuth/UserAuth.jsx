import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthPage = () => {
  const [view, setView] = useState('login'); // can be 'login', 'signup', 'forgot'

  return (
    <div className="auth-page">
      {view === 'login' && <LoginForm onSwitch={setView} />}
      {view === 'signup' && <SignupForm onSwitch={setView} />}
      {view === 'forgot' && <ForgotPasswordForm onSwitch={setView} />}
    </div>
  );
};

export default AuthPage;