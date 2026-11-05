// Every app page fills the viewport: the mobile app on phones (installable
// as a PWA), a web app with a side panel + map from 960px up (WebLayout).
const APP_SCRIPT = `(function(){
  document.documentElement.classList.add('ra-phone');
  document.addEventListener('click', function(e){ var a=e.target.closest&&e.target.closest('.ra-skip');
    if(!a) return; e.preventDefault(); var m=document.getElementById('ra-main'); if(m) m.focus(); });
})();`;

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: APP_SCRIPT }}/>
      <a className="ra-skip" href="#ra-main">Skip to main content</a>
      <div className="app-shell">
        <div id="root">{children}</div>
      </div>
    </>
  );
}
