// client/src/hooks/useVisitorTracker.ts
// ✅ SÉCURISÉ — Aucune clé Supabase. Le tracking passe par /api/track-visit (serveur).

async function getIPData() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return {};
    return await res.json();
  } catch { return {}; }
}

async function detectPrivateMode(): Promise<boolean> {
  try {
    if ("storage" in navigator && "estimate" in (navigator as any).storage) {
      const { quota } = await (navigator as any).storage.estimate();
      if (quota && quota < 120_000_000) return true;
    }
    await new Promise<void>((resolve, reject) => {
      const db = indexedDB.open("_pm_test");
      db.onsuccess = () => { db.result.close(); indexedDB.deleteDatabase("_pm_test"); resolve(); };
      db.onerror = () => reject();
    });
    return false;
  } catch { return true; }
}

async function detectAdBlocker(): Promise<boolean> {
  try {
    await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
      method: "HEAD", mode: "no-cors", cache: "no-store"
    });
    return false;
  } catch { return true; }
}

export async function trackVisit(page: string) {
  try {
    const nav = navigator as any;
    const ua = navigator.userAgent;

    const [ipData, isPrivate, hasAdBlock] = await Promise.all([
      getIPData(),
      detectPrivateMode(),
      detectAdBlocker(),
    ]);

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    const deviceType = isTablet ? "Tablette" : isMobile ? "Mobile" : "Desktop";

    let os = "Inconnu";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/iPhone|iPad/i.test(ua)) os = "iOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "Inconnu";
    if (/Edg/i.test(ua)) browser = "Edge";
    else if (/OPR|Opera/i.test(ua)) browser = "Opera";
    else if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    const vMatch = ua.match(/(Chrome|Firefox|Safari|Edge|OPR)\/(\d+)/);
    const browserVersion = vMatch ? vMatch[2] : "";

    const referrer = document.referrer || "Direct";
    let referrerClean = referrer;
    if (referrer.includes("google")) referrerClean = "Google";
    else if (referrer.includes("discord")) referrerClean = "Discord";
    else if (referrer.includes("twitter") || referrer.includes("x.com")) referrerClean = "Twitter/X";
    else if (referrer.includes("instagram")) referrerClean = "Instagram";

    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const networkType = conn?.effectiveType || conn?.type || "?";
    const networkSpeed = conn?.downlink ? `${conn.downlink} Mbps` : "?";

    const ram = nav.deviceMemory ? `${nav.deviceMemory} GB` : "?";
    const cpu = nav.hardwareConcurrency ? `${nav.hardwareConcurrency} cœurs` : "?";
    const tabHidden = document.hidden;

    const session_id = sessionStorage.getItem("_sid") || (() => {
      const id = Math.random().toString(36).slice(2);
      sessionStorage.setItem("_sid", id);
      return id;
    })();

    // ✅ Appel vers notre serveur — pas vers Supabase directement
    await fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip: ipData.ip || "?",
        country: ipData.country_name || "?",
        country_code: ipData.country_code || "?",
        city: ipData.city || "?",
        region: ipData.region || "?",
        isp: ipData.org || "?",
        connection_type: ipData.network || "?",
        is_vpn: ipData.threat?.is_vpn || false,
        browser,
        browser_version: browserVersion,
        os,
        device: deviceType,
        language: navigator.language || "?",
        screen: `${window.screen.width}x${window.screen.height}`,
        color_depth: `${window.screen.colorDepth} bits`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "?",
        page,
        referrer: referrerClean,
        referrer_full: referrer,
        ram,
        cpu,
        network_type: networkType,
        network_speed: networkSpeed,
        is_private: isPrivate,
        has_adblock: hasAdBlock,
        tab_hidden: tabHidden,
        visited_at: new Date().toISOString(),
        session_id,
      }),
    });
  } catch { /* silent */ }
}
