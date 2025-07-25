// Імпорт системи перекладів
let languageManager;

// Функція для отримання перекладу
function t(key) {
  if (!languageManager) {
    return key;
  }
  return languageManager.translate(key);
}

// Ініціалізація системи перекладів
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = './js/translations.js';
  script.onload = () => {
    if (typeof LanguageManager !== 'undefined') {
      languageManager = new LanguageManager();
      updateStatCards([]); // Оновити після ініціалізації
    }
  };
  document.head.appendChild(script);
});

// Функція для оновлення карток статистики
function updateStatCards(accounts) {
  const totalAccounts = accounts.length;
  const totalIncome = accounts.reduce((sum, acc) => sum + (parseFloat(acc.income) || 0), 0);
  const totalExpenses = accounts.reduce((sum, acc) => sum + (parseFloat(acc.expenses) || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  // Оновлюємо картки з анімацією
  animateCounter('total-accounts', totalAccounts, '');
  animateCounter('total-income', totalIncome, ` ${t('currency_uah')}`);
  animateCounter('total-expenses', totalExpenses, ` ${t('currency_uah')}`);
  animateCounter('net-profit', netProfit, ` ${t('currency_uah')}`, netProfit < 0 ? '#dc3545' : '#10b981');
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
    // Використовуємо IPC для отримання шляху до файлу акаунтів
    const { ipcRenderer } = require('electron');
    const accountsFilePath = await ipcRenderer.invoke('get-accounts-file-path');
    
    // Читаємо файл через Node.js fs замість fetch
    const fs = require('fs');
    
    if (!fs.existsSync(accountsFilePath)) {
      console.warn('Файл акаунтів не знайдено, створюємо порожню структуру');
      const data = { accounts: [] };
      updateStatCards(data.accounts);
      renderCharts({}, [], {}, {});
      return;
    }
    
    const fileContent = fs.readFileSync(accountsFilePath, 'utf8');
    const data = JSON.parse(fileContent);
    
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
    updateWeeklySummary(weeklyData); // Оновлення статистики тижневих доходів
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
    // Відображаємо порожню статистику у випадку помилки
    updateStatCards([]);
    renderCharts({}, [], {}, {});
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
        label: t('chart_tooltip_income'),
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
        label: t('chart_tooltip_comparison'),
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

  // Оновлюємо статистику тижневих доходів
  updateWeeklySummary(weeklyData);

  // Тижневий графік з покращеним дизайном
  new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: {
      labels: weeklyData.map(week => {
        // Форматуємо дати для кращого відображення
        const start = week.weekStart.split('.').slice(0, 2).join('.');
        const end = week.weekEnd.split('.').slice(0, 2).join('.');
        return `${start} - ${end}`;
      }),
      datasets: [{
        label: `${t('chart_tooltip_weekly')} (${t('currency_uah')})`,
        data: weeklyData.map(week => week.totalRevenue),
        backgroundColor: weeklyData.map((_, index) => {
          // Створюємо градієнт кольорів для кожного стовпчика
          const hue = 150 + (index * 25) % 60; // Варіація зелених відтінків
          const saturation = 70 + (index % 3) * 10;
          const lightness = 45 + (index % 4) * 5;
          return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }),
        borderColor: chartColors.primary,
        borderWidth: 2,
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 4,
          bottomRight: 4
        },
        borderSkipped: false,
        hoverBackgroundColor: weeklyData.map((_, index) => {
          const hue = 150 + (index * 25) % 60;
          const saturation = 80;
          const lightness = 55;
          return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }),
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: chartColors.accent,
            font: { size: 14, weight: 'bold' },
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: chartColors.accent,
          bodyColor: '#ffffff',
          borderColor: chartColors.primary,
          borderWidth: 2,
          cornerRadius: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              const weekData = weeklyData[context[0].dataIndex];
              return `${t('week')}: ${weekData.weekStart} - ${weekData.weekEnd}`;
            },
            label: function(context) {
              return `${t('income')}: ${context.parsed.y.toLocaleString()} ${t('currency_uah')}`;
            },
            afterLabel: function(context) {
              const total = weeklyData.reduce((sum, week) => sum + week.totalRevenue, 0);
              const percentage = ((context.parsed.y / total) * 100).toFixed(1);
              return `${t('share')}: ${percentage}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: chartColors.accent,
            font: { size: 12, weight: '500' },
            callback: function(value) {
              return value.toLocaleString() + ' грн';
            }
          },
          grid: {
            color: 'rgba(16, 185, 129, 0.15)',
            lineWidth: 1
          },
          border: {
            color: chartColors.primary,
            width: 2
          }
        },
        x: {
          ticks: {
            color: chartColors.accent,
            font: { size: 11, weight: '500' },
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            display: false
          },
          border: {
            color: chartColors.primary,
            width: 2
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// Функція для оновлення статистики тижневих доходів
function updateWeeklySummary(weeklyData) {
  const summaryContainer = document.getElementById('weekly-summary');
  if (!summaryContainer || weeklyData.length === 0) return;

  const totalWeeklyRevenue = weeklyData.reduce((sum, week) => sum + week.totalRevenue, 0);
  const averageWeeklyRevenue = totalWeeklyRevenue / weeklyData.length;
  const bestWeek = weeklyData.reduce((best, week) => 
    week.totalRevenue > best.totalRevenue ? week : best, weeklyData[0]);
  const worstWeek = weeklyData.reduce((worst, week) => 
    week.totalRevenue < worst.totalRevenue ? week : worst, weeklyData[0]);

  summaryContainer.innerHTML = `
    <div class="weekly-stat-item">
      <div class="weekly-stat-value">${totalWeeklyRevenue.toLocaleString()}</div>
      <div class="weekly-stat-label">${t('total_income')}</div>
    </div>
    <div class="weekly-stat-item">
      <div class="weekly-stat-value">${Math.round(averageWeeklyRevenue).toLocaleString()}</div>
      <div class="weekly-stat-label">${t('chart_tooltip_weekly')}</div>
    </div>
    <div class="weekly-stat-item">
      <div class="weekly-stat-value">${bestWeek.totalRevenue.toLocaleString()}</div>
      <div class="weekly-stat-label">${t('chart_tooltip_weekly')} (${t('chart_tooltip_account')})</div>
    </div>
    <div class="weekly-stat-item">
      <div class="weekly-stat-value">${worstWeek.totalRevenue.toLocaleString()}</div>
      <div class="weekly-stat-label">${t('chart_tooltip_weekly')} (${t('minimum')})</div>
    </div>
  `;
}

window.onload = loadData;
