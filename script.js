const shell = document.querySelector('.orbital-shell');

if (shell) {
  document.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 24;
    const y = (event.clientY / window.innerHeight - 0.5) * -24;

    shell.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  });
}

const buttons = document.querySelectorAll('button');
buttons.forEach((button) => {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px) scale(1.01)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = '';
  });
});
