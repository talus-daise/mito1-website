import { supabase } from "./supabase.js";
import { userEmail } from "./auth.js";

export async function loadAllPosts() {
    const q = await supabase.from("questions")
        .select("id, title, created_at")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });

    const t = await supabase.from("BBS")
        .select("id, thread, created_at, content")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });

    const a = await supabase.from("answers")
        .select("id, question_id, content, created_at")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });

    renderList("question-list", q.data, qItem);
    renderList("thread-list", t.data, tItem);
    renderList("answer-list", a.data, aItem);

    document.getElementById("post-count").textContent =
        (q.data?.length || 0) + (t.data?.length || 0) + (a.data?.length || 0);
}

function renderList(id, items, builder) {
    const root = document.getElementById(id);
    if (!items || items.length === 0) {
        root.innerHTML = "<p>投稿はありません</p>";
        return;
    }
    items.forEach(i => root.appendChild(builder(i)));
}

function baseItem(href, title, time) {
    const div = document.createElement("div");
    div.className = "content-list-item";
    div.innerHTML = `
        <a href="${href}" style="color:inherit">
            <h3>${title}</h3>
            <p><i class="fa-solid fa-clock"></i>${new Date(time).toLocaleString()}</p>
            <p><i class="fa-solid fa-user"></i>あなた</p>
        </a>
    `;
    return div;
}

const qItem = q =>
    baseItem(`/mito1-website/question/details/?id=${q.id}`, q.title, q.created_at);

const tItem = t => {
    const text = t.content.replace(/<[^>]+>/g, " ").slice(0, 20);
    return baseItem(
        `/mito1-website/bbs/thread/?thread=${encodeURIComponent(t.thread)}&post_id=${t.id}`,
        text + (t.content.length > 20 ? "..." : ""),
        t.created_at
    );
};

const aItem = a => {
    const text = a.content.replace(/<[^>]+>/g, " ").slice(0, 20);
    return baseItem(
        `/mito1-website/question/details/?id=${a.question_id}&answer_id=${a.id}`,
        text + (a.content.length > 20 ? "..." : ""),
        a.created_at
    );
}