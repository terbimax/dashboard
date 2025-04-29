fetch('data.json')
  .then(response => response.json())
  .then(({ labels, data }) => {
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Monthly Sales',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      }
    });
  });
