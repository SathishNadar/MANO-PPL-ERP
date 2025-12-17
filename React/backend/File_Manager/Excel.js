// src/utils/exportAttendance.js
import ExcelJS from "exceljs";
import { knexDB } from "../Database.js";

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export async function exportAttendanceToFile(filePath, startDate, endDate, specificUserId = null) {
  // 1. Fetch Users
  let usersQuery = knexDB("users").select("user_id", "user_name", "email", "designation");
  if (specificUserId) {
    usersQuery = usersQuery.where("user_id", specificUserId);
  }
  const users = await usersQuery;

  // 2. Fetch Attendance Records within Date Range
  // We filter by date string comparison since they are stored as local datetimes
  let attendanceQuery = knexDB("attendance_records")
    .whereRaw("DATE(time_in) >= ?", [startDate])
    .whereRaw("DATE(time_in) <= ?", [endDate]);

  if (specificUserId) {
    attendanceQuery = attendanceQuery.where("user_id", specificUserId);
  }

  const rawRecords = await attendanceQuery.select(
    "*",
    knexDB.raw("DATE_FORMAT(time_in, '%Y-%m-%d %H:%i:%s') as time_in_str"),
    knexDB.raw("DATE_FORMAT(time_out, '%Y-%m-%d %H:%i:%s') as time_out_str")
  ).orderBy("time_in", "asc");

  // 3. Organize Records by User -> Date
  const recordsByUserDate = {}; // { userId: { dateString: [records] } }

  rawRecords.forEach(r => {
    if (!r.time_in) return;
    const dateStr = new Date(r.time_in).toISOString().split('T')[0]; // Extract YYYY-MM-DD
    if (!recordsByUserDate[r.user_id]) recordsByUserDate[r.user_id] = {};
    if (!recordsByUserDate[r.user_id][dateStr]) recordsByUserDate[r.user_id][dateStr] = [];
    recordsByUserDate[r.user_id][dateStr].push(r);
  });

  // 4. Create Workbook & Sheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance Summary");

  // Columns
  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "User Name", key: "user_name", width: 25 },
    { header: "Designation", key: "designation", width: 20 },
    { header: "First In", key: "first_in", width: 15 },
    { header: "Last Out", key: "last_out", width: 15 },
    { header: "Total Worked (Hrs)", key: "worked_hours", width: 20 },
    { header: "Status", key: "status", width: 15 },
  ];

  // Apply basic header styling
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" }, // Light Gray
  };

  const allDates = getDatesInRange(startDate, endDate);

  // 5. Iterate Logic
  users.forEach(user => {
    const userRecords = recordsByUserDate[user.user_id] || {};

    allDates.forEach(dateStr => {
      const dailyRecords = userRecords[dateStr] || [];

      let firstIn = null;
      let lastOut = null;
      let totalMs = 0;
      let status = "Absent";

      if (dailyRecords.length > 0) {
        // Calculate Times
        // records are already ordered by time_in ASC
        const firstRecord = dailyRecords[0];
        const lastRecord = dailyRecords[dailyRecords.length - 1];

        firstIn = firstRecord.time_in ? new Date(firstRecord.time_in) : null;
        // Logic: find any record that has a time_out to determine lastOut, 
        // but typically the last record by time_in is the one we care about for 'Leaving'
        // Ideally we want the max time_out of the day.

        // Find max time_out in the day
        let maxTimeOut = null;
        dailyRecords.forEach(r => {
          if (r.time_out) {
            const tOut = new Date(r.time_out);
            if (!maxTimeOut || tOut > maxTimeOut) maxTimeOut = tOut;
          }
          // Calculate duration for this segment
          if (r.time_in && r.time_out) {
            const start = new Date(r.time_in);
            const end = new Date(r.time_out);
            totalMs += (end - start);
          }
        });

        lastOut = maxTimeOut;

        // Determine Status
        status = "Present"; // Default if visited

        // "People coming late over 11 am is half day"
        if (firstIn) {
          const elevenAM = new Date(dateStr + "T11:00:00");
          // We need to match the timezone logic or just compare hours/minutes simply if stored as local.
          // Since time_in is stored as local string in DB (e.g., "2023-10-27 11:30:00"), 
          // parsing it with new Date("2023-10-27 11:30:00") in Node might assume local timezone or UTC depending on string format.
          // To be safe, we compare hours strictly.

          const inHour = firstIn.getHours();
          const inMin = firstIn.getMinutes();
          // 11:00 AM = 11
          if (inHour > 11 || (inHour === 11 && inMin > 0)) {
            status = "Half Day";
          }
        }

        // "Early before 4 pm exit is also half day"
        // 4 PM = 16:00
        if (lastOut) {
          const outHour = lastOut.getHours();
          const outMin = lastOut.getMinutes();
          if (outHour < 16) {
            status = "Half Day";
          }
        } else {
          // If didn't clock out, maybe consider it Pending or Half Day? 
          // User said "not visited then absent, otherwise full present" (implied default).
          // But if they didn't clock out, we can't verify 4pm rule. 
          // Let's assume if active session (no out), we default to Present or Pending.
          // For now, let's leave it as is, or mark as "No Out".
          // If strictly following logic "before 4pm exit is half day":
          // If no exit, we technically don't know. 
          // Often "Missed Punch" is treated as Half Day or Absent. 
          // I'll stick to: If visited, default Present, unless rule broken. 
          // If no out, rule isn't broken yet (or we can't prove it).
        }
      }

      // Add Row
      const row = sheet.addRow({
        date: dateStr,
        user_name: user.user_name,
        designation: user.designation || "-",
        first_in: firstIn ? firstIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
        last_out: lastOut ? lastOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
        worked_hours: (totalMs / (1000 * 60 * 60)).toFixed(2),
        status: status
      });

      // Styling based on Status
      const statusCell = row.getCell("status");
      if (status === "Absent") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } }; // Red
        statusCell.font = { color: { argb: "FF9C0006" } };
      } else if (status === "Half Day") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB9C" } }; // Yellow
        statusCell.font = { color: { argb: "FF9C6500" } };
      } else if (status === "Present") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } }; // Green
        statusCell.font = { color: { argb: "FF006100" } };
      }
    });
  });

  sheet.autoFilter = { from: "A1", to: "G1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

