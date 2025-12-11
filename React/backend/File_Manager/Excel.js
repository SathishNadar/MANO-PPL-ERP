// src/utils/exportAttendance.js
import ExcelJS from "exceljs";
import { knexDB } from "../Database.js";

export async function exportAttendanceToFile(filePath = "attendance_test.xlsx") {
  const records = await knexDB("attendance_records")
      .join("users", "attendance_records.user_id", "users.user_id")
      .select(
        "attendance_records.*",
        knexDB.raw("DATE_FORMAT(attendance_records.time_in, '%Y-%m-%d %H:%i:%s') as time_in"),
        knexDB.raw("DATE_FORMAT(attendance_records.time_out, '%Y-%m-%d %H:%i:%s') as time_out"),
        knexDB.raw("DATE_FORMAT(attendance_records.created_at, '%Y-%m-%d %H:%i:%s') as created_at"),
        knexDB.raw("DATE_FORMAT(attendance_records.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at"),
        "users.user_name",
        "users.email",
        "users.designation"
      )
      .orderBy("time_in", "desc")

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");

  sheet.addRow([
    "Attendance ID",
    "User",
    "Email",
    "Date",
    "Time In",
    "Time Out",
    "Worked Hours",
    "Status",
  ]);

  records.forEach((r, index) => {
    const rowNumber = index + 2;
    const row = sheet.getRow(rowNumber);

    row.getCell("A").value = r.attendance_id;
    row.getCell("B").value = r.user_name;
    row.getCell("C").value = r.email;

    const timeIn = r.time_in;
    const timeOut = r.time_out;

    row.getCell("D").value = timeIn ? timeIn.split(" ")[0] : null;
    row.getCell("E").value = timeIn ? timeIn.split(" ")[1] : null;
    row.getCell("F").value = timeOut ? timeOut.split(" ")[1] : null;

    if (timeIn && timeOut) {
      row.getCell("G").value = {
        formula: `=(F${rowNumber}-E${rowNumber})*24`,
      };
    }

    row.getCell("H").value = {
      formula: `=IF(G${rowNumber}>=8,"Full Day",IF(G${rowNumber}>=4,"Half Day","Pending"))`,
    };

    row.commit();
  });

  sheet.autoFilter = { from: "A1", to: "H1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

console.log("called");
await exportAttendanceToFile();
console.log("finished");

