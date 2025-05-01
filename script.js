// Updated script.js for Rx Share by Prisma RSM and Month Filtering

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSX9x88IxgSvZpbUYyNL8N3Y3iUf8zwvx_dZr6D1mBpQnceftpszqMAEFFc5f3mGbQ_zhhXJrncVjY8/pub?gid=0&single=true&output=csv";

let fullData = [];
let doctors = [];
let selectedMonths = new Set();

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  complete: function (results) {
    fullData = results.data;
    initMonthFilters(fullData);
    applyFiltersAndRender();
  }
});

function initMonthFilters(data) {
  const monthFilterDiv = document.createElement("div");
  monthFilterDiv.id = "monthFilter";
  const months = Array.from(new Set(data.map(row => row.Month).filter(Boolean)));

  months.forEach(month => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = month;
    checkbox.checked = true;
    selectedMonths.add(month);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedMonths.add(month);
      } else {
        selectedMonths.delete(month);
      }
      applyFiltersAndRender();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(month));
    monthFilterDiv.appendChild(label);
  });

  document.querySelector(".container").insertBefore(monthFilterDiv, document.querySelector("canvas"));
}

function applyFiltersAndRender() {
  const filtered = fullData.filter(row => selectedMonths.has(row.Month));
  const nationalRxShare = computeNationalRxShare(filtered);
  const rsmRxShare = computeRxShareByRSM(filtered);
  doctors = extractDoctors(filtered);

  renderNationalChart(nationalRxShare);
  renderRsmChart(rsmRxShare);
  renderDoctorTable();
}

function computeNationalRxShare(data) {
  const ingTotals = {};

  data.forEach(row => {
    const ing = row.ING;
    const vc2 = row.VC2;
    if (!ing || !vc2) return;
    ingTotals[ing] = ingTotals[ing] || { total: 0, rnt: 0 };
    ingTotals[ing].total++;
    if (vc2 === "RNT") ingTotals[ing].rnt++;
  });

  const share = {};
  for (const ing in ingTotals) {
    const { total, rnt } = ingTotals[ing];
    share[ing] = total ? (rnt / total) * 100 : 0;
  }
  return share;
}

function computeRxShareByRSM(data) {
  const rsmData = {};
  data.forEach(row => {
    const rsm = row["Prisma RSM"];
    const vc2 = row.VC2;
    if (!rsm || !vc2) return;
    rsmData[rsm] = rsmData[rsm] || { total: 0, rnt: 0 };
    rsmData[rsm].total++;
    if (vc2 === "RNT") rsmData[rsm].rnt++;
  });

  const share = {};
  for (const rsm in rsmData) {
    const { total, rnt } = rsmData[rsm];
    share[rsm] = total ? (rnt / total) * 100 : 0;
  }
  return share;
}

function extractDoctors(data) {
  return data.map(row => ({
    name: row.PHY_NM,
    spec: row.PHY_SPC,
    addr: row.CH_ADD,
    ing: row.ING
  })).filter(doc => doc.name && doc.addr && doc.ing);
}

function renderNationalChart(rxShare) {
  const ctx = document.getElementById("nationalChart").getContext("2d");
  if (window.nationalChart) window.nationalChart.destroy();
  window.nationalChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(rxShare),
      datasets: [{
        label: "Rx Share (%)",
        data: Object.values(rxShare),
        backgroundColor: "#4caf50"
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "National Rx Share by Product"
        }
      },
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderRsmChart(rxShare) {
  const ctx = document.getElementById("rsmChart").getContext("2d");
  if (window.rsmChart) window.rsmChart.destroy();
  window.rsmChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(rxShare),
      datasets: [{
        label: "Rx Share (%)",
        data: Object.values(rxShare),
        backgroundColor: "#2196f3"
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Rx Share by Prisma RSM"
        }
      },
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderDoctorTable() {
  const tbody = document.querySelector("#doctorTable tbody");
  tbody.innerHTML = "";
  doctors.forEach(doc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doc.name}</td>
      <td>${doc.spec}</td>
      <td>${doc.addr}</td>
      <td>${doc.ing}</td>
    `;
    tbody.appendChild(row);
  });
}
