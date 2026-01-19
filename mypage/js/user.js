// js/user.js
import { supabase } from "./supabase.js";
import { currentUser, userEmail } from "./auth.js";

export let updatedUser = null;

/**
 * 氏名から学籍番号を算出
 * @param {Object} namesJson
 * @param {string} fullName
 * @returns {string} 学籍番号（例: 1A05） / 未検出時は 0A00
 */
function getStudentId(namesJson, fullName) {
    for (const [cls, list] of Object.entries(namesJson)) {
        if (!Array.isArray(list)) continue;
        const index = list.indexOf(fullName);
        if (index !== -1) {
            return `${cls}${String(index + 1).padStart(2, "0")}`;
        }
    }
    return "0A00";
}

export async function loadUserInfo() {
    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("user_email", userEmail)
        .single();

    if (!data) {
        await supabase.from("users").insert([{
            user_id: currentUser.id,
            user_email: userEmail,
            visit_count: 1,
            avatar_url: currentUser.user_metadata.avatar_url,
            full_name: currentUser.user_metadata.full_name
        }]);
    } else {
        await supabase.from("users")
            .update({
                avatar_url: currentUser.user_metadata.avatar_url,
                full_name: currentUser.user_metadata.full_name
            })
            .eq("user_email", userEmail);
    }

    const { data: latest } = await supabase
        .from("users")
        .select("*")
        .eq("user_email", userEmail)
        .single();

    updatedUser = latest;

    // --- 学籍番号取得 ---
    let studentId = "0A00";
    try {
        const res = await fetch("/mito1-website/private/names.json");
        const namesJson = await res.json();
        studentId = getStudentId(namesJson, currentUser.user_metadata.full_name);
    } catch (e) {
        console.error("names.json 読み込み失敗", e);
    }

    document.title = `${latest.display_name || "とある水戸一の名無し"} のマイページ | 水戸一高附属中総合ウェブサイト`;
    document.getElementById("user-avatar").src = currentUser.user_metadata.avatar_url || "../img/default-avatar.png";
    document.getElementById("student-id").textContent = studentId;
    document.getElementById("user-name").textContent = currentUser.user_metadata.full_name || "ゲスト";
    document.getElementById("user-email").textContent = maskEmail(userEmail);
    document.getElementById("display-name").textContent = latest.display_name || "とある水戸一の名無し";
    document.getElementById("visit-count").textContent = latest.visit_count;
    document.getElementById("about-me").textContent = latest.about_me || "自己紹介は未設定です。";
    document.getElementById("my-page-link").href = `./other/?user_id=${encodeURIComponent(latest.user_id)}`;
}

function maskEmail(str) {
    return str.slice(0, 5) + "*".repeat(10) + str.slice(-5);
}