import React from 'react'
import { useNavigate } from 'react-router-dom';

// Helper to get date string in 'YYYY-MM-DD' using local date components (avoids timezone shift)
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to get month short name
function getMonthShort(date) {
  return date.toLocaleString('default', { month: 'short' });
}

function Calendar({ dprList = [] }) {
  const navigate = useNavigate();
  const dprMap = React.useMemo(() => {
    const map = new Map();
    dprList.forEach(dpr => {
      map.set(formatDate(new Date(dpr.date)), dpr);
    });
    return map;
  }, [dprList]);

  // Today and six months ago
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Start of 6 months ago

  // Helper to get number of days in a month
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Build array of months from sixMonthsAgo to today
  const months = [];
  let current = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);
  while (current <= today) {
    months.push(new Date(current));
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  const monthGrids = [];
  const monthWeekCounts = [];

  months.forEach(monthDate => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const startDayOfWeek = monthDate.getDay(); // day of week of 1st of month
    const totalDays = daysInMonth(year, month);

    let lastDay = totalDays;
    if (year === today.getFullYear() && month === today.getMonth()) {
      lastDay = today.getDate();
    }

    const totalCells = startDayOfWeek + lastDay;

    const weeksCount = Math.ceil(totalCells / 7);
    monthWeekCounts.push(weeksCount);

    const grid = Array.from({ length: 7 }, () => Array(weeksCount).fill(null));

    let dayCounter = 1;
    for (let cellIndex = startDayOfWeek; dayCounter <= lastDay; cellIndex++) {
      const col = Math.floor(cellIndex / 7);
      const row = cellIndex % 7;
      grid[row][col] = new Date(year, month, dayCounter);
      dayCounter++;
    }

    monthGrids.push(grid);
  });
  
  const totalColumns = monthWeekCounts.reduce((a, b) => a + b, 0);

  const finalGrid = Array.from({ length: 7 }, () => Array(totalColumns).fill(null));

  let colOffset = 0;
  monthGrids.forEach((grid, i) => {
    const weeksCount = monthWeekCounts[i];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < weeksCount; col++) {
        finalGrid[row][col + colOffset] = grid[row][col];
      }
    }
    colOffset += weeksCount;
  });

  const monthLabels = [];
  let lastMonth = null;
  for (let col = 0; col < totalColumns; col++) {
    let label = '';
    for (let row = 0; row < 7; row++) {
      const day = finalGrid[row][col];
      if (day !== null) {
        const thisMonth = day.getMonth();
        if (thisMonth !== lastMonth) {
          label = getMonthShort(day);
          lastMonth = thisMonth;
        }
        break;
      }
    }
    monthLabels.push(label);
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-row items-end" style={{ flex: '0 0 auto' }}>
        {/* Month labels */}
        <div className="flex flex-row w-full h-auto">
          {monthLabels.map((label, idx) => (
            <div
              key={idx}
              className="m-[1px] flex items-center justify-center"
              style={{
                width: `calc(100% / ${totalColumns})`,
                height: '1.25rem', // slightly taller for label
              }}
            >
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-row flex-1 w-full h-full">
        {Array.from({ length: totalColumns }).map((_, colIdx) => (
          <div key={colIdx} className="flex flex-col h-full w-full" style={{
            width: `calc(100% / ${totalColumns})`,
            height: '95%'
          }}>
            {Array.from({ length: 7 }).map((_, rowIdx) => {
              const day = finalGrid[rowIdx][colIdx];
              if (day === null) {
                return (
                  <div
                    key={rowIdx}
                    className="m-[1px] bg-transparent"
                    style={{
                      width: '80%',
                      height: `calc(100% / 7)`,
                    }}
                  />
                );
              }
              const dateStr = formatDate(day);
              const dpr = dprMap.get(dateStr);
              if (dpr) {
                return (
                  <a
                    key={rowIdx}
                    href={`/dashboard/project-description/${dpr.project_id}/${dpr.dpr_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="m-[1px] rounded bg-blue-500 hover:bg-blue-600 block"
                    title={day.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                    style={{ width: '78%', height: `calc(100% / 7)` }}
                  />
                );
              } else {
                return (
                  <div
                    key={rowIdx}
                    className="m-[1px] rounded bg-gray-800"
                    style={{ width: '78%', height: `calc(100% / 7)` }}
                  />
                );
              }
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar