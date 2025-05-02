document.addEventListener('DOMContentLoaded', () => {
  const CSV_URL = 'data.csv';
  const GENERIC_COL = 'ING';
  const VC2_COL = 'VC2';
  const RSM_COL = 'Prisma RSM';
  const DSM_COL = 'Prisma DSM';
  const DR_NAME_COL = 'PHY_NM';
  const DEGREE_COL = 'PHY_DEGR';
  const SPC_COL = 'PHY_SPC';
  const ADDR_COL = 'CH_ADD';
  const DIST_COL = 'CH_DIST';
  const THANA_COL = 'CH_THN';
  const PSO_COL = 'Prisma PSO';

  let allData = [];

  function parseCSV() {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: results => {
        allData = results.data;
        initDashboard();
      }
    });
  }

  function initDashboard() {
    const generics = [...new Set(allData.map(row => row[GENERIC_COL]).filter(Boolean))];
    createGenericFilter(generics);
    renderAll(generics);
  }

  function createGenericFilter(generics) {
    const container = document.getElementById('genericFilter');
    container.innerHTML = generics.map(g => `
      <label><input type="checkbox" value="${g}" checked> ${g}</label>
    `).join('');

    container.querySelectorAll('input').forEach(cb => {
      cb.addEventListener('change', () => {
        const selected = getSelectedGenerics();
        renderAll(selected);
      });
    });
  }

  function getSelectedGenerics() {
    return [...document.querySelectorAll('#genericFilter input:checked')].map(cb => cb.value);
  }

  function renderAll(selectedGenerics) {
    renderChart('genericChart', calculateShare(selectedGenerics, GENERIC_COL));
    renderChart('rsmChart', calculateShare(selectedGenerics, RSM_COL));
    renderChart('dsmChart', calculateShare(selectedGenerics, DSM_COL));
    renderDoctorTable(selectedGenerics);
  }

  function calculateShare(generics, groupCol) {
    const filtered = allData.filter(row => generics.includes(row[GENERIC_COL]));
    const groups = {};
    filtered.forEach(row => {
      const group = row[groupCol];
      const isRenata = row[VC2_COL] === 'RNT';
      if (!groups[group]) groups[group] = { total: 0, rnt: 0 };
      groups[group].total++;
      if (isRenata) groups[group].rnt++;
    });

    return Object.entries(groups).map(([key, val]) => ({
      label: key,
      value: val.total === 0 ? 0 : ((val.rnt / val.total) * 100).toFixed(2)
    })).sort((a, b) => b.value - a.value);
  }

  function renderChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (window[canvasId]) window[canvasId].destroy();
    window[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Rx Share (%)',
          data: data.map(d => d.value),
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  function renderDoctorTable(generics) {
    const filtered = allData.filter(row => generics.includes(row[GENERIC_COL]));
    const drMap = {};

    filtered.forEach(row => {
      const dr = row[DR_NAME_COL];
      if (!drMap[dr]) {
        drMap[dr] = {
          name: dr,
          degree: row[DEGREE_COL],
          specialty: row[SPC_COL],
          address: row[ADDR_COL],
          district: row[DIST_COL],
          thana: row[THANA_COL],
          total: 0,
          rnt: 0,
          pso: row[PSO_COL]
        };
      }
      drMap[dr].total++;
      if (row[VC2_COL] === 'RNT') drMap[dr].rnt++;
    });

    const rows = Object.values(drMap).map(d => ({
      ...d,
      share: d.total === 0 ? 0 : ((d.rnt / d.total) * 100).toFixed(2)
    })).sort((a, b) => b.share - a.share);

    const tbody = document.querySelector('#doctorTable tbody');
    tbody.innerHTML = rows.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.degree}</td>
        <td>${d.specialty}</td>
        <td>${d.address}</td>
        <td>${d.district}</td>
        <td>${d.thana}</td>
        <td>${d.total}</td>
        <td>${d.rnt}</td>
        <td>${d.share}</td>
        <td>${d.pso}</td>
      </tr>
    `).join('');
  }

  // Tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  parseCSV();
});
