// Simple search — filters sections by class name
document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.docs-search input');
  if (!input) return;

  const sections = document.querySelectorAll('.docs-section');

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();

    sections.forEach(section => {
      if (!q) {
        section.hidden = false;
        return;
      }
      const text = section.textContent.toLowerCase();
      const classes = section.innerHTML.toLowerCase();
      section.hidden = !(text.includes(q) || classes.includes(q));
    });
  });
});
