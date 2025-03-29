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

if (todaytableData) {
todaytableData.forEach(todayrow => {
        const tr = document.createElement('tr');
        todayrow.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        todaydisplayTable.appendChild(tr);
    });
} else {
    
}


if (tomorrowtableData) {
    tomorrowtableData.forEach(tomorrowrow => {
        const tr = document.createElement('tr');
        tomorrowrow.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tomorrowdisplayTable.appendChild(tr);
    });
} else {
    
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