/* =========================================================
 *  Googleログイン必須（完全遮断・常時監視）
 * ========================================================= */

import { supabase } from "./supabaseClient.js";
import { supabaseKey, supabaseUrl } from "./supabaseClient.js";

/* =========================================================
 *  初期レンダリング遮断
 * ========================================================= */
document.body.style.setProperty("display", "none", "important");

/* =========================================================
 *  Supabase 設定
 * ========================================================= */
const cautionPath = "/mito1-website/caution/";
const publicUserSyncPromises = new Map();
let authenticatedAppInitializedForUserId = null;
let latestAccessToken = null;

function isAllowedEmail(email) {
    const normalizedEmail = (email ?? "").toLowerCase();
    const [, domain = ""] = normalizedEmail.split("@");
    return domain === "mito1-h.ibk.ed.jp" || domain.endsWith(".ibk.ed.jp");
}

function isCautionPage() {
    return location.pathname.includes("/caution");
}

function redirectToCaution() {
    if (!isCautionPage()) {
        location.replace(cautionPath);
    }
}

async function requestTable(tableName, pathname = "", options = {}, accessToken = latestAccessToken) {
    if (!accessToken) {
        throw new Error(`${tableName} 同期用の access token がありません`);
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}${pathname}`, {
        ...options,
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const error = new Error(data?.message || `${tableName} request failed: ${response.status}`);
        error.details = data;
        throw error;
    }

    return data;
}

export async function ensurePublicUserRecord(user, accessToken = latestAccessToken) {
    if (!user?.id) return null;

    const runningPromise = publicUserSyncPromises.get(user.id);
    if (runningPromise) {
        console.log("users 同期中のため既存 promise を再利用:", user.id);
        return await runningPromise;
    }

    const syncPromise = (async () => {
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
        const fullName = user.user_metadata?.full_name || "";
        console.log("users 同期開始:", {
            user_id: user.id,
            user_email: user.email,
            avatar_url: avatarUrl
        });

        let existingPrivateUser = null;
        try {
            const rows = await requestTable("users_private", `?user_id=eq.${encodeURIComponent(user.id)}&select=*`, {
                method: "GET"
            }, accessToken);
            existingPrivateUser = rows?.[0] ?? null;
        } catch (fetchPrivateError) {
            console.error("users_private レコード取得エラー:", fetchPrivateError);
            return null;
        }

        console.log("users_private 既存レコード:", existingPrivateUser ?? null);

        if (!existingPrivateUser) {
            const privateInsertPayload = {
                user_id: user.id,
                user_email: user.email,
                role: null,
                full_name: fullName || null
            };
            console.log("users_private insert payload:", privateInsertPayload);

            try {
                await requestTable("users_private", "", {
                    method: "POST",
                    body: JSON.stringify(privateInsertPayload)
                }, accessToken);
            } catch (insertPrivateError) {
                console.error("users_private レコード作成エラー:", insertPrivateError);
                return null;
            }

            console.log("users_private レコード作成成功:", user.id);
        }

        let existingUser = null;
        try {
            const rows = await requestTable("users", `?user_id=eq.${encodeURIComponent(user.id)}&select=*`, {
                method: "GET"
            }, accessToken);
            existingUser = rows?.[0] ?? null;
        } catch (fetchError) {
            console.error("users レコード取得エラー:", fetchError);
            return null;
        }

        console.log("users 既存レコード:", existingUser ?? null);

        if (!existingUser) {
            const insertPayload = {
                user_id: user.id,
                user_email: user.email,
                avatar_url: avatarUrl,
                display_name: null,
                about_me: null,
                created_at: new Date().toISOString()
            };
            console.log("users insert payload:", insertPayload);

            try {
                await requestTable("users", "", {
                    method: "POST",
                    body: JSON.stringify(insertPayload)
                }, accessToken);
            } catch (insertError) {
                console.error("users レコード作成エラー:", insertError);
                return null;
            }

            console.log("users レコード作成成功:", user.id);
        } else {
            const updates = {};

            if (avatarUrl && avatarUrl !== existingUser.avatar_url) {
                updates.avatar_url = avatarUrl;
            }

            if (user.email && user.email !== existingUser.user_email) {
                updates.user_email = user.email;
            }

            if (Object.keys(updates).length > 0) {
                console.log("users update payload:", {
                    user_id: user.id,
                    updates
                });

                try {
                    await requestTable("users", `?user_id=eq.${encodeURIComponent(user.id)}`, {
                        method: "PATCH",
                        body: JSON.stringify(updates)
                    }, accessToken);
                } catch (updateError) {
                    console.error("users レコード更新エラー:", updateError);
                    return existingUser;
                }

                console.log("users レコード更新成功:", user.id);
            } else {
                console.log("users 更新不要:", user.id);
            }
        }

        let latestUser = null;
        try {
            const rows = await requestTable("users", `?user_id=eq.${encodeURIComponent(user.id)}&select=*`, {
                method: "GET"
            }, accessToken);
            latestUser = rows?.[0] ?? null;
        } catch (latestError) {
            console.error("users 最新レコード取得エラー:", latestError);
            return null;
        }

        console.log("users 同期完了:", latestUser);

        return latestUser;
    })();

    publicUserSyncPromises.set(user.id, syncPromise);

    try {
        return await syncPromise;
    } finally {
        if (publicUserSyncPromises.get(user.id) === syncPromise) {
            publicUserSyncPromises.delete(user.id);
        }
    }
}

/* =========================================================
 *  オーバーレイ表示
 * ========================================================= */
function showLoginOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "login-overlay";
    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,1)",
        zIndex: "9999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
        background: "#f8f8f8",
        padding: "30px",
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        minWidth: "280px"
    });

    const title = document.createElement("h3");
    title.textContent = "ログインが必要です";

    const desc = document.createElement("p");
    desc.textContent = "Googleアカウントでログインしてください";

    const loginBtn = document.createElement("div");
    loginBtn.innerHTML = `
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
            </button>`;


    const style = document.createElement("style");
    style.textContent = `
        .gsi-material-button {
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            -webkit-appearance: none;
            background-color: WHITE;
            background-image: none;
            border: 1px solid #747775;
            -webkit-border-radius: 4px;
            border-radius: 4px;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
            color: #1f1f1f;
            cursor: pointer;
            font-family: 'Roboto', arial, sans-serif;
            font-size: 14px;
            height: 40px;
            letter-spacing: 0.25px;
            outline: none;
            overflow: hidden;
            padding: 0 12px;
            position: relative;
            text-align: center;
            -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
            transition: background-color .218s, border-color .218s, box-shadow .218s;
            vertical-align: middle;
            white-space: nowrap;
            width: auto;
            max-width: 400px;
            min-width: min-content;
        }
        .gsi-material-button .gsi-material-button-icon {
            height: 20px;
            margin-right: 12px;
            min-width: 20px;
            width: 20px;
        }
        .gsi-material-button .gsi-material-button-content-wrapper {
            -webkit-align-items: center;
            align-items: center;
            display: flex;
            -webkit-flex-direction: row;
            flex-direction: row;
            -webkit-flex-wrap: nowrap;
            flex-wrap: nowrap;
            height: 100%;
            justify-content: space-between;
            position: relative;
            width: 100%;
        }
        .gsi-material-button .gsi-material-button-contents {
            -webkit-flex-grow: 1;
            flex-grow: 1;
            font-family: 'Roboto', arial, sans-serif;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: top;
        }
        .gsi-material-button .gsi-material-button-state {
            -webkit-transition: opacity .218s;
            transition: opacity .218s;
            bottom: 0;
            left: 0;
            opacity: 0;
            position: absolute;
            right: 0;
            top: 0;
        }
        .gsi-material-button:disabled {
            cursor: default;
            background-color: #ffffff61;
            border-color: #1f1f1f1f;
        }
        .gsi-material-button:disabled .gsi-material-button-contents {
            opacity: 38%;
        }
        .gsi-material-button:disabled .gsi-material-button-icon {
            opacity: 38%;
        }
        .gsi-material-button:not(:disabled):active .gsi-material-button-state,
        .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
            background-color: #303030;
            opacity: 12%;
        }
        .gsi-material-button:not(:disabled):hover {
            -webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
            box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
        }
        .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
            background-color: #303030;
            opacity: 8%;
        }
    `;
    document.head.appendChild(style);

    let oauthRunning = false;

    loginBtn.addEventListener("click", async () => {
        if (oauthRunning) return;
        oauthRunning = true;

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: "https://talus-daise.github.io/mito1-website/request_music/",
                queryParams: {
                    hd: "mito1-h.ibk.ed.jp"
                }
            }
        });
    });

    box.append(title, desc, loginBtn);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);
}

function allowRender() {
    document.body.style.setProperty("display", "block", "important");
}

document.body.style.setProperty("display", "none", "important");

/* ===== 状態変化監視 ===== */
supabase.auth.onAuthStateChange(async (event, session) => {
    latestAccessToken = session?.access_token || null;

    console.log("onAuthStateChange:", {
        event,
        hasSession: !!session,
        user_id: session?.user?.id ?? null,
        user_email: session?.user?.email ?? null
    });

    if (session?.user) {
        await ensurePublicUserRecord(session.user);
    }

    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        await handleSession(session);

        if (session?.user) {
            await initializeAuthenticatedApp(session.user);
        }
    }

    if (event === "SIGNED_OUT") {
        authenticatedAppInitializedForUserId = null;
        showLoginOverlay();
    }
});

async function handleSession(session) {
    console.log("handleSession 開始:", {
        isCautionPage: isCautionPage(),
        hasSession: !!session,
        user_id: session?.user?.id ?? null,
        user_email: session?.user?.email ?? null
    });

    if (isCautionPage()) {
        allowRender();
        return;
    }

    if (!session?.user) {
        showLoginOverlay();
        return;
    }

    if (!isAllowedEmail(session.user.email)) {
        // OAuth直後は signOut しない方が安定
        redirectToCaution();
        return;
    }

    await ensurePublicUserRecord(session.user);

    document.getElementById("login-overlay")?.remove();
    allowRender();
}

// メインの JS ファイル
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyDEIzqtDVN5sCc9niXCdtiIS2RnvUqQrdg",
    authDomain: "mito1-website.firebaseapp.com",
    projectId: "mito1-website",
    storageBucket: "mito1-website.firebasestorage.app",
    messagingSenderId: "1055511991325",
    appId: "1:1055511991325:web:e9f253698c3d5806b2a2f4",
    measurementId: "G-M1EEHEX6K4"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function requestPermissionAndGetToken(user) {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.error("通知権限が拒否されました");
            return;
        }

        // Service Worker を登録
        const registration = await navigator.serviceWorker.register("/mito1-website/firebase-messaging-sw.js");
        console.log("Service Worker registered with scope:", registration.scope);

        // トークン取得 (VAPIDキーと登録情報を渡す)
        const token = await getToken(messaging, {
            vapidKey: "BPxlXtztYGrRRnwpvtzsF1MS3mvfNlHDk9qohVd5sN9gM6I0bzxlGWqJUsxvetlsCpyrbs6QLv24Y63UHsITM_k",
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log("Device token:", token);
            // Supabase に保存
            const { error } = await supabase
                .from("push_tokens")
                .upsert(
                    {
                        token: token,
                        user_id: user?.id ?? null
                    },
                    { onConflict: "token" }
                );

            if (error) console.error("Supabase Save Error:", error);
        }
    } catch (err) {
        console.error("Error setting up notifications:", err);
    }
}

function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function showIOSNotificationOverlay(user) {
    const overlay = document.createElement("div");
    overlay.id = "iosNotificationOverlay";
    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,1)",
        zIndex: "9999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
        background: "#f8f8f8",
        padding: "30px",
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        minWidth: "280px"
    });

    const title = document.createElement("h2");
    title.textContent = "通知を有効にしますか？";

    const description = document.createElement("p");
    description.textContent = "学校からの重要なお知らせを受け取れます。";

    const button = document.createElement("button");
    button.textContent = "通知を有効にする";
    Object.assign(button.style, {
        marginTop: "15px",
        padding: "10px 20px",
        border: "none",
        borderRadius: "6px",
        background: "#007bff",
        color: "#fff",
        fontSize: "14px",
        cursor: "pointer"
    });

    button.addEventListener("click", async () => {
        await requestPermissionAndGetToken(user);
        overlay.remove();
    });

    box.appendChild(title);
    box.appendChild(description);
    box.appendChild(button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

async function initializeAuthenticatedApp(user) {
    console.log("initializeAuthenticatedApp 開始", {
        user_id: user?.id ?? null,
        user_email: user?.email ?? null
    });

    if (!user) {
        console.error("ユーザー情報の取得に失敗しました: user is null");
        return;
    }

    if (!isAllowedEmail(user.email)) {
        await supabase.auth.signOut();
        redirectToCaution();
        return;
    }

    if (authenticatedAppInitializedForUserId === user.id) {
        console.log("initializeAuthenticatedApp は初期化済み:", user.id);
        return;
    }

    authenticatedAppInitializedForUserId = user.id;

    if (isIOS() && isPWA()) {
        if (Notification.permission === "default") {
            showIOSNotificationOverlay(user);
        }
    } else {
        requestPermissionAndGetToken(user);
    }

    // フォアグラウンド通知の待機
    onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);

        const title = payload.notification?.title || "新着通知";
        const options = {
            body: payload.notification?.body,
            icon: "mito1-website/img/mitoichi-fuzoku.png", // 必要であればアイコン指定
            data: {
                // ここで data.url を通知オブジェクトに持たせる
                url: payload.data?.url
            }
        };

        const notification = new Notification(title, options);

        // クリックイベントを直接登録
        notification.onclick = (event) => {
            event.preventDefault(); // ブラウザのデフォルト動作を抑止
            const targetUrl = event.target.data.url;
            if (targetUrl) {
                window.open(targetUrl, '_blank');
            }
            notification.close();
        };
    });

}
