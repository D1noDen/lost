
async function loadData() {
  const response = await fetch('accounts.json');
  const data = await response.json();
  const dateProfit = {};
  const accountProfits = [];
  let farming = 0, inactive = 0;

  data.accounts.forEach(account => {
    const name = account.login || account.name || 'NoName';
    accountProfits.push({ name: name, profit: account.income || 0 });

    if (account.farming) farming++;
    else inactive++;

    account.history.forEach(entry => {
      if (!dateProfit[entry.date]) dateProfit[entry.date] = 0;
      dateProfit[entry.date] += entry.amount;
    });
  });

  const statuses = {
    'Фармляться': farming,
    'Неактивні': inactive
  };

  const weeklyData = calculateWeeklyRevenue(data.accounts);
  const sortedDateProfit = sortDateProfit(dateProfit);
  renderCharts(sortedDateProfit, accountProfits, statuses, weeklyData);
  updateDashboard(data.accounts);
}

function sortDateProfit(dateProfit) {
  const sortedDates = Object.keys(dateProfit).sort((a, b) => {
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateA - dateB;
  });
  
  console.log('Original dates:', Object.keys(dateProfit));
  console.log('Sorted dates:', sortedDates);
  
  const sortedDateProfit = {};
  sortedDates.forEach(date => {
    sortedDateProfit[date] = dateProfit[date];
  });
  
  return sortedDateProfit;
}

function calculateWeeklyRevenue(accounts) {
  const weeklyData = {};
  
  accounts.forEach(account => {
    account.history.forEach(entry => {
      const date = parseDate(entry.date);
      if (date) {
        const weekStart = getWednesdayWeekStart(date);
        const weekKey = formatDate(weekStart);
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = 0;
        }
        weeklyData[weekKey] += entry.amount;
        
        // Debug logging
        console.log(`Date: ${entry.date}, Week start: ${weekKey}, Amount: ${entry.amount}`);
      }
    });
  });
  
  console.log('Weekly data:', weeklyData);
  return weeklyData;
}

function parseDate(dateStr) {
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    return new Date(year, month - 1, day);
  }
  return null;
}

function getWednesdayWeekStart(date) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  let daysFromWednesday;
  
  if (dayOfWeek >= 3) {
    // If it's Wednesday (3) or later in the week, go back to Wednesday
    daysFromWednesday = dayOfWeek - 3;
  } else {
    // If it's Sunday (0), Monday (1), or Tuesday (2), go back to previous Wednesday
    daysFromWednesday = dayOfWeek + 4; // 0+4=4, 1+4=5, 2+4=6 days back
  }
  
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysFromWednesday);
  return weekStart;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function renderCharts(sortedDateProfit, accountProfits, statuses, weeklyData) {
  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: Object.keys(sortedDateProfit),
      datasets: [{
        label: 'Прибуток по датах',
        data: Object.values(sortedDateProfit),
        borderColor: 'cyan',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 2,
      plugins: {
        legend: {
          labels: {
            color: '#00ffc8'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#00ffc8'
          },
          grid: {
            color: 'rgba(0, 255, 200, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#00ffc8'
          },
          grid: {
            color: 'rgba(0, 255, 200, 0.1)'
          }
        }
      }
    }
  });

  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: accountProfits.map(a => a.name),
      datasets: [{
        label: 'Прибуток по акаунтах',
        data: accountProfits.map(a => a.profit),
        backgroundColor: 'magenta'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 2,
      plugins: {
        legend: {
          labels: {
            color: '#00ffc8'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#00ffc8'
          },
          grid: {
            color: 'rgba(0, 255, 200, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#00ffc8'
          },
          grid: {
            color: 'rgba(0, 255, 200, 0.1)'
          }
        }
      }
    }
  });

  // Weekly revenue chart (Wednesday to Wednesday)
  const sortedWeeks = Object.keys(weeklyData).sort((a, b) => {
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateA - dateB;
  });

  new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: {
      labels: sortedWeeks.map(week => {
        const startDate = parseDate(week);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        return `${week} - ${formatDate(endDate)}`;
      }),
      datasets: [{
        label: 'Тижневий дохід',
        data: sortedWeeks.map(week => weeklyData[week]),
        backgroundColor: 'rgba(0, 255, 200, 0.7)',
        borderColor: 'rgba(0, 255, 200, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 2,
      plugins: {
        legend: {
          labels: {
            color: '#00ffc8'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#00ffc8'
          },
          grid: {
            color: 'rgba(0, 255, 200, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#00ffc8',
            maxRotation: 45
          },
          grid: {
            color: 'rgba(0, 255, 200, 0.1)'
          }
        }
      }
    }
  });
}

window.onload = loadData;



function updateDashboard(accounts) {
  const total = accounts.length;
  const incomeSum = accounts.reduce((sum, a) => sum + (a.income || 0), 0);
  const primeCount = accounts.filter(a => a.prime).length;
  const avgIncome = total ? Math.round(incomeSum / total) : 0;

  document.getElementById('totalIncome').textContent = incomeSum;
  document.getElementById('averageIncome').textContent = avgIncome;
  document.getElementById('primeCount').textContent = primeCount;
  document.getElementById('totalAccounts').textContent = total;

  const top = [...accounts]
    .filter(a => a.income)
    .sort((a, b) => b.income - a.income)
    .slice(0, 5);

  const lb = document.getElementById('leaderboard');
  lb.innerHTML = '';
  top.forEach(a => {
    const name = a.login || a.name || 'NoName';
    const item = document.createElement('li');
    item.textContent = `${name} — ${a.income}`;
    lb.appendChild(item);
  });
}
