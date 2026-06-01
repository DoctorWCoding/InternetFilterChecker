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
        credit: 'توسعه داده شده توسط <a href="https://github.com/DoctorWCoding" target="_blank" class="text-blue-400 hover:underline font-bold transition">Adrin Jomeh</a>'
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
        credit: 'Developed by <a href="https://github.com/DoctorWCoding" target="_blank" class="text-blue-400 hover:underline font-bold transition">Adrin Jomeh</a>'
    }
};

let currentLang = 'fa';
let customSites = JSON.parse(localStorage.getItem('custom_monitor_sites')) || DEFAULT_SITES;

// --- 2. THE LOCAL DEVICE NETWORK CHECKING ENGINE ---
function smartCheckAccessibility(url) {
    return new Promise((resolve) => {
        let targetUrl = url.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        const urlObj = new URL(targetUrl);
        // Add a random parameter to prevent browser caching from masking network changes
        const uniqueUrl = `${urlObj.origin}/?cb=${Date.now()}`;
        const startTime = performance.now();

        // Strict 4-second cutoff for dropped packets (Filtering indicators)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            const duration = Math.round(performance.now() - startTime);
            resolve({ status: 'blocked', ms: duration });
        }, 4000);

        // 'no-cors' lets us poke the server handshake locally without falling into browser security blocks
        fetch(uniqueUrl, { 
            mode: 'no-cors', 
            credentials: 'omit',
            signal: controller.signal 
        })
        .then(() => {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);
            resolve({ status: 'online', ms: duration, code: "OK" });
        })
        .catch((error) => {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);

            if (error.name === 'AbortError') return;

            // NETWORK CENSORSHIP DETECTION RULE:
            // Iranian websites (.ir/aparat) should be checked locally.
            // If a foreign platform rejects us under 600ms, it's an immediate server-side geoblock.
            const isDomestic = urlObj.hostname.endsWith('.ir') || urlObj.hostname.includes('aparat');

            if (!isDomestic && duration < 600) {
                resolve({ status: 'sanctioned', ms: duration });
            } else {
                resolve({ status: 'blocked', ms: duration });
            }
        });
    });
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
        wrapper.className = "flex items-center justify-between bg-gray-700/50 p-3 rounded-xl border border-gray-600/40 hover:border-gray-500 transition shadow-sm";
        
        wrapper.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-white text-xs md:text-sm">${site.name}</span>
                <span class="text-[11px] text-gray-400 font-mono tracking-tight select-all">${site.domain.replace(/^https?:\/\//,'')}</span>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
                <span id="site-ms-${index}" class="text-[10px] font-mono text-gray-500 hidden"></span>
                <span id="site-status-${index}" class="text-xs font-semibold bg-gray-800 px-3 py-1 rounded-md border border-gray-700 min-w-[80px] text-center cursor-pointer hover:bg-gray-700 transition">تست</span>
                <button onclick="removeCustomSite(${index})" class="text-gray-500 hover:text-red-400 text-xs px-1 transition cursor-pointer" title="Delete">🗑️</button>
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
    const t = translations[currentLang];

    statusLabel.className = "text-xs font-semibold bg-yellow-950/40 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded-md text-center animate-pulse";
    statusLabel.innerText = t.statusChecking;
    msLabel.classList.add('hidden');

    const result = await smartCheckAccessibility(domain);

    msLabel.innerText = `${result.ms}ms`;
    msLabel.classList.remove('hidden');

    if (result.status === 'online') {
        statusLabel.className = "text-xs font-semibold bg-green-950/40 text-green-400 border border-green-700/50 px-3 py-1 rounded-md text-center";
        statusLabel.innerText = t.statusOnline;
    } else if (result.status === 'sanctioned') {
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

// FORM 1 Trigger: Instant Sandbox Checker
document.getElementById('instantCheckerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const input = document.getElementById('instantUrlInput').value.trim();
    const resultDiv = document.getElementById('instantResult');
    const t = translations[currentLang];

    resultDiv.className = "mt-3 p-3 rounded-xl text-center font-medium bg-gray-700 text-gray-300 border-gray-600";
    resultDiv.innerText = t.instantChecking;
    resultDiv.classList.remove('hidden');

    const execution = await smartCheckAccessibility(input);

    if (execution.status === 'online') {
        resultDiv.className = "mt-3 p-3 rounded-xl text-center font-bold bg-green-950/40 text-green-400 border-green-600/50 text-xs md:text-sm";
        resultDiv.innerText = `${t.instantAccessible} (${execution.ms}ms)`;
    } else if (execution.status === 'sanctioned') {
        resultDiv.className = "mt-3 p-3 rounded-xl text-center font-bold bg-amber-950/40 text-amber-400 border-amber-600/50 text-xs md:text-sm";
        resultDiv.innerText = `${t.instantSanctioned} (${execution.ms}ms)`;
    } else {
        resultDiv.className = "mt-3 p-3 rounded-xl text-center font-bold bg-red-950/40 text-red-400 border-red-600/50 text-xs md:text-sm";
        resultDiv.innerText = `${t.instantBlocked} (${execution.ms}ms)`;
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
