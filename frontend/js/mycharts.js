const month = Array.from({ length: 30 }, (_, i) => i + 1);

const a = document.getElementById('dataChart');
const b = document.getElementById('pieChart');
const c = document.getElementById('barChart');

if (a) {
  new Chart(a.getContext('2d'), {
    type: 'line',
    data: {
      labels: month,
      datasets: [{
        label: 'Поступления',
        data: [5, 54, 50, 50, 78, 50, 44],
        fill: false,
        backgroundColor: 'rgb(22, 24, 30)',
        borderColor: 'rgb(137, 255, 143)',
        tension: 0.1
      },
      {
        label: 'Платежи',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        backgroundColor: 'rgb(22, 24, 30)',
        borderColor: 'rgb(187, 103, 103)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              family: 'Overpass'
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

if (b) {
  new Chart(b.getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Аренда', 'Зарплата', 'Закупки', 'Налоги', 'Прочее'],
      datasets: [{
        data: [30, 40, 15, 10, 5],
        backgroundColor: [
          'rgb(85, 45, 135)',
          'rgb(108, 68, 158)',
          'rgb(128, 88, 175)',
          'rgb(148, 100, 185)',
          'rgb(154, 103, 187)',
          'rgb(173, 134, 198)',
          'rgb(185, 135, 225)',
          'rgb(196, 137, 255)',
          'rgb(210, 165, 240)',
          'rgb(228, 200, 250)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '50%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              family: 'Overpass'
            }
          }
        }
      }
    }
  });
}

if (c) {
  new Chart(c.getContext('2d'), {
    type: 'bar',
    data: {
      labels: month,
      datasets: [{
        label: 'Притоки',
        data: [5, 54, 50, 50, 78, 50, 44],
        backgroundColor: 'rgb(137, 255, 143)'
      },
      {
        label: 'Оттоки',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgb(187, 103, 103)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              family: 'Overpass'
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}