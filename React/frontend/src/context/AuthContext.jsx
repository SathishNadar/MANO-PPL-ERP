import { createContext, useState, useEffect, useContext} from 'react';
import React from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Move fetchUser definition OUTSIDE useEffect
  const fetchUser = async () => {
    try {
      const res = await fetch(`http://${API_URI}:${PORT}/auth/me`, { credentials: "include" });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    fetchUser();
    // Only called on mount
  }, []);

  const login = async (username, password, rememberMe = false) => {
    const response = await fetch(`http://${API_URI}:${PORT}/auth/login/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: username,
        user_password: password,
      }),
    });

    if (!response.ok) throw new Error(`Network error: ${response.status}`);
    const data = await response.json();
    if (!data.message === "Login successful") throw new Error(`Login Failed`);
    console.log("Login success")

    navigate("/dashboard/home");

    await fetchUser();

  };  

  const logout = async () => {
    await fetch(`http://${API_URI}:${PORT}/auth/logout/`, { method: "POST", credentials: "include" });
    setUser(null);
    navigate("/")
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
