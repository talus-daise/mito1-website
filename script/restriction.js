import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ===== Supabase ===== */
const supabase = createClient(
    "https://mgsbwkidyxmicbacqeeh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg"
);

/* ===== 状態 ===== */
let activeRules = [];
let wasRestricted = false;

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
        (minutes >= 8 * 60 + 25 && minutes <= 11 * 60 + 30) ||
        (minutes >= 13 * 60 + 5 && minutes <= 15 * 60 + 55);

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
        "ウェブサイトの利用許可をしてください。\n\nーーーーーーーーーーーーーーー\n\n以下のリンクは触らないでください。\n\nhttps://talus-daise.github.io/mito1-website/admin/"
    );

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
            ? "現在有効な制限はありません。"
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
           href="mailto:yamamoto.yuujirou@mito1-h.ibk.ed.jp?subject=ウェブサイトの利用について&body=${mailBody}"
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
    await fetchRestrictions();
    setInterval(fetchRestrictions, 60_000);

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
                location.reload(); // 制限解除時に自動リロード
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