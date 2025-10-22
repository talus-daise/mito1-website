function showCustomAlert(message, isShowCloseButton = true, isBackgroundBlack) {
    const existingAlert = document.getElementById("custom-alert");
    if (existingAlert) existingAlert.remove();

    // カスタムアラートのコンテナ作成
    const alertContainer = document.createElement("div");
    Object.assign(alertContainer.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "1000",
        borderRadius: "1rem",
        textAlign: "center",
        opacity: "0",
        transition: "opacity 0.5s ease-in-out"
    });
    alertContainer.id = "custom-alert";

    // メッセージ表示用要素
    const messageElem = document.createElement("p");
    messageElem.innerText = message;
    Object.assign(messageElem.style, {
        display: "block",
        color: "#1f1f1f",
        backgroundColor: "#fff",
        width: "100%",
        margin: 0,
        marginBottom: "1rem",
        borderRadius: "1rem",
        padding: "3rem",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
    });

    const okButton = document.createElement("button");

    // OKボタン作成
    if (okButton) {
        Object.assign(okButton.style, {
            padding: "5px",
            cursor: "pointer",
            background: "transparent",
            color: "#3498db",
            borderRadius: "5px",
            fontSize: "2rem",
            display: "block",
            lineHeight: "1",
            margin: "0 auto",
            border: "none",
            position: "absolute",
            top: "0",
            right: "10px",
        });
        okButton.innerText = "×";
        okButton.onclick = () => {
            alertContainer.style.opacity = "0";
            setTimeout(() => {
                alertContainer.remove();
                if (isBackgroundBlack) background.remove();
            }, 500);
        };
    }

    const background = document.createElement("div");

    if (background) {
        Object.assign(background.style, {
            position: "fixed",
            width: "100vw",
            height: "100vh",
            background: "#000000",
            zIndex: "999",
            top: "0",
            left: "0"
        });
        background.id = "background-black";
    }

    if (isBackgroundBlack) {
        document.body.appendChild(background);
    }

    // 要素を組み立てて追加
    alertContainer.appendChild(messageElem);

    if (isShowCloseButton) {
        alertContainer.appendChild(okButton)
    }

    document.body.appendChild(alertContainer);

    // 少し遅れてフェードイン
    setTimeout(() => alertContainer.style.opacity = "1", 10);
}

// **グローバルスコープに登録**
window.showCustomAlert = showCustomAlert;