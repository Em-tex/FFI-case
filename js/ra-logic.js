/* js/ra-logic.js */

let rowCount = 0;

document.addEventListener("DOMContentLoaded", function() {
    // Sjekk om vi er på 'Create RA'-siden ved å se etter tabellkroppen
    if (document.getElementById('raTableBody')) {
        addRow(); // Legg til første rad automatisk for å komme i gang
    }
});

/* --- GENERISK MODAL LOGIKK --- */
// Lukker alle modaler hvis man klikker på den mørke bakgrunnen (utenfor innholdet)
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

function openLegend() {
    const m = document.getElementById('legendModal');
    if(m) m.style.display = 'flex';
}

function closeLegend() {
    const m = document.getElementById('legendModal');
    if(m) m.style.display = 'none';
}


/* --- CREATE RA FUNCTIONS --- */

function addRow() {
    rowCount++;
    const tbody = document.getElementById('raTableBody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>H-0${rowCount}</td>
        <td>
            <input type="text" class="ra-input" placeholder="Hazard (e.g. Battery Fire)" style="font-weight:bold; margin-bottom:5px;">
            <textarea class="ra-input" placeholder="Cause (e.g. Short circuit, puncture)"></textarea>
        </td>
        <td>
            <textarea class="ra-input" placeholder="Preventative Barriers (e.g. Pre-flight check, proper storage)"></textarea>
        </td>
        <td>
            <textarea class="ra-input" placeholder="Recovery Measures (e.g. Fire bag, PPE, safe distance)"></textarea>
        </td>
        <td>
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <select class="ra-input" onchange="updateRowColor(this)">
                    <option value="1">Prob: 1 (Ex. Impr.)</option>
                    <option value="2">Prob: 2 (Improb.)</option>
                    <option value="3" selected>Prob: 3 (Remote)</option>
                    <option value="4">Prob: 4 (Occas.)</option>
                    <option value="5">Prob: 5 (Freq.)</option>
                </select>
                <select class="ra-input" onchange="updateRowColor(this)">
                    <option value="1">Sev: 1 (Negl.)</option>
                    <option value="2">Sev: 2 (Minor)</option>
                    <option value="3" selected>Sev: 3 (Major)</option>
                    <option value="4">Sev: 4 (Haz.)</option>
                    <option value="5">Sev: 5 (Cat.)</option>
                </select>
            </div>
            <div class="risk-badge" style="text-align:center; padding:5px; border-radius:4px; font-weight:bold; background:#eee;">3C</div>
        </td>
        <td><button class="btn-sm" style="background:#dc3545; color:white;" onclick="removeRow(this)">X</button></td>
    `;
    tbody.appendChild(tr);
    updateComplexity();
    
    // Init farge for den nye raden
    const selects = tr.querySelectorAll('select');
    updateRowColor(selects[0]);
}

function removeRow(btn) {
    btn.closest('tr').remove();
    updateComplexity();
}

function updateRowColor(selectElement) {
    const row = selectElement.closest('tr');
    const selects = row.querySelectorAll('select');
    const prob = parseInt(selects[0].value);
    const sev = parseInt(selects[1].value);
    const badge = row.querySelector('.risk-badge');
    
    // CAP 1059 bruker tall, men ofte brukes bokstaver for severity i matriser for å skille dem.
    // Her mapper jeg 1-5 til E-A for visning (5=A=Catastrophic).
    const sevLetter = ['E','D','C','B','A'][sev-1]; 
    badge.innerText = `${prob}${sevLetter}`; 

    // Risk Logic (Basert på CAP 1059 Matrix)
    // Red (Unacceptable): 5A, 5B, 5C, 4A, 4B, 3A
    // Yellow (Review): 5D, 5E, 4C, 4D, 3B, 3C, 3D, 2A, 2B, 2C, 1A
    // Green (Acceptable): 4E, 3E, 2D, 2E, 1B, 1C, 1D, 1E
    
    let color = '#d4edda'; // Green default
    let text = '#155724';

    // Rød sone (Unacceptable)
    // Sev 5 (A): Prob 3,4,5
    // Sev 4 (B): Prob 4,5
    // Sev 3 (C): Prob 5
    if ((sev === 5 && prob >= 3) || (sev === 4 && prob >= 4) || (sev === 3 && prob === 5)) {
        color = '#f8d7da'; text = '#721c24';
    } 
    // Gul sone (Review)
    else if ((sev >= 3 && prob >= 2) || (sev === 2 && prob >= 4) || (sev === 5 && prob <= 2) || (sev === 1 && prob === 5)) {
        color = '#fff3cd'; text = '#856404';
    }
    // Resten er grønn (Acceptable)

    badge.style.backgroundColor = color;
    badge.style.color = text;
}

function updateComplexity() {
    const tableBody = document.getElementById('raTableBody');
    if (!tableBody) return;
    
    const tableRows = tableBody.rows.length;
    let score = tableRows * 10; // Base score per hazard
    
    // Visual logic
    const fill = document.getElementById('compFill');
    const label = document.getElementById('compLabel');
    const scoreText = document.getElementById('compScore');
    const advice = document.getElementById('compAdvice');

    if(!fill) return;

    let width = Math.min(100, score);
    fill.style.width = width + "%";
    scoreText.innerText = score + " pts";

    if (score < 30) {
        fill.style.backgroundColor = "#28a745";
        label.innerText = "Low Complexity";
        advice.innerText = "Standard operation. Routine monitoring sufficient.";
    } else if (score < 60) {
        fill.style.backgroundColor = "#ffc107";
        label.innerText = "Medium Complexity";
        advice.innerText = "Complex operation. Requires active management and briefing.";
    } else {
        fill.style.backgroundColor = "#dc3545";
        label.innerText = "High Complexity";
        advice.innerText = "Highly complex. Consider splitting operation or reducing scope.";
    }
}