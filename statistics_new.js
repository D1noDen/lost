// Функція для оновлення карток статистики
function updateStatCards(accounts) {
  const totalAccounts = accounts.length;
  const totalIncome = accounts.reduce((sum, acc) => sum + (parseFloat(acc.income) || 0), 0);
  const totalExpenses = accounts.reduce((sum, acc) => sum + (parseFloat(acc.expenses) || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  // Оновлюємо картки з анімацією
  animateCounter('total-accounts', totalAccounts, '');
  animateCounter('total-income', totalIncome, ' грн');
  animateCounter('total-expenses', totalExpenses, ' грн');
  animateCounter('net-profit', netProfit, ' грн', netProfit < 0 ? '#dc3545' : '#10b981');
}

// Функція для анімації лічильників
function animateCounter(elementId, targetValue, suffix = '', color = '#10b981') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startValue = 0;
  const duration = 1500;
  const startTime = performance.now();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function для плавної анімації
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
    
    element.textContent = currentValue.toLocaleString() + suffix;
    element.style.color = color;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

async function loadData() {
  try {
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

      if (account.history && account.history.length > 0) {
        account.history.forEach(entry => {
          let entryDate = entry.date;
          // Обробка різних форматів дат
          if (entryDate.includes('T')) {
            entryDate = new Date(entryDate).toLocaleDateString('uk-UA');
          }
          if (!dateProfit[entryDate]) dateProfit[entryDate] = 0;
          dateProfit[entryDate] += entry.amount;
        });
      }
    });

    const statuses = {
      'Фармляться': farming,
      'Неактивні': inactive
    };

    const weeklyData = calculateWeeklyRevenue(data.accounts);
    const sortedDateProfit = sortDateProfit(dateProfit);
    
    // Оновлюємо картки статистики
    updateStatCards(data.accounts);
    
    renderCharts(sortedDateProfit, accountProfits, statuses, weeklyData);
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
  }
}

function sortDateProfit(dateProfit) {
  const sortedDates = Object.keys(dateProfit).sort((a, b) => {
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateA - dateB;
  });
  
  const sortedDateProfit = {};
  sortedDates.forEach(date => {
    sortedDateProfit[date] = dateProfit[date];
  });
  
  return sortedDateProfit;
}

function parseDate(dateString) {
  const parts = dateString.split('.');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateString);
}

function calculateWeeklyRevenue(accounts) {
  const weeklyRevenue = [];
  const weekMap = {};

  accounts.forEach(account => {
    if (account.history && account.history.length > 0) {
      account.history.forEach(entry => {
        let entryDate = entry.date;
        if (entryDate.includes('T')) {
          entryDate = new Date(entryDate).toLocaleDateString('uk-UA');
        }
        
        const date = parseDate(entryDate);
        const weekStart = getWednesdayOfWeek(date);
        const weekKey = formatDate(weekStart);
        
        if (!weekMap[weekKey]) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekMap[weekKey] = {
            weekStart: weekKey,
            weekEnd: formatDate(weekEnd),
            totalRevenue: 0
          };
        }
        
        weekMap[weekKey].totalRevenue += entry.amount;
      });
    }
  });

  return Object.values(weekMap).sort((a, b) => 
    new Date(a.weekStart.split('.').reverse().join('-')) - 
    new Date(b.weekStart.split('.').reverse().join('-'))
  );
}

function getWednesdayOfWeek(date) {
  const dayOfWeek = date.getDay();
  let daysFromWednesday;
  
  if (dayOfWeek >= 3) {
    daysFromWednesday = dayOfWeek - 3;
  } else {
    daysFromWednesday = dayOfWeek + 4;
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
  // Покращені кольори та градієнти
  const chartColors = {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#6ee7b7',
    background: 'rgba(16, 185, 129, 0.1)',
    gradient: 'rgba(16, 185, 129, 0.3)'
  };

  // Лінійний графік доходів
  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: Object.keys(sortedDateProfit),
      datasets: [{
        label: 'Прибуток по датах',
        data: Object.values(sortedDateProfit),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: chartColors.secondary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartColors.accent,
            font: { size: 14, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: chartColors.accent,
          bodyColor: '#ffffff',
          borderColor: chartColors.primary,
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: chartColors.accent,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(16, 185, 129, 0.2)'
          }
        },
        x: {
          ticks: {
            color: chartColors.accent,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(16, 185, 129, 0.2)'
          }
        }
      }
    }
  });

  // Стовпчикова діаграма акаунтів
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: accountProfits.map(acc => acc.name),
      datasets: [{
        label: 'Прибуток по акаунтах',
        data: accountProfits.map(acc => acc.profit),
        backgroundColor: accountProfits.map((_, index) => 
          `hsl(${150 + index * 15}, 70%, ${50 + (index % 3) * 10}%)`
        ),
        borderColor: chartColors.primary,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartColors.accent,
            font: { size: 14, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: chartColors.accent,
          bodyColor: '#ffffff',
          borderColor: chartColors.primary,
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: chartColors.accent,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(16, 185, 129, 0.2)'
          }
        },
        x: {
          ticks: {
            color: chartColors.accent,
            font: { size: 12 },
            maxRotation: 45
          },
          grid: {
            color: 'rgba(16, 185, 129, 0.2)'
          }
        }
      }
    }
  });

  // Тижневий графік
  new Chart(document.getElementById('weeklyChart'), {
    type: 'doughnut',
    data: {
      labels: weeklyData.map(week => `${week.weekStart} - ${week.weekEnd}`),
      datasets: [{
        data: weeklyData.map(week => week.totalRevenue),
        backgroundColor: [
          '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
          '#047857', '#065f46', '#059669', '#0d9488', '#0f766e'
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: chartColors.accent,
            font: { size: 12 },
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: chartColors.accent,
          bodyColor: '#ffffff',
          borderColor: chartColors.primary,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed} грн`;
            }
          }
        }
      }
    }
  });
}

window.onload = loadData;
