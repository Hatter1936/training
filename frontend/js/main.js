/* Герой-секция, параллакс эффект */
$(document).ready(function () {
    const $heroSection = $('#hero-parallax');
    const $parallaxBg  = $heroSection.find('.parallax-bg');

    if (!$heroSection.length || !$parallaxBg.length) return;

    $heroSection.on('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;

        const moveX = x * 15;
        const moveY = y * 15;

        $parallaxBg.css('transform', `translate(${moveX}px, ${moveY}px)`);
    });

    $heroSection.on('mouseleave', function () {
        $parallaxBg.css('transform', 'translate(0px, 0px)');
    });
});

/* Удаление записи */
const historyTable = document.querySelector('.article-history');

if (historyTable) {
  historyTable.addEventListener('click', (e) => {
    const btn = e.target.closest('.row-delete');
    if (!btn) return;

    const row = btn.closest('tr');
    if (!row) return;

    if (confirm('Удалить эту запись?')) {
      row.remove();
    }
  });
}

/* Универсальный обработчик закрытия по клику на backdrop */
function closeOnBackdrop(dialog) {
  if (!dialog) return;
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top    <= event.clientY &&
      event.clientY <= rect.bottom &&
      rect.left   <= event.clientX &&
      event.clientX <= rect.right
    );
    if (!isInDialog) dialog.close();
  });
}

/* Модальное окно добавления события */
const AddEvent      = document.getElementById('AddEvent');
const openAddEvent  = document.getElementById('openAddEvent');
const closeAddEvent = document.getElementById('closeAddEvent');

if (AddEvent && openAddEvent && closeAddEvent) {
  openAddEvent.addEventListener('click', () => AddEvent.showModal());
  closeAddEvent.addEventListener('click', () => AddEvent.close());
  closeOnBackdrop(AddEvent);
}

/* Модалки вход / регистрация */
const LoginModal    = document.getElementById('LoginModal');
const RegisterModal = document.getElementById('RegisterModal');

const openLogin     = document.getElementById('openLogin');
const closeLogin    = document.getElementById('closeLogin');
const openRegister  = document.getElementById('openRegister');
const closeRegister = document.getElementById('closeRegister');

const toRegister = document.getElementById('toRegister');
const toLogin    = document.getElementById('toLogin');

if (LoginModal && openLogin && closeLogin) {
  openLogin.addEventListener('click', (e) => {
    e.preventDefault();
    LoginModal.showModal();
  });
  closeLogin.addEventListener('click', () => LoginModal.close());
  closeOnBackdrop(LoginModal);
}

if (RegisterModal && openRegister && closeRegister) {
  openRegister.addEventListener('click', (e) => {
    e.preventDefault();
    RegisterModal.showModal();
  });
  closeRegister.addEventListener('click', () => RegisterModal.close());
  closeOnBackdrop(RegisterModal);
}

if (toRegister && LoginModal && RegisterModal) {
  toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    LoginModal.close();
    RegisterModal.showModal();
  });
}

if (toLogin && LoginModal && RegisterModal) {
  toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    RegisterModal.close();
    LoginModal.showModal();
  });
}