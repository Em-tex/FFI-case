/* js/ra-logic.js */

let sectionCount = 0;
const STORAGE_KEY = 'ffi_uas_ra_draft';

// Template Data
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
function hasSavedData() { return localStorage.getItem(STORAGE_KEY) !== null; }
function saveDataToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(gatherFormData())); }
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
                sec.rows.forEach(row => addRowToSection(tbodyId, row));
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
    if (confirm("Are you sure you want to clear the form?")) {
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
        sections.push({ title: tbody.dataset.title, rows: rows });
    });
    return { meta: { name: raName, date, assessor, complexity: complexityScore }, sections: sections };
}

/* --- TEMPLATE & UI LOGIC --- */
function initTemplate() {
    templateSections.forEach(section => addSection(section.title, section.hazards));
    updateComplexity();
}

function addSection(title = "", hazards = [], skipRows = false) {
    sectionCount++;
    const container = document.getElementById('raTableContainer');
    const tbodyId = `tbody-sec-${sectionCount}`;
    let displayTitle = title || prompt("Enter Section Title:", "NEW SECTION");
    if (!displayTitle) return;

    const tbody = document.createElement('tbody');
    tbody.id = tbodyId;
    tbody.dataset.title = displayTitle; 
    tbody.innerHTML = `<tr class="section-header-row"><td colspan="9"><span>${displayTitle}</span></td></tr>`;
    container.appendChild(tbody);

    if (!skipRows) {
        if (hazards.length > 0) hazards.forEach(h => addRowToSection(tbodyId, { hazard: h }));
        else addRowToSection(tbodyId); 
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

    // Dropdown HTML med svake bakgrunnsfarger på options
    const sevOptions = `
        <option value="0" class="bg-pale-white">- Sev -</option>
        <option value="1" class="bg-pale-red">1 (Catastrophic)</option>
        <option value="2" class="bg-pale-orange">2 (Critical)</option>
        <option value="3" class="bg-pale-yellow">3 (Marginal)</option>
        <option value="4" class="bg-pale-green">4 (Negligible)</option>`;
        
    const probOptions = `
        <option value="0" class="bg-pale-white">- Prob -</option>
        <option value="A" class="bg-pale-red">A (Frequent)</option>
        <option value="B" class="bg-pale-orange">B (Probable)</option>
        <option value="C" class="bg-pale-yellow">C (Occasional)</option>
        <option value="D" class="bg-pale-green">D (Remote)</option>
        <option value="E" class="bg-pale-green">E (Improbable)</option>`;

    tr.innerHTML = `
        <td class="row-id" style="font-size:0.8rem; color:#888;">...</td>
        <td><textarea class="ra-input inp-hazard" placeholder="Hazard">${d.hazard}</textarea></td>
        <td><textarea class="ra-input inp-cause" placeholder="Cause">${d.cause}</textarea></td>
        <td><textarea class="ra-input inp-effect" placeholder="Effect">${d.effect}</textarea></td>
        
        <td class="risk-cell" data-type="initial">
            <select class="ra-input sev-select" onchange="updateRow(this)">${sevOptions}</select>
            <select class="ra-input prob-select" onchange="updateRow(this)">${probOptions}</select>
            <div class="risk-badge">...</div>
        </td>

        <td><textarea class="ra-input inp-barriers" placeholder="">${d.barriers}</textarea></td>
        <td><textarea class="ra-input inp-measures" placeholder="">${d.measures}</textarea></td>

        <td class="risk-cell" data-type="residual">
             <select class="ra-input sev-select" onchange="updateRow(this)">${sevOptions}</select>
            <select class="ra-input prob-select" onchange="updateRow(this)">${probOptions}</select>
            <div class="risk-badge">...</div>
        </td>

        <td style="text-align:center; vertical-align:middle;">
            <button style="${deleteBtnStyle}" onclick="removeRow(this)" title="Delete Row">${deleteIcon}</button>
        </td>
    `;

    const footer = tbody.querySelector('.section-footer');
    if (footer) tbody.insertBefore(tr, footer); else tbody.appendChild(tr);
    
    // Set selected values
    tr.querySelector('.risk-cell[data-type="initial"] .sev-select').value = d.initial.sev;
    tr.querySelector('.risk-cell[data-type="initial"] .prob-select').value = d.initial.prob;
    tr.querySelector('.risk-cell[data-type="residual"] .sev-select').value = d.residual.sev;
    tr.querySelector('.risk-cell[data-type="residual"] .prob-select').value = d.residual.prob;

    // Apply colors and updates
    updateCellColor(tr.querySelector('.risk-cell[data-type="initial"]'));
    updateCellColor(tr.querySelector('.risk-cell[data-type="residual"]'));
    tr.querySelectorAll('select').forEach(s => updateSelectStyle(s));

    renumberRows();
    saveDataToStorage(); 
}

function removeRow(btn) {
    if (confirm("Are you sure?")) {
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

function updateRow(select) {
    updateCellColor(select.closest('.risk-cell'));
    updateSelectStyle(select);
    updateComplexity();
    saveDataToStorage(); 
}

// Sets the background color of the SELECT box itself based on value (Weak pastel)
function updateSelectStyle(select) {
    const val = select.value;
    select.className = 'ra-input ' + (select.classList.contains('prob-select') ? 'prob-select' : 'sev-select');
    
    if (val === '0') { select.classList.add('bg-pale-white'); return; }

    // Severity Logic
    if (select.classList.contains('sev-select')) {
        if (val === '1') select.classList.add('bg-pale-red');
        else if (val === '2') select.classList.add('bg-pale-orange');
        else if (val === '3') select.classList.add('bg-pale-yellow');
        else if (val === '4') select.classList.add('bg-pale-green');
    }
    // Probability Logic
    else {
        if (val === 'A') select.classList.add('bg-pale-red');
        else if (val === 'B') select.classList.add('bg-pale-orange');
        else if (val === 'C') select.classList.add('bg-pale-yellow');
        else if (val === 'D') select.classList.add('bg-pale-green');
        else if (val === 'E') select.classList.add('bg-pale-green');
    }
}

function updateCellColor(cell) {
    const prob = cell.querySelector('.prob-select').value;
    const sev = cell.querySelector('.sev-select').value;
    const badge = cell.querySelector('.risk-badge');
    
    if (prob === '0' || sev === '0') {
        badge.innerText = "...";
        badge.style.background = "#eee"; badge.style.color = "#666";
        cell.dataset.score = 0; return;
    }

    badge.innerText = `${sev}-${prob}`; 
    const code = sev + prob;
    let color = '#eee', text = '#000', score = 0;

    // LOGIC FROM MAA-NOR MATRIX
    if (['1A','2A','1B','2B','1C'].includes(code)) {
        color = 'var(--risk-high)'; text = 'white'; score = 4; // High Risk
    }
    else if (['3A','3B','2C','1D'].includes(code)) {
        color = 'var(--risk-serious)'; text = 'black'; score = 3; // Serious Risk
    }
    else if (['4A','4B','3C','2D','3D','1E','2E','3E'].includes(code)) {
        color = 'var(--risk-medium)'; text = 'black'; score = 2; // Medium Risk
    }
    else if (['4C','4D','4E'].includes(code)) {
        color = 'var(--risk-low)'; text = 'white'; score = 1; // Low Risk
    }

    badge.style.backgroundColor = color;
    badge.style.color = text;
    cell.dataset.score = score;
}

function updateComplexity() {
    let totalComplexity = 0;
    document.querySelectorAll('.hazard-row').forEach(row => {
        const initScore = parseInt(row.querySelector('.risk-cell[data-type="initial"]').dataset.score || 0);
        const resScore = parseInt(row.querySelector('.risk-cell[data-type="residual"]').dataset.score || 0);
        
        if (initScore > 0) {
            let gap = Math.max(0, initScore - resScore);
            totalComplexity += 5 + (gap * 15) + (resScore * 10);
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
        fill.style.backgroundColor = "var(--risk-low)"; label.innerText = "Low Complexity";
    } else if (totalComplexity < 160) {
        fill.style.backgroundColor = "var(--risk-serious)"; label.innerText = "Medium Complexity";
    } else {
        fill.style.backgroundColor = "var(--risk-high)"; label.innerText = "High Complexity";
    }
}

function downloadRiskAssessment() {
    const data = gatherFormData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = (data.meta.name || "Risk_Assessment").replace(/\s+/g, '_') + ".json";
    document.body.appendChild(a); a.click(); a.remove();
}

function loadLegendModal() {
    fetch('legend.html').then(r=>r.text()).then(h=>document.body.insertAdjacentHTML('beforeend', h)).catch(console.log);
}
window.onclick = function(e) { if(e.target.classList.contains('modal')) e.target.style.display='none'; }
function openLegend() { document.getElementById('legendModal').style.display='flex'; }
function closeLegend() { document.getElementById('legendModal').style.display='none'; }