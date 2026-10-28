// A version change follows an explicit link; never redirect a saved preference.
document.querySelectorAll('[data-app-version]').forEach((select) => {
  select.addEventListener('change', () => {
    if (select.value) window.location.assign(select.value);
  });
  window.addEventListener('pageshow', () => { select.selectedIndex = 0; });
});
