import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const containerRef = useRef();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("session");
    if (session) {
      setUsername(JSON.parse(session).username || "User");
    } else {
      alert("Kindly Login");
      navigate("/login");
    }

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [navigate]);

  function logout() {
    localStorage.removeItem("session");
    navigate("/login");
  }

  return (
    <aside className="w-20 bg-sidebar shadow-lg flex flex-col items-center py-5 relative">
      <img
        alt="Company logo"
        className="w-12 h-12 mb-6"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYqC4QedXgsQ36OpYtKvw2u3RQPZYjuKva5zvxhp1XXmjHo-pvNPPQ9RibgZoE_2d5L92HBZU76yv7YtL6qvkme3XVjo-jtVfUa7HczOkcw1A9yCYwlOAPlAOrlyT5KLe0f1G_k9rKeAQHW8M5kU3KU8zUSsveuJJNy4HVehGl_VVapT9ztvcVvuiY8f07VLwaF33NpgBWumDplhw5dNWrowPiQsFJVGQ51bJZR6mzeNYOnVR0SCsWQI05YxNftU4e2qKBshCIA75I"
      />

      <nav className="flex flex-col space-y-8">
        {[
          { icon: "home", path: "/dashboard/home" },
          { icon: "bar_chart" },
          { icon: "folder", path: "/dashboard/projects" },
          { icon: "receipt_long" },
          { icon: "summarize" },
          { icon: "wysiwyg", path: "/dashboard/work-in-progress" },
        ].map(({ icon, path }, idx) => (
          <button
            key={idx}
            onClick={() => path && navigate(path)}
            className="text-secondary hover:text-blue-light transition-all duration-300 transform hover:scale-110 cursor-pointer"
          >
            <span className="material-icons text-3xl">{icon}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto relative" ref={containerRef}>
        <img
          alt="User avatar"
          onClick={(e) => {
            e.stopPropagation();
            setShowPopup((prev) => !prev);
          }}
          className="w-10 h-10 rounded-full cursor-pointer transition-transform duration-300 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLfWyPP_yFAEG_gjAchak9ylgmyX8NDer_TYOCRBciD3o0EwO0w_xnK6RTdmrJbainVA5n-29GN4oIWWM62FwD6-kOZZQ8_3ymooziSk389zQ3B5j9bY2OjC_z9wh5pxpEKYdHOF3AYlR8A5w_lGWuYVtXGPQvTVSBLVtNWv0ZCojBMx_O-rpCZVwQjFVk3YkakHsyienX8VZgXDnYKsbtwph8bq3PgUWwFDhKmPIcP6NmG07p-oFgpltV8cjRP4Fw6qFaFlqUmUfK"
        />

        {showPopup && (
          <div className="absolute bottom-10 w-56 bg-[#1F2937] text-gray-200 shadow-xl rounded-xl z-50 p-4">
            <div className="text-sm font-semibold mb-3">{username}</div>
            <hr className="border-gray-600 mb-3" />
            <button className="block w-full text-left text-sm py-2 px-3 hover:bg-gray-700/60 rounded-md transition-colors duration-200 cursor-pointer">
              Profile
            </button>
            <button
              onClick={logout}
              className="block w-full text-left text-sm py-2 px-3 hover:bg-gray-700/60 rounded-md transition-colors duration-200 cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
