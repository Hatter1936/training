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
/* Модальное окно добавления события */
const AddEvent = document.getElementById('AddEvent');
const openAddEvent = document.getElementById('openAddEvent');
const closeAddEvent = document.getElementById('closeAddEvent');

openAddEvent.addEventListener('click', () => {
  AddEvent.showModal();
});

closeAddEvent.addEventListener('click', () => {
  AddEvent.close();
});

AddEvent.addEventListener('click', (event) => {
  const rect = AddEvent.getBoundingClientRect();
  const isInDialog = (
    rect.top <= event.clientY &&
    event.clientY <= rect.bottom &&
    rect.left <= event.clientX &&
    event.clientX <= rect.right
  );
  if (!isInDialog) {
    AddEvent.close();
  }
});