/* js/ra-logic.js */

let sectionCount = 0;
const STORAGE_KEY = 'ffi_uas_ra_draft';

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
        // RENAMED from "SAFEGUARD FAILURES" for clarity
        title: "CONTAINMENT & COLLISION RISKS",
        hazards: [
            "Airspace violation (Geofence failure)",
            "Mid-air Collision (DAA failure)"
        ]
    }
];

document.addEventListener("DOMContentLoaded", function() {
    loadLegendModal();
    
    // Only run if on Create RA page
    if (document.getElementById('raTableContainer')) {
        if (hasSavedData()) {
            loadFromStorage();
        } else {
            initTemplate(); 
        }
        
        // Add global event listener for auto-save
        document.getElementById('raTableContainer').addEventListener('input', saveDataToStorage);
        document.getElementById('raTableContainer').addEventListener('change', saveDataToStorage);
        
        // Header fields
        document.getElementById('raName').addEventListener('input', saveDataToStorage);
        document.getElementById('raDate').addEventListener('input', saveDataToStorage);
        document.getElementById('raAssessor').addEventListener('input', saveDataToStorage);
    }
});

/* --- STORAGE LOGIC --- */
function hasSavedData() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

function saveDataToStorage() {
    const data = gatherFormData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        
        // Restore Meta
        document.getElementById('raName').value = data.meta.name || "";
        document.getElementById('raDate').value = data.meta.date || "";
        document.getElementById('raAssessor').value = data.meta.assessor || "";

        // Restore Sections & Rows
        const container = document.getElementById('raTableContainer');
        // Reset table header
        container.innerHTML = `
        <colgroup>
            <col style="width: 3%;"> <col style="width: 12%;"> <col style="width: 12%;"> <col style="width: 12%;"> 
            <col style="width: 8%;"> <col style="width: 15%;"> <col style="width: 15%;"> <col style="width: 8%;"> <col style="width: 3%;">
        </colgroup>
        <thead>
            <tr>
                <th>ID</th> <th>Hazard</th> <th>Cause</th> <th>Effect</th> <th>Initial Risk</th> 
                <th>Preventative Barriers<br><span style="font-weight:normal; color:#666; font-size:0.8em;">(Reduce Probability)</span></th> 
                <th>Recovery Measures<br><span style="font-weight:normal; color:#666; font-size:0.8em;">(Reduce Severity)</span></th> 
                <th>Residual Risk</th> <th></th>
            </tr>
        </thead>`; 

        sectionCount = 0; 

        if (data.sections && data.sections.length > 0) {
            data.sections.forEach(sec => {
                addSection(sec.title, [], true); // Create section wrapper without rows
                const tbodyId = `tbody-sec-${sectionCount}`;
                
                sec.rows.forEach(row => {
                    addRowToSection(tbodyId, row); // Pass row data object
                });
            });
        } else {
            initTemplate(); 
        }
        
        updateComplexity();

    } catch (e) {
        console.error("Failed to load save:", e);
        initTemplate(); 
    }
}

function clearForm() {
    if (confirm("Are you sure you want to clear the form? All unsaved data will be lost.")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload(); 
    }
}

/* --- DATA GATHERING --- */
function gatherFormData() {
    const raName = document.getElementById('raName').value;
    const date = document.getElementById('raDate').value;
    const assessor = document.getElementById('raAssessor').value;
    const complexityScore = document.getElementById('compScore').innerText;
    
    const sections = [];
    
    const tbodies = document.querySelectorAll('#raTableContainer tbody');
    tbodies.forEach(tbody => {
        const sectionTitle = tbody.dataset.title || "Unknown Section";
        const rows = [];
        
        tbody.querySelectorAll('.hazard-row').forEach(tr => {
            rows.push({
                hazard: tr.querySelector('.inp-hazard').value,
                cause: tr.querySelector('.inp-cause').value,
                effect: tr.querySelector('.inp-effect').value,
                initial: { 
                    prob: tr.querySelector('.risk-cell[data-type="initial"] .prob-select').value, 
                    sev: tr.querySelector('.risk-cell[data-type="initial"] .sev-select').value 
                },
                barriers: tr.querySelector('.inp-barriers').value,
                measures: tr.querySelector('.inp-measures').value,
                residual: { 
                    prob: tr.querySelector('.risk-cell[data-type="residual"] .prob-select').value, 
                    sev: tr.querySelector('.risk-cell[data-type="residual"] .sev-select').value 
                }
            });
        });
        sections.push({ title: sectionTitle, rows: rows });
    });

    return {
        meta: { name: raName, date, assessor, complexity: complexityScore },
        sections: sections
    };
}

/* --- TEMPLATE INITIALIZATION --- */
function initTemplate() {
    templateSections.forEach(section => {
        addSection(section.title, section.hazards);
    });
    updateComplexity();
}

/* --- SECTION LOGIC --- */
function addSection(title = "", hazards = [], skipRows = false) {
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
    
    tbody.innerHTML = `
        <tr class="section-header-row">
            <td colspan="9">
                <span style="vertical-align:middle;">${displayTitle}</span>
            </td>
        </tr>
    `;
    container.appendChild(tbody);

    if (!skipRows) {
        if (hazards.length > 0) {
            hazards.forEach(hazardName => {
                addRowToSection(tbodyId, { hazard: hazardName });
            });
        } else {
            addRowToSection(tbodyId); 
        }
    }

    addFooterRow(tbodyId);
    if (!skipRows) saveDataToStorage(); 
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
function addRowToSection(tbodyId, rowData = {}) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    // Default values
    const d = {
        hazard: rowData.hazard || "",
        cause: rowData.cause || "",
        effect: rowData.effect || "",
        initial: rowData.initial || { prob: 0, sev: 0 },
        barriers: rowData.barriers || "",
        measures: rowData.measures || "",
        residual: rowData.residual || { prob: 0, sev: 0 }
    };

    const tr = document.createElement('tr');
    tr.className = "hazard-row"; 
    
    const deleteBtnStyle = "background:transparent; color:#adb5bd; border:none; padding:5px; cursor:pointer; transition:color 0.2s;";
    const deleteIcon = `<i class="fa-solid fa-trash" onmouseover="this.style.color='#dc3545'" onmouseout="this.style.color='#adb5bd'"></i>`;

    tr.innerHTML = `
        <td class="row-id" style="font-size:0.8rem; color:#888;">...</td>
        
        <td><textarea class="ra-input inp-hazard" placeholder="Hazard">${d.hazard}</textarea></td>
        <td><textarea class="ra-input inp-cause" placeholder="Cause">${d.cause}</textarea></td>
        <td><textarea class="ra-input inp-effect" placeholder="Effect">${d.effect}</textarea></td>
        
        <td class="risk-cell" data-type="initial">
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Prob -</option>
                <option value="5" ${d.initial.prob==5?'selected':''} class="opt-prob-5">5 (Freq)</option>
                <option value="4" ${d.initial.prob==4?'selected':''} class="opt-prob-4">4 (Occas)</option>
                <option value="3" ${d.initial.prob==3?'selected':''} class="opt-prob-3">3 (Remote)</option>
                <option value="2" ${d.initial.prob==2?'selected':''} class="opt-prob-2">2 (Impr)</option>
                <option value="1" ${d.initial.prob==1?'selected':''} class="opt-prob-1">1 (Ex.Imp)</option>
            </select>
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Sev -</option>
                <option value="5" ${d.initial.sev==5?'selected':''} class="opt-sev-5">5 (Cat)</option>
                <option value="4" ${d.initial.sev==4?'selected':''} class="opt-sev-4">4 (Haz)</option>
                <option value="3" ${d.initial.sev==3?'selected':''} class="opt-sev-3">3 (Major)</option>
                <option value="2" ${d.initial.sev==2?'selected':''} class="opt-sev-2">2 (Minor)</option>
                <option value="1" ${d.initial.sev==1?'selected':''} class="opt-sev-1">1 (Negl)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td><textarea class="ra-input inp-barriers" placeholder="">${d.barriers}</textarea></td>
        <td><textarea class="ra-input inp-measures" placeholder="">${d.measures}</textarea></td>

        <td class="risk-cell" data-type="residual">
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Prob -</option>
                <option value="5" ${d.residual.prob==5?'selected':''} class="opt-prob-5">5 (Freq)</option>
                <option value="4" ${d.residual.prob==4?'selected':''} class="opt-prob-4">4 (Occas)</option>
                <option value="3" ${d.residual.prob==3?'selected':''} class="opt-prob-3">3 (Remote)</option>
                <option value="2" ${d.residual.prob==2?'selected':''} class="opt-prob-2">2 (Impr)</option>
                <option value="1" ${d.residual.prob==1?'selected':''} class="opt-prob-1">1 (Ex.Imp)</option>
            </select>
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Sev -</option>
                <option value="5" ${d.residual.sev==5?'selected':''} class="opt-sev-5">5 (Cat)</option>
                <option value="4" ${d.residual.sev==4?'selected':''} class="opt-sev-4">4 (Haz)</option>
                <option value="3" ${d.residual.sev==3?'selected':''} class="opt-sev-3">3 (Major)</option>
                <option value="2" ${d.residual.sev==2?'selected':''} class="opt-sev-2">2 (Minor)</option>
                <option value="1" ${d.residual.sev==1?'selected':''} class="opt-sev-1">1 (Negl)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td style="text-align:center; vertical-align:middle;">
            <button style="${deleteBtnStyle}" onclick="removeRow(this)" title="Delete Row">
                ${deleteIcon}
            </button>
        </td>
    `;

    const footer = tbody.querySelector('.section-footer');
    if (footer) {
        tbody.insertBefore(tr, footer);
    } else {
        tbody.appendChild(tr);
    }
    
    // Initial color update
    updateCellColor(tr.querySelector('.risk-cell[data-type="initial"]'));
    updateCellColor(tr.querySelector('.risk-cell[data-type="residual"]'));
    tr.querySelectorAll('select').forEach(s => updateSelectStyle(s));

    renumberRows();
    saveDataToStorage(); // Auto-save
}

function removeRow(btn) {
    if (confirm("Are you sure you want to delete this hazard line?")) {
        btn.closest('tr').remove();
        renumberRows();
        updateComplexity();
        saveDataToStorage(); // Auto-save
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
    saveDataToStorage(); // Auto-save
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
        color = '#f8d7da'; text = '#721c24'; score = 3; 
    } 
    else if ((sev >= 3 && prob >= 2) || (sev === 2 && prob >= 4) || (sev === 5 && prob <= 2) || (sev === 1 && prob === 5)) {
        color = '#fff3cd'; text = '#856404'; score = 2; 
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

function downloadRiskAssessment() {
    const data = gatherFormData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    const filename = (data.meta.name || "Risk_Assessment").replace(/\s+/g, '_') + ".json";
    
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
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