import React, { useState, useEffect } from 'react'
import Sidebar from '../../SidebarComponent/sidebar'
function home() {
  const [username, setUsername] = useState('');
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUsername(parsed.username || '');
        setUserRoles(Array.isArray(parsed.designation) ? parsed.designation : (parsed.designation ? [parsed.designation] : []));
      } catch (e) {
        setUsername('');
        setUserRoles([]);
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar/>
      <div className="flex flex-col justify-center items-center flex-1">
        <h1 className="text-2xl font-bold mb-2">Hello, {username}!</h1>
        <div className="text-center">
          <div className="text-3xl font-extrabold mt-2 mb-2">Welcome to MANO PPL</div>
        </div>
        <p className="text-lg">
          Your role: {Array.isArray(userRoles) ? userRoles.join(', ') : userRoles}
        </p>
      </div>
    </div>
  );
}

export default home