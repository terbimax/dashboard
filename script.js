
const CSV_URL = "data.csv";

let fullData = [];

function fetchData() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function (results) {
      fullData = results.data.filter(row => row.VC2);
      initDashboard(fullData);
    }
  });
}

function initDashboard(data) {
  const months = [...new Set(data.map(row => row.Month).filter(Boolean))];
  createMonthFilter(months);
  renderDashboard(data);
}

function createMonthFilter(months) {
  const container = document.getElementById("monthFilter");
  container.innerHTML = "";
  months.forEach(month => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = month;
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      const selected = [...container.querySelectorAll("input:checked")].map(c => c.value);
      const filteredData = fullData.filter(row => selected.includes(row.Month));
      renderDashboard(filteredData);
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(month));
    container.appendChild(label);
  });
}

function calculateRxShare(data, groupBy = null) {
  const grouped = {};
  data.forEach(row => {
    const key = groupBy ? row[groupBy] : "total";
    grouped[key] = grouped[key] || { total: 0, rnt: 0 };
    grouped[key].total++;
    if (row.VC2.trim().toUpperCase() === "RNT") {
      grouped[key].rnt++;
    }
  });

  const result = {};
  Object.entries(grouped).forEach(([key, val]) => {
    result[key] = val.total > 0 ? (val.rnt / val.total) * 100 : 0;
  });

  return result;
}

function renderDashboard(data) {
  const nationalRx = calculateRxShare(data);
  const rsmRx = calculateRxShare(data, "Prisma RSM");

  renderChart("nationalChart", nationalRx, "National Rx Share (%)");
  renderChart("rsmChart", rsmRx, "Rx Share by Prisma RSM (%)");
  renderDoctorTable(data);
}

function renderChart(canvasId, dataMap, title) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (window[canvasId]) window[canvasId].destroy();
  window[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(dataMap),
      datasets: [{
        label: title,
        data: Object.values(dataMap),
        backgroundColor: "#42a5f5"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function renderDoctorTable(data) {
  const tbody = document.querySelector("#doctorTable tbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Doctor || ""}</td>
      <td>${row.Specialty || ""}</td>
      <td>${row["Chamber Address"] || ""}</td>
      <td>${row.ING || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

fetchData();
