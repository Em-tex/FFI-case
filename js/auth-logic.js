/* js/auth-logic.js */

const infoData = {
    "droneType": "Select platform. Helicopter/Jet requires specific ratings.",
    "weight": "Open/MÅK limited to 25kg. Heavier requires Specific category.",
    "class": "Experimental applies to homebuilt or modified drones (Case Jørgen).",
    "competence": "A1/A3 & A2 (Civil Open). Specific (Approved RA).",
    "area": "Firing Range requires range control clearance."
};

document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('change', calculateRisk);
    });
    
    const dateInput = document.getElementById('flightDate');
    if(dateInput) dateInput.valueAsDate = new Date();
    
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

    // --- CHECK FOR MISSING INPUTS ---
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

    if (missingInput) {
        resultBox.className = 'res-gray'; // Reset to gray
        resultBox.querySelector('.result-title').innerText = "AWAITING INPUT";
        resultBox.querySelector('.result-desc').innerText = "Please fill out highlighted yellow fields.";
        document.getElementById('warningList').style.display = 'none';
        gaugeNeedle.style.transform = `rotate(-90deg)`; 
        gaugeText.innerText = "Risk Score: -";
        submissionForm.style.display = 'none'; // Hide form until ready
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
    
    // Checkboxes (Qualification for RA)
    const qualHydrogen = document.getElementById('qual_hydrogen').checked;
    const qualAttack = document.getElementById('qual_attack').checked;
    // We assume generic RA qualification if checking "Specific" without specific boxes for general RAs
    
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
    if (weight === 'sub25') { riskScore += 10; riskFactors.push("Weight 4-25kg"); }
    if (weight === 'sub150') { riskScore += 30; riskFactors.push("Weight >25kg"); }
    if (weight === 'sub600' || weight === 'over600') { riskScore += 60; riskFactors.push("Heavy UAS"); }
    if (classStatus === 'experimental') { riskScore += 20; riskFactors.push("Experimental"); }
    if (energySource === 'hydrogen') { riskScore += 25; riskFactors.push("Hydrogen"); }
    if (dangerousGoods === 'yes') { riskScore += 50; riskFactors.push("Weapons"); }
    if (dangerousGoods === 'pyro') { riskScore += 15; riskFactors.push("Pyro"); }
    
    if (area === 'populated') { riskScore += 25; riskFactors.push("Populated Area"); }
    if (area === 'firing_range') { riskScore += 10; riskFactors.push("Firing Range"); }
    if (airspace === 'danger_area') { riskScore += 10; riskFactors.push("Danger Area"); }
    if (altitude === 'above120') { riskScore += 20; riskFactors.push(">120m"); }
    if (otherUsers === 'medium') { riskScore += 15; riskFactors.push("Traffic"); }
    if (otherUsers === 'high') { riskScore += 30; riskFactors.push("High Traffic"); }
    
    if (autopilot === 'manual') { riskScore += 15; riskFactors.push("Manual Flight"); }
    if (purpose === 'demo') { riskScore += 10; riskFactors.push("Demo"); }
    if (recency === 'recent') riskScore -= 5;
    if (recency === 'expired') { riskScore += 15; riskFactors.push("Recency"); }
    
    riskScore = Math.max(0, Math.min(100, riskScore));

    // --- STOPPER LOGIC (RED FLAGS) ---

    // 1. Mandatory Basics
    if (!ffiCourse) { status = "red"; markLabel('ffiCourse', 'red'); warnings.push("STOP: Missing FFI UAS Ground Course."); }
    if (competence === "none") { status = "red"; mark('competence', 'red'); warnings.push("STOP: Invalid competence certificate."); }

    // 2. Competence vs RA Requirement (NY REGEL)
    if (hasRA && (competence === 'a1a3' || competence === 'a2')) {
        status = "red"; mark('competence', 'red'); mark('riskAssessment', 'red');
        warnings.push("STOP: Operations requiring Risk Assessment cannot be flown on Open Category (A1/A3/A2) competence.");
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

    // 4. Weight vs Open Category
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
    
    if (altitude === 'above120' && !rateAbove120) {
        status = "red"; mark('altitude', 'red'); markLabel('rate_above120', 'red');
        warnings.push("STOP: Pilot lacks 'Above 120m' rating.");
    }

    // 6. RA Checks & Qualification Logic
    let pilotIsQualifiedForRisk = false;

    // Check specific qualifications against risks
    if (energySource === "hydrogen") {
        if (!hasRA) { 
            status = "red"; mark('energySource', 'red'); mark('riskAssessment', 'red'); 
            warnings.push("STOP: Hydrogen ops require Approved Risk Assessment."); 
        } else if (qualHydrogen) {
            pilotIsQualifiedForRisk = true; // Pilot is cleared for this specific high risk
        } else {
            status = "red"; markLabel('qual_hydrogen', 'red'); 
            warnings.push("STOP: Not qualified for Hydrogen Ops (RA-003).");
        }
    }

    if (dangerousGoods === "yes") {
        if (!hasRA) { 
            status = "red"; mark('dangerousGoods', 'red'); mark('riskAssessment', 'red'); 
            warnings.push("STOP: Weapons require Approved Risk Assessment."); 
        } else if (qualAttack) {
            pilotIsQualifiedForRisk = true;
        } else {
            status = "red"; markLabel('qual_attack', 'red'); 
            warnings.push("STOP: Not qualified for Live Fire (RA-006).");
        }
    }

    if (weight === 'sub600' || weight === 'over600') {
        if (!hasRA) {
            status = "red"; mark('weight', 'red'); mark('riskAssessment', 'red');
            warnings.push("STOP: Class 2/3 always requires Risk Assessment.");
        }
        // Assuming Heavy rating covers qualification here, or generic specific
    }


    // --- STATUS DECISION (Green/Yellow/Orange) ---
    let submissionType = "log"; 

    if (status !== "red") {
        // High Risk Conditions
        const isHighRisk = (riskScore > 70 || weight === 'sub150' || dangerousGoods === 'yes' || energySource === 'hydrogen');
        
        if (isHighRisk) {
            if (pilotIsQualifiedForRisk) {
                // EXCEPTION: Pilot is qualified for this specific high risk -> Allow logging (Green/Yellow)
                status = "yellow"; 
                title = "AUTHORIZED (QUALIFIED PILOT)";
                desc = "High risk operation authorized due to specific pilot qualification.";
                warnings.push("INFO: Operation is High Risk, but pilot holds valid qualification.");
            } else {
                // Standard High Risk -> Approval required
                status = "orange";
                submissionType = "approval";
                title = "APPROVAL REQUIRED";
                desc = "High risk profile. Explicit approval required.";
                let factors = riskFactors.slice(0, 3).join(", ") + (riskFactors.length > 3 ? "..." : "");
                warnings.push("NOTICE: High Risk Factors: " + factors);
            }
        }
        else if (riskScore > 40) {
            // Medium Risk
            status = "yellow"; 
            submissionType = "approval";
            title = "REQUIRES O.L. APPROVAL";
            desc = "Elevated risk score (>40). Submit for approval.";
            warnings.push("NOTICE: Operation risk is elevated.");
        } 
    } else {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing.";
        submissionType = "denied";
    }

    // TEM Notes
    if (recency === 'expired' && status !== 'red') temNotes.push("TEM: Pilot recency low. Fly practice battery.");
    if (autopilot === 'manual') temNotes.push("TEM: Manual mode. Check RTH failsafe.");
    
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

    const needleAngle = -90 + (riskScore * 1.8);
    gaugeNeedle.style.transform = `rotate(${needleAngle}deg)`;
    gaugeText.innerText = `Risk Score: ${riskScore} / 100`;

    const warningDiv = document.getElementById('warningList');
    let html = "";
    if (warnings.length > 0) html += '<strong>Items:</strong><ul>' + warnings.map(w => `<li>${w}</li>`).join('') + '</ul>';
    if (temNotes.length > 0) html += '<div style="margin-top:10px; padding-top:5px; border-top:1px solid #ccc; font-size:0.9em;"><strong><i class="fa-solid fa-shield-halved"></i> Safety Tips:</strong><ul>' + temNotes.map(n => `<li>${n}</li>`).join('') + '</ul></div>';
    
    warningDiv.innerHTML = html;
    warningDiv.style.display = (warnings.length > 0 || temNotes.length > 0) ? 'block' : 'none';

    // Show/Hide Submission Form
    if (status === "red") {
        submissionForm.style.display = 'none';
    } else {
        submissionForm.style.display = 'block';
        
        // Refresh Map Size!
        if(window.map) window.map.invalidateSize();
        
        if (submissionType === "approval") {
            formTitle.innerHTML = `<i class="fa-solid fa-file-signature"></i> Request Flight Approval`;
            formDesc.innerText = "Risk score exceeds threshold. Approval from Head of Operations is mandatory.";
            document.getElementById('submitBtn').innerText = "Submit Request for Approval";
            document.getElementById('submitBtn').style.backgroundColor = "#d35400"; 
        } else {
            formTitle.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> Flight Information`;
            formDesc.innerText = "Please provide information of your flight using the form below.";
            document.getElementById('submitBtn').innerText = "Log Flight Details";
            document.getElementById('submitBtn').style.backgroundColor = "#28a745"; 
        }
    }
}

function loadScenario(type) {
    document.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => cb.checked = false);
    document.querySelectorAll('select').forEach(s => s.value = "0");

    document.getElementById('ffiCourse').checked = true;
    document.getElementById('recency').value = 'recent';
    if(window.clearMap) window.clearMap();

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