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
    const pd = createClient(supabaseUrl, supabaseKey);

    const loginBtn = document.getElementById("login-btn");
    const userInfo = document.getElementById("user-info");

    // --- Googleログイン ---
    loginBtn.addEventListener("click", async () => {
        const { error } = await pd.auth.signInWithOAuth({ 
            provider: "google",
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) {
            console.error(error);
            alert("ログインに失敗しました。");
        }
    });

    // --- ログイン状態の監視 ---
    pd.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            const user = session.user;
            const email = user.email;

            // 許可ドメインチェック
            const allowed =
                email.endsWith("@mito1-h.ibk.ed.jp") ||
                email.endsWith(".ibk.ed.jp");

            if (!allowed) {
                alert("このメールアドレスのドメインではログインできません。");
                await pd.auth.signOut();
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
    linkListWrapper.innerHTML = `
        <ul>
            <li id="myPage" class="menu-item">
                <a href="/mito1-website/mypage/">
                    <i class="fa-solid fa-circle-user"></i>マイページ
                </a>
            </li>
        </ul>
        <ul>
            <li id="home" class="menu-item">
                <a href="/mito1-website/">
                    <i class="fa-solid fa-house"></i>トップページ
                </a>
            </li>
            <li id="memberList" class="menu-item">
                <a href="/mito1-website/member_list/">
                    <i class="fa-solid fa-clipboard-list"></i>名簿
                </a>
            </li>
            <li id="tasks" class="menu-item">
                <a href="/mito1-website/tasks/">
                    <i class="fa-solid fa-list-check"></i>課題
                </a>
            </li>
            <li id="bbs" class="menu-item">
                <a href="/mito1-website/bbs/">
                    <i class="fa-solid fa-chalkboard"></i>掲示板
                </a>
                <ul class="submenu">
                    <li><a href="/mito1-website/bbs/new_post/">新規スレッド作成</a></li>
                </ul>
            </li>
            <li id="question" class="menu-item">
                <a href="/mito1-website/question/">
                    <i class="fa-solid fa-circle-question"></i>みとい知恵袋
                </a>
                <ul class="submenu">
                    <li><a href="/mito1-website/question/new_question/">新規質問投稿</a></li>
                </ul>
            </li>
            <li id="troubleshooting" class="menu-item">
                <a href="/mito1-website/troubleshooting/">
                    <i class="fa-solid fa-screwdriver-wrench"></i>トラブルシューティング
                </a>
            </li>
        </ul>
    `;
    asideMenu.appendChild(linkListWrapper);

    /* =========================================================
     *  お知らせ欄
     * ========================================================= */

    asideMenu.appendChild(document.createElement("hr"));
    asideMenu.insertAdjacentHTML("beforeend", `
        <h2>更新内容</h2>
        <h3 id="client-page"></h3>
        <div id="notice-container"></div>
    `);

    // --- ページタイトル取得 ---
    let h1Content = "";
    let query = pd.from("notice").select("id, date, content, page").order("date", { ascending: false });

    if (document.querySelectorAll("h1")[1]) {
        h1Content = document.querySelectorAll("h1")[1].textContent;
        document.getElementById("client-page").textContent = h1Content;
        query = query.eq("page", h1Content);
    } else {
        document.getElementById("client-page").textContent = "一覧";
    }

    // --- お知らせ読み込み ---
    async function loadNotice() {
        const { data, error } = await query;
        if (error) {
            console.error("エラー:", error);
            return;
        }

        const noticeContainer = document.getElementById("notice-container");
        noticeContainer.innerHTML = "";

        // 日付ごとにグループ化
        const grouped = data.reduce((acc, item) => {
            (acc[item.date] ||= []).push(item);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([date, items]) => {
            const group = document.createElement("div");
            group.classList.add("notice-group");

            const dateHeader = document.createElement("h4");
            dateHeader.textContent = date;
            group.appendChild(dateHeader);

            const ul = document.createElement("ul");
            ul.classList.add("notice-item");
            items.forEach(i => {
                const li = document.createElement("li");
                li.textContent = i.content;
                ul.appendChild(li);
            });

            group.appendChild(ul);
            noticeContainer.appendChild(group);
        });
    }

    loadNotice();

    /* =========================================================
     *  サブメニュー表示制御（PC対応）
     * ========================================================= */

    const bbs = document.getElementById("bbs");
    const question = document.getElementById("question");
    let subMenu = null;
    let removeTimer = null;

    function createSubMenu(event) {
        if (removeTimer) {
            clearTimeout(removeTimer);
            removeTimer = null;
        }

        if (subMenu) {
            subMenu.remove();
            subMenu = null;
        }

        const page = event.target.innerText;
        subMenu = document.createElement("ul");
        subMenu.classList.add("submenu");

        if (page === "掲示板") {
            subMenu.innerHTML = `<li><a href="/mito1-website/bbs/new_post/">新規投稿</a></li>`;
            bbs.appendChild(subMenu);
        } else if (page === "みとい知恵袋") {
            subMenu.innerHTML = `<li><a href="/mito1-website/question/new_question/">新規質問投稿</a></li>`;
            question.appendChild(subMenu);
        }

        requestAnimationFrame(() => subMenu.classList.add("show"));
    }

    function removeSubMenu() {
        if (subMenu) {
            removeTimer = setTimeout(() => {
                if (subMenu) {
                    subMenu.classList.remove("show");
                    subMenu.addEventListener("transitionend", () => {
                        subMenu?.remove();
                        subMenu = null;
                    }, { once: true });
                }
            }, 200);
        }
    }

    // 画面幅でPC/スマホを判定
    function isWideScreen() {
        return window.innerWidth >= 428;
    }
});