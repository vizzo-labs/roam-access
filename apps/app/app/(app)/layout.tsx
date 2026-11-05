// Every app page fills the viewport: the mobile app on phones (installable
// as a PWA), a web app with a side panel + map from 960px up (WebLayout).
const APP_SCRIPT = `(function(){
  document.documentElement.classList.add('ra-phone');
  try { var L={'en-AU':'en-AU','zh-Hans':'zh-Hans',ja:'ja',ko:'ko',es:'es'}[localStorage.getItem('ra-locale')]; if(L) document.documentElement.lang=L; } catch(e){}
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
