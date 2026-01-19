import { initAuth } from "./auth.js";
import { loadUserInfo } from "./user.js";
import { loadAllPosts } from "./posts.js";
import { bindUIEvents } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initAuth();
    await loadUserInfo();
    await loadAllPosts();
    bindUIEvents();
});