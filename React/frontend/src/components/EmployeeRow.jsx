import React from 'react';

const EmployeeRow = ({ name, status, statusColor, checkIn, checkOut, avatar, selectedDate, onClick, employee }) => {
    // Timeline: 7 AM to 12 AM (midnight) = 17 hours
    const startHour = 7;
    const totalHours = 17;

    const calculatePosition = (timeStr) => {
        if (!timeStr) return 0;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        // Handle post-midnight times (e.g., 1 AM, 2 AM, 3 AM)
        // If it's AM and the hour is less than the start hour (7), it belongs to the next day.
        if (modifier === 'AM' && hours < startHour) {
            hours += 24;
        }

        const decimalTime = hours + (minutes || 0) / 60;
        return ((decimalTime - startHour) / totalHours) * 100;
    };

    // Use current time if checkOut is null (active session)
    const getCurrentTimeStr = () => {
        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getEffectiveCheckOut = (checkOutTime) => {
        if (checkOutTime) return checkOutTime;

        // Check if selectedDate is today
        const today = new Date();
        const isToday = selectedDate &&
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear();

        if (isToday) {
            return getCurrentTimeStr();
        } else {
            // If past date and no checkout, assume end of chart (12:00 AM)
            return '12:00 AM';
        }
    };

    // Render bars for all segments
    const renderSegmentBars = () => {
        // If employee has segments array, use that; otherwise use single checkIn/checkOut
        const segments = employee?.segments || [{ checkIn, checkOut }];

        return segments.map((segment, index) => {
            const effectiveCheckOut = getEffectiveCheckOut(segment.checkOut);
            const left = calculatePosition(segment.checkIn);
            const width = calculatePosition(effectiveCheckOut) - left;

            return (
                <div
                    key={index}
                    className="absolute h-4 top-2"
                    style={{
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.max(0, width)}%`,
                        backgroundColor: '#22c55e' // green-500
                    }}
                >
                </div>
            );
        });
    };

    return (
        <div className="flex items-center py-4 hover:bg-[#1f2937] transition-colors group">
            {/* Employee Info */}
            <div
                className="w-48 flex items-center gap-3 flex-shrink-0 pl-4 cursor-pointer sticky left-0 z-10 bg-[#111827] group-hover:bg-[#1f2937] transition-colors border-r border-gray-800/30"
                onClick={onClick}
            >
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-600 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
                    {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{name.charAt(0)}</div>}
                </div>
                <div>
                    <h3 className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">{name}</h3>
                    <p className={`text-xs ${statusColor === 'green' ? 'text-green-400' : 'text-red-400'}`}>{status}</p>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-xs text-white p-2 rounded shadow-lg border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    <div>In: <span className="font-semibold text-green-400">{checkIn || '--:--'}</span></div>
                    <div>Out: <span className="font-semibold text-red-400">{checkOut || '--:--'}</span></div>
                </div>
            </div>

            {/* Timeline Bar */}
            <div className="flex-grow relative h-8 bg-transparent">
                {renderSegmentBars()}
            </div>
        </div>
    );
};

export default EmployeeRow;
