let transactions = JSON.parse(localStorage.getItem('fpro_tx')) || [];
let goals = JSON.parse(localStorage.getItem('fpro_goals')) || [];
let initialBalance = parseFloat(localStorage.getItem('fpro_init')) || 0;

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
document.getElementById('transDate').valueAsDate = new Date();

document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        document.getElementById(item.dataset.section).classList.add('active');
        document.getElementById('pageTitle').innerText = item.innerText;
        updateUI();
    };
});

function openModal(id) {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.querySelectorAll('.modal-content').forEach(m => m.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function closeModals() { document.getElementById('modalOverlay').style.display = 'none'; }

document.getElementById('openModal').onclick = () => openModal('modalTrans');
document.getElementById('openGoalModal').onclick = () => openModal('modalGoal');
document.getElementById('btnOpenInitialBalance').onclick = () => openModal('modalInitial');

document.getElementById('transactionForm').onsubmit = (e) => {
    e.preventDefault();
    transactions.push({
        desc: document.getElementById('desc').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        date: document.getElementById('transDate').value,
        id: Date.now()
    });
    localStorage.setItem('fpro_tx', JSON.stringify(transactions));
    updateUI();
    closeModals();
    e.target.reset();
};

document.getElementById('goalForm').onsubmit = (e) => {
    e.preventDefault();
    goals.push({
        name: document.getElementById('goalName').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        id: Date.now()
    });
    localStorage.setItem('fpro_goals', JSON.stringify(goals));
    updateUI();
    closeModals();
    e.target.reset();
};

document.getElementById('initialBalanceForm').onsubmit = (e) => {
    e.preventDefault();
    initialBalance = parseFloat(document.getElementById('initialAmountInput').value) || 0;
    localStorage.setItem('fpro_init', initialBalance);
    updateUI();
    closeModals();
};

function renderTransactions() {
    const term = document.getElementById('inputSearch').value.toLowerCase();
    const filter = document.getElementById('selectFilter').value;
    const list = document.getElementById('transactionListFull');
    list.innerHTML = '';

    const filtered = transactions.filter(t =>
        t.desc.toLowerCase().includes(term) && (filter === 'all' || t.type === filter)
    );

    filtered.reverse().forEach(t => {
        const isInc = t.type === 'income';
        list.innerHTML += `
            <li class="transaction-item">
                <div class="tx-info">
                    <div class="tx-icon ${isInc ? 'icon-income' : 'icon-expense'}">${isInc ? '↑' : '↓'}</div>
                    <span style="font-weight:500">${t.desc}</span>
                </div>
                <div class="text-center hide-mobile" style="color:var(--text-dim); font-size:0.85rem">
                    ${new Date(t.date).toLocaleDateString('pt-BR')}
                </div>
                <div class="${isInc ? 'text-purple' : 'text-red'} text-right" style="font-weight:600">
                    ${isInc ? '+' : '-'} ${fmt.format(t.amount)}
                </div>
            </li>`;
    });
}

function renderGoals(total) {
    const quick = document.getElementById('goalsListQuick');
    const full = document.getElementById('goalsListFull');
    quick.innerHTML = '';
    full.innerHTML = '';

    goals.forEach(g => {
        const pct = Math.min((total / g.target) * 100, 100).toFixed(0);
        const remaining = Math.max(g.target - total, 0);

        const cardHtml = `
            <div class="card goal-card">
                <div class="goal-card-header">
                    <span class="goal-badge">Economia</span>
                    <span style="font-size: 0.8rem; color: var(--text-dim)">${pct}%</span>
                </div>
                <h4 style="margin-bottom: 5px;">${g.name}</h4>
                <div class="goal-value">${fmt.format(g.target)}</div>
                <div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-dim)">
                    <span>Faltam ${fmt.format(remaining)}</span>
                    <button onclick="deleteGoal(${g.id})" style="background:none; border:none; color:#ef4444; cursor:pointer">Remover</button>
                </div>
            </div>`;

        full.innerHTML += cardHtml;
        quick.innerHTML += `
            <div style="margin-bottom:15px">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem"><span>${g.name}</span><span>${pct}%</span></div>
                <div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>`;
    });
}

function deleteGoal(id) {
    goals = goals.filter(g => g.id !== id);
    localStorage.setItem('fpro_goals', JSON.stringify(goals));
    updateUI();
}

let myChart;

function updateChart() {
    const ctx = document.getElementById('financeChart').getContext('2d');
    if (myChart) myChart.destroy();
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let labels = ['Início'];
    let dataPoints = [initialBalance];
    let current = initialBalance;
    sorted.forEach(t => {
        current += (t.type === 'income' ? t.amount : -t.amount);
        labels.push(new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        dataPoints.push(current);
    });
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                borderColor: '#a78bfa',
                backgroundColor: 'rgba(109, 40, 217, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function updateUI() {
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const total = initialBalance + inc - exp;
    document.getElementById('balance').innerText = fmt.format(total);
    document.getElementById('incomes').innerText = fmt.format(inc);
    document.getElementById('expenses').innerText = fmt.format(exp);
    updateChart();
    renderTransactions();
    renderGoals(total);
}

document.getElementById('inputSearch').oninput = renderTransactions;
document.getElementById('selectFilter').onchange = renderTransactions;
updateUI();