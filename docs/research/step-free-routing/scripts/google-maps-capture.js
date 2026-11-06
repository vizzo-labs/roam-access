// Captures Google Maps walking directions (default vs "Wheelchair accessible") as
// panel text. Run with: bb browser-automation run <session> --script-file this.js
// (one destination per run; see the report). Research spike only.
const DESTS = [
 ["library",-33.7976,151.28598],["brighton",-33.79738,151.2872],["gallery",-33.79848,151.2813],
 ["fairybower",-33.8008,151.29437],["shelly",-33.80098,151.29819],["fairlightpool",-33.80021,151.27548],
 ["fairlightshops",-33.79586,151.2768],["littlemanly",-33.80655,151.28731],["collins",-33.80828,151.29154],
 ["bronze",-33.81207,151.29747],["queenscliff",-33.78627,151.28946],["balgowlah",-33.79457,151.26521]];
const p = await browser.getPage("main");
const out = {};
for (const [id, lat, lon] of DESTS) {
  out[id] = {};
  for (const wc of [false, true]) {
    const data = wc ? "data=!4m4!4m3!2m1!10b1!3e2" : "data=!4m2!4m1!3e2";
    const url = `https://www.google.com/maps/dir/-33.79975,151.2846/${lat},${lon}/@${lat},${lon},16z/${data}?hl=en-AU`;
    await p.goto(url); await new Promise(r => setTimeout(r, 4500));
    const routes = await p.evaluate(() => [...document.querySelectorAll("[role=main]")].map(x => x.innerText).join("\n"));
    let details = "";
    try {
      const btn = await p.evaluateHandle(() => [...document.querySelectorAll("button")].find(b => b.innerText.trim() === "Details"));
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 2000));
        details = await p.evaluate(() => [...document.querySelectorAll("[role=main]")].map(x => x.innerText).join("\n")); }
    } catch (e) { details = "ERR " + e.message; }
    out[id][wc ? "wheelchair" : "walking"] = { url, routes: routes.slice(0, 1500), details: details.slice(0, 2500) };
  }
}
console.log(JSON.stringify(out));
undefined
