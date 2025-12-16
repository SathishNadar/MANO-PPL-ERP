import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const MinutesList = () => {
    const navigate = useNavigate();

    // Mock data with 10 items
    const minutesData = Array.from({ length: 10 }, (_, i) => {
        const date = new Date(2023, 11, 15 - i);
        return {
            id: i + 1,
            subject: `Minutes - ${i + 1}`,
            date: date.toISOString().split('T')[0],
            fullDate: date,
            time: "11:00 AM",
            status: "Approved",
            author: "Mano"
        };
    });

    const getStatusClasses = (status) => {
        switch (status) {
            case "Approved":
                return "bg-green-900 text-green-300";
            case "Pending":
                return "bg-yellow-900 text-yellow-300";
            default:
                return "bg-gray-700 text-gray-300";
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-md transition-all duration-200 border border-gray-700"
                            onClick={() => navigate(-1)}
                        >
                            <span className="material-icons">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Minutes of Meeting
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                A log of project-related meetings and key discussions.
                            </p>
                        </div>
                    </div>
                    <button
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-200 flex items-center space-x-2"
                    // onClick={() => navigate('/dashboard/minutes/new')} 
                    >
                        <span className="material-icons text-xl">add</span>
                        <span>New MoM</span>
                    </button>
                </header>

                <div className="space-y-4">
                    {minutesData.map((item) => {
                        const date = new Date(item.fullDate);
                        const dateStr = date.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        });

                        return (
                            <a
                                key={item.id}
                                onClick={() => navigate(`/dashboard/minutes/${item.id}`)}
                                className={`group flex justify-between items-center p-5 rounded-xl transition-all duration-300 cursor-pointer 
                                    bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 hover:shadow-lg hover:translate-x-1`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-full bg-gray-900/50 flex items-center justify-center border border-gray-700 group-hover:border-gray-600 transition-colors">
                                        <span className="material-icons text-gray-400 group-hover:text-white transition-colors text-xl">description</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg text-gray-200 group-hover:text-white transition-colors">
                                            {item.subject}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                                    <span className="material-icons text-base">event</span>
                                    <span className="font-medium">{dateStr}</span>
                                    <span className="material-icons text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-300">chevron_right</span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default MinutesList;
