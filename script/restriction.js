import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { showCustomAlert } from "/mito1-website/script/customAlert.js";

const supabase = createClient(
    "https://mgsbwkidyxmicbacqeeh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg"
);

document.addEventListener("DOMContentLoaded", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let allowData = { is_allow: false };
    try {
        const { data, error } = await supabase
            .from("website_allow")
            .select("*")
            .gte("created_at", startOfDay.toISOString())
            .lt("created_at", endOfDay.toISOString())
            .single();
        if (!error) {
            allowData = data;
        }
    } catch (e) {
        console.error("Supabase fetch error:", e);
    }

    function isRestrictedTime() {
        const now = new Date();
        const day = now.getDay(); // 0=日曜,6=土曜
        if (day === 0 || day === 6 || allowData.is_allow) return false;

        const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

        const ranges = [
            [8 * 60 + 25, 11 * 60 + 29 + 59 / 60],   // 8:25 ~ 11:29:59
            [13 * 60 + 5, 19 * 60 + 54 + 59 / 60]   // 13:05 ~ 15:54:59
        ];

        return ranges.some(([start, end]) => currentMinutes >= start && currentMinutes <= end);
    }

    function blackoutScreen(alertMessage) {
        const mailBody = encodeURIComponent(
            'ウェブサイトの利用許可をしてください。\n\nーーーーーーーーーーーーーーー\n\n以下のリンクは触らないでください。\n\nhttps://talus-daise.github.io/mito1-website/admin/'
        );

        if (!document.getElementById("custom-alert")) {
            showCustomAlert(
                alertMessage ||
                `現在は利用できない時間です。<br><a href='https://talus-daise.github.io/mito1-website/timetable/'>時間割</a>は見ることができます。<br>平日の8:25~11:30, 13:05~15:55は使用が制限されます。<br>もし祝日の場合や、誤って表示された場合は、<a href='mailto:yamamoto.yuujirou@mito1-h.ibk.ed.jp?subject=ウェブサイトの利用について&body=${mailBody}' id='contact-admin'>管理者までご連絡ください。</a>`,
                false,
                true
            );
        }

        const contactLink = document.getElementById("contact-admin");
        if (!contactLink) return;

        if (localStorage.getItem("lastContactedAdmin") &&
            Date.now() - parseInt(localStorage.getItem("lastContactedAdmin")) < 120000) {
            contactLink.style.pointerEvents = "none";
            contactLink.style.opacity = "0.6";
            return;
        }

        contactLink.addEventListener("click", () => {
            contactLink.style.pointerEvents = "none";
            contactLink.style.opacity = "0.6";
            localStorage.setItem("lastContactedAdmin", Date.now().toString());
        });
    }

    function isAllowPage() {
        const path = location.pathname;
        return path.includes("admin") || path.includes("caution") || path.includes("timetable");
    }

    // 常にチェックする
    setInterval(() => {
        if (isRestrictedTime() && !isAllowPage()) {
            document.body.style.display = "none";
            blackoutScreen();
        } else {
            document.body.style.display = "block";
        }
    }, 1000);

    // ページロード時の即時チェック
    if (isRestrictedTime() && !isAllowPage()) {
        document.body.style.display = "none";
        blackoutScreen();
    } else {
        document.body.style.display = "block";
    }
});