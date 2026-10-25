const API_BASE = 'http://84.21.191.8:8080/api';
const getUserId = () => localStorage.getItem('userId');
const getCompanyName = () => localStorage.getItem('companyName') || 'Демо';

function formatMoney(val) {
    if (val === null || val === undefined) return '0';
    return new Intl.NumberFormat('ru-RU').format(Math.round(val));
}

async function apiFetch(endpoint, options = {}) {
    const response = await fetch(API_BASE + endpoint, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Ошибка сервера');
    return data;
}

const pathname = window.location.pathname;
const isDashboard = pathname.includes('index.html') || pathname === '/' || pathname.endsWith('/');
const isForecast  = pathname.includes('forecast.html');
const isHistory   = pathname.includes('history.html');
const isAnalytics = pathname.includes('analytics.html');

/* ---------------- SIDEBAR ---------------- */
function updateSidebar() {
    const authBlock = document.querySelector('aside > div');
    if (!authBlock) return;

    if (getUserId()) {
        authBlock.innerHTML = `
            <a href="index.html" title="На главную" style="display:block;margin-bottom:10px;">${getCompanyName()}</a>
            <a href="#" id="logoutLink" style="color:var(--primary-hover);">Выйти</a>
        `;
        const l = document.getElementById('logoutLink');
        if (l) l.onclick = (e) => { e.preventDefault(); logout(); };
    } else {
        authBlock.innerHTML = `
            <a href="#" id="openLogin">Войти</a>
            <a href="#" id="openRegister">Регистрация</a>
        `;
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

/* ---------------- AUTH MODALS ---------------- */
function initAuthModals() {
    const LoginModal    = document.getElementById('LoginModal');
    const RegisterModal = document.getElementById('RegisterModal');
    const openLogin     = document.getElementById('openLogin');
    const openRegister  = document.getElementById('openRegister');

    if (!LoginModal || !openLogin) return;

    openLogin.onclick = (e) => { e.preventDefault(); LoginModal.showModal(); };
    const closeLogin = document.getElementById('closeLogin');
    if (closeLogin) closeLogin.onclick = () => LoginModal.close();

    if (RegisterModal && openRegister) {
        openRegister.onclick = (e) => { e.preventDefault(); RegisterModal.showModal(); };
        const closeRegister = document.getElementById('closeRegister');
        if (closeRegister) closeRegister.onclick = () => RegisterModal.close();
    }

    const toRegister = document.getElementById('toRegister');
    const toLogin    = document.getElementById('toLogin');
    if (toRegister && RegisterModal) {
        toRegister.onclick = (e) => { e.preventDefault(); LoginModal.close(); RegisterModal.showModal(); };
    }
    if (toLogin && RegisterModal) {
        toLogin.onclick = (e) => { e.preventDefault(); RegisterModal.close(); LoginModal.showModal(); };
    }

    if (typeof closeOnBackdrop === 'function') {
        closeOnBackdrop(LoginModal);
        if (RegisterModal) closeOnBackdrop(RegisterModal);
    }

    // ==== ЛОГИН ====
    const LoginBtn = document.getElementById('LoginBtn');
    if (LoginBtn) {
        LoginBtn.onclick = async () => {
            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!email || !password) return alert('Введите email и пароль');
            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                localStorage.setItem('userId', data.id);
                localStorage.setItem('companyName', data.companyName || '');
                location.reload();
            } catch (e) { alert('Ошибка входа: ' + e.message); }
        };
    }

    // ==== РЕГИСТРАЦИЯ ====
    const RegisterBtn = document.getElementById('RegisterBtn');
    if (RegisterBtn) {
        RegisterBtn.onclick = async () => {
            const email    = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const repeat   = document.getElementById('registerPasswordRepeat').value;
            const inn      = document.getElementById('registerINN')?.value.trim();

            if (!email || !password) return alert('Заполните email и пароль');
            if (password !== repeat)  return alert('Пароли не совпадают');

            try {
                const data = await apiFetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, password,
                        companyName: inn ? 'ИНН ' + inn : 'Моя компания'
                    })
                });
                localStorage.setItem('userId', data.id);
                localStorage.setItem('companyName', data.companyName || '');
                location.reload();
            } catch (e) { alert('Ошибка регистрации: ' + e.message); }
        };
    }
}

/* ---------------- DASHBOARD (index.html) ---------------- */
async function loadDashboard() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const data = await apiFetch(`/forecast?userId=${userId}`);

        // Карточки: 1) остаток, 2) прогноз/минимум, 3) риски
        const cards = document.querySelectorAll('.article-card-item p');
        if (cards.length >= 3) {
            cards[0].innerText = formatMoney(data.currentBalance) + ' ₽';

            const balances  = (data.forecast || []).map(f => f.balance);
            const minBalance = balances.length ? Math.min(...balances) : 0;
            const minDate    = (data.forecast || []).find(f => f.balance === minBalance)?.date || '';
            cards[1].innerText = `Мин: ${formatMoney(minBalance)} ₽${minDate ? ' (' + minDate + ')' : ''}`;

            if (data.warnings && data.warnings.length > 0) {
                cards[2].innerText = `Внимание! ${data.warnings.length} риск(ов)`;
                cards[2].parentElement.style.borderColor = 'var(--red)';
            } else {
                cards[2].innerText = 'Рисков нет';
                cards[2].parentElement.style.borderColor = 'var(--primary-color)';
            }
        }

        // График
        const canvas = document.getElementById('dataChart');
        if (canvas) {
            if (window.myChart) window.myChart.destroy();
            window.myChart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: (data.forecast || []).map(f => f.date),
                    datasets: [{
                        label: 'Прогноз остатка',
                        data: (data.forecast || []).map(f => f.balance),
                        borderColor: 'rgb(196, 137, 255)',
                        backgroundColor: 'rgba(196, 137, 255, 0.1)',
                        fill: true,
                        tension: 0.1,
                        pointBackgroundColor: (data.forecast || []).map(f =>
                            f.isGap ? 'rgb(196, 60, 64)' : 'rgb(137, 255, 143)'),
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { font: { size: 14, family: 'Overpass' } } } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Панель уведомлений
        const notifContainer = document.querySelector('.article-notif');
        if (notifContainer) {
            notifContainer.innerHTML = '';
            if (!data.warnings || data.warnings.length === 0) {
                notifContainer.innerHTML = '<p style="color: var(--primary-color); font-size: 18px;">Кассовых разрывов не прогнозируется</p>';
            } else {
                notifContainer.innerHTML = data.warnings.slice(0, 5).map(w => `
                    <div class="article-notif-item">
                        <h3>Риск разрыва!</h3>
                        <div class="article-notif-item-list">
                            <p style="font-size: 16px;">${w.date}</p>
                            <p>Дефицит: ${formatMoney(w.shortage)} ₽</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('loadDashboard error:', e);
    }
}

/* ---------------- FORECAST (forecast.html) ---------------- */
async function loadForecastPage() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const data = await apiFetch(`/forecast?userId=${userId}`);

        const blocks = document.querySelectorAll('.article-forecast');
        if (blocks.length >= 2) {
            blocks[0].querySelector('.article-forecast-item p').innerText = formatMoney(data.currentBalance) + ' ₽';
            const minB = Math.min(...(data.forecast || []).map(f => f.balance));
            blocks[1].querySelector('.article-forecast-item p').innerText = `Минимум: ${formatMoney(minB)} ₽`;
        }

        const riskBlock = document.querySelectorAll('.article-forecast')[2];
        if (riskBlock) {
            const list = riskBlock.querySelector('.article-line-item')?.parentElement;
            if (list) {
                list.innerHTML = (data.warnings || []).map(w => `
                    <div class="article-line-item">
                        <h3>Предупреждение о финансовом разрыве!</h3>
                        <div class="article-line-item-list">
                            <p style="flex: 1;">${w.date}</p>
                            <p style="flex: 2;">Дефицит • ${formatMoney(w.shortage)}₽</p>
                            <p style="flex: 3;">${w.reason}</p>
                        </div>
                    </div>
                `).join('') || '<p style="color: var(--primary-color);">Разрывов нет</p>';
            }
        }

        const events = await apiFetch(`/events?userId=${userId}`);
        const tables = document.querySelectorAll('.article-regular tbody');
        if (tables.length >= 2) {
            tables[0].innerHTML = events.filter(e => e.type === 'EXPENSE').map(e => `
                <tr>
                    <td>${e.eventDate}</td>
                    <td>${e.name}</td>
                    <td>${formatMoney(e.amount)} ₽</td>
                    <td>${e.period === 'MONTHLY' ? 'Ежемесячно' : 'Разово'}</td>
                    <td>${e.isPaid ? '✅' : `<button onclick="payEvent(${e.id})" style="cursor:pointer;background:var(--primary-color);border:0;padding:5px 10px;border-radius:5px;color:var(--white);">Оплатить</button>`}</td>
                </tr>
            `).join('') || '<tr><td>Нет расходов</td></tr>';

            tables[1].innerHTML = events.filter(e => e.type === 'INCOME').map(e => `
                <tr>
                    <td>${e.eventDate}</td>
                    <td>${e.name}</td>
                    <td>${formatMoney(e.amount)} ₽</td>
                    <td>${e.period === 'MONTHLY' ? 'Ежемесячно' : 'Разово'}</td>
                    <td></td>
                </tr>
            `).join('') || '<tr><td>Нет поступлений</td></tr>';
        }
    } catch (e) { console.error('loadForecastPage error:', e); }
}

/* ---------------- HISTORY (history.html) ---------------- */
let historyState = {
    all: [], filtered: [], page: 0, pageSize: 50,
    sortKey: 'operationDate', sortDir: 'desc',
    search: '', categoryId: null, direction: null,
    dateFrom: null, dateTo: null,
};

async function loadHistory() {
    const userId = getUserId();
    if (!userId) return;
    try {
        const data = await apiFetch(`/transactions?userId=${userId}&size=5000`);
        historyState.all = data.content || [];
        applyHistoryFilters();
    } catch (e) { console.error(e); }
}

function applyHistoryFilters() {
    const s = historyState;
    let arr = [...s.all];

    if (s.search) {
        const q = s.search.toLowerCase();
        arr = arr.filter(t =>
            (t.counterpartyName && t.counterpartyName.toLowerCase().includes(q)) ||
            (t.paymentPurpose   && t.paymentPurpose.toLowerCase().includes(q))   ||
            (t.counterpartyInn  && t.counterpartyInn.includes(q))                ||
            (t.categoryName     && t.categoryName.toLowerCase().includes(q))
        );
    }
    if (s.categoryId) arr = arr.filter(t => Number(t.categoryId) === Number(s.categoryId));
    if (s.direction)  arr = arr.filter(t => t.direction === s.direction);
    if (s.dateFrom)   arr = arr.filter(t => t.operationDate >= s.dateFrom);
    if (s.dateTo)     arr = arr.filter(t => t.operationDate <= s.dateTo);

    arr.sort((a, b) => {
        let va = a[s.sortKey], vb = b[s.sortKey];
        if (va === null || va === undefined) va = '';
        if (vb === null || vb === undefined) vb = '';
        if (s.sortKey === 'amount' || s.sortKey === 'balanceEod') {
            va = Number(va); vb = Number(vb);
        } else {
            va = String(va); vb = String(vb);
        }
        if (va < vb) return s.sortDir === 'asc' ? -1 : 1;
        if (va > vb) return s.sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    s.filtered = arr;
    s.page = 0;
    renderHistoryTable();
}

function renderHistoryTable() {
    const s = historyState;
    const tbody = document.querySelector('.article-history tbody');
    if (!tbody) return;

    const start = s.page * s.pageSize;
    const end = start + s.pageSize;
    const pageItems = s.filtered.slice(start, end);

    tbody.innerHTML = pageItems.map(t => `
        <tr data-id="${t.id}">
            <td>${t.operationDate || ''}</td>
            <td>${formatMoney(t.amount)} ₽</td>
            <td>${t.direction === 'INCOME' ? 'Приход' : 'Расход'}</td>
            <td>${t.counterpartyName || '-'}</td>
            <td>${t.counterpartyInn || '-'}</td>
            <td>${t.paymentPurpose || '-'}</td>
            <td>${formatMoney(t.balanceEod)} ₽</td>
            <td>${t.categoryName || 'Без категории'}</td>
            <td><button class="row-delete" title="Удалить запись">×</button></td>
        </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;">Ничего не найдено</td></tr>';

    tbody.querySelectorAll('.row-delete').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Удалить эту запись из истории?')) return;
            const row = btn.closest('tr');
            const id = row.dataset.id;
            try {
                const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Ошибка удаления');
                row.remove();
                historyState.all = historyState.all.filter(t => String(t.id) !== String(id));
                applyHistoryFilters();
            } catch (e) { alert('Ошибка: ' + e.message); }
        };
    });

    let pager = document.getElementById('historyPager');
    if (!pager) {
        pager = document.createElement('div');
        pager.id = 'historyPager';
        pager.style.cssText = 'margin-top: 15px; display: flex; gap: 10px; align-items: center;';
        tbody.closest('.article').appendChild(pager);
    }
    const totalPages = Math.max(1, Math.ceil(s.filtered.length / s.pageSize));
    pager.innerHTML = `
        <button class="filter-button" id="pagePrev" ${s.page === 0 ? 'disabled' : ''}>← Назад</button>
        <span>Страница ${s.page + 1} из ${totalPages} (всего ${s.filtered.length})</span>
        <button class="filter-button" id="pageNext" ${s.page >= totalPages - 1 ? 'disabled' : ''}>Вперёд →</button>
    `;
    const prev = document.getElementById('pagePrev');
    const next = document.getElementById('pageNext');
    if (prev) prev.onclick = () => { s.page--; renderHistoryTable(); };
    if (next) next.onclick = () => { s.page++; renderHistoryTable(); };

    updateSortArrows();
}

function updateSortArrows() {
    const s = historyState;
    const headers = document.querySelectorAll('.article-history thead th');
    const keys = ['operationDate', 'amount', 'direction', 'counterpartyName', 'counterpartyInn', 'paymentPurpose', 'balanceEod', 'categoryName', null];
    headers.forEach((th, i) => {
        const key = keys[i];
        if (!key) return;
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        const baseText = th.dataset.base || th.textContent.replace(/ [↑↓]$/, '').trim();
        th.dataset.base = baseText;
        let arrow = '';
        if (s.sortKey === key) arrow = s.sortDir === 'asc' ? ' ↑' : ' ↓';
        th.textContent = baseText + arrow;
    });
}

function initHistorySort() {
    const headers = document.querySelectorAll('.article-history thead th');
    const keys = ['operationDate', 'amount', 'direction', 'counterpartyName', 'counterpartyInn', 'paymentPurpose', 'balanceEod', 'categoryName', null];
    headers.forEach((th, i) => {
        const key = keys[i];
        if (!key) return;
        th.addEventListener('click', () => {
            const s = historyState;
            if (s.sortKey === key) s.sortDir = s.sortDir === 'asc' ? 'desc' : 'asc';
            else { s.sortKey = key; s.sortDir = 'asc'; }
            applyHistoryFilters();
        });
    });
}

function initHistorySearch() {
    const input = document.querySelector('.article-search');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            historyState.search = input.value.trim();
            applyHistoryFilters();
        }, 250);
    });
}

function initHistoryFilterModal() {
    const FilterTab = document.getElementById('FilterTab');
    const openFilterTab = document.getElementById('openFilterTab');
    if (!FilterTab || !openFilterTab) return;

    FilterTab.innerHTML = `
        <h3>Фильтр</h3>
        <div class="dialog-form">
            <div class="dialog-form-field">
                <p>Категория</p>
                <select id="filterCategory" class="dialog-input-text">
                    <option value="">Все категории</option>
                </select>
            </div>
            <div class="dialog-form-field">
                <p>Направление</p>
                <div class="dialog-list">
                    <label class="dialog-radio"><input type="radio" name="filterDir" value="" checked><span>Все</span></label>
                    <label class="dialog-radio"><input type="radio" name="filterDir" value="INCOME"><span>Приход</span></label>
                    <label class="dialog-radio"><input type="radio" name="filterDir" value="EXPENSE"><span>Расход</span></label>
                </div>
            </div>
            <div class="dialog-form-field"><p>Дата от</p><input type="date" id="filterDateFrom" class="dialog-input-text"></div>
            <div class="dialog-form-field"><p>Дата до</p><input type="date" id="filterDateTo" class="dialog-input-text"></div>
        </div>
        <button class="dialog-button" id="addFilter">Применить</button>
        <button class="dialog-button" id="resetFilter" style="background: var(--gray); margin-top: 10px;">Сбросить</button>
    `;

    apiFetch('/categories').then(cats => {
        const sel = document.getElementById('filterCategory');
        if (sel) cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            sel.appendChild(opt);
        });
    }).catch(console.error);

    openFilterTab.onclick = () => FilterTab.showModal();

    document.getElementById('addFilter').onclick = () => {
        const cat  = document.getElementById('filterCategory').value;
        const dir  = document.querySelector('input[name="filterDir"]:checked').value;
        const from = document.getElementById('filterDateFrom').value;
        const to   = document.getElementById('filterDateTo').value;
        historyState.categoryId = cat ? Number(cat) : null;
        historyState.direction  = dir || null;
        historyState.dateFrom   = from || null;
        historyState.dateTo     = to || null;
        applyHistoryFilters();
        FilterTab.close();
    };

    document.getElementById('resetFilter').onclick = () => {
        historyState.categoryId = null;
        historyState.direction  = null;
        historyState.dateFrom   = null;
        historyState.dateTo     = null;
        applyHistoryFilters();
        FilterTab.close();
    };
}

/* ---------------- ANALYTICS (analytics.html) ---------------- */
async function loadAnalytics() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const data = await apiFetch(`/transactions?userId=${userId}&size=5000`);
        const transactions = data.content || [];

        const expensesByCategory = {};
        transactions.filter(t => t.direction === 'EXPENSE').forEach(t => {
            const cat = t.categoryName || 'Без категории';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(t.amount || 0);
        });
        const sortedCats = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);

        const pieCanvas = document.getElementById('pieChart');
        if (pieCanvas) {
            if (window.pieChartInstance) window.pieChartInstance.destroy();
            const palette = [
                'rgb(85, 45, 135)', 'rgb(108, 68, 158)', 'rgb(128, 88, 175)',
                'rgb(148, 100, 185)', 'rgb(154, 103, 187)', 'rgb(173, 134, 198)',
                'rgb(185, 135, 227)', 'rgb(196, 137, 255)'
            ];
            window.pieChartInstance = new Chart(pieCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: sortedCats.map(c => c[0]),
                    datasets: [{
                        data: sortedCats.map(c => c[1]),
                        backgroundColor: sortedCats.map((_, i) => palette[i % palette.length]),
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: '50%',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { font: { size: 14, family: 'Overpass' } } } }
                }
            });
        }

        const table = document.querySelector('.chart-table tbody');
        if (table) {
            table.innerHTML = sortedCats.map(([name, sum]) =>
                `<tr><td>${name}</td><td>${formatMoney(sum)} ₽</td></tr>`
            ).join('') || '<tr><td colspan="2">Нет расходов</td></tr>';
        }

        const monthly = {};
        transactions.forEach(t => {
            if (!t.operationDate) return;
            const month = t.operationDate.substring(0, 7);
            if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
            if (t.direction === 'INCOME') monthly[month].income  += Math.abs(t.amount || 0);
            else                          monthly[month].expense += Math.abs(t.amount || 0);
        });
        const months = Object.keys(monthly).sort();

        const barCanvas = document.getElementById('barChart');
        if (barCanvas) {
            if (window.barChartInstance) window.barChartInstance.destroy();
            window.barChartInstance = new Chart(barCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        { label: 'Доходы',  data: months.map(m => monthly[m].income),  backgroundColor: 'rgb(137, 255, 143)' },
                        { label: 'Расходы', data: months.map(m => monthly[m].expense), backgroundColor: 'rgb(187, 103, 103)' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { labels: { font: { size: 14, family: 'Overpass' } } } }
                }
            });
        }
    } catch (e) { console.error('loadAnalytics error:', e); }
}

/* ---------------- EVENTS / CSV ---------------- */
async function addEvent(e) {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) return alert('Залогинься!');

    const name      = document.getElementById('name').value.trim();
    const amount    = parseFloat(document.getElementById('amount').value);
    const eventDate = document.getElementById('eventDate').value;
    const type      = document.getElementById('type-down').checked ? 'EXPENSE' : 'INCOME';
    const period    = document.getElementById('period-one').checked ? 'ONCE' : 'MONTHLY';

    if (!name || !amount || !eventDate) return alert('Заполни все поля');

    try {
        await apiFetch('/events', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: Number(userId), name, type, amount, eventDate, period })
        });
        document.getElementById('AddEvent').close();
        location.reload();
    } catch (err) { alert('Ошибка: ' + err.message); }
}

async function uploadCsv(file) {
    const userId = getUserId();
    if (!userId) return alert('Залогинься!');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_BASE}/transactions/upload?userId=${userId}`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка загрузки');
        alert(`✅ Загружено ${data.importedCount} операций за ${data.elapsedMs} мс`);
        location.reload();
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

window.payEvent = async function(id) {
    try {
        await apiFetch(`/events/${id}/pay`, { method: 'PATCH' });
        location.reload();
    } catch (e) { alert('Ошибка: ' + e.message); }
};
window.logout = logout;

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

    safe(updateSidebar);
    safe(initAuthModals);

    if (!getUserId() && (isDashboard || isForecast || isHistory || isAnalytics)) {
        setTimeout(() => {
            const lm = document.getElementById('LoginModal');
            if (lm) lm.showModal();
        }, 300);
    }

    if (isDashboard) safe(loadDashboard);
    if (isForecast)  safe(loadForecastPage);
    if (isAnalytics) safe(loadAnalytics);

    if (isHistory) {
        safe(initHistorySort);
        safe(initHistorySearch);
        safe(initHistoryFilterModal);
        safe(loadHistory);

        const btn = document.getElementById('AddEventBtn');
        if (btn) btn.addEventListener('click', addEvent);

        const uploadBtn = document.getElementById('uploadCsvBtn');
        const fileInput = document.getElementById('csvFile');
        if (uploadBtn && fileInput) {
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                if (e.target.files[0]) uploadCsv(e.target.files[0]);
            };
        }
    }
});