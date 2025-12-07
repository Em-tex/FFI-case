/* js/menu.js */

document.addEventListener("DOMContentLoaded", function() {
    const menuItems = [
        { name: "Hjem", link: "index.html", icon: "fa-house" },
        { name: "Flight Authorization", link: "flight-auth.html", icon: "fa-check-to-slot" },
        { name: "Risk Assessments", link: "risk-assessments.html", icon: "fa-folder-open" },
        { name: "Create RA", link: "create-ra.html", icon: "fa-pen-to-square" },
        { name: "Map", link: "https://www.dronesoner.no", icon: "fa-map", target: "_blank" }
    ];

    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    let menuHtml = `
    <nav>
        <div class="brand">
            <i class="fa-solid fa-plane-up"></i> FFI UAS OPS (caseoppgave)
        </div>
        <ul>`;

    menuItems.forEach(item => {
        const isActive = (page === item.link) ? 'class="active"' : '';
        const target = item.target ? `target="${item.target}"` : '';
        menuHtml += `<li><a href="${item.link}" ${isActive} ${target}><i class="fa-solid ${item.icon}"></i> ${item.name}</a></li>`;
    });

    // Legger Presentasjon-knappen diskret inn på høyre side sammen med Pilot Overview
    menuHtml += `
        </ul>
        <div style="flex:1; text-align:right; display:flex; justify-content:flex-end; gap:20px; align-items:center;">
            
            <a href="presentation.html" style="font-size: 0.9rem; color: rgba(255,255,255,0.6); text-decoration:none; padding:0; border:none;" title="Vis Presentasjon">
                <i class="fa-solid fa-tv"></i> Presentasjon
            </a>

            <span style="font-size: 0.9rem; color: rgba(255,255,255,0.3);">|</span>

            <a href="pilot-overview.html" style="font-size: 0.9rem; color: rgba(255,255,255,0.8); text-decoration:none; padding:0; border:none;">
                <i class="fa-solid fa-users-viewfinder"></i> Pilot Overview
            </a>
            <span style="font-size: 0.9rem; color: rgba(255,255,255,0.5);">|</span>
            <span style="font-size: 0.9rem; color: rgba(255,255,255,0.8);"><i class="fa-solid fa-user-astronaut"></i> Pilot Mode</span>
        </div>
    </nav>`;

    document.body.insertAdjacentHTML("afterbegin", menuHtml);
});