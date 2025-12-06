/* js/ra-logic.js */

let rowCount = 0;

document.addEventListener("DOMContentLoaded", function() {
    // Last inn Legend Modal
    loadLegendModal();

    // Start med én rad hvis vi er på create-siden
    if (document.getElementById('raTableBody')) {
        addRow(); 
    }
});

/* --- LOAD EXTERNAL HTML --- */
function loadLegendModal() {
    fetch('legend.html')
        .then(response => {
            if (!response.ok) throw new Error("Could not load legend.html");
            return response.text();
        })
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
        })
        .catch(err => console.warn(err));
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = "none";
}
function openLegend() {
    const m = document.getElementById('legendModal');
    if(m) m.style.display = 'flex';
}
function closeLegend() {
    const m = document.getElementById('legendModal');
    if(m) m.style.display = 'none';
}


/* --- TABLE LOGIC --- */

function addRow() {
    rowCount++;
    const tbody = document.getElementById('raTableBody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="row-id">H-0${rowCount}</td>
        <td>
            <input type="text" class="ra-input" placeholder="Hazard" style="font-weight:bold; margin-bottom:5px;">
            <textarea class="ra-input" placeholder="Cause"></textarea>
        </td>
        
        <td class="risk-cell" data-type="initial">
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="5">Prob: 5 (Freq)</option>
                <option value="4">Prob: 4 (Occas)</option>
                <option value="3" selected>Prob: 3 (Rem)</option>
                <option value="2">Prob: 2 (Impr)</option>
                <option value="1">Prob: 1 (Ex.Imp)</option>
            </select>
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="5">Sev: 5 (Cat)</option>
                <option value="4">Sev: 4 (Haz)</option>
                <option value="3" selected>Sev: 3 (Maj)</option>
                <option value="2">Sev: 2 (Min)</option>
                <option value="1">Sev: 1 (Neg)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td>
            <textarea class="ra-input" placeholder="Barriers..."></textarea>
        </td>
        <td>
            <textarea class="ra-input" placeholder="Measures..."></textarea>
        </td>

        <td class="risk-cell" data-type="residual">
            <select class="ra-input prob-select" onchange="updateRow(this)">
                <option value="5">Prob: 5 (Freq)</option>
                <option value="4">Prob: 4 (Occas)</option>
                <option value="3">Prob: 3 (Rem)</option>
                <option value="2" selected>Prob: 2 (Impr)</option>
                <option value="1">Prob: 1 (Ex.Imp)</option>
            </select>
            <select class="ra-input sev-select" onchange="updateRow(this)">
                <option value="5">Sev: 5 (Cat)</option>
                <option value="4">Sev: 4 (Haz)</option>
                <option value="3" selected>Sev: 3 (Maj)</option>
                <option value="2">Sev: 2 (Min)</option>
                <option value="1">Sev: 1 (Neg)</option>
            </select>
            <div class="risk-badge">...</div>
        </td>

        <td><button class="btn-sm" style="background:#dc3545; color:white;" onclick="removeRow(this)"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    
    // Oppdater farger for begge risikokolonnene i den nye raden
    const cells = tr.querySelectorAll('.risk-cell');
    updateCellColor(cells[0]); // Initial
    updateCellColor(cells[1]); // Residual
    updateComplexity();
}

function removeRow(btn) {
    if (confirm("Are you sure you want to delete this hazard?")) {
        btn.closest('tr').remove();
        renumberRows();
        updateComplexity();
    }
}

function renumberRows() {
    const rows = document.querySelectorAll('#raTableBody tr');
    rowCount = 0;
    rows.forEach(row => {
        rowCount++;
        const idCell = row.querySelector('.row-id');
        if (idCell) idCell.innerText = `H-0${rowCount}`;
    });
}

function updateRow(selectElement) {
    // Finn cellen (Initial eller Residual) som ble endret
    const cell = selectElement.closest('.risk-cell');
    updateCellColor(cell);
    updateComplexity();
}

function updateCellColor(cell) {
    const prob = parseInt(cell.querySelector('.prob-select').value);
    const sev = parseInt(cell.querySelector('.sev-select').value);
    const badge = cell.querySelector('.risk-badge');
    
    const sevLetter = ['E','D','C','B','A'][sev-1]; 
    badge.innerText = `${prob}${sevLetter}`; 

    // Risk Logic (CAP 1059)
    let color = '#d4edda'; let text = '#155724'; let score = 1; // Green / Acceptable

    // Rød (Unacceptable)
    if ((sev === 5 && prob >= 3) || (sev === 4 && prob >= 4) || (sev === 3 && prob === 5)) {
        color = '#f8d7da'; text = '#721c24'; score = 3;
    } 
    // Gul (Review)
    else if ((sev >= 3 && prob >= 2) || (sev === 2 && prob >= 4) || (sev === 5 && prob <= 2) || (sev === 1 && prob === 5)) {
        color = '#fff3cd'; text = '#856404'; score = 2;
    }

    badge.style.backgroundColor = color;
    badge.style.color = text;
    
    // Lagre score i dataset for complexity-beregning
    cell.dataset.riskScore = score;
}

function updateComplexity() {
    const rows = document.querySelectorAll('#raTableBody tr');
    let totalComplexity = 0;
    
    rows.forEach(row => {
        // Hent initial og residual celler
        const initCell = row.querySelector('.risk-cell[data-type="initial"]');
        const resCell = row.querySelector('.risk-cell[data-type="residual"]');
        
        const initScore = parseInt(initCell.dataset.riskScore || 1);
        const resScore = parseInt(resCell.dataset.riskScore || 1);
        
        // Beregn "Gap". 
        // 3 (Rød) -> 1 (Grønn) = Gap på 2. (Stor reduksjon = Mye tiltak = Høy kompleksitet)
        // 2 (Gul) -> 1 (Grønn) = Gap på 1.
        // 3 (Rød) -> 3 (Rød) = Gap på 0 (Men fortsatt høy risiko, så vi legger til grunnscore)
        
        let gap = Math.max(0, initScore - resScore);
        
        // Formel: Base (5 poeng per fare) + (Gap * 15 poeng)
        // Hvis du har redusert fra Rød til Grønn, får du 5 + 30 = 35 poeng for den linjen.
        totalComplexity += 5 + (gap * 15);
    });

    const fill = document.getElementById('compFill');
    const label = document.getElementById('compLabel');
    const scoreText = document.getElementById('compScore');
    const advice = document.getElementById('compAdvice');

    if(!fill) return;

    // Skaler til 100% (si maks er 150 poeng for demo)
    let width = Math.min(100, (totalComplexity / 1.5)); 
    fill.style.width = width + "%";
    scoreText.innerText = totalComplexity + " pts";

    if (totalComplexity < 40) {
        fill.style.backgroundColor = "#28a745";
        label.innerText = "Low Complexity";
        advice.innerText = "Operation relies on standard procedures. Low management burden.";
    } else if (totalComplexity < 80) {
        fill.style.backgroundColor = "#ffc107";
        label.innerText = "Medium Complexity";
        advice.innerText = "Multiple barriers active. Requires briefing and monitoring of mitigations.";
    } else {
        fill.style.backgroundColor = "#dc3545";
        label.innerText = "High Complexity";
        advice.innerText = "Heavy reliance on complex barriers. Consider reducing scope or splitting operation.";
    }
}