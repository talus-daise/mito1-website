// js/user.js
import { supabase } from "./supabase.js";
import { currentUser, userEmail } from "./auth.js";

export let updatedUser = null;

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
        const { data: student, error } = await supabase
            .from("students")
            .select("student_id")
            .eq("name", currentUser.user_metadata.full_name)
            .single();

        if (error) {
            console.error(error);
            return;
        }
        studentId = student.student_id;
    } catch (e) {
        console.error("名簿からの学籍番号 読み込み失敗", e);
    }

    const dispRole = () => {
        switch (latest.role) {
            case "master":
                return "マスター"
            case "admin":
                return "管理者"
            case "manager":
                return "コンテンツ管理者"
            case "request_music_manager":
                return "リクエスト曲管理者"
        }
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
    document.getElementById("user-role").textContent = dispRole()
    document.getElementById("user-role").addEventListener("click", () => {
        if (latest.role) {
            location.href = "/mito1-website/admin/";
        }
    });
}

function maskEmail(str) {
    return str.slice(0, 5) + "*".repeat(10) + str.slice(-5);
}