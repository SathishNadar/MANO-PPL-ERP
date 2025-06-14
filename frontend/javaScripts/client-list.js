console.log("client list loaded");
 const clients = [
    {
      srNo: 1,
      client: "Example Client",
      sector: "IT",
      natureOfJobs: "Development",
      contactPerson: "John Doe",
      designation: "Manager",
      location: "Mumbai",
      contact: "9876543210",
      email: "john@example.com",
      address: "123 Street Name",
      website: "www.example.com",
      emailedOn: "2024-12-24",
      whatsappTextedOn: "2024-12-24",
      calledOn: "2024-12-24",
      visitedOn: "2024-12-24",
      selfRemark: "Positive",
      otherRemark: "Follow-up needed",
      ref: "Referral",
      responsibility: "Sales Team",
      remarkDec: "Good response",
      month: "Dec",
      remarkMay: "Confirmed deal",
    },
    {
      srNo: 2,
      client: "Test Industries",
      sector: "Manufacturing",
      natureOfJobs: "Maintenance",
      contactPerson: "Jane Smith",
      designation: "HR",
      location: "Pune",
      contact: "9876543222",
      email: "jane@test.com",
      address: "456 Industrial Area",
      website: "www.testindustries.com",
      emailedOn: "2024-12-25",
      whatsappTextedOn: "2024-12-25",
      calledOn: "2024-12-25",
      visitedOn: "2024-12-25",
      selfRemark: "Neutral",
      otherRemark: "Waiting for approval",
      ref: "LinkedIn",
      responsibility: "Client Relations",
      remarkDec: "Pending feedback",
      month: "Dec",
      remarkMay: "Follow-up scheduled",
    },
  ];


function renderClientList(data) {
  const mainContent = document.querySelector(".main-content");

  const table = document.createElement("table");
  table.id = "client-main-table";
  const tbody = document.createElement("tbody");
  tbody.id = "client-table-body";

  if (data) {
    data.forEach((client) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${client.srNo}</td>
        <td>${client.client}</td>
        <td>${client.sector}</td>
        <td>${client.natureOfJobs}</td>
        <td>${client.contactPerson}</td>
        <td>${client.designation}</td>
        <td>${client.location}</td>
        <td>${client.contact}</td>
        <td>${client.email}</td>
        <td>${client.address}</td>
        <td><a href="https://${client.website}" class="website-link" target="_blank">${client.website}</a></td>
        <td>${client.emailedOn}</td>
        <td>${client.whatsappTextedOn}</td>
        <td>${client.calledOn}</td>
        <td>${client.visitedOn}</td>
        <td>${client.selfRemark}</td>
        <td>${client.otherRemark}</td>
        <td>${client.ref}</td>
        <td>${client.responsibility}</td>
        <td>${client.remarkDec}</td>
        <td>${client.month}</td>
        <td>${client.remarkMay}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    mainContent.appendChild(table);
  } else {
    console.log(data);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".client-table-wrapper");
  wrapper.addEventListener("wheel", function (e) {
    if (e.shiftKey) {
      e.preventDefault(); // prevent vertical scroll
      wrapper.scrollLeft += e.deltaY;
    }
  });
});
