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

    const { data: currentUser } = supabase.auth.getUser()

    const { data: existingUsers, error: existErr } = await supabase
        .from("users")
        .select("display_name")
        .eq("display_name", name);

    if (existErr) {
        showCustomNotification("エラーが発生しました");
        return;
    }
    if (existingUsers.length > 0) {
        showCustomNotification("この名前はすでに使用されています");
        return;
    }

    const res = await fetch("/mito1-website/private/names.json");
    if (!res.ok) {
        showCustomNotification("名前一覧の取得に失敗しました")
        return;
    }
    const namesJson = await res.json();

    const allRealNames = Object.values(namesJson).flat();

    const myRealName = currentUser?.user_metadata?.full_name;

    if (allRealNames.includes(name) && name !== myRealName) {
        showCustomNotification("自分以外の本名は使えません");
        return;
    }

    await supabase.from("users").update({ display_name: name }).eq("user_email", userEmail);
    await Promise.all([
        supabase.from("BBS").update({ username: name }).eq("user_email", userEmail),
        supabase.from("questions").update({ username: name }).eq("user_email", userEmail),
        supabase.from("answers").update({ username: name }).eq("user_email", userEmail)
    ]);

    document.getElementById("display-name").textContent = name;

    showCustomNotification("表示名を更新しました")
}


async function editAboutMe() {
    let text = prompt("自己紹介（100文字以内）:");
    if (text === null || text.length > 100) return;
    await supabase.from("users").update({ about_me: text }).eq("user_email", userEmail);
    document.getElementById("about-me").textContent = text || "自己紹介は未設定です。";
}