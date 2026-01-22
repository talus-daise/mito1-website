import { supabase } from "./supabase.js";
import { userEmail } from "./auth.js";

export function bindUIEvents() {
    document.getElementById("logout-button").addEventListener("click", logout);
    document.getElementById("edit-display-name").addEventListener("click", editDisplayName);
    document.getElementById("edit-about-me").addEventListener("click", editAboutMe);
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = "../";
}

async function editDisplayName() {
    let name = prompt("新しい表示名（20文字以内）:");
    if (name === null) return;
    name = name.trim() || "とある水戸一の名無し";
    if (name.length > 20) return;

    await supabase.from("users").update({ display_name: name }).eq("user_email", userEmail);
    await Promise.all([
        supabase.from("BBS").update({ username: name }).eq("user_email", userEmail),
        supabase.from("questions").update({ username: name }).eq("user_email", userEmail),
        supabase.from("answers").update({ username: name }).eq("user_email", userEmail)
    ]);

    document.getElementById("display-name").textContent = name;
}

async function editAboutMe() {
    let text = prompt("自己紹介（100文字以内）:");
    if (text === null || text.length > 100) return;
    await supabase.from("users").update({ about_me: text }).eq("user_email", userEmail);
    document.getElementById("about-me").textContent = text || "自己紹介は未設定です。";
}