// public/js/savings.js
// Handles UI logic, Chart.js visualization, and API integration for the Savings Tracker

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Metrics
  const sumTotalSaved = document.getElementById('sum-total-saved');
  const sumOverallProgress = document.getElementById('sum-overall-progress');
  const sumTotalTarget = document.getElementById('sum-total-target');
  const sumTotalNeeded = document.getElementById('sum-total-needed');
  const sumActiveCount = document.getElementById('sum-active-count');
  const sumPausedCount = document.getElementById('sum-paused-count');
  const sumCompletedCount = document.getElementById('sum-completed-count');
  const sumTotalGoals = document.getElementById('sum-total-goals');
  const overallProgLabel = document.getElementById('overall-prog-label');
  const overallProgFill = document.getElementById('overall-prog-fill');

  // Goals List & Grid
  const goalsGrid = document.getElementById('goals-grid');
  const goalsLoading = document.getElementById('goals-loading');
  const goalsEmpty = document.getElementById('goals-empty');
  const filterStatus = document.getElementById('filter-goal-status');
  const transactionsTbody = document.getElementById('transactions-tbody');

  // Modals & Forms
  const goalModal = document.getElementById('goal-modal');
  const modalTitle = document.getElementById('modal-title');
  const goalForm = document.getElementById('goal-form');
  const goalIdInput = document.getElementById('goal-id');
  const goalSubmitBtn = document.getElementById('goal-submit-btn');
  const openCreateBtn = document.getElementById('open-create-goal-btn');
  const emptyCreateBtn = document.getElementById('empty-create-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const goalCancelBtn = document.getElementById('goal-cancel-btn');

  // Deposit Modal
  const depositModal = document.getElementById('deposit-modal');
  const depositForm = document.getElementById('deposit-form');
  const depositGoalId = document.getElementById('deposit-goal-id');
  const depositGoalName = document.getElementById('deposit-goal-name');
  const depositCurrentInfo = document.getElementById('deposit-current-info');
  const depositAmount = document.getElementById('deposit-amount');
  const depositDesc = document.getElementById('deposit-desc');
  const depositSubmitBtn = document.getElementById('deposit-submit-btn');
  const depositCloseBtn = document.getElementById('deposit-close-btn');
  const depositCancelBtn = document.getElementById('deposit-cancel-btn');

  // Alerts & User
  const errorEl = document.getElementById('savings-error');
  const successEl = document.getElementById('savings-success');
  const userNameEl = document.getElementById('user-name');
  const logoutBtn = document.getElementById('logout-btn');

  let allGoals = [];
  let savingsChartInstance = null;

  // --- 1. Authenticate User ---
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

  // --- 2. Load Initial Data ---
  await refreshSavingsData();

  // --- 3. Filter Change Listener ---
  filterStatus.addEventListener('change', () => {
    renderGoalsGrid();
  });

  // --- 4. Modal Event Listeners ---
  openCreateBtn.addEventListener('click', () => openGoalModal());
  emptyCreateBtn.addEventListener('click', () => openGoalModal());

  modalCloseBtn.addEventListener('click', () => closeGoalModal());
  goalCancelBtn.addEventListener('click', () => closeGoalModal());

  depositCloseBtn.addEventListener('click', () => closeDepositModal());
  depositCancelBtn.addEventListener('click', () => closeDepositModal());

  // Close modals on clicking overlay backdrop
  window.addEventListener('click', (e) => {
    if (e.target === goalModal) closeGoalModal();
    if (e.target === depositModal) closeDepositModal();
  });

  // --- 5. Goal Form Submit (Create / Edit) ---
  goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    goalSubmitBtn.disabled = true;

    const payload = {
      name: document.getElementById('goal-name').value,
      category: document.getElementById('goal-category').value,
      target_date: document.getElementById('goal-target-date').value || undefined,
      target_amount: parseFloat(document.getElementById('goal-target-amount').value),
      current_amount: parseFloat(document.getElementById('goal-current-amount').value) || 0,
      description: document.getElementById('goal-description').value,
      note: document.getElementById('goal-note').value,
    };

    const isEdit = !!goalIdInput.value;
    const url = isEdit ? `/api/savings/${goalIdInput.value}` : '/api/savings';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(data.message || (isEdit ? 'Savings goal updated successfully.' : 'Savings goal created successfully.'));
        closeGoalModal();
        await refreshSavingsData();
      } else {
        showError(data.message || 'Failed to save savings goal');
      }
    } catch {
      showError('Network error while saving goal.');
    }

    goalSubmitBtn.disabled = false;
  });

  // --- 6. Deposit Form Submit ---
  depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    depositSubmitBtn.disabled = true;

    const goalId = depositGoalId.value;
    const amount = parseFloat(depositAmount.value);
    const desc = depositDesc.value;

    try {
      const res = await fetch(`/api/savings/${goalId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: desc }),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(data.message || 'Savings updated successfully.');
        closeDepositModal();
        await refreshSavingsData();
      } else {
        showError(data.message || 'Deposit failed');
      }
    } catch {
      showError('Network error while depositing money.');
    }

    depositSubmitBtn.disabled = false;
  });

  // --- 7. Logout ---
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // ==========================================================
  // DATA FETCHING & RENDERING
  // ==========================================================

  async function refreshSavingsData() {
    goalsLoading.classList.remove('hidden');
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        fetch('/api/savings'),
        fetch('/api/savings/summary'),
      ]);

      const goalsData = await goalsRes.json();
      const summaryData = await summaryRes.json();

      if (goalsData.success) {
        allGoals = goalsData.data;
        renderGoalsGrid();
      }

      if (summaryData.success) {
        renderSummary(summaryData.data);
        renderChart(summaryData.data.goalsComparison);
        renderTransactions(summaryData.data.recentTransactions);
      }
    } catch (err) {
      console.error('Error refreshing savings:', err);
      showError('Unable to load savings data.');
    } finally {
      goalsLoading.classList.add('hidden');
    }
  }

  function renderSummary(s) {
    sumTotalSaved.textContent = formatMoney(s.totalSaved);
    sumOverallProgress.textContent = `Progress: ${s.overallProgressPercent}%`;
    sumTotalTarget.textContent = formatMoney(s.totalTarget);
    sumTotalNeeded.textContent = `Needed: ${formatMoney(Math.max(0, s.totalTarget - s.totalSaved))}`;
    sumActiveCount.textContent = s.activeCount;
    sumPausedCount.textContent = `${s.pausedCount} Paused`;
    sumCompletedCount.textContent = s.completedCount;
    sumTotalGoals.textContent = `${s.goalsCount} Total Goals`;

    // Overall Progress Bar
    overallProgLabel.textContent = `${s.overallProgressPercent}% (${formatMoney(s.totalSaved)} / ${formatMoney(s.totalTarget)})`;
    overallProgFill.style.width = `${Math.min(100, Math.max(0, s.overallProgressPercent))}%`;
  }

  function renderGoalsGrid() {
    const filter = filterStatus.value;
    let filtered = allGoals;
    if (filter !== 'All') {
      filtered = allGoals.filter(g => g.status === filter);
    }

    if (allGoals.length === 0) {
      goalsEmpty.classList.remove('hidden');
      goalsGrid.innerHTML = '';
      return;
    } else {
      goalsEmpty.classList.add('hidden');
    }

    if (filtered.length === 0) {
      goalsGrid.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">No ${filter} goals found.</div>`;
      return;
    }

    goalsGrid.innerHTML = filtered.map(goal => {
      const isCompleted = goal.status === 'Completed';
      const isPaused = goal.status === 'Paused';

      let countdownBadge = '';
      if (goal.target_date) {
        if (goal.is_overdue) {
          countdownBadge = `<span class="goal-pill pill-overdue">⚠️ Overdue (${Math.abs(goal.days_remaining)}d)</span>`;
        } else if (goal.days_remaining !== null) {
          countdownBadge = `<span class="goal-pill pill-days">${goal.days_remaining} days left</span>`;
        }
      }

      return `
        <div class="goal-card ${isCompleted ? 'goal-card-completed' : ''}" data-id="${goal.id}">
          <div class="goal-card-header">
            <div>
              <span class="badge badge-${goal.category.toLowerCase().replace(/\s+/g, '-')}">${goal.category}</span>
              <h3 class="goal-card-title">${escapeHtml(goal.name)}</h3>
            </div>
            <div class="goal-header-badges">
              <span class="goal-status-badge status-badge-${goal.status.toLowerCase()}">${goal.status}</span>
              ${countdownBadge}
            </div>
          </div>

          <div class="goal-amount-block">
            <span class="goal-current">${formatMoney(goal.current_amount)}</span>
            <span class="goal-target">/ ${formatMoney(goal.target_amount)}</span>
          </div>

          <div class="goal-progress-block">
            <div class="progress-info">
              <span>Progress</span>
              <strong>${goal.progress_percent}%</strong>
            </div>
            <div class="progress-track" style="height: 10px; margin-top: 0.3rem;">
              <div class="progress-fill ${isCompleted ? 'progress-fill-green' : 'progress-fill-blue'}" style="width: ${goal.progress_percent}%"></div>
            </div>
          </div>

          <div class="goal-card-details">
            <div class="detail-row">
              <span class="text-muted">Remaining:</span>
              <strong class="${goal.remaining_amount === 0 ? 'text-success' : ''}">${formatMoney(goal.remaining_amount)}</strong>
            </div>
            ${goal.target_date ? `
            <div class="detail-row">
              <span class="text-muted">Target Date:</span>
              <span>${formatDate(goal.target_date)}</span>
            </div>` : ''}
            ${goal.note ? `
            <div class="detail-row note-row">
              <span class="text-muted">Note:</span>
              <span class="goal-note-text">${escapeHtml(goal.note)}</span>
            </div>` : ''}
          </div>

          <div class="goal-card-actions">
            ${!isCompleted ? `
              <button class="btn btn-sm btn-primary btn-add-money" data-id="${goal.id}">+ Add Money</button>
            ` : `
              <button class="btn btn-sm btn-secondary" disabled>🎉 Goal Achieved</button>
            `}
            <button class="btn-icon btn-edit-goal" data-id="${goal.id}" title="Edit Goal">✏️</button>
            <button class="btn-icon btn-toggle-pause" data-id="${goal.id}" data-status="${goal.status}" title="${isPaused ? 'Resume Goal' : 'Pause Goal'}">${isPaused ? '▶️' : '⏸️'}</button>
            <button class="btn-icon btn-delete-goal" data-id="${goal.id}" title="Delete Goal">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Event Listeners to Goal Card buttons
    document.querySelectorAll('.btn-add-money').forEach(btn => {
      btn.addEventListener('click', () => openDepositModal(btn.dataset.id));
    });

    document.querySelectorAll('.btn-edit-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const goal = allGoals.find(g => g.id === btn.dataset.id);
        if (goal) openGoalModal(goal);
      });
    });

    document.querySelectorAll('.btn-toggle-pause').forEach(btn => {
      btn.addEventListener('click', () => handleTogglePause(btn.dataset.id, btn.dataset.status));
    });

    document.querySelectorAll('.btn-delete-goal').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteGoal(btn.dataset.id));
    });
  }

  function renderTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
      transactionsTbody.innerHTML = '<tr><td colspan="4" class="text-secondary" style="text-align: center; padding: 1.5rem;">No recent deposits.</td></tr>';
      return;
    }

    transactionsTbody.innerHTML = transactions.map(t => `
      <tr>
        <td>${t.transaction_date}</td>
        <td><span class="badge badge-savings">${t.transaction_type}</span></td>
        <td class="text-success font-weight-bold">+${formatMoney(t.amount)}</td>
        <td>${escapeHtml(t.description || 'Savings deposit')}</td>
      </tr>
    `).join('');
  }

  function renderChart(comparisons) {
    const ctx = document.getElementById('savingsChart')?.getContext('2d');
    if (!ctx) return;

    if (savingsChartInstance) {
      savingsChartInstance.destroy();
    }

    if (!comparisons || comparisons.length === 0) {
      return;
    }

    const labels = comparisons.map(c => c.name);
    const progressData = comparisons.map(c => c.progress_percent);
    const backgroundColors = comparisons.map(c => c.progress_percent >= 100 ? 'rgba(0, 230, 118, 0.7)' : 'rgba(0, 210, 255, 0.7)');

    savingsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Progress (%)',
          data: progressData,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#9595b5',
              callback: (v) => v + '%'
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: '#9595b5' },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Progress: ${ctx.raw}%`
            }
          }
        }
      }
    });
  }

  // ==========================================================
  // MODAL ACTIONS
  // ==========================================================

  function openGoalModal(goal = null) {
    hideMessages();
    goalForm.reset();

    if (goal) {
      modalTitle.textContent = 'Edit Savings Goal';
      goalSubmitBtn.textContent = 'UPDATE GOAL';
      goalIdInput.value = goal.id;
      document.getElementById('goal-name').value = goal.name;
      document.getElementById('goal-category').value = goal.category || 'Personal';
      document.getElementById('goal-target-amount').value = goal.target_amount;
      document.getElementById('goal-current-amount').value = goal.current_amount;
      document.getElementById('goal-target-date').value = goal.target_date || '';
      document.getElementById('goal-description').value = goal.description || '';
      document.getElementById('goal-note').value = goal.note || '';
    } else {
      modalTitle.textContent = 'Create Savings Goal';
      goalSubmitBtn.textContent = 'CREATE GOAL';
      goalIdInput.value = '';
    }

    goalModal.classList.remove('hidden');
  }

  function closeGoalModal() {
    goalModal.classList.add('hidden');
    goalForm.reset();
  }

  function openDepositModal(goalId) {
    hideMessages();
    depositForm.reset();
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;

    depositGoalId.value = goal.id;
    depositGoalName.textContent = goal.name;
    depositCurrentInfo.textContent = `Current: ${formatMoney(goal.current_amount)} / Target: ${formatMoney(goal.target_amount)} (${goal.progress_percent}%)`;
    depositModal.classList.remove('hidden');
    setTimeout(() => depositAmount.focus(), 100);
  }

  function closeDepositModal() {
    depositModal.classList.add('hidden');
    depositForm.reset();
  }

  async function handleTogglePause(goalId, currentStatus) {
    const newStatus = currentStatus === 'Paused' ? 'Active' : 'Paused';
    try {
      const res = await fetch(`/api/savings/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Goal ${newStatus === 'Paused' ? 'paused' : 'resumed'}.`);
        await refreshSavingsData();
      }
    } catch {
      showError('Failed to update goal status.');
    }
  }

  async function handleDeleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;

    try {
      const res = await fetch(`/api/savings/${goalId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccess('Savings goal deleted successfully.');
        await refreshSavingsData();
      } else {
        showError(data.message || 'Failed to delete goal');
      }
    } catch {
      showError('Network error while deleting goal.');
    }
  }

  // ==========================================================
  // FORMATTING & HELPERS
  // ==========================================================

  function formatMoney(val) {
    return '₱' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dStr) {
    if (!dStr) return '';
    const date = new Date(dStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
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
