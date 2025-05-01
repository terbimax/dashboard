// script.js

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSX9x88IxgSvZpbUYyNL8N3Y3iUf8zwvx_dZr6D1mBpQnceftpszqMAEFFc5f3mGbQ_zhhXJrncVjY8/pub?gid=0&single=true&output=csv";

let nationalData = {};
let psoData = {};
let doctors = [];

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  complete: function (results) {
    processData(results.data);
    renderNationalChart();
    renderPsoChart();
    renderDoctorTable();
  }
});

function processData(data) {
  data.forEach(row => {
    const ing = row.ING;
    const pso = row["PSO NAMES"];
    const vc2 = row.VC2;
    const doc = {
      name: row.PHY_NM,
      spec: row.PHY_SPC,
      addr: row.CH_ADD,
      ing: row.ING
    };

    if (ing && vc2) {
      nationalData[ing] = nationalData[ing] || { rnt: 0, others: 0 };
      nationalData[ing][vc2 === "RNT" ? "rnt" : "others"]++;
    }

    if (pso && ing && vc2) {
      psoData[pso] = psoData[pso] || {};
      psoData[pso][ing] = psoData[pso][ing] || { rnt: 0, others: 0 };
      psoData[pso][ing][vc2 === "RNT" ? "rnt" : "others"]++;
    }

    if (doc.name && doc.addr && doc.ing) {
      doctors.push(doc);
    }
  });
}

function renderNationalChart() {
  const labels = Object.keys(nationalData);
  const rntData = labels.map(ing => nationalData[ing].rnt);
  const othersData = labels.map(ing => nationalData[ing].others);

  new Chart(document.getElementById("nationalChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "RNT",
          data: rntData,
          backgroundColor: "#4caf50"
        },
        {
          label: "Others",
          data: othersData,
          backgroundColor: "#f44336"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "National Rx Share by Product"
        }
      }
    }
  });
}

function renderPsoChart() {
  const labels = Object.keys(psoData);
  const rntTotals = labels.map(pso => {
    return Object.values(psoData[pso]).reduce((sum, v) => sum + v.rnt, 0);
  });
  const othersTotals = labels.map(pso => {
    return Object.values(psoData[pso]).reduce((sum, v) => sum + v.others, 0);
  });

  new Chart(document.getElementById("psoChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "RNT",
          data: rntTotals,
          backgroundColor: "#2196f3"
        },
        {
          label: "Others",
          data: othersTotals,
          backgroundColor: "#ff9800"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Rx Share by PSO"
        }
      }
    }
  });
}

function renderDoctorTable() {
  const tbody = document.querySelector("#doctorTable tbody");
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
