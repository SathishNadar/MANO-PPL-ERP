import React from 'react';
import Header from '../../AttendanceComponents/Header';
import FilterBar from '../../AttendanceComponents/FilterBar';
import Sidebar from '../../SidebarComponent/sidebar';
import AttendanceDetailsModal from '../../AttendanceComponents/AttendanceDetailsModal';
import { DateTime } from 'luxon';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function EmployeeRow({ employee = {}, name, status, statusColor, checkIn, checkOut, avatar, selectedDate, segments = [], onClick }) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="flex items-center h-14 border-b border-gray-800/40">
      {/* Left column - click opens modal */}
      <div
        className="w-48 flex-shrink-0 pr-4 flex items-center gap-3 relative cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(employee); }}
        role="button"
        tabIndex={0}
      >
        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm">{(name || '').charAt(0) || '?'}</div>
        <div className="flex flex-col">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-gray-400">{status}</div>
        </div>

        {showTooltip && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#0f1724] text-white p-2 rounded shadow-lg text-xs w-44 z-50">
            <div className="truncate"><span className="font-semibold">Time in:</span> <span className="ml-1">{checkIn || '--'}</span></div>
            <div className="truncate mt-1"><span className="font-semibold">Time out:</span> <span className="ml-1">{checkOut || '--'}</span></div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-grow relative h-12">
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="h-1 w-full bg-gray-800/30 rounded"></div>
        </div>

        <div className="absolute inset-0">
          {Array.isArray(segments) && segments.map((seg, idx) => {
            const left = typeof seg.leftPct === 'number' && isFinite(seg.leftPct) ? seg.leftPct : 0;
            const width = typeof seg.widthPct === 'number' && isFinite(seg.widthPct) ? seg.widthPct : 0;
            if (width <= 0) return null;
            return (
              <div
                key={idx}
                title={`${seg.displayStart || ''} - ${seg.displayEnd || ''}`}
                className={`absolute top-3 left-0 h-6 rounded-md ${seg.isAssumed ? 'bg-yellow-500/90' : 'bg-green-500'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            );
          })}
        </div>

        <div className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-auto">
          <div>{checkIn || '--'}</div>
          <div className={`${checkOut === 'Missed checkout' ? 'text-amber-400' : ''}`}>{checkOut || '--'}</div>
        </div>
      </div>
    </div>
  );
}

// AttendanceChart
const AttendanceChart = ({ employees = [], selectedDate = new Date(), onEmployeeClick }) => {
  const timeLabels = [
    '7 AM','8 AM','9 AM','10 AM','11 AM','12 PM',
    '1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM',
    '8 PM','9 PM','10 PM','11 PM','12 AM'
  ];

    const parseISO = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v !== 'string') return null;
    const s = v.trim();

    // Verbose JS date string: e.g. "Fri Dec 05 2025 09:17:19 GMT+0530 ..."
    if (/\bGMT[+-]\d{4}\b/.test(s) || /^\w{3} \w{3} \d{2} \d{4} /.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    // SQL-like: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
    const sqlMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (sqlMatch) {
      const year = parseInt(sqlMatch[1], 10);
      const monthIndex = parseInt(sqlMatch[2], 10) - 1;
      const day = parseInt(sqlMatch[3], 10);
      const hours = parseInt(sqlMatch[4], 10);
      const minutes = parseInt(sqlMatch[5], 10);
      const seconds = parseInt(sqlMatch[6] || '0', 10);
      const d = new Date(year, monthIndex, day, hours, minutes, seconds); // local
      return isNaN(d.getTime()) ? null : d;
    }

    // time-only like "HH:MM" or "HH:MM:SS"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':').map(p => parseInt(p, 10));
      const d = new Date();
      d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO / fallback (native parser)
    const fallback = new Date(s);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const isSameLocalDay = (d, dayDate) => {
    if (!d || !dayDate) return false;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const b = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
    return a.getTime() === b.getTime();
  };

  const getChartBounds = (dayDate) => {
    const start = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 7, 0, 0, 0);
    const end = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate() + 1, 0, 0, 0, 0);
    return { start, end };
  };

  const clamp = (d, min, max) => {
    if (!d) return null;
    if (d < min) return new Date(min);
    if (d > max) return new Date(max);
    return d;
  };

  const buildSegmentsForEmployee = (emp) => {
    const raw = emp.records || emp.segments || emp.attendanceRecords || [];
    const dayRecords = (raw || []).map(r => ({ r, tin: parseISO(r.time_in ?? r.timeIn ?? r.timeInISO ?? r.start, selectedDate) }))
      .filter(x => x.tin && isSameLocalDay(x.tin, selectedDate))
      .sort((a,b) => a.tin - b.tin)
      .map(x => x.r);

    const { start: chartStart, end: chartEnd } = getChartBounds(selectedDate);
    const now = new Date();
    const sixPm = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 18,0,0,0);
    const segments = [];

    for (let i=0;i<dayRecords.length;i++) {
      const r = dayRecords[i];
      const timeInRaw = r.time_in ?? r.timeIn ?? r.timeInISO ?? r.checkIn ?? r.start;
      const timeOutRaw = r.time_out ?? r.timeOut ?? r.timeOutISO ?? r.checkOut ?? r.end;
      const tin = parseISO(timeInRaw, selectedDate);
      const tout = parseISO(timeOutRaw, selectedDate);
      if (!tin) continue;
      const segStart = clamp(tin, chartStart, chartEnd);

      let segEnd = null;
      let isAssumed = false;

      if (tout && isSameLocalDay(tout, selectedDate)) {
        segEnd = clamp(tout, chartStart, chartEnd);
      } else if (!tout) {
        const isLast = i === dayRecords.length - 1;
        if (isLast) {
          if (emp.stopAt6) { segEnd = clamp(sixPm, chartStart, chartEnd); isAssumed = true; }
          else if (isSameLocalDay(now, selectedDate) && now.getTime() < sixPm.getTime()) segEnd = clamp(now, chartStart, chartEnd);
          else segEnd = clamp(chartEnd, chartStart, chartEnd);
        } else { continue; } // incomplete intermediate session
      } else {
        segEnd = clamp(chartEnd, chartStart, chartEnd);
      }

      if (!segStart || !segEnd) continue;
      if (segEnd.getTime() <= segStart.getTime()) continue;

      const totalMs = chartEnd.getTime() - chartStart.getTime();
      const leftPct = ((segStart.getTime() - chartStart.getTime()) / totalMs) * 100;
      const widthPct = ((segEnd.getTime() - segStart.getTime()) / totalMs) * 100;

      segments.push({
        start: segStart, end: segEnd, leftPct, widthPct, isAssumed,
        displayStart: segStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        displayEnd: segEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    segments.sort((a,b) => a.start - b.start);
    return segments;
  };

  const transformedEmployees = employees.map(emp => {
    try {
      const segments = buildSegmentsForEmployee(emp);
      return { ...emp, segments };
    } catch (e) {
      return { ...emp, segments: [] };
    }
  });

  return (
    <div className="bg-[#111827] rounded-xl p-6 flex flex-col h-full overflow-hidden min-h-0">
      <div className="overflow-auto custom-scrollbar flex-1 relative min-h-0">
        <div className="min-w-[141.66%] h-full flex flex-col relative">
          <div className="sticky top-0 z-20 bg-[#111827] flex mb-2 h-8 flex-shrink-0 border-b border-gray-800">
            <div className="w-48 flex-shrink-0 bg-[#111827] sticky left-0 z-30"></div>
            <div className="flex-grow relative h-8">
              {timeLabels.map((label, index) => (
                <div key={index} className="absolute top-0 flex flex-col items-center"
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

          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 flex pointer-events-none" style={{ zIndex: 0 }}>
              <div className="w-48 flex-shrink-0 border-r border-gray-800/30 bg-[#111827] sticky left-0 z-10"></div>
              <div className="flex-grow relative">
                {Array.from({ length: 18 }).map((_, index) => (
                  <div key={index} className="absolute top-0 bottom-0 border-l border-gray-800" style={{ left: `${(index / 17) * 100}%` }} />
                ))}
              </div>
            </div>

            <div className="relative z-10">
              {transformedEmployees.map((emp) => (
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
                  segments={emp.segments}
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

const AdminView = () => {
  // Local parseISO for AdminView (AttendanceChart has its own version)
  const parseISO = (v, refDate = new Date()) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v !== 'string') return null;
    const s = v.trim();

    // Verbose JS date string from backend: e.g. "Fri Dec 05 2025 09:17:19 GMT+0530 (India Standard Time)"
    if (/\bGMT[+-]\d{4}\b/.test(s) || /^\w{3} \w{3} \d{2} \d{4} /.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    // SQL-like: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
    const sqlMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (sqlMatch) {
      const year = parseInt(sqlMatch[1], 10);
      const monthIndex = parseInt(sqlMatch[2], 10) - 1;
      const day = parseInt(sqlMatch[3], 10);
      const hours = parseInt(sqlMatch[4], 10);
      const minutes = parseInt(sqlMatch[5], 10);
      const seconds = parseInt(sqlMatch[6] || '0', 10);
      const d = new Date(year, monthIndex, day, hours, minutes, seconds); // local time
      return isNaN(d.getTime()) ? null : d;
    }

    // time-only like "HH:MM" or "HH:MM:SS" -> apply to refDate
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':').map(p => parseInt(p, 10));
      const hours = parts[0];
      const minutes = parts[1] || 0;
      const seconds = parts[2] || 0;
      const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), hours, minutes, seconds);
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO-like fallback: extract time portion and apply to refDate without assuming timezone
    const isoTimeMatch = s.match(/T(\d{2}:\d{2}:?\d{0,2})/);
    if (isoTimeMatch) {
      const parts = isoTimeMatch[1].split(':').map(p => parseInt(p || '0', 10));
      const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), parts[0] || 0, parts[1] || 0, parts[2] || 0);
      return isNaN(d.getTime()) ? null : d;
    }

    // Last resort (try native parser)
    const fallback = new Date(s);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const [employees, setEmployees] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Helper to parse backend timestamps (SQL string, ISO, or verbose JS string)
  const parseTimestamp = (v, refDate = new Date()) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const s = String(v).trim();

    // Verbose JS date with GMT offset
    if (/\bGMT[+-]\d{4}\b/.test(s) || /^\w{3} \w{3} \d{2} \d{4} /.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    // SQL-like "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
    const sqlMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (sqlMatch) {
      const year = parseInt(sqlMatch[1], 10);
      const monthIndex = parseInt(sqlMatch[2], 10) - 1;
      const day = parseInt(sqlMatch[3], 10);
      const hours = parseInt(sqlMatch[4], 10);
      const minutes = parseInt(sqlMatch[5], 10);
      const seconds = parseInt(sqlMatch[6] || '0', 10);
      const d = new Date(year, monthIndex, day, hours, minutes, seconds);
      return isNaN(d.getTime()) ? null : d;
    }

    // time-only like "HH:MM" or "HH:MM:SS" -> anchored to refDate
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':').map(p => parseInt(p, 10));
      const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), parts[0] || 0, parts[1] || 0, parts[2] || 0);
      return isNaN(d.getTime()) ? null : d;
    }

    // Fallback to native parsing
    const fallback = new Date(s);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  React.useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
        const ny = next.getFullYear();
        const nm = String(next.getMonth() + 1).padStart(2, '0');
        const nd = String(next.getDate()).padStart(2, '0');
        const formattedDateNext = `${ny}-${nm}-${nd}`;
        const response = await fetch(`${API_BASE}/attendance/records/admin?date_from=${formattedDate}&date_to=${formattedDateNext}`, { credentials: 'include' });
        const data = await response.json();
        console.log(data)
        if (data.ok) {
          const groupedByEmployee = {};
          data.data.forEach(record => {
            if (!groupedByEmployee[record.user_name]) {
              groupedByEmployee[record.user_name] = { id: record.attendance_id, name: record.user_name, avatar: '', rawRecords: [], date: '' };
            }
            groupedByEmployee[record.user_name].rawRecords.push(record);
          });

                    const transformedData = Object.values(groupedByEmployee).map(employee => {
            const records = (employee.rawRecords || []).slice().sort((a,b) => {
              const aIn = a.time_in ?? a.timeIn ?? a.timeInISO ?? a.start ?? '';
              const bIn = b.time_in ?? b.timeIn ?? b.timeInISO ?? b.start ?? '';
              const ad = parseTimestamp(aIn) ? parseTimestamp(aIn).getTime() : 0;
              const bd = parseTimestamp(bIn) ? parseTimestamp(bIn).getTime() : 0;
              return ad - bd;
            });

            const fmt = (v) => {
              if (!v) return null;
              if (v instanceof Date) return v.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const s = String(v).trim();
              const verboseMatch = s.match(/(\d{2}:\\d{2}:\\d{2})/);
              if (verboseMatch) return verboseMatch[1].slice(0,5);
              const sqlMatch = s.match(/^(?:\\d{4}-\\d{2}-\\d{2})[ T](\\d{2}:\\d{2}:?\\d{0,2})/);
              if (sqlMatch) return sqlMatch[1].slice(0,5);
              if (/^\\d{1,2}:\\d{2}(:\\d{2})?$/.test(s)) return s.slice(0,5);
              const d = parseTimestamp(s);
              if (d) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return s.length >= 5 ? s.slice(0,5) : s;
            };

            const firstRecord = records[0];
            const firstTimeIn = firstRecord ? (firstRecord.time_in ?? firstRecord.timeIn ?? firstRecord.timeInISO ?? firstRecord.start) : null;

            let lastTimeOutRaw = null;
            for (let i = records.length - 1; i >= 0; i--) {
              const r = records[i];
              const tout = r.time_out ?? r.timeOut ?? r.timeOutISO ?? r.end;
              if (tout) { lastTimeOutRaw = tout; break; }
            }

            const now = new Date();
            const sixPm = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 18, 0, 0, 0);
            const lastRecord = records[records.length - 1];
            const lastHasTout = lastRecord && (lastRecord.time_out ?? lastRecord.timeOut ?? lastRecord.timeOutISO ?? lastRecord.end);
            const stopAt6 = !lastHasTout && (now.getTime() >= sixPm.getTime());

            const checkIn = fmt(firstTimeIn);
            let checkOut = null;
            if (lastTimeOutRaw) checkOut = fmt(lastTimeOutRaw);
            else if (stopAt6) checkOut = 'Missed checkout';
            else checkOut = '-- (ongoing)';

            let isLate = false;
            for (const r of records) {
              const tinRaw = r.time_in ?? r.timeIn ?? r.timeInISO ?? r.start;
              if (!tinRaw) continue;
              const dt = parseTimestamp(tinRaw, selectedDate);
              if (dt && !isNaN(dt.getTime())) {
                if (dt.getHours() > 9 || (dt.getHours() === 9 && dt.getMinutes() > 0)) { isLate = true; break; }
              }
            }

            return {
              ...employee,
              records,
              checkIn: checkIn || '--',
              checkOut: checkOut || '--',
              status: isLate ? 'Late' : 'On Time',
              statusColor: isLate ? 'green' : 'green',
              stopAt6
            };
          });

          const dateFilteredData = transformedData.filter(emp => {
            return (emp.records || []).some(r => {
              const tinRaw = r.time_in ?? r.timeIn ?? r.timeInISO ?? r.start;
              if (!tinRaw) return false;
              const d = parseTimestamp(tinRaw, selectedDate);
              if (!d) return false;
              return d.getFullYear() === selectedDate.getFullYear() &&
                     d.getMonth() === selectedDate.getMonth() &&
                     d.getDate() === selectedDate.getDate();
            });
          });

          const finalFilteredData = dateFilteredData.filter(emp => {
            if (!searchTerm) return true;
            const lowerTerm = searchTerm.toLowerCase();
            const words = emp.name.toLowerCase().split(' ');
            return words.some(word => word.startsWith(lowerTerm));
          });

          setEmployees(finalFilteredData);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setEmployees([]);
      }
    };
    fetchAttendance();
  }, [selectedDate, searchTerm]);

  const handleEmployeeClick = (employee) => { setSelectedEmployee(employee); setIsModalOpen(true); };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="p-8 overflow-hidden h-full flex flex-col">
          <Header title="Employee Attendance" subtitle="Daily attendance overview for today." />
          <FilterBar selectedDate={selectedDate} onDateChange={setSelectedDate} searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          <div className="mt-4 flex-1 overflow-hidden">
            <AttendanceChart employees={employees} selectedDate={selectedDate} onEmployeeClick={handleEmployeeClick} />
          </div>

          <AttendanceDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} employee={selectedEmployee} />
        </div>
      </div>
    </div>
  );
};

export default AdminView;