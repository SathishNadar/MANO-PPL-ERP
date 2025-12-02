import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin } from 'react-icons/fi';

const AttendanceDetailsModal = ({ isOpen, onClose, employee }) => {
    const [segmentAddresses, setSegmentAddresses] = useState([]);

    useEffect(() => {
        if (isOpen && employee) {
            // Reset addresses
            setSegmentAddresses([]);

            // If employee has segments, fetch addresses for all
            if (employee.segments && employee.segments.length > 0) {
                const fetchAllAddresses = async () => {
                    const addresses = await Promise.all(
                        employee.segments.map(async (segment) => {
                            const timeInAddr = segment.timeInLat && segment.timeInLng
                                ? await fetchAddress(segment.timeInLat, segment.timeInLng)
                                : 'Location not available';

                            const timeOutAddr = segment.timeOutLat && segment.timeOutLng
                                ? await fetchAddress(segment.timeOutLat, segment.timeOutLng)
                                : 'Location not available';

                            return {
                                checkIn: segment.checkIn,
                                checkOut: segment.checkOut,
                                timeInAddress: timeInAddr,
                                timeOutAddress: timeOutAddr
                            };
                        })
                    );
                    setSegmentAddresses(addresses);
                };
                fetchAllAddresses();
            } else {
                // Fallback for single check-in/out
                const fetchSingleAddress = async () => {
                    const timeInAddr = employee.timeInLat && employee.timeInLng
                        ? await fetchAddress(employee.timeInLat, employee.timeInLng)
                        : 'Location not available';

                    const timeOutAddr = employee.timeOutLat && employee.timeOutLng
                        ? await fetchAddress(employee.timeOutLat, employee.timeOutLng)
                        : 'Location not available';

                    setSegmentAddresses([{
                        checkIn: employee.checkIn,
                        checkOut: employee.checkOut,
                        timeInAddress: timeInAddr,
                        timeOutAddress: timeOutAddr
                    }]);
                };
                fetchSingleAddress();
            }
        }
    }, [isOpen, employee]);

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            return data.display_name || 'Address not found';
        } catch (error) {
            console.error('Error fetching address:', error);
            return 'Error fetching address';
        }
    };

    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1f2937] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                            {employee.avatar ? (
                                <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                    {employee.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">{employee.name}</h3>
                            <p className="text-sm text-gray-400">{employee.date}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Status */}
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${employee.statusColor === 'green'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${employee.statusColor === 'green' ? 'bg-green-400' : 'bg-red-400'
                                }`}></span>
                            {employee.status}
                        </span>
                    </div>

                    {/* All Segments */}
                    {segmentAddresses.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">Attendance Records ({segmentAddresses.length})</p>
                            {segmentAddresses.map((segment, index) => (
                                <div key={index} className="bg-[#111827] rounded-lg p-4 border border-gray-700">
                                    <p className="text-xs text-gray-500 mb-3">Session {index + 1}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Time In */}
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Time-in</p>
                                            <div className="text-white font-bold text-lg mb-2">
                                                {segment.checkIn || '--:--'}
                                            </div>
                                            <div className="flex items-start gap-2 text-xs text-gray-300">
                                                <FiMapPin className="mt-0.5 flex-shrink-0 text-gray-500" />
                                                <span className="break-words line-clamp-2" title={segment.timeInAddress}>
                                                    {segment.timeInAddress || 'Loading...'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Time Out */}
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Time-out</p>
                                            <div className="text-white font-bold text-lg mb-2">
                                                {segment.checkOut || '--:--'}
                                            </div>
                                            <div className="flex items-start gap-2 text-xs text-gray-300">
                                                <FiMapPin className="mt-0.5 flex-shrink-0 text-gray-500" />
                                                <span className="break-words line-clamp-2" title={segment.timeOutAddress}>
                                                    {segment.timeOutAddress || 'Loading...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8">Loading attendance details...</div>
                    )}

                    {/* Remarks */}
                    {employee.remarks && (
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Remarks</p>
                            <div className="w-full bg-[#111827] text-gray-300 p-3 rounded-lg border border-gray-700 text-sm min-h-[80px]">
                                {employee.remarks || 'No remarks provided.'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceDetailsModal;
