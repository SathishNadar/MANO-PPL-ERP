import React from 'react';
import EmployeeRow from './EmployeeRow';

const AttendanceChart = ({ employees = [], selectedDate, onEmployeeClick }) => {

    const timeLabels = [
        '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
        '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM',
        '8 PM', '9 PM', '10 PM', '11 PM', '12 AM'
    ];

    return (
        <div className="bg-[#111827] rounded-xl p-6 flex flex-col h-full overflow-hidden">
            {/* Unified Scroll Container */}
            <div className="overflow-auto custom-scrollbar flex-1 relative">
                {/* Inner Container with calculated width: 17 total hours / 12 visible hours = 141.66% */}
                <div className="min-w-[141.66%] h-full flex flex-col relative">

                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 bg-[#111827] flex mb-2 h-8 flex-shrink-0 border-b border-gray-800">
                        <div className="w-48 flex-shrink-0 bg-[#111827] sticky left-0 z-30"></div> {/* Corner spacer if needed, or just let it scroll */}
                        <div className="flex-grow relative h-8">
                            {timeLabels.map((label, index) => (
                                <div
                                    key={index}
                                    className="absolute top-0 flex flex-col items-center"
                                    style={{
                                        left: `${(index / 17) * 100}%`,
                                        transform: index === 0 ? 'translateX(0%)' : index === timeLabels.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                                        alignItems: index === 0 ? 'flex-start' : index === timeLabels.length - 1 ? 'flex-end' : 'center'
                                    }}
                                >
                                    <span className="text-xs text-gray-500 mb-1">{label}</span>
                                    <div className="h-2 w-px bg-gray-800"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rows Area */}
                    <div className="relative flex-1">
                        {/* Vertical Grid Lines Background */}
                        <div className="absolute inset-0 flex pointer-events-none" style={{ zIndex: 0 }}>
                            <div className="w-48 flex-shrink-0 border-r border-gray-800/30 bg-[#111827] sticky left-0 z-10"></div>
                            <div className="flex-grow relative">
                                {Array.from({ length: 18 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="absolute top-0 bottom-0 border-l border-gray-800"
                                        style={{ left: `${(index / 17) * 100}%` }}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Employee Rows */}
                        <div className="relative z-10">
                            {employees.map((emp) => (
                                <EmployeeRow
                                    key={emp.id}
                                    employee={emp}
                                    name={emp.name}
                                    status={emp.status}
                                    statusColor={emp.statusColor}
                                    checkIn={emp.checkIn}
                                    checkOut={emp.checkOut}
                                    avatar={emp.avatar}
                                    selectedDate={selectedDate}
                                    onClick={() => onEmployeeClick(emp)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceChart;
