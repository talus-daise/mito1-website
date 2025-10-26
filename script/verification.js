let names = [];

fetch("/mito1-website/names.json")
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
    messageElem.innerText = "プライバシーの面から名前の入力をお願いします<br>一度入力した場合は、もう一度入力してもらい、連絡していただけると助かります。<br>なお、違う端末で開いた場合は再度入力になることがあります<br>※名前は間に空白を開けず漢字で入力してください。";
    messageElem.style.marginBottom = "15px";

    const nameBox = document.createElement("input");
    nameBox.id = "question-name";
    nameBox.type = "text";

    const closeButton = document.createElement("button");
    closeButton.innerText = "OK";
    Object.assign(closeButton.style, {
        padding: "5px 15px", cursor: "pointer", border: "1px solid #00134c",
        background: "#3498db", color: "#00134c", borderRadius: "5px",
        boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.6)"
    });
    closeButton.onclick = () => {
        alertContainer.style.opacity = "0";
        const clientName = nameBox.value;
        const isValid = names.includes(clientName);
        localStorage.removeItem(verificationKey);
        localStorage.setItem(verificationKey, isValid);
        setTimeout(() => alertBackground.remove(), 500);
        let clientUrl = window.location.pathname;
        window.location.pathname = isValid ? clientUrl : "/mito1-website/caution.html";
    };

    alertContainer.append(messageHead, messageElem, nameBox, closeButton);
    alertBackground.appendChild(alertContainer);
    document.body.appendChild(alertBackground);

    setTimeout(() => {
        alertBackground.style.opacity = "1";
        alertContainer.style.opacity = "1";
    }, 10);
}