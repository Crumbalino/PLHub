/**
 * Blocking script to prevent flash-of-wrong-theme (FOWT).
 * Inject this in <head> via dangerouslySetInnerHTML BEFORE any CSS loads.
 * Reads localStorage preference and applies .dark or .light class immediately.
 */
export const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('plh-theme');
    if (t === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;
