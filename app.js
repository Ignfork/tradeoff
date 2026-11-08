/* TradeOff ($TRADEOFF) — shared core. Edit CONFIG before deploying. */
const CONFIG = {
  name: 'TradeOff',
  ticker: '$TRADEOFF',
  // Paste the pump.fun contract address once $TRADEOFF is live. Leave '' until then.
  ca: '',
  // Your X account URL, e.g. 'https://x.com/yourhandle'. Leave '' to hide X links.
  x: 'https://x.com/TradeOffSol',
  takerFee: 0.005,        // 0.5% paid by whoever takes an offer
  offerDeposit: 0.0018,   // refundable offer record rent (SOL)
  approvalRent: 0.0011,   // once per coin you sell (SOL)
  rpcs: ['https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'],
};
const WSOL = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = (a, n = 4) => (a && a.length > n * 2 + 1 ? `${a.slice(0, n)}…${a.slice(-n)}` : a || '');
const isAddr = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test((s || '').trim());
const qs = (k) => new URLSearchParams(window.__Q || location.search).get(k);
const num = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : 0; };
function fmtUsd(n, d) {
  if (n == null || isNaN(n)) return '–';
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  if (a >= 1) return '$' + n.toFixed(d ?? 2);
  if (a === 0) return '$0.00';
  return '$' + n.toPrecision(4);
}
function fmtPx(n) {
  if (!n) return '–';
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return Number(n.toPrecision(4)).toString().replace(/^0\./, '0.');
}
const fmtSol = (n, d = 4) => (n == null || isNaN(n) ? '–' : Number(n).toLocaleString('en-US', { maximumFractionDigits: n >= 100 ? 2 : d }) + ' SOL');
const fmtNum = (n, d = 2) => (n == null || isNaN(n) ? '–' : Number(n).toLocaleString('en-US', { maximumFractionDigits: n >= 1000 ? 0 : d }));
const pct = (n, d = 2, sign = true) => (n == null || isNaN(n) ? '–' : (sign && n > 0 ? '+' : '') + n.toFixed(d) + '%');
const ago = (ms) => { if (!ms) return '–'; const s = (Date.now() - ms) / 1000; if (s < 60) return Math.floor(s) + 's'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h'; return Math.floor(s / 86400) + 'd'; };
const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = (seed) => { const h = hue(seed); const g = 125 + (h % 40), l = 38 + (h % 30); return `linear-gradient(135deg,hsl(${g} 70% ${l + 18}%),hsl(${g + 10} 75% ${l - 14}%))`; };
function ticketNo() { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `№ ${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}·${String(d.getHours() * 60 + d.getMinutes()).padStart(3, '0').slice(-3)}`; }

const store = {
  get(k, d) { try { const v = localStorage.getItem('to_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('to_' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('to_' + k); } catch {} },
};
const session = {
  get(k) { try { const v = JSON.parse(sessionStorage.getItem('to_' + k)); return v && Date.now() - v.t < v.ttl ? v.d : null; } catch { return null; } },
  set(k, d, ttl = 60000) { try { sessionStorage.setItem('to_' + k, JSON.stringify({ t: Date.now(), ttl, d })); } catch {} },
};

function toast(msg, kind = '') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; box.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
}
async function copyText(t, label = 'Copied') {
  try { await navigator.clipboard.writeText(t); } catch { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast(label, 'ok');
}

const ICON = {
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.5 8.6L23.3 22h-6.9l-5.4-7-6.2 7H1.7l8-9.2L1.2 2h7l4.9 6.4L18.9 2Zm-1.2 18h1.9L7.1 3.9H5.1L17.7 20Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};

/* ---------- shell ---------- */
const NAV = [['index.html', 'OFFERS'], ['markets.html', 'MARKETS'], ['positions.html', 'POSITIONS'], ['history.html', 'HISTORY'], ['docs.html', 'DOCS']];
function renderShell() {
  const page = document.body.dataset.page;
  const h = document.createElement('header'); h.className = 'top';
  h.innerHTML = `<div class="top-in">
    <a class="brand" href="index.html" aria-label="${CONFIG.name} home"><img src="logo.svg" alt="" width="32" height="32"><span>Trade<span class="off">Off</span></span></a>
    <nav class="tabs" aria-label="Main">${NAV.map(([u, l]) => `<a href="${u}"${u === page ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="top-act">
      <div class="sol-tick" id="solTick" title="SOL price"><span class="sym"><i></i><i></i><i></i></span><span id="solPx">$–</span><span id="solCh" class="dim">–</span></div>
      ${CONFIG.x ? `<a class="icon-btn hide-sm" href="${CONFIG.x}" target="_blank" rel="noopener" aria-label="${CONFIG.name} on X">${ICON.x}</a>` : ''}
      <button class="btn btn-sell" id="walletBtn" type="button"><span class="lg-only">Connect wallet</span><span class="sm-only">Connect</span></button>
    </div></div>`;
  document.body.prepend(h);
  const sk = document.createElement('a'); sk.className = 'skip'; sk.href = '#main'; sk.textContent = 'Skip to content'; document.body.prepend(sk);

  const f = document.createElement('footer'); f.className = 'foot';
  f.innerHTML = `<div class="foot-in">
      <div class="foot-brand"><a class="brand" href="index.html"><img src="logo.svg" alt="" width="32" height="32"><span>Trade<span class="off">Off</span></span></a><p>The OTC desk for Solana bags. Sell to a buyer, not into the pool, and leave the chart untouched.</p></div>
      <div class="foot-col"><b>Desk</b><a href="index.html">Offers</a><a href="markets.html">Markets</a><a href="positions.html">Positions</a><a href="history.html">History</a></div>
      <div class="foot-col"><b>Learn</b><a href="docs.html#what">How it works</a><a href="docs.html#pool">Why not the pool</a><a href="docs.html#fees">Fees</a><a href="docs.html#risks">Risks</a></div>
      <div class="foot-col"><b>${CONFIG.ticker}</b><a href="docs.html#token">About the coin</a>${CONFIG.x ? `<a href="${CONFIG.x}" target="_blank" rel="noopener">@TradeOffSol on X</a>` : ''}${CONFIG.ca ? `<a href="https://pump.fun/coin/${CONFIG.ca}" target="_blank" rel="noopener">pump.fun</a>` : ''}</div>
    </div>
    <div class="foot-bar"><span class="big">Trade it off.</span><span>Pool estimates are models, not quotes. Memecoins are high risk.</span></div>`;
  document.body.appendChild(f);

  const m = document.createElement('div');
  m.innerHTML = `<div class="modal-bg" id="walletModal" role="dialog" aria-modal="true" aria-labelledby="wmT"><div class="modal">
    <div class="row between"><h3 id="wmT">Connect a wallet</h3><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <p class="muted" style="margin:0 0 8px;font-size:14px">Your address is your account. Nothing to sign up for, and TradeOff never asks for your seed phrase.</p>
    <div id="walletList"></div></div></div>`;
  document.body.append(...m.children);
  $$('.modal-bg').forEach((bg) => bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) bg.classList.remove('open'); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal-bg.open').forEach((x) => x.classList.remove('open')); });
  $('#walletBtn').addEventListener('click', () => (wallet.pubkey ? walletMenu() : openWalletModal()));
  loadSol();
}

/* ---------- wallet ---------- */
const WALLETS = [
  { id: 'phantom', name: 'Phantom', color: '#AB9FF2', get: () => (window.phantom?.solana?.isPhantom ? window.phantom.solana : window.solana?.isPhantom ? window.solana : null), url: 'https://phantom.com/download' },
  { id: 'solflare', name: 'Solflare', color: '#FFC53D', get: () => (window.solflare?.isSolflare ? window.solflare : null), url: 'https://solflare.com/download' },
  { id: 'backpack', name: 'Backpack', color: '#FF6B6B', get: () => window.backpack?.solana || null, url: 'https://backpack.app/download' },
];
const wallet = {
  pubkey: null, provider: null,
  async connect(id, silent = false) {
    const w = WALLETS.find((x) => x.id === id); const p = w?.get();
    if (!p) { if (!silent) window.open(w.url, '_blank', 'noopener'); return; }
    try {
      const r = await p.connect(silent ? { onlyIfTrusted: true } : undefined);
      const pk = (r?.publicKey || p.publicKey)?.toString(); if (!pk) return;
      this.pubkey = pk; this.provider = p; store.set('wallet', id);
      p.on?.('disconnect', () => this.clear());
      p.on?.('accountChanged', (k) => { k ? ((this.pubkey = k.toString()), emitWallet()) : this.clear(); });
      emitWallet(); if (!silent) toast('Connected ' + short(pk), 'ok');
    } catch (e) { if (!silent) toast(/reject/i.test(e?.message || '') ? 'Connection cancelled.' : 'Couldn\'t connect. Unlock your wallet and try again.', 'bad'); }
  },
  async disconnect() { try { await this.provider?.disconnect?.(); } catch {} this.clear(); toast('Wallet disconnected.'); },
  clear() { this.pubkey = null; this.provider = null; store.del('wallet'); emitWallet(); },
};
function emitWallet() {
  const b = $('#walletBtn');
  if (b) { b.className = wallet.pubkey ? 'btn' : 'btn btn-sell'; b.innerHTML = wallet.pubkey ? `<span class="wallet-dot"></span><span class="mono">${short(wallet.pubkey)}</span>` : '<span class="lg-only">Connect wallet</span><span class="sm-only">Connect</span>'; }
  document.dispatchEvent(new CustomEvent('to:wallet', { detail: wallet.pubkey }));
}
function openWalletModal() {
  $('#wmT').textContent = 'Connect a wallet';
  $('#walletList').innerHTML = WALLETS.map((w) => `<button class="wallet-opt" data-w="${w.id}" type="button"><span class="wl" style="background:${w.color}">${w.name[0]}</span>${w.name}<span class="st">${w.get() ? 'Detected' : 'Install'}</span></button>`).join('') +
    '<p class="hint" style="margin:14px 0 0">Make sure your wallet is on mainnet. On mobile, open this site in your wallet app\'s browser.</p>';
  $$('#walletList [data-w]').forEach((b) => b.addEventListener('click', async () => { $('#walletModal').classList.remove('open'); await wallet.connect(b.dataset.w); }));
  $('#walletModal').classList.add('open');
}
function walletMenu() {
  $('#wmT').textContent = 'Your wallet';
  $('#walletList').innerHTML = `<div class="ca" style="margin-top:6px"><span class="wallet-dot"></span><span class="v" style="white-space:normal;word-break:break-all">${wallet.pubkey}</span></div>
    <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn btn-sm" id="wmCopy">Copy address</button><a class="btn btn-sm" href="positions.html">Your desk</a><button class="btn btn-sm" id="wmOff" style="color:var(--down)">Disconnect</button></div>`;
  $('#wmCopy').onclick = () => copyText(wallet.pubkey, 'Address copied');
  $('#wmOff').onclick = () => { $('#walletModal').classList.remove('open'); wallet.disconnect(); };
  $('#walletModal').classList.add('open');
}
function needWallet(msg = 'Connect a wallet first.') { if (wallet.pubkey) return true; toast(msg, 'warn'); openWalletModal(); return false; }

/* ---------- Solana RPC ---------- */
const rpc = {
  async call(method, params = []) {
    let err;
    for (const url of CONFIG.rpcs) {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
      } catch (e) { err = e; }
    }
    throw err || new Error('RPC unavailable');
  },
};
async function walletTokens(owner) {
  const [a, b] = await Promise.all([
    rpc.call('getTokenAccountsByOwner', [owner, { programId: TOKEN_PROGRAM }, { encoding: 'jsonParsed' }]),
    rpc.call('getTokenAccountsByOwner', [owner, { programId: TOKEN_2022 }, { encoding: 'jsonParsed' }]).catch(() => ({ value: [] })),
  ]);
  const map = {};
  [...(a?.value || []), ...(b?.value || [])].forEach((x) => {
    const i = x.account?.data?.parsed?.info; const amt = Number(i?.tokenAmount?.uiAmount || 0);
    if (!i || amt <= 0) return;
    map[i.mint] = map[i.mint] || { mint: i.mint, amount: 0, decimals: i.tokenAmount.decimals, program: x.account.owner };
    map[i.mint].amount += amt;
  });
  return Object.values(map);
}
async function mintCheck(mint) {
  const r = await rpc.call('getAccountInfo', [mint, { encoding: 'jsonParsed' }]);
  const v = r?.value; const p = v?.data?.parsed;
  if (!v || p?.type !== 'mint') return { ok: false, reason: 'Not a coin address.' };
  const ext = (p.info.extensions || []).map((e) => e.extension);
  const bad = ext.filter((e) => ['transferFeeConfig', 'transferHook', 'permanentDelegate'].includes(e));
  return { ok: !bad.length, reason: bad.length ? 'Refused: this coin has ' + bad.join(', ').replace(/([A-Z])/g, ' $1').toLowerCase() + '.' : '', freezable: !!p.info.freezeAuthority, decimals: p.info.decimals, program: v.owner };
}

/* ---------- market data (DexScreener public API) ---------- */
const dex = {
  async tokens(addrs) {
    const out = [];
    for (let i = 0; i < addrs.length; i += 30) {
      try {
        const r = await fetch('https://api.dexscreener.com/tokens/v1/solana/' + addrs.slice(i, i + 30).join(','));
        if (r.ok) { const j = await r.json(); if (Array.isArray(j)) out.push(...j); }
      } catch {}
    }
    return out;
  },
  best(pairs, addr, preferPumpswap = true) {
    const l = pairs.filter((p) => p.chainId === 'solana' && p.baseToken?.address === addr);
    if (!l.length) return null;
    const ps = l.filter((p) => p.dexId === 'pumpswap');
    const pool = (preferPumpswap && ps.length ? ps : l).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    return pool[0];
  },
  async coin(addr) { const p = await this.tokens([addr]); return this.best(p, addr); },
  async list(path) { try { const r = await fetch('https://api.dexscreener.com/' + path); if (!r.ok) return []; const j = await r.json(); return Array.isArray(j) ? j : j.pairs || []; } catch { return []; } },
};
function coinView(p) {
  if (!p) return null;
  return {
    addr: p.baseToken.address, symbol: p.baseToken.symbol, name: p.baseToken.name, img: p.info?.imageUrl || '',
    usd: Number(p.priceUsd) || 0, sol: Number(p.priceNative) || 0, liq: p.liquidity?.usd || 0, vol24: p.volume?.h24 || 0, vol1: p.volume?.h1 || 0,
    ch1: p.priceChange?.h1 ?? null, ch24: p.priceChange?.h24 ?? null, mcap: p.marketCap ?? p.fdv ?? 0, dex: p.dexId, pair: p.pairAddress, url: p.url, created: p.pairCreatedAt,
    quote: p.quoteToken?.symbol,
  };
}
async function loadSol() {
  let px = session.get('sol');
  if (!px) {
    try {
      const pairs = await dex.tokens([WSOL]);
      const usd = pairs.filter((p) => p.baseToken?.address === WSOL && /USDC|USDT/.test(p.quoteToken?.symbol || '')).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      if (usd) px = { usd: Number(usd.priceUsd), ch: usd.priceChange?.h24 ?? 0 };
    } catch {}
    if (!px) { try { const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'); const j = await r.json(); px = { usd: j.solana.usd, ch: j.solana.usd_24h_change }; } catch {} }
    if (px) session.set('sol', px, 60000);
  }
  window.SOL_USD = px?.usd || 0;
  if (px && $('#solPx')) { $('#solPx').textContent = '$' + px.usd.toFixed(2); const c = $('#solCh'); c.textContent = pct(px.ch); c.className = px.ch >= 0 ? 'up' : 'down'; }
  document.dispatchEvent(new CustomEvent('to:sol', { detail: px }));
  return px;
}
async function loadPumpSwap(force = false) {
  const cached = !force && session.get('pumpswap');
  if (cached) return cached;
  const [boostTop, boostNew, profiles, search] = await Promise.all([
    dex.list('token-boosts/top/v1'), dex.list('token-boosts/latest/v1'), dex.list('token-profiles/latest/v1'), dex.list('latest/dex/search?q=pumpswap'),
  ]);
  const addrs = new Set();
  [...boostTop, ...boostNew, ...profiles].forEach((t) => { if (t.chainId === 'solana' && t.tokenAddress) addrs.add(t.tokenAddress); });
  const pairs = [...search];
  const fetched = await dex.tokens([...addrs].slice(0, 120));
  pairs.push(...fetched);
  const byCoin = {};
  pairs.forEach((p) => {
    if (p.chainId !== 'solana' || p.dexId !== 'pumpswap' || !p.baseToken?.address || p.baseToken.address === WSOL) return;
    if (!(p.volume?.h24 > 0) || !(p.liquidity?.usd > 1500)) return;
    const k = p.baseToken.address;
    if (!byCoin[k] || (p.liquidity?.usd || 0) > (byCoin[k].liquidity?.usd || 0)) byCoin[k] = p;
  });
  const list = Object.values(byCoin).map(coinView).sort((a, b) => b.vol24 - a.vol24);
  session.set('pumpswap', { list, at: Date.now() }, 60000);
  return { list, at: Date.now() };
}

/* ---------- pool math ----------
   Constant product, half the pool's liquidity on each side.
   Selling D dollars into side R gets an average of R/(R+D) of market and leaves the price at (R/(R+D))^2.
   Buying D dollars out of the pool pays an average of (R+D)/R of market. */
function impact(liqUsd, sizeUsd) {
  if (!liqUsd || !sizeUsd) return null;
  const R = liqUsd / 2, D = sizeUsd, g = R / (R + D);
  return { sellerGets: (g - 1) * 100, chart: (g * g - 1) * 100, buyerPays: (D / R) * 100, chartUp: (((R + D) / R) ** 2 - 1) * 100 };
}

/* ---------- drafts (until the on-chain desk is live) ---------- */
const drafts = {
  all() { return store.get('drafts', []); },
  add(d) { const l = this.all(); l.unshift({ ...d, id: Date.now().toString(36), at: Date.now() }); store.set('drafts', l.slice(0, 40)); },
  remove(id) { store.set('drafts', this.all().filter((d) => d.id !== id)); },
};

function mountCA(el) {
  if (!el) return;
  if (CONFIG.ca) {
    el.innerHTML = `<span class="k">CA</span><span class="v">${CONFIG.ca}</span><button class="btn btn-sm" data-c>Copy</button><a class="btn btn-sm btn-sell" href="https://pump.fun/coin/${CONFIG.ca}" target="_blank" rel="noopener">Buy on pump.fun</a>`;
    el.querySelector('[data-c]').onclick = () => copyText(CONFIG.ca, 'CA copied');
  } else {
    el.innerHTML = `<span class="k">CA</span><span class="v pending">Launching on pump.fun. The CA drops on X first.</span>${CONFIG.x ? `<a class="btn btn-sm" href="${CONFIG.x}" target="_blank" rel="noopener">Follow on X</a>` : ''}`;
  }
}
function coinImg(c, cls = 'ph') {
  return c?.img ? `<img src="${esc(c.img)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;${cls}&quot; style=&quot;background:${avatar(c.addr)}&quot;></span>'">` : `<span class="${cls}" style="background:${avatar(c?.addr || '?')}"></span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  const last = store.get('wallet', null);
  if (last) setTimeout(() => wallet.connect(last, true), 300);
});
