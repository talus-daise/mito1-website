// Supabase ライブラリをインポート
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
     *  メニュー作成
     * ========================================================= */

    // --- メニューボタン ---
    const menuButton = document.createElement("button");
    menuButton.id = "menuButton";
    menuButton.innerHTML = "&#9776;"; // ハンバーガーアイコン
    document.body.appendChild(menuButton);

    // --- 閉じるボタン ---
    const closeButton = document.createElement("button");
    closeButton.id = "closeButton";
    closeButton.innerHTML = "&#x2715;";
    document.body.appendChild(closeButton);

    // --- サイドメニュー ---
    const asideMenu = document.createElement("aside");
    asideMenu.id = "asideMenu";
    document.body.appendChild(asideMenu);

    // 開く
    menuButton.addEventListener("click", () => {
        asideMenu.classList.remove("closing");
        asideMenu.classList.add("open");
        menuButton.classList.add("open");
        closeButton.classList.add("open");
        document.body.classList.add("no-scroll");
    });

    // 閉じる
    closeButton.addEventListener("click", () => {
        asideMenu.classList.remove("open");
        asideMenu.classList.add("closing");
        menuButton.classList.remove("open");
        closeButton.classList.remove("open");
        document.body.classList.remove("no-scroll");

        asideMenu.addEventListener("transitionend", () => {
            asideMenu.classList.remove("closing");
        }, { once: true });
    });

    document.addEventListener("click", (e) => {
        const target = e.target;
        // サイドバー内やメニュー・閉じるボタンへのクリックは無視
        if (asideMenu.contains(target) || menuButton.contains(target) || closeButton.contains(target)) return;
        if (asideMenu.classList.contains("open")) {
            asideMenu.classList.remove("open");
            asideMenu.classList.add("closing");
            menuButton.classList.remove("open");
            closeButton.classList.remove("open");
            document.body.classList.remove("no-scroll");

            asideMenu.addEventListener("transitionend", () => {
                asideMenu.classList.remove("closing");
            }, { once: true });
        }
    });

    /* =========================================================
     *  ログイン・ログアウト機能
     * ========================================================= */

    const loginMenu = document.createElement("div");
    loginMenu.innerHTML = `
        <h2>ログイン</h2>
        <div id="login-btn">
            <button class="gsi-material-button">
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                    </div>
                    <span class="gsi-material-button-contents">Googleでログイン</span>
                    <span style="display: none;">Googleでログイン</span>
                </div>
            </button>
        </div>
        <p id="user-info"></p>
    `;
    asideMenu.appendChild(loginMenu);

    // Supabase設定
    const supabaseUrl = "https://mgsbwkidyxmicbacqeeh.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const loginBtn = document.getElementById("login-btn");
    const userInfo = document.getElementById("user-info");

    // --- Googleログイン ---
    loginBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
            }
        });
        if (error) {
            console.error(error);
            showCustomNotification("ログインに失敗しました。");
        }
    });

    // --- ログイン状態の監視 ---
    supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            const user = session.user;
            const email = user.email;

            // 許可ドメインチェック
            const allowed =
                email.endsWith("@mito1-h.ibk.ed.jp") ||
                email.endsWith(".ibk.ed.jp");

            if (!allowed) {
                showCustomNotification("このメールアドレスのドメインではログインできません。");
                await supabase.auth.signOut();
                userInfo.textContent = "";
                loginBtn.style.display = "inline-block";
                return;
            }

            // 許可されたユーザーのみ表示
            userInfo.innerHTML = `
            <span class="avatar">
                <img src="${user.user_metadata.avatar_url}" alt="${user.user_metadata.full_name}" />
                ${user.user_metadata.full_name}
            </span> でログイン中
        `;
            loginBtn.style.display = "none";

        } else {
            userInfo.textContent = "";
            loginBtn.style.display = "inline-block";
        }
    });

    /* =========================================================
     *  サイトリンク作成
     * ========================================================= */

    asideMenu.insertAdjacentHTML("beforeend", "<h2>サイトマップ</h2>");

    const linkListWrapper = document.createElement("nav");

    const ul1 = document.createElement("ul");
    [
        { id: "home", href: "/mito1-website/", icon: "fa-house", text: "トップページ" },
        { id: "timetable", href: "/mito1-website/timetable/", icon: "fa-calendar-days", text: "時間割" },
        { id: "memberList", href: "/mito1-website/member_list/", icon: "fa-clipboard-list", text: "名簿" },
        { id: "tasks", href: "/mito1-website/tasks/", icon: "fa-list-check", text: "課題" },
        { id: "bbs", href: "/mito1-website/bbs/", icon: "fa-chalkboard", text: "掲示板" },
        { id: "question", href: "/mito1-website/question/", icon: "fa-circle-question", text: "みとい知恵袋" },
        { id: "troubleshooting", href: "/mito1-website/troubleshooting/", icon: "fa-screwdriver-wrench", text: "トラブルシューティング" },
        { id: "requestMusic", href: "/mito1-website/request_music/", icon: "fa-music", text: "リクエスト曲" }
    ].forEach(item => {
        const li = document.createElement("li");
        li.id = item.id;
        li.className = "menu-item";
        const a = document.createElement("a");
        a.href = item.href;
        const i = document.createElement("i");
        i.className = `fa-solid ${item.icon}`;
        a.appendChild(i);
        a.appendChild(document.createTextNode(item.text));
        li.appendChild(a);
        ul1.appendChild(li);
    });

    const hr = document.createElement("hr");

    const ul2 = document.createElement("ul");
    const liMyPage = document.createElement("li");
    liMyPage.id = "myPage";
    liMyPage.className = "menu-item";
    const aMyPage = document.createElement("a");
    aMyPage.href = "/mito1-website/mypage/";
    const iMyPage = document.createElement("i");
    iMyPage.className = "fa-solid fa-circle-user";
    aMyPage.appendChild(iMyPage);
    aMyPage.appendChild(document.createTextNode("マイページ"));
    liMyPage.appendChild(aMyPage);
    ul2.appendChild(liMyPage);

    linkListWrapper.appendChild(ul1);
    linkListWrapper.appendChild(hr);
    linkListWrapper.appendChild(ul2);

    asideMenu.appendChild(linkListWrapper);

    /* =========================================================
     *  訪問回数+1
     * ========================================================= */
    (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            showCustomNotification("ログインしてから投稿してください。");
            return;
        }

        const userEmail = session.user.email;

        const { data, error } = await supabase
            .from("users")
            .select("visit_count")
            .eq("user_email", userEmail)
            .single();

        if (!error) {
            await supabase
                .from("users")
                .update({ visit_count: data.visit_count + 1 })
                .eq("user_email", userEmail);
        }
    })();
});