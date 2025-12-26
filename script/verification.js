let names = [];

fetch("/mito1-website/private/names.json")
    .then(response => response.json())
    .then(data => {
        // dataがオブジェクトの場合、全クラスを統合
        names = Array.isArray(data) ? data : Object.values(data).flat();
        checkVerification();
    })
    .catch(error => {
        console.error("Failed to fetch names:", error);
    });

const verificationKey = "verification";

function checkVerification() {
    const verified = localStorage.getItem(verificationKey) === "true";

    if (verified) return;

    const alertBackground = document.createElement("div");
    alertBackground.id = "custom-alert-background";
    Object.assign(alertBackground.style, {
        position: "fixed", zIndex: "1001", background: "#000", top: "0", left: "0",
        width: "100%", height: "100%", opacity: "0", transition: "opacity 0.5s ease-in-out"
    });

    const alertContainer = document.createElement("div");
    alertContainer.id = "custom-alert";
    Object.assign(alertContainer.style, {
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        padding: "20px", background: "#abc3ff", border: "2px solid #00134c", zIndex: "1002",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)", borderRadius: "8px", textAlign: "center", opacity: "0",
        transition: "opacity 0.5s ease-in-out"
    });

    const messageHead = document.createElement("h3");
    messageHead.innerText = "認証";

    const messageElem = document.createElement("p");
    messageElem.innerText = "部外者でないことを確認します";
    messageElem.style.marginBottom = "15px";

    // 画像と重ねるためのラッパー（相対位置）
    const imgWrapper = document.createElement("div");
    imgWrapper.style.position = "relative";
    imgWrapper.style.display = "inline-block";
    imgWrapper.style.marginBottom = "15px";

    const img = document.createElement("img");
    img.src = "/mito1-website/img/im-not-outsider.png";
    img.alt = "Verification Image";
    img.style.display = "block";

    // 画像上に重ねるボタン
    const imnotoutsider = document.createElement("button");
    imnotoutsider.type = "button";
    imnotoutsider.innerText = ""; // ボタンラベル
    Object.assign(imnotoutsider.style, {
        position: "absolute",
        left: "7%",
        top: "33%",
        padding: "1.3rem",
        cursor: "pointer",
        border: "1px solid #adadae",
        background: "rgba(248,248,248,0.95)",
        color: "#00134c",
        borderRadius: "5px",
        transform: "translate(0, 0)",
        zIndex: "2"
    });

    imgWrapper.appendChild(img);
    imgWrapper.appendChild(imnotoutsider);

    const popup = document.createElement("div");
    popup.id = "name-popup";
    Object.assign(popup.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: "20px",
        background: "#f8f8f8",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
        borderRadius: "8px",
        zIndex: "1003",
        transition: "all 0.3s ease-in-out"
    });

    const namePrompt = document.createElement("p");
    namePrompt.innerText = "名前を入力してください(漢字で間を空けずに):";
    namePrompt.style.margin = "10px 0 6px 0";

    const nameBox = document.createElement("input");
    nameBox.id = "question-name";
    nameBox.type = "text";
    nameBox.placeholder = "例: 山田太郎";
    Object.assign(nameBox.style, { padding: "6px 8px", boxSizing: "border-box" });

    const closeButton = document.createElement("button");
    closeButton.innerText = "OK";
    Object.assign(closeButton.style, {
        padding: "6px 14px", cursor: "pointer", border: "1px solid #00134c",
        background: "#adadae", color: "#f8f8f8", borderRadius: "5px",
        boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.2)", marginTop: "10px"
    });

    // 最初は入力欄とボタンを非表示にする
    popup.style.opacity = "0";

    popup.append(namePrompt, nameBox, closeButton);

    imnotoutsider.addEventListener("click", () => {
        namePrompt.style.display = "block";
        nameBox.style.display = "block";
        closeButton.style.display = "inline-block";
        popup.style.display = "block";
        popup.style.opacity = "1";
        nameBox.focus();
    });

    closeButton.addEventListener("click", () => {
        alertContainer.style.opacity = "0";
        const clientName = nameBox.value.trim();
        const isValid = names.includes(clientName);
        localStorage.setItem(verificationKey, isValid ? "true" : "false");
        setTimeout(() => alertBackground.remove(), 500);
        const clientUrl = window.location.pathname;
        window.location.pathname = isValid ? clientUrl : "/mito1-website/caution";
    });

    alertContainer.append(messageHead, messageElem, imgWrapper, popup);
    alertBackground.appendChild(alertContainer);
    document.body.appendChild(alertBackground);

    setTimeout(() => {
        alertBackground.style.opacity = "1";
        alertContainer.style.opacity = "1";
    }, 10);
}