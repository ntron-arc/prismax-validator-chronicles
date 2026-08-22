import './style.css'

const checks  = ['Clear camera feed','Task completed','Hand in frame','Cameras in sync']
const ratings = ['Robot control','Movement smoothness','Task speed','Task completion','Camera composition']

const episodes = [
  {title:'Glass vial transfer',brief:'Inspect a delicate transfer sequence. One camera may be degraded.',clues:['Stable overhead view','Intermittent blur detected','Arm remains visible'],pass:[true,true,true,true],ratings:[4,4,3,5,4]},
  {title:'Emergency stop recovery',brief:'Review a factory recovery after an unexpected obstacle.',clues:['Robot stops before target','Task abandoned at 68%','Feeds remain synchronized'],pass:[true,false,true,true],ratings:[3,3,2,2,4]},
  {title:'Packing line sync test',brief:'Verify a high-speed packing run across all viewpoints.',clues:['Clear continuous footage','All boxes placed correctly','Right camera lags by 0.8s'],pass:[true,true,true,false],ratings:[5,5,5,5,4]},
  {title:'Cable routing trial',brief:'Find whether the robot keeps a safe, visible working path.',clues:['Left camera briefly loses arm','Route completed successfully','Clean sync signal'],pass:[true,true,false,true],ratings:[3,2,3,5,3]},
  {title:'Liquid pour precision',brief:'Assess a delicate pouring task. Watch for spillage and arm stability.',clues:['Smooth pour arc detected','No spillage observed','Right camera slightly dark'],pass:[true,true,true,true],ratings:[5,5,4,5,3]},
  {title:'Object stacking sequence',brief:'Verify a multi-block stacking task across all three feeds.',clues:['Blocks placed with precision','High camera shows full stack','Left camera loses top block'],pass:[true,true,false,true],ratings:[4,4,5,4,3]},
  {title:'Drawer open and close',brief:'Simple mechanical task. Check for smooth motion and complete travel.',clues:['Drawer fully extended','Clean return motion','All feeds clear'],pass:[true,true,true,true],ratings:[3,4,3,4,5]},
  {title:'Sorting red and blue',brief:'Robot sorts mixed items into two bins. Check accuracy and speed.',clues:['Two errors in sorting','Task completed at 80%','Feeds synchronized'],pass:[true,false,true,true],ratings:[2,3,2,3,4]},
  {title:'Conveyor handoff',brief:'Robot passes an item to a moving belt. Timing is critical.',clues:['Handoff missed by 2cm','High camera confirms miss','Sync is clean'],pass:[true,false,true,true],ratings:[3,2,2,2,4]},
  {title:'Precision screw drive',brief:'Fine motor task — robot drives a small screw into a fixture.',clues:['Screw fully seated','No drift detected','All cameras sharp'],pass:[true,true,true,true],ratings:[5,5,4,5,5]},
  {title:'Tray assembly run',brief:'Robot assembles a six-part tray from loose components.',clues:['Four of six parts placed','Task timed out','Right camera feed clean'],pass:[true,false,true,true],ratings:[3,2,2,2,4]},
  {title:'Arm calibration check',brief:'Calibration episode. Verify all joints reach target positions.',clues:['Joint 3 undershoot noted','High camera confirms angle','Left camera bright exposure'],pass:[true,true,true,true],ratings:[3,4,3,4,3]},
]

let prismaPoints = Number(localStorage.getItem('pp'))   || 1240
let reputation   = Number(localStorage.getItem('vrs'))  || 500
let currentEpisode
let timerInterval
let timeLeft = 168

function getStreakData() {
  return {
    streak:    Number(localStorage.getItem('streak'))    || 0,
    lastVisit: localStorage.getItem('lastVisit')         || null,
    totalDays: Number(localStorage.getItem('totalDays')) || 0,
  }
}

function saveStreakData(data) {
  localStorage.setItem('streak',    data.streak)
  localStorage.setItem('lastVisit', data.lastVisit)
  localStorage.setItem('totalDays', data.totalDays)
}

function checkAndUpdateStreak() {
  const today     = new Date().toDateString()
  const data      = getStreakData()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (data.lastVisit === today) return { isNew: false, streak: data.streak, bonus: 0 }
  let newStreak = 1
  if (data.lastVisit === yesterday) newStreak = data.streak + 1
  const isSevenDay = newStreak % 7 === 0
  const bonus      = isSevenDay ? 2000 : 10
  const totalDays  = data.totalDays + 1
  prismaPoints += bonus
  localStorage.setItem('pp', prismaPoints)
  saveStreakData({ streak: newStreak, lastVisit: today, totalDays })
  return { isNew: true, streak: newStreak, bonus, isSevenDay }
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2,'0')
  const sec = (s % 60).toString().padStart(2,'0')
  return `${m}:${sec}`
}

function startTimer() {
  clearInterval(timerInterval)
  timeLeft = 168
  const el = document.querySelector('.timer')
  if (el) el.textContent = formatTime(timeLeft)
  timerInterval = setInterval(() => {
    timeLeft--
    if (el) el.textContent = formatTime(timeLeft)
    if (timeLeft <= 30 && el) el.style.color = '#d76542'
    if (timeLeft <= 0) {
      clearInterval(timerInterval)
      if (el) el.textContent = '00:00'
      showToast('Time is up! Submit your review now.')
    }
  }, 1000)
}

function showToast(msg, duration = 3500) {
  const t = document.querySelector('#toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), duration)
}

function showStreakBanner(result) {
  if (!result.isNew) return
  const existing = document.querySelector('.streak-banner')
  if (existing) existing.remove()
  const banner = document.createElement('div')
  banner.className = 'streak-banner'
  if (result.isSevenDay) {
    banner.innerHTML = `<div class="streak-inner seven-day"><div class="streak-flame">🔥</div><div><strong>7-DAY STREAK BONUS!</strong><p>Incredible consistency — you earned <b>+2,000 PP</b></p></div><button class="streak-close" onclick="this.closest('.streak-banner').remove()">✕</button></div>`
  } else {
    banner.innerHTML = `<div class="streak-inner"><div class="streak-flame">${result.streak >= 3 ? '🔥' : '⚡'}</div><div><strong>Day ${result.streak} Streak! +${result.bonus} PP</strong><p>${result.streak < 7 ? `${7 - result.streak} more days to earn the 7-day bonus (+2,000 PP)` : 'Keep the streak alive!'}</p></div><button class="streak-close" onclick="this.closest('.streak-banner').remove()">✕</button></div>`
  }
  document.querySelector('.app-shell').insertBefore(banner, document.querySelector('.status-row'))
  setTimeout(() => banner.classList.add('visible'), 100)
  setTimeout(() => { banner.classList.remove('visible'); setTimeout(() => banner.remove(), 400) }, 5000)
}

function renderStreakWidget() {
  const data = getStreakData()
  const pips = Array.from({length: 7}, (_,i) => `<div class="pip ${i < data.streak % 7 ? 'filled' : ''}"><span>${i + 1}</span></div>`).join('')
  return `<div class="streak-widget"><div class="streak-top"><div><small>CURRENT STREAK</small><strong class="streak-num">${data.streak} <em>days</em></strong><p>${data.streak < 7 ? `${7 - (data.streak % 7)} days to 2,000 PP bonus` : '7-day bonus unlocked!'}</p></div><div><small>TOTAL DAYS</small><strong class="streak-num">${data.totalDays} <em>days</em></strong><p>All-time validated sessions</p></div></div><div class="streak-pips">${pips}</div><div class="streak-rewards"><div class="sr-item ${data.streak >= 3 ? 'done' : ''}"><span>🔥</span><b>Day 3</b><small>+100 PP</small></div><div class="sr-item ${data.streak >= 5 ? 'done' : ''}"><span>⚡</span><b>Day 5</b><small>+500 PP</small></div><div class="sr-item ${data.streak % 7 === 0 && data.streak > 0 ? 'done' : ''}"><span>💎</span><b>Day 7</b><small>+2,000 PP</small></div></div></div>`
}

document.querySelector('#app').innerHTML = `
<main class="app-shell">
  <header class="topbar">
    <a class="brand">Prisma<sup>(X)</sup></a>
    <nav>
      <a class="active" id="station-nav">Validation Station</a>
      <a id="progress-nav">Progress</a>
      <a id="leaderboard-nav">Leaderboard</a>
    </nav>
    <div class="profile">
      <div><b id="vrs">${reputation}</b><small>VRS</small></div>
      <div class="avatar">VA</div>
    </div>
  </header>
  <section class="status-row">
    <div>
      <p class="eyebrow">EPISODE 0178 · TRAINING ARM GOLD</p>
      <h1>Calibrate the future of physical AI.</h1>
    </div>
    <div class="points">
      <span>✦</span>
      <div><small>PRISMA POINTS</small><strong id="points">${prismaPoints.toLocaleString()} PP</strong></div>
    </div>
  </section>
  <section class="mission-card">
    <div><span class="live-dot"></span> LIVE REVIEW SESSION</div>
    <p id="episode-brief">Loading episode...</p>
    <button id="new-episode">New episode</button>
    <span class="timer">02:48</span>
  </section>
  <section class="station">
    <div class="feeds">
      ${['LEFT CAMERA','HIGH CAMERA','RIGHT CAMERA'].map((name,i) => `<article class="feed feed-${i+1}"><div class="feed-top"><span>${name}</span><span>● REC</span></div><div class="robot-scene"></div><div class="feed-bottom"><span>00:14:27</span><button>↗</button></div></article>`).join('')}
    </div>
    <div class="playbar">
      <button id="play">▶</button><span>00:14</span>
      <div class="timeline"><i></i></div>
      <span>00:32</span><button class="speed">1×</button><button>◨</button>
    </div>
  </section>
  <section class="review-grid">
    <article class="review-card">
      <div class="card-heading">
        <div><p class="eyebrow">01 · REQUIRED CHECKS</p><h2>Validation criteria</h2></div>
        <span class="step">4 / 4</span>
      </div>
      <div class="checks">
        ${checks.map(item => `<div class="check"><span>${item}</span><div class="choice"><button class="selected">Pass</button><button>Fail</button></div></div>`).join('')}
      </div>
    </article>
    <article class="review-card">
      <div class="card-heading">
        <div><p class="eyebrow">02 · QUALITY REVIEW</p><h2>Rate this episode</h2></div>
        <span class="step">1 – 5</span>
      </div>
      <div class="ratings">
        ${ratings.map(item => `<div class="rating"><span>${item}</span><div class="dots">${[1,2,3,4,5].map(n => `<button data-rating="${n}">${n}</button>`).join('')}</div></div>`).join('')}
      </div>
    </article>
  </section>
  <section class="submit-row">
    <p>Submit only when your review is complete. The Eval Engine will compare your judgment after submission.</p>
    <button id="submit">Submit validation <span>→</span></button>
  </section>
 <section class="leaderboard-panel">
  <p class="eyebrow">GLOBAL RANKINGS · SEASON 01</p>
  <h1>Top Validators.</h1>
  <div class="lb-table">
    <div class="lb-header">
      <span>RANK</span><span>VALIDATOR</span><span>VRS</span><span>PP</span><span>STREAK</span>
    </div>
    <div id="lb-rows"></div>
  </div>
</section>
<section class="progress-panel">
    <p class="eyebrow">VALIDATOR PROFILE · SEASON 01</p>
    <h1>Your signal is getting clearer.</h1>
    <div class="progress-hero">
      <div>
        <small>CURRENT RANK</small>
        <h2>🌱 Seedling</h2>
        <p><b id="progress-vrs">${reputation}</b> / 600 VRS to Observer</p>
        <div class="meter"><i style="width:${Math.min(100,(reputation/600)*100)}%"></i></div>
      </div>
      <div>
        <small>PRISMA POINTS</small>
        <strong id="progress-pp">${prismaPoints.toLocaleString()} <em>PP</em></strong>
        <p>Accumulated across all sessions.</p>
      </div>
      <div>
        <small>NEXT REWARD</small>
        <strong>2,000 <em>PP</em></strong>
        <p>Unlocks at 7 consecutive days.</p>
      </div>
    </div>
    <div id="streak-container"></div>
    <div class="progress-columns">
      <article>
        <p class="eyebrow">ROBOT ARM TIERS</p>
        <div class="tier unlocked"><span>🏅</span><div><b>Training Arm Gold</b><small>Default · Beginner</small></div><i>Active</i></div>
        <div class="tier"><span>🖤</span><div><b>Training Arm Black</b><small>Unlock at VRS 600</small></div><i>Locked</i></div>
        <div class="tier"><span>⚡</span><div><b>Arena Arm</b><small>Unlock at VRS 750</small></div><i>Locked</i></div>
      </article>
      <article>
        <p class="eyebrow">STORY MODE</p>
        <div class="chapter active-chapter"><span>01</span><div><b>Bootcamp</b><small>Learn the basics of validation</small></div><i>Start →</i></div>
        <div class="chapter"><span>02</span><div><b>The Bad Data Crisis</b><small>Locked</small></div></div>
        <div class="chapter"><span>03</span><div><b>Eval Engine Awakens</b><small>Locked</small></div></div>
      </article>
    </div>
  </section>
  <div class="toast" id="toast"></div>
  <div class="result-backdrop" id="result">
    <section class="result-card">
      <p class="eyebrow">EVAL ENGINE REPORT</p>
      <h2>Validation complete</h2>
      <div class="match"><span id="match">86%</span><small>ACCURACY MATCH</small></div>
      <p id="result-copy">Strong calibration.</p>
      <div class="reward-row">
        <div><small>PRISMA POINTS</small><b id="reward">+160 PP</b></div>
        <div><small>REPUTATION</small><b id="vrs-gain">+12 VRS</b></div>
      </div>
      <button id="share-result">Share on X 𝕏</button>
<button id="continue">Continue to station →</button>
    </section>
  </div>
  <footer class="social-footer">
    <span>FOLLOW THE SIGNAL</span>
    <a href="https://x.com/mister_ntron" target="_blank" rel="noreferrer"><img src="/profiles/ntron.jpeg" alt="N-TRON"><b>N-TRON</b><small>@mister_ntron</small></a>
    <a href="https://x.com/PrismaXai" target="_blank" rel="noreferrer"><img src="/profiles/prismax.jpeg" alt="PrismaX"><b>PrismaX</b><small>@PrismaXai</small></a>
  </footer>
</main>`

function loadEpisode() {
  currentEpisode = episodes[Math.floor(Math.random() * episodes.length)]
  document.querySelector('#episode-brief').textContent = currentEpisode.title + ' — ' + currentEpisode.brief
  document.querySelectorAll('.feed').forEach((feed, i) => {
    feed.dataset.clue = currentEpisode.clues[i]
    feed.classList.toggle('alert', /blur|lags|loses|dark/i.test(currentEpisode.clues[i]))
  })
  document.querySelectorAll('.choice').forEach(g => {
    g.querySelectorAll('button').forEach(b => b.classList.remove('selected'))
    g.querySelector('button').classList.add('selected')
  })
  document.querySelectorAll('.dots button').forEach(b => b.classList.remove('chosen'))
  startTimer()
}

document.querySelectorAll('.robot-scene').forEach((scene, i) => {
  scene.innerHTML = `<video class="camera-video" src="/videos/video-${i+1}.mp4" muted loop playsinline preload="metadata"></video>`
})
document.querySelectorAll('.camera-video').forEach(v => v.play().catch(() => {}))

document.querySelector('#play').onclick = e => {
  const playing = e.target.textContent === '▶'
  document.querySelectorAll('.camera-video').forEach(v => playing ? v.play() : v.pause())
  e.target.textContent = playing ? '⏸' : '▶'
}

document.querySelectorAll('.choice button').forEach(btn => {
  btn.onclick = () => {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('selected'))
    btn.classList.add('selected')
  }
})

document.querySelectorAll('.dots').forEach(group => {
  group.onclick = e => {
    if (!e.target.matches('button')) return
    group.querySelectorAll('button').forEach(b =>
      b.classList.toggle('chosen', +b.dataset.rating <= +e.target.dataset.rating))
  }
})

document.querySelector('#new-episode').onclick = loadEpisode

document.querySelector('#submit').onclick = () => {
  const choices = [...document.querySelectorAll('.choice')].map(g => g.querySelector('.selected').textContent === 'Pass')
  const score = [...document.querySelectorAll('.dots')].map(g => g.querySelectorAll('.chosen').length || 3)
  const wrong       = choices.reduce((n,v,i) => n + (v !== currentEpisode.pass[i]), 0)
  const ratingError = score.reduce((n,v,i) => n + Math.abs(v - currentEpisode.ratings[i]), 0)
  const match       = Math.max(30, 100 - wrong * 14 - ratingError * 3)
  const reward      = match >= 90 ? 700 : match >= 70 ? 160 : 75
  const vrsGain     = match >= 90 ? 12  : match >= 70 ? 6   : 2
  clearInterval(timerInterval)
  document.querySelector('#match').textContent    = `${match}%`
  document.querySelector('#reward').textContent   = `+${reward} PP`
  document.querySelector('#vrs-gain').textContent = `+${vrsGain} VRS`
  document.querySelector('#result-copy').textContent = match >= 90 ? 'Elite calibration. You earned an Eval Engine bonus.' : match >= 70 ? 'Good calibration. Review the visual clues to improve further.' : 'The Eval Engine found important differences. Try another episode.'
  document.querySelector('#result').dataset.reward = reward
  document.querySelector('#result').dataset.vrs    = vrsGain
  document.querySelector('#result').classList.add('show')
}

document.querySelector('#share-result').onclick = () => {
  const match   = document.querySelector('#match').textContent
  const reward  = document.querySelector('#reward').textContent
  const vrsGain = document.querySelector('#vrs-gain').textContent
  const text = `Just validated robot training data on @PrismaXai Validator Chronicles!\n\n🎯 Accuracy: ${match}\n✦ ${reward} Prisma Points\n📈 ${vrsGain} Reputation\n\nValidate for free:\nhttps://prismax-validator-chronicles.vercel.app\n\n@mister_ntron #PrismaX #PhysicalAI`
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
}
document.querySelector('#continue').onclick = () => {
  const result = document.querySelector('#result')
  prismaPoints += Number(result.dataset.reward)
  reputation   += Number(result.dataset.vrs)
  localStorage.setItem('pp',  prismaPoints)
  localStorage.setItem('vrs', reputation)
  document.querySelector('#points').textContent = `${prismaPoints.toLocaleString()} PP`
  document.querySelector('#vrs').textContent    = reputation
  result.classList.remove('show')
  loadEpisode()
  showToast(`✦ +${result.dataset.reward} PP earned · ${result.dataset.vrs} VRS gained`)
}

document.querySelector('#progress-nav').onclick = () => {
  document.querySelector('#app').classList.add('progress-view')
  document.querySelector('#progress-vrs').textContent = reputation
  document.querySelector('#progress-pp').textContent  = prismaPoints.toLocaleString() + ' PP'
  document.querySelector('#streak-container').innerHTML = renderStreakWidget()
  document.querySelector('#progress-nav').classList.add('active')
  document.querySelector('#station-nav').classList.remove('active')
  document.querySelector('.meter i').style.width = Math.min(100,(reputation/600)*100) + '%'
}

document.querySelector('#station-nav').onclick = () => {
  document.querySelector('#app').classList.remove('progress-view')
  document.querySelector('#station-nav').classList.add('active')
  document.querySelector('#progress-nav').classList.remove('active')
}

document.querySelector('.active-chapter i').onclick = () => {
  const briefing = document.createElement('div')
  briefing.className = 'briefing'
  briefing.innerHTML = `<section><p class="eyebrow">CHAPTER 01 · BOOTCAMP</p><h2>Trust begins with attention.</h2><p>Factories are reporting corrupted robot sessions. Your first assignment is to identify a clean pick-and-place episode and calibrate your judgment against the Eval Engine.</p><div><small>MISSION REWARD</small><b>+100 PP · +5 VRS</b></div><button>Begin mission →</button></section>`
  document.body.append(briefing)
  briefing.querySelector('button').onclick = () => { briefing.remove(); document.querySelector('#station-nav').click() }
}

loadEpisode()
const streakResult = checkAndUpdateStreak()
document.querySelector('#points').textContent = `${prismaPoints.toLocaleString()} PP`
setTimeout(() => showStreakBanner(streakResult), 800)
const fakeValidators = [
  {name:'0xNova',vrs:1240,pp:48200,streak:21},
  {name:'RoboSage',vrs:1180,pp:44100,streak:18},
  {name:'DataPulse',vrs:1050,pp:39800,streak:14},
  {name:'SyncZero',vrs:980,pp:35200,streak:12},
  {name:'VaultArm',vrs:910,pp:31000,streak:9},
  {name:'N-TRON',vrs:reputation,pp:prismaPoints,streak:getStreakData().streak},
  {name:'CalibrX',vrs:820,pp:28400,streak:7},
  {name:'EvalBot',vrs:760,pp:24100,streak:5},
  {name:'FrameSync',vrs:700,pp:19800,streak:4},
  {name:'ArmWatch',vrs:640,pp:15200,streak:3},
]

function renderLeaderboard() {
  const sorted = [...fakeValidators].sort((a,b) => b.vrs - a.vrs)
  document.querySelector('#lb-rows').innerHTML = sorted.map((v,i) => `
    <div class="lb-row ${v.name === 'N-TRON' ? 'lb-you' : ''}">
      <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
      <span class="lb-name">${v.name}${v.name === 'N-TRON' ? ' <em>· you</em>' : ''}</span>
      <span>${v.vrs} VRS</span>
      <span>${v.pp.toLocaleString()} PP</span>
      <span>🔥 ${v.streak}d</span>
    </div>`).join('')
}

document.querySelector('#leaderboard-nav').onclick = () => {
  document.querySelector('#app').classList.remove('progress-view')
  document.querySelector('#app').classList.add('leaderboard-view')
  document.querySelector('#leaderboard-nav').classList.add('active')
  document.querySelector('#station-nav').classList.remove('active')
  document.querySelector('#progress-nav').classList.remove('active')
  fakeValidators.find(v => v.name === 'N-TRON').vrs = reputation
  fakeValidators.find(v => v.name === 'N-TRON').pp  = prismaPoints
  fakeValidators.find(v => v.name === 'N-TRON').streak = getStreakData().streak
  renderLeaderboard()
}

document.querySelector('#station-nav').onclick = () => {
  document.querySelector('#app').classList.remove('progress-view','leaderboard-view')
  document.querySelector('#station-nav').classList.add('active')
  document.querySelector('#progress-nav').classList.remove('active')
  document.querySelector('#leaderboard-nav').classList.remove('active')
}