async function showCustomAlert(message, isShowCloseButton = true, isBackgroundBlack = false) {
    const existingAlert = document.getElementById("custom-alert");
    if (existingAlert) existingAlert.remove();

    // カスタムアラートのコンテナ作成
    const alertContainer = document.createElement("div");
    Object.assign(alertContainer.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "2000",
        borderRadius: "1rem",
        textAlign: "center",
        opacity: "0",
        transition: "opacity 0.5s ease-in-out",
    });
    alertContainer.style.setProperty("display", "block", "important");
    alertContainer.id = "custom-alert";

    // メッセージ表示用要素
    const messageElem = document.createElement("p");
    messageElem.innerHTML = message;
    Object.assign(messageElem.style, {
        display: "block",
        color: "#1f1f1f",
        backgroundColor: "#fff",
        width: "100%",
        margin: 0,
        marginBottom: "1rem",
        borderRadius: "1rem",
        padding: "3rem",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
    });

    const okButton = document.createElement("button");

    // OKボタン作成
    if (okButton) {
        Object.assign(okButton.style, {
            padding: "5px",
            cursor: "pointer",
            background: "transparent",
            color: "#3498db",
            borderRadius: "5px",
            fontSize: "2rem",
            display: "block",
            lineHeight: "1",
            margin: "0 auto",
            border: "none",
            position: "absolute",
            top: "0",
            right: "10px",
        });
        okButton.innerText = "×";
        okButton.onclick = () => {
            alertContainer.style.opacity = "0";
            setTimeout(() => {
                alertContainer.remove();
                if (isBackgroundBlack) background.remove();
            }, 500);
        };
    }

    const background = document.createElement("div");

    if (background) {
        Object.assign(background.style, {
            position: "fixed",
            width: "100vw",
            height: "100vh",
            background: "#000000",
            zIndex: "1999",
            top: "0",
            left: "0"
        });
        background.id = "background-black";
    }

    if (isBackgroundBlack) {
        document.documentElement.appendChild(background);
    }

    // 要素を組み立てて追加
    alertContainer.appendChild(messageElem);

    if (isShowCloseButton) {
        alertContainer.appendChild(okButton)
    }

    document.documentElement.appendChild(alertContainer);

    // 少し遅れてフェードイン
    setTimeout(() => alertContainer.style.opacity = "1", 10);
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    "https://mgsbwkidyxmicbacqeeh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg"
);

/** 時間制限処理 */
document.addEventListener("DOMContentLoaded", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from("website_allow")
        .select("*")
        .gte("created_at", startOfDay.toISOString()) // 当日00:00:00以降
        .lt("created_at", endOfDay.toISOString())    // 当日23:59:59以前
        .single();

    console.log(data, error);

    if (error && error.code !== "PGRST116") {
        console.error("データ取得エラー:", error);
        return;
    }

    /** 現在時刻の判定関数 */
    function isRestrictedTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDay();
        const current = hours * 60 + minutes;

        // 分単位で範囲を設定
        const ranges = [
            [8 * 60 + 25, 11 * 60 + 29],  // 8:25〜11:30
            [13 * 60 + 5, 15 * 60 + 54]   // 13:05〜15:55
        ];

        if (day === 0 || day === 6 || (data && data.is_allow)) return false;
        return ranges.some(([start, end]) => current >= start && current <= end);
    }

    /** 暗転処理 */
    function blackoutScreen() {
        const mailBody = encodeURIComponent('ウェブサイトの利用許可をしてください。\n\nーーーーーーーーーーーーーーー\n\n以下のリンクは触らないでください。\n\nhttps://talus-daise.github.io/mito1-website/admin/');

        // カスタムアラートを表示
        if (!document.getElementById("custom-alert")) showCustomAlert(`現在は利用できない時間です。<br>平日の8:25~11:30, 13:05~15:55は使用が制限されます。<br>もし祝日の場合や、誤って表示された場合は、<a href='mailto:yamamoto.yuujirou@mito1-h.ibk.ed.jp?subject=ウェブサイトの利用について&body=${mailBody}' id='contact-admin'>管理者までご連絡ください。</a>`, false, true);

        const contactLink = document.getElementById("contact-admin");
        if (localStorage.getItem("lastContactedAdmin") && Date.now() - parseInt(localStorage.getItem("lastContactedAdmin")) < 120000) {
            contactLink.style.pointerEvents = "none"; // <a>にdisabledは無効なので代替手段
            contactLink.style.opacity = "0.6";
            return;
        }

        if (contactLink) {
            contactLink.addEventListener("click", (e) => {
                e.stopPropagation();
                contactLink.style.pointerEvents = "none"; // <a>にdisabledは無効なので代替手段
                contactLink.style.opacity = "0.6";
                localStorage.setItem("lastContactedAdmin", Date.now().toString());
            });
        }
    }

    function isAllowPage() {
        return window.location.href.includes("admin") || window.location.href.includes("caution") || window.location.href.includes("timetable");
    }

    /** 時間判定と動作 */
    if (isRestrictedTime() && !isAllowPage()) {
        document.body.style.display = "none"
        blackoutScreen();
    } else {
        document.body.style.display = "block"
    }

    setInterval(() => {
        /** 時間判定と動作 */
        if (isRestrictedTime() && !isAllowPage()) {
            document.body.style.display = "none"
            blackoutScreen();
        } else {
            document.body.style.display = "block"
        }
    }, 1000);
});

// **グローバルスコープに登録**
window.showCustomAlert = showCustomAlert;