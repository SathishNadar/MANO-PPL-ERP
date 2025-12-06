import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Sidebar({ onCategoryChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryParam = new URLSearchParams(location.search).get("category");
  const [showPopup, setShowPopup] = useState(false);
  const containerRef = useRef();
  const [username, setUsername] = useState("");
  const [activeMenu, setActiveMenu] = useState(""); // for dropdown toggle
  const [titleId, setTitleId] = useState(null); // user title id (number)

  useEffect(() => {
    const session = localStorage.getItem("session");
    if (session) {
      const sessionData = JSON.parse(session);
      setUsername(sessionData.username || "User");
      setTitleId(sessionData.title_id || null);
    } else {
      alert("Kindly Login");
      navigate("/auth");
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
    navigate("/auth");
  }

  // Title ID map for roles
  const TITLE_MAP = {
    1: "client",
    2: "admin",
    3: "developer",
    4: "ceo",
    5: "engineer",
    6: "new_user",
  };

  const menuItems = [
    {
      icon: "home",
      path: "/dashboard/home",
      id: "home",
      label: "Home",
      roles: [1, 2, 6, 5],
    },
    {
      icon: "folder",
      path: "/dashboard/projects",
      id: "projects",
      label: "Projects",
      roles: [1, 2, 5],
    },

    {
      icon: "receipt_long",
      id: "vendors",
      label: "Vendors",
      roles: [2],
      children: [
        { label: "Contractors", category: "2" },
        { label: "Consultants", category: "1" },
        { label: "Suppliers", category: "3" },
      ],
    },

    {
      icon: "wysiwyg",
      path: "/dashboard/work-in-progress",
      id: "work",
      label: "Work In Progress",
      roles: [2, 5],
    },

    { icon: "bar_chart", 
      path: "/dashboard/attendance", 
      id: "attendance", 
      label: "Attendance", 
      roles: [2] 
    },

    {
      icon: "admin_panel_settings",
      path: "/dashboard/admin",
      id: "admin",
      label: "Admin",
      roles: [2],
    },
    // { icon: "summarize", id: "summary", label: "Summary", roles: [2] },
  ];

  // Filter menu items based on titleId
  let filteredMenuItems = [];
  if (titleId) {
    filteredMenuItems = menuItems.filter((item) =>
      item.roles.includes(titleId)
    );
  }

  return (
    <aside className="w-20 bg-sidebar shadow-lg flex flex-col items-center py-5 relative">
      <img
        alt="Company logo"
        className="w-7 h-12 mb-6 hover:cursor-pointer"
        src="/mano.svg"
      />

      <nav className="flex flex-col space-y-8">
        {filteredMenuItems.map(({ icon, path, id, children, label }, idx) => (
          <div key={idx} className="w-full relative group">
            <button
              onClick={() => {
                if (id === "vendors") {
                  setActiveMenu((prev) => {
                    if (prev === "vendors") return ""; // collapse dropdown
                    if (!location.pathname.includes("/dashboard/vendors")) {
                      navigate("/dashboard/vendors?category=2");
                    }
                    return "vendors"; // open dropdown
                  });
                } else {
                  path && navigate(path);
                  setActiveMenu(""); // collapse dropdown on other clicks
                }
              }}
              className={`text-secondary hover:text-blue-light transition-all duration-300 transform hover:scale-110 cursor-pointer w-full flex justify-center ${
  /* prefer matching by explicit `path` when available to avoid substring collisions like 'admin' */
  path
    ? (location.pathname === path || location.pathname.startsWith(path + "/") ? "text-blue-light" : "")
    : (location.pathname.includes(id) ? "text-blue-light" : "")
}`}
            >
              <span className="material-icons text-[42px]">{icon}</span>
            </button>

            {/* Tooltip */}
            <span className="absolute top-1/2 left-full ml-2 -translate-y-1/2 w-max rounded bg-gray-700 px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 select-none">
              {label}
            </span>

            {/* Dropdown submenu for vendors */}
            {id === "vendors" && activeMenu === "vendors" && (
              <div className="mt-4 flex flex-col space-y-5 transition-all duration-300 ease-in-out">
                {children.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(`/dashboard/vendors?category=${item.category}`);
                      onCategoryChange(parseInt(item.category, 10));
                      setActiveMenu("vendors"); // keep dropdown open
                    }}
                    className={`flex items-center gap-2 text-xs px-2 text-left transition-colors duration-200 ${categoryParam === item.category
                      ? "text-blue-light font-semibold"
                      : "text-gray-300 hover:text-blue-light"
                      }`}
                  >
                    <span className="material-icons text-[34px] ml-2">
                      {item.label === "Contractors"
                        ? "engineering"
                        : item.label === "Consultants"
                          ? "support_agent"
                          : "local_shipping"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
