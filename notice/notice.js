// Supabase ライブラリをインポート
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

document.addEventListener("DOMContentLoaded", () => {
    /** メニュー作成 */

    // メニューボタンの作成
    const menuButton = document.createElement("button");
    menuButton.id = "menuButton";
    menuButton.innerHTML = "&#9776;"; // ハンバーガーアイコン
    document.body.appendChild(menuButton);

    const closeButton = document.createElement("button");
    closeButton.id = "closeButton";
    closeButton.innerHTML = "&#x2715;";
    document.body.appendChild(closeButton)

    // サイドメニューの作成
    const asideMenu = document.createElement("aside");
    asideMenu.id = "asideMenu";
    asideMenu.innerHTML = '';
    document.body.appendChild(asideMenu);

    menuButton.addEventListener("click", () => {
        asideMenu.classList.remove("closing");
        asideMenu.classList.add("open");
        menuButton.classList.add("open");
        closeButton.classList.add("open");
        document.body.classList.add('no-scroll');
    });

    closeButton.addEventListener("click", () => {
        asideMenu.classList.remove("open");
        asideMenu.classList.add("closing"); // ← フェードアウト
        menuButton.classList.remove("open");
        closeButton.classList.remove("open");
        document.body.classList.remove('no-scroll');

        // フェードアウトが終わったら closing を消して次に備える
        asideMenu.addEventListener("transitionend", () => {
            asideMenu.classList.remove("closing");
        }, { once: true });
    });



    /** サイトリンク */

    asideMenu.innerHTML = '<h2>サイトマップ</h2>'

    const linkListWrapper = document.createElement("nav");
    const linkList = document.createElement("ul");
    linkList.innerHTML = `
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
    `;

    linkListWrapper.appendChild(linkList);
    asideMenu.appendChild(linkListWrapper);

    /** お知らせ */

    asideMenu.appendChild(document.createElement("hr")); // 区切り用
    asideMenu.insertAdjacentHTML("beforeend", `
        <h2>更新内容</h2>
        <h3 id="client-page"></h3>
        <div id="notice-container"></div>
    `);


    // Supabase設定
    const supabaseUrl = "https://mgsbwkidyxmicbacqeeh.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg";
    const pd = createClient(supabaseUrl, supabaseKey);

    let h1Content = '';

    let query = pd.from('notice').select('id, date, content, page').order('date', { ascending: false });

    // 2つ目のh1タグを取得
    if (document.querySelectorAll('h1')[1]) {
        h1Content = document.querySelectorAll('h1')[1].textContent;
        document.getElementById('client-page').textContent = h1Content;
        query = query.eq('page', h1Content);
    } else {
        document.getElementById('client-page').textContent = '一覧';
    };

    // お知らせを取得して表示
    async function loadNotice() {
        const { data, error } = await query;

        if (error) {
            console.error('エラー:', error);
            return;
        }

        const noticeContainer = document.getElementById('notice-container');
        noticeContainer.innerHTML = ''; // 既存の内容をクリア

        // 日付ごとにグループ化
        const groupedNotices = data.reduce((acc, item) => {
            const date = item.date; // 日付でグループ化
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {});

        // グループ化したお知らせを表示
        Object.keys(groupedNotices).forEach(date => {
            const dateGroup = groupedNotices[date];
            const noticeGroup = document.createElement('div');
            noticeGroup.classList.add('notice-group');

            const dateHeader = document.createElement('h4');
            dateHeader.textContent = date;
            noticeGroup.appendChild(dateHeader);

            const noticeItem = document.createElement('ul');
            noticeItem.classList.add('notice-item');

            dateGroup.forEach(item => {
                const li = document.createElement("li");
                li.textContent = item.content;
                noticeItem.appendChild(li);
            });

            noticeGroup.appendChild(noticeItem);
            noticeContainer.appendChild(noticeGroup);
        });
    }

    loadNotice();


    const bbs = document.getElementById("bbs");
    const question = document.getElementById("question");
    const quiz = document.getElementById("quiz");

    let subMenu = null;

    let removeTimer = null;

    function createSubMenu(event) {
        if (removeTimer) {
            clearTimeout(removeTimer); // ← 削除予約をキャンセル
            removeTimer = null;
        }

        if (subMenu) {
            subMenu.remove();
            subMenu = null;
        }

        let page = event.target.innerText;
        subMenu = document.createElement("ul");
        subMenu.classList.add("submenu");

        if (page === '掲示板') {
            subMenu.innerHTML = `
            <li><a href="/mito1-website/bbs/new_post/">新規投稿</a></li>
        `;
            bbs.appendChild(subMenu);
        } else if (page === 'みとい知恵袋') {
            subMenu.innerHTML = `
            <li><a href="/mito1-website/question/new_question/">新規質問投稿</a></li>
        `;
            question.appendChild(subMenu);
        }

        requestAnimationFrame(() => {
            subMenu.classList.add("show");
        });
    }

    function removeSubMenu() {
        if (subMenu) {
            removeTimer = setTimeout(() => {
                if (subMenu) {
                    subMenu.classList.remove("show");
                    subMenu.addEventListener("transitionend", () => {
                        if (subMenu && !subMenu.classList.contains("show")) {
                            subMenu.remove();
                            subMenu = null;
                        }
                    }, { once: true });
                }
            }, 200); // ← 200ms程度の猶予
        }
    }

    // 画面幅でPC/スマホを判定
    function isWideScreen() {
        return window.innerWidth >= 428; // スマホかPCかの閾値（必要に応じて調整）
    }
});