import { supabase } from "./supabaseClient.js";

/* ===== Supabase ===== */
/* ===== 状態 ===== */
let activeRules = [];
let wasRestricted = false;
let adminMails = [];

/* ===== 管理者メール取得 ===== */
async function fetchAdminMails() {
    const { data, error } = await supabase
        .from("users_private")
        .select("user_email, role")
        .in("role", ["master", "admin", "manager"]);

    if (error) {
        console.error("admin mail fetch error:", error);
        adminMails = [];
        return;
    }

    adminMails = data.map(u => u.user_email).filter(Boolean);
}

/* ===== Realtime 購読セットアップ ===== */
function setupRealtimeSubscriptions() {
    try {
        // website_restrictions の変更を監視
        supabase
            .channel('public:website_restrictions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'website_restrictions' }, () => {
                fetchRestrictions().catch(err => console.error('fetchRestrictions error:', err));
            })
            .subscribe();

        // 管理者メールが入る users_private を監視
        supabase
            .channel('public:users_private')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users_private' }, () => {
                fetchAdminMails().catch(err => console.error('fetchAdminMails error:', err));
            })
            .subscribe();
    } catch (e) {
        console.error('setupRealtimeSubscriptions error:', e);
    }
}

/* ===== 制限ルール取得 ===== */
async function fetchRestrictions() {
    const { data, error } = await supabase
        .from("website_restrictions")
        .select("*");

    if (error) {
        console.error("restriction fetch error:", error);
        activeRules = [];
        return;
    }

    const now = Date.now();
    activeRules = data.filter(r => {
        const start = new Date(r.start_time).getTime();
        const end = new Date(r.end_time).getTime();
        return start <= now && now <= end;
    });
}

/* ===== 制限判定 ===== */
function isRestrictedTime() {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    const minutes = now.getHours() * 60 + now.getMinutes();

    const fixedRestricted =
        (minutes >= 8 * 60 + 25 && minutes <= 11 * 60 + 29) ||
        (minutes >= 13 * 60 + 5 && minutes <= 15 * 60 + 54);

    const hasAllow = activeRules.some(r => r.mode === "allow");
    const hasRestrict = activeRules.some(r => r.mode === "restrict");

    if (hasAllow) return false;
    return fixedRestricted || hasRestrict;
}

function isAllowPage() {
    const p = location.pathname;
    return p.includes("admin") || p.includes("caution") || p.includes("timetable");
}

/* ===== Body制御 ===== */
function hideBody() {
    if (!document.body) return;
    document.body.style.setProperty("display", "none", "important");
    document.body.remove();
}

function showBody() {
    if (!document.body) return;
    document.body.style.setProperty("display", "block", "important");
}

/* ===== オーバーレイ ===== */
function createOverlay() {
    if (document.getElementById("time-restrict-overlay")) return;

    const mailBody = encodeURIComponent(
        "ウェブサイトの利用許可をしてください。\n\nーーーーーーーーーーーーーーー\n\n以下のリンクは触らないでください。\n\nhttps://mito1-middle-seitokai.github.io/mito1-website/admin/"
    );

    const mailTo = adminMails.length
        ? adminMails.join(",")
        : "";

    const overlay = document.createElement("div");
    overlay.id = "time-restrict-overlay";
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: #000;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
    `;

    const rulesText =
        activeRules.length === 0
            ? "平日の8:25~11:30, 13:05~15:55は制限されます。"
            : activeRules
                .map(r =>
                    `・${r.label}（${new Date(r.start_time).toLocaleString("ja-JP")} 〜 ${new Date(r.end_time).toLocaleString("ja-JP")}）`
                )
                .join("<br>");

    overlay.innerHTML = `
        <div style="
            max-width:520px;
            background:#000;
            color:#fff;
            padding:24px;
            border-radius:12px;
            line-height:1.7;
            border:1px solid #333;
        ">
            <p>現在は利用できない時間です。</p>
            <p>${rulesText}</p>
            <p>
                <a href="/mito1-website/timetable/" style="color:#7ab7ff;">時間割</a>
                は閲覧できます。
            </p>
            <p>
                祝日、または誤表示の場合は
                <a id="contact-admin"
                   href="mailto:${mailTo}?subject=ウェブサイトの利用について&body=${mailBody}"
                   style="color:#ffb37a;">
                    管理者までご連絡ください
                </a>。
            </p>
        </div>
    `;

    document.documentElement.appendChild(overlay);

    const contact = overlay.querySelector("#contact-admin");
    const last = localStorage.getItem("lastContactedAdmin");
    if (last && Date.now() - Number(last) < 120000) {
        contact.style.pointerEvents = "none";
        contact.style.opacity = "0.6";
    }
    contact.addEventListener("click", () => {
        contact.style.pointerEvents = "none";
        contact.style.opacity = "0.6";
        localStorage.setItem("lastContactedAdmin", Date.now().toString());
    });
}

function removeOverlay() {
    document.getElementById("time-restrict-overlay")?.remove();
}

/* ===== 初期化 ===== */
document.addEventListener("DOMContentLoaded", async () => {
    await fetchAdminMails();
    await fetchRestrictions();

    // Realtime での更新購読をセットアップ
    setupRealtimeSubscriptions();

    // 時刻の変化はクライアント側で監視（UI更新用）
    setInterval(() => {
        const restricted = isRestrictedTime() && !isAllowPage();

        if (restricted) {
            hideBody();
            createOverlay();
            wasRestricted = true;
        } else {
            removeOverlay();
            if (wasRestricted) {
                showBody();
                location.reload();
            }
            wasRestricted = false;
        }
    }, 1000);

    if (isRestrictedTime() && !isAllowPage()) {
        hideBody();
        createOverlay();
        wasRestricted = true;
    } else {
        showBody();
    }
});
