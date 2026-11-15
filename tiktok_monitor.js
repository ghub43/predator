/ 
============================================================
// TIKTOK LIVE MONITOR V4.3 - 
// CREATED BY ESBOL FINAL - HOST + 
// HARI + MODERATOR HISTORY 
// LENGKAP UPDATE: - Tag HOST 
// Otomatis (🎯 HOST) di semua 
// event - Follow State: Berteman 
// / Belum Berteman / Host Sendiri 
// - TOP badge dengan Nomor Urutan 
// (TOP 1, 2, 3, ...) - Nomor Urut 
// History RAPI (1, 2, 3, ... 
// sejajar) - History Tampilkan 
// HARI TANGGAL BULAN TAHUN - Nama 
// File History Format Jelas: 
// YYYY-MM-DD_HH-MM-SS 
// ============================================================
let WebcastPushConnection; try { 
  const mod = 
  require('tiktok-live-connector'); 
  if (mod.WebcastPushConnection) 
  WebcastPushConnection = 
  mod.WebcastPushConnection; else 
  if (mod.default) 
  WebcastPushConnection = 
  mod.default; else 
  WebcastPushConnection = mod;
} catch (e) {
  console.error('❌ Gagal load 
  library. Install ulang: npm 
  install 
  tiktok-live-connector@2.0.0'); 
  process.exit(1);
}
const https = require('https'); 
const readline = 
require('readline'); const fs = 
require('fs'); const path = 
require('path'); const os = 
require('os'); const 
DIAMOND_TO_IDR = 77; const 
DIAMOND_TO_MYR = 0.023; const 
DIAMOND_TO_ILS = 0.019; const 
TIKTOK_FEE_PERCENT = 50; const c = 
{
  r: '\x1b[38;5;196m', g: 
  '\x1b[38;5;46m', y: 
  '\x1b[38;5;226m', b: 
  '\x1b[38;5;45m', cy: 
  '\x1b[38;5;51m', w: 
  '\x1b[38;5;231m', m: 
  '\x1b[38;5;207m', o: 
  '\x1b[38;5;214m', p: 
  '\x1b[38;5;213m', rst: 
  '\x1b[0m', bld: '\x1b[1m', bgR: 
  '\x1b[48;5;52m', bgB: 
  '\x1b[48;5;17m', bgG: 
  '\x1b[48;5;22m', bgY: 
  '\x1b[48;5;58m', bgP: 
  '\x1b[48;5;53m', bgC: 
  '\x1b[48;5;24m', bgW: 
  '\x1b[48;5;235m'
};
const CONFIG = { HISTORY_DIR: 
  path.join(os.homedir(), 
  'tiktok_history'), CSV_DIR: 
  path.join(os.homedir(), 
  'tiktok_csv'), LOG_DIR: 
  path.join(os.homedir(), 
  'tiktok_logs'), 
  ENABLE_AUTO_RECONNECT: true, 
  MAX_RECONNECT_ATTEMPTS: 3, 
  REPORT_KEYWORDS: ['report', 
  'lapor', '!report', '/report', 
  'laporkan', 'spam', 'scam', 
  'penipuan', 'banned', 
  'blockir'], SHOW_PROFILE: 
  process.env.SHOW_PROFILE === 
  'true', AUTO_LANG_STATS: false, 
  AUTO_LANG_CLEAR: false
};
[CONFIG.HISTORY_DIR, 
CONFIG.CSV_DIR, 
CONFIG.LOG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) 
  fs.mkdirSync(dir, { recursive: 
  true });
});
let target = ''; let tiktok = 
null; let stats = { v: 0, l: 0, s: 
0, g: 0, maxViewer: 0, startTime: 
new Date(), roomId: 'Menunggu...', 
_firstGiver: null, 
_firstGiverRecorded: false }; let 
users = {}; let monitoringActive = 
false; let reconnectAttempts = 0; 
let moderators = []; let 
giftDetails = {}; let commentLog = 
[]; let reportHistory = []; let 
followLog = []; let hostUsername = 
''; let liveStartTime = null; let 
liveStartTimeSource = 'Tidak 
diketahui'; let headerInterval = 
null; let shareCount = 0; let 
langStats = {}; let 
userIdToUsernameCache = {}; let 
followerSet = new Set(); let 
userEnterCount = {};
// ✅ Cache follow host
let hostFollowSet = new Set(); 
const rl = 
readline.createInterface({ input: 
process.stdin, output: 
process.stdout });
// ========== HELPER ==========
function formatNumber(num) { 
  return 
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, 
  ".");
}
function formatRupiah(amount) { 
return 'Rp ' + 
formatNumber(Math.round(amount)); 
}
function formatRinggit(amount) { 
return 'RM ' + 
Number(amount).toFixed(2); } 
function formatShekel(amount) { 
return '₪ ' + 
Number(amount).toFixed(2); } 
function showShareInfo(uid) {
  const userShare = users[uid]?.s 
  || 0;
  const totalShare = stats.s || 
  shareCount; 
  console.log(`${c.bld}${c.g}📤 
  SHARE USER: 
  ${c.rst}${c.w}${formatNumber(userShare)} 
  ${c.bld}${c.cy}📤 TOTAL SHARE 
  LIVE: 
  ${c.rst}${c.w}${formatNumber(totalShare)}${c.rst}`);
}
// ✅ Ambil urutan rank user
function getTopRank(uid, category) 
{
  const val = 
  users[uid]?.[category] || 0; if 
  (val <= 0) return 0; const list 
  = Object.entries(users)
    .filter(([_, d]) => 
    (d[category] || 0) > 0) 
    .sort((a, b) => 
    (b[1][category] || 0) - 
    (a[1][category] || 0));
  const idx = list.findIndex(([u, 
  _]) => u === uid); return idx 
  === -1 ? 0 : idx + 1;
}
// ✅ TOP badge dengan nomor 
// urutan
function renderTopBadges(uid, 
line2) {
  const userData = users[uid] || 
  {}; const badges = []; const 
  likes = userData.l || 0; const 
  shares = userData.s || 0; const 
  gifts = userData.g || 0; const 
  giftsRecv = userData.gReceived 
  || 0;
  const comments = userData.c || 
  0; if (likes > 0) {
    const rank = getTopRank(uid, 
    'l'); if (rank > 0) {
      let icon = rank === 1 ? '🥇' 
      : rank === 2 ? '🥈' : rank 
      === 3 ? '🥉' : `#${rank}`; 
      badges.push(`${c.bgR}${c.w}${c.bld} 
      ❤️ ${icon} TOP ${rank} LIKE: 
      ${formatNumber(likes)} 
      ${c.rst}`);
    }
  }
  if (shares > 0) { const rank = 
    getTopRank(uid, 's'); if (rank 
    > 0) {
      let icon = rank === 1 ? '🥇' 
      : rank === 2 ? '🥈' : rank 
      === 3 ? '🥉' : `#${rank}`; 
      badges.push(`${c.bgG}${c.w}${c.bld} 
      📤 ${icon} TOP ${rank} 
      SHARE: 
      ${formatNumber(shares)} 
      ${c.rst}`);
    }
  }
  if (gifts > 0) { const rank = 
    getTopRank(uid, 'g'); if (rank 
    > 0) {
      let icon = rank === 1 ? '🥇' 
      : rank === 2 ? '🥈' : rank 
      === 3 ? '🥉' : `#${rank}`; 
      badges.push(`${c.bgY}${c.w}${c.bld} 
      🏆 ${icon} TOP ${rank} GIFT: 
      ${formatNumber(gifts)} 💎 
      ${c.rst}`);
    }
  }
  if (giftsRecv > 0) { const rank 
    = getTopRank(uid, 
    'gReceived'); if (rank > 0) {
      let icon = rank === 1 ? '🥇' 
      : rank === 2 ? '🥈' : rank 
      === 3 ? '🥉' : `#${rank}`; 
      badges.push(`${c.bgP}${c.w}${c.bld} 
      🎁 ${icon} TOP ${rank} 
      RECIPIENT: 
      ${formatNumber(giftsRecv)} 
      💎 ${c.rst}`);
    }
  }
  if (comments > 0) { const rank = 
    getTopRank(uid, 'c'); if (rank 
    > 0) {
      let icon = rank === 1 ? '🥇' 
      : rank === 2 ? '🥈' : rank 
      === 3 ? '🥉' : `#${rank}`; 
      badges.push(`${c.bgP}${c.w}${c.bld} 
      💬 ${icon} TOP ${rank} 
      KOMENTAR: 
      ${formatNumber(comments)} 
      ${c.rst}`);
    }
  }
  if (badges.length > 0) { 
    console.log(`${line2}`); 
    console.log(`${badges.join(' 
    ')}${c.rst}`); 
    console.log(`${line2}`);
  }
}
// ✅ Tag HOST otomatis + 
// Moderator + Masuk + Follower
function buildBadges(uid, isMod) { 
  const badges = []; const hostUid 
  = hostUsername || target; if 
  (uid === hostUid) {
    badges.push(`${c.bgR}${c.w}${c.bld} 
    🎯 HOST ${c.rst}`);
  }
  if (isMod) { 
    badges.push(`${c.bgY}${c.w}${c.bld} 
    MODERATOR ${c.rst}`);
  }
  const enterCount = 
  userEnterCount[uid] || 1; if 
  (enterCount > 1) {
    badges.push(`${c.bgB}${c.w}${c.bld} 
    🔄 ${enterCount}x MASUK 
    ${c.rst}`);
  }
  if (followerSet.has(uid)) { 
    badges.push(`${c.bgC}${c.w}${c.bld} 
    👥 FOLLOWER BARU ${c.rst}`);
  }
  return badges.length > 0 ? ' ' + 
  badges.join(' ') : '';
}
function getDurationFull() { const 
  start = stats.startTime; if 
  (!start) return '0j 0m 0d'; 
  const diff = new Date() - start; 
  if (isNaN(diff) || diff < 0) 
  return '0j 0m 0d'; const hours = 
  Math.floor(diff / 3600000); 
  const minutes = Math.floor((diff 
  % 3600000) / 60000);
  const seconds = Math.floor((diff 
  % 60000) / 1000);
  return `${hours}j ${minutes}m 
  ${seconds}d`;
}
function getDurationShort() { 
  const start = stats.startTime; 
  if (!start) return '0d'; const 
  diff = new Date() - start; if 
  (isNaN(diff) || diff < 0) return 
  '0d'; const hours = 
  Math.floor(diff / 3600000); 
  const minutes = Math.floor((diff 
  % 3600000) / 60000);
  const seconds = Math.floor((diff 
  % 60000) / 1000);
  if (hours > 0) return `${hours}j 
  ${minutes}m ${seconds}d`; if 
  (minutes > 0) return 
  `${minutes}m ${seconds}d`; 
  return `${seconds}d`;
}
function getFullDate() { const d = 
  new Date(); return {
    jam: 
    d.toLocaleTimeString('id-ID'), 
    hari: 
    d.toLocaleDateString('id-ID', 
    { weekday: 'long' }), tgl: 
    d.getDate(), bln: 
    d.toLocaleDateString('id-ID', 
    { month: 'long' }), thn: 
    d.getFullYear()
  };
}
// ✅ Format timestamp untuk nama 
// file: 2026-09-26_18-35-50
function getTimestampFilename(date 
= null) {
  const d = date || new Date(); 
  const pad = (n) => 
  String(n).padStart(2, '0'); 
  const yyyy = d.getFullYear(); 
  const mm = pad(d.getMonth() + 
  1); const dd = pad(d.getDate()); 
  const hh = pad(d.getHours()); 
  const mi = pad(d.getMinutes()); 
  const ss = pad(d.getSeconds()); 
  return 
  `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}
function extractBrandFromUA(ua) { 
  if (!ua) return null; const 
  lower = ua.toLowerCase(); if 
  (lower.includes('samsung') || 
  lower.includes('sm-')) return 
  'Samsung'; if 
  (lower.includes('iphone') || 
  lower.includes('ipad')) return 
  'Apple'; if 
  (lower.includes('xiaomi') || 
  lower.includes('redmi') || 
  lower.includes('poco')) return 
  'Xiaomi'; if 
  (lower.includes('oppo')) return 
  'Oppo'; if 
  (lower.includes('vivo')) return 
  'Vivo'; if 
  (lower.includes('realme')) 
  return 'Realme'; if 
  (lower.includes('huawei')) 
  return 'Huawei'; if 
  (lower.includes('oneplus')) 
  return 'OnePlus'; if 
  (lower.includes('infinix')) 
  return 'Infinix'; if 
  (lower.includes('tecno')) return 
  'Tecno'; if 
  (lower.includes('windows')) 
  return 'Windows'; if 
  (lower.includes('macintosh') || 
  lower.includes('mac os')) return 
  'Apple'; if 
  (lower.includes('linux')) return 
  'Linux'; return null;
}
function extractModelFromUA(ua) { 
  if (!ua) return null; const 
  match = 
  ua.match(/\(Linux;\s*Android[^;]*;\s*([^)]+)\)/); 
  if (match) return 
  match[1].trim(); if 
  (ua.includes('iPhone')) return 
  'iPhone'; if 
  (ua.includes('iPad')) return 
  'iPad'; return null;
}
function getFollowState(uid, isMod 
= false, hostName = null) {
  const host = hostName || 
  hostUsername || target; if (uid 
  === host) return `🎯 Host 
  Sendiri (${host})`; if (isMod) 
  return `🤝 Berteman dengan Host 
  [MOD]`; if 
  (hostFollowSet.has(uid)) return 
  `🤝 Berteman dengan Host`; 
  return `👤 Belum Berteman`;
}
function 
formatFollowStatus(status, 
hostName = null) {
  if (status === undefined || 
  status === null) return null; 
  const hostLabel = hostName ? ` 
  dengan @${hostName}` : ' dengan 
  Host'; if (status === 0) return 
  `👤 Belum Berteman`; if (status 
  === 1) return `🤝 Berteman 
  dengan Host${hostName ? ` 
  (@${hostName})` : ''}`; if 
  (status === 2) return `🤝 Saling 
  Berteman${hostLabel}`; return 
  null;
}
function isReport(text) { if 
  (!text) return false; const 
  lower = text.toLowerCase(); 
  return 
  CONFIG.REPORT_KEYWORDS.some(kw 
  => lower.includes(kw));
}
function getViolationType(text) { 
  const map = {
    'spam': '🔴 Spam', 'scam': '🔴 
    Penipuan', 'penipuan': '🔴 
    Penipuan', 'banned': '🔴 
    Pemblokiran', 'blockir': '🔴 
    Pemblokiran', 'report': '📢 
    Laporan Umum', 'lapor': '📢 
    Laporan Umum', 'laporkan': '📢 
    Laporan Umum'
  };
  const lower = 
  text.toLowerCase(); for (const 
  [key, val] of 
  Object.entries(map)) if 
  (lower.includes(key)) return 
  val; return '📢 Laporan Umum';
}
function translateText(text) { 
  return new Promise((resolve) => 
  {
    if (!text || text.trim() === 
    '') { resolve(''); return; } 
    const url = 
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`; 
    https.get(url, (res) => {
      let data = ''; 
      res.on('data', chunk => data 
      += chunk); res.on('end', () 
      => {
        try { const result = 
          JSON.parse(data); let 
          translated = ''; if 
          (result && result[0]) 
          for (let i = 0; i < 
          result[0].length; i++) 
          translated += 
          result[0][i][0]; 
          resolve(translated || 
          text);
        } catch (e) { 
        } resolve(text); }
      });
    }).on('error', () => 
    }resolve(text));
  });
}
function detectLanguage(text) { 
  return new Promise((resolve) => 
  {
    if (!text || text.trim() === 
    '') { resolve({ code: 
    'unknown', name: 'Tidak 
    diketahui', flag: '🌐' }); 
    return; } const url = 
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`; 
    https.get(url, (res) => {
      let data = ''; 
      res.on('data', chunk => data 
      += chunk); res.on('end', () 
      => {
        try { const result = 
          JSON.parse(data); const 
          code = result?.[2] || 
          'unknown'; resolve({ 
          code, ...langName(code) 
          });
        } catch (e) { resolve({ 
        } code: 'unknown', name: 
        } 'Tidak diketahui', flag: 
        } '🌐' }); }
      });
    }).on('error', () => resolve({ 
    }code: 'unknown', name: 'Tidak 
    }diketahui', flag: '🌐' }));
  });
}
function langName(code) { const 
  map = {
    'id': { name: 'Indonesia', 
    flag: '🇮🇩' }, 'ms': { name: 
    'Melayu', flag: '🇲🇾' }, 'th': 
    { name: 'Thailand', flag: '🇹🇭' 
    }, 'vi': { name: 'Vietnam', 
    flag: '🇻🇳' }, 'tl': { name: 
    'Filipino', flag: '🇵🇭' }, 
    'km': { name: 'Khmer', flag: 
    '🇰🇭' }, 'lo': { name: 'Laos', 
    flag: '🇱🇦' }, 'my': { name: 
    'Myanmar', flag: '🇲🇲' }, 
    'zh-CN': { name: 'Mandarin', 
    flag: '🇨🇳' }, 'ja': { name: 
    'Jepang', flag: '🇯🇵' }, 'ko': 
    { name: 'Korea', flag: '🇰🇷' }, 
    'mn': { name: 'Mongolia', 
    flag: '🇲🇳' }, 'hi': { name: 
    'Hindi', flag: '🇮🇳' }, 'bn': { 
    name: 'Bengali', flag: '🇧🇩' }, 
    'ur': { name: 'Urdu', flag: 
    '🇵🇰' }, 'ta': { name: 'Tamil', 
    flag: '🇮🇳' }, 'te': { name: 
    'Telugu', flag: '🇮🇳' }, 'ml': 
    { name: 'Malayalam', flag: 
    '🇮🇳' }, 'kn': { name: 
    'Kannada', flag: '🇮🇳' }, 'mr': 
    { name: 'Marathi', flag: '🇮🇳' 
    },
    'gu': { name: 'Gujarati', 
    flag: '🇮🇳' }, 'pa': { name: 
    'Punjabi', flag: '🇮🇳' }, 'or': 
    { name: 'Oriya', flag: '🇮🇳' }, 
    'as': { name: 'Assam', flag: 
    '🇮🇳' }, 'sd': { name: 
    'Sindhi', flag: '🇵🇰' }, 'ne': 
    { name: 'Nepal', flag: '🇳🇵' }, 
    'si': { name: 'Sinhala', flag: 
    '🇱🇰' }, 'ar': { name: 'Arab', 
    flag: '🇸🇦' }, 'fa': { name: 
    'Persia', flag: '🇮🇷' }, 'he': 
    { name: 'Ibrani', flag: '🇮🇱' 
    }, 'tr': { name: 'Turki', 
    flag: '🇹🇷' }, 'ku': { name: 
    'Kurdi', flag: '🏴' }, 'ckb': 
    { name: 'Kurdi Sorani', flag: 
    '🏴' }, 'ps': { name: 
    'Pashto', flag: '🇦🇫' }, 'yi': 
    { name: 'Yiddish', flag: '🇮🇱' 
    },
    'en': { name: 'Inggris', flag: 
    '🇬🇧' }, 'fr': { name: 
    'Prancis', flag: '🇫🇷' }, 'de': 
    { name: 'Jerman', flag: '🇩🇪' 
    }, 'es': { name: 'Spanyol', 
    flag: '🇪🇸' }, 'pt': { name: 
    'Portugis', flag: '🇵🇹' }, 
    'it': { name: 'Italia', flag: 
    '🇮🇹' }, 'nl': { name: 
    'Belanda', flag: '🇳🇱' }, 'ca': 
    { name: 'Katalan', flag: '🏴' 
    },
    'gl': { name: 'Galisia', flag: 
    '🏴' }, 'eu': { name: 
    'Basque', flag: '🏴' }, 'no': 
    { name: 'Norwegia', flag: '🇳🇴' 
    }, 'sv': { name: 'Swedia', 
    flag: '🇸🇪' }, 'da': { name: 
    'Denmark', flag: '🇩🇰' }, 'fi': 
    { name: 'Finlandia', flag: 
    '🇫🇮' }, 'is': { name: 
    'Islandia', flag: '🇮🇸' }, 
    'ru': { name: 'Rusia', flag: 
    '🇷🇺' }, 'uk': { name: 
    'Ukraina', flag: '🇺🇦' }, 'pl': 
    { name: 'Polandia', flag: '🇵🇱' 
    }, 'cs': { name: 'Ceko', flag: 
    '🇨🇿' }, 'sk': { name: 
    'Slovakia', flag: '🇸🇰' }, 
    'hu': { name: 'Hungaria', 
    flag: '🇭🇺' }, 'ro': { name: 
    'Rumania', flag: '🇷🇴' }, 'bg': 
    { name: 'Bulgaria', flag: '🇧🇬' 
    },
    'el': { name: 'Yunani', flag: 
    '🇬🇷' }, 'sr': { name: 
    'Serbia', flag: '🇷🇸' }, 'hr': 
    { name: 'Kroasia', flag: '🇭🇷' 
    }, 'sl': { name: 'Slovenia', 
    flag: '🇸🇮' }, 'lt': { name: 
    'Lithuania', flag: '🇱🇹' }, 
    'lv': { name: 'Latvia', flag: 
    '🇱🇻' }, 'et': { name: 
    'Estonia', flag: '🇪🇪' }, 'sq': 
    { name: 'Albania', flag: '🇦🇱' 
    },
    'mk': { name: 'Makedonia', 
    flag: '🇲🇰' }, 'be': { name: 
    'Belarusia', flag: '🇧🇾' }, 
    'ka': { name: 'Georgia', flag: 
    '🇬🇪' }, 'hy': { name: 
    'Armenia', flag: '🇦🇲' }, 'az': 
    { name: 'Azerbaijan', flag: 
    '🇦🇿' }, 'kk': { name: 
    'Kazakh', flag: '🇰🇿' }, 'uz': 
    { name: 'Uzbek', flag: '🇺🇿' }, 
    'ky': { name: 'Kirgiz', flag: 
    '🇰🇬' }, 'tg': { name: 'Tajik', 
    flag: '🇹🇯' }, 'tk': { name: 
    'Turkmen', flag: '🇹🇲' }, 'sw': 
    { name: 'Swahili', flag: '🇰🇪' 
    }, 'am': { name: 'Amharik', 
    flag: '🇪🇹' }, 'so': { name: 
    'Somali', flag: '🇸🇴' }, 'ha': 
    { name: 'Hausa', flag: '🇳🇬' }, 
    'yo': { name: 'Yoruba', flag: 
    '🇳🇬' }, 'ig': { name: 'Igbo', 
    flag: '🇳🇬' }, 'zu': { name: 
    'Zulu', flag: '🇿🇦' }, 'af': { 
    name: 'Afrikaans', flag: '🇿🇦' 
    },
    'xh': { name: 'Xhosa', flag: 
    '🇿🇦' }, 'st': { name: 'Sotho', 
    flag: '🇱🇸' }, 'mg': { name: 
    'Malagasi', flag: '🇲🇬' }, 
    'ff': { name: 'Fulah', flag: 
    '🌍' }, 'haw': { name: 
    'Hawaii', flag: '🏝️' }, 'mi': { 
    name: 'Maori', flag: '🇳🇿' }, 
    'sm': { name: 'Samoa', flag: 
    '🇼🇸' }, 'to': { name: 'Tonga', 
    flag: '🇹🇴' }, 'fj': { name: 
    'Fiji', flag: '🇫🇯' }, 'eo': { 
    name: 'Esperanto', flag: '🌍' 
    }, 'la': { name: 'Latin', 
    flag: '🏛️' }
  };
  return map[code] || { name: 
  code.toUpperCase(), flag: '🌐' 
  };
}
function addLangStat(code) { 
langStats[code] = (langStats[code] 
|| 0) + 1; }
function getLangStats() { const 
  total = 
  Object.values(langStats).reduce((a, 
  b) => a + b, 0); if (total === 
  0) return []; return 
  Object.entries(langStats)
    .map(([code, count]) => { 
      const info = langName(code); 
      return { code, count, name: 
      info.name, flag: info.flag, 
      percent: ((count / total) * 
      100).toFixed(1) };
    })
    .sort((a, b) => b.count - 
    a.count);
}
function renderLangStats(langs, 
title = '🌐 STATISTIK BAHASA 
KOMENTAR 🌐') {
  const line = 
  `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
  const total = langs.reduce((a, 
  b) => a + b.count, 0); 
  console.log(`\n${c.bgC}${c.w}${c.bld} 
  ${title} ${c.rst}`); 
  console.log(line); 
  console.log(`${c.bld}${c.w} 📊 
  Total Komentar Terdeteksi : 
  ${c.g}${formatNumber(total)}${c.rst}`); 
  console.log(`${c.bld}${c.w} 🌍 
  Total Bahasa Berbeda : 
  ${c.g}${langs.length}${c.rst}`); 
  console.log(`${c.bld}${c.cy}─────────────────────────────────────────────────────────────${c.rst}`); 
  console.log(`${c.bld}${c.w} 
  ${'NO'.padEnd(3)} 
  ${'BENDERA'.padEnd(4)} 
  ${'BAHASA'.padEnd(16)} 
  ${'GRAFIK'.padEnd(22)} 
  ${'PERSEN'.padEnd(7)} 
  JUMLAH${c.rst}`); 
  console.log(`${c.bld}${c.cy}─────────────────────────────────────────────────────────────${c.rst}`); 
  langs.forEach((l, i) => {
    const barLen = 
    Math.round(parseFloat(l.percent) 
    / 5); const bar = 
    '█'.repeat(barLen) + 
    '░'.repeat(20 - barLen); const 
    no = String(i + 1).padStart(2, 
    ' '); const name = 
    l.name.padEnd(15).slice(0, 
    15); const pct = (l.percent + 
    '%').padEnd(6); const count = 
    formatNumber(l.count); 
    console.log(`${c.cy}${no}. 
    ${l.flag} 
    ${c.w}${name}${c.rst} 
    ${c.bld}${c.g}${bar}${c.rst} 
    ${c.y}${pct}${c.rst} 
    ${c.bld}${c.w}${count}${c.rst}`);
  });
  console.log(`${c.bld}${c.cy}─────────────────────────────────────────────────────────────${c.rst}`); 
  console.log(`${c.bld}${c.w} 
  TOTAL${' 
  '.repeat(20)}${c.g}${'█'.repeat(20)}${c.rst} 
  ${c.y}100.0%${c.rst} 
  ${c.bld}${c.w}${formatNumber(total)}${c.rst}`); 
  console.log(`${c.bld}${c.cy}─────────────────────────────────────────────────────────────${c.rst}`);
}
function getDevice(d) { let brand 
  = 'GENERAL', model = 'MOBILE', 
  ua = ''; if (d.device_info) { 
  brand = 
  d.device_info.device_brand || 
  brand; model = 
  d.device_info.device_model || 
  model; } if (d.userDetails) { 
  brand = 
  d.userDetails.deviceBrand || 
  brand; model = 
  d.userDetails.deviceModel || 
  model; } if (d.userAgent) ua = 
  d.userAgent.toLowerCase(); const 
  lb = brand.toLowerCase(), lm = 
  model.toLowerCase(); if 
  (lb.includes('windows') || 
  lb.includes('mac') || 
  lb.includes('linux') ||
      lm.includes('desktop') || 
      lm.includes('laptop') || 
      lm.includes('pc') || 
      ua.includes('windows') || 
      ua.includes('macintosh') || 
      ua.includes('linux')) return 
      '💻 PC/Laptop';
  if (lm.includes('ipad') || 
  lm.includes('tablet') || 
  lb.includes('ipad') ||
      ua.includes('ipad') || 
      ua.includes('tablet')) 
      return '📟 Tablet';
  return '📱 HP';
}
function tryGetStartTime(d) { if 
  (!d) return null; const 
  candidates = [d.startTime, 
  d.createdAt, d.createTime,
    d.roomInfo?.createTime, 
    d.roomInfo?.startTime, 
    d.status?.startTime, 
    d.liveInfo?.startTime];
  for (let val of candidates) { if 
    (val) {
      const date = new Date(val); 
      if (!isNaN(date.getTime())) 
      return date;
    }
  }
  return null;
}
function 
fetchUsernameFromUserId(userId) {
  return new Promise((resolve) => 
  {
    if (!userId) { resolve(null); 
    return; } if 
    (userIdToUsernameCache[userId]) 
    { 
    resolve(userIdToUsernameCache[userId]); 
    return; } const cached = 
    Object.entries(users).find(([_, 
    u]) => String(u.userId) === 
    String(userId)); if (cached) {
      userIdToUsernameCache[userId] 
      = cached[0]; 
      resolve(cached[0]); return;
    }
    const url = 
    `https://www.tiktok.com/api/user/detail/?aid=1988&uniqueId=&userId=${userId}`; 
    const options = {
      headers: { 'User-Agent': 
        'Mozilla/5.0 (Windows NT 
        10.0; Win64; x64) 
        AppleWebKit/537.36 (KHTML, 
        like Gecko) 
        Chrome/120.0.0.0 
        Safari/537.36', 'Accept': 
        'application/json, 
        text/plain, */*', 
        'Accept-Language': 
        'en-US,en;q=0.9', 
        'Referer': 
        'https://www.tiktok.com/'
      }
    };
    const req = https.get(url, 
    options, (res) => {
      let data = ''; 
      res.on('data', chunk => data 
      += chunk); res.on('end', () 
      => {
        try { const json = 
          JSON.parse(data); const 
          uniqueId = 
          json?.userInfo?.user?.uniqueId
            || json?.user?.uniqueId 
            || json?.data?.user?.uniqueId;
          if (uniqueId) { 
            userIdToUsernameCache[userId] 
            = uniqueId; 
            resolve(uniqueId);
          } else {
            resolve(null);
          }
        } catch (e) { 
        } resolve(null); }
      });
    });
    req.on('error', () => 
    resolve(null)); 
    req.setTimeout(5000, () => { 
    req.destroy(); resolve(null); 
    });
  });
}
function updateHeader() { if 
  (!monitoringActive) return; 
  const totalDuration = 
  getDurationShort(); const 
  totalComments = 
  Object.values(users).reduce((a, 
  b) => a + b.c, 0); const 
  totalShares = stats.s || 
  shareCount; const header = 
  `${c.bgB}${c.w}${c.bld} 🎬 
  @${target} ${c.cy}👥${stats.v} 
  ${c.r}❤️${stats.l} 
  ${c.g}📤${totalShares} 
  ${c.y}🎁${stats.g}💎 
  ${c.m}💬${totalComments} 
  ${c.b}🆔${stats.roomId} 
  ${c.g}⏱️${totalDuration} 
  ${c.rst}`; try { 
  process.stdout.write(`\x1b[s\x1b[1;1H\x1b[K${header}\x1b[u`); 
  } catch (e) {}
}
// ========== RENDER BLOCK 
// ==========
async function renderBlock(type, 
d, action, comment = "") {
  const dt = getFullDate(); const 
  uid = d.uniqueId; const userId = 
  d.userId || '?'; const nickname 
  = d.nickname || uid; const isMod 
  = moderators.includes(uid); 
  const hostUid = hostUsername || 
  target; const isHost = uid === 
  hostUid; if (!users[uid]) 
  users[uid] = { l:0, s:0, c:0, 
  g:0, gReceived:0, userId, 
  nickname, followers: 0, 
  following: 0 }; else { 
  users[uid].userId = userId; 
  users[uid].nickname = nickname; 
  if (users[uid].gReceived === 
  undefined) users[uid].gReceived 
  = 0; } if (d.secUid) 
  users[uid].secUid = d.secUid; if 
  (d.userDetails?.secUid) 
  users[uid].secUid = 
  d.userDetails.secUid; if 
  (d.userDetails?.profilePictureUrl 
  || d.profilePictureUrl || 
  d.avatar) { users[uid].avatar = 
    d.userDetails?.profilePictureUrl 
    || d.profilePictureUrl || 
    d.avatar;
  }
  if (d.userDetails?.signature || 
  d.signature || d.bio) {
    users[uid].bio = 
    d.userDetails?.signature || 
    d.signature || d.bio;
  }
  if (d.userDetails?.videoCount || 
  d.videoCount) 
  users[uid].videoCount = 
  d.userDetails?.videoCount || 
  d.videoCount; if 
  (d.userDetails?.heartCount || 
  d.heartCount) 
  users[uid].heartCount = 
  d.userDetails?.heartCount || 
  d.heartCount; if 
  (d.device_info?.device_brand) 
  users[uid].deviceBrand = 
  d.device_info.device_brand; if 
  (d.device_info?.device_model) 
  users[uid].deviceModel = 
  d.device_info.device_model; if 
  (d.userAgent) 
  users[uid].userAgent = 
  d.userAgent; if (d.followInfo) {
    users[uid].followers = 
    d.followInfo.followerCount || 
    0; users[uid].following = 
    d.followInfo.followingCount || 
    0; users[uid].followStatus = 
    d.followInfo.followStatus;
  }
  if (!liveStartTime) { const t = 
  tryGetStartTime(d); if (t) 
  liveStartTime = t; } if 
  (d.roomInfo && 
  d.roomInfo.ownerUniqueId) 
  hostUsername = 
  d.roomInfo.ownerUniqueId; const 
  badges = buildBadges(uid, 
  isMod); const deviceType = 
  getDevice(d); const 
  totalDuration = 
  getDurationFull(); const 
  hostDisplay = hostUsername || 
  target; const line = 
  `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
  const line2 = 
  `${c.bld}${c.cy}─────────────────────────────────────────────────────────────${c.rst}`; 
  console.log(`\n${line}`); let 
  typeLabel = '', typeColor = ''; 
  if (type === 'MASUK') { 
  typeLabel = '🔴 BARU MASUK 
  LIVE'; typeColor = c.bgR + c.w + 
  c.bld; } else if (type === 
  'KOMENTAR') { typeLabel = '💬 
  KOMENTAR'; typeColor = c.bgC + 
  c.w + c.bld; } else if (type === 
  'AKTIVITAS') { typeLabel = '⚡ 
  AKTIVITAS'; typeColor = c.bgY + 
  c.w + c.bld; } 
  console.log(`${typeColor} 
  ${typeLabel} ${c.rst}`); 
  console.log(`${line2}`); 
  console.log(`${c.bld}${c.b}👤 
  HOST:${c.rst} 
  ${c.w}@${hostDisplay} 
  ${c.bld}${c.cy}⏰${c.rst} 
  ${c.w}${dt.jam} 
  ${c.bld}${c.g}⏱️${c.rst} 
  ${c.w}${totalDuration} 
  ${c.bld}${c.y}📅${c.rst} 
  ${c.w}${dt.hari}, ${dt.tgl} 
  ${dt.bln} ${dt.thn}${c.rst}`); 
  console.log(`${line2}`); 
  console.log(`${c.bld}${c.y}👤 
  NAME : 
  ${c.rst}${c.w}${nickname}${badges}${c.rst}`); 
  console.log(`${c.bld}${c.cy}🔖 
  USERNAME : 
  ${c.rst}${c.w}@${uid}${c.rst}`); 
  console.log(`${c.bld}${c.m}🆔 
  USER ID : 
  ${c.rst}${c.w}${userId}${c.rst}`); 
  console.log(`${c.bld}${c.g}🔗 
  URL : 
  ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`);
  
  const followerCount = 
  d.followInfo?.followerCount || 
  0; const followingCount = 
  d.followInfo?.followingCount || 
  0; console.log(`${c.bld}${c.o}👥 
  FOLLOWERS : 
  ${c.rst}${c.w}${formatNumber(followerCount)}${c.rst}`); 
  console.log(`${c.bld}${c.cy}👥 
  FOLLOWING : 
  ${c.rst}${c.w}${formatNumber(followingCount)}${c.rst}`);
  
  let followStatusText = null; if 
  (d.followInfo?.followStatus !== 
  undefined && 
  d.followInfo?.followStatus !== 
  null) {
    followStatusText = 
    formatFollowStatus(d.followInfo.followStatus, 
    hostUsername || target);
  }
  if (!followStatusText) { 
    followStatusText = 
    getFollowState(uid, isMod, 
    hostUsername || target);
  }
  console.log(`${c.bld}${c.g}📊 
  FOLLOW STAT: 
  ${c.rst}${c.w}${followStatusText}${c.rst}`);
  
  const bio = 
  d.userDetails?.signature || 
  d.signature || d.bio; if (bio && 
  bio.trim() !== '') {
    console.log(`${c.bld}${c.m}📝 
    BIO : 
    ${c.rst}${c.w}"${bio}"${c.rst}`);
  } else {
    console.log(`${c.bld}${c.m}📝 
    BIO : ${c.rst}${c.y}(tidak ada 
    bio)${c.rst}`);
  }
  
  const videoCount = 
  d.userDetails?.videoCount || 
  d.videoCount; const heartCount = 
  d.userDetails?.heartCount || 
  d.heartCount; if (videoCount !== 
  undefined && videoCount !== 
  null) {
    console.log(`${c.bld}${c.cy}🎬 
    TOTAL VIDEO: 
    ${c.rst}${c.w}${formatNumber(videoCount)}${c.rst}`);
  }
  if (heartCount !== undefined && 
  heartCount !== null) {
    console.log(`${c.bld}${c.r}❤️ 
    TOTAL LIKES: 
    ${c.rst}${c.w}${formatNumber(heartCount)}${c.rst}`);
  }
  
  const rawBrand = 
  d.device_info?.device_brand || 
  d.userDetails?.deviceBrand || 
  d.user?.deviceBrand || 
  d.deviceBrand; const rawModel = 
  d.device_info?.device_model || 
  d.userDetails?.deviceModel || 
  d.user?.deviceModel || 
  d.deviceModel; const rawUA = 
  d.userAgent || 
  d.userAgentString;
  
  let deviceBrand = rawBrand || 
  (rawUA ? 
  extractBrandFromUA(rawUA) : 
  null); let deviceModel = 
  rawModel || (rawUA ? 
  extractModelFromUA(rawUA) : 
  null);
  
  const isBrandValid = deviceBrand 
  && deviceBrand.trim() !== '' && 
  deviceBrand !== 'Tidak 
  diketahui' && deviceBrand !== 
  'GENERAL'; const isModelValid = 
  deviceModel && 
  deviceModel.trim() !== '' && 
  deviceModel !== 'Tidak 
  diketahui' && deviceModel !== 
  'MOBILE'; const isUAValid = 
  rawUA && rawUA.trim() !== '' && 
  rawUA !== 'Tidak diketahui';
  
  console.log(`${c.bld}${c.w}📱 
  PERANGKAT : 
  ${c.rst}${c.w}${deviceType}${c.rst}`); 
  if (isBrandValid) 
  console.log(`${c.bld}${c.cy} ├─ 
  BRAND : 
  ${c.rst}${c.w}${deviceBrand}${c.rst}`); 
  if (isModelValid) 
  console.log(`${c.bld}${c.cy} ├─ 
  MODEL : 
  ${c.rst}${c.w}${deviceModel}${c.rst}`); 
  if (isUAValid) 
  console.log(`${c.bld}${c.cy} └─ 
  UA : 
  ${c.rst}${c.w}${rawUA.substring(0, 
  80)}${c.rst}`); 
  renderTopBadges(uid, line2); 
  const totalGiftUser = 
  users[uid]?.g || 0; if 
  (totalGiftUser > 0) {
    const giftRp = totalGiftUser * 
    DIAMOND_TO_IDR; const giftMyr 
    = totalGiftUser * 
    DIAMOND_TO_MYR; const giftIls 
    = totalGiftUser * 
    DIAMOND_TO_ILS; 
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.bgP}${c.w}🎁 
    TOTAL GIFT DIKIRIM: 
    ${c.rst}${c.w}${formatNumber(totalGiftUser)} 
    💎 = 
    ${c.g}${formatRupiah(giftRp)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(giftMyr)} 
    ${c.w}/ 
    ${c.g}${formatShekel(giftIls)}${c.rst}`);
  }
  if (type === 'AKTIVITAS' && 
  action.includes('GIVE') && 
  !stats._firstGiverRecorded) {
    const match = 
    action.match(/GIVE: (.+) 
    x(\d+) \((\d+)/); if (match) {
      stats._firstGiver = { 
      username: uid, nickname, 
      time: dt.jam, amount: 
      parseInt(match[3]), 
      giftName: match[1] }; 
      stats._firstGiverRecorded = 
      true; 
      console.log(`${c.bgY}${c.w}${c.bld} 
      🏆 FIRST GIVER: @${uid} 
      (${nickname}) - ${match[1]} 
      x${match[2]} (${match[3]} 
      💎) pada ${dt.jam} 
      ${c.rst}`);
    }
  }
  if (type === 'KOMENTAR') { const 
    translated = await 
    translateText(comment); const 
    lang = await 
    detectLanguage(comment); 
    addLangStat(lang.code); 
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.r}💬 
    ${c.rst}${c.w}${comment}`); if 
    (translated && translated !== 
    comment) {
      console.log(`${c.bld}${c.g}🌐 
      ${c.rst}${c.w}${translated}`);
    }
    console.log(`${c.bld}${c.b}🌐 
    Bahasa: ${c.rst}${lang.flag} 
    ${c.w}${lang.name}${c.rst}`); 
    console.log(`${c.bld}${c.y}📊 
    ${c.rst}${c.w}Total Komentar: 
    ${formatNumber(users[uid].c)}`); 
    console.log(`${c.bld}${c.r}❤️ 
    ${c.rst}${c.w}Total Like: 
    ${formatNumber(users[uid].l)}`); 
    if (isReport(comment)) {
      const violationType = 
      getViolationType(comment); 
      reportHistory.push({
        waktu: `${dt.hari}, 
        ${dt.tgl} ${dt.bln} 
        ${dt.thn} ${dt.jam}`, 
        pelapor: uid, nickname, 
        userId, isModerator: 
        isMod, isHost, komentar: 
        comment, terjemahan: 
        (translated && translated 
        !== comment) ? translated 
        : null,
        bahasa: lang.name, 
        jenisPelanggaran: 
        violationType
      });
      console.log(`${c.bgR}${c.w}${c.bld} 
      🚨 LAPORAN TERDETEKSI DARI 
      @${uid} ${c.rst}`); 
      console.log(`${c.r}📝 
      ${comment}${c.rst}`); 
      console.log(`${c.y}⚖️ Jenis: 
      ${violationType}${c.rst}`);
    }
    commentLog.push({ waktu: 
      `${dt.hari}, ${dt.tgl} 
      ${dt.bln} ${dt.thn} 
      ${dt.jam}`, username: uid, 
      nickname, userId, komentar: 
      comment, terjemahan: 
      (translated && translated 
      !== comment) ? translated : 
      null, bahasa: lang.name, 
      bahasaFlag: lang.flag, 
      isModerator: isMod, isHost
    });
    console.log(`${line2}`); 
    showShareInfo(uid);
  } else if (type === 'AKTIVITAS' 
  } && action.includes('GIVE')) {
    const match = 
    action.match(/GIVE: (.+) 
    x(\d+) \((\d+)/); let name = 
    match?.[1] || '?', count = 
    parseInt(match?.[2]||1), dia = 
    parseInt(match?.[3]||0); const 
    giftRp = dia * DIAMOND_TO_IDR; 
    const giftMyr = dia * 
    DIAMOND_TO_MYR; const giftIls 
    = dia * DIAMOND_TO_ILS; const 
    totalGift = users[uid].g; let 
    recipientRaw = 
    d.giftReceiverId || d.toUserId 
    || d.receiverUserId;
    let recipientUsername = null; 
    let isNumericId = false; if 
    (recipientRaw) {
      isNumericId = 
      /^\d+$/.test(String(recipientRaw)); 
      if (isNumericId) {
        recipientUsername = 
        userIdToUsernameCache[recipientRaw] 
        || null;
        if (!recipientUsername) { 
          const found = 
          Object.entries(users).find(([_, 
          u]) => String(u.userId) 
          === 
          String(recipientRaw)); 
          if (found) { 
          recipientUsername = 
          found[0]; 
          userIdToUsernameCache[recipientRaw] 
          = found[0]; }
        }
      } else {
        recipientUsername = 
        recipientRaw;
      }
    }
    const hostKey = hostUsername 
    || target;
    if (!recipientUsername && 
    !recipientRaw) {
      recipientUsername = hostKey;
    }
    const hostUser = 
    users[hostKey]; const 
    isHostRecipient = 
    recipientUsername === hostKey
      || (isNumericId && hostUser 
      || && 
      || String(hostUser.userId) 
      || === 
      || String(recipientRaw));
    let displayRecipient; if 
    (isHostRecipient) {
      displayRecipient = hostKey;
    } else if (recipientUsername) 
    } {
      displayRecipient = 
      recipientUsername;
    } else {
      displayRecipient = 
      `UID:${recipientRaw}`;
    }
    const roleTag = 
    isHostRecipient
      ? `${c.bgY}${c.w}${c.bld} 
      HOST ${c.rst}`
      : `${c.bgC}${c.w}${c.bld} 
      : CO-HOST ${c.rst}`;
    const recipientNickname = 
    users[displayRecipient]?.nickname 
    || displayRecipient;
    const recipientTotalGift = 
    users[displayRecipient]?.gReceived 
    || 0;
    const recipientRp = 
    recipientTotalGift * 
    DIAMOND_TO_IDR; const 
    recipientMyr = 
    recipientTotalGift * 
    DIAMOND_TO_MYR; const 
    recipientIls = 
    recipientTotalGift * 
    DIAMOND_TO_ILS; const 
    recipientFee = 
    recipientTotalGift * 
    (TIKTOK_FEE_PERCENT / 100); 
    const recipientFeeRp = 
    recipientFee * DIAMOND_TO_IDR; 
    const recipientFeeMyr = 
    recipientFee * DIAMOND_TO_MYR; 
    const recipientFeeIls = 
    recipientFee * DIAMOND_TO_ILS; 
    const recipientNet = 
    recipientTotalGift - 
    recipientFee; const 
    recipientNetRp = recipientNet 
    * DIAMOND_TO_IDR; const 
    recipientNetMyr = recipientNet 
    * DIAMOND_TO_MYR; const 
    recipientNetIls = recipientNet 
    * DIAMOND_TO_ILS; 
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.bgP}${c.w}🎁 
    ${name} x${count} (${dia} 💎) 
    ${c.rst}`); 
    console.log(`${c.bld}${c.y}👤 
    PEMBERI GIFT: 
    ${c.rst}${c.w}@${uid} 
    (${nickname})${badges}${c.rst}`); 
    console.log(`${c.bld}${c.g}🎯 
    PENERIMA GIFT: 
    ${c.rst}${c.w}@${displayRecipient} 
    (${recipientNickname}) 
    ${roleTag}${c.rst}`); 
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.bgG}${c.w}💎 
    TOTAL DITERIMA 
    ${displayRecipient.toUpperCase()}: 
    ${c.rst}${c.w}${formatNumber(recipientTotalGift)} 
    💎${c.rst}`); 
    console.log(`${c.bld}${c.g} 💰 
    ${formatRupiah(recipientRp)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(recipientMyr)} 
    ${c.w}/ 
    ${c.g}${formatShekel(recipientIls)}${c.rst}`); 
    console.log(`${c.bld}${c.r} 💸 
    POTONGAN TIKTOK: 
    ${c.rst}${c.w}${formatNumber(recipientFee)} 
    💎${c.rst}`); 
    console.log(`${c.bld}${c.r} 💸 
    ${formatRupiah(recipientFeeRp)} 
    ${c.w}/ 
    ${c.r}${formatRinggit(recipientFeeMyr)} 
    ${c.w}/ 
    ${c.r}${formatShekel(recipientFeeIls)}${c.rst}`); 
    console.log(`${c.bld}${c.bgG}${c.w} 
    ✅ BERSIH DITERIMA: 
    ${c.rst}${c.w}${formatNumber(recipientNet)} 
    💎${c.rst}`); 
    console.log(`${c.bld}${c.g} ✅ 
    ${formatRupiah(recipientNetRp)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(recipientNetMyr)} 
    ${c.w}/ 
    ${c.g}${formatShekel(recipientNetIls)}${c.rst}`); 
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.y}💰 
    Total Gift dari @${uid}: 
    ${formatNumber(totalGift)} 💎 
    = 
    ${c.g}${formatRupiah(totalGift*DIAMOND_TO_IDR)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(totalGift*DIAMOND_TO_MYR)} 
    ${c.w}/ 
    ${c.g}${formatShekel(totalGift*DIAMOND_TO_ILS)}`); 
    console.log(`${c.bld}${c.o}💎 
    ${c.rst}${c.w}Harga Gift ini: 
    ${dia} 💎 = 
    ${c.g}${formatRupiah(giftRp)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(giftMyr)} 
    ${c.w}/ 
    ${c.g}${formatShekel(giftIls)}`); 
    console.log(`${line2}`); 
    showShareInfo(uid); if 
    (isNumericId && 
    !recipientUsername) {
      fetchUsernameFromUserId(recipientRaw).then(uname 
      => {
        if (uname) { 
          console.log(`${c.b}🔎 
          Username penerima 
          ditemukan: @${uname} 
          (UID 
          ${recipientRaw})${c.rst}`);
        }
      });
    }
  } else if (type === 'AKTIVITAS' 
  } && action.includes('SHARE')) {
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.g}📤 
    ${c.rst}${c.w}SHARE / BAGIKAN 
    LIVE`); 
    console.log(`${c.bld}${c.y}👤 
    ${c.rst}${c.w}${nickname}${badges}`); 
    console.log(`${c.bld}${c.cy}📊 
    ${c.rst}${c.w}Total Share: 
    ${formatNumber(users[uid].s)}`); 
    console.log(`${c.bld}${c.r}❤️ 
    ${c.rst}${c.w}Total Like: 
    ${formatNumber(users[uid].l)}`); 
    console.log(`${c.bld}${c.y}🎁 
    ${c.rst}${c.w}Total Gift: 
    ${formatNumber(users[uid].g)} 
    💎`); console.log(`${line2}`); 
    showShareInfo(uid);
  } else {
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.b}🎬 
    ${c.rst}${c.w}${action}`); 
    console.log(`${c.bld}${c.r}❤️ 
    ${c.rst}${c.w}Like: 
    ${formatNumber(users[uid].l)}`); 
    console.log(`${c.bld}${c.cy}📤 
    ${c.rst}${c.w}Share: 
    ${formatNumber(users[uid].s)}`); 
    console.log(`${c.bld}${c.y}🎁 
    ${c.rst}${c.w}Gift: 
    ${formatNumber(users[uid].g)} 
    💎`); console.log(`${line2}`); 
    showShareInfo(uid);
  }
  console.log(`${line}`); 
  updateHeader();
}
// ========== SAVE HISTORY 
// ==========
function saveCommentHistory() { if 
  (commentLog.length === 0) 
  return; try {
    const timestamp = 
    getTimestampFilename(stats.startTime); 
    const dt = getFullDate(); 
    const filePath = 
    path.join(CONFIG.HISTORY_DIR, 
    `comments_@${target}_${timestamp}.json`); 
    fs.writeFileSync(filePath, 
    JSON.stringify({
      metadata: { target, roomId: 
        stats.roomId, startTime: 
        stats.startTime.toISOString(), 
        endTime: new 
        Date().toISOString(), 
        hari: dt.hari, tgl: 
        dt.tgl, bln: dt.bln, thn: 
        dt.thn, tanggalFull: 
        `${dt.hari}, ${dt.tgl} 
        ${dt.bln} ${dt.thn}`, jam: 
        dt.jam, totalComments: 
        commentLog.length, 
        totalShare: stats.s || 
        shareCount, moderators, 
        hostUsername, langStats, 
        followerSet: 
        [...followerSet], 
        hostFollowSet: 
        [...hostFollowSet], 
        userEnterCount
      },
      comments: commentLog
    }, null, 2));
  } catch (e) {}
}
function saveViewerHistory() { if 
  (Object.keys(users).length === 
  0) return; try {
    const timestamp = 
    getTimestampFilename(stats.startTime); 
    const dt = getFullDate(); 
    const viewers = 
    Object.entries(users).map(([uid, 
    data]) => ({
      username: uid, nickname: 
      data.nickname, userId: 
      data.userId, secUid: 
      data.secUid || null, avatar: 
      data.avatar || null, bio: 
      data.bio || null, 
      videoCount: data.videoCount 
      || 0,
      heartCount: data.heartCount 
      || 0,
      deviceBrand: 
      data.deviceBrand || null, 
      deviceModel: 
      data.deviceModel || null, 
      userAgent: data.userAgent || 
      null, linkAkun: 
      `https://tiktok.com/@${uid}`, 
      isHost: uid === 
      (hostUsername || target), 
      isModerator: 
      moderators.includes(uid), 
      isFollower: 
      followerSet.has(uid), 
      isHostFriend: 
      hostFollowSet.has(uid), 
      followStateText: 
      getFollowState(uid, 
      moderators.includes(uid), 
      hostUsername || target), 
      enterCount: 
      userEnterCount[uid] || 1, 
      followers: data.followers || 
      0, following: data.following 
      || 0,
      totalLike: data.l, 
      totalShare: data.s, 
      totalComment: data.c, 
      totalGiftDiamond: data.g, 
      totalGiftReceived: 
      data.gReceived || 0, 
      totalGiftRupiah: data.g * 
      DIAMOND_TO_IDR, 
      totalGiftRinggit: data.g * 
      DIAMOND_TO_MYR, 
      totalGiftShekel: data.g * 
      DIAMOND_TO_ILS, detailGift: 
      giftDetails[uid] || {}
    }));
    const topGiversAsc = 
    Object.entries(users).filter(([_, 
    d]) => d.g > 0).sort((a, b) => 
    a[1].g - b[1].g).map(([uid, 
    d]) => ({
      username: uid, nickname: 
      d.nickname, isModerator: 
      moderators.includes(uid), 
      isHost: uid === 
      (hostUsername || target), 
      followers: d.followers || 0, 
      following: d.following || 0, 
      totalGiftDiamond: d.g, 
      totalGiftRupiah: d.g * 
      DIAMOND_TO_IDR, 
      totalGiftRinggit: d.g * 
      DIAMOND_TO_MYR, 
      totalGiftShekel: d.g * 
      DIAMOND_TO_ILS
    }));
    const topGiversDesc = 
    [...topGiversAsc].reverse(); 
    const giftRecipients = 
    Object.entries(users).filter(([_, 
    d]) => (d.gReceived || 0) > 
    0).sort((a, b) => 
    (b[1].gReceived || 0) - 
    (a[1].gReceived || 
    0)).map(([uid, d]) => {
      const giftVal = d.gReceived 
      || 0;
      const fee = giftVal * 
      (TIKTOK_FEE_PERCENT / 100); 
      const net = giftVal - fee; 
      return {
        username: uid, nickname: 
        d.nickname, isModerator: 
        moderators.includes(uid), 
        followers: d.followers || 
        0, following: d.following 
        || 0,
        totalGiftDiamond: giftVal, 
        totalGiftRupiah: giftVal * 
        DIAMOND_TO_IDR, 
        totalGiftRinggit: giftVal 
        * DIAMOND_TO_MYR, 
        totalGiftShekel: giftVal * 
        DIAMOND_TO_ILS, 
        feeDiamond: fee, 
        feeRupiah: fee * 
        DIAMOND_TO_IDR, 
        feeRinggit: fee * 
        DIAMOND_TO_MYR, feeShekel: 
        fee * DIAMOND_TO_ILS, 
        netDiamond: net, 
        netRupiah: net * 
        DIAMOND_TO_IDR, 
        netRinggit: net * 
        DIAMOND_TO_MYR, netShekel: 
        net * DIAMOND_TO_ILS, 
        role: uid === 
        (hostUsername || target) ? 
        'HOST' : 'CO-HOST'
      };
    });
    const validLiveStart = 
    (liveStartTime instanceof Date 
    && 
    !isNaN(liveStartTime.getTime())) 
    ? liveStartTime : 
    stats.startTime; 
    fs.writeFileSync(path.join(CONFIG.HISTORY_DIR, 
    `viewers_@${target}_${timestamp}.json`), 
    JSON.stringify({
      metadata: { target, roomId: 
        stats.roomId, duration: 
        getDurationShort(), hari: 
        dt.hari, tgl: dt.tgl, bln: 
        dt.bln, thn: dt.thn, 
        tanggalFull: `${dt.hari}, 
        ${dt.tgl} ${dt.bln} 
        ${dt.thn}`, jam: dt.jam, 
        totalLike: stats.l, 
        totalShare: stats.s || 
        shareCount, totalComments: 
        Object.values(users).reduce((a,b) 
        => a + b.c, 0), 
        totalUsers: 
        Object.keys(users).length, 
        totalGiftDiamond: stats.g, 
        totalGiftRupiah: stats.g * 
        DIAMOND_TO_IDR, 
        totalGiftRinggit: stats.g 
        * DIAMOND_TO_MYR, 
        totalGiftShekel: stats.g * 
        DIAMOND_TO_ILS, maxViewer: 
        stats.maxViewer, 
        moderators, hostUsername: 
        hostUsername || target, 
        liveStartTime: 
        validLiveStart.toISOString(), 
        liveStartTimeSource, 
        firstGiver: 
        stats._firstGiver || null, 
        langStats, totalFollows: 
        followLog.length, 
        totalTopGivers: 
        topGiversAsc.length, 
        topGiversAsc, 
        topGiversDesc, 
        totalGiftRecipients: 
        giftRecipients.length, 
        giftRecipients, 
        followerSet: 
        [...followerSet], 
        hostFollowSet: 
        [...hostFollowSet], 
        userEnterCount
      },
      viewers
    }, null, 2));
  } catch (e) {}
}
function saveReportHistory() { if 
  (reportHistory.length === 0) 
  return; try {
    const timestamp = 
    getTimestampFilename(stats.startTime); 
    const dt = getFullDate(); 
    const filePath = 
    path.join(CONFIG.HISTORY_DIR, 
    `reports_@${target}_${timestamp}.json`); 
    fs.writeFileSync(filePath, 
    JSON.stringify({
      metadata: { target, roomId: 
        stats.roomId, startTime: 
        stats.startTime.toISOString(), 
        endTime: new 
        Date().toISOString(), 
        hari: dt.hari, tgl: 
        dt.tgl, bln: dt.bln, thn: 
        dt.thn, tanggalFull: 
        `${dt.hari}, ${dt.tgl} 
        ${dt.bln} ${dt.thn}`, jam: 
        dt.jam, totalReports: 
        reportHistory.length, 
        moderators, hostUsername
      },
      reports: reportHistory
    }, null, 2));
  } catch (e) {}
}
function saveModeratorHistory() { 
  if (moderators.length === 0) 
  return; try {
    const timestamp = 
    getTimestampFilename(stats.startTime); 
    const filePath = 
    path.join(CONFIG.HISTORY_DIR, 
    `moderators_@${target}_${timestamp}.json`); 
    const moderatorsData = 
    moderators.map(m => {
      const u = users[m] || {}; 
      return {
        username: m, nickname: 
        u.nickname || m, userId: 
        u.userId || null, secUid: 
        u.secUid || null, link: 
        `https://tiktok.com/@${m}`, 
        followers: u.followers || 
        0, following: u.following 
        || 0,
        followStatus: 
        u.followStatus, bio: u.bio 
        || null,
        deviceBrand: u.deviceBrand 
        || null,
        deviceModel: u.deviceModel 
        || null,
        userAgent: u.userAgent || 
        null, avatar: u.avatar || 
        null, totalLike: u.l || 0, 
        totalComment: u.c || 0, 
        totalShare: u.s || 0, 
        totalGiftDiamond: u.g || 
        0, totalGiftRupiah: (u.g 
        || 0) * DIAMOND_TO_IDR,
        totalGiftRinggit: (u.g || 
        0) * DIAMOND_TO_MYR, 
        totalGiftShekel: (u.g || 
        0) * DIAMOND_TO_ILS, 
        enterCount: 
        userEnterCount[m] || 1, 
        isFollower: 
        followerSet.has(m), 
        isHostFriend: true
      };
    });
    
    const dt = getFullDate();
    
    fs.writeFileSync(filePath, 
    JSON.stringify({
      metadata: { target, roomId: 
        stats.roomId, startTime: 
        stats.startTime.toISOString(), 
        endTime: new 
        Date().toISOString(), 
        duration: 
        getDurationShort(), hari: 
        dt.hari, tgl: dt.tgl, bln: 
        dt.bln, thn: dt.thn, 
        tanggalFull: `${dt.hari}, 
        ${dt.tgl} ${dt.bln} 
        ${dt.thn}`, jam: dt.jam, 
        totalModerators: 
        moderators.length, 
        hostUsername
      },
      moderators: moderatorsData
    }, null, 2));
  } catch (e) {}
}
function saveFollowHistory() { if 
  (followLog.length === 0) return; 
  try {
    const timestamp = 
    getTimestampFilename(stats.startTime); 
    const dt = getFullDate(); 
    const filePath = 
    path.join(CONFIG.HISTORY_DIR, 
    `follows_@${target}_${timestamp}.json`); 
    fs.writeFileSync(filePath, 
    JSON.stringify({
      metadata: { target, roomId: 
        stats.roomId, startTime: 
        stats.startTime.toISOString(), 
        endTime: new 
        Date().toISOString(), 
        hari: dt.hari, tgl: 
        dt.tgl, bln: dt.bln, thn: 
        dt.thn, tanggalFull: 
        `${dt.hari}, ${dt.tgl} 
        ${dt.bln} ${dt.thn}`, jam: 
        dt.jam, totalFollows: 
        followLog.length, 
        totalShare: stats.s || 
        shareCount, hostUsername
      },
      follows: followLog
    }, null, 2));
  } catch (e) {}
}
function saveLiveResult() { try { 
    const dt = getFullDate(); 
    const totalUsers = 
    Object.keys(users).length; let 
    totalComments = 0; for (let u 
    in users) totalComments += 
    users[u].c; const topGiversAsc 
    = 
    Object.entries(users).filter(([_, 
    d]) => d.g > 0).sort((a, b) => 
    a[1].g - b[1].g).map(([uid, 
    d]) => ({
      username: uid, nickname: 
      d.nickname, isModerator: 
      moderators.includes(uid), 
      isHost: uid === 
      (hostUsername || target), 
      followers: d.followers || 0, 
      following: d.following || 0, 
      totalGiftDiamond: d.g, 
      totalGiftRupiah: d.g * 
      DIAMOND_TO_IDR, 
      totalGiftRinggit: d.g * 
      DIAMOND_TO_MYR, 
      totalGiftShekel: d.g * 
      DIAMOND_TO_ILS
    }));
    const topGiversDesc = 
    [...topGiversAsc].reverse(); 
    const giftRecipients = 
    Object.entries(users).filter(([_, 
    d]) => (d.gReceived || 0) > 
    0).sort((a, b) => 
    (b[1].gReceived || 0) - 
    (a[1].gReceived || 
    0)).map(([uid, d]) => {
      const giftVal = d.gReceived 
      || 0;
      const fee = giftVal * 
      (TIKTOK_FEE_PERCENT / 100); 
      const net = giftVal - fee; 
      return {
        username: uid, nickname: 
        d.nickname, isModerator: 
        moderators.includes(uid), 
        followers: d.followers || 
        0, following: d.following 
        || 0,
        totalGiftDiamond: giftVal, 
        totalGiftRupiah: giftVal * 
        DIAMOND_TO_IDR, 
        totalGiftRinggit: giftVal 
        * DIAMOND_TO_MYR, 
        totalGiftShekel: giftVal * 
        DIAMOND_TO_ILS, 
        feeDiamond: fee, 
        feeRupiah: fee * 
        DIAMOND_TO_IDR, 
        feeRinggit: fee * 
        DIAMOND_TO_MYR, feeShekel: 
        fee * DIAMOND_TO_ILS, 
        netDiamond: net, 
        netRupiah: net * 
        DIAMOND_TO_IDR, 
        netRinggit: net * 
        DIAMOND_TO_MYR, netShekel: 
        net * DIAMOND_TO_ILS, 
        role: uid === 
        (hostUsername || target) ? 
        'HOST' : 'CO-HOST'
      };
    });
    const validLiveStart = 
    (liveStartTime instanceof Date 
    && 
    !isNaN(liveStartTime.getTime())) 
    ? liveStartTime : 
    stats.startTime; 
    fs.writeFileSync(path.join(os.homedir(), 
    'tiktok_last_result.json'), 
    JSON.stringify({
      target, roomId: 
      stats.roomId, hostUsername: 
      hostUsername || target, 
      tanggal: `${dt.hari}, 
      ${dt.tgl} ${dt.bln} 
      ${dt.thn} ${dt.jam}`, hari: 
      dt.hari, tgl: dt.tgl, bln: 
      dt.bln, thn: dt.thn, 
      tanggalFull: `${dt.hari}, 
      ${dt.tgl} ${dt.bln} 
      ${dt.thn}`, jam: dt.jam, 
      durasi: getDurationShort(), 
      liveDuration: 
      getDurationFull(), like: 
      stats.l, share: stats.s || 
      shareCount, gift: stats.g, 
      giftRupiah: stats.g * 
      DIAMOND_TO_IDR, giftRinggit: 
      stats.g * DIAMOND_TO_MYR, 
      giftShekel: stats.g * 
      DIAMOND_TO_ILS, maxViewer: 
      stats.maxViewer, totalUsers, 
      totalComments, moderators, 
      totalReports: 
      reportHistory.length, 
      totalFollows: 
      followLog.length, 
      totalTopGivers: 
      topGiversAsc.length, 
      topGiversAsc, topGiversDesc, 
      totalGiftRecipients: 
      giftRecipients.length, 
      giftRecipients, 
      liveStartTime: 
      validLiveStart.toISOString(), 
      liveStartTimeSource, 
      firstGiver: 
      stats._firstGiver || null, 
      langStats, followerSet: 
      [...followerSet], 
      hostFollowSet: 
      [...hostFollowSet], 
      userEnterCount
    }, null, 2));
  } catch (e) {}
}
// ========== LIVE SUMMARY 
// ==========
function showLiveSummary() { const 
  dt = getFullDate(); const 
  totalUsers = 
  Object.keys(users).length; let 
  totalComments = 0; for (let u in 
  users) totalComments += 
  users[u].c; const line = 
  `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
  console.log(`\n 
  ${c.bgR}${c.w}${c.bld} ═══ LIVE 
  SELESAI ═══ ${c.rst}`); 
  console.log(line); 
  console.log(`${c.bld}${c.y}🎬 
  ${c.rst}${c.w}@${target} 
  ${c.bld}${c.b}🆔 
  ${c.rst}${c.w}${stats.roomId}`); 
  console.log(`${c.bld}${c.cy}⏱️ 
  ${c.rst}${c.w}${getDurationShort()} 
  ${c.bld}${c.g}📅 
  ${c.rst}${c.w}${dt.hari}, 
  ${dt.tgl} ${dt.bln} ${dt.thn} 
  ${dt.jam}`); 
  console.log(`${c.bld}${c.b}👤 
  HOST: 
  ${c.rst}${c.w}@${hostUsername || 
  target}${c.rst}`); 
  console.log(`${c.bld}${c.g}⏱️ 
  TOTAL DURASI LIVE: 
  ${c.rst}${c.w}${getDurationFull()}${c.rst}`); 
  if (liveStartTime && 
  !isNaN(liveStartTime.getTime())) 
  { console.log(`${c.b}🟢 HOST 
    MULAI LIVE: 
    ${c.w}${liveStartTime.toLocaleString('id-ID')} 
    ${c.g}(dari 
    ${liveStartTimeSource})${c.rst}`);
  }
  if (stats._firstGiver && 
  stats._firstGiverRecorded) {
    console.log(`${c.bld}${c.y}🏆 
    FIRST GIVER: 
    ${c.rst}${c.w}@${stats._firstGiver.username} 
    (${stats._firstGiver.nickname})${c.rst}`); 
    console.log(` ${c.bld}${c.y}🎁 
    ${c.rst}${c.w}${stats._firstGiver.giftName} 
    (${stats._firstGiver.amount} 
    💎) pada 
    ${stats._firstGiver.time}${c.rst}`);
  }
  console.log(`${line}`); 
  console.log(`${c.bld}${c.r}❤️ 
  LIKE: 
  ${c.rst}${c.w}${formatNumber(stats.l)}${c.rst}`); 
  console.log(`${c.bld}${c.g}📤 
  SHARE/BAGIKAN LIVE: 
  ${c.rst}${c.w}${formatNumber(stats.s 
  || shareCount)}${c.rst}`);
  console.log(`${c.bld}${c.m}💬 
  KOMENTAR: 
  ${c.rst}${c.w}${formatNumber(totalComments)}${c.rst}`); 
  console.log(`${c.bld}${c.b}👥 
  FOLLOW: 
  ${c.rst}${c.w}${followLog.length}${c.rst}`); 
  console.log(`${line}`); const 
  totalFee = stats.g * 
  (TIKTOK_FEE_PERCENT / 100); 
  const totalNet = stats.g - 
  totalFee; 
  console.log(`${c.bld}${c.y}🎁 
  TOTAL GIFT: 
  ${c.rst}${c.w}${formatNumber(stats.g)} 
  💎${c.rst}`); 
  console.log(`${c.bld}${c.g} 💰 
  ${formatRupiah(stats.g*DIAMOND_TO_IDR)} 
  ${c.w}/ 
  ${c.g}${formatRinggit(stats.g*DIAMOND_TO_MYR)} 
  ${c.w}/ 
  ${c.g}${formatShekel(stats.g*DIAMOND_TO_ILS)}${c.rst}`); 
  console.log(`${c.bld}${c.r} 💸 
  POTONGAN TIKTOK: 
  ${c.rst}${c.w}${formatNumber(totalFee)} 
  💎${c.rst}`); 
  console.log(`${c.bld}${c.r} 💸 
  ${formatRupiah(totalFee*DIAMOND_TO_IDR)} 
  ${c.w}/ 
  ${c.r}${formatRinggit(totalFee*DIAMOND_TO_MYR)} 
  ${c.w}/ 
  ${c.r}${formatShekel(totalFee*DIAMOND_TO_ILS)}${c.rst}`); 
  console.log(`${c.bld}${c.bgG}${c.w} 
  ✅ BERSIH DITERIMA: 
  ${c.rst}${c.w}${formatNumber(totalNet)} 
  💎${c.rst}`); 
  console.log(`${c.bld}${c.g} ✅ 
  ${formatRupiah(totalNet*DIAMOND_TO_IDR)} 
  ${c.w}/ 
  ${c.g}${formatRinggit(totalNet*DIAMOND_TO_MYR)} 
  ${c.w}/ 
  ${c.g}${formatShekel(totalNet*DIAMOND_TO_ILS)}${c.rst}`); 
  console.log(`${c.bld}${c.cy}👥 
  ${c.rst}${c.w}${formatNumber(totalUsers)} 
  user ${c.bld}${c.o}👁️ 
  ${c.rst}${c.w}Max 
  ${formatNumber(stats.maxViewer)}`); 
  if (moderators.length) {
    console.log(`${c.bgY}${c.w}${c.bld} 
    ⭐ MODERATOR 
    (${moderators.length}) 
    ${c.rst}`); 
    moderators.forEach((m, i) => 
    console.log(`${c.cy}${i+1}. 
    ${c.w}@${m}${c.rst} ${c.g}🔗 
    https://tiktok.com/@${m}${c.rst}`));
  }
  if (reportHistory.length) 
  console.log(`${c.bgR}${c.w}${c.bld}🚨 
  TOTAL LAPORAN: 
  ${reportHistory.length}${c.rst}`); 
  const langs = getLangStats(); if 
  (langs.length > 0) {
    renderLangStats(langs, '🌐 
    STATISTIK BAHASA KOMENTAR 
    🌐');
  }
  const topGivers = 
  Object.entries(users).filter(([_, 
  d]) => d.g > 0).sort((a, b) => 
  b[1].g - a[1].g); if 
  (topGivers.length > 0) {
    console.log(`\n${c.bgY}${c.w}${c.bld} 
    🏆 PEMBERI GIFT (TOP GIVER) 🏆 
    ${c.rst}`); console.log(line); 
    topGivers.slice(0, 
    10).forEach(([uid, data], idx) 
    => {
      const modTag = 
      moderators.includes(uid) ? ' 
      ⭐' : ''; const hostTag = 
      uid === (hostUsername || 
      target) ? ' 🎯' : ''; const 
      rankNum = idx + 1; let 
      rankIcon; if (rankNum === 1) 
      rankIcon = `${c.y}${c.bld}🥇 
      TOP 1${c.rst}`; else if 
      (rankNum === 2) rankIcon = 
      `${c.cy}${c.bld}🥈 TOP 
      2${c.rst}`; else if (rankNum 
      === 3) rankIcon = 
      `${c.o}${c.bld}🥉 TOP 
      3${c.rst}`; else rankIcon = 
      `${c.w}#${rankNum} TOP 
      ${rankNum}${c.rst}`; 
      console.log(`${rankIcon} 
      ${c.bld}${c.w}${data.nickname}${hostTag}${modTag}${c.rst} 
      ${c.cy}🔖 @${uid}${c.rst}`); 
      console.log(` 
      ${c.bld}${c.y}🎁 
      ${c.rst}${c.w}${formatNumber(data.g)} 
      💎 
      ${c.g}(${formatRupiah(data.g 
      * DIAMOND_TO_IDR)} / 
      ${formatRinggit(data.g * 
      DIAMOND_TO_MYR)} / 
      ${formatShekel(data.g * 
      DIAMOND_TO_ILS)})${c.rst}`); 
      console.log(` 
      ${c.bld}${c.o}👥 FOLLOWERS: 
      ${c.rst}${c.w}${formatNumber(data.followers 
      || 0)} 
      ${c.bld}${c.cy}FOLLOWING: 
      ${c.rst}${c.w}${formatNumber(data.following 
      || 0)}`);
      console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`); 
      console.log('');
    });
    console.log(line);
  }
  const recipients = 
  Object.entries(users).filter(([_, 
  d]) => (d.gReceived || 0) > 
  0).sort((a, b) => 
  (b[1].gReceived || 0) - 
  (a[1].gReceived || 0)); if 
  (recipients.length > 0) {
    console.log(`\n${c.bgP}${c.w}${c.bld} 
    🎁 PENERIMA GIFT / HADIAH 
    (${recipients.length} USER) 
    ${c.rst}`); console.log(line); 
    recipients.slice(0, 
    5).forEach(([uid, data], idx) 
    => {
      const modTag = 
      moderators.includes(uid) ? ' 
      ⭐' : ''; const roleTag = 
      uid === (hostUsername || 
      target) ? 
      `${c.bgY}${c.w}${c.bld} HOST 
      ${c.rst}` : 
      `${c.bgC}${c.w}${c.bld} 
      CO-HOST ${c.rst}`; const 
      giftVal = data.gReceived || 
      0; const feeS = giftVal * 
      (TIKTOK_FEE_PERCENT / 100); 
      const netS = giftVal - feeS; 
      const rankNum = idx + 1; let 
      rankIcon; if (rankNum === 1) 
      rankIcon = `${c.y}${c.bld}🥇 
      TOP 1${c.rst}`; else if 
      (rankNum === 2) rankIcon = 
      `${c.cy}${c.bld}🥈 TOP 
      2${c.rst}`; else if (rankNum 
      === 3) rankIcon = 
      `${c.o}${c.bld}🥉 TOP 
      3${c.rst}`; else rankIcon = 
      `${c.w}#${rankNum} TOP 
      ${rankNum}${c.rst}`; 
      console.log(`${rankIcon} 
      ${c.w}${data.nickname}${modTag} 
      ${roleTag} ${c.cy}🔖 
      @${uid}${c.rst}`); 
      console.log(` 
      ${c.bld}${c.bgG}${c.w}🎁 
      TOTAL DITERIMA: 
      ${c.rst}${c.w}${formatNumber(giftVal)} 
      💎${c.rst}`); console.log(` 
      ${c.bld}${c.g} 💰 
      ${formatRupiah(giftVal * 
      DIAMOND_TO_IDR)} ${c.w}/ 
      ${c.g}${formatRinggit(giftVal 
      * DIAMOND_TO_MYR)} ${c.w}/ 
      ${c.g}${formatShekel(giftVal 
      * 
      DIAMOND_TO_ILS)}${c.rst}`); 
      console.log(` ${c.bld}${c.r} 
      💸 POTONGAN TIKTOK: 
      ${formatNumber(feeS)} 
      💎${c.rst}`); console.log(` 
      ${c.bld}${c.bgG}${c.w} ✅ 
      BERSIH: 
      ${formatNumber(netS)} 
      💎${c.rst}`); console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`); 
      console.log('');
    });
    console.log(line);
  }
  const topLikers = 
  Object.entries(users).filter(([_, 
  d]) => d.l > 0).sort((a, b) => 
  b[1].l - a[1].l); if 
  (topLikers.length > 0) {
    console.log(`\n${c.bgR}${c.w}${c.bld} 
    ❤️ PENONTON PALING BANYAK LIKE 
    ❤️ ${c.rst}`); 
    console.log(line); 
    topLikers.slice(0, 
    10).forEach(([uid, data], idx) 
    => {
      const modTag = 
      moderators.includes(uid) ? ' 
      ⭐' : ''; const hostTag = 
      uid === (hostUsername || 
      target) ? ' 🎯' : ''; const 
      rankNum = idx + 1; let 
      rankIcon; if (rankNum === 1) 
      rankIcon = `${c.y}${c.bld}🥇 
      TOP 1${c.rst}`; else if 
      (rankNum === 2) rankIcon = 
      `${c.cy}${c.bld}🥈 TOP 
      2${c.rst}`; else if (rankNum 
      === 3) rankIcon = 
      `${c.o}${c.bld}🥉 TOP 
      3${c.rst}`; else rankIcon = 
      `${c.w}#${rankNum} TOP 
      ${rankNum}${c.rst}`; 
      console.log(`${rankIcon} 
      ${c.w}${data.nickname}${hostTag}${modTag} 
      ${c.cy}🔖 @${uid}${c.rst} 
      ${c.r}❤️ 
      ${formatNumber(data.l)} 
      like${c.rst}`); 
      console.log(` 
      ${c.bld}${c.o}👥 FOLLOWERS: 
      ${c.rst}${c.w}${formatNumber(data.followers 
      || 0)} 
      ${c.bld}${c.cy}FOLLOWING: 
      ${c.rst}${c.w}${formatNumber(data.following 
      || 0)}`);
      console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`); 
      console.log('');
    });
    console.log(line);
  }
  const topSharers = 
  Object.entries(users).filter(([_, 
  d]) => d.s > 0).sort((a, b) => 
  b[1].s - a[1].s); if 
  (topSharers.length > 0) {
    console.log(`\n${c.bgG}${c.w}${c.bld} 
    📤 PENONTON PALING BANYAK 
    SHARE 📤 ${c.rst}`); 
    console.log(line); 
    topSharers.slice(0, 
    10).forEach(([uid, data], idx) 
    => {
      const modTag = 
      moderators.includes(uid) ? ' 
      ⭐' : ''; const hostTag = 
      uid === (hostUsername || 
      target) ? ' 🎯' : ''; const 
      rankNum = idx + 1; let 
      rankIcon; if (rankNum === 1) 
      rankIcon = `${c.y}${c.bld}🥇 
      TOP 1${c.rst}`; else if 
      (rankNum === 2) rankIcon = 
      `${c.cy}${c.bld}🥈 TOP 
      2${c.rst}`; else if (rankNum 
      === 3) rankIcon = 
      `${c.o}${c.bld}🥉 TOP 
      3${c.rst}`; else rankIcon = 
      `${c.w}#${rankNum} TOP 
      ${rankNum}${c.rst}`; 
      console.log(`${rankIcon} 
      ${c.w}${data.nickname}${hostTag}${modTag} 
      ${c.cy}🔖 @${uid}${c.rst} 
      ${c.g}📤 
      ${formatNumber(data.s)} 
      share${c.rst}`); 
      console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`); 
      console.log('');
    });
    console.log(line);
  }
  const topCommenters = 
  Object.entries(users).filter(([_, 
  d]) => d.c > 0).sort((a, b) => 
  b[1].c - a[1].c); if 
  (topCommenters.length > 0) {
    console.log(`\n${c.bgP}${c.w}${c.bld} 
    💬 PENONTON PALING BANYAK 
    KOMENTAR 💬 ${c.rst}`); 
    console.log(line); 
    topCommenters.slice(0, 
    10).forEach(([uid, data], idx) 
    => {
      const modTag = 
      moderators.includes(uid) ? ' 
      ⭐' : ''; const hostTag = 
      uid === (hostUsername || 
      target) ? ' 🎯' : ''; const 
      pct = totalComments > 0 ? 
      ((data.c / totalComments) * 
      100).toFixed(1) : 0; const 
      rankNum = idx + 1; let 
      rankIcon; if (rankNum === 1) 
      rankIcon = `${c.y}${c.bld}🥇 
      TOP 1${c.rst}`; else if 
      (rankNum === 2) rankIcon = 
      `${c.cy}${c.bld}🥈 TOP 
      2${c.rst}`; else if (rankNum 
      === 3) rankIcon = 
      `${c.o}${c.bld}🥉 TOP 
      3${c.rst}`; else rankIcon = 
      `${c.w}#${rankNum} TOP 
      ${rankNum}${c.rst}`; 
      console.log(`${rankIcon} 
      ${c.w}${data.nickname}${hostTag}${modTag} 
      ${c.cy}🔖 @${uid}${c.rst} 
      ${c.m}💬 
      ${formatNumber(data.c)} 
      komentar 
      (${pct}%)${c.rst}`); 
      console.log(` 
      ${c.bld}${c.o}👥 FOLLOWERS: 
      ${c.rst}${c.w}${formatNumber(data.followers 
      || 0)} 
      ${c.bld}${c.cy}FOLLOWING: 
      ${c.rst}${c.w}${formatNumber(data.following 
      || 0)}`);
      console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`); 
      console.log('');
    });
    console.log(line);
  }
  const enterList = 
  Object.entries(userEnterCount).filter(([_, 
  count]) => count > 1).sort((a, 
  b) => b[1] - a[1]); if 
  (enterList.length > 0) {
    console.log(`\n${c.bgB}${c.w}${c.bld} 
    🚪 AKUN PALING SERING 
    KELUAR-MASUK 🚪 ${c.rst}`); 
    console.log(line); 
    enterList.slice(0, 
    5).forEach(([uid, count], idx) 
    => {
      const u = users[uid] || {}; 
      console.log(`${c.cy}${idx+1}. 
      ${c.w}${u.nickname || uid} 
      ${c.cy}🔖 @${uid}${c.rst} 
      ${c.b}🔄 ${count}x 
      MASUK${c.rst}`); 
      console.log(` 
      ${c.bld}${c.o}👥 FOLLOWERS: 
      ${c.rst}${c.w}${formatNumber(u.followers 
      || 0)} 
      ${c.bld}${c.cy}FOLLOWING: 
      ${c.rst}${c.w}${formatNumber(u.following 
      || 0)}`);
      console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}https://www.tiktok.com/@${uid}${c.rst}`); 
      console.log('');
    });
    console.log(line);
  }
  if (followLog.length > 0) { 
    console.log(`\n${c.bgC}${c.w}${c.bld} 
    👥 FOLLOW BARU 
    (${followLog.length} AKUN) 👥 
    ${c.rst}`); console.log(line); 
    followLog.slice(0, 
    10).forEach((f, i) => {
      console.log(`${c.cy}${i+1}. 
      ${c.w}${f.nickname} 
      ${c.cy}🔖 
      @${f.username}${c.rst} 
      ${c.cy}🕐 
      ${f.waktu}${c.rst}`); 
      console.log(` 
      ${c.bld}${c.o}👥 FOLLOWERS: 
      ${c.rst}${c.w}${formatNumber(f.followers 
      || 0)}`);
      console.log(` 
      ${c.bld}${c.g}🔗 
      ${c.rst}${c.w}${f.link}${c.rst}`); 
      console.log('');
    });
    if (followLog.length > 10) 
    console.log(`${c.y} ... 
    (${followLog.length - 10} 
    follow lainnya)${c.rst}`); 
    console.log(line);
  }
  console.log(`\n ${c.r}${c.bld}⚠️ 
  TETAPLAH WASPADA TUAN MUDA! 
  ⚠️${c.rst}\n`);
}
// ========== MONITORING 
// ==========
function startMonitoring(username) 
{
  target = username; stats = { 
  v:0, l:0, s:0, g:0, maxViewer:0, 
  startTime:new Date(), 
  roomId:'Menunggu...', 
  _firstGiver: null, 
  _firstGiverRecorded: false }; 
  users = {}; giftDetails = {}; 
  commentLog = []; moderators = 
  []; reportHistory = []; 
  followLog = []; langStats = {}; 
  userIdToUsernameCache = {}; 
  followerSet = new Set(); 
  userEnterCount = {}; 
  hostFollowSet = new Set(); 
  hostUsername = ''; liveStartTime 
  = null; liveStartTimeSource = 
  'Tidak diketahui'; shareCount = 
  0; monitoringActive = true; 
  reconnectAttempts = 0; if 
  (headerInterval) 
  clearInterval(headerInterval); 
  headerInterval = 
  setInterval(updateHeader, 1000); 
  console.log(`${c.y}⏳ 
  Menghubungkan ke live 
  @${target}...${c.rst}`); try {
    tiktok = new 
    WebcastPushConnection(target, 
    { enableExtendedMemberInfo: 
    true });
  } catch (e) {
    console.log(`${c.r}❌ Gagal 
    inisialisasi: 
    ${e.message}${c.rst}`); 
    monitoringActive = false; if 
    (headerInterval) 
    clearInterval(headerInterval); 
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showMainMenu()); return;
  }
  tiktok.on('error', () => {}); 
  tiktok.connect().then((state) => 
  {
    if (state?.roomId) 
    stats.roomId = state.roomId; 
    if 
    (state?.roomInfo?.ownerUniqueId) 
    hostUsername = 
    state.roomInfo.ownerUniqueId; 
    if (state && !liveStartTime) {
      const foundTime = 
      tryGetStartTime(state); if 
      (foundTime) { liveStartTime 
      = foundTime; 
      liveStartTimeSource = 'dari 
      state'; }
    }
    const hostUid = hostUsername 
    || target;
    if (!users[hostUid]) { 
      users[hostUid] = { 
      l:0,s:0,c:0,g:0,gReceived:0, 
      userId: hostUid, nickname: 
      hostUid, followers:0, 
      following:0 };
    }
    console.log(`${c.g}✅ 
    Terhubung ke live @${target} 
    (Room: 
    ${stats.roomId})${c.rst}`); 
    console.log(`${c.b}👤 HOST: 
    ${c.w}@${hostUsername || 
    target}${c.rst}`); if 
    (liveStartTime && 
    !isNaN(liveStartTime.getTime())) 
    { console.log(`${c.b}🟢 HOST 
      MULAI LIVE: 
      ${c.w}${liveStartTime.toLocaleString('id-ID')} 
      ${c.g}(dari 
      ${liveStartTimeSource})${c.rst}`);
    }
    console.log(`${c.cy}📡 Mulai 
    monitoring... Tekan CTRL+C 
    untuk berhenti${c.rst}`); 
    updateHeader();
  }).catch((e) => {
    monitoringActive = false; if 
    (headerInterval) 
    clearInterval(headerInterval); 
    console.log(`${c.r}❌ 
    ${e?.message || 'Akun tidak 
    live atau error'}${c.rst}`); 
    if 
    (CONFIG.ENABLE_AUTO_RECONNECT 
    && reconnectAttempts < 
    CONFIG.MAX_RECONNECT_ATTEMPTS) 
    {
      reconnectAttempts++; 
      console.log(`${c.y}🔄 
      Reconnect 
      (${reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS})...${c.rst}`); 
      setTimeout(() => 
      startMonitoring(target), 
      5000);
    } else {
      rl.question(`\n${c.y}Tekan 
      ENTER kembali...${c.rst}`, 
      () => showMainMenu());
    }
  });
  tiktok.on('member', d => { 
    userEnterCount[d.uniqueId] = 
    (userEnterCount[d.uniqueId] || 
    0) + 1;
    
    if (!users[d.uniqueId]) 
    users[d.uniqueId] = { 
    l:0,s:0,c:0,g:0,gReceived:0, 
    userId:d.userId, 
    nickname:d.nickname, 
    followers:0, following:0 }; 
    else 
    users[d.uniqueId].nickname = 
    d.nickname; if (d.secUid) 
    users[d.uniqueId].secUid = 
    d.secUid; if 
    (d.userDetails?.profilePictureUrl 
    || d.profilePictureUrl || 
    d.avatar) { 
      users[d.uniqueId].avatar = 
      d.userDetails?.profilePictureUrl 
      || d.profilePictureUrl || 
      d.avatar;
    }
    if (d.userDetails?.signature 
    || d.signature || d.bio) {
      users[d.uniqueId].bio = 
      d.userDetails?.signature || 
      d.signature || d.bio;
    }
    if (d.userDetails?.videoCount 
    || d.videoCount) 
    users[d.uniqueId].videoCount = 
    d.userDetails?.videoCount || 
    d.videoCount; if 
    (d.userDetails?.heartCount || 
    d.heartCount) 
    users[d.uniqueId].heartCount = 
    d.userDetails?.heartCount || 
    d.heartCount; if 
    (d.device_info?.device_brand) 
    users[d.uniqueId].deviceBrand 
    = d.device_info.device_brand; 
    if 
    (d.device_info?.device_model) 
    users[d.uniqueId].deviceModel 
    = d.device_info.device_model; 
    if (d.userAgent) 
    users[d.uniqueId].userAgent = 
    d.userAgent; if (d.followInfo) 
    {
      users[d.uniqueId].followers 
      = d.followInfo.followerCount 
      || 0;
      users[d.uniqueId].following 
      = 
      d.followInfo.followingCount 
      || 0;
    }
    if (d.isModerator && 
    !moderators.includes(d.uniqueId)) 
    moderators.push(d.uniqueId); 
    if (d.roomInfo?.ownerUniqueId) 
    hostUsername = 
    d.roomInfo.ownerUniqueId; 
    renderBlock("MASUK", d, "BARU 
    SAJA BERGABUNG");
  });
  tiktok.on('follow', (d) => { 
    const dt = getFullDate(); 
    const uid = d.uniqueId; const 
    nickname = d.nickname || uid; 
    const followerCount = 
    d.followInfo?.followerCount || 
    0; const followingCount = 
    d.followInfo?.followingCount 
    || 0;
    const followStatus = 
    d.followInfo?.followStatus;
    
    followerSet.add(uid); 
    hostFollowSet.add(uid);
    
    if (!users[uid]) users[uid] = 
    { l:0,s:0,c:0,g:0,gReceived:0, 
    userId:d.userId, nickname, 
    followers:followerCount, 
    following:followingCount, 
    hasFollowed: true }; else {
      users[uid].hasFollowed = 
      true; users[uid].nickname = 
      nickname; 
      users[uid].followers = 
      followerCount; 
      users[uid].following = 
      followingCount;
    }
    
    const hostUid = hostUsername 
    || target;
    const hostUser = 
    users[hostUid] || {}; const 
    hostNickname = 
    hostUser.nickname || hostUid; 
    const hostFollowers = 
    hostUser.followers || 0; const 
    hostFollowing = 
    hostUser.following || 0;
    
    followLog.push({ waktu: 
      `${dt.hari}, ${dt.tgl} 
      ${dt.bln} ${dt.thn} 
      ${dt.jam}`, username: uid, 
      nickname, userId: d.userId 
      || '?',
      followers: followerCount, 
      following: followingCount, 
      followStatus: followStatus, 
      link: 
      `https://tiktok.com/@${uid}`, 
      followedUsername: hostUid, 
      followedNickname: 
      hostNickname, 
      followedFollowers: 
      hostFollowers, 
      followedFollowing: 
      hostFollowing, followedLink: 
      `https://tiktok.com/@${hostUid}`
    });
    
    const line = 
    `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
    const line2 = 
    `${c.bld}${c.cy}─────────────────────────────────────────────────────────────${c.rst}`;
    
    console.log(`\n${line}`); 
    console.log(`${c.bgG}${c.w}${c.bld} 
    ═══ 👥 FOLLOW BARU ═══ 
    ${c.rst}`); 
    console.log(`${line}`);
    
    console.log(`${c.bgC}${c.w}${c.bld} 
    👤 YANG FOLLOW ${c.rst}`); 
    console.log(`${c.bld}${c.y}👤 
    NAME : 
    ${c.rst}${c.w}${nickname}${buildBadges(uid, 
    moderators.includes(uid))}${c.rst}`); 
    console.log(`${c.bld}${c.cy}🔖 
    USERNAME: 
    ${c.rst}${c.w}@${uid}${c.rst}`); 
    console.log(`${c.bld}${c.o}👥 
    FOLLOWERS: 
    ${c.rst}${c.w}${formatNumber(followerCount)}${c.rst}`); 
    console.log(`${c.bld}${c.cy}👥 
    FOLLOWING: 
    ${c.rst}${c.w}${formatNumber(followingCount)}${c.rst}`);
    
    const followStatusText = 
    formatFollowStatus(followStatus, 
    hostUid) || `🤝 Berteman 
    dengan Host`; 
    console.log(`${c.bld}${c.g}📊 
    FOLLOW STAT: 
    ${c.rst}${c.w}${followStatusText}${c.rst}`);
    
    console.log(`${c.bld}${c.g}🔗 
    URL : 
    ${c.rst}${c.w}https://tiktok.com/@${uid}${c.rst}`); 
    console.log(`${line2}`);
    
    console.log(`${c.bgY}${c.w}${c.bld} 
    🎯 YANG DI-FOLLOW ${c.rst}`); 
    console.log(`${c.bld}${c.y}👤 
    NAME : 
    ${c.rst}${c.w}${hostNickname}${c.rst}`); 
    console.log(`${c.bld}${c.cy}🔖 
    USERNAME: 
    ${c.rst}${c.w}@${hostUid}${c.rst}`); 
    console.log(`${c.bld}${c.o}👥 
    FOLLOWERS: 
    ${c.rst}${c.w}${formatNumber(hostFollowers)}${c.rst}`); 
    console.log(`${c.bld}${c.cy}👥 
    FOLLOWING: 
    ${c.rst}${c.w}${formatNumber(hostFollowing)}${c.rst}`); 
    console.log(`${c.bld}${c.g}🔗 
    URL : 
    ${c.rst}${c.w}https://tiktok.com/@${hostUid}${c.rst}`);
    
    console.log(`${line2}`); 
    console.log(`${c.bld}${c.cy}⏰ 
    WAKTU: ${c.rst}${c.w}${dt.jam} 
    ${c.bld}${c.y}📅 TANGGAL: 
    ${c.rst}${c.w}${dt.hari}, 
    ${dt.tgl} ${dt.bln} 
    ${dt.thn}${c.rst}`); 
    console.log(`${c.bld}${c.g}📤 
    TOTAL SHARE LIVE: 
    ${c.rst}${c.w}${formatNumber(stats.s 
    || shareCount)}${c.rst}`);
    console.log(`${line}`);
  });
  tiktok.on('chat', async d => { 
    if (users[d.uniqueId]) { 
    users[d.uniqueId].c++; 
    users[d.uniqueId].nickname = 
    d.nickname; } else 
    users[d.uniqueId] = { 
    l:0,s:0,c:1,g:0,gReceived:0, 
    userId:d.userId, 
    nickname:d.nickname, 
    followers:0, following:0 }; if 
    (d.secUid) 
    users[d.uniqueId].secUid = 
    d.secUid; if 
    (d.userDetails?.profilePictureUrl 
    || d.profilePictureUrl || 
    d.avatar) { 
      users[d.uniqueId].avatar = 
      d.userDetails?.profilePictureUrl 
      || d.profilePictureUrl || 
      d.avatar;
    }
    if (d.userDetails?.signature 
    || d.signature || d.bio) {
      users[d.uniqueId].bio = 
      d.userDetails?.signature || 
      d.signature || d.bio;
    }
    if (d.userDetails?.videoCount 
    || d.videoCount) 
    users[d.uniqueId].videoCount = 
    d.userDetails?.videoCount || 
    d.videoCount; if 
    (d.userDetails?.heartCount || 
    d.heartCount) 
    users[d.uniqueId].heartCount = 
    d.userDetails?.heartCount || 
    d.heartCount; if 
    (d.device_info?.device_brand) 
    users[d.uniqueId].deviceBrand 
    = d.device_info.device_brand; 
    if 
    (d.device_info?.device_model) 
    users[d.uniqueId].deviceModel 
    = d.device_info.device_model; 
    if (d.userAgent) 
    users[d.uniqueId].userAgent = 
    d.userAgent; if (d.followInfo) 
    {
      users[d.uniqueId].followers 
      = d.followInfo.followerCount 
      || 0;
      users[d.uniqueId].following 
      = 
      d.followInfo.followingCount 
      || 0;
    }
    if (d.isModerator && 
    !moderators.includes(d.uniqueId)) 
    moderators.push(d.uniqueId); 
    if (d.roomInfo?.ownerUniqueId) 
    hostUsername = 
    d.roomInfo.ownerUniqueId; 
    await renderBlock("KOMENTAR", 
    d, "", d.comment);
  });
  tiktok.on('like', async d => { 
    stats.l = d.totalLikeCount || 
    stats.l; if 
    (users[d.uniqueId]) { 
    users[d.uniqueId].l += 
    d.likeCount || 0; 
    users[d.uniqueId].nickname = 
    d.nickname; } else 
    users[d.uniqueId] = { 
    l:d.likeCount||0,s:0,c:0,g:0,gReceived:0, 
    userId:d.userId, 
    nickname:d.nickname, 
    followers:0, following:0 }; if 
    (d.secUid) 
    users[d.uniqueId].secUid = 
    d.secUid; if (d.followInfo) {
      users[d.uniqueId].followers 
      = d.followInfo.followerCount 
      || 0;
      users[d.uniqueId].following 
      = 
      d.followInfo.followingCount 
      || 0;
    }
    if (d.isModerator && 
    !moderators.includes(d.uniqueId)) 
    moderators.push(d.uniqueId); 
    if (d.roomInfo?.ownerUniqueId) 
    hostUsername = 
    d.roomInfo.ownerUniqueId; 
    await renderBlock("AKTIVITAS", 
    d, `TAP-TAP ${d.likeCount || 
    0} LIKE`);
  });
  tiktok.on('share', async d => { 
    stats.s++; shareCount++; if 
    (users[d.uniqueId]) { 
    users[d.uniqueId].s++; 
    users[d.uniqueId].nickname = 
    d.nickname; } else 
    users[d.uniqueId] = { 
    l:0,s:1,c:0,g:0,gReceived:0, 
    userId:d.userId, 
    nickname:d.nickname, 
    followers:0, following:0 }; if 
    (d.secUid) 
    users[d.uniqueId].secUid = 
    d.secUid; if (d.followInfo) {
      users[d.uniqueId].followers 
      = d.followInfo.followerCount 
      || 0;
      users[d.uniqueId].following 
      = 
      d.followInfo.followingCount 
      || 0;
    }
    if (d.isModerator && 
    !moderators.includes(d.uniqueId)) 
    moderators.push(d.uniqueId); 
    if (d.roomInfo?.ownerUniqueId) 
    hostUsername = 
    d.roomInfo.ownerUniqueId; 
    await renderBlock("AKTIVITAS", 
    d, "SHARE / BAGIKAN LIVE");
  });
  tiktok.on('roomUser', d => { 
    stats.v = d.viewerCount || 
    stats.v; if (d.viewerCount > 
    stats.maxViewer) 
    stats.maxViewer = 
    d.viewerCount; if (d.roomId && 
    stats.roomId === 
    'Menunggu...') stats.roomId = 
    d.roomId; if 
    (d.roomInfo?.ownerUniqueId) 
    hostUsername = 
    d.roomInfo.ownerUniqueId; if 
    (d.shareCount && d.shareCount 
    > shareCount) {
      const newShares = 
      d.shareCount - shareCount; 
      shareCount = d.shareCount; 
      stats.s = shareCount; const 
      hostUid = hostUsername || 
      target; if (users[hostUid]) 
      users[hostUid].s += 
      newShares;
    }
    if (!liveStartTime) { const 
      foundTime = 
      tryGetStartTime(d); if 
      (foundTime) {
        liveStartTime = foundTime; 
        liveStartTimeSource = 
        'dari roomUser';
      }
    }
    updateHeader();
  });
  tiktok.on('gift', async d => { 
    let price = (d.diamondCount || 
    0) * (d.repeatCount || 1); 
    stats.g += price; if 
    (users[d.uniqueId]) { 
    users[d.uniqueId].g += price; 
    users[d.uniqueId].nickname = 
    d.nickname; } else 
    users[d.uniqueId] = { 
    l:0,s:0,c:0,g:price,gReceived:0, 
    userId:d.userId, 
    nickname:d.nickname, 
    followers:0, following:0 }; if 
    (d.secUid) 
    users[d.uniqueId].secUid = 
    d.secUid; if 
    (d.userDetails?.profilePictureUrl 
    || d.profilePictureUrl || 
    d.avatar) { 
      users[d.uniqueId].avatar = 
      d.userDetails?.profilePictureUrl 
      || d.profilePictureUrl || 
      d.avatar;
    }
    if 
    (d.device_info?.device_brand) 
    users[d.uniqueId].deviceBrand 
    = d.device_info.device_brand; 
    if 
    (d.device_info?.device_model) 
    users[d.uniqueId].deviceModel 
    = d.device_info.device_model; 
    if (d.userAgent) 
    users[d.uniqueId].userAgent = 
    d.userAgent; if (d.followInfo) 
    {
      users[d.uniqueId].followers 
      = d.followInfo.followerCount 
      || 0;
      users[d.uniqueId].following 
      = 
      d.followInfo.followingCount 
      || 0;
    }
    if (d.isModerator && 
    !moderators.includes(d.uniqueId)) 
    moderators.push(d.uniqueId); 
    if (d.roomInfo?.ownerUniqueId) 
    hostUsername = 
    d.roomInfo.ownerUniqueId; if 
    (!giftDetails[d.uniqueId]) 
    giftDetails[d.uniqueId] = {}; 
    giftDetails[d.uniqueId][d.giftName] 
    = 
    (giftDetails[d.uniqueId][d.giftName] 
    || 0) + price;
    let recipientRaw = 
    d.giftReceiverId || d.toUserId 
    || d.receiverUserId;
    let recipientKey = null; if 
    (recipientRaw) {
      if 
      (/^\d+$/.test(String(recipientRaw))) 
      {
        const hostKey = 
        hostUsername || target; 
        const hostUser = 
        users[hostKey]; if 
        (hostUser && 
        String(hostUser.userId) 
        === String(recipientRaw)) 
        {
          recipientKey = hostKey;
        } else {
          const found = 
          Object.entries(users).find(([_, 
          u]) => String(u.userId) 
          === 
          String(recipientRaw)); 
          if (found) {
            recipientKey = 
            found[0];
          } else {
            recipientKey = 
            userIdToUsernameCache[recipientRaw] 
            || null;
            if (!recipientKey) { 
              fetchUsernameFromUserId(recipientRaw).then(uname 
              => {
                if (uname) { 
                  userIdToUsernameCache[recipientRaw] 
                  = uname; if 
                  (!users[uname]) 
                  {
                    users[uname] = 
                    { 
                    l:0,s:0,c:0,g:0,gReceived:0, 
                    userId: 
                    recipientRaw, 
                    nickname: 
                    uname, 
                    followers:0, 
                    following:0 };
                  }
                  users[uname].gReceived 
                  = 
                  (users[uname].gReceived 
                  || 0) + price;
                }
              });
              recipientKey = 
              `UID:${recipientRaw}`;
            }
          }
        }
      } else {
        recipientKey = 
        recipientRaw;
      }
    } else {
      recipientKey = hostUsername 
      || target;
    }
    if (!users[recipientKey]) { 
      users[recipientKey] = { 
      l:0,s:0,c:0,g:0,gReceived:price, 
      userId: recipientKey, 
      nickname: recipientKey, 
      followers:0, following:0 };
    } else {
      users[recipientKey].gReceived 
      = 
      (users[recipientKey].gReceived 
      || 0) + price;
    }
    await renderBlock("AKTIVITAS", 
    d, `GIVE: ${d.giftName} 
    x${d.repeatCount} (${price} 
    DIAMOND)`);
  });
  tiktok.on('streamEnd', () => { 
    monitoringActive = false; if 
    (headerInterval) 
    clearInterval(headerInterval); 
    saveCommentHistory(); 
    saveViewerHistory(); 
    saveReportHistory(); 
    saveModeratorHistory(); 
    saveFollowHistory(); 
    saveLiveResult(); 
    showLiveSummary(); 
    rl.question(`\n${c.y}Tekan 
    ENTER untuk kembali ke 
    menu...${c.rst}`, () => 
    showMainMenu());
  });
  tiktok.on('disconnect', () => { 
    if (monitoringActive && 
    CONFIG.ENABLE_AUTO_RECONNECT 
    && reconnectAttempts < 
    CONFIG.MAX_RECONNECT_ATTEMPTS) 
    {
      reconnectAttempts++; 
      setTimeout(() => 
      startMonitoring(target), 
      5000);
    }
  });
}
// ========== HISTORY MENUS 
// ==========
function showGiverHistory() { 
  console.clear(); const line = 
  `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
  console.log(`${c.bgY}${c.w}${c.bld} 
  ═══ HISTORY PEMBERI GIFT (TOP 
  GIVER) ═══ ${c.rst}\n`); const 
  files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('viewers_') && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada history gift.${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showGiverHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); 
    console.log(`${c.bgY}${c.w}${c.bld} 
    ═══ DETAIL PEMBERI GIFT ═══ 
    ${c.rst}\n`); 
    console.log(line); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull; if 
    (!tanggalTampil && 
    data.metadata.hari) {
      tanggalTampil = 
      `${data.metadata.hari}, 
      ${data.metadata.tgl} 
      ${data.metadata.bln} 
      ${data.metadata.thn}`;
    }
    if (!tanggalTampil) { const sd 
      = new 
      Date(data.metadata.startTime); 
      tanggalTampil = 
      sd.toLocaleDateString('id-ID', 
      {
        weekday: 'long', day: 
        'numeric', month: 'long', 
        year: 'numeric'
      });
    }
    const jamTampil = 
    data.metadata.jam || new 
    Date(data.metadata.startTime).toLocaleTimeString('id-ID'); 
    console.log(`${c.bld}${c.cy}⏱️ 
    ${c.rst}${c.w}${data.metadata.duration} 
    ${c.bld}${c.g}📅 
    ${c.rst}${c.w}${tanggalTampil} 
    ${c.bld}${c.cy}⏰ 
    ${c.rst}${c.w}${jamTampil}`); 
    console.log(`${c.bld}${c.b}👤 
    HOST: 
    ${c.rst}${c.w}@${data.metadata.hostUsername 
    || 
    data.metadata.target}${c.rst}`); 
    console.log(`${c.bld}${c.y}🎁 
    ${c.rst}${c.w}TOTAL GIFT: 
    ${formatNumber(data.metadata.totalGiftDiamond)} 
    💎 = 
    ${c.g}${formatRupiah(data.metadata.totalGiftRupiah)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(data.metadata.totalGiftRinggit)} 
    ${c.w}/ 
    ${c.g}${formatShekel(data.metadata.totalGiftShekel 
    || 
    data.metadata.totalGiftDiamond 
    * DIAMOND_TO_ILS)}${c.rst}`); 
    console.log(line); 
    console.log(''); if 
    (data.metadata.topGiversDesc?.length) 
    {
      console.log(`${c.bgY}${c.w}${c.bld} 
      🏆 PEMBERI GIFT (DARI 
      TERBESAR KE TERKECIL) 
      ${c.rst}`); 
      data.metadata.topGiversDesc.slice(0, 
      10).forEach((g, i) => {
        const modTag = 
        g.isModerator ? ' ⭐' : 
        ''; const hostTag = 
        g.isHost ? ' 🎯' : ''; 
        const rankNum = i + 1; let 
        rankIcon; if (rankNum === 
        1) rankIcon = 
        `${c.y}${c.bld}🥇 TOP 
        1${c.rst}`; else if 
        (rankNum === 2) rankIcon = 
        `${c.cy}${c.bld}🥈 TOP 
        2${c.rst}`; else if 
        (rankNum === 3) rankIcon = 
        `${c.o}${c.bld}🥉 TOP 
        3${c.rst}`; else rankIcon 
        = `${c.w}#${rankNum} TOP 
        ${rankNum}${c.rst}`; 
        console.log(`${rankIcon} 
        ${c.w}${g.nickname || 
        g.username}${hostTag}${modTag} 
        ${c.cy}🔖 
        @${g.username}${c.rst}`); 
        console.log(` 
        ${c.bld}${c.y}🎁 
        ${c.rst}${c.w}${formatNumber(g.totalGiftDiamond)} 
        💎 
        ${c.g}(${formatRupiah(g.totalGiftRupiah)} 
        / 
        ${formatRinggit(g.totalGiftRinggit)} 
        / 
        ${formatShekel(g.totalGiftShekel 
        || g.totalGiftDiamond * 
        DIAMOND_TO_ILS)})${c.rst}`); 
        console.log(` 
        ${c.bld}${c.g}🔗 
        ${c.rst}${c.w}https://www.tiktok.com/@${g.username}${c.rst}`); 
        console.log('');
      });
    }
    console.log(line); 
    rl.question(`\n${c.y}Tekan 
    ENTER untuk 
    kembali...${c.rst}`, () => 
    showGiverHistory());
  });
}
function showRecipientHistory() { 
  console.clear(); const line = 
  `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
  console.log(`${c.bgP}${c.w}${c.bld} 
  ═══ HISTORY PENERIMA GIFT ═══ 
  ${c.rst}\n`); const files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('viewers_') && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada history gift.${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showRecipientHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); 
    console.log(`${c.bgP}${c.w}${c.bld} 
    ═══ DETAIL PENERIMA GIFT ═══ 
    ${c.rst}\n`); 
    console.log(line); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull; if 
    (!tanggalTampil && 
    data.metadata.hari) {
      tanggalTampil = 
      `${data.metadata.hari}, 
      ${data.metadata.tgl} 
      ${data.metadata.bln} 
      ${data.metadata.thn}`;
    }
    if (!tanggalTampil) { const sd 
      = new 
      Date(data.metadata.startTime); 
      tanggalTampil = 
      sd.toLocaleDateString('id-ID', 
      {
        weekday: 'long', day: 
        'numeric', month: 'long', 
        year: 'numeric'
      });
    }
    const jamTampil = 
    data.metadata.jam || new 
    Date(data.metadata.startTime).toLocaleTimeString('id-ID'); 
    console.log(`${c.bld}${c.cy}⏱️ 
    ${c.rst}${c.w}${data.metadata.duration} 
    ${c.bld}${c.g}📅 
    ${c.rst}${c.w}${tanggalTampil} 
    ${c.bld}${c.cy}⏰ 
    ${c.rst}${c.w}${jamTampil}`); 
    console.log(`${c.bld}${c.b}👤 
    HOST: 
    ${c.rst}${c.w}@${data.metadata.hostUsername 
    || 
    data.metadata.target}${c.rst}`); 
    console.log(`${c.bld}${c.y}🎁 
    ${c.rst}${c.w}TOTAL GIFT: 
    ${formatNumber(data.metadata.totalGiftDiamond)} 
    💎${c.rst}`); 
    console.log(line); 
    console.log(''); if 
    (data.metadata.giftRecipients?.length) 
    {
      console.log(`${c.bgP}${c.w}${c.bld} 
      🎁 PENERIMA GIFT 
      (${data.metadata.giftRecipients.length} 
      USER) ${c.rst}`); 
      data.metadata.giftRecipients.forEach((r, 
      i) => {
        const modTag = 
        r.isModerator ? ' ⭐' : 
        ''; const roleTag = r.role 
        === 'HOST' ? 
        `${c.bgY}${c.w}${c.bld} 
        HOST ${c.rst}` : 
        `${c.bgC}${c.w}${c.bld} 
        CO-HOST ${c.rst}`; const 
        giftVal = 
        r.totalGiftDiamond || 0; 
        const giftIlsR = 
        r.totalGiftShekel || 
        giftVal * DIAMOND_TO_ILS; 
        const feeR = r.feeDiamond 
        !== undefined ? 
        r.feeDiamond : giftVal * 
        (TIKTOK_FEE_PERCENT / 
        100); const feeRpR = 
        r.feeRupiah !== undefined 
        ? r.feeRupiah : feeR * 
        DIAMOND_TO_IDR; const 
        feeMyrR = r.feeRinggit !== 
        undefined ? r.feeRinggit : 
        feeR * DIAMOND_TO_MYR; 
        const feeIlsR = 
        r.feeShekel !== undefined 
        ? r.feeShekel : feeR * 
        DIAMOND_TO_ILS; const netR 
        = r.netDiamond !== 
        undefined ? r.netDiamond : 
        giftVal - feeR; const 
        netRpR = r.netRupiah !== 
        undefined ? r.netRupiah : 
        netR * DIAMOND_TO_IDR; 
        const netMyrR = 
        r.netRinggit !== undefined 
        ? r.netRinggit : netR * 
        DIAMOND_TO_MYR; const 
        netIlsR = r.netShekel !== 
        undefined ? r.netShekel : 
        netR * DIAMOND_TO_ILS;
        
        const rankNum = i + 1; let 
        rankIcon; if (rankNum === 
        1) rankIcon = 
        `${c.y}${c.bld}🥇 TOP 
        1${c.rst}`; else if 
        (rankNum === 2) rankIcon = 
        `${c.cy}${c.bld}🥈 TOP 
        2${c.rst}`; else if 
        (rankNum === 3) rankIcon = 
        `${c.o}${c.bld}🥉 TOP 
        3${c.rst}`; else rankIcon 
        = `${c.w}#${rankNum} TOP 
        ${rankNum}${c.rst}`;
        
        console.log(`${rankIcon} 
        ${c.w}${r.nickname || 
        r.username}${modTag} 
        ${roleTag} ${c.cy}🔖 
        @${r.username}${c.rst}`); 
        console.log(` 
        ${c.bld}${c.bgG}${c.w}🎁 
        TOTAL DITERIMA: 
        ${c.rst}${c.w}${formatNumber(giftVal)} 
        💎${c.rst}`); 
        console.log(` 
        ${c.bld}${c.g} 💰 
        ${formatRupiah(r.totalGiftRupiah 
        || giftVal * 
        DIAMOND_TO_IDR)} ${c.w}/ 
        ${c.g}${formatRinggit(r.totalGiftRinggit 
        || giftVal * 
        DIAMOND_TO_MYR)} ${c.w}/ 
        ${c.g}${formatShekel(giftIlsR)}${c.rst}`); 
        console.log(` 
        ${c.bld}${c.r} 💸 POTONGAN 
        TIKTOK: 
        ${c.rst}${c.w}${formatNumber(feeR)} 
        💎${c.rst}`); 
        console.log(` 
        ${c.bld}${c.r} 💸 
        ${formatRupiah(feeRpR)} 
        ${c.w}/ 
        ${c.r}${formatRinggit(feeMyrR)} 
        ${c.w}/ 
        ${c.r}${formatShekel(feeIlsR)}${c.rst}`); 
        console.log(` 
        ${c.bld}${c.bgG}${c.w} ✅ 
        BERSIH DITERIMA: 
        ${c.rst}${c.w}${formatNumber(netR)} 
        💎${c.rst}`); 
        console.log(` 
        ${c.bld}${c.g} ✅ 
        ${formatRupiah(netRpR)} 
        ${c.w}/ 
        ${c.g}${formatRinggit(netMyrR)} 
        ${c.w}/ 
        ${c.g}${formatShekel(netIlsR)}${c.rst}`); 
        console.log(` 
        ${c.bld}${c.g}🔗 
        ${c.rst}${c.w}https://www.tiktok.com/@${r.username}${c.rst}`); 
        console.log('');
      });
    } else {
      console.log(`${c.y}📭 Tidak 
      ada penerima 
      gift.${c.rst}`);
    }
    console.log(line); 
    rl.question(`\n${c.y}Tekan 
    ENTER untuk 
    kembali...${c.rst}`, () => 
    showRecipientHistory());
  });
}
function showLastLiveResult() { 
  console.clear(); const line = 
  `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
  console.log(`${c.bgC}${c.w}${c.bld} 
  ═══ HASIL LIVE TERAKHIR ═══ 
  ${c.rst}\n`); const resultPath = 
  path.join(os.homedir(), 
  'tiktok_last_result.json'); if 
  (!fs.existsSync(resultPath)) {
    console.log(`${c.y}📭 Belum 
    ada hasil live 
    tersimpan.${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showMainMenu()); return;
  }
  const data = 
  JSON.parse(fs.readFileSync(resultPath, 
  'utf8')); console.log(line); 
  console.log(`${c.bld}${c.y}🎬 
  ${c.rst}${c.w}@${data.target} 
  ${c.bld}${c.b}🆔 
  ${c.rst}${c.w}${data.roomId}`); 
  console.log(`${c.bld}${c.b}👤 
  HOST: 
  ${c.rst}${c.w}@${data.hostUsername 
  || data.target}${c.rst}`);
  console.log(`${c.bld}${c.g}📅 
  ${c.rst}${c.w}${data.tanggal} 
  ${c.bld}${c.cy}⏱️ 
  ${c.rst}${c.w}${data.durasi}`); 
  console.log(`${c.bld}${c.g}⏱️ 
  TOTAL DURASI LIVE: 
  ${c.rst}${c.w}${data.liveDuration 
  || data.durasi}${c.rst}`);
  if (data.liveStartTime) { const 
    sd = new 
    Date(data.liveStartTime); if 
    (!isNaN(sd.getTime())) 
    console.log(`${c.b}🟢 HOST 
    MULAI LIVE: 
    ${c.w}${sd.toLocaleString('id-ID')} 
    ${c.g}(dari 
    ${data.liveStartTimeSource || 
    'data TikTok'})${c.rst}`);
  }
  if (data.firstGiver) { 
    console.log(`${c.bld}${c.y}🏆 
    FIRST GIVER: 
    ${c.rst}${c.w}@${data.firstGiver.username} 
    (${data.firstGiver.nickname})${c.rst}`); 
    console.log(` ${c.bld}${c.y}🎁 
    ${c.rst}${c.w}${data.firstGiver.giftName} 
    (${data.firstGiver.amount} 💎) 
    pada 
    ${data.firstGiver.time}${c.rst}`);
  }
  console.log(`${line}`); 
  console.log(`${c.bld}${c.r}❤️ 
  LIKE: 
  ${c.rst}${c.w}${formatNumber(data.like)}${c.rst}`); 
  console.log(`${c.bld}${c.g}📤 
  SHARE/BAGIKAN LIVE: 
  ${c.rst}${c.w}${formatNumber(data.share)}${c.rst}`); 
  console.log(`${c.bld}${c.m}💬 
  KOMENTAR: 
  ${c.rst}${c.w}${formatNumber(data.totalComments)}${c.rst}`); 
  console.log(`${c.bld}${c.b}👥 
  FOLLOW: 
  ${c.rst}${c.w}${data.totalFollows 
  || 0}${c.rst}`);
  console.log(`${line}`); const 
  totalFeeR = data.gift * 
  (TIKTOK_FEE_PERCENT / 100); 
  const totalNetR = data.gift - 
  totalFeeR; 
  console.log(`${c.bld}${c.y}🎁 
  TOTAL GIFT: 
  ${c.rst}${c.w}${formatNumber(data.gift)} 
  💎${c.rst}`); 
  console.log(`${c.bld}${c.g} 💰 
  ${formatRupiah(data.giftRupiah)} 
  ${c.w}/ 
  ${c.g}${formatRinggit(data.giftRinggit)} 
  ${c.w}/ 
  ${c.g}${formatShekel(data.giftShekel 
  || data.gift * 
  DIAMOND_TO_ILS)}${c.rst}`); 
  console.log(`${c.bld}${c.r} 💸 
  POTONGAN TIKTOK: 
  ${c.rst}${c.w}${formatNumber(totalFeeR)} 
  💎${c.rst}`); 
  console.log(`${c.bld}${c.r} 💸 
  ${formatRupiah(totalFeeR * 
  DIAMOND_TO_IDR)} ${c.w}/ 
  ${c.r}${formatRinggit(totalFeeR 
  * DIAMOND_TO_MYR)} ${c.w}/ 
  ${c.r}${formatShekel(totalFeeR * 
  DIAMOND_TO_ILS)}${c.rst}`); 
  console.log(`${c.bld}${c.bgG}${c.w} 
  ✅ BERSIH DITERIMA: 
  ${c.rst}${c.w}${formatNumber(totalNetR)} 
  💎${c.rst}`); 
  console.log(`${c.bld}${c.g} ✅ 
  ${formatRupiah(totalNetR * 
  DIAMOND_TO_IDR)} ${c.w}/ 
  ${c.g}${formatRinggit(totalNetR 
  * DIAMOND_TO_MYR)} ${c.w}/ 
  ${c.g}${formatShekel(totalNetR * 
  DIAMOND_TO_ILS)}${c.rst}`); 
  console.log(`${c.bld}${c.cy}👥 
  ${c.rst}${c.w}${formatNumber(data.totalUsers)} 
  user ${c.bld}${c.o}👁️ 
  ${c.rst}${c.w}Max 
  ${formatNumber(data.maxViewer)}`); 
  if (data.moderators?.length) {
    console.log(`${c.bgY}${c.w}${c.bld} 
    ⭐ MODERATOR 
    (${data.moderators.length}) 
    ${c.rst}`); 
    data.moderators.forEach((m, i) 
    => console.log(`${c.cy}${i+1}. 
    ${c.w}@${m}${c.rst} ${c.g}🔗 
    https://tiktok.com/@${m}${c.rst}`));
  }
  if (data.totalReports) 
  console.log(`${c.bgR}${c.w}${c.bld}🚨 
  TOTAL LAPORAN: 
  ${data.totalReports}${c.rst}`); 
  if (data.langStats && 
  Object.keys(data.langStats).length 
  > 0) {
    const total = 
    Object.values(data.langStats).reduce((a,b)=>a+b,0); 
    const langs = 
    Object.entries(data.langStats)
      .map(([code, count]) => { 
        const info = 
        langName(code); return { 
        code, count, name: 
        info.name, flag: 
        info.flag, percent: 
        ((count / total) * 
        100).toFixed(1) };
      })
      .sort((a, b) => b.count - 
      a.count);
    renderLangStats(langs, '🌐 
    STATISTIK BAHASA 🌐');
  }
  console.log(line); 
  rl.question(`\n${c.y}Tekan ENTER 
  kembali...${c.rst}`, () => 
  showMainMenu());
}
function showCommentHistory() { 
  console.clear(); 
  console.log(`${c.bgC}${c.w}${c.bld} 
  ═══ HISTORI KOMENTAR ═══ 
  ${c.rst}\n`); const files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('comments_') && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada histori 
    komentar${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showCommentHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); const line = 
    `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
    console.log(`${c.bgC}${c.w}${c.bld} 
    ═══ DETAIL KOMENTAR ═══ 
    ${c.rst}\n`); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull; if 
    (!tanggalTampil && 
    data.metadata.hari) {
      tanggalTampil = 
      `${data.metadata.hari}, 
      ${data.metadata.tgl} 
      ${data.metadata.bln} 
      ${data.metadata.thn}`;
    }
    if (!tanggalTampil) { const sd 
      = new 
      Date(data.metadata.startTime); 
      tanggalTampil = 
      sd.toLocaleDateString('id-ID', 
      {
        weekday: 'long', day: 
        'numeric', month: 'long', 
        year: 'numeric'
      });
    }
    const jamTampil = 
    data.metadata.jam || new 
    Date(data.metadata.startTime).toLocaleTimeString('id-ID'); 
    console.log(`${c.bld}${c.cy}⏱️ 
    ${c.rst}${c.w}📅 
    ${c.bld}${c.g}${tanggalTampil} 
    ${c.bld}${c.cy}⏰ 
    ${c.rst}${c.w}${jamTampil}${c.rst}`); 
    console.log(`${c.bld}${c.m}💬 
    ${c.rst}${c.w}TOTAL KOMENTAR: 
    ${c.bld}${c.g}${formatNumber(data.metadata.totalComments)}${c.rst}`); 
    console.log(`${c.bld}${c.g}📤 
    ${c.rst}${c.w}TOTAL SHARE: 
    ${c.bld}${c.g}${formatNumber(data.metadata.totalShare 
    || 0)}${c.rst}`);
    console.log(line); 
    console.log(''); 
    data.comments.forEach((cmt, i) 
    => {
      const modTag = 
      cmt.isModerator ? ' ⭐' : 
      ''; const hostTag = 
      cmt.isHost ? ' 🎯' : ''; 
      const nomorUrut = String(i + 
      1).padStart(4, ' '); 
      console.log(`╔══════════════════════════════════════════════════════════════╗`); 
      console.log(`║ 
      ${c.bld}${c.y}${nomorUrut}. 
      👤 NIKNAME : 
      ${c.rst}${c.w}${cmt.nickname}${hostTag}${modTag}${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bld}${c.cy}🔖 USERNAME : 
      ${c.rst}${c.w}@${cmt.username}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.cy}⏰ WAKTU : 
      ${c.rst}${c.w}${cmt.waktu}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.g}📤 TOTAL 
      SHARE: 
      ${c.rst}${c.w}${formatNumber(data.metadata.totalShare 
      || 0)}${c.rst}`);
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bld}${c.r}💬 KOMENTAR : 
      ${c.rst}${c.w}${cmt.komentar}${c.rst}`); 
      if (cmt.bahasa) 
      console.log(`║ 
      ${c.bld}${c.b}🌐 BAHASA : 
      ${c.rst}${c.w}${cmt.bahasaFlag 
      || '🌐'} 
      ${cmt.bahasa}${c.rst}`); if 
      (cmt.terjemahan) 
      console.log(`║ 
      ${c.bld}${c.g}🌐 TERJEMAHAN 
      : 
      ${c.rst}${c.w}${cmt.terjemahan}${c.rst}`); 
      console.log(`╚══════════════════════════════════════════════════════════════╝`); 
      console.log('');
    });
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showCommentHistory());
  });
}
function showViewerHistory() { 
  console.clear(); 
  console.log(`${c.bgC}${c.w}${c.bld} 
  ═══ HISTORI PENONTON ═══ 
  ${c.rst}\n`); const files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('viewers_') && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada histori 
    penonton${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showViewerHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); const line = 
    `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
    console.log(`${c.bgC}${c.w}${c.bld} 
    ═══ DETAIL PENONTON ═══ 
    ${c.rst}\n`); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull; if 
    (!tanggalTampil && 
    data.metadata.hari) {
      tanggalTampil = 
      `${data.metadata.hari}, 
      ${data.metadata.tgl} 
      ${data.metadata.bln} 
      ${data.metadata.thn}`;
    }
    if (!tanggalTampil) { const sd 
      = new 
      Date(data.metadata.startTime); 
      tanggalTampil = 
      sd.toLocaleDateString('id-ID', 
      {
        weekday: 'long', day: 
        'numeric', month: 'long', 
        year: 'numeric'
      });
    }
    const jamTampil = 
    data.metadata.jam || new 
    Date(data.metadata.startTime).toLocaleTimeString('id-ID'); 
    console.log(`${c.bld}${c.cy}⏱️ 
    ${c.rst}${c.w}${data.metadata.duration} 
    ${c.bld}${c.g}📅 
    ${c.rst}${c.w}${tanggalTampil} 
    ${c.bld}${c.cy}⏰ 
    ${c.rst}${c.w}${jamTampil}${c.rst}`); 
    console.log(`${c.bld}${c.cy}👥 
    ${c.rst}${c.w}TOTAL PENONTON: 
    ${c.bld}${c.g}${formatNumber(data.metadata.totalUsers)}${c.rst}`); 
    console.log(`${c.bld}${c.y}🎁 
    ${c.rst}${c.w}TOTAL GIFT: 
    ${formatNumber(data.metadata.totalGiftDiamond)} 
    💎 = 
    ${c.g}${formatRupiah(data.metadata.totalGiftRupiah)} 
    ${c.w}/ 
    ${c.g}${formatRinggit(data.metadata.totalGiftRinggit)} 
    ${c.w}/ 
    ${c.g}${formatShekel(data.metadata.totalGiftShekel 
    || 
    data.metadata.totalGiftDiamond 
    * DIAMOND_TO_ILS)}${c.rst}`); 
    console.log(`${c.bld}${c.r}❤️ 
    ${c.rst}${c.w}TOTAL LIKE: 
    ${formatNumber(data.metadata.totalLike)}${c.rst}`); 
    console.log(`${c.bld}${c.g}📤 
    ${c.rst}${c.w}TOTAL SHARE: 
    ${formatNumber(data.metadata.totalShare)}${c.rst}`); 
    console.log(`${c.bld}${c.m}💬 
    ${c.rst}${c.w}TOTAL KOMENTAR: 
    ${formatNumber(data.metadata.totalComments)}${c.rst}`); 
    console.log(line); 
    console.log(''); 
    data.viewers.forEach((v, i) => 
    {
      const hostTag = v.isHost ? ' 
      🎯 HOST' : ''; const modTag 
      = v.isModerator ? ' ⭐' : 
      ''; const badges = []; if 
      (v.isFollower) 
      badges.push('👥'); if 
      (v.enterCount > 1) 
      badges.push(`🔄 
      ${v.enterCount}x`); const 
      badgeStr = badges.length > 0 
      ? ' ' + badges.join(' ') : 
      ''; const nomorUrut = 
      String(i + 1).padStart(4, ' 
      '); 
      console.log(`╔══════════════════════════════════════════════════════════════╗`); 
      console.log(`║ 
      ${c.bld}${c.y}${nomorUrut}. 
      👤 NIKNAME : 
      ${c.rst}${c.w}${v.nickname}${hostTag}${modTag}${badgeStr}${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bld}${c.cy}🔖 USERNAME : 
      ${c.rst}${c.w}@${v.username}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.o}👥 FOLLOWERS : 
      ${c.rst}${c.w}${formatNumber(v.followers 
      || 0)}${c.rst}`);
      console.log(`║ 
      ${c.bld}${c.cy}👥 FOLLOWING 
      : 
      ${c.rst}${c.w}${formatNumber(v.following 
      || 0)}${c.rst}`);
      console.log(`║ 
      ${c.bld}${c.m}🆔 USER ID : 
      ${c.rst}${c.w}${v.userId || 
      '-'}${c.rst}`); if 
      (v.secUid) console.log(`║ 
      ${c.bld}${c.p}🔑 UID 
      SESSION: 
      ${c.rst}${c.w}${v.secUid}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.g}🔗 LINK AKUN : 
      ${c.rst}${c.w}${v.linkAkun}${c.rst}`); 
      const followStateViewer = 
      v.followStateText || 
      (v.isHost ? '🎯 Host 
      Sendiri' : (v.isModerator ? 
      '🤝 Berteman dengan Host 
      [MOD]' : (v.isHostFriend ? 
      '🤝 Berteman dengan Host' : 
      '👤 Belum Berteman'))); 
      console.log(`║ 
      ${c.bld}${c.g}📊 FOLLOW 
      STAT: 
      ${c.rst}${c.w}${followStateViewer}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.y}🎁 TOTAL GIFT 
      : 
      ${c.rst}${c.w}${formatNumber(v.totalGiftDiamond)} 
      💎${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bld}${c.r}❤️ 
      ${c.rst}${c.w}${formatNumber(v.totalLike)}${c.rst} 
      ${c.bld}${c.m}💬 
      ${c.rst}${c.w}${formatNumber(v.totalComment)}${c.rst} 
      ${c.bld}${c.cy}📤 
      ${c.rst}${c.w}${formatNumber(v.totalShare)}${c.rst}`); 
      if (v.totalGiftReceived > 0) 
      {
        console.log(`║ 
        ${c.bld}${c.bgG}${c.w}🎁 
        TERIMA: 
        ${formatNumber(v.totalGiftReceived)} 
        💎 = 
        ${c.g}${formatRupiah(v.totalGiftReceived 
        * DIAMOND_TO_IDR)} ${c.w}/ 
        ${c.g}${formatRinggit(v.totalGiftReceived 
        * DIAMOND_TO_MYR)} ${c.w}/ 
        ${c.g}${formatShekel(v.totalGiftReceived 
        * 
        DIAMOND_TO_ILS)}${c.rst}`);
      }
      console.log(`╚══════════════════════════════════════════════════════════════╝`); 
      console.log('');
    });
    if (data.metadata.langStats && 
    Object.keys(data.metadata.langStats).length 
    > 0) {
      const total = 
      Object.values(data.metadata.langStats).reduce((a,b)=>a+b,0); 
      const langs = 
      Object.entries(data.metadata.langStats)
        .map(([code, count]) => { 
          const info = 
          langName(code); return { 
          code, count, name: 
          info.name, flag: 
          info.flag, percent: 
          ((count / total) * 
          100).toFixed(1) };
        })
        .sort((a, b) => b.count - 
        a.count);
      renderLangStats(langs, '🌐 
      STATISTIK BAHASA 🌐');
    }
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showViewerHistory());
  });
}
function showModeratorHistory() { 
  console.clear(); 
  console.log(`${c.bgY}${c.w}${c.bld} 
  ═══ HISTORI MODERATOR ═══ 
  ${c.rst}\n`); const files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('moderators_') 
  && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada histori 
    moderator.${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER...${c.rst}`, () => 
    showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showModeratorHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); const line = 
    `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
    console.log(`${c.bgY}${c.w}${c.bld} 
    ═══ DETAIL MODERATOR ═══ 
    ${c.rst}\n`); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull; if 
    (!tanggalTampil && 
    data.metadata.hari) {
      tanggalTampil = 
      `${data.metadata.hari}, 
      ${data.metadata.tgl} 
      ${data.metadata.bln} 
      ${data.metadata.thn}`;
    }
    if (!tanggalTampil) { const sd 
      = new 
      Date(data.metadata.startTime); 
      tanggalTampil = 
      sd.toLocaleDateString('id-ID', 
      {
        weekday: 'long', day: 
        'numeric', month: 'long', 
        year: 'numeric'
      });
    }
    const jamTampil = 
    data.metadata.jam || new 
    Date(data.metadata.startTime).toLocaleTimeString('id-ID'); 
    console.log(`${c.bld}${c.cy}⏱️ 
    ${c.rst}${c.w}${data.metadata.duration 
    || '0d'} ${c.bld}${c.g}📅 
    ${c.rst}${c.w}${tanggalTampil} 
    ${c.bld}${c.cy}⏰ 
    ${c.rst}${c.w}${jamTampil}${c.rst}`); 
    console.log(`${c.bld}${c.cy}⭐ 
    ${c.rst}${c.w}TOTAL MODERATOR: 
    ${c.bld}${c.g}${data.metadata.totalModerators}${c.rst}`); 
    console.log(line); 
    console.log(''); 
    data.moderators.forEach((m, i) 
    => {
      const nickname = m.nickname 
      || m.username;
      const username = m.username; 
      const userId = m.userId || 
      '-'; const link = m.link || 
      `https://tiktok.com/@${username}`; 
      const followers = 
      m.followers || 0; const 
      following = m.following || 
      0; const bio = m.bio || 
      null; const totalGift = 
      m.totalGiftDiamond || 0; 
      const totalLike = 
      m.totalLike || 0; const 
      totalComment = 
      m.totalComment || 0; const 
      totalShare = m.totalShare || 
      0; const enterCount = 
      m.enterCount || 1; const 
      isFollower = m.isFollower || 
      false; const nomorUrut = 
      String(i + 1).padStart(4, ' 
      '); 
      console.log(`╔══════════════════════════════════════════════════════════════╗`); 
      console.log(`║ 
      ${c.bld}${c.y}${nomorUrut}. 
      👤 NIKNAME : 
      ${c.rst}${c.w}${nickname}${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bld}${c.cy}🔖 USERNAME : 
      ${c.rst}${c.w}@${username}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.m}🆔 USER ID : 
      ${c.rst}${c.w}${userId}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.g}🔗 URL : 
      ${c.rst}${c.w}${link}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.o}👥 FOLLOWERS : 
      ${c.rst}${c.w}${formatNumber(followers)}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.cy}👥 FOLLOWING 
      : 
      ${c.rst}${c.w}${formatNumber(following)}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.g}📊 FOLLOW 
      STAT: ${c.rst}${c.w}🤝 
      Berteman dengan Host 
      [MOD]${c.rst}`); if (bio) {
        console.log(`║ 
        ${c.bld}${c.m}📝 BIO : 
        ${c.rst}${c.w}"${bio}"${c.rst}`);
      } else {
        console.log(`║ 
        ${c.bld}${c.m}📝 BIO : 
        ${c.rst}${c.y}(tidak ada 
        bio)${c.rst}`);
      }
      console.log(`║ 
      ${c.bld}${c.w}📱 PERANGKAT : 
      ${c.rst}${c.w}${m.deviceBrand 
      || m.deviceModel ? '📱 HP' : 
      '📱 HP'}${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bld}${c.y}🎁 TOTAL GIFT 
      : 
      ${c.rst}${c.w}${formatNumber(totalGift)} 
      💎${c.rst}`); if (totalGift 
      > 0) {
        console.log(`║ 
        ${c.bld}${c.g} 💰 
        ${formatRupiah(totalGift * 
        DIAMOND_TO_IDR)} ${c.w}/ 
        ${c.g}${formatRinggit(totalGift 
        * DIAMOND_TO_MYR)} ${c.w}/ 
        ${c.g}${formatShekel(totalGift 
        * 
        DIAMOND_TO_ILS)}${c.rst}`);
      }
      console.log(`║ 
      ${c.bld}${c.r}❤️ 
      ${formatNumber(totalLike)} 
      like ${c.m}💬 
      ${formatNumber(totalComment)} 
      komentar ${c.cy}📤 
      ${formatNumber(totalShare)} 
      share${c.rst}`); if 
      (enterCount > 1) {
        console.log(`║ 
        ${c.bld}${c.b}🔄 
        ${enterCount}x 
        MASUK${c.rst}${isFollower 
        ? ` ${c.bgC}${c.w}${c.bld} 
        👥 FOLLOWER BARU ${c.rst}` 
        : ''}`);
      } else if (isFollower) {
        console.log(`║ 
        ${c.bld}${c.bgC}${c.w}${c.bld} 
        👥 FOLLOWER BARU 
        ${c.rst}`);
      }
      console.log(`╚══════════════════════════════════════════════════════════════╝`); 
      console.log('');
    });
    
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showModeratorHistory());
  });
}
function showReportHistory() { 
  console.clear(); 
  console.log(`${c.bgR}${c.w}${c.bld} 
  ═══ HISTORI LAPORAN ═══ 
  ${c.rst}\n`); const files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('reports_') && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada laporan.${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER...${c.rst}`, () => 
    showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showReportHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); const line = 
    `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
    console.log(`${c.bgR}${c.w}${c.bld} 
    ═══ DETAIL LAPORAN ═══ 
    ${c.rst}\n`); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull || 
    (data.metadata.hari ? 
    `${data.metadata.hari}, 
    ${data.metadata.tgl} 
    ${data.metadata.bln} 
    ${data.metadata.thn}` : new 
    Date(data.metadata.startTime).toLocaleDateString('id-ID', 
    { weekday: 'long', day: 
    'numeric', month: 'long', 
    year: 'numeric' })); 
    console.log(`${c.bld}${c.g}📅 
    ${c.rst}${c.w}${tanggalTampil}${c.rst}`); 
    console.log(`${c.bld}${c.r}🚨 
    ${c.rst}${c.w}TOTAL LAPORAN: 
    ${c.bld}${c.g}${data.metadata.totalReports}${c.rst}`); 
    console.log(line); 
    console.log(''); 
    data.reports.forEach((r, i) => 
    {
      const modTag = r.isModerator 
      ? ' ⭐' : ''; const hostTag 
      = r.isHost ? ' 🎯' : ''; 
      const nomorUrut = String(i + 
      1).padStart(4, ' '); 
      console.log(`${c.bld}${c.cy}${nomorUrut}.${c.rst} 
      ${c.bld}${c.g}[${r.waktu}]${c.rst} 
      ${c.bld}${c.r}🚨 
      @${r.pelapor}${hostTag}${modTag}${c.rst}`); 
      console.log(` 
      ${c.bld}${c.r}📝 
      ${r.komentar}${c.rst}`); 
      console.log(` 
      ${c.bld}${c.y}⚖️ Jenis: 
      ${r.jenisPelanggaran}${c.rst}`); 
      if (r.bahasa) console.log(` 
      ${c.bld}${c.b}🌐 Bahasa: 
      ${r.bahasa}${c.rst}`); 
      console.log('');
    });
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showReportHistory());
  });
}
function showFollowHistory() { 
  console.clear(); 
  console.log(`${c.bgG}${c.w}${c.bld} 
  ═══ HISTORI FOLLOW ═══ 
  ${c.rst}\n`); const files = 
  fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
  => f.startsWith('follows_') && 
  f.endsWith('.json')).sort().reverse(); 
  if (!files.length) {
    console.log(`${c.y}📭 Belum 
    ada histori follow.${c.rst}`); 
    rl.question(`\n${c.y}Tekan 
    ENTER...${c.rst}`, () => 
    showMainMenu()); return;
  }
  files.forEach((f, i) => 
  console.log(`${c.cy}[${i+1}]${c.rst} 
  ${c.w}${f}${c.rst}`)); 
  rl.question(`\n${c.y}Pilih nomor 
  (0 kembali): ${c.rst}`, (n) => {
    const idx = parseInt(n)-1; if 
    (n === '0') { showMainMenu(); 
    return; } if (idx < 0 || idx 
    >= files.length) { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showFollowHistory, 
    1500); return; } const data = 
    JSON.parse(fs.readFileSync(path.join(CONFIG.HISTORY_DIR, 
    files[idx]), 'utf8')); 
    console.clear(); const line = 
    `${c.bld}${c.cy}══════════════════════<{${c.y}${c.bld}313_ESBOL_313${c.cy}}>═══════════════════════${c.rst}`; 
    console.log(`${c.bgG}${c.w}${c.bld} 
    ═══ DETAIL FOLLOW ═══ 
    ${c.rst}\n`); 
    console.log(`${c.bld}${c.y}🎬 
    ${c.rst}${c.w}@${data.metadata.target} 
    ${c.bld}${c.b}🆔 
    ${c.rst}${c.w}${data.metadata.roomId}`); 
    let tanggalTampil = 
    data.metadata.tanggalFull || 
    (data.metadata.hari ? 
    `${data.metadata.hari}, 
    ${data.metadata.tgl} 
    ${data.metadata.bln} 
    ${data.metadata.thn}` : new 
    Date(data.metadata.startTime).toLocaleDateString('id-ID', 
    { weekday: 'long', day: 
    'numeric', month: 'long', 
    year: 'numeric' })); 
    console.log(`${c.bld}${c.g}📅 
    ${c.rst}${c.w}${tanggalTampil}${c.rst}`); 
    console.log(`${c.bld}${c.g}👥 
    ${c.rst}${c.w}TOTAL FOLLOW: 
    ${c.bld}${c.g}${data.metadata.totalFollows}${c.rst}`); 
    console.log(`${c.bld}${c.g}📤 
    ${c.rst}${c.w}TOTAL SHARE: 
    ${c.bld}${c.g}${formatNumber(data.metadata.totalShare 
    || 0)}${c.rst}`);
    console.log(line); 
    console.log(''); 
    data.follows.forEach((f, i) => 
    {
      const nomorUrut = String(i + 
      1).padStart(4, ' '); 
      console.log(`╔══════════════════════════════════════════════════════════════╗`); 
      console.log(`║ 
      ${c.bld}${c.y}${nomorUrut}. 
      👤 FOLLOW #${i+1}${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      console.log(`║ 
      ${c.bgC}${c.w}${c.bld} 👤 
      YANG FOLLOW ${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.y} 👤 NAME : 
      ${c.rst}${c.w}${f.nickname}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.cy} 🔖 USERNAME: 
      ${c.rst}${c.w}@${f.username}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.o} 👥 FOLLOWERS: 
      ${c.rst}${c.w}${formatNumber(f.followers 
      || 0)}${c.rst}`);
      console.log(`║ 
      ${c.bld}${c.cy} 👥 
      FOLLOWING: 
      ${c.rst}${c.w}${formatNumber(f.following 
      || 0)}${c.rst}`);
      console.log(`║ 
      ${c.bld}${c.g} 📊 FOLLOW 
      STAT: ${c.rst}${c.w}🤝 
      Berteman dengan 
      Host${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.g} 🔗 URL : 
      ${c.rst}${c.w}${f.link}${c.rst}`); 
      console.log(`╠══════════════════════════════════════════════════════════════╣`); 
      if (f.followedUsername) {
        console.log(`║ 
        ${c.bgY}${c.w}${c.bld} 🎯 
        YANG DI-FOLLOW ${c.rst}`); 
        console.log(`║ 
        ${c.bld}${c.y} 👤 NAME : 
        ${c.rst}${c.w}${f.followedNickname 
        || 
        f.followedUsername}${c.rst}`); 
        console.log(`║ 
        ${c.bld}${c.cy} 🔖 
        USERNAME: 
        ${c.rst}${c.w}@${f.followedUsername}${c.rst}`); 
        console.log(`║ 
        ${c.bld}${c.o} 👥 
        FOLLOWERS: 
        ${c.rst}${c.w}${formatNumber(f.followedFollowers 
        || 0)}${c.rst}`);
        console.log(`║ 
        ${c.bld}${c.cy} 👥 
        FOLLOWING: 
        ${c.rst}${c.w}${formatNumber(f.followedFollowing 
        || 0)}${c.rst}`);
        console.log(`║ 
        ${c.bld}${c.g} 🔗 URL : 
        ${c.rst}${c.w}${f.followedLink 
        || ('https://tiktok.com/@' 
        + 
        f.followedUsername)}${c.rst}`); 
        console.log(`╠══════════════════════════════════════════════════════════════╣`);
      }
      console.log(`║ 
      ${c.bld}${c.cy}⏰ WAKTU: 
      ${c.rst}${c.w}${f.waktu}${c.rst}`); 
      console.log(`║ 
      ${c.bld}${c.g}📤 TOTAL 
      SHARE: 
      ${c.rst}${c.w}${formatNumber(data.metadata.totalShare 
      || 0)}${c.rst}`);
      console.log(`╚══════════════════════════════════════════════════════════════╝`); 
      console.log('');
    });
    rl.question(`\n${c.y}Tekan 
    ENTER kembali...${c.rst}`, () 
    => showFollowHistory());
  });
}
function deleteHistory() { 
  console.clear(); 
  console.log(`${c.bgR}${c.w}${c.bld} 
  ═══ HAPUS HISTORI ═══ 
  ${c.rst}\n`); 
  console.log(`${c.bld}${c.y}1. 
  ${c.rst}Hapus Histori 
  Komentar`); 
  console.log(`${c.bld}${c.y}2. 
  ${c.rst}Hapus Histori 
  Penonton`); 
  console.log(`${c.bld}${c.y}3. 
  ${c.rst}Hapus Histori 
  Moderator`); 
  console.log(`${c.bld}${c.y}4. 
  ${c.rst}Hapus Histori Laporan`); 
  console.log(`${c.bld}${c.y}5. 
  ${c.rst}Hapus Histori Follow`); 
  console.log(`${c.bld}${c.y}6. 
  ${c.rst}Hapus Semua Histori`); 
  console.log(`${c.bld}${c.y}0. 
  ${c.rst}Kembali`); 
  rl.question(`\n${c.cy}Pilih: 
  ${c.rst}`, (choice) => {
    const patterns = { '1': 
    'comments_', '2': 'viewers_', 
    '3': 'moderators_', '4': 
    'reports_', '5': 'follows_' }; 
    if (choice === '0') { 
    showMainMenu(); return; } 
    const pattern = 
    patterns[choice]; if (!pattern 
    && choice !== '6') { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(deleteHistory, 
    1500); return; } const files = 
    choice === '6'
      ? 
      fs.readdirSync(CONFIG.HISTORY_DIR)
      : fs.readdirSync(CONFIG.HISTORY_DIR).filter(f 
      : => f.startsWith(pattern));
    if (!files.length) { 
    console.log(`${c.y}📭 Tidak 
    ada histori${c.rst}`); 
    setTimeout(deleteHistory, 
    1500); return; } 
    files.forEach(f => 
    fs.unlinkSync(path.join(CONFIG.HISTORY_DIR, 
    f))); console.log(`${c.g}✅ 
    Histori dihapus!${c.rst}`); 
    setTimeout(deleteHistory, 
    1500);
  });
}
function showMainMenu() { 
  console.clear(); 
  console.log(`${c.r}${c.bld} 
  ██████╗ ██████╗ ███████╗██████╗ 
  █████╗ ████████╗ ██████╗ ██████╗ 
  ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗ 
  ██████╔╝██████╔╝█████╗ ██║ 
  ██║███████║ ██║ ██║ ██║██████╔╝ 
  ██╔═══╝ ██╔══██╗██╔══╝ ██║ 
  ██║██╔══██║ ██║ ██║ ██║██╔══██╗ 
  ██║ ██║ ██║███████╗██████╔╝██║ 
  ██║ ██║ ╚██████╔╝██║ ██║ ╚═╝ ╚═╝ 
  ╚═╝╚══════╝╚═════╝ ╚═╝ ╚═╝ ╚═╝ 
  ╚═════╝ ╚═╝ ╚═╝${c.rst}`); 
  console.log(`${c.y}${c.bld} 
  ((-CREATED BY ESBOL-TIKTOK LIVE 
  MONITOR V4.3-))${c.rst}`); 
  console.log(`${c.w}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.rst}\n`); 
  console.log(`${c.g}${c.bld}╔══════════════════════════════════════════════════════════════╗${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.y}${c.bld}MENU UTAMA${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}╠══════════════════════════════════════════════════════════════╣${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[1]${c.rst} 
  ${c.w}Start Monitor live${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[2]${c.rst} 
  ${c.w}Lihat Histori 
  Komentar${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[3]${c.rst} 
  ${c.w}Lihat Histori 
  Penonton${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[4]${c.rst} 
  ${c.w}Lihat Hasil Live 
  Terakhir${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[5]${c.rst} 
  ${c.w}Lihat History Pemberi 
  GIFT${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[6]${c.rst} 
  ${c.w}Lihat History Penerima 
  GIFT${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[7]${c.rst} 
  ${c.w}Hapus Histori${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[8]${c.rst} 
  ${c.w}Lihat Histori 
  Moderator${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[9]${c.rst} 
  ${c.w}Lihat Histori 
  Laporan${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[10]${c.rst} 
  ${c.w}Lihat Histori 
  Follow${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}║${c.rst} 
  ${c.bld}${c.cy}[0]${c.rst} 
  ${c.r}Keluar${c.rst} 
  ${c.g}${c.bld}${c.rst}`); 
  console.log(`${c.g}${c.bld}╚══════════════════════════════════════════════════════════════╝${c.rst}\n`); 
  rl.question(`${c.y}${c.bld}➤ 
  Pilih menu [0-10]: ${c.rst}`, 
  (choice) => {
    if (choice === '1') { 
      rl.question(`${c.cy}➤ 
      Username TikTok (tanpa @): 
      ${c.rst}`, (user) => {
        if (!user.trim()) { 
        console.log(`${c.r}❌ 
        Kosong!${c.rst}`); 
        setTimeout(showMainMenu, 
        1500); return; } 
        startMonitoring(user.trim());
      });
    } else if (choice === '2') { 
    } showCommentHistory(); }
    else if (choice === '3') { 
    showViewerHistory(); } else if 
    (choice === '4') { 
    showLastLiveResult(); } else 
    if (choice === '5') { 
    showGiverHistory(); } else if 
    (choice === '6') { 
    showRecipientHistory(); } else 
    if (choice === '7') { 
    deleteHistory(); } else if 
    (choice === '8') { 
    showModeratorHistory(); } else 
    if (choice === '9') { 
    showReportHistory(); } else if 
    (choice === '10') { 
    showFollowHistory(); } else if 
    (choice === '0') { 
    console.log(`\n${c.g}👋 Sampai 
    jumpa!${c.rst}`); 
    process.exit(0); } else { 
    console.log(`${c.r}❌ 
    Salah!${c.rst}`); 
    setTimeout(showMainMenu, 
    1500); }
  });
}
process.on('SIGINT', () => { 
  console.log(`\n${c.y}⚠️ 
  Menghentikan 
  program...${c.rst}`); if 
  (headerInterval) 
  clearInterval(headerInterval); 
  if (monitoringActive && 
  Object.keys(users).length > 0) {
    try { saveCommentHistory(); 
      saveViewerHistory(); 
      saveReportHistory(); 
      saveModeratorHistory(); 
      saveFollowHistory(); 
      saveLiveResult();
    } catch (e) {}
  }
  console.log(`\n ${c.r}${c.bld}⚠️ 
  TETAPLAH WASPADA TUAN MUDA! 
  ⚠️${c.rst}\n`); process.exit(0);
});
console.clear();
showMainMenu();
