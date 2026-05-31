// --- 1. CONFIGURATION & TRANSLATIONS ---
const popularSites = [
    { name: "Telegram", domain: "https://t.me" },
    { name: "Instagram", domain: "https://instagram.com" },
    { name: "YouTube", domain: "https://youtube.com" },
    { name: "WhatsApp", domain: "https://whatsapp.com" },
    { name: "Google", domain: "https://google.com" },
    { name: "Wikipedia", domain: "https://wikipedia.org" }
];

const translations = {
    fa: {
        title: "آیا این سایت فیلتر است؟",
        subtitle: "بررسی دسترسی به وب‌سایت‌ها از روی اینترنت فعلی شما",
        inputLabel: "آدرس وب‌سایت",
        submitBtn: "بررسی وضعیت",
        quickCheckTitle: "تست سریع سرویس‌های محبوب",
        checkAllBtn: "تست همه همزمان ⚡",
        checking: "در حال بررسی... لطفا صبر کنید.",
        accessible: "✅ آزاد! این سایت روی اینترنت شما فیلتر نیست.",
        blocked: "❌ فیلتر یا در دسترس نیست! این سایت احتمالاً مسدود است.",
        langButton: "English"
    },
    en: {
        title: "Is it Blocked in Iran?",
        subtitle: "Check if a website is accessible on your current internet connection",
        inputLabel: "Website URL",
        submitBtn: "Check Status",
        quickCheckTitle: "Quick Popular Targets",
        checkAllBtn: "Check All Simultaneously ⚡",
        checking: "Checking... Please wait.",
        accessible: "✅ Accessible! This site is NOT filtered on your network.",
        blocked: "❌ Blocked / Unreachable. This site is likely filtered.",
        langButton: "فارسی"
    }
};

let currentLang = 'fa';

// --- 2. CORE LOGIC: THE CHECKER FUNCTION ---
async function checkWebsiteAccessibility(url) {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        await fetch(targetUrl, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        clearTimeout(timeoutId);
        return false;
    }
}

// --- 3. UI RENDERING & TRANSLATION LOGIC ---
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    const html = document.getElementById('htmlTag');
    
    if(lang === 'fa') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'fa');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
    }

    document.getElementById('title').innerText = t.title;
    document.getElementById('subtitle').innerText = t.subtitle;
    document.getElementById('inputLabel').innerText = t.inputLabel;
    document.getElementById('submitBtn').innerText = t.submitBtn;
    document.getElementById('quickCheckTitle').innerText = t.quickCheckTitle;
    document.getElementById('checkAllBtn').innerText = t.checkAllBtn;
    document.getElementById('langToggle').innerText = t.langButton;
    
    document.getElementById('result').classList.add('hidden');
    
    renderQuickGrid();
}

function renderQuickGrid() {
    const grid = document.getElementById('targetsGrid');
    grid.innerHTML = '';

    popularSites.forEach((site, index) => {
        const btn = document.createElement('button');
        btn.id = `site-btn-${index}`;
        btn.className = "flex justify-between items-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl border border-gray-600 transition text-sm cursor-pointer";
        
        btn.innerHTML = `
            <span>${site.name}</span>
            <span id="site-status-${index}" class="text-xs text-gray-400">•</span>
        `;
        
        btn.addEventListener('click', () => runIndividualQuickCheck(site.domain, index));
        grid.appendChild(btn);
    });
}

async function runIndividualQuickCheck(domain, index) {
    const statusIndicator = document.getElementById(`site-status-${index}`);
    statusIndicator.className = "text-xs text-yellow-400 animate-pulse font-bold";
    statusIndicator.innerText = "⏳";

    const isAccessible = await checkWebsiteAccessibility(domain);

    if(isAccessible) {
        statusIndicator.className = "text-xs text-green-400 font-bold";
        statusIndicator.innerText = "🟢";
    } else {
        statusIndicator.className = "text-xs text-red-500 font-bold";
        statusIndicator.innerText = "🔴";
    }
}

// --- 4. EVENT LISTENERS ---

document.getElementById('checkerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const input = document.getElementById('urlInput').value;
    const resultDiv = document.getElementById('result');
    const t = translations[currentLang];

    resultDiv.className = "mb-6 p-4 rounded-xl text-center font-medium bg-gray-700 text-gray-300 border-gray-600";
    resultDiv.innerText = t.checking;
    resultDiv.classList.remove('hidden');

    const accessible = await checkWebsiteAccessibility(input);

    if (accessible) {
        resultDiv.className = "mb-6 p-4 rounded-xl text-center font-bold bg-green-950/40 text-green-400 border-green-600/50";
        resultDiv.innerText = t.accessible;
    } else {
        resultDiv.className = "mb-6 p-4 rounded-xl text-center font-bold bg-red-950/40 text-red-400 border-red-600/50";
        resultDiv.innerText = t.blocked;
    }
});

document.getElementById('langToggle').addEventListener('click', () => {
    setLanguage(currentLang === 'fa' ? 'en' : 'fa');
});

document.getElementById('checkAllBtn').addEventListener('click', () => {
    popularSites.forEach((site, index) => {
        runIndividualQuickCheck(site.domain, index);
    });
});

// Initialize App on load
setLanguage('fa');