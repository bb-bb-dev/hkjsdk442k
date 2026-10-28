// Keep the shared Sensors page in the app context chosen by its incoming link.
// This runs before app.js there so mobile navigation measures the correct links.
if (document.documentElement.dataset.page === 'compatible-tire-sensors'
    && new URLSearchParams(window.location.search).get('app') === 'tubolito') {
  document.documentElement.classList.add('ble-edition');
  const header = document.querySelector('.site-header');
  header.classList.remove('ant-navigation');
  header.querySelector('.brand').href = 'garmin-tubolito.html';

  const links = [
    ['Tubolito on Garmin', 'garmin-tubolito.html', 'ble-home'],
    ['Sensors', 'compatible-tire-sensors.html?app=tubolito#tubolito', 'compatible-tire-sensors'],
    ['Setup', 'ble/setup.html', 'setup'],
    ['Settings', 'ble/settings.html', 'settings'],
    ['Troubleshooting', 'ble/troubleshooting.html', 'troubleshooting'],
    ['FAQ', 'ble/faq.html', 'faq'],
    ['Support', 'ble/troubleshooting.html#support', 'support'],
    ['Garmin App Store', 'https://apps.garmin.com/apps/fd57ab65-db85-4c88-bfb9-2b77540e8713', 'store'],
  ];
  function appLink([label, href, key]) {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = href;
    link.dataset.nav = key;
    if (key === 'store') {
      link.className = 'btn-inline';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    return link;
  }
  const nav = header.querySelector('.nav-links');
  nav.setAttribute('aria-label', 'Tubolito primary');
  nav.replaceChildren(...links.map(appLink));
  const footer = document.querySelector('.footer-links');
  footer.setAttribute('aria-label', 'Tubolito footer');
  footer.replaceChildren(...links.map(appLink), appLink(['TyreWiz & AIRMAX site', 'index.html', 'ant-home']));

  const identity = document.createElement('aside');
  identity.className = 'ble-version wrap';
  identity.setAttribute('aria-label', 'TubeWitch app version');
  identity.innerHTML = '<a class="ble-version-identity" href="garmin-tubolito.html"><img src="assets/img/tubolito-syncd-product.png" alt="" width="64" height="64" /><span><small>Bluetooth LE sensors</small><strong>TubeWitch for Tubolito SYNCD</strong></span></a><div class="ble-version-controls"><label for="app-version">Your sensors</label><select id="app-version" data-app-version><option value="" selected>Tubolito SYNCD</option><option value="compatible-tire-sensors.html">TyreWiz &amp; AIRMAX (ANT+)</option></select></div>';
  header.insertAdjacentElement('afterend', identity);
}

// A version change follows an explicit link; never redirect a saved preference.
document.querySelectorAll('[data-app-version]').forEach((select) => {
  select.addEventListener('change', () => {
    if (select.value) window.location.assign(select.value);
  });
  window.addEventListener('pageshow', () => { select.selectedIndex = 0; });
});
