import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import CustomDatePicker from './CustomDatePicker';

const FilterBar = ({ selectedDate, onDateChange, searchTerm, onSearchChange }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-white">Today's Log</h2>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-grow md:flex-grow-0">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-[#1f2937] text-gray-300 pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 w-full md:w-64"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <button className="flex items-center gap-2 bg-[#1f2937] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">
                        <FiFilter />
                        <span>All Employees</span>
                    </button>
                </div>

                {/* Date Picker */}
                <CustomDatePicker selectedDate={selectedDate} onChange={onDateChange} />
            </div>
        </div>
    );
};

export default FilterBar;
