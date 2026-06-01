// --- 1. CONFIGURATION & STATE ---
const DEFAULT_SITES = [
    { name: "Telegram", domain: "https://t.me" },
    { name: "Instagram", domain: "https://instagram.com" },
    { name: "YouTube", domain: "https://youtube.com" },
    { name: "WhatsApp", domain: "https://whatsapp.com" },
    { name: "Google", domain: "https://google.com" }
];

const translations = {
    fa: {
        title: "سامانه پایش هوشمند فیلترینگ",
        subtitle: "بررسی چندلایه دسترسی به وب‌سایت‌ها بر اساس اختلالات شبکه",
        instantLabel: "🔍 تست سریع و آنی یک سایت",
        instantSubmitBtn: "بررسی آنی",
        addListLabel: "➕ افزودن وب‌سایت جدید به لیست پایش شما",
        listSubmitBtn: "افزودن به لیست",
        quickCheckTitle: "وضعیت سرویس‌های پایش شده",
        checkAllBtn: "تست همه همزمان ⚡",
        langButton: "English",
        statusChecking: "⏳ در حال بررسی...",
        statusOnline: "🟢 آزاد",
        statusBlocked: "🔴 فیلتر/اختلال",
        statusSanctioned: "🚫 تحریم (خطای 403)",
        instantChecking: "در حال آنالیز کانال ارتباطی... لطفا صبر کنید.",
        instantAccessible: "✅ آزاد! این وب‌سایت در حال حاضر روی اینترنت شما فیلتر نیست.",
        instantBlocked: "❌ مسدود! ارتباط برقرار نشد؛ این سایت احتمالاً فیلتر است.",
        instantSanctioned: "🚫 تحریم! سرور مقصد متصل شد، اما دسترسی به کاربران ایرانی را مسدود کرده است.",
        credit: 'توسعه داده شده توسط <a href="https://github.com/DoctorWCoding" target="_blank" class="text-blue-400 hover:underline font-bold transition">Adrin Jomeh</a>',
        // New stats strings
        packetLoss: "از دست رفتن بسته:",
        avgLatency: "میانگین تاخیر:",
        minMax: "کمترین/بیشترین:"
    },
    en: {
        title: "Smart Censorship Monitor",
        subtitle: "Multi-layered accessibility check based on network anomalies",
        instantLabel: "🔍 Instant One-Time Website Checker",
        instantSubmitBtn: "Check Now",
        addListLabel: "➕ Add New Domain to Your Monitor List",
        listSubmitBtn: "Add to List",
        quickCheckTitle: "Monitored Services Status",
        checkAllBtn: "Check All Simultaneously ⚡",
        langButton: "فارسی",
        statusChecking: "⏳ Checking...",
        statusOnline: "🟢 Online",
        statusBlocked: "🔴 Blocked",
        statusSanctioned: "🚫 Sanctioned (403)",
        instantChecking: "Analyzing network packets... Please wait.",
        instantAccessible: "✅ Free! This website is fully accessible on your connection.",
        instantBlocked: "❌ Blocked! Connection failed; this site is likely filtered.",
        instantSanctioned: "🚫 Sanctioned! The network connection succeeded, but the server is geoblocking your connection.",
        credit: 'Developed by <a href="https://github.com/DoctorWCoding" target="_blank" class="text-blue-400 hover:underline font-bold transition">Adrin Jomeh</a>',
        // New stats strings
        packetLoss: "Packet Loss:",
        avgLatency: "Avg Latency:",
        minMax: "Min/Max:"
    }
};

let currentLang = 'fa';
let customSites = JSON.parse(localStorage.getItem('custom_monitor_sites')) || DEFAULT_SITES;

// --- 2. THE LOCAL DEVICE NETWORK CHECKING ENGINE (SINGLE PING) ---
function singlePingAttempt(originUrl) {
    return new Promise((resolve) => {
        const uniqueUrl = `${originUrl}/?cb=${Date.now()}_${Math.random()}`;
        const startTime = performance.now();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            resolve({ success: false, status: 'blocked', ms: 4000 });
        }, 4000);

        fetch(uniqueUrl, { 
            mode: 'no-cors', 
            credentials: 'omit',
            signal: controller.signal 
        })
        .then(() => {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);
            resolve({ success: true, status: 'online', ms: duration });
        })
        .catch((error) => {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);

            if (error.name === 'AbortError') return;

            if (duration < 150) {
                resolve({ success: false, status: 'sanctioned', ms: duration });
            } else if (duration >= 150 && duration < 800) {
                resolve({ success: true, status: 'online', ms: duration }); // CORS Succeeded Connection
            } else {
                resolve({ success: false, status: 'blocked', ms: duration });
            }
        });
    });
}

// Multi-Ping Engine to calculate Statistics
async function runMultiPingDiagnostics(url) {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }
    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin;

    let attempts = [];
    // Perform 4 sequential test bursts
    for (let i = 0; i < 4; i++) {
        const res = await singlePingAttempt(origin);
        attempts.push(res);
        // Small 60ms breath between bursts to simulate network intervals
        await new Promise(r => setTimeout(r, 60));
    }

    const successes = attempts.filter(a => a.success || a.status === 'sanctioned');
    const totalPings = attempts.length;
    const lossCount = attempts.filter(a => a.status === 'blocked').length;
    const packetLossRate = Math.round((lossCount / totalPings) * 100);

    // Default macro status resolution
    let finalStatus = 'blocked';
    if (attempts.filter(a => a.status === 'sanctioned').length >= 2) {
        finalStatus = 'sanctioned';
    } else if (successes.length > 0) {
        finalStatus = 'online';
    }

    // Process timing trends if connections succeeded
    let validMs = attempts.filter(a => a.status !== 'blocked').map(a => a.ms);
    if (validMs.length === 0) validMs = [4000];

    const minMs = Math.min(...validMs);
    const maxMs = Math.max(...validMs);
    const avgMs = Math.round(validMs.reduce((sum, val) => sum + val, 0) / validMs.length);

    return {
        status: finalStatus,
        lossRate: packetLossRate,
        avg: avgMs,
        min: minMs,
        max: maxMs
    };
}

// --- 3. UI RENDERING & TRANSLATION PIPELINE ---
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    const html = document.getElementById('htmlTag');
    
    html.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);

    document.getElementById('title').innerText = t.title;
    document.getElementById('subtitle').innerText = t.subtitle;
    document.getElementById('instantLabel').innerText = t.instantLabel;
    document.getElementById('instantSubmitBtn').innerText = t.instantSubmitBtn;
    document.getElementById('addListLabel').innerText = t.addListLabel;
    document.getElementById('listSubmitBtn').innerText = t.listSubmitBtn;
    document.getElementById('quickCheckTitle').innerText = t.quickCheckTitle;
    document.getElementById('checkAllBtn').innerText = t.checkAllBtn;
    document.getElementById('langToggle').innerText = t.langButton;
    
    document.getElementById('creditText').innerHTML = t.credit;

    document.getElementById('instantResult').classList.add('hidden');
    renderMonitorGrid();
}

function renderMonitorGrid() {
    const grid = document.getElementById('targetsGrid');
    grid.innerHTML = '';

    customSites.forEach((site, index) => {
        const wrapper = document.createElement('div');
        // Added flex-col to make space for the statistical analytics drawer underneath
        wrapper.className = "flex flex-col bg-gray-700/50 p-3 rounded-xl border border-gray-600/40 hover:border-gray-500 transition shadow-sm space-y-2";
        
        wrapper.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div class="flex flex-col">
                    <span class="font-bold text-white text-xs md:text-sm">${site.name}</span>
                    <span class="text-[11px] text-gray-400 font-mono tracking-tight select-all">${site.domain.replace(/^https?:\/\//,'')}</span>
                </div>
                <div class="flex items-center space-x-2 space-x-reverse">
                    <span id="site-ms-${index}" class="text-[10px] font-mono text-gray-400 hidden bg-gray-900/60 px-1.5 py-0.5 rounded"></span>
                    <span id="site-status-${index}" class="text-xs font-semibold bg-gray-800 px-3 py-1 rounded-md border border-gray-700 min-w-[80px] text-center cursor-pointer hover:bg-gray-700 transition">تست</span>
                    <button onclick="removeCustomSite(${index})" class="text-gray-500 hover:text-red-400 text-xs px-1 transition cursor-pointer" title="Delete">🗑️</button>
                </div>
            </div>
            <!-- Live Statistical Analytics Panel -->
            <div id="site-stats-panel-${index}" class="hidden grid grid-cols-3 gap-2 border-t border-gray-600/30 pt-2 text-[10px] text-gray-400 font-mono">
                <div>${translations[currentLang].packetLoss} <span id="stat-loss-${index}" class="font-bold text-gray-300">0%</span></div>
                <div>${translations[currentLang].avgLatency} <span id="stat-avg-${index}" class="font-bold text-gray-300">0ms</span></div>
                <div>${translations[currentLang].minMax} <span id="stat-minmax-${index}" class="font-bold text-gray-300">0/0</span></div>
            </div>
        `;
        
        wrapper.querySelector(`#site-status-${index}`).addEventListener('click', () => runGridItemTest(site.domain, index));
        grid.appendChild(wrapper);
    });
}

// --- 4. RUNNING TEST ACTION OPERATIONS ---
async function runGridItemTest(domain, index) {
    const statusLabel = document.getElementById(`site-status-${index}`);
    const msLabel = document.getElementById(`site-ms-${index}`);
    const statsPanel = document.getElementById(`site-stats-panel-${index}`);
    const t = translations[currentLang];

    statusLabel.className = "text-xs font-semibold bg-yellow-950/40 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded-md text-center animate-pulse";
    statusLabel.innerText = t.statusChecking;
    
    msLabel.classList.add('hidden');
    statsPanel.classList.add('hidden');

    // Run the multi-ping statistical diagnostics engine
    const data = await runMultiPingDiagnostics(domain);

    msLabel.innerText = `${data.avg}ms`;
    msLabel.classList.remove('hidden');

    // Inject calculated metrics straight into the DOM elements
    document.getElementById(`stat-loss-${index}`).innerText = `${data.lossRate}%`;
    document.getElementById(`stat-avg-${index}`).innerText = `${data.avg}ms`;
    document.getElementById(`stat-minmax-${index}`).innerText = `${data.min}/${data.max}ms`;
    
    // Highlight severe packet loss with warning styles
    if (data.lossRate > 0 && data.lossRate < 100) {
        document.getElementById(`stat-loss-${index}`).className = "font-bold text-orange-400 animate-pulse";
    } else if (data.lossRate === 100) {
        document.getElementById(`stat-loss-${index}`).className = "font-bold text-red-400";
    } else {
        document.getElementById(`stat-loss-${index}`).className = "font-bold text-green-400";
    }

    statsPanel.classList.remove('hidden');
    statsPanel.classList.add('grid');

    if (data.status === 'online') {
        statusLabel.className = "text-xs font-semibold bg-green-950/40 text-green-400 border border-green-700/50 px-3 py-1 rounded-md text-center";
        statusLabel.innerText = t.statusOnline;
    } else if (data.status === 'sanctioned') {
        statusLabel.className = "text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-700/50 px-3 py-1 rounded-md text-center";
        statusLabel.innerText = t.statusSanctioned;
    } else {
        statusLabel.className = "text-xs font-semibold bg-red-950/40 text-red-400 border border-red-700/50 px-3 py-1 rounded-md text-center";
        statusLabel.innerText = t.statusBlocked;
    }
}

function removeCustomSite(index) {
    customSites.splice(index, 1);
    localStorage.setItem('custom_monitor_sites', JSON.stringify(customSites));
    renderMonitorGrid();
}

// --- 5. EVENT SUBMISSION LISTENERS ---

// FORM 1 Trigger: Instant One-Time Check (Calculates average using 3 multi-pings)
document.getElementById('instantCheckerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const input = document.getElementById('instantUrlInput').value.trim();
    const resultDiv = document.getElementById('instantResult');
    const t = translations[currentLang];

    resultDiv.className = "mt-3 p-3 rounded-xl text-center font-medium bg-gray-700 text-gray-300 border-gray-600";
    resultDiv.innerText = t.instantChecking;
    resultDiv.classList.remove('hidden');

    const execution = await runMultiPingDiagnostics(input);

    if (execution.status === 'online') {
        resultDiv.className = "mt-3 p-3 rounded-xl text-center font-bold bg-green-950/40 text-green-400 border-green-600/50 text-xs md:text-sm";
        resultDiv.innerText = `${t.instantAccessible} (${execution.avg}ms)`;
    } else if (execution.status === 'sanctioned') {
        resultDiv.className = "mt-3 p-3 rounded-xl text-center font-bold bg-amber-950/40 text-amber-400 border-amber-600/50 text-xs md:text-sm";
        resultDiv.innerText = `${t.instantSanctioned} (${execution.avg}ms)`;
    } else {
        resultDiv.className = "mt-3 p-3 rounded-xl text-center font-bold bg-red-950/40 text-red-400 border-red-600/50 text-xs md:text-sm";
        resultDiv.innerText = `${t.instantBlocked} (Loss: ${execution.lossRate}%)`;
    }
});

// FORM 2 Trigger: Persistent Append Array List
document.getElementById('addToListForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('listUrlInput').value.trim();
    if(!input) return;

    let cleanDomain = input;
    if (!/^https?:\/\//i.test(cleanDomain)) {
        cleanDomain = 'https://' + cleanDomain;
    }

    try {
        const urlObj = new URL(cleanDomain);
        const name = urlObj.hostname.replace('www.', '');
        
        customSites.push({ name: name, domain: urlObj.origin });
        localStorage.setItem('custom_monitor_sites', JSON.stringify(customSites));
        
        document.getElementById('listUrlInput').value = '';
        renderMonitorGrid();
    } catch(err) {
        alert("Invalid URL Format.");
    }
});

// Global Controls Links
document.getElementById('langToggle').addEventListener('click', () => {
    setLanguage(currentLang === 'fa' ? 'en' : 'fa');
});

document.getElementById('checkAllBtn').addEventListener('click', () => {
    customSites.forEach((site, index) => {
        runGridItemTest(site.domain, index);
    });
});

// Execute Lifecycle Initializer
setLanguage('fa');
