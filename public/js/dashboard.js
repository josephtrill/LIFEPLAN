// public/js/dashboard.js
// Fetches and displays financial summaries, budget progress, and active warnings

document.addEventListener('DOMContentLoaded', async () => {
  // Expense elements
  const todayEl = document.getElementById('today-expense');
  const weeklyEl = document.getElementById('weekly-expense');
  const monthlyEl = document.getElementById('monthly-expense');
  const categoryBarsEl = document.getElementById('category-bars');

  // Budget elements
  const todayRemainingEl = document.getElementById('dash-today-remaining');
  const todayDetailsEl = document.getElementById('dash-today-details');
  const monthlyRemainingEl = document.getElementById('dash-monthly-remaining');
  const monthlyDetailsEl = document.getElementById('dash-monthly-details');
  const monthlyIncomeEl = document.getElementById('dash-monthly-income');
  const availableSavingsEl = document.getElementById('dash-available-savings');
  const savingsDetailsEl = document.getElementById('dash-savings-details');
  const budgetStatusEl = document.getElementById('dash-budget-status');
  const usageSubtextEl = document.getElementById('dash-usage-subtext');

  // Warnings elements
  const warningsBox = document.getElementById('dash-warnings');
  const warningsList = document.getElementById('dash-warnings-list');

  // User elements
  const userNameEl = document.getElementById('user-name');
  const greetingEl = document.getElementById('greeting');
  const headerDateEl = document.getElementById('header-date');
  const logoutBtn = document.getElementById('logout-btn');

  // Display today's date
  const now = new Date();
  headerDateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch the current user info
  try {
    const meRes = await fetch('/api/auth/me');
    const meData = await meRes.json();
    if (meData.success) {
      userNameEl.textContent = meData.data.user.username;
      greetingEl.textContent = `Welcome back, ${meData.data.user.username}!`;
    } else {
      window.location.href = '/';
      return;
    }
  } catch {
    window.location.href = '/';
    return;
  }

  // Fetch expense summary
  try {
    const res = await fetch('/api/expenses/summary');
    const data = await res.json();

    if (data.success) {
      const s = data.data;
      todayEl.textContent = formatMoney(s.today);
      weeklyEl.textContent = formatMoney(s.weekly);
      monthlyEl.textContent = formatMoney(s.monthly);

      // Build category bars
      const categories = Object.entries(s.byCategory || {});
      if (categories.length > 0) {
        const maxVal = Math.max(...categories.map(([, v]) => v));
        categoryBarsEl.innerHTML = categories
          .sort((a, b) => b[1] - a[1])
          .map(([cat, val]) => `
            <div class="cat-bar-row">
              <span class="cat-bar-label">${cat}</span>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width: ${(val / maxVal) * 100}%"></div>
              </div>
              <span class="cat-bar-value">${formatMoney(val)}</span>
            </div>
          `).join('');
      } else {
        categoryBarsEl.innerHTML = '<p class="text-secondary" style="text-align:left;">No expenses recorded yet. Add your first expense!</p>';
      }
    }
  } catch (err) {
    console.error('Failed to load expense summary', err);
  }

  // Fetch budget analytics
  try {
    const bRes = await fetch('/api/budget');
    const bData = await bRes.json();

    if (bData.success) {
      const b = bData.data;

      // Today's Budget Card
      todayRemainingEl.textContent = formatMoney(b.dailyRemaining);
      todayRemainingEl.className = `summary-value ${b.dailyRemaining < 0 ? 'text-danger' : 'text-success'}`;
      todayDetailsEl.textContent = `Budget: ${formatMoney(b.budget.daily_spending_limit)} | Spent: ${formatMoney(b.todaySpent)}`;

      // Monthly Budget Card
      monthlyRemainingEl.textContent = formatMoney(b.monthlyRemaining);
      monthlyRemainingEl.className = `summary-value ${b.monthlyRemaining < 0 ? 'text-danger' : 'text-success'}`;
      monthlyDetailsEl.textContent = `Budget: ${formatMoney(b.budget.monthly_spending_limit)} | Spent: ${formatMoney(b.monthlySpent)}`;

      // Monthly Income
      monthlyIncomeEl.textContent = formatMoney(b.budget.monthly_income);

      // Savings Card
      availableSavingsEl.textContent = formatMoney(b.availableSavings);
      availableSavingsEl.className = `summary-value ${b.availableSavings < 0 ? 'text-danger' : 'text-success'}`;
      savingsDetailsEl.textContent = `Target: ${formatMoney(b.budget.savings_target)} (${b.savingsProgressPercent}%)`;

      // Status
      budgetStatusEl.textContent = b.budgetStatusLabel;
      budgetStatusEl.className = `summary-value status-text-${b.budgetStatus.toLowerCase().replace(/\s+/g, '-')}`;
      usageSubtextEl.textContent = `Usage: ${b.budgetUsagePercent}%`;

      // Warnings
      if (b.warnings && b.warnings.length > 0) {
        warningsBox.classList.remove('hidden');
        warningsList.innerHTML = b.warnings.map(w => `<li>${w}</li>`).join('');
      } else {
        warningsBox.classList.add('hidden');
      }
    }
  } catch (err) {
    console.error('Failed to load budget data', err);
  }

  // Fetch Savings Goals Summary (Phase 7 Integration)
  const dashTotalSaved = document.getElementById('dash-total-saved');
  const dashSavingsProg = document.getElementById('dash-savings-overall-prog');
  const dashTotalTargets = document.getElementById('dash-total-targets');
  const dashActiveGoals = document.getElementById('dash-active-goals-count');
  const dashCompletedGoals = document.getElementById('dash-completed-goals-count');
  const dashTotalGoals = document.getElementById('dash-total-goals-count');

  try {
    const sRes = await fetch('/api/savings/summary');
    const sData = await sRes.json();
    if (sData.success) {
      const s = sData.data;
      if (dashTotalSaved) dashTotalSaved.textContent = formatMoney(s.totalSaved);
      if (dashSavingsProg) dashSavingsProg.textContent = `Overall: ${s.overallProgressPercent}%`;
      if (dashTotalTargets) dashTotalTargets.textContent = formatMoney(s.totalTarget);
      if (dashActiveGoals) dashActiveGoals.textContent = `${s.activeCount} Active Goals`;
      if (dashCompletedGoals) dashCompletedGoals.textContent = `${s.completedCount}`;
      if (dashTotalGoals) dashTotalGoals.textContent = `${s.goalsCount} Total Goals`;
    }
  } catch (err) {
    console.error('Failed to load savings summary for dashboard', err);
  }

  // Logout handler
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
});

function formatMoney(val) {
  return '₱' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
