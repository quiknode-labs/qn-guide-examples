export default function ThemeScript() {
  // Inline script that runs before React hydration to prevent flash
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('hyperbase-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch(e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
