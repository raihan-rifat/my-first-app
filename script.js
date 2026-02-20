const state = {
  income: Number(localStorage.getItem('income')) || 0,
  expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
};

const refs = {
  income: document.getElementById('income'),
  saveIncome: document.getElementById('saveIncome'),
  incomeStatus: document.getElementById('incomeStatus'),
  expenseForm: document.getElementById('expenseForm'),
  expenseDate: document.getElementById('expenseDate'),
  expenseName: document.getElementById('expenseName'),
  expenseCategory: document.getElementById('expenseCategory'),
  expenseAmount: document.getElementById('expenseAmount'),
  avoidable: document.getElementById('avoidable'),
  totalExpenses: document.getElementById('totalExpenses'),
  balanceLeft: document.getElementById('balanceLeft'),
  overBudget: document.getElementById('overBudget'),
  prediction: document.getElementById('prediction'),
  avoidableSuggestions: document.getElementById('avoidableSuggestions'),
  categorySummary: document.getElementById('categorySummary'),
  expenseTableBody: document.getElementById('expenseTableBody'),
};

function currency(value) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);
}

function iconForExpense(name) {
  const text = name.toLowerCase();
  if (/(fuel|petrol|gas|diesel)/.test(text)) return '⛽';
  if (/(coffee|cappuccino|latte|espresso|tea)/.test(text)) return '☕';
  if (/(uber|taxi|bus|train|metro|transport)/.test(text)) return '🚌';
  if (/(grocer|food|restaurant|snack)/.test(text)) return '🛒';
  if (/(rent|bill|internet|electric|water)/.test(text)) return '🏠';
  return '💸';
}

function guessCategory(name) {
  const text = name.toLowerCase();
  if (/(coffee|restaurant|food|grocer|snack)/.test(text)) return 'Food';
  if (/(uber|taxi|fuel|bus|train|transport)/.test(text)) return 'Transport';
  if (/(netflix|movie|game|party|shopping)/.test(text)) return 'Entertainment';
  if (/(rent|electric|water|internet|bill)/.test(text)) return 'Bills';
  return 'Other';
}

function getPrediction(total) {
  const now = new Date();
  const day = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (day === 0) return total;
  return (total / day) * totalDays;
}

function saveState() {
  localStorage.setItem('income', String(state.income));
  localStorage.setItem('expenses', JSON.stringify(state.expenses));
}

function render() {
  const total = state.expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = state.income - total;
  const over = Math.max(0, total - state.income);
  const predicted = getPrediction(total);

  refs.totalExpenses.textContent = currency(total);
  refs.balanceLeft.textContent = currency(Math.max(0, balance));
  refs.overBudget.textContent = currency(over);
  refs.overBudget.classList.toggle('over', over > 0);
  refs.prediction.textContent = currency(predicted);

  const byCategory = state.expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  refs.categorySummary.innerHTML = '';
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (categories.length === 0) {
    refs.categorySummary.innerHTML = '<li>No expenses yet.</li>';
  } else {
    categories.forEach(([name, amount]) => {
      const li = document.createElement('li');
      li.textContent = `${name}: ${currency(amount)}`;
      refs.categorySummary.appendChild(li);
    });
  }

  refs.expenseTableBody.innerHTML = '';
  state.expenses
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((item) => {
      const row = document.createElement('tr');
      const icon = iconForExpense(item.name);
      row.innerHTML = `
        <td>${item.date}</td>
        <td><span class="expense-icon" aria-hidden="true">${icon}</span> ${item.name}</td>
        <td>${item.category}</td>
        <td>${currency(item.amount)}</td>
        <td>${item.avoidable ? 'Yes' : 'No'}</td>
      `;
      refs.expenseTableBody.appendChild(row);
    });

  const avoidable = state.expenses.filter((item) => item.avoidable).sort((a, b) => b.amount - a.amount);
  refs.avoidableSuggestions.innerHTML = '';
  if (avoidable.length === 0) {
    refs.avoidableSuggestions.innerHTML = '<li>No avoidable costs flagged yet.</li>';
  } else {
    avoidable.slice(0, 5).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `Consider reducing ${item.name} (${currency(item.amount)}) in ${item.category}.`;
      refs.avoidableSuggestions.appendChild(li);
    });
  }
}

refs.saveIncome.addEventListener('click', () => {
  const value = Number(refs.income.value);
  if (!Number.isFinite(value) || value < 0) {
    refs.incomeStatus.textContent = 'Please enter a valid income amount.';
    return;
  }
  state.income = value;
  saveState();
  render();
  refs.incomeStatus.textContent = 'Income saved successfully.';
});

refs.expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = Number(refs.expenseAmount.value);
  const name = refs.expenseName.value.trim();
  const date = refs.expenseDate.value;

  if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const categoryInput = refs.expenseCategory.value.trim();

  state.expenses.push({
    date,
    name,
    amount,
    category: categoryInput || guessCategory(name),
    avoidable: refs.avoidable.checked,
  });

  saveState();
  render();
  refs.expenseForm.reset();
  refs.expenseDate.valueAsDate = new Date();
});

function initialize() {
  refs.income.value = state.income || '';
  refs.expenseDate.valueAsDate = new Date();
  render();
}

initialize();
