/* js/menu.js */

document.addEventListener("DOMContentLoaded", function() {
    const menuItems = [
        { name: "Home", link: "index.html", icon: "fa-house" },
        { name: "Flight Authorization", link: "flight-auth.html", icon: "fa-check-to-slot" },
        { name: "Risk Assessments", link: "risk-assessments.html", icon: "fa-folder-open" },
        { name: "Map", link: "https://www.dronesoner.no", icon: "fa-map", target: "_blank" }
    ];

    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    let menuHtml = `
    <nav>
        <div class="brand">
            <i class="fa-solid fa-plane-up"></i> FFI UAS OPS
        </div>
        <ul>`;

    menuItems.forEach(item => {
        const isActive = (page === item.link) ? 'class="active"' : '';
        const target = item.target ? `target="${item.target}"` : '';
        menuHtml += `<li><a href="${item.link}" ${isActive} ${target}><i class="fa-solid ${item.icon}"></i> ${item.name}</a></li>`;
    });

    menuHtml += `
        </ul>
        <div style="flex:1; text-align:right;">
            <span style="font-size: 0.9rem; color: rgba(255,255,255,0.8);"><i class="fa-solid fa-user-astronaut"></i> Pilot Mode</span>
        </div>
    </nav>`;

    document.body.insertAdjacentHTML("afterbegin", menuHtml);
});