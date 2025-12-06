/* js/auth-logic.js */

const infoData = {
    "droneType": "Velg plattformen. Husk at helikoptre og jet-fly har høyere kinetisk energi og krever spesifikk rating.",
    "weight": "MÅK gjelder kun opp til 25 kg (Class 0 og 1A). Tyngre systemer krever Spesifikk eller Sertifisert kategori.",
    "class": "Eksperimentell/Prototype gjelder egenbygde eller modifiserte droner (Case Jørgen).",
    "competence": "MÅK er minimum for militær flyging (<25kg). Krever sivil A1/A3 + militært påbyggingskurs.",
    "area": "Fareområde (Firing Range) krever at man har kontroll på luftrommet via skytefeltforvalter."
};

document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('change', calculateRisk);
    });
    
    // Sett dagens dato som standard hvis feltet finnes
    const dateInput = document.getElementById('flightDate');
    if(dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    calculateRisk();
});

// Modal Logic
function showInfo(key) {
    const modal = document.getElementById('infoModal');
    document.getElementById('modalTitle').innerText = key.charAt(0).toUpperCase() + key.slice(1);
    document.getElementById('modalText').innerText = infoData[key] || "No description available.";
    modal.style.display = "flex";
}
function closeInfo() { document.getElementById('infoModal').style.display = "none"; }
window.onclick = function(event) {
    if (event.target == document.getElementById('infoModal')) closeInfo();
}

function toggleWarningIcon(groupId, show, type) {
    const group = document.getElementById('grp_' + groupId);
    if (!group) return;
    const icon = group.querySelector('.warning-icon-dynamic');
    if (icon) {
        icon.style.display = show ? 'inline-block' : 'none';
        icon.style.color = type === 'danger' ? '#dc3545' : '#ffc107';
    }
}

function calculateRisk() {
    if (!document.getElementById('droneType')) return; 

    // --- GET VALUES ---
    const droneType = document.getElementById('droneType').value;
    const weight = document.getElementById('weight').value;
    const classStatus = document.getElementById('classStatus').value;
    const energySource = document.getElementById('energySource').value;
    const dangerousGoods = document.getElementById('dangerousGoods').value;
    const purpose = document.getElementById('purpose').value;
    const area = document.getElementById('area').value;
    const autopilot = document.getElementById('autopilot').value;
    
    // Hent dato for kuldesjekk
    const flightDateVal = document.getElementById('flightDate') ? document.getElementById('flightDate').value : null;
    
    const hasRA = document.getElementById('riskAssessment').value === 'yes';
    const ffiCourse = document.getElementById('ffiCourse').checked;
    const competence = document.getElementById('competence').value;
    const recency = document.getElementById('recency').value;

    const qualHydrogen = document.getElementById('qual_hydrogen').checked;
    const qualAttack = document.getElementById('qual_attack').checked;

    const rateMulti = document.getElementById('rate_multi').checked;
    const rateFixed = document.getElementById('rate_fixed').checked;
    const rateHeli = document.getElementById('rate_heli').checked;
    
    const rate25 = document.getElementById('rate_25').checked;
    const rate150 = document.getElementById('rate_150').checked;
    const rateHeavy = document.getElementById('rate_heavy').checked;

    // --- RESET UI ---
    document.querySelectorAll('.input-warning, .input-danger, .missing-competence, .checkbox-danger').forEach(el => {
        el.classList.remove('input-warning', 'input-danger', 'missing-competence', 'checkbox-danger');
    });
    document.querySelectorAll('.warning-icon-dynamic').forEach(el => el.style.display = 'none');

    let status = "green"; 
    let icon = "fa-circle-check";
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard operation. Proceed iaw OM-A.";
    let warnings = [];
    let temNotes = []; 

    // --- RISK SCORE CALCULATION (0 - 100) ---
    let riskScore = 5; 

    // System Risk
    if (weight === 'sub25') riskScore += 10;
    if (weight === 'sub150') riskScore += 30;
    if (weight === 'sub600' || weight === 'over600') riskScore += 60;
    if (classStatus === 'experimental') riskScore += 20;
    if (energySource === 'hydrogen') riskScore += 25;
    if (dangerousGoods === 'yes') riskScore += 50; 
    if (dangerousGoods === 'pyro') riskScore += 15;

    // Operational Risk
    if (area === 'populated') riskScore += 25;
    if (autopilot === 'manual') riskScore += 15;
    if (purpose === 'demo') riskScore += 10;

    // Pilot Mitigation
    if (recency === 'recent') riskScore -= 5;
    if (recency === 'expired') riskScore += 15;

    // Clamp score
    riskScore = Math.max(0, Math.min(100, riskScore));

    function mark(id, level) {
        const el = document.getElementById(id);
        if(el) el.classList.add(level === 'red' ? 'input-danger' : 'input-warning');
        toggleWarningIcon(id, true, level === 'red' ? 'danger' : 'warning');
    }
    function markLabel(id, level) {
        const el = document.getElementById('lbl_' + id);
        if(el) {
            el.classList.add('missing-competence');
            if(level==='red') el.classList.add('checkbox-danger');
        }
    }

    // --- STOPPER LOGIC (RED FLAGS) ---

    // 1. Mandatory Basics
    if (!ffiCourse) { status = "red"; markLabel('ffiCourse', 'red'); warnings.push("STOP: Missing FFI UAS Ground Course."); }
    if (competence === "none") { status = "red"; mark('competence', 'red'); warnings.push("STOP: Invalid competence certificate."); }

    // 2. MÅK SPECIFIC RULES
    if (competence === 'maak') {
        // MÅK Vektgrense: < 25 kg [Ref 140-11 pkt 7a]
        if (weight === 'sub150' || weight === 'sub600' || weight === 'over600') {
            status = "red"; mark('weight', 'red'); mark('competence', 'red');
            warnings.push("STOP: MÅK is limited to max 25kg. Heavy UAS requires Specific/Certified category.");
        }
        // MÅK Forbud: Ingen bevæpning eller farlig gods [Ref 140-11 pkt 2m, 2n]
        if (dangerousGoods === 'yes' || dangerousGoods === 'pyro') {
            status = "red"; mark('dangerousGoods', 'red'); mark('competence', 'red');
            warnings.push("STOP: MÅK forbids armament and dangerous goods. Requires Specific Category.");
        }
        // MÅK Kombinerte operasjoner [Ref 140-11 pkt 2o]
        if (document.getElementById('otherUsers').value === 'high') {
             temNotes.push("TEM: MÅK forbids 'Combined Operations' (coordinated with manned aircraft). Ensure segregation.");
        }
    }

    // 3. Type Ratings
    if (droneType === 'multirotor' && !rateMulti) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Multirotor rating."); }
    if (droneType.includes('fixed') && !rateFixed) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Fixed Wing rating."); }
    if (droneType === 'helicopter' && !rateHeli) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Helicopter rating."); }

    // 4. Weight Ratings
    if ((weight === 'sub25') && !rate25) { status = "red"; mark('weight', 'red'); warnings.push("STOP: Missing Class 1A (<25kg) rating."); }
    if ((weight === 'sub150') && !rate150) { status = "red"; mark('weight', 'red'); warnings.push("STOP: Missing Class 1B (<150kg) rating."); }
    if ((weight === 'sub600' || weight === 'over600') && !rateHeavy) { status = "red"; mark('weight', 'red'); warnings.push("STOP: Missing Heavy UAS rating."); }

    // 5. Special Cases
    if (energySource === "hydrogen") {
        if (!hasRA) { status = "red"; mark('energySource', 'red'); warnings.push("STOP: Hydrogen ops require Approved Risk Assessment."); }
        else if (!qualHydrogen) { status = "red"; markLabel('qual_hydrogen', 'red'); warnings.push("STOP: Pilot not qualified for Hydrogen Ops (RA-003)."); }
    }

    if (dangerousGoods === "yes") {
        if (!hasRA) { status = "red"; mark('dangerousGoods', 'red'); warnings.push("STOP: Weapons require Approved Risk Assessment."); }
        else if (!qualAttack) { status = "red"; markLabel('qual_attack', 'red'); warnings.push("STOP: Pilot not qualified for Live Fire (RA-006)."); }
    }

    // --- WARNINGS (YELLOW/ORANGE) ---

    if (status !== "red") {
        if (riskScore > 70) {
            status = "orange"; warnings.push("HIGH RISK: Risk Score > 70. Flight Info submission required.");
        } else if (riskScore > 40) {
            status = "yellow"; warnings.push("ELEVATED RISK: Risk Score > 40. Proceed with caution.");
        }

        if (weight === 'sub150' || weight === 'sub600' || weight === 'over600' || dangerousGoods === 'yes') {
            if(status !== 'orange') status = "orange";
            warnings.push("REQUIREMENT: Heavy/Weaponized system. Submit Flight Info Form.");
        }
    }

    // --- TEM NOTES ---
    if (recency === 'expired' && status !== 'red') temNotes.push("TEM: Pilot recency is low. Consider flying a practice battery first.");
    if (autopilot === 'manual') temNotes.push("TEM: Manual mode selected. Ensure fail-safe (RTH) is configured.");
    
    // TEM: KULDE/BATTERI SJEKK (Nov - Mars)
    if (energySource === 'battery' && flightDateVal) {
        const dateObj = new Date(flightDateVal);
        const month = dateObj.getMonth(); // 0 = Januar, 11 = Desember
        
        // Nov(10), Des(11), Jan(0), Feb(1), Mar(2)
        if (month === 10 || month === 11 || month === 0 || month === 1 || month === 2) {
            temNotes.push("TEM: Winter operations detected. Check battery temp > 20°C before takeoff.");
        }
    }
    
    if (classStatus === 'experimental') temNotes.push("TEM: Experimental aircraft: Have fire extinguisher ready at launch/landing.");


    // --- UPDATE VISUALS ---
    const resultBox = document.getElementById('result-box');
    const warningDiv = document.getElementById('warningList');
    const submissionForm = document.getElementById('submissionForm');
    
    resultBox.className = '';
    resultBox.classList.add(`res-${status}`);
    
    if (status === "red") {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing.";
        icon = "fa-circle-xmark";
        submissionForm.style.display = 'none';
    } else if (status === "orange") {
        title = "FLIGHT INFO FORM REQUIRED";
        desc = "Operation approved pending submission.";
        icon = "fa-file-signature";
        submissionForm.style.display = 'block';
        if (window.initMap) window.initMap(); 
    } else if (status === "yellow") {
        title = "REQUIRES O.L. APPROVAL";
        desc = "Elevated risk. Log details with Head of Ops.";
        icon = "fa-triangle-exclamation";
        submissionForm.style.display = 'block';
        if (window.initMap) window.initMap(); 
    } else {
        title = "SELF-AUTHORIZATION PERMITTED";
        desc = "Standard operation. Fly safe!";
        icon = "fa-circle-check";
        submissionForm.style.display = 'none';
    }

    // Gauge Update
    const needleAngle = -90 + (riskScore * 1.8);
    document.getElementById('gaugeNeedle').style.transform = `rotate(${needleAngle}deg)`;
    document.getElementById('gaugeText').innerText = `Risk Score: ${riskScore} / 100`;

    // Text Update
    let html = "";
    if (warnings.length > 0) {
        html += '<strong>Action Items:</strong><ul>' + warnings.map(w => `<li>${w}</li>`).join('') + '</ul>';
    }
    if (temNotes.length > 0) {
        html += '<div style="margin-top:10px; border-top:1px solid rgba(0,0,0,0.1); padding-top:5px; font-size:0.9em;"><strong><i class="fa-solid fa-shield-halved"></i> Safety Tips (TEM):</strong><ul>' + temNotes.map(n => `<li style="color:#333;">${n}</li>`).join('') + '</ul></div>';
    }
    warningDiv.innerHTML = html;
    warningDiv.style.display = (warnings.length > 0 || temNotes.length > 0) ? 'block' : 'none';
}

function loadScenario(type) {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('ffiCourse').checked = true;
    document.getElementById('recency').value = 'recent';
    document.getElementById('rate_multi').checked = true;
    document.getElementById('rate_25').checked = true;
    
    const dateField = document.getElementById('flightDate');
    if(dateField) dateField.valueAsDate = new Date();

    if (type === 'jorgen') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('weight').value = 'sub25';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'populated';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'none'; 
        document.getElementById('ffiCourse').checked = false; 
    } 
    else if (type === 'attack_drone') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'firing_range';
        document.getElementById('airspace').value = 'danger_area';
        document.getElementById('dangerousGoods').value = 'yes';
        document.getElementById('riskAssessment').value = 'no'; 
        // OBS: Setter denne til "maak" for å demonstrere at verktøyet fanger opp at våpen ikke er lov i MÅK
        document.getElementById('competence').value = 'maak'; 
        document.getElementById('weight').value = 'sub25';
    }
    else if (type === 'standard') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'c_class';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'training';
        document.getElementById('area').value = 'sparsely';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'maak'; 
    }
    calculateRisk();
}