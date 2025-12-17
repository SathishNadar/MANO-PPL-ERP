import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const OrganisationChart = () => {
    const navigate = useNavigate();

    // --- Component: Level 1 & 2 Node (Avatar + Box) ---
    // Dark Mode: Translucent backgrounds, light text, dark avatar circles
    const MainNode = ({ title, subtitle, role, type = "purple", avatarInitial }) => {
        const colors = type === "purple"
            ? { border: "border-indigo-500", bg: "bg-indigo-900/40", text: "text-indigo-100", avatarBorder: "border-indigo-500", role: "text-indigo-300" }
            : { border: "border-blue-500", bg: "bg-blue-900/40", text: "text-blue-100", avatarBorder: "border-blue-500", role: "text-blue-300" };

        return (
            <div className="flex flex-col items-center relative z-20">
                {/* Avatar Circle */}
                <div className={`w-20 h-20 rounded-full border-4 ${colors.avatarBorder} bg-gray-800 flex items-center justify-center shadow-lg relative z-20 overflow-hidden`}>
                    <span className={`text-2xl font-bold ${colors.role}`}>{avatarInitial}</span>
                </div>
                {/* Connector Stem */}
                <div className="w-0.5 h-6 bg-gray-500 -mt-1 relative z-10"></div>

                {/* Box */}
                <div className={`min-w-[220px] px-4 py-3 border-2 ${colors.border} ${colors.bg} text-center shadow-xl backdrop-blur-sm relative z-20 rounded-lg`}>
                    <div className={`font-bold text-lg ${colors.text}`}>{title}</div>
                    <div className="text-xs uppercase font-semibold tracking-wider opacity-90 mt-1 text-gray-400">{subtitle}</div>
                    {role && <div className={`text-sm font-semibold mt-1 ${colors.role}`}>{role}</div>}
                </div>
            </div>
        );
    };

    // --- Component: Level 3 Node (Teal Box) ---
    const CategoryNode = ({ title, subtitle }) => {
        return (
            <div className="flex flex-col items-center relative z-20 w-48">
                <div className="w-full border-2 border-teal-500/70 bg-teal-900/30 px-2 py-4 text-center shadow-lg backdrop-blur-sm min-h-[80px] flex flex-col justify-center items-center rounded-lg">
                    <div className="font-bold text-teal-100 text-sm">{title}</div>
                    {subtitle && <div className="text-xs text-teal-300 mt-1">{subtitle}</div>}
                </div>
            </div>
        );
    };

    // --- Component: Level 4 Node (Green Box) ---
    const SubNode = ({ title, subtitle }) => {
        return (
            <div className="flex flex-col items-center relative z-20 w-40">
                <div className="w-full border-2 border-green-500/70 bg-green-900/30 px-2 py-3 text-center shadow-lg backdrop-blur-sm min-h-[70px] flex flex-col justify-center items-center rounded-lg">
                    <div className="font-bold text-green-100 text-xs">{title}</div>
                    {subtitle && <div className="text-[10px] text-green-300 mt-1">{subtitle}</div>}
                </div>
            </div>
        );
    };

    // --- Component: Level 5 Leaf Node (Gray Box) ---
    const LeafNode = ({ title }) => {
        return (
            <div className="w-32 border border-gray-600 bg-gray-800/80 px-2 py-3 text-center text-gray-300 text-xs font-semibold shadow-md rounded">
                {title}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto">
                <header className="mb-8">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 mb-4"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back</span>
                    </button>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                        Organisation Chart
                    </h1>
                </header>

                {/* Main Container - Dark Background with Border */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-16 overflow-x-auto min-h-[900px] flex justify-center">
                    <div className="flex flex-col items-center w-full max-w-[1400px]">

                        {/* 1. ROOT NODE */}
                        <div className="flex flex-col items-center">
                            <MainNode
                                title="30 Juin Hotel"
                                subtitle="Project Location"
                                role="Cango"
                                type="purple"
                                avatarInitial="30"
                            />
                            {/* Line Down */}
                            <div className="w-0.5 h-12 bg-gray-500"></div>
                        </div>

                        {/* 2. SECOND LEVEL NODE */}
                        <div className="flex flex-col items-center relative">
                            <MainNode
                                title="Mano Project"
                                subtitle="Pvt. Ltd."
                                role="Mr. Mugilan (Director)"
                                type="blue"
                                avatarInitial="M"
                            />
                            {/* Line Down to Splitter */}
                            <div className="w-0.5 h-12 bg-gray-500"></div>
                        </div>

                        {/* 3. THIRD LEVEL ROW */}
                        <div className="w-full flex justify-between relative px-10">
                            {/* Horizontal Line Connector */}
                            <div className="absolute top-0 left-20 right-20 h-0.5 bg-gray-500"></div>

                            {/* ITEM 1: GLOWMEX */}
                            <div className="flex flex-col items-center relative">
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <CategoryNode title="GLOWMEX LLP" subtitle="Processing" />
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <div className="flex flex-col items-center">
                                    <SubNode title="Mr. Jay Vaja" />
                                    <div className="w-0.5 h-4 bg-gray-500"></div>
                                    <LeafNode title="Mr. Samir Jasani" />
                                </div>
                            </div>

                            {/* ITEM 2: ARCHITECT */}
                            <div className="flex flex-col items-center relative">
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <CategoryNode title="Elemental Studio" subtitle="Architect" />
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <div className="flex flex-col items-center">
                                    <SubNode title="Mr. Keyur Khorasia" />
                                    <div className="w-0.5 h-4 bg-gray-500"></div>
                                    <LeafNode title="Civil Contractor" />
                                </div>
                            </div>

                            {/* ITEM 3: PMC / ADMIN (Center) */}
                            <div className="flex flex-col items-center relative">
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <CategoryNode title="PMC Staff" subtitle="Management" />
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <div className="flex gap-4 relative">
                                    <div className="absolute -top-0 left-4 right-4 h-0.5 bg-gray-500"></div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-4 bg-gray-500"></div>
                                        <SubNode title="Mr. Manoj" subtitle="Head" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-4 bg-gray-500"></div>
                                        <SubNode title="Shaveena" subtitle="Coord" />
                                    </div>
                                </div>
                            </div>

                            {/* ITEM 4: STRUCTURAL */}
                            <div className="flex flex-col items-center relative">
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <CategoryNode title="Enjinia" subtitle="Structural" />
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <div className="flex flex-col items-center">
                                    <SubNode title="Mr. Devang Chotalia" />
                                    <div className="w-0.5 h-4 bg-gray-500"></div>
                                    <div className="flex gap-2 relative">
                                        <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-gray-500"></div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-0.5 h-4 bg-gray-500"></div>
                                            <LeafNode title="Electrical" />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-0.5 h-4 bg-gray-500"></div>
                                            <LeafNode title="Plumbing" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ITEM 5: MEP */}
                            <div className="flex flex-col items-center relative">
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <CategoryNode title="Enjinia" subtitle="MEP" />
                                <div className="w-0.5 h-8 bg-gray-500"></div>
                                <div className="flex flex-col items-center">
                                    <SubNode title="Mr. Vaishal Shah" />
                                    <div className="w-0.5 h-4 bg-gray-500"></div>
                                    <LeafNode title="Firefighting" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrganisationChart;
