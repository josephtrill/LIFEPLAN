// public/js/expenses.js
// Handles all UI logic for the Expense Management page

document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM References ---
  const addBtn = document.getElementById('add-expense-btn');
  const formSection = document.getElementById('expense-form-section');
  const formTitle = document.getElementById('form-title');
  const expenseForm = document.getElementById('expense-form');
  const expenseIdInput = document.getElementById('expense-id');
  const cancelBtn = document.getElementById('form-cancel-btn');
  const submitBtn = document.getElementById('form-submit-btn');
  const tbody = document.getElementById('expense-tbody');

  const sumToday = document.getElementById('sum-today');
  const sumWeekly = document.getElementById('sum-weekly');
  const sumMonthly = document.getElementById('sum-monthly');

  const filterSearch = document.getElementById('filter-search');
  const filterCategory = document.getElementById('filter-category');
  const filterStart = document.getElementById('filter-start');
  const filterEnd = document.getElementById('filter-end');

  const errorEl = document.getElementById('expense-error');
  const successEl = document.getElementById('expense-success');
  const userNameEl = document.getElementById('user-name');
  const logoutBtn = document.getElementById('logout-btn');

  // Set default date to today
  document.getElementById('expense-date').valueAsDate = new Date();

  // --- Auth Check ---
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

  // --- Load Data ---
  await loadExpenses();
  await loadSummary();

  // --- Show / Hide Form ---
  addBtn.addEventListener('click', () => {
    formSection.classList.remove('hidden');
    formTitle.textContent = 'Add New Expense';
    submitBtn.textContent = 'Add Expense';
    expenseForm.reset();
    expenseIdInput.value = '';
    document.getElementById('expense-date').valueAsDate = new Date();
  });

  cancelBtn.addEventListener('click', () => {
    formSection.classList.add('hidden');
    expenseForm.reset();
  });

  // --- Submit Form (Add or Edit) ---
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    submitBtn.disabled = true;

    const expenseData = {
      description: document.getElementById('expense-description').value,
      amount: document.getElementById('expense-amount').value,
      category: document.getElementById('expense-category').value,
      expense_date: document.getElementById('expense-date').value,
      payment_method: document.getElementById('expense-payment').value,
      note: document.getElementById('expense-note').value,
    };

    const editId = expenseIdInput.value;
    const isEdit = !!editId;
    const url = isEdit ? `/api/expenses/${editId}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(isEdit ? 'Expense updated!' : 'Expense added!');
        formSection.classList.add('hidden');
        expenseForm.reset();
        await loadExpenses();
        await loadSummary();
      } else {
        showError(data.message);
      }
    } catch (err) {
      showError('Failed to save expense.');
    }

    submitBtn.disabled = false;
  });

  // --- Filter listeners ---
  filterSearch.addEventListener('input', () => loadExpenses());
  filterCategory.addEventListener('change', () => loadExpenses());
  filterStart.addEventListener('change', () => loadExpenses());
  filterEnd.addEventListener('change', () => loadExpenses());

  // --- Logout ---
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // ==========================================================
  // FUNCTIONS
  // ==========================================================

  async function loadExpenses() {
    const params = new URLSearchParams();
    if (filterSearch.value) params.set('search', filterSearch.value);
    if (filterCategory.value && filterCategory.value !== 'All') params.set('category', filterCategory.value);
    if (filterStart.value) params.set('startDate', filterStart.value);
    if (filterEnd.value) params.set('endDate', filterEnd.value);

    try {
      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        tbody.innerHTML = data.data.map(exp => `
          <tr>
            <td>${exp.expense_date}</td>
            <td>${escapeHtml(exp.description)}</td>
            <td><span class="badge badge-${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td class="amount-cell">${formatMoney(exp.amount)}</td>
            <td>${exp.payment_method || 'Cash'}</td>
            <td class="action-cell">
              <button class="btn-icon btn-edit" data-id="${exp.id}" title="Edit">✏️</button>
              <button class="btn-icon btn-delete" data-id="${exp.id}" title="Delete">🗑️</button>
            </td>
          </tr>
        `).join('');

        // Attach edit/delete handlers
        document.querySelectorAll('.btn-edit').forEach(btn => {
          btn.addEventListener('click', () => handleEdit(btn.dataset.id, data.data));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', () => handleDelete(btn.dataset.id));
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-secondary" style="text-align:center; padding:2rem;">No expenses found.</td></tr>';
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
    }
  }

  async function loadSummary() {
    try {
      const res = await fetch('/api/expenses/summary');
      const data = await res.json();
      if (data.success) {
        sumToday.textContent = formatMoney(data.data.today);
        sumWeekly.textContent = formatMoney(data.data.weekly);
        sumMonthly.textContent = formatMoney(data.data.monthly);
      }
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  }

  function handleEdit(id, expenses) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    formSection.classList.remove('hidden');
    formTitle.textContent = 'Edit Expense';
    submitBtn.textContent = 'Update Expense';
    expenseIdInput.value = exp.id;
    document.getElementById('expense-description').value = exp.description;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-category').value = exp.category;
    document.getElementById('expense-date').value = exp.expense_date;
    document.getElementById('expense-payment').value = exp.payment_method || 'Cash';
    document.getElementById('expense-note').value = exp.note || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccess('Expense deleted!');
        await loadExpenses();
        await loadSummary();
      } else {
        showError(data.message);
      }
    } catch {
      showError('Failed to delete expense.');
    }
  }

  function formatMoney(val) {
    return '₱' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
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
