const notifications = [];

export async function showCustomNotification(message, duration = 3000) {
    let container = document.getElementById("custom-notification-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "custom-notification-container";
        Object.assign(container.style, {
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            display: "flex",
            flexDirection: "column-reverse",
            gap: "0.5rem",
            zIndex: "2000",
        });
        document.body.appendChild(container);
    }

    const notification = document.createElement("div");
    Object.assign(notification.style, {
        maxWidth: "20rem",
        padding: "1rem 1.5rem",
        backgroundColor: "#fff",
        color: "#1f1f1f",
        borderRadius: "0.75rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        opacity: "0",
        transform: "translateY(20px)",
        fontSize: "1rem",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
        transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out, height 0.3s ease-in-out, margin 0.3s ease-in-out, padding 0.3s ease-in-out",
    });

    const messageElem = document.createElement("span");
    messageElem.innerText = message;
    notification.appendChild(messageElem);

    container.appendChild(notification);
    notifications.push(notification);

    // 高さを取得して固定（スムーズなアニメ用）
    const height = notification.offsetHeight;
    notification.style.height = `${height}px`;

    // フェードイン
    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => removeNotification(notification), duration);
}

function removeNotification(notification) {
    const height = notification.offsetHeight;
    // 高さを固定したまま縮める
    notification.style.opacity = "0";
    notification.style.transform = "translateY(20px)";
    notification.style.height = "0";
    notification.style.padding = "0 1.5rem";
    notification.style.margin = "0";

    setTimeout(() => {
        notification.remove();
        const index = notifications.indexOf(notification);
        if (index > -1) notifications.splice(index, 1);
    }, 500);
}

window.showCustomNotification = showCustomNotification;