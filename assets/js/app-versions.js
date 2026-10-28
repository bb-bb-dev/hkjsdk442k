// Explicit app links retain their context without saving a redirect preference.
(() => {
  const variants = {
    tubolito: {
      title: 'Tubolito SYNCD', navLabel: 'Tubolito on Garmin', navAria: 'Tubolito', app: 'TubeWitch for Tubolito SYNCD',
      protocol: 'Bluetooth LE sensors', home: 'garmin-tubolito.html',
      docs: 'ble/', section: 'tubolito', homeKey: 'ble-home',
      image: 'assets/img/tubolito-syncd-product.png',
      store: 'https://apps.garmin.com/apps/fd57ab65-db85-4c88-bfb9-2b77540e8713',
    },
    airspy: {
      title: 'SKS AIRSPY', navLabel: 'AIRSPY on Garmin', navAria: 'AIRSPY', app: 'TubeWitch for SKS AIRSPY',
      protocol: 'SKS AIRSPY / ANT+', home: 'garmin-airspy.html',
      docs: 'airspy/', section: 'sks', homeKey: 'airspy-home',
      image: 'assets/img/compatible-sensors/sks-airspy-presta-cutout-117.png',
      store: 'https://apps.garmin.com/apps/902e5efd-7a1e-4b97-aea3-1f30cbd10144',
    },
  };
  const requested = new URLSearchParams(window.location.search).get('app');
  const variant = Object.hasOwn(variants, requested) ? variants[requested] : null;
  // On Sensors this helper loads before app.js measures mobile navigation.
  if (document.documentElement.dataset.page === 'compatible-tire-sensors' && variant) {
    document.documentElement.classList.add('ble-edition');
    document.documentElement.classList.toggle('airspy-edition', requested === 'airspy');
    const header = document.querySelector('.site-header');
    header.classList.remove('ant-navigation');
    header.querySelector('.brand').href = variant.home;
    const links = [
      [variant.navLabel, variant.home, variant.homeKey],
      ['Sensors', `compatible-tire-sensors.html?app=${requested}#${variant.section}`, 'compatible-tire-sensors'],
      ['Setup', variant.docs + 'setup.html', 'setup'],
      ['Settings', variant.docs + 'settings.html', 'settings'],
      ['Troubleshooting', variant.docs + 'troubleshooting.html', 'troubleshooting'],
      ['FAQ', variant.docs + 'faq.html', 'faq'],
      ['Support', variant.docs + 'troubleshooting.html#support', 'support'],
      ['Garmin App Store', variant.store, 'store'],
    ];
    const appLink = ([label, href, key]) => {
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
    };
    const nav = header.querySelector('.nav-links');
    nav.setAttribute('aria-label', variant.navAria + ' primary');
    nav.replaceChildren(...links.map(appLink));
    const footer = document.querySelector('.footer-links');
    footer.setAttribute('aria-label', variant.navAria + ' footer');
    footer.replaceChildren(...links.map(appLink), appLink(['All TubeWitch apps', 'index.html', 'ant-home']));

    const identity = document.createElement('aside');
    identity.className = 'ble-version wrap';
    identity.setAttribute('aria-label', 'TubeWitch app version');
    const brand = document.createElement('a');
    brand.className = 'ble-version-identity';
    brand.href = variant.home;
    const image = document.createElement('img');
    image.src = variant.image;
    image.alt = '';
    image.width = image.height = 64;
    const copy = document.createElement('span');
    const protocol = document.createElement('small');
    protocol.textContent = variant.protocol;
    const app = document.createElement('strong');
    app.textContent = variant.app;
    copy.append(protocol, app);
    brand.append(image, copy);
    const controls = document.createElement('div');
    controls.className = 'ble-version-controls';
    const label = document.createElement('label');
    label.htmlFor = 'app-version';
    label.textContent = 'Your sensors';
    const select = document.createElement('select');
    select.id = 'app-version';
    select.dataset.appVersion = '';
    select.add(new Option(variant.title, '', true, true));
    select.add(new Option('TyreWiz & AIRMAX (ANT+)', 'compatible-tire-sensors.html'));
    Object.entries(variants).forEach(([key, other]) => {
      if (key !== requested) select.add(new Option(other.title, `compatible-tire-sensors.html?app=${key}#${other.section}`));
    });
    controls.append(label, select);
    identity.append(brand, controls);
    header.insertAdjacentElement('afterend', identity);
  }
  document.querySelectorAll('[data-app-version]').forEach((select) => {
    select.addEventListener('change', () => {
      if (select.value) window.location.assign(select.value);
    });
    window.addEventListener('pageshow', () => { select.selectedIndex = 0; });
  });
})();
