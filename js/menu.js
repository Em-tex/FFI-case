/* js/menu.js */

document.addEventListener("DOMContentLoaded", function() {
    // 1. Definer meny-strukturen
    const menuItems = [
        { name: "Home", link: "index.html", icon: "fa-house" },
        { name: "Flight Authorization", link: "flight-auth.html", icon: "fa-check-to-slot" },
        { name: "Risk Assessments", link: "risk-assessments.html", icon: "fa-folder-open" }
    ];

    // 2. Finn ut hvilken fil vi er på nå (for å markere den aktiv)
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html"; // "index.html" hvis roten

    // 3. Bygg HTML-strengen
    let menuHtml = `
    <nav>
        <div class="brand">
            <i class="fa-solid fa-plane-up"></i> FFI UAS OPS
        </div>
        <ul>`;

    menuItems.forEach(item => {
        // Sjekk om dette er den aktive siden
        const isActive = (page === item.link) ? 'class="active"' : '';
        menuHtml += `<li><a href="${item.link}" ${isActive}><i class="fa-solid ${item.icon}"></i> ${item.name}</a></li>`;
    });

    menuHtml += `
        </ul>
        <div style="flex:1; text-align:right;">
            <span style="font-size: 0.8rem; opacity: 0.7; color: white;"><i class="fa-solid fa-user-astronaut"></i> Pilot Mode</span>
        </div>
    </nav>`;

    // 4. Sett inn menyen øverst i body
    document.body.insertAdjacentHTML("afterbegin", menuHtml);
});