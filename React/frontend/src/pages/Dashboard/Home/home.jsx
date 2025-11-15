import React from "react";
import Sidebar from "../../SidebarComponent/sidebar";
import { useAuth } from "../../../context/AuthContext";

function Home() {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;

  const username = user?.user_name || "";
  const role = user.title?.title_name || "unknown";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col justify-center items-center flex-1">
        <h1 className="text-2xl font-bold mb-2">Hello, {username}!</h1>

        <div className="text-center">
          <div className="text-3xl font-extrabold mt-2 mb-2">
            Welcome to MANO PPL
          </div>
        </div>

        <p className="text-lg">Your role: {role}</p>
      </div>
    </div>
  );
}

export default Home;
