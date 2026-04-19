export default async function handler(req, res) {
  const username = req.query.username || '23f2004613';

  try {
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: { 'User-Agent': 'github-terminal-card', Accept: 'application/vnd.github.v3+json' }
      }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, {
        headers: { 'User-Agent': 'github-terminal-card', Accept: 'application/vnd.github.v3+json' }
      }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
        headers: { 'User-Agent': 'github-terminal-card', Accept: 'application/vnd.github.v3+json' }
      }),
    ]);

    const user     = await userRes.json();
    const repos    = await reposRes.json();
    const events   = await eventsRes.json();

    const stars     = Array.isArray(repos) ? repos.reduce((a, r) => a + r.stargazers_count, 0) : 0;
    const forks     = Array.isArray(repos) ? repos.reduce((a, r) => a + r.forks_count, 0) : 0;
    const followers = user.followers || 0;
    const totalRepos= user.public_repos || 0;

    // Count recent commits from events
    const pushEvents = Array.isArray(events) ? events.filter(e => e.type === 'PushEvent') : [];
    const recentCommits = pushEvents.reduce((a, e) => a + (e.payload?.commits?.length || 0), 0);

    // Top language from repos
    const langMap = {};
    if (Array.isArray(repos)) {
      repos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1; });
    }
    const topLang = Object.entries(langMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Python';

    // Build bar widths (max 200px)
    const maxVal = Math.max(stars, forks, followers, 1);
    const bStars = Math.round((stars / Math.max(maxVal, 1)) * 200);
    const bForks = Math.round((forks / Math.max(maxVal, 1)) * 200);
    const bFollowers = Math.round((followers / Math.max(maxVal, 1)) * 200);

    const svg = buildSVG({ username, stars, forks, followers, totalRepos, recentCommits, topLang, bStars, bForks, bFollowers });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(svg);

  } catch (err) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(errorSVG(String(err)));
  }
}

function buildSVG({ username, stars, forks, followers, totalRepos, recentCommits, topLang, bStars, bForks, bFollowers }) {
  return `<svg viewBox="0 0 820 480" xmlns="http://www.w3.org/2000/svg" font-family="'Courier New',Courier,monospace">
  <defs>
    <style>
      .scan{animation:scan 7s linear infinite}
      @keyframes scan{0%{transform:translateY(-4px)}100%{transform:translateY(484px)}}
      .cur{animation:blink 1s step-end infinite}
      @keyframes blink{50%{opacity:0}}
      .r1{animation:fadeUp .5s .1s both}
      .r2{animation:fadeUp .5s .3s both}
      .r3{animation:fadeUp .5s .5s both}
      .r4{animation:fadeUp .5s .7s both}
      .r5{animation:fadeUp .5s .9s both}
      .r6{animation:fadeUp .5s 1.1s both}
      .r7{animation:fadeUp .5s 1.3s both}
      .r8{animation:fadeUp .5s 1.5s both}
      .r9{animation:fadeUp .5s 1.7s both}
      .r10{animation:fadeUp .5s 1.9s both}
      .r11{animation:fadeUp .5s 2.1s both}
      .r12{animation:fadeUp .5s 2.3s both}
      @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      .bs{animation:growS 1.4s 2.5s both}
      .bf{animation:growF 1.4s 2.7s both}
      .bfw{animation:growFw 1.4s 2.9s both}
      @keyframes growS{from{width:0}to{width:${bStars}px}}
      @keyframes growF{from{width:0}to{width:${bForks}px}}
      @keyframes growFw{from{width:0}to{width:${bFollowers}px}}
    </style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d120d"/>
      <stop offset="100%" stop-color="#050905"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00ff41"/>
      <stop offset="100%" stop-color="#00cc33"/>
    </linearGradient>
    <clipPath id="cbs"><rect x="560" y="178" width="220" height="12" rx="3"/></clipPath>
    <clipPath id="cbf"><rect x="560" y="228" width="220" height="12" rx="3"/></clipPath>
    <clipPath id="cbfw"><rect x="560" y="278" width="220" height="12" rx="3"/></clipPath>
  </defs>

  <!-- Background -->
  <rect width="820" height="480" fill="url(#bgGrad)" rx="12"/>

  <!-- CRT grid texture -->
  <pattern id="crt" width="1" height="3" patternUnits="userSpaceOnUse">
    <rect width="1" height="1" y="2" fill="rgba(0,0,0,0.15)"/>
  </pattern>
  <rect width="820" height="480" fill="url(#crt)" rx="12"/>

  <!-- Scanline sweep -->
  <rect class="scan" width="820" height="4" y="-4" fill="rgba(0,255,65,0.04)"/>

  <!-- Top chrome bar -->
  <rect width="820" height="38" fill="#011201" rx="12"/>
  <rect y="26" width="820" height="12" fill="#011201"/>
  <circle cx="22" cy="19" r="6" fill="#ff5f57"/>
  <circle cx="42" cy="19" r="6" fill="#febc2e"/>
  <circle cx="62" cy="19" r="6" fill="#28c840"/>
  <text x="410" y="23" fill="#1a6a1a" font-size="11" text-anchor="middle">~/github/${username}/README.md — live data</text>

  <!-- ══ LEFT PANEL ══ -->

  <!-- Name -->
  <text class="r1" x="40" y="84" fill="#00ff41" font-size="34" font-weight="bold" letter-spacing="5">NILESH SARKAR</text>
  <text class="r2" x="40" y="105" fill="#1a9a3a" font-size="10.5" letter-spacing="3">[ IIT MADRAS · DATA SCIENCE · ML ENGINEER · FULL-STACK ]</text>

  <line class="r3" x1="40" y1="120" x2="500" y2="120" stroke="#0f3a0f" stroke-dasharray="3 3" stroke-width="1"/>

  <!-- Section label -->
  <text class="r3" x="40" y="142" fill="#00cc33" font-size="10" letter-spacing="2">▶  WHOAMI</text>

  <!-- About rows -->
  <text class="r4" x="50" y="162" fill="#1a6a1a" font-size="11">Name     :</text>
  <text class="r4" x="148" y="162" fill="#00ff41" font-size="11">Nilesh Sarkar</text>

  <text class="r5" x="50" y="180" fill="#1a6a1a" font-size="11">Location :</text>
  <text class="r5" x="148" y="180" fill="#00ff41" font-size="11">Jamshedpur, Jharkhand, India</text>

  <text class="r6" x="50" y="198" fill="#1a6a1a" font-size="11">College  :</text>
  <text class="r6" x="148" y="198" fill="#00ff41" font-size="11">IIT Madras — BS Data Science 2026</text>

  <text class="r7" x="50" y="216" fill="#1a6a1a" font-size="11">Focus    :</text>
  <text class="r7" x="148" y="216" fill="#00ff41" font-size="11">Deep Learning · GenAI · Full-Stack</text>

  <text class="r8" x="50" y="234" fill="#1a6a1a" font-size="11">Top Lang :</text>
  <text class="r8" x="148" y="234" fill="#00cc33" font-size="11">${topLang}</text>

  <text class="r9" x="50" y="260" fill="#1a6a1a" font-size="11">Active   :</text>
  <text class="r9" x="148" y="260" fill="#00cc33" font-size="11">→ Music Genre Classifier (AST+CNN)</text>
  <text class="r10" x="148" y="276" fill="#00cc33" font-size="11">→ GenAI + LLM experiments (T12026)</text>
  <text class="r11" x="148" y="292" fill="#00cc33" font-size="11">→ Shell scripting automation (SE2001)</text>

  <line class="r11" x1="40" y1="308" x2="500" y2="308" stroke="#0f3a0f" stroke-dasharray="3 3" stroke-width="1"/>

  <!-- Tech badges row 1 -->
  <text class="r12" x="40" y="326" fill="#00cc33" font-size="10" letter-spacing="2">▶  LOADED MODULES</text>
  <g class="r12">
    ${['python','pytorch','flask','vue.js','bash'].map((b,i)=>`
    <rect x="${40+i*88}" y="334" width="82" height="22" rx="4" fill="#001a00" stroke="${i<2?'#00ff41':'#0f3a0f'}" stroke-width="0.8"/>
    <text x="${81+i*88}" y="349" fill="${i<2?'#00ff41':'#00cc33'}" font-size="10" text-anchor="middle">${b}</text>`).join('')}
  </g>
  <g class="r12">
    ${['docker','redis','wandb','sklearn','git'].map((b,i)=>`
    <rect x="${40+i*88}" y="362" width="82" height="22" rx="4" fill="#001a00" stroke="#0f3a0f" stroke-width="0.8"/>
    <text x="${81+i*88}" y="377" fill="#00cc33" font-size="10" text-anchor="middle">${b}</text>`).join('')}
  </g>

  <!-- Terminal prompt -->
  <line x1="40" y1="400" x2="500" y2="400" stroke="#0f3a0f" stroke-dasharray="3 3" stroke-width="1"/>
  <text x="40" y="420" fill="#1a6a1a" font-size="11">nilesh@iitm:~$</text>
  <text x="150" y="420" fill="#00cc33" font-size="11">python train.py --model ast --epochs 50</text>
  <rect class="cur" x="362" y="408" width="7" height="13" fill="#00ff41"/>

  <!-- Status line -->
  <text x="40" y="452" fill="#0f3a0f" font-size="10">-- INSERT -- | UTF-8 | Python | github.com/${username}</text>

  <!-- ══ RIGHT PANEL — LIVE STAT CARDS ══ -->

  <!-- Card: Stars -->
  <g class="r4">
    <rect x="535" y="152" width="252" height="72" rx="7" fill="#011501" stroke="#0f3a0f" stroke-width="0.8"/>
    <text x="550" y="172" fill="#1a6a1a" font-size="10" letter-spacing="1">TOTAL STARS</text>
    <text x="550" y="198" fill="#00ff41" font-size="28" font-weight="bold">${stars}</text>
    <rect x="553" y="208" width="220" height="8" rx="3" fill="#0a1f0a"/>
    <rect class="bs" x="553" y="208" height="8" rx="3" fill="url(#barGrad)" clip-path="url(#cbs)"/>
  </g>

  <!-- Card: Forks -->
  <g class="r6">
    <rect x="535" y="236" width="252" height="72" rx="7" fill="#011501" stroke="#0f3a0f" stroke-width="0.8"/>
    <text x="550" y="256" fill="#1a6a1a" font-size="10" letter-spacing="1">TOTAL FORKS</text>
    <text x="550" y="282" fill="#00ff41" font-size="28" font-weight="bold">${forks}</text>
    <rect x="553" y="292" width="220" height="8" rx="3" fill="#0a1f0a"/>
    <rect class="bf" x="553" y="292" height="8" rx="3" fill="url(#barGrad)" clip-path="url(#cbf)"/>
  </g>

  <!-- Card: Followers -->
  <g class="r8">
    <rect x="535" y="320" width="252" height="72" rx="7" fill="#011501" stroke="#0f3a0f" stroke-width="0.8"/>
    <text x="550" y="340" fill="#1a6a1a" font-size="10" letter-spacing="1">FOLLOWERS</text>
    <text x="550" y="366" fill="#00ff41" font-size="28" font-weight="bold">${followers}</text>
    <rect x="553" y="376" width="220" height="8" rx="3" fill="#0a1f0a"/>
    <rect class="bfw" x="553" y="376" height="8" rx="3" fill="url(#barGrad)" clip-path="url(#cbfw)"/>
  </g>

  <!-- Mini stats row -->
  <g class="r10">
    <rect x="535" y="404" width="118" height="56" rx="7" fill="#011501" stroke="#0f3a0f" stroke-width="0.8"/>
    <text x="552" y="422" fill="#1a6a1a" font-size="10" letter-spacing="1">REPOS</text>
    <text x="552" y="448" fill="#00cc33" font-size="22" font-weight="bold">${totalRepos}</text>
  </g>
  <g class="r10">
    <rect x="669" y="404" width="118" height="56" rx="7" fill="#011501" stroke="#0f3a0f" stroke-width="0.8"/>
    <text x="686" y="422" fill="#1a6a1a" font-size="10" letter-spacing="1">RECENT COMMITS</text>
    <text x="686" y="448" fill="#00cc33" font-size="22" font-weight="bold">${recentCommits}</text>
  </g>

</svg>`;
}

function errorSVG(msg) {
  return `<svg viewBox="0 0 820 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="820" height="100" fill="#0d0d0d" rx="8"/>
    <text x="20" y="40" fill="#ff4444" font-family="monospace" font-size="13">ERROR: ${msg}</text>
    <text x="20" y="64" fill="#666" font-family="monospace" font-size="11">Check API rate limits or username</text>
  </svg>`;
}
