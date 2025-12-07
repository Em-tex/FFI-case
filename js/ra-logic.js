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
        title: "CONTAINMENT & COLLISION RISKS",
        hazards: [
            "Airspace violation",
            "Mid-air Collision"
        ]
    }
];

document.addEventListener("DOMContentLoaded", function() {
    loadLegendModal();
    if (document.getElementById('raTableContainer')) {
        if (hasSavedData()) {
            loadFromStorage();
        } else {
            initTemplate(); 
        }
        
        document.getElementById('raTableContainer').addEventListener('input', saveDataToStorage);
        document.getElementById('raTableContainer').addEventListener('change', saveDataToStorage);
        
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
        document.getElementById('raName').value = data.meta.name || "";
        document.getElementById('raDate').value = data.meta.date || "";
        document.getElementById('raAssessor').value = data.meta.assessor || "";

        const container = document.getElementById('raTableContainer');
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
                addSection(sec.title, [], true); 
                const tbodyId = `tbody-sec-${sectionCount}`;
                sec.rows.forEach(row => {
                    addRowToSection(tbodyId, row); 
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
    return { meta: { name: raName, date, assessor, complexity: complexityScore }, sections: sections };
}

/* --- TEMPLATE INITIALIZATION --- */
function initTemplate() {
    templateSections.forEach(section => {
        addSection(section.title, section.hazards);
    });
    updateComplexity();
}

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
            <td colspan="9"><span style="vertical-align:middle;">${displayTitle}</span></td>
        </tr>
    `;
    container.appendChild(tbody);

    if (!skipRows) {
        if (hazards.length > 0) {
            hazards.forEach(hazardName => addRowToSection(tbodyId, { hazard: hazardName }));
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

function addRowToSection(tbodyId, rowData = {}) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const d = {
        hazard: rowData.hazard || "",
        cause: rowData.cause || "",
        effect: rowData.effect || "",
        initial: rowData.initial || { prob: "0", sev: "0" },
        barriers: rowData.barriers || "",
        measures: rowData.measures || "",
        residual: rowData.residual || { prob: "0", sev: "0" }
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
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Sev -</option>
                <option value="1" ${d.initial.sev=='1'?'selected':''} class="opt-sev-1">1 (Catastrophic)</option>
                <option value="2" ${d.initial.sev=='2'?'selected':''} class="opt-sev-2">2 (Critical)</option>
                <option value="3" ${d.initial.sev=='3'?'selected':''} class="opt-sev-3">3 (Marginal)</option>
                <option value="4" ${d.initial.sev=='4'?'selected':''} class="opt-sev-4">4 (Negligible)</option>
            </select>
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Prob -</option>
                <option value="A" ${d.initial.prob=='A'?'selected':''} class="opt-prob-a">A (Frequent)</option>
                <option value="B" ${d.initial.prob=='B'?'selected':''} class="opt-prob-b">B (Probable)</option>
                <option value="C" ${d.initial.prob=='C'?'selected':''} class="opt-prob-c">C (Occasional)</option>
                <option value="D" ${d.initial.prob=='D'?'selected':''} class="opt-prob-d">D (Remote)</option>
                <option value="E" ${d.initial.prob=='E'?'selected':''} class="opt-prob-e">E (Improbable)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td><textarea class="ra-input inp-barriers" placeholder="">${d.barriers}</textarea></td>
        <td><textarea class="ra-input inp-measures" placeholder="">${d.measures}</textarea></td>

        <td class="risk-cell" data-type="residual">
             <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Sev -</option>
                <option value="1" ${d.residual.sev=='1'?'selected':''} class="opt-sev-1">1 (Catastrophic)</option>
                <option value="2" ${d.residual.sev=='2'?'selected':''} class="opt-sev-2">2 (Critical)</option>
                <option value="3" ${d.residual.sev=='3'?'selected':''} class="opt-sev-3">3 (Marginal)</option>
                <option value="4" ${d.residual.sev=='4'?'selected':''} class="opt-sev-4">4 (Negligible)</option>
            </select>
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="0" class="bg-white">- Prob -</option>
                <option value="A" ${d.residual.prob=='A'?'selected':''} class="opt-prob-a">A (Frequent)</option>
                <option value="B" ${d.residual.prob=='B'?'selected':''} class="opt-prob-b">B (Probable)</option>
                <option value="C" ${d.residual.prob=='C'?'selected':''} class="opt-prob-c">C (Occasional)</option>
                <option value="D" ${d.residual.prob=='D'?'selected':''} class="opt-prob-d">D (Remote)</option>
                <option value="E" ${d.residual.prob=='E'?'selected':''} class="opt-prob-e">E (Improbable)</option>
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
    if (footer) tbody.insertBefore(tr, footer);
    else tbody.appendChild(tr);
    
    updateCellColor(tr.querySelector('.risk-cell[data-type="initial"]'));
    updateCellColor(tr.querySelector('.risk-cell[data-type="residual"]'));
    tr.querySelectorAll('select').forEach(s => updateSelectStyle(s));

    renumberRows();
    saveDataToStorage(); 
}

function removeRow(btn) {
    if (confirm("Are you sure you want to delete this hazard line?")) {
        btn.closest('tr').remove();
        renumberRows();
        updateComplexity();
        saveDataToStorage(); 
    }
}

function renumberRows() {
    let count = 0;
    document.querySelectorAll('.hazard-row').forEach(row => {
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
    saveDataToStorage(); 
}

function updateSelectStyle(select) {
    const val = select.value;
    select.className = 'ra-input ' + (select.classList.contains('prob-select') ? 'prob-select' : 'sev-select');
    
    if (val === '0') select.classList.add('bg-white');
    // Basic tint logic for UX (optional, kept simple here)
}

function updateCellColor(cell) {
    const prob = cell.querySelector('.prob-select').value;
    const sev = cell.querySelector('.sev-select').value;
    const badge = cell.querySelector('.risk-badge');
    
    if (prob === '0' || sev === '0') {
        badge.innerText = "...";
        badge.style.background = "#eee";
        badge.style.color = "#666";
        cell.dataset.score = 0; 
        return;
    }

    badge.innerText = `${sev}-${prob}`; 

    // Risk Logic (MAA-NOR / BLF Table 1)
    // Red: 1A, 1B, 1C, 2A, 2B
    // Orange: 1D, 2C, 2D, 3A, 3B
    // Yellow: 1E, 2E, 3C, 3D, 3E, 4A, 4B
    // Green: 4C, 4D, 4E
    
    let color = '#eee'; let text = '#000'; let score = 0;
    const code = sev + prob;

    // HIGH RISK (Red)
    if (['1A','1B','1C','2A','2B'].includes(code)) {
        color = '#FF0000'; text = '#FFF'; score = 4;
    }
    // SERIOUS RISK (Orange)
    else if (['1D','2C','2D','3A','3B'].includes(code)) {
        color = '#FFC000'; text = '#000'; score = 3;
    }
    // MEDIUM RISK (Yellow)
    else if (['1E','2E','3C','3D','3E','4A','4B'].includes(code)) {
        color = '#FFFF00'; text = '#000'; score = 2;
    }
    // LOW RISK (Green)
    else if (['4C','4D','4E'].includes(code)) {
        color = '#00B050'; text = '#FFF'; score = 1;
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
            // Gap logic: Red(4) -> Green(1) = Gap 3. 
            // Base cost 5 per hazard.
            // Gap cost = Gap * 15.
            let gap = Math.max(0, initScore - resScore);
            let residualPenalty = resScore * 10; 
            totalComplexity += 5 + (gap * 15) + residualPenalty;
        }
    });

    const fill = document.getElementById('compFill');
    const scoreText = document.getElementById('compScore');
    const label = document.getElementById('compLabel');
    
    if(!fill) return;

    let width = Math.min(100, totalComplexity / 3); 
    fill.style.width = width + "%";
    scoreText.innerText = totalComplexity + " pts";

    if (totalComplexity < 80) {
        fill.style.backgroundColor = "#28a745"; label.innerText = "Low Complexity";
    } else if (totalComplexity < 160) {
        fill.style.backgroundColor = "#ffc107"; label.innerText = "Medium Complexity";
    } else {
        fill.style.backgroundColor = "#dc3545"; label.innerText = "High Complexity";
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

function loadLegendModal() {
    fetch('legend.html')
        .then(res => res.text())
        .then(html => document.body.insertAdjacentHTML('beforeend', html))
        .catch(e => console.log(e));
}
window.onclick = function(e) { if(e.target.classList.contains('modal')) e.target.style.display='none'; }
function openLegend() { document.getElementById('legendModal').style.display='flex'; }
function closeLegend() { document.getElementById('legendModal').style.display='none'; }