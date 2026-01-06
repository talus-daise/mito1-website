import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    "https://mgsbwkidyxmicbacqeeh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg"
);

document.addEventListener("DOMContentLoaded", async () => {
    let activeRules = [];

    /* ===== 制限ルール取得（UTC日時ベース） ===== */
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

    await fetchRestrictions();
    setInterval(fetchRestrictions, 60_000);

    /* ===== 制限判定 ===== */
    function isRestrictedTime() {
        const day = new Date().getDay(); // 0=日曜,6=土曜

        // 土日無条件許可
        if (day === 0 || day === 6) return false;

        const hasRestrict = activeRules.some(r => r.mode === "restrict");
        const hasAllow = activeRules.some(r => r.mode === "allow");

        if (hasRestrict) return true;
        if (hasAllow) return false;

        return false;
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
            background: rgba(0,0,0,0.85);
            z-index: 5000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
        `;

        const box = document.createElement("div");
        box.style.cssText = `
            max-width: 520px;
            background: #111;
            color: #fff;
            padding: 24px;
            border-radius: 12px;
            line-height: 1.7;
        `;

        const rulesText =
            activeRules.length === 0
                ? "現在有効な制限はありません。"
                : activeRules
                    .map(r =>
                        `・${r.label}（${new Date(r.start_time).toLocaleString("ja-JP")} 〜 ${new Date(r.end_time).toLocaleString("ja-JP")}）`
                    )
                    .join("<br>");

        box.innerHTML = `
            <p>現在は利用できない時間です。</p>
            <p>${rulesText}</p>
            <p>
                <a href="https://talus-daise.github.io/mito1-website/timetable/"
                   style="color:#7ab7ff;">時間割</a>
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
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const contactLink = document.getElementById("contact-admin");
        if (!contactLink) return;

        const last = localStorage.getItem("lastContactedAdmin");
        if (last && Date.now() - Number(last) < 120000) {
            contactLink.style.pointerEvents = "none";
            contactLink.style.opacity = "0.6";
        }

        contactLink.addEventListener("click", () => {
            contactLink.style.pointerEvents = "none";
            contactLink.style.opacity = "0.6";
            localStorage.setItem("lastContactedAdmin", Date.now().toString());
        });
    }

    function removeOverlay() {
        document.getElementById("time-restrict-overlay")?.remove();
    }

    function isAllowPage() {
        const path = location.pathname;
        return (
            path.includes("admin") ||
            path.includes("caution") ||
            path.includes("timetable")
        );
    }

    /* ===== 定期判定 ===== */
    setInterval(() => {
        if (isRestrictedTime() && !isAllowPage()) {
            document.body.style.display = "none";
            createOverlay();
        } else {
            document.body.style.display = "block";
            removeOverlay();
        }
    }, 1000);

    if (isRestrictedTime() && !isAllowPage()) {
        document.body.style.display = "none";
        createOverlay();
    } else {
        document.body.style.display = "block";
        removeOverlay();
    }
});
