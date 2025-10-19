import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Centralized icon mapping for easy updates/consistency
const ICONS = {
  home: "home",
  projects: "folder",
  reports: "bar_chart",
  vendors: "receipt_long",
  contractors: "engineering",
  consultants: "support_agent",
  suppliers: "local_shipping",
  work: "wysiwyg",
  // Add new keys here as needed
};

const MENU_ITEMS = [
  {
    id: "home",
    label: "Home",
    path: "/dashboard/home",
    icon: ICONS.home,
    allowedTitles: ["client", "admin", "new_user"],
  },
  {
    id: "projects",
    label: "Projects",
    path: "/dashboard/projects",
    icon: ICONS.projects,
    allowedTitles: ["client", "admin"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: ICONS.reports,
    allowedTitles: ["client", "admin"],
    // path can be added if there's a specific reports route
  },
  {
    id: "vendors",
    label: "Vendors",
    icon: ICONS.vendors,
    allowedTitles: ["admin"],
    children: [
      { label: "Contractors", icon: ICONS.contractors, category: "2" },
      { label: "Consultants", icon: ICONS.consultants, category: "1" },
      { label: "Suppliers", icon: ICONS.suppliers, category: "3" },
    ],
  },
  {
    id: "work",
    label: "Work In Progress",
    path: "/dashboard/work-in-progress",
    icon: ICONS.work,
    allowedTitles: ["admin"],
  },
  // Add/modify menu items as logic and new pages evolve
];

function Sidebar({ onCategoryChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryParam = new URLSearchParams(location.search).get("category");
  const [showPopup, setShowPopup] = useState(false);
  const containerRef = useRef();
  const [activeMenu, setActiveMenu] = useState("");

  const { user, logout } = useAuth();

  // --- Changes: use title_name string for role checks, not id ---
  const userRole = user?.title?.title_name; // e.g. 'admin', 'client', etc.

  // --- Filter menu items by user's allowed roles ---
  const filteredMenuItems = MENU_ITEMS.filter(item =>
    item.allowedTitles.includes(userRole)
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <aside className="w-20 bg-sidebar shadow-lg flex flex-col items-center py-5 relative">
      <img
        alt="Company logo"
        className="w-7 h-12 mb-6 hover:cursor-pointer"
        src="/mano.svg"
      />

      <nav className="flex flex-col space-y-8">
        {filteredMenuItems.map((item, idx) => (
          <div key={item.id} className="w-full relative group">
            {/* --- Handle click navigation or dropdown --- */}
            <button
              onClick={() => {
                if (item.id === "vendors") {
                  setActiveMenu(prev => (prev === "vendors" ? "" : "vendors"));
                  if (!location.pathname.includes("/dashboard/vendors")) {
                    navigate("/dashboard/vendors?category=2");
                  }
                } else if (item.path) {
                  navigate(item.path);
                  setActiveMenu(""); // Collapse dropdown
                }
              }}
              className={`text-secondary hover:text-blue-light transition-all duration-300 transform hover:scale-110 cursor-pointer w-full flex justify-center ${
                location.pathname.includes(item.id) ? "text-blue-light" : ""
              }`}
            >
              <span className="material-icons text-3xl">{item.icon}</span>
            </button>

            {/* --- Tooltip --- */}
            <span className="absolute top-1/2 left-full ml-2 -translate-y-1/2 w-max rounded bg-gray-700 px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 select-none">
              {item.label}
            </span>

            {/* --- Dropdown submenu for vendors (dynamic, clean icons) --- */}
            {item.id === "vendors" && activeMenu === "vendors" && (
              <div className="mt-4 flex flex-col space-y-5 transition-all duration-300 ease-in-out">
                {item.children.map(child => (
                  <button
                    key={child.label}
                    onClick={() => {
                      navigate(`/dashboard/vendors?category=${child.category}`);
                      onCategoryChange(Number(child.category));
                      setActiveMenu("vendors");
                    }}
                    className={`flex items-center gap-2 text-xs px-2 text-left transition-colors duration-200 ${
                      categoryParam === child.category
                        ? "text-blue-light font-semibold"
                        : "text-gray-300 hover:text-blue-light"
                    }`}
                  >
                    <span className="material-icons text-[26px] ml-2">
                      {child.icon}
                    </span>
                    {child.label}
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
          onClick={e => {
            e.stopPropagation();
            setShowPopup(prev => !prev);
          }}
          className="w-10 h-10 rounded-full cursor-pointer transition-transform duration-300 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLfWyPP_yFAEG_gjAchak9ylgmyX8NDer_TYOCRBciD3o0EwO0w_xnK6RTdmrJbainVA5n-29GN4oIWWM62FwD6-kOZZQ8_3ymooziSk389zQ3B5j9bY2OjC_z9wh5pxpEKYdHOF3AYlR8A5w_lGWuYVtXGPQvTVSBLVtNWv0ZCojBMx_O-rpCZVwQjFVk3YkakHsyienX8VZgXDnYKsbtwph8bq3PgUWwFDhKmPIcP6NmG07p-oFgpltV8cjRP4Fw6qFaFlqUmUfK"
        />

        {showPopup && (
          <div className="absolute bottom-10 w-56 bg-[#1F2937] text-gray-200 shadow-xl rounded-xl z-50 p-4">
            <div className="text-sm font-semibold mb-3">{user.user_name}</div>
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
