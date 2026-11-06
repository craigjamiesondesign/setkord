(() => {
  const prefix = '/setkord';

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#')) return;

    const destination = new URL(rawHref, window.location.href);
    if (destination.origin !== window.location.origin) return;

    if (!destination.pathname.startsWith(`${prefix}/`) && destination.pathname !== prefix) {
      destination.pathname = `${prefix}${destination.pathname.startsWith('/') ? '' : '/'}${destination.pathname}`;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(destination.href);
  }, true);
})();
