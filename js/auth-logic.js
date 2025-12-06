/* js/auth-logic.js */

const infoData = {
    "droneType": "Select platform. Helicopter/Jet requires specific ratings.",
    "weight": "Open/MÅK limited to 25kg. Heavier requires Specific category.",
    "class": "Experimental applies to homebuilt or modified drones (Case Jørgen).",
    "competence": "A1/A3 & A2 (Civil). MÅK (Military Open). Specific (Complex).",
    "area": "Firing Range requires range control clearance."
};

document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('change', calculateRisk);
    });
    
    // Sett dagens dato
    const dateInput = document.getElementById('flightDate');
    if(dateInput) dateInput.valueAsDate = new Date();
    
    // Kjør en gang ved start for å markere gule felter
    calculateRisk();
});

// Modal Logic
function showInfo(key) {
    const modal = document.getElementById('infoModal');
    document.getElementById('modalTitle').innerText = key.charAt(0).toUpperCase() + key.slice(1);
    document.getElementById('modalText').innerText = infoData[key] || "No description.";
    modal.style.display = "flex";
}
function closeInfo() { document.getElementById('infoModal').style.display = "none"; }
window.onclick = function(event) { if (event.target == document.getElementById('infoModal')) closeInfo(); }

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
    // --- RESET STYLES ---
    document.querySelectorAll('.input-danger, .input-warning, .input-missing, .checkbox-danger').forEach(el => {
        el.classList.remove('input-danger', 'input-warning', 'input-missing', 'checkbox-danger');
    });
    document.querySelectorAll('.warning-icon-dynamic').forEach(el => el.style.display = 'none');

    // --- GET ELEMENTS ---
    const elDroneType = document.getElementById('droneType');
    const elWeight = document.getElementById('weight');
    const elClassStatus = document.getElementById('classStatus');
    const elEnergy = document.getElementById('energySource');
    const elDangerous = document.getElementById('dangerousGoods');
    const elPurpose = document.getElementById('purpose');
    const elArea = document.getElementById('area');
    const elAirspace = document.getElementById('airspace');
    const elAltitude = document.getElementById('altitude');
    const elOtherUsers = document.getElementById('otherUsers');
    const elAutopilot = document.getElementById('autopilot');
    const elCompetence = document.getElementById('competence');
    const elRecency = document.getElementById('recency');
    const elRA = document.getElementById('riskAssessment');

    // --- CHECK FOR MISSING INPUTS (LYSEGULT) ---
    let missingInput = false;
    const requiredFields = [
        elDroneType, elWeight, elClassStatus, elEnergy, elDangerous, 
        elPurpose, elArea, elAirspace, elAltitude, elOtherUsers, 
        elAutopilot, elCompetence, elRecency, elRA
    ];
    
    requiredFields.forEach(field => {
        if (field.value === "0" || field.value === "") {
            field.classList.add('input-missing');
            missingInput = true;
        }
    });

    const resultBox = document.getElementById('result-box');
    const gaugeNeedle = document.getElementById('gaugeNeedle');
    const gaugeText = document.getElementById('gaugeText');
    const submissionForm = document.getElementById('submissionForm');
    const formTitle = submissionForm.querySelector('h3');
    const formDesc = submissionForm.querySelector('p');

    if (window.initMap) window.initMap(); 

    if (missingInput) {
        resultBox.className = 'res-gray';
        resultBox.querySelector('.result-title').innerText = "AWAITING INPUT";
        resultBox.querySelector('.result-desc').innerText = "Please fill out highlighted yellow fields.";
        document.getElementById('warningList').style.display = 'none';
        gaugeNeedle.style.transform = `rotate(-90deg)`; 
        gaugeText.innerText = "Risk Score: -";
        return; 
    }

    // --- VALUES ---
    const droneType = elDroneType.value;
    const weight = elWeight.value;
    const classStatus = elClassStatus.value;
    const energySource = elEnergy.value;
    const dangerousGoods = elDangerous.value;
    const purpose = elPurpose.value;
    const area = elArea.value;
    const airspace = elAirspace.value;
    const altitude = elAltitude.value;
    const otherUsers = elOtherUsers.value;
    const autopilot = elAutopilot.value;
    const hasRA = elRA.value === 'yes';
    const competence = elCompetence.value;
    const recency = elRecency.value;
    const ffiCourse = document.getElementById('ffiCourse').checked;

    // Checkboxes (Rating)
    const rateMulti = document.getElementById('rate_multi').checked;
    const rateFixed = document.getElementById('rate_fixed').checked;
    const rateHeli = document.getElementById('rate_heli').checked;
    const rateVtol = document.getElementById('rate_vtol').checked;
    const rateLta = document.getElementById('rate_lta').checked;
    const rateAbove120 = document.getElementById('rate_above120').checked;
    const rate25 = document.getElementById('rate_25').checked;
    const rate150 = document.getElementById('rate_150').checked;
    const rateHeavy = document.getElementById('rate_heavy').checked;

    // Checkboxes (Qual)
    const qualHydrogen = document.getElementById('qual_hydrogen').checked;
    const qualAttack = document.getElementById('qual_attack').checked;
    
    // Helpers
    function mark(id, level) {
        const el = document.getElementById(id);
        if(el) el.classList.add(level === 'red' ? 'input-danger' : 'input-warning');
        toggleWarningIcon(id, true, level === 'red' ? 'danger' : 'warning');
    }
    function markLabel(id, level) {
        const el = document.getElementById('lbl_' + id);
        if(el && level==='red') el.classList.add('checkbox-danger');
    }

    let status = "green"; 
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard operation. Please provide flight information below.";
    let warnings = [];
    let riskFactors = []; 
    let temNotes = []; 
    let riskScore = 5; 

    // --- RISK SCORE CALCULATION ---
    // System
    if (weight === 'sub25') { riskScore += 10; riskFactors.push("Weight 4-25kg"); }
    if (weight === 'sub150') { riskScore += 30; riskFactors.push("Weight >25kg"); }
    if (weight === 'sub600' || weight === 'over600') { riskScore += 60; riskFactors.push("Heavy UAS"); }
    if (classStatus === 'experimental') { riskScore += 20; riskFactors.push("Experimental System"); }
    if (energySource === 'hydrogen') { riskScore += 25; riskFactors.push("Hydrogen Fuel"); }
    if (dangerousGoods === 'yes') { riskScore += 50; riskFactors.push("Live Weapons"); }
    if (dangerousGoods === 'pyro') { riskScore += 15; riskFactors.push("Pyrotechnics"); }
    
    // Operation
    if (area === 'populated') { riskScore += 25; riskFactors.push("Populated Area"); }
    if (area === 'firing_range') { riskScore += 10; riskFactors.push("Firing Range"); }
    if (airspace === 'danger_area') { riskScore += 10; riskFactors.push("Danger Area"); }
    if (altitude === 'above120') { riskScore += 20; riskFactors.push("Altitude >120m"); }
    if (otherUsers === 'medium') { riskScore += 15; riskFactors.push("Med. Air Traffic"); }
    if (otherUsers === 'high') { riskScore += 30; riskFactors.push("High Air Traffic"); }
    
    // Automation / Pilot
    if (autopilot === 'manual') { riskScore += 15; riskFactors.push("Manual Flight"); }
    if (purpose === 'demo') { riskScore += 10; riskFactors.push("Demo Flight"); }
    if (recency === 'recent') riskScore -= 5;
    if (recency === 'expired') { riskScore += 15; riskFactors.push("Pilot Not Recent"); }
    
    riskScore = Math.max(0, Math.min(100, riskScore));

    // --- STOPPER LOGIC (RED FLAGS) ---

    // 1. Mandatory Basics
    if (!ffiCourse) { status = "red"; markLabel('ffiCourse', 'red'); warnings.push("STOP: Missing FFI UAS Ground Course."); }
    if (competence === "none") { status = "red"; mark('competence', 'red'); warnings.push("STOP: Invalid competence certificate."); }

    // 2. Military vs Civil Competence Rules
    if ((competence === 'a1a3' || competence === 'a2') && (dangerousGoods === 'yes' || dangerousGoods === 'pyro')) {
        status = "red"; mark('competence', 'red'); mark('dangerousGoods', 'red');
        warnings.push("STOP: Civil Open Category (A1/A3/A2) prohibits Dangerous Goods / Munitions.");
    }

    // 3. MÅK Rules
    if (competence === 'maak' && (weight === 'sub150' || weight === 'sub600' || weight === 'over600')) {
        status = "red"; mark('competence', 'red'); mark('weight', 'red');
        warnings.push("STOP: MÅK is limited to 25kg. Heavier UAS requires Specific Category.");
    }
    if (competence === 'maak' && (dangerousGoods === 'yes' || dangerousGoods === 'pyro')) {
        status = "red"; mark('competence', 'red'); mark('dangerousGoods', 'red');
        warnings.push("STOP: MÅK prohibits armament/dangerous goods. Requires Specific Category.");
    }

    // 4. Weight vs Category General Check
    if ((competence === 'a1a3' || competence === 'a2') && (weight === 'sub150' || weight === 'sub600' || weight === 'over600')) {
        status = "red"; mark('competence', 'red'); mark('weight', 'red');
        warnings.push("STOP: Open Category is limited to 25kg.");
    }

    // 5. Ratings
    if (droneType === 'multirotor' && !rateMulti) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Multirotor rating."); }
    if (droneType.includes('fixed') && !rateFixed) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Fixed Wing rating."); }
    if (droneType === 'helicopter' && !rateHeli) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Helicopter rating."); }
    if (droneType === 'vtol' && !rateVtol) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing VTOL rating."); }
    if (droneType === 'lta' && !rateLta) { status = "red"; mark('droneType', 'red'); warnings.push("STOP: Missing Lighter Than Air rating."); }
    
    // 6. Altitude Check
    if (altitude === 'above120' && !rateAbove120) {
        status = "red"; mark('altitude', 'red'); markLabel('rate_above120', 'red');
        warnings.push("STOP: Pilot lacks 'Above 120m' rating for this altitude.");
    }

    // 7. RA Checks
    if (energySource === "hydrogen") {
        if (!hasRA) { 
            status = "red"; mark('energySource', 'red'); mark('riskAssessment', 'red'); 
            warnings.push("STOP: Hydrogen ops require Approved Risk Assessment."); 
        }
        else if (!qualHydrogen) { status = "red"; markLabel('qual_hydrogen', 'red'); warnings.push("STOP: Not qualified for Hydrogen Ops (RA-003)."); }
    }

    if (dangerousGoods === "yes") {
        if (!hasRA) { 
            status = "red"; mark('dangerousGoods', 'red'); mark('riskAssessment', 'red'); 
            warnings.push("STOP: Weapons require Approved Risk Assessment."); 
        }
        else if (!qualAttack) { status = "red"; markLabel('qual_attack', 'red'); warnings.push("STOP: Not qualified for Live Fire (RA-006)."); }
    }

    if (weight === 'sub600' || weight === 'over600') {
        if (!hasRA) {
            status = "red"; mark('weight', 'red'); mark('riskAssessment', 'red');
            warnings.push("STOP: Class 2/3 always requires Risk Assessment.");
        }
    }

    // --- WARNINGS & THRESHOLDS ---
    let submissionType = "log"; 

    if (status !== "red") {
        // High Risk / Orange
        if (riskScore > 70 || weight === 'sub150' || dangerousGoods === 'yes') {
            status = "orange";
            submissionType = "approval";
            title = "APPROVAL REQUIRED (HIGH RISK)";
            desc = "High risk profile. Explicit approval required.";
            
            let factors = riskFactors.slice(0, 3).join(", ") + (riskFactors.length > 3 ? "..." : "");
            warnings.push("NOTICE: High Risk System/Profile (" + factors + ")");
        }
        // Medium Risk / Yellow
        else if (riskScore > 40) {
            status = "yellow"; 
            submissionType = "approval";
            title = "REQUIRES O.L. APPROVAL";
            desc = "Elevated risk score (>40). Submit for approval.";
            warnings.push("NOTICE: Operation risk is elevated. Head of Ops approval required.");
        } 
    } else {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing.";
        submissionType = "denied";
    }

    // TEM Notes
    if (recency === 'expired' && status !== 'red') temNotes.push("TEM: Pilot recency low. Fly practice battery.");
    if (autopilot === 'manual') temNotes.push("TEM: Manual mode. Check RTH failsafe.");
    if (altitude === 'above120' && !hasRA) temNotes.push("TEM: Flight >120m requires specific clearance/RA in most cases.");
    
    // Date check for cold
    const d = document.getElementById('flightDate').valueAsDate;
    if (d && energySource === 'battery') {
        const m = d.getMonth(); 
        if (m === 10 || m === 11 || m === 0 || m === 1 || m === 2) {
            temNotes.push("TEM: Winter Ops. Pre-heat batteries >20°C.");
        }
    }

    // --- UPDATE UI ---
    resultBox.className = '';
    resultBox.classList.add(`res-${status}`);
    
    resultBox.querySelector('.result-title').innerText = title;
    resultBox.querySelector('.result-desc').innerText = desc;

    // Gauge
    const needleAngle = -90 + (riskScore * 1.8);
    gaugeNeedle.style.transform = `rotate(${needleAngle}deg)`;
    gaugeText.innerText = `Risk Score: ${riskScore} / 100`;

    // Warnings List
    const warningDiv = document.getElementById('warningList');
    let html = "";
    if (warnings.length > 0) html += '<strong>Items:</strong><ul>' + warnings.map(w => `<li>${w}</li>`).join('') + '</ul>';
    if (temNotes.length > 0) html += '<div style="margin-top:10px; padding-top:5px; border-top:1px solid #ccc; font-size:0.9em;"><strong><i class="fa-solid fa-shield-halved"></i> Safety Tips:</strong><ul>' + temNotes.map(n => `<li>${n}</li>`).join('') + '</ul></div>';
    
    warningDiv.innerHTML = html;
    warningDiv.style.display = (warnings.length > 0 || temNotes.length > 0) ? 'block' : 'none';

    // Submission Form Logic
    if (status === "red") {
        submissionForm.style.display = 'none';
    } else {
        submissionForm.style.display = 'block';
        if (submissionType === "approval") {
            formTitle.innerHTML = `<i class="fa-solid fa-file-signature"></i> Request Flight Approval`;
            formDesc.innerText = "Risk score exceeds threshold. Approval from Head of Operations is mandatory.";
            document.getElementById('submitBtn').innerText = "Submit Request for Approval";
            document.getElementById('submitBtn').style.backgroundColor = "#d35400"; 
        } else {
            formTitle.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> Flight Logging`;
            formDesc.innerText = "Standard operation. Submit to Ops Log.";
            document.getElementById('submitBtn').innerText = "Log Flight Details";
            document.getElementById('submitBtn').style.backgroundColor = "#28a745"; 
        }
    }
}

function loadScenario(type) {
    // Reset Checkboxes (only non-disabled ones!)
    document.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => cb.checked = false);
    
    // Reset Selects
    document.querySelectorAll('select').forEach(s => s.value = "0");

    document.getElementById('ffiCourse').checked = true;
    document.getElementById('recency').value = 'recent';
    
    if (type === 'jorgen') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('weight').value = 'sub25';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('dangerousGoods').value = 'no';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'populated';
        document.getElementById('airspace').value = 'uncontrolled';
        document.getElementById('altitude').value = 'below120';
        document.getElementById('otherUsers').value = 'low';
        document.getElementById('autopilot').value = 'stabilized';
        document.getElementById('riskAssessment').value = 'no'; 
        document.getElementById('competence').value = 'none';
        document.getElementById('ffiCourse').checked = false;
        document.getElementById('rate_multi').checked = true;
    } 
    else if (type === 'attack_drone') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('weight').value = 'sub25';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('dangerousGoods').value = 'yes';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'firing_range';
        document.getElementById('airspace').value = 'danger_area';
        document.getElementById('altitude').value = 'below120';
        document.getElementById('otherUsers').value = 'none';
        document.getElementById('autopilot').value = 'manual';
        document.getElementById('riskAssessment').value = 'no'; 
        document.getElementById('competence').value = 'maak'; 
        document.getElementById('rate_multi').checked = true;
    }
    else if (type === 'standard') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('weight').value = 'sub25';
        document.getElementById('classStatus').value = 'c_class';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('dangerousGoods').value = 'no';
        document.getElementById('purpose').value = 'training';
        document.getElementById('area').value = 'sparsely';
        document.getElementById('airspace').value = 'uncontrolled';
        document.getElementById('altitude').value = 'below120';
        document.getElementById('otherUsers').value = 'low';
        document.getElementById('autopilot').value = 'stabilized';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'maak';
        document.getElementById('rate_multi').checked = true;
        document.getElementById('rate_25').checked = true;
    }

    calculateRisk();
}