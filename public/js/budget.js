// public/js/budget.js
// Handles UI logic for Budget Management, calculation displays, and real-time updates

document.addEventListener('DOMContentLoaded', async () => {
  // DOM references
  const form = document.getElementById('budget-form');
  const saveBtn = document.getElementById('save-budget-btn');
  const resetBtn = document.getElementById('reset-budget-btn');
  const errorEl = document.getElementById('budget-error');
  const successEl = document.getElementById('budget-success');
  const userNameEl = document.getElementById('user-name');
  const logoutBtn = document.getElementById('logout-btn');

  // Input Fields
  const inputIncome = document.getElementById('monthly-income');
  const inputDailyBudget = document.getElementById('daily-spending-limit');
  const inputMonthlyBudget = document.getElementById('monthly-spending-limit');
  const inputSavingsTarget = document.getElementById('savings-target');
  const inputEmergencyTarget = document.getElementById('emergency-fund-target');
  const inputFutureTarget = document.getElementById('future-purchase-target');

  // Highlights / Status
  const statusPill = document.getElementById('budget-status-pill');
  const warningsContainer = document.getElementById('warnings-container');
  const warningsList = document.getElementById('warnings-list');

  // Top Cards
  const cardDailyRemaining = document.getElementById('card-daily-remaining');
  const cardDailySpent = document.getElementById('card-daily-spent');
  const cardMonthlyRemaining = document.getElementById('card-monthly-remaining');
  const cardMonthlySpent = document.getElementById('card-monthly-spent');
  const cardAvailableSavings = document.getElementById('card-available-savings');
  const cardSavingsProgress = document.getElementById('card-savings-progress');
  const cardBudgetUsage = document.getElementById('card-budget-usage');
  const cardBudgetStatus = document.getElementById('card-budget-status');

  // Progress Bars & Labels
  const progUsageLabel = document.getElementById('prog-usage-label');
  const progUsageFill = document.getElementById('prog-usage-fill');
  const progSavingsLabel = document.getElementById('prog-savings-label');
  const progSavingsFill = document.getElementById('prog-savings-fill');

  // Detail Metrics
  const detIncome = document.getElementById('det-income');
  const detBudget = document.getElementById('det-budget');
  const detSpending = document.getElementById('det-spending');
  const detRemaining = document.getElementById('det-remaining');
  const detSavings = document.getElementById('det-savings');
  const detSavingsTarget = document.getElementById('det-savings-target');
  const detEmergencyTarget = document.getElementById('det-emergency-target');
  const detFutureTarget = document.getElementById('det-future-target');

  let currentBudgetData = null;

  // --- Authenticate User ---
  try {
    const meRes = await fetch('/api/auth/me');
    const meData = await meRes.json();
    if (meData.success) {
      userNameEl.textContent = meData.data.user.username;
    } else {
      window.location.href = '/';
      return;
    }
  } catch {
    window.location.href = '/';
    return;
  }

  // --- Load Initial Budget & Analytics ---
  await loadBudget();

  // --- Save Budget Form Submission ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

    const payload = {
      monthly_income: parseFloat(inputIncome.value) || 0,
      daily_spending_limit: parseFloat(inputDailyBudget.value) || 0,
      monthly_spending_limit: parseFloat(inputMonthlyBudget.value) || 0,
      savings_target: parseFloat(inputSavingsTarget.value) || 0,
      emergency_fund_target: parseFloat(inputEmergencyTarget.value) || 0,
      future_purchase_target: parseFloat(inputFutureTarget.value) || 0,
    };

    try {
      const res = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess('Budget settings successfully saved and updated!');
        renderAnalytics(data.data);
      } else {
        showError(data.message || 'Failed to save budget settings');
      }
    } catch (err) {
      showError('Network error while saving budget.');
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'UPDATE BUDGET';
  });

  // --- Reset Button ---
  resetBtn.addEventListener('click', () => {
    if (currentBudgetData) {
      populateInputs(currentBudgetData.budget);
      showSuccess('Form reset to saved values.');
    }
  });

  // --- Logout ---
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // ==========================================================
  // HELPER FUNCTIONS
  // ==========================================================

  async function loadBudget() {
    try {
      const res = await fetch('/api/budget');
      const data = await res.json();
      if (data.success) {
        currentBudgetData = data.data;
        populateInputs(data.data.budget);
        renderAnalytics(data.data);
      } else {
        showError('Unable to load budget information.');
      }
    } catch (err) {
      console.error('Error loading budget:', err);
      showError('Failed to fetch budget data.');
    }
  }

  function populateInputs(b) {
    inputIncome.value = b.monthly_income || '';
    inputDailyBudget.value = b.daily_spending_limit || '';
    inputMonthlyBudget.value = b.monthly_spending_limit || '';
    inputSavingsTarget.value = b.savings_target || '';
    inputEmergencyTarget.value = b.emergency_fund_target || '';
    inputFutureTarget.value = b.future_purchase_target || '';

    if (b.monthly_income > 0 || b.monthly_spending_limit > 0) {
      saveBtn.textContent = 'UPDATE BUDGET';
    } else {
      saveBtn.textContent = 'SAVE BUDGET';
    }
  }

  function renderAnalytics(data) {
    const {
      budget,
      todaySpent,
      dailyRemaining,
      monthlySpent,
      monthlyRemaining,
      budgetUsagePercent,
      availableSavings,
      savingsProgressPercent,
      budgetStatus,
      budgetStatusLabel,
      warnings,
    } = data;

    // Status Pill
    statusPill.textContent = `Status: ${budgetStatusLabel}`;
    statusPill.className = `budget-status-pill status-pill-${budgetStatus.toLowerCase().replace(/\s+/g, '-')}`;

    // Top Cards
    cardDailyRemaining.textContent = formatMoney(dailyRemaining);
    cardDailyRemaining.className = `summary-value ${dailyRemaining < 0 ? 'text-danger' : 'text-success'}`;
    cardDailySpent.textContent = `Spent: ${formatMoney(todaySpent)} / ${formatMoney(budget.daily_spending_limit)}`;

    cardMonthlyRemaining.textContent = formatMoney(monthlyRemaining);
    cardMonthlyRemaining.className = `summary-value ${monthlyRemaining < 0 ? 'text-danger' : 'text-success'}`;
    cardMonthlySpent.textContent = `Spent: ${formatMoney(monthlySpent)} / ${formatMoney(budget.monthly_spending_limit)}`;

    cardAvailableSavings.textContent = formatMoney(availableSavings);
    cardAvailableSavings.className = `summary-value ${availableSavings < 0 ? 'text-danger' : 'text-success'}`;
    cardSavingsProgress.textContent = `Target: ${formatMoney(budget.savings_target)} (${savingsProgressPercent}%)`;

    cardBudgetUsage.textContent = `${budgetUsagePercent}%`;
    cardBudgetStatus.textContent = `Status: ${budgetStatusLabel}`;

    // Progress Bars
    progUsageLabel.textContent = `${budgetUsagePercent}% (${formatMoney(monthlySpent)} / ${formatMoney(budget.monthly_spending_limit)})`;
    progUsageFill.style.width = `${Math.min(100, Math.max(0, budgetUsagePercent))}%`;
    progUsageFill.className = `progress-fill ${budgetUsagePercent > 100 ? 'progress-fill-red' : budgetUsagePercent > 80 ? 'progress-fill-yellow' : 'progress-fill-blue'}`;

    progSavingsLabel.textContent = `${savingsProgressPercent}% (${formatMoney(Math.max(0, availableSavings))} / ${formatMoney(budget.savings_target)})`;
    progSavingsFill.style.width = `${savingsProgressPercent}%`;

    // Detailed Metrics
    detIncome.textContent = formatMoney(budget.monthly_income);
    detBudget.textContent = formatMoney(budget.monthly_spending_limit);
    detSpending.textContent = formatMoney(monthlySpent);
    detRemaining.textContent = formatMoney(monthlyRemaining);
    detRemaining.className = `metric-value ${monthlyRemaining < 0 ? 'text-danger' : 'text-success'}`;

    detSavings.textContent = formatMoney(availableSavings);
    detSavings.className = `metric-value ${availableSavings < 0 ? 'text-danger' : 'text-success'}`;

    detSavingsTarget.textContent = formatMoney(budget.savings_target);
    detEmergencyTarget.textContent = formatMoney(budget.emergency_fund_target);
    detFutureTarget.textContent = formatMoney(budget.future_purchase_target);

    // Warnings Box
    if (warnings && warnings.length > 0) {
      warningsContainer.classList.remove('hidden');
      warningsList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
    } else {
      warningsContainer.classList.add('hidden');
    }
  }

  function formatMoney(val) {
    return '₱' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
    successEl.classList.add('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 5000);
  }

  function showSuccess(msg) {
    successEl.textContent = msg;
    successEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    setTimeout(() => successEl.classList.add('hidden'), 5000);
  }

  function hideMessages() {
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
  }
});
