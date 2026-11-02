import { ME_KEY } from "@/lib/beacon";

export const runtime = "nodejs";

// "Don't count me": opened once in each of the owner's browsers (dashboard →
// Live links it at m.thegrind.studio, where the funnel pages are), it leaves
// fv:me in that browser's storage, and from then on the funnel pages count
// nothing there: no Analytics visit, no Live presence, no Pixel, Clarity or
// neo (lib/beacon.ts PREVIEW_JS). ?off=1 counts the browser again. Public.

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>funnnnels · your device</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111216;color:#f4f4f6;font:15px/1.55 system-ui,-apple-system,sans-serif;padding:24px;box-sizing:border-box}
  main{max-width:440px}
  h1{font-size:22px;letter-spacing:-.01em;margin:0 0 10px}
  p{color:#a9aab3;margin:0 0 18px}
  a{color:#c6a8ff}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#5fe0b5;margin-right:8px;vertical-align:2px}
  .off .dot{background:#f2b84b}
</style>
</head>
<body>
<main id="m">
  <h1><span class="dot"></span><span id="t"></span></h1>
  <p id="p"></p>
  <a id="a"></a>
</main>
<script>
(function(){
  var off=/[?&]off=1(?:&|$)/.test(location.search),saved=true;
  try{if(off)localStorage.removeItem('${ME_KEY}');else localStorage.setItem('${ME_KEY}','1');saved=(localStorage.getItem('${ME_KEY}')==='1')!==off;}catch(e){saved=false;}
  var t=document.getElementById('t'),p=document.getElementById('p'),a=document.getElementById('a');
  if(!saved){
    document.getElementById('m').className='off';
    t.textContent="This browser can't keep the setting";
    p.textContent='It blocks storage (a private window?). Open this page in a normal window.';
    a.remove();
  }else if(off){
    document.getElementById('m').className='off';
    t.textContent='This device is counted again';
    p.textContent='Its visits to the funnel pages show in funnnnels\\u2019 Analytics and Live again, and reach Meta Pixel, Clarity and neo.';
    a.textContent="Don't count it";a.href=location.pathname;
  }else{
    t.textContent="This device isn't counted";
    p.textContent='Your visits to the funnel pages from this browser no longer show in funnnnels\\u2019 Analytics and Live, and don\\u2019t reach Meta Pixel, Clarity or neo. Pages show a small \\u201cYour device \\u00b7 not counted\\u201d tag. Do this once on every phone and computer you use.';
    a.textContent='Count it again';a.href=location.pathname+'?off=1';
  }
})();
</script>
</body>
</html>`;

export function GET() {
  return new Response(PAGE, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
