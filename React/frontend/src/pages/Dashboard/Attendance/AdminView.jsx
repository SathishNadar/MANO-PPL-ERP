import React from 'react';
import Header from '../../../components/Header';
import FilterBar from '../../../components/FilterBar';
import AttendanceChart from '../../../components/AttendanceChart';
import AttendanceDetailsModal from '../../../components/AttendanceDetailsModal';
import Sidebar from '../../SidebarComponent/sidebar';
import { DateTime } from 'luxon';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const AdminView = () => {
    const [employees, setEmployees] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [selectedEmployee, setSelectedEmployee] = React.useState(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        const fetchAttendance = async () => {
            try {
                // Format date as YYYY-MM-DD
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                console.log('Fetching attendance for:', formattedDate);

                const response = await fetch(`${API_BASE}/attendance/records/admin?date=${formattedDate}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.ok) {
                    // Helper to parse time using Luxon
                    const parseTime = (dateStr) => {
                        if (!dateStr) return null;

                        let isoStr = dateStr;
                        if (typeof dateStr === 'string') {
                            // Ensure it has 'T' separator
                            if (!isoStr.includes('T')) {
                                isoStr = isoStr.replace(' ', 'T');
                            }
                            // If the backend is sending UTC time without Z, add it
                            // If it already has Z or timezone info, keep it as is
                            if (!isoStr.includes('Z') && !isoStr.includes('+') && !isoStr.includes('-', 10)) {
                                isoStr += 'Z';
                            }
                        }

                        // Parse the datetime
                        // If backend sends UTC, this will parse as UTC
                        // If backend sends local time without timezone, we treat it as UTC
                        let dt = DateTime.fromISO(isoStr, { zone: 'utc' });

                        // Convert to IST (Asia/Kolkata)
                        const ist = dt.setZone('Asia/Kolkata');
                        console.log(`Raw: ${dateStr}, Parsed UTC: ${dt.toString()}, IST: ${ist.toString()}`);
                        return ist;
                    };

                    const formatTime = (dt) => {
                        if (!dt || !dt.isValid) return null;
                        return dt.toFormat('hh:mm a');
                    };

                    // Group records by employee name
                    const groupedByEmployee = {};

                    data.data.forEach(record => {
                        const timeInDT = parseTime(record.time_in);
                        const timeOutDT = parseTime(record.time_out);

                        // Determine if this check-in was late
                        let isLate = false;
                        if (timeInDT && timeInDT.isValid) {
                            const cutoff = timeInDT.set({ hour: 9, minute: 0, second: 0 });
                            isLate = timeInDT > cutoff;
                        }

                        const segment = {
                            checkIn: formatTime(timeInDT),
                            checkOut: formatTime(timeOutDT),
                            isLate: isLate,
                            timeInLat: record.time_in_lat,
                            timeInLng: record.time_in_lng,
                            timeOutLat: record.time_out_lat,
                            timeOutLng: record.time_out_lng,
                            remarks: record.late_reason,
                            timeInDT: timeInDT,
                            timeOutDT: timeOutDT
                        };

                        if (!groupedByEmployee[record.user_name]) {
                            groupedByEmployee[record.user_name] = {
                                id: record.attendance_id,
                                name: record.user_name,
                                avatar: '',
                                segments: [],
                                date: timeInDT && timeInDT.isValid ? timeInDT.toFormat('dd MMMM, yyyy') : ''
                            };
                        }

                        groupedByEmployee[record.user_name].segments.push(segment);
                    });

                    // Convert grouped data to array and determine overall status
                    const transformedData = Object.values(groupedByEmployee).map(employee => {
                        // Overall status: Late if ANY segment is late
                        const hasLateSegment = employee.segments.some(seg => seg.isLate);

                        return {
                            ...employee,
                            status: hasLateSegment ? 'Late' : 'On Time',
                            statusColor: hasLateSegment ? 'red' : 'green',
                            // For backward compatibility, include first check-in/out
                            checkIn: employee.segments[0]?.checkIn,
                            checkOut: employee.segments[employee.segments.length - 1]?.checkOut
                        };
                    });

                    // Client-side filter to strictly enforce date matching
                    const dateFilteredData = transformedData.filter(emp => {
                        if (!emp.segments || emp.segments.length === 0) return false;

                        // Check if any segment's timeInDT matches the selected date
                        const selDate = DateTime.fromJSDate(selectedDate);

                        return emp.segments.some(segment => {
                            if (!segment.timeInDT || !segment.timeInDT.isValid) return false;

                            // Compare year, month, and day
                            return segment.timeInDT.year === selDate.year &&
                                segment.timeInDT.month === selDate.month &&
                                segment.timeInDT.day === selDate.day;
                        });
                    });

                    // Search filter: Match first letter of each word
                    const finalFilteredData = dateFilteredData.filter(emp => {
                        if (!searchTerm) return true;
                        const lowerTerm = searchTerm.toLowerCase();
                        const words = emp.name.toLowerCase().split(' ');
                        return words.some(word => word.startsWith(lowerTerm));
                    });

                    setEmployees(finalFilteredData);
                } else {
                    setEmployees([]); // Clear data if fetch fails or no data
                }
            } catch (error) {
                console.error('Error fetching attendance:', error);
                setEmployees([]);
            }
        };

        fetchAttendance();
    }, [selectedDate, searchTerm]);

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    return (
        <div className="flex h-screen bg-[#0b0f19] text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="p-8 overflow-y-auto h-full">
                    <Header
                        title="Employee Attendance"
                        subtitle="Daily attendance overview for today."
                    />

                    <FilterBar
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />

                    <AttendanceChart
                        employees={employees}
                        selectedDate={selectedDate}
                        onEmployeeClick={handleEmployeeClick}
                    />

                    <AttendanceDetailsModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        employee={selectedEmployee}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminView;
