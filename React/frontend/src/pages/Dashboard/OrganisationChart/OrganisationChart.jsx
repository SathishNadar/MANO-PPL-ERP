import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

// --- Helper Functions ---
const getCategory = (jobNature) => {
    if (!jobNature) return "Suppliers";
    const nature = jobNature.toLowerCase();
    if (nature.includes("architect") || nature.includes("consultant") || nature.includes("structure") || nature.includes("mep") || nature.includes("design") || nature.includes("engineer")) {
        return "Consultants";
    }
    if (nature.includes("contractor") || nature.includes("civil") || nature.includes("electrical") || nature.includes("plumbing") || nature.includes("fire") || nature.includes("construction") || nature.includes("builder")) {
        return "Constructors";
    }
    return "Suppliers";
};

// --- Sub-Components ---

// Component: Level 1 & 2 Node (Avatar + Box)
const MainNode = ({ title, subtitle, role, type = "purple", avatarInitial }) => {
    const colors = type === "purple"
        ? { border: "border-indigo-500", bg: "bg-indigo-900/40", text: "text-indigo-100", avatarBorder: "border-indigo-500", role: "text-indigo-300" }
        : { border: "border-blue-500", bg: "bg-blue-900/40", text: "text-blue-100", avatarBorder: "border-blue-500", role: "text-blue-300" };

    return (
        <div className="flex flex-col items-center relative z-20 h-full">
            <div className="w-0.5 h-0 bg-transparent absolute -top-8 left-1/2 -translate-x-1/2" id="node-top"></div>

            <div className={`w-20 h-20 rounded-full border-4 ${colors.avatarBorder} bg-gray-800 flex items-center justify-center shadow-lg relative z-20 overflow-hidden shrink-0`}>
                <span className={`text-2xl font-bold ${colors.role}`}>{avatarInitial}</span>
            </div>
            <div className="w-0.5 h-6 bg-gray-500 -mt-1 relative z-10 shrink-0"></div>
            <div className={`min-w-[220px] px-4 py-3 border-2 ${colors.border} ${colors.bg} text-center shadow-xl backdrop-blur-sm relative z-20 rounded-lg flex-1 flex flex-col`}>
                <div className={`font-bold text-lg ${colors.text}`}>{title}</div>
                <div className="text-xs uppercase font-semibold tracking-wider opacity-90 mt-1 text-gray-400">{subtitle}</div>
                {role && <div className={`text-sm font-semibold mt-1 ${colors.role} mt-auto`}>{role}</div>}
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full h-6 w-0.5 bg-gray-500"></div>
        </div>
    );
};

// Component: Level 3 Category Node
// Updated CategoryNode component - FIXED CONNECTIONS
const CategoryNode = ({ title, subtitle }) => {
    return (
        <div className="flex flex-col items-center relative z-20 w-36">
            {/* Input Connector from above - PERFECT ALIGNMENT */}

            {/* Category Box - Tighter spacing, perfect bottom connection */}
            <div className="w-full border border-teal-500/50 bg-teal-900/60 shadow-lg backdrop-blur-sm flex flex-col items-center rounded overflow-hidden relative z-20">
                <div className="w-full bg-teal-800/80 py-1 text-center border-b border-teal-500/30">
                    <div className="font-bold text-teal-100 text-xs uppercase tracking-wider px-1">{title}</div>
                </div>
                {subtitle && <div className="py-0.5 px-2 text-[10px] text-teal-200">{subtitle}</div>}
            </div>

            {/* Output Connector - EXTENDS FULL HEIGHT to SectorGroup */}
            <div className="w-0.5 h-10 bg-gray-500 relative z-10"></div>
        </div>
    );
};


// Component: Level 4 Vendor Node (Left-Aligned, Larger)
const VendorNode = ({ vendor, contacts, lastItem, firstItem }) => {
    return (
        <div className="relative flex items-start z-20">
            {/* SPINE SEGMENTS */}

            {/* 1. UP Segment: Connects to bridge (if first) or previous node */}
            {firstItem ? (
                // First Item: Go up to bridge level (-16px). Branch is at 25px. Height 41px.
                <div className="absolute left-[-24px] top-[-16px] h-[41px] w-0.5 bg-gray-500"></div>
            ) : (
                // Other Items: Go up to cover gap (32px). Branch is at 25px. Height 57px.
                <div className="absolute left-[-24px] top-[-32px] h-[57px] w-0.5 bg-gray-500"></div>
            )}

            {/* 2. DOWN Segment: Connects to next node */}
            {!lastItem && (
                // Start at branch (25px) and go down to bottom of this node.
                <div className="absolute left-[-24px] top-[25px] bottom-0 w-0.5 bg-gray-500"></div>
            )}

            {/* Connection: Horizontal line from Left Spine to Vendor Box */}
            <div className="absolute left-[-24px] top-[25px] w-6 h-0.5 bg-gray-500"></div>

            <div className="w-48 border-2 border-green-500/70 bg-green-900/30 px-3 py-3 text-center shadow-lg backdrop-blur-sm rounded-lg relative z-20 flex flex-col justify-center min-h-[50px]">
                <div className="font-bold text-green-100 text-sm truncate w-full" title={vendor.company_name}>{vendor.company_name}</div>
                <div className="text-[11px] text-green-300 mt-1 truncate">{vendor.job_nature}</div>
            </div>

            {contacts && contacts.length > 0 && (
                <div className="flex items-start ml-0">
                    <div className="w-8 h-0.5 bg-gray-500 mt-[25px]"></div>

                    <div className="flex flex-col gap-2 relative">
                        {contacts.length > 1 && (
                            <div className={`absolute left-0 top-6 bottom-6 w-0.5 bg-gray-500`}></div>
                        )}

                        {contacts.map((contact, idx) => {
                            const isSingle = contacts.length === 1;
                            return (
                                <div key={contact.pd_id} className="relative flex items-center">
                                    {!isSingle && <div className="w-4 h-0.5 bg-gray-500"></div>}
                                    {isSingle && <div className="w-0 h-0.5 bg-gray-500"></div>}

                                    <div className="w-44 border border-gray-600 bg-gray-800/80 px-2 py-2 text-center text-gray-200 text-xs font-semibold shadow-md rounded relative z-20">
                                        {contact.contact_person}
                                        {contact.designation && <div className="text-[10px] text-gray-400 mt-0.5">{contact.designation}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Component: Sector Group (Left-Aligned Spine)
const SectorGroup = ({ title, subtitle, items }) => {
    return (
        <div className="flex flex-col items-center flex-1 min-w-0 relative">
            <CategoryNode title={title} subtitle={subtitle} />

            {items.length > 0 && (
                <div className="relative flex flex-col items-start w-full pl-6 mt-4">
                    {/* Bridge from CategoryNode (above items) to Left Spine */}
                    {/* CategoryNode bottom is ~8px above this div top. Bridge at -16px ensures overlap. */}
                    <div className="absolute top-[-16px] left-[24px] right-[50%] h-0.5 bg-gray-500"></div>

                    {/* Global Vertical Spine REMOVED - Handled by VendorNode segments */}

                    <div className="flex flex-col gap-8 w-full items-start">
                        {items.map((item, idx) => (
                            <div key={item.vendor.vendor_id} className="relative z-10 pl-6">
                                <VendorNode
                                    vendor={item.vendor}
                                    contacts={item.contacts}
                                    lastItem={idx === items.length - 1}
                                    firstItem={idx === 0}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {items.length === 0 && <span className="text-gray-500 text-[10px] mt-2">No items</span>}
        </div>
    );
};

// --- Main Component ---
const OrganisationChart = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrganizationData();
    }, [projectId]);

    const fetchOrganizationData = async () => {
        try {
            const response = await fetch(`${API_BASE}/projectOrganization/${projectId}`, { credentials: 'include' });
            if (response.ok) {
                const result = await response.json();
                console.log("Org Data:", result);
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching organization data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading Chart...</div>;
    if (!data) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">No Data Found</div>;

    // Process Data
    const sectors = {
        Consultants: [],
        Constructors: [],
        Suppliers: []
    };

    if (data && data.vendors) {
        data.vendors.forEach(vendor => {
            const cat = getCategory(vendor.job_nature);
            const vendorContacts = data.directory ? data.directory.filter(d => d.vendor_id === vendor.vendor_id) : [];
            if (sectors[cat]) {
                sectors[cat].push({ vendor, contacts: vendorContacts });
            }
        });
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 bg-gray-900 overflow-auto h-full flex flex-col">
                <header className="flex-none mb-4">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 text-sm rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 mb-2"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-icons text-sm">arrow_back</span>
                        <span>Back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Organisation Chart
                    </h1>
                </header>

                <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-8 overflow-auto relative">
                    <div className="flex flex-col items-center min-w-max mx-auto pb-16">

                        {/* 1. TOP LEVEL: Client - Project - PMC */}
                        <div className="relative w-fit mx-auto mb-16">
                            {/* Global Horizontal Line Removed - Replaced by per-node segments */}

                            {/* Main Dropper REMOVED - Replaced by Super Dropper in Project Node */}

                            <div className="flex justify-center items-stretch gap-16">
                                <div className="relative">
                                    {/* Line: Center to Right (Gap is 64px, so +64px for overlap) */}
                                    <div className="absolute bottom-[-24px] left-1/2 right-[-64px] h-0.5 bg-gray-500"></div>
                                    <MainNode
                                        title={data?.client_name || "Client Name"}
                                        subtitle="Client"
                                        role="Employer"
                                        type="blue"
                                        avatarInitial={data?.client_name ? data.client_name.charAt(0) : "C"}
                                    />
                                </div>


                                <div className="relative">
                                    {/* Line: Left to Right (Full span across node + overlap gaps) */}
                                    <div className="absolute bottom-[-24px] left-[-64px] right-[-64px] h-0.5 bg-gray-500"></div>

                                    {/* SUPER DROPPER: Continuous line from Project Node to Sector Line (Overlaps MainNode stick) */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-[64px] bg-gray-500 z-10"></div>

                                    <MainNode
                                        title={data?.project_name || "Project Name"}
                                        subtitle={data?.project_location || "Location"}
                                        role="Project Site"
                                        type="purple"
                                        avatarInitial={data?.project_name ? data.project_name.charAt(0) : "P"}
                                    />
                                </div>

                                <div className="relative">
                                    {/* Line: Left to Center (Overlap gap 64px) */}
                                    <div className="absolute bottom-[-24px] left-[-64px] right-1/2 h-0.5 bg-gray-500"></div>
                                    <MainNode
                                        title="Mano Project"
                                        subtitle="Pvt. Ltd."
                                        role="PMC"
                                        type="blue"
                                        avatarInitial="M"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. THIRD LEVEL ROW: Sectors */}
                        <div className="w-fit mx-auto flex justify-center items-start relative px-4 gap-8">
                            {/* Horizontal Line Spanning Sectors Top - REMOVED */}

                            {/* Removed redundant Center-Up connection */}

                            <div className="relative flex-1 flex justify-center">
                                {/* Vertical Dropper Restored (h-6 to stop at border) */}
                                <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-500"></div>
                                {/* Horizontal Line: Center to Right (Overlaps gap 32px) */}
                                <div className="absolute top-[-24px] left-1/2 right-[-32px] h-0.5 bg-gray-500"></div>
                                <SectorGroup title="Consultants" subtitle="Design & PMC" items={sectors.Consultants} />
                            </div>

                            {/* SECTOR 2: Constructors */}
                            <div className="relative flex-1 flex justify-center">
                                {/* Vertical Dropper REMOVED - Connected by Super Dropper */}
                                {/* Horizontal Line: Full width + overlap gaps */}
                                <div className="absolute top-[-24px] left-[-32px] right-[-32px] h-0.5 bg-gray-500"></div>
                                <SectorGroup title="Constructors" subtitle="Execution" items={sectors.Constructors} />
                            </div>

                            {/* SECTOR 3: Suppliers */}
                            <div className="relative flex-1 flex justify-center">
                                {/* Vertical Dropper Restored (h-6 to stop at border) */}
                                <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-500"></div>
                                {/* Horizontal Line: Left to Center (Overlaps gap 32px) */}
                                <div className="absolute top-[-24px] left-[-32px] right-1/2 h-0.5 bg-gray-500"></div>
                                <SectorGroup title="Suppliers" subtitle="Material & Goods" items={sectors.Suppliers} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrganisationChart;
