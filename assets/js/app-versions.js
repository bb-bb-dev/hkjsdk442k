// Keep app choice explicit in URLs; never redirect a search visitor using saved preferences.
(() => {
  const variants = {
    ant: {
      title: 'TyreWiz & AIRMAX (ANT+)', app: 'TubeWitch for TyreWiz & AIRMAX',
      protocol: 'ANT+ sensors', home: 'index.html', docs: '', section: 'quarq-sram', homeKey: 'index',
      image: 'assets/img/compatible-sensors/quarq-tyrewiz-2-card.png',
      store: 'https://apps.garmin.com/apps/9b512e62-f3b0-4aea-a932-63670e0dfe75',
    },
    tubolito: {
      title: 'Tubolito SYNCD (Bluetooth LE)', app: 'TubeWitch for Tubolito SYNCD',
      protocol: 'Bluetooth LE sensors', home: 'garmin-tubolito.html', docs: 'ble/',
      section: 'tubolito', homeKey: 'ble-home', image: 'assets/img/tubolito-syncd-product.png',
      store: 'https://apps.garmin.com/apps/fd57ab65-db85-4c88-bfb9-2b77540e8713',
    },
    airspy: {
      title: 'SKS AIRSPY (ANT+)', app: 'TubeWitch for SKS AIRSPY',
      protocol: 'SKS AIRSPY / ANT+', home: 'garmin-airspy.html', docs: 'airspy/',
      section: 'sks', homeKey: 'airspy-home',
      image: 'assets/img/compatible-sensors/sks-airspy-presta-cutout-117.png',
      store: 'https://apps.garmin.com/apps/902e5efd-7a1e-4b97-aea3-1f30cbd10144',
    },
  };
  const siteRoot = new URL('../../', document.currentScript.src);
  const page = document.documentElement.dataset.page;
  const sharedPages = ['compatible-tire-sensors', 'gallery', 'support'];
  const requested = new URLSearchParams(window.location.search).get('app');
  const key = sharedPages.includes(page) && Object.hasOwn(variants, requested) ? requested : null;
  const route = (appKey, topic) => {
    const app = variants[appKey];
    if (['setup', 'settings', 'troubleshooting', 'faq'].includes(topic)) return app.docs + topic + '.html';
    if (sharedPages.includes(topic)) return topic + '.html' + (appKey === 'ant' ? '' : '?app=' + appKey);
    return app.home;
  };
  // Shared pages must adopt the requested navigation before app.js measures mobile rows.
  if (key && key !== 'ant') {
    const variant = variants[key];
    document.documentElement.classList.add('ble-edition');
    document.documentElement.classList.toggle('airspy-edition', key === 'airspy');
    const header = document.querySelector('.site-header');
    header.classList.remove('ant-navigation');
    header.querySelector('.brand').href = new URL(variant.home, siteRoot);
    const links = [
      ['Home', variant.home, variant.homeKey],
      ['Sensors', route(key, 'compatible-tire-sensors') + '#' + variant.section, 'compatible-tire-sensors'],
      ...['setup', 'settings', 'troubleshooting', 'faq', 'support', 'gallery'].map(topic => [
        topic === 'faq' ? 'FAQ' : topic[0].toUpperCase() + topic.slice(1), route(key, topic), topic,
      ]),
      ['Garmin App Store', variant.store, 'store'],
    ];
    const appLink = ([label, href, navKey]) => {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = new URL(href, siteRoot);
      link.dataset.nav = navKey;
      if (navKey === 'store') {
        link.className = 'btn-inline';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      return link;
    };
    const nav = header.querySelector('.nav-links');
    nav.setAttribute('aria-label', variant.app + ' primary');
    nav.replaceChildren(...links.map(appLink));
    const footer = document.querySelector('.footer-links');
    footer.replaceChildren(...links.map(appLink), appLink(['YouTube', 'https://www.youtube.com/@TubeWitch', 'youtube']));

    const identity = document.querySelector('.ble-version');
    identity.classList.remove('ant-version');
    identity.querySelector('.ble-version-identity').href = new URL(variant.home, siteRoot);
    identity.querySelector('img').src = new URL(variant.image, siteRoot);
    identity.querySelector('small').textContent = variant.protocol;
    identity.querySelector('strong').textContent = variant.app;
    const select = identity.querySelector('select');
    select.replaceChildren(...Object.entries(variants).map(([otherKey, other]) =>
      new Option(other.title, new URL(route(otherKey, page), siteRoot).href, otherKey === key, otherKey === key)
    ));
    document.querySelectorAll('main a[href]').forEach(link => {
      const target = new URL(link.href);
      const topic = target.pathname.split('/').pop()?.replace('.html', '');
      if (target.origin === siteRoot.origin && ['setup', 'settings', 'troubleshooting', 'faq', 'support', 'gallery'].includes(topic)) {
        link.href = new URL(route(key, topic) + target.hash, siteRoot);
      }
    });
  }
  document.querySelectorAll('[data-app-version]').forEach(select => {
    select.addEventListener('change', () => {
      if (select.value) window.location.assign(select.value);
    });
    // Restore this document's app label when returning through browser history.
    window.addEventListener('pageshow', () => {
      select.selectedIndex = Array.from(select.options).findIndex(option => option.defaultSelected);
    });
  });
})();
