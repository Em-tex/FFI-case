/* js/ra-logic.js */

let sectionCount = 0;

// Template Data from Word Document (MUAS Risk Assessment)
const templateSections = [
    {
        title: "GENERAL",
        hazards: [
            "Lithium Battery Fire/Explosion",
            "Unsuccessful Launch",
            "Unsuccessful Recovery"
        ]
    },
    {
        title: "LOSS OF CONTROL",
        hazards: [
            "Loss of Command Link",
            "Loss of Vehicle Position Information",
            "Loss of Flight Reference Data",
            "Control surface failure",
            "Loss of Propulsion",
            "Loss of Alternator or PMU",
            "Loss of Ground Station"
        ]
    },
    {
        title: "SAFEGUARD FAILURES",
        hazards: [
            "Airspace violation",
            "Mid-air Collision"
        ]
    }
];

document.addEventListener("DOMContentLoaded", function() {
    loadLegendModal();
    if (document.getElementById('raTableContainer')) {
        initTemplate(); 
    }
});

/* --- TEMPLATE INITIALIZATION --- */
function initTemplate() {
    templateSections.forEach(section => {
        addSection(section.title, section.hazards);
    });
    updateComplexity();
}

/* --- SECTION LOGIC --- */
function addSection(title = "", hazards = []) {
    sectionCount++;
    const container = document.getElementById('raTableContainer');
    const tbodyId = `tbody-sec-${sectionCount}`;
    
    let displayTitle = title;
    if (title === "") {
        displayTitle = prompt("Enter Section Title (e.g., PAYLOAD RISKS):", "NEW SECTION");
        if (!displayTitle) return;
    }

    const tbody = document.createElement('tbody');
    tbody.id = tbodyId;
    tbody.dataset.title = displayTitle; 
    
    // Header row
    tbody.innerHTML = `
        <tr class="section-header-row">
            <td colspan="9">
                <span style="vertical-align:middle;">${displayTitle}</span>
            </td>
        </tr>
    `;
    container.appendChild(tbody);

    // Add hazards or empty row
    if (hazards.length > 0) {
        hazards.forEach(hazardName => {
            addRowToSection(tbodyId, hazardName);
        });
    } else {
        addRowToSection(tbodyId); 
    }

    // Add footer row with "Add Hazard" button
    addFooterRow(tbodyId);
}

function addFooterRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.className = "section-footer"; 
    tr.innerHTML = `
        <td colspan="9" style="padding: 10px; background-color: #fff; border-bottom: 2px solid #ddd;">
            <button class="btn-sm" style="background-color: #f8f9fa; color: #333; border: 1px solid #ccc; width: 100%; text-align:center;" onclick="addRowToSection('${tbodyId}')">
                <i class="fa-solid fa-plus"></i> Add Hazard to "${tbody.dataset.title}"
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

/* --- ROW LOGIC --- */
function addRowToSection(tbodyId, hazardText = "") {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = "hazard-row"; 
    
    // Grey delete button
    const deleteBtnStyle = "background:transparent; color:#adb5bd; border:none; padding:5px; cursor:pointer; transition:color 0.2s;";
    const deleteIcon = `<i class="fa-solid fa-trash" onmouseover="this.style.color='#dc3545'" onmouseout="this.style.color='#adb5bd'"></i>`;

    tr.innerHTML = `
        <td class="row-id" style="font-size:0.8rem; color:#888;">...</td>
        
        <td>
            <textarea class="ra-input inp-hazard" placeholder="Hazard">${hazardText}</textarea>
        </td>
        <td>
            <textarea class="ra-input inp-cause" placeholder="Cause"></textarea>
        </td>
        <td>
            <textarea class="ra-input inp-effect" placeholder="Effect"></textarea>
        </td>
        
        <td class="risk-cell" data-type="initial">
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Prob -</option>
                <option value="5" class="opt-prob-5">5 (Freq)</option>
                <option value="4" class="opt-prob-4">4 (Occas)</option>
                <option value="3" class="opt-prob-3">3 (Remote)</option>
                <option value="2" class="opt-prob-2">2 (Impr)</option>
                <option value="1" class="opt-prob-1">1 (Ex.Imp)</option>
            </select>
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Sev -</option>
                <option value="5" class="opt-sev-5">5 (Cat)</option>
                <option value="4" class="opt-sev-4">4 (Haz)</option>
                <option value="3" class="opt-sev-3">3 (Major)</option>
                <option value="2" class="opt-sev-2">2 (Minor)</option>
                <option value="1" class="opt-sev-1">1 (Negl)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td><textarea class="ra-input inp-barriers" placeholder=""></textarea></td>
        <td><textarea class="ra-input inp-measures" placeholder=""></textarea></td>

        <td class="risk-cell" data-type="residual">
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Prob -</option>
                <option value="5" class="opt-prob-5">5 (Freq)</option>
                <option value="4" class="opt-prob-4">4 (Occas)</option>
                <option value="3" class="opt-prob-3">3 (Remote)</option>
                <option value="2" class="opt-prob-2">2 (Impr)</option>
                <option value="1" class="opt-prob-1">1 (Ex.Imp)</option>
            </select>
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Sev -</option>
                <option value="5" class="opt-sev-5">5 (Cat)</option>
                <option value="4" class="opt-sev-4">4 (Haz)</option>
                <option value="3" class="opt-sev-3">3 (Major)</option>
                <option value="2" class="opt-sev-2">2 (Minor)</option>
                <option value="1" class="opt-sev-1">1 (Negl)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td style="text-align:center; vertical-align:middle;">
            <button style="${deleteBtnStyle}" onclick="removeRow(this)" title="Delete Row">
                ${deleteIcon}
            </button>
        </td>
    `;

    // Insert before footer
    const footer = tbody.querySelector('.section-footer');
    if (footer) {
        tbody.insertBefore(tr, footer);
    } else {
        tbody.appendChild(tr);
    }
    
    renumberRows();
}

function removeRow(btn) {
    if (confirm("Are you sure you want to delete this hazard line?")) {
        btn.closest('tr').remove();
        renumberRows();
        updateComplexity();
    }
}

function renumberRows() {
    let count = 0;
    const rows = document.querySelectorAll('.hazard-row');
    rows.forEach(row => {
        count++;
        const idCell = row.querySelector('.row-id');
        if (idCell) idCell.innerText = `H-${count.toString().padStart(2, '0')}`;
    });
}

function updateRow(selectElement) {
    const cell = selectElement.closest('.risk-cell');
    updateCellColor(cell);
    updateSelectStyle(selectElement); 
    updateComplexity();
}

function updateSelectStyle(select) {
    const val = parseInt(select.value);
    select.className = 'ra-input ' + (select.classList.contains('prob-select') ? 'prob-select' : 'sev-select');
    
    if (val === 0) select.classList.add('bg-white');
    else if (val >= 4) select.classList.add('opt-sev-5'); 
    else if (val === 3) select.classList.add('opt-sev-3'); 
    else select.classList.add('opt-sev-2'); 
}

function updateCellColor(cell) {
    const prob = parseInt(cell.querySelector('.prob-select').value);
    const sev = parseInt(cell.querySelector('.sev-select').value);
    const badge = cell.querySelector('.risk-badge');
    
    if (!prob || !sev) {
        badge.innerText = "...";
        badge.style.background = "#eee";
        badge.style.color = "#666";
        cell.dataset.score = 0; 
        return;
    }

    const sevLetter = ['E','D','C','B','A'][sev-1]; 
    badge.innerText = `${prob}${sevLetter}`; 

    let color = '#d4edda'; let text = '#155724'; let score = 1;

    if ((sev === 5 && prob >= 3) || (sev === 4 && prob >= 4) || (sev === 3 && prob === 5)) {
        color = '#f8d7da'; text = '#721c24'; score = 3; // Red
    } 
    else if ((sev >= 3 && prob >= 2) || (sev === 2 && prob >= 4) || (sev === 5 && prob <= 2) || (sev === 1 && prob === 5)) {
        color = '#fff3cd'; text = '#856404'; score = 2; // Yellow
    }

    badge.style.backgroundColor = color;
    badge.style.color = text;
    cell.dataset.score = score;
}

function updateComplexity() {
    const rows = document.querySelectorAll('.hazard-row');
    let totalComplexity = 0;
    
    rows.forEach(row => {
        const initCell = row.querySelector('.risk-cell[data-type="initial"]');
        const resCell = row.querySelector('.risk-cell[data-type="residual"]');
        
        const initScore = parseInt(initCell.dataset.score || 0);
        const resScore = parseInt(resCell.dataset.score || 0);
        
        if (initScore > 0) {
            let gap = Math.max(0, initScore - resScore);
            let residualPenalty = resScore * 10; 
            totalComplexity += 5 + (gap * 15) + residualPenalty;
        }
    });

    const fill = document.getElementById('compFill');
    const scoreText = document.getElementById('compScore');
    const label = document.getElementById('compLabel');
    const advice = document.getElementById('compAdvice');
    
    if(!fill) return;

    let width = Math.min(100, totalComplexity / 3); 
    fill.style.width = width + "%";
    scoreText.innerText = totalComplexity + " pts";

    if (totalComplexity < 80) {
        fill.style.backgroundColor = "#28a745"; label.innerText = "Low Complexity";
        advice.innerText = "Standard operation. Routine monitoring sufficient.";
    } else if (totalComplexity < 160) {
        fill.style.backgroundColor = "#ffc107"; label.innerText = "Medium Complexity";
        advice.innerText = "Operation relies on barriers. Briefing on mitigations required.";
    } else {
        fill.style.backgroundColor = "#dc3545"; label.innerText = "High Complexity";
        advice.innerText = "High reliance on barriers or high residual risk. Consider reducing scope.";
    }
}

/* --- DOWNLOAD / SAVE FUNCTION --- */
function downloadRiskAssessment() {
    const raName = document.getElementById('raName').value || "Risk_Assessment";
    const date = document.getElementById('raDate').value;
    const assessor = document.getElementById('raAssessor').value;
    const complexityScore = document.getElementById('compScore').innerText;
    
    const sections = [];
    
    const tbodies = document.querySelectorAll('#raTableContainer tbody');
    tbodies.forEach(tbody => {
        const sectionTitle = tbody.dataset.title || "Unknown Section";
        const rows = [];
        
        tbody.querySelectorAll('.hazard-row').forEach(tr => {
            const hazard = tr.querySelector('.inp-hazard').value;
            const cause = tr.querySelector('.inp-cause').value;
            const effect = tr.querySelector('.inp-effect').value;
            
            // Initial Risk
            const initCell = tr.querySelector('.risk-cell[data-type="initial"]');
            const initProb = initCell.querySelector('.prob-select').value;
            const initSev = initCell.querySelector('.sev-select').value;
            
            // Mitigations
            const barriers = tr.querySelector('.inp-barriers').value;
            const measures = tr.querySelector('.inp-measures').value;
            
            // Residual Risk
            const resCell = tr.querySelector('.risk-cell[data-type="residual"]');
            const resProb = resCell.querySelector('.prob-select').value;
            const resSev = resCell.querySelector('.sev-select').value;
            
            rows.push({
                hazard, cause, effect,
                initial: { prob: initProb, sev: initSev },
                barriers, measures,
                residual: { prob: resProb, sev: resSev }
            });
        });
        
        sections.push({ title: sectionTitle, rows: rows });
    });

    const data = {
        meta: { name: raName, date, assessor, complexity: complexityScore },
        sections: sections
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", raName.replace(/\s+/g, '_') + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/* --- EXTERNAL LEGEND --- */
function loadLegendModal() {
    fetch('legend.html')
        .then(res => res.text())
        .then(html => document.body.insertAdjacentHTML('beforeend', html))
        .catch(e => console.log("Run via server to load legend.html"));
}
window.onclick = function(e) { if(e.target.classList.contains('modal')) e.target.style.display='none'; }
function openLegend() { document.getElementById('legendModal').style.display='flex'; }
function closeLegend() { document.getElementById('legendModal').style.display='none'; }