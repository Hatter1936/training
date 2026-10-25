const API_BASE = 'http://localhost:8080/api';
const getUserId = () => localStorage.getItem('userId');
const getCompanyName = () => localStorage.getItem('companyName') || 'Демо';

function formatMoney(val) {
    if (val === null || val === undefined) return '0';
    return new Intl.NumberFormat('ru-RU').format(Math.round(val));
}

async function apiFetch(endpoint, options = {}) {
    const response = await fetch(API_BASE + endpoint, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка сервера');
    return data;
}

const pathname = window.location.pathname;
const isDashboard = pathname.includes('index.html') || pathname === '/' || pathname.endsWith('/');
const isForecast = pathname.includes('forecast.html');
const isHistory = pathname.includes('history.html');
const isAnalytics = pathname.includes('analytics.html');

function updateSidebar() {
    document.querySelectorAll('aside a').forEach(a => {
        const t = a.textContent.trim();
        if (t === 'Имя ИНН' || t === 'Войти' || t === 'Демо') {
            if (getUserId()) {
                a.textContent = getCompanyName();
                a.href = '#';
                a.onclick = (e) => { e.preventDefault(); logout(); };
                a.title = 'Нажмите чтобы выйти';
            }
        }
    });
}

function logout() {
    localStorage.clear();
    location.reload();
}

function initAuthModals() {
    const LoginModal = document.getElementById('LoginModal');
    const RegisterModal = document.getElementById('RegisterModal');
    const openLogin = document.getElementById('openLogin');
    const openRegister = document.getElementById('openRegister');
    const closeLogin = document.getElementById('closeLogin');
    const closeRegister = document.getElementById('closeRegister');
    const LoginBtn = document.getElementById('LoginBtn');
    const RegisterBtn = document.getElementById('RegisterBtn');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');

    if (!LoginModal || !openLogin) return;

    openLogin.onclick = (e) => { e.preventDefault(); LoginModal.showModal(); };
    if (closeLogin) closeLogin.onclick = () => LoginModal.close();

    if (RegisterModal && openRegister) {
        openRegister.onclick = (e) => { e.preventDefault(); RegisterModal.showModal(); };
        if (closeRegister) closeRegister.onclick = () => RegisterModal.close();
    }

    if (toRegister && RegisterModal) {
        toRegister.onclick = (e) => { e.preventDefault(); LoginModal.close(); RegisterModal.showModal(); };
    }
    if (toLogin && RegisterModal) {
        toLogin.onclick = (e) => { e.preventDefault(); RegisterModal.close(); LoginModal.showModal(); };
    }

    if (LoginBtn) {
        LoginBtn.onclick = async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });
                localStorage.setItem('userId', data.id);
                localStorage.setItem('companyName', data.companyName || '');
                location.reload();
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        };
    }

    if (RegisterBtn) {
        RegisterBtn.onclick = async () => {
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordRepeat = document.getElementById('registerPasswordRepeat').value;
            const inn = document.getElementById('registerINN').value;

            if (password !== passwordRepeat) return alert('Пароли не совпадают');

            try {
                const data = await apiFetch('/auth/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password, companyName: inn ? 'ИНН ' + inn : 'Моя компания' })
                });
                localStorage.setItem('userId', data.id);
                localStorage.setItem('companyName', data.companyName || '');
                location.reload();
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        };
    }
}

async function loadDashboard() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const data = await apiFetch(`/forecast?userId=${userId}`);

        const cards = document.querySelectorAll('.article-card-item p');
        if (cards.length >= 3) {
            cards[0].innerText = formatMoney(data.currentBalance) + ' ₽';
            const balances = data.forecast.map(f => f.balance);
            const minBalance = Math.min(...balances);
            const minDate = data.forecast.find(f => f.balance === minBalance)?.date;
            cards[1].innerText = `Мин: ${formatMoney(minBalance)} ₽ (${minDate})`;

            if (data.warnings.length > 0) {
                cards[2].innerText = `Внимание! ${data.warnings.length} риск(ов)`;
                cards[2].parentElement.style.borderColor = 'var(--red)';
            } else {
                cards[2].innerText = 'Рисков нет';
                cards[2].parentElement.style.borderColor = 'var(--primary-color)';
            }
        }

        const canvas = document.getElementById('dataChart');
        if (canvas) {
            if (window.myChart) window.myChart.destroy();
            window.myChart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: data.forecast.map(f => f.date),
                    datasets: [{
                        label: 'Прогноз остатка',
                        data: data.forecast.map(f => f.balance),
                        borderColor: 'rgb(196, 137, 255)',
                        backgroundColor: 'rgba(196, 137, 255, 0.1)',
                        fill: true,
                        tension: 0.1,
                        pointBackgroundColor: data.forecast.map(f => f.isGap ? 'rgb(196, 60, 64)' : 'rgb(137, 255, 143)'),
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

        const notifContainer = document.querySelector('.article-notif');
        if (notifContainer) {
            notifContainer.innerHTML = '';
            if (data.warnings.length === 0) {
                notifContainer.innerHTML = '<p style="color: var(--primary-color); font-size: 18px;">Кассовых разрывов не прогнозируется</p>';
            } else {
                data.warnings.slice(0, 5).forEach(w => {
                    notifContainer.innerHTML += `
                        <div class="article-notif-item">
                            <h3>Риск разрыва!</h3>
                            <div class="article-notif-item-list">
                                <p style="font-size: 16px;">${w.date}</p>
                                <p>Дефицит: ${formatMoney(w.shortage)} ₽</p>
                            </div>
                        </div>`;
                });
            }
        }
    } catch (e) { console.error(e); }
}

async function loadForecastPage() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const data = await apiFetch(`/forecast?userId=${userId}`);

        const blocks = document.querySelectorAll('.article-forecast');
        if (blocks.length >= 2) {
            blocks[0].querySelector('.article-forecast-item p').innerText = formatMoney(data.currentBalance) + ' ₽';
            const minB = Math.min(...data.forecast.map(f => f.balance));
            blocks[1].querySelector('.article-forecast-item p').innerText = `Минимум: ${formatMoney(minB)} ₽`;
        }

        const riskBlock = document.querySelectorAll('.article-forecast')[2];
        if (riskBlock) {
            const list = riskBlock.querySelector('.article-line-item')?.parentElement;
            if (list) {
                list.innerHTML = data.warnings.map(w => `
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
    } catch (e) { console.error(e); }
}

// ================== ИСТОРИЯ: ФИЛЬТРЫ + СОРТИРОВКА + ПОИСК ==================

let historyState = {
    all: [],
    filtered: [],
    page: 0,
    pageSize: 50,
    sortKey: 'operationDate',
    sortDir: 'desc',
    search: '',
    categoryId: null,
    direction: null,
    dateFrom: null,
    dateTo: null,
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
            (t.paymentPurpose && t.paymentPurpose.toLowerCase().includes(q)) ||
            (t.counterpartyInn && t.counterpartyInn.includes(q)) ||
            (t.categoryName && t.categoryName.toLowerCase().includes(q))
        );
    }

    if (s.categoryId) {
        arr = arr.filter(t => Number(t.categoryId) === Number(s.categoryId));
    }

    if (s.direction) {
        arr = arr.filter(t => t.direction === s.direction);
    }

    if (s.dateFrom) {
        arr = arr.filter(t => t.operationDate >= s.dateFrom);
    }
    if (s.dateTo) {
        arr = arr.filter(t => t.operationDate <= s.dateTo);
    }

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
        <tr>
            <td>${t.operationDate || ''}</td>
            <td>${formatMoney(t.amount)} ₽</td>
            <td>${t.direction === 'INCOME' ? 'Приход' : 'Расход'}</td>
            <td>${t.counterpartyName || '-'}</td>
            <td>${t.counterpartyInn || '-'}</td>
            <td>${t.paymentPurpose || '-'}</td>
            <td>${formatMoney(t.balanceEod)} ₽</td>
            <td>${t.categoryName || 'Без категории'}</td>
            <td></td>
        </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;">Ничего не найдено</td></tr>';

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
            if (s.sortKey === key) {
                s.sortDir = s.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                s.sortKey = key;
                s.sortDir = 'asc';
            }
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
    const addFilter = document.getElementById('addFilter');
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
                    <label class="dialog-radio">
                        <input type="radio" name="filterDir" value="" checked>
                        <span>Все</span>
                    </label>
                    <label class="dialog-radio">
                        <input type="radio" name="filterDir" value="INCOME">
                        <span>Приход</span>
                    </label>
                    <label class="dialog-radio">
                        <input type="radio" name="filterDir" value="EXPENSE">
                        <span>Расход</span>
                    </label>
                </div>
            </div>
            <div class="dialog-form-field">
                <p>Дата от</p>
                <input type="date" id="filterDateFrom" class="dialog-input-text">
            </div>
            <div class="dialog-form-field">
                <p>Дата до</p>
                <input type="date" id="filterDateTo" class="dialog-input-text">
            </div>
        </div>
        <button class="dialog-button" id="addFilter">Применить</button>
        <button class="dialog-button" id="resetFilter" style="background: var(--gray); margin-top: 10px;">Сбросить</button>
    `;

    apiFetch('/categories').then(cats => {
        const sel = document.getElementById('filterCategory');
        if (sel) {
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                sel.appendChild(opt);
            });
        }
    }).catch(console.error);

    openFilterTab.onclick = () => FilterTab.showModal();

    document.getElementById('addFilter').onclick = () => {
        const cat = document.getElementById('filterCategory').value;
        const dir = document.querySelector('input[name="filterDir"]:checked').value;
        const from = document.getElementById('filterDateFrom').value;
        const to = document.getElementById('filterDateTo').value;

        historyState.categoryId = cat ? Number(cat) : null;
        historyState.direction = dir || null;
        historyState.dateFrom = from || null;
        historyState.dateTo = to || null;

        applyHistoryFilters();
        FilterTab.close();
    };

    document.getElementById('resetFilter').onclick = () => {
        historyState.categoryId = null;
        historyState.direction = null;
        historyState.dateFrom = null;
        historyState.dateTo = null;
        applyHistoryFilters();
        FilterTab.close();
    };
}

async function addEvent(e) {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) return alert('Залогинься!');

    const name = document.getElementById('name').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const eventDate = document.getElementById('eventDate').value;
    const type = document.getElementById('type-down').checked ? 'EXPENSE' : 'INCOME';
    const period = document.getElementById('period-one').checked ? 'ONCE' : 'MONTHLY';

    if (!name || !amount || !eventDate) return alert('Заполни все поля');

    const body = { userId: Number(userId), name, type, amount, eventDate, period };

    try {
        await apiFetch('/events', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        document.getElementById('AddEvent').close();
        location.reload();
    } catch (err) { alert('Ошибка: ' + err.message); }
}

window.payEvent = async function(id) {
    try {
        await apiFetch(`/events/${id}/pay`, { method: 'PATCH' });
        location.reload();
    } catch (e) { alert('Ошибка: ' + e.message); }
};

window.logout = logout;

document.addEventListener('DOMContentLoaded', () => {
    updateSidebar();
    initAuthModals();

    if (!getUserId() && (isDashboard || isForecast || isHistory || isAnalytics)) {
        setTimeout(() => {
            const lm = document.getElementById('LoginModal');
            if (lm) lm.showModal();
        }, 300);
    }

    if (isDashboard) loadDashboard();
    if (isForecast) loadForecastPage();
    if (isHistory) {
        initHistorySort();
        initHistorySearch();
        initHistoryFilterModal();
        loadHistory();
        const btn = document.getElementById('AddEventBtn');
        if (btn) btn.addEventListener('click', addEvent);
    }
});