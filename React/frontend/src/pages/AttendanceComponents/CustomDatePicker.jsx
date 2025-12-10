import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CustomDatePicker = ({ selectedDate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Remove internal selectedDate state
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Default to current month
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const daysArray = [...Array(days).keys()].map(i => i + 1);
    const emptyDays = [...Array(firstDay).keys()];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onChange(newDate);
        setIsOpen(false);
    };

    const isSelected = (day) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear();
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#1f2937] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
            >
                <FiCalendar />
                <span>{formatDate(selectedDate)}</span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1f2937] border border-gray-700 rounded-xl shadow-xl p-4 z-50">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-700 rounded-full text-gray-400">
                            <FiChevronLeft />
                        </button>
                        <span className="text-white font-semibold">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-700 rounded-full text-gray-400">
                            <FiChevronRight />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {emptyDays.map(i => (
                            <div key={`empty-${i}`} className="p-2"></div>
                        ))}
                        {daysArray.map(day => (
                            <button
                                key={day}
                                onClick={() => handleDateClick(day)}
                                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors mx-auto
                  ${isSelected(day)
                                        ? 'bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30'
                                        : 'text-gray-300 hover:bg-gray-700'}
                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
