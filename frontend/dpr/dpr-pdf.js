const tableData = JSON.parse(sessionStorage.getItem('userTableData'));
const displayTable = document.getElementById('displayTable').getElementsByTagName('tbody')[0];
const todaytableData =JSON.parse(sessionStorage.getItem('todayTableData'));
const todaydisplayTable = document.getElementById('today-table').getElementsByTagName('tbody')[0];
const tomorrowtableData =JSON.parse(sessionStorage.getItem('tomorrowTableData'));
const tomorrowdisplayTable = document.getElementById('tomorrow-table').getElementsByTagName('tbody')[0];

if (tableData) {
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        displayTable.appendChild(tr);
    });
} else {
    
}

//-------------------------FOR TODAY TABLE ---------------------------------//
console.log("YEAH even i can't believe i made it!!!")

//-------------------------FOR TODAY TABLE ---------------------------------//
if (todaytableData) {
    todaytableData.forEach(todayrow => {
        const tr = document.createElement('tr');
        todayrow.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            // Add empty cell styling if content is empty
            if (cell === "") {
                td.style.minHeight = "20px"; // Set minimum height for empty cells
                td.style.border = "1px solid #ddd"; // Ensure borders are visible
            }
            tr.appendChild(td);
        });
        todaydisplayTable.appendChild(tr);
    });
}

//-------------------------FOR TOMORROW TABLE ------------------------------//
if (tomorrowtableData) {
    tomorrowtableData.forEach(tomorrowrow => {
        const tr = document.createElement('tr');
        tomorrowrow.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            // Add empty cell styling if content is empty
            if (cell === "") {
                td.style.minHeight = "20px"; // Match height with today-table
                td.style.border = "1px solid #ddd"; // Ensure borders are visible
            }
            tr.appendChild(td);
        });
        tomorrowdisplayTable.appendChild(tr);
    });
}

function printit(){
window.print();
}


//------------------------------------------TO GET HOLD OF THE INPUT BOX DATA-----------------------------//
let storedItem = sessionStorage.getItem('form-values');
let parsedItem = JSON.parse(storedItem);

if (parsedItem[0] =="Rainy"){
document.getElementById("rainy-day-checkbox").style.backgroundColor = "green";
}
if (parsedItem[0] =="Sunny"){
document.getElementById("normal-day-checkbox").style.backgroundColor = "green";
}
if (parsedItem[1] =="slushy"){
document.getElementById("slushy-day-checkbox").style.backgroundColor = "green";
}
if (parsedItem[1] =="dry"){
document.getElementById("dry-day-checkbox").style.backgroundColor = "green";
}

//--------------------------------------FOR DISPLAYING TIME TABLE-------------------------//
// Fetch stored time slots from sessionStorage
document.addEventListener("DOMContentLoaded", function () {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const table = document.querySelector(".from-to");

    if (table) {
        // Clear existing rows (if any)
        table.innerHTML = "";

        // Dynamically create and insert rows for each time slot
        timeSlots.forEach(slot => {
            const row = document.createElement("tr");

            const fromTd = document.createElement("td");
            fromTd.innerHTML = `From: <span>${slot.from}</span>`;

            const toTd = document.createElement("td");
            toTd.innerHTML = `To: <span>${slot.to}</span>`;

            row.appendChild(fromTd);
            row.appendChild(toTd);
            table.appendChild(row);
        });
    }
});
