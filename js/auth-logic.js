/* js/auth-logic.js */

// Info Dictionary for Modals
const infoData = {
    "droneType": "Velg plattformen som best beskriver luftfartøyet. For hybrider (f.eks. VTOL fixed wing), velg VTOL.",
    "weight": "Maksimal avgangsvekt (MTOM) inkludert nyttelast og drivstoff.",
    "class": "C-klasse gjelder kun droner som er CE-merket med klassemke (C0-C6). Eksperimentell/Prototype gjelder egenbygde eller modifiserte droner.",
    "area": "Kontrollert bakkeområde krever at du har fysisk kontroll på tilgang (gjerder, vakter). Fareområde (Firing Range) er for militær øvelse/testing.",
    "competence": "Gyldig sertifikat fra Luftfartstilsynet eller EASA-medlemsland."
};

document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('change', calculateRisk);
    });
    calculateRisk();
});

// Modal functions
function showInfo(key) {
    const modal = document.getElementById('infoModal');
    document.getElementById('modalTitle').innerText = key.charAt(0).toUpperCase() + key.slice(1);
    document.getElementById('modalText').innerText = infoData[key] || "No description available.";
    modal.style.display = "flex";
}
function closeInfo() {
    document.getElementById('infoModal').style.display = "none";
}
// Close on outside click
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target == modal) modal.style.display = "none";
}


function calculateRisk() {
    if (!document.getElementById('droneType')) return; 

    // UAS
    const droneType = document.getElementById('droneType').value;
    const weight = document.getElementById('weight').value;
    const classStatus = document.getElementById('classStatus').value;
    const energySource = document.getElementById('energySource').value;
    const dangerousGoods = document.getElementById('dangerousGoods').value;

    // Operation
    const purpose = document.getElementById('purpose').value;
    const area = document.getElementById('area').value;
    const altitude = document.getElementById('altitude').value;
    const hasRA = document.getElementById('riskAssessment').value === 'yes';

    // Pilot Competence
    const ffiCourse = document.getElementById('ffiCourse').checked;
    const competence = document.getElementById('competence').value;
    const recency = document.getElementById('recency').value;

    // Pilot Qualifications (RA Specifics)
    const qualHydrogen = document.getElementById('qual_hydrogen').checked;
    const qualHeavy = document.getElementById('qual_heavy').checked;
    const qualDemo = document.getElementById('qual_demo').checked;
    const qualAttack = document.getElementById('qual_attack').checked;

    // Pilot Ratings (Generic)
    const rateMulti = document.getElementById('rate_multi').checked;
    const rateFixed = document.getElementById('rate_fixed').checked;
    const rateHeli = document.getElementById('rate_heli').checked;
    
    // Weight Ratings
    const rate4 = document.getElementById('rate_4').checked;
    const rate25 = document.getElementById('rate_25').checked;
    const rate150 = document.getElementById('rate_150').checked;
    const rateHeavy = document.getElementById('rate_heavy').checked;

    // Helper to clear styles
    document.querySelectorAll('.input-warning, .input-danger, .missing-competence').forEach(el => {
        el.classList.remove('input-warning', 'input-danger', 'missing-competence');
    });
    
    function mark(id, level) {
        const el = document.getElementById(id);
        if(el) el.classList.add(level === 'red' ? 'input-danger' : 'input-warning');
    }
    
    // Helper for checkbox labels
    function markLabel(id, level) {
        const el = document.getElementById('lbl_' + id);
        if(el) el.classList.add('missing-competence');
    }

    // --- LOGIC ENGINE ---
    let status = "green"; 
    let icon = "fa-circle-check";
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard operation. You may proceed in accordance with OM-A.";
    let warnings = [];

    // 1. CRITICAL STOPPERS (RED)
    
    // Basic Formalities
    if (!ffiCourse) {
        status = "red";
        warnings.push("STOP: Pilot has not completed mandatory FFI UAS Ground Course.");
    }
    if (competence === "none") {
        status = "red";
        mark('competence', 'red');
        warnings.push("STOP: Pilot lacks valid EASA competency certificate.");
    }

    // Type Rating Check
    if ((droneType === 'multirotor' && !rateMulti)) {
        status = "red"; mark('droneType', 'red'); markLabel('rate_multi', 'red');
        warnings.push(`STOP: Pilot lacks type rating for MULTIROTOR.`);
    }
    if ((droneType.includes('fixed') && !rateFixed)) {
        status = "red"; mark('droneType', 'red'); markLabel('rate_fixed', 'red');
        warnings.push(`STOP: Pilot lacks type rating for FIXED WING.`);
    }
    if ((droneType === 'helicopter' && !rateHeli)) {
        status = "red"; mark('droneType', 'red'); markLabel('rate_heli', 'red');
        warnings.push(`STOP: Pilot lacks type rating for HELICOPTER.`);
    }

    // Weight Mismatch Logic
    let weightMissing = false;
    if (weight === 'sub4' && !rate4) weightMissing = true;
    if (weight === 'sub25' && !rate25) weightMissing = true;
    if (weight === 'sub150' && !rate150) weightMissing = true;
    if (weight === 'over150' && !rateHeavy) weightMissing = true;

    if (weightMissing) {
        status = "red";
        mark('weight', 'red');
        // Vi kunne markert checkboxene her også, men det blir komplekst å vite hvilken.
        warnings.push("STOP: Pilot lacks the specific Weight Rating for this aircraft.");
    }

    // Hydrogen
    if (energySource === "hydrogen") {
        if (!hasRA) {
            status = "red"; mark('energySource', 'red'); mark('riskAssessment', 'red');
            warnings.push("STOP: Hydrogen operations require an approved Risk Assessment (SORA).");
        } else if (!qualHydrogen) {
            status = "red"; markLabel('qual_hydrogen', 'red');
            warnings.push("STOP: Pilot is not qualified for RA-003 (Hydrogen Ops).");
        }
    }

    // Dangerous Goods / Weapons
    if (dangerousGoods === "yes") {
        if (!hasRA) {
            status = "red"; mark('dangerousGoods', 'red');
            warnings.push("STOP: Live weapons/munitions require an APPROVED risk assessment (RA-006).");
        } else if (!qualAttack) {
            status = "red"; markLabel('qual_attack', 'red');
            warnings.push("STOP: Pilot is not qualified for RA-006 (Live Fire).");
        }
    }

    // Experimental in Populated
    if (area === "populated" && classStatus === "experimental" && !hasRA) {
        status = "red"; mark('area', 'red'); mark('classStatus', 'red');
        warnings.push("STOP: Experimental drones prohibited in populated areas without approved risk assessment.");
    }

    // Altitude
    if (altitude === "above120" && !hasRA) {
        status = "red"; mark('altitude', 'red');
        warnings.push("STOP: Flight above 120m requires approved Risk Assessment.");
    }

    // 2. WARNINGS (YELLOW / ORANGE)
    if (status !== "red") {
        
        // Flight Info Form Logic (Orange)
        if (weight === 'sub150' || weight === 'over150' || dangerousGoods === 'yes') {
            status = "orange"; // Ny fargekode for "Flight Info Form Required"
            warnings.push("REQUIREMENT: High Risk Asset/Payload. <strong>Submit Flight Information Form</strong> to Head of Ops before flight.");
        }

        // Experimental
        if (classStatus === "experimental" && !hasRA) {
            if(status !== 'orange') status = "yellow";
            mark('classStatus', 'yellow');
            warnings.push("NOTICE: Experimental hardware requires Head of Operations awareness.");
        }

        // Demo
        if (purpose === "demo") {
            if(status !== 'orange') status = "yellow";
            warnings.push("NOTICE: Audience demonstrations entail 3rd party risk. Head of Ops authorization required.");
        }

        // Recency
        if (recency === "expired") {
            if(status !== 'orange') status = "yellow";
            mark('recency', 'yellow');
            warnings.push("NOTICE: Pilot recency >90 days. Practical checkflight with instructor required.");
        }
    }

    // 3. UI Update
    if (status === "red") {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing.";
        icon = "fa-circle-xmark";
    } else if (status === "orange") {
        title = "FLIGHT INFO FORM REQUIRED";
        desc = "Operation permitted, but requires filing of Flight Info Form due to risk profile.";
        icon = "fa-file-signature";
    } else if (status === "yellow") {
        title = "REQUIRES APPROVAL (HEAD OF OPS)";
        desc = "Elevated risk profile. Submit for Operational Leader approval.";
        icon = "fa-triangle-exclamation";
    } else {
        title = "SELF-AUTHORIZATION PERMITTED";
        desc = "Standard operation within approved limits. Fly safe!";
        icon = "fa-circle-check";
    }

    const resultBox = document.getElementById('result-box');
    const warningDiv = document.getElementById('warningList');
    
    resultBox.className = '';
    resultBox.classList.add(`res-${status}`);
    resultBox.querySelector('.result-icon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
    resultBox.querySelector('.result-title').innerText = title;
    resultBox.querySelector('.result-desc').innerText = desc;

    if (warnings.length > 0) {
        warningDiv.style.display = 'block';
        warningDiv.innerHTML = '<strong>Action Items:</strong><ul>' + warnings.map(w => `<li>${w}</li>`).join('') + '</ul>';
    } else {
        warningDiv.style.display = 'none';
    }
}

function loadScenario(type) {
    // Reset defaults
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('ffiCourse').checked = true;
    document.getElementById('rate_multi').checked = true;
    document.getElementById('rate_vlos').checked = true;
    document.getElementById('dangerousGoods').value = 'no';
    document.getElementById('area').value = 'sparsely';

    if (type === 'jorgen') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'populated';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'none'; 
        document.getElementById('ffiCourse').checked = false; 
    } 
    else if (type === 'standard') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'c_class';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'a1a3';
        document.getElementById('recency').value = 'recent';
        // Auto-check correct weights
        document.getElementById('rate_4').checked = true; 
    } 
    else if (type === 'hydrogen_safe') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'controlled_ground';
        document.getElementById('riskAssessment').value = 'yes';
        document.getElementById('competence').value = 'sts';
        document.getElementById('recency').value = 'recent';
        // Qualifications
        document.getElementById('qual_hydrogen').checked = true;
        document.getElementById('rate_4').checked = true; 
    }
    else if (type === 'attack_drone') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'firing_range';
        document.getElementById('airspace').value = 'danger_area';
        document.getElementById('dangerousGoods').value = 'yes';
        document.getElementById('riskAssessment').value = 'yes';
        
        document.getElementById('competence').value = 'sts';
        document.getElementById('recency').value = 'recent';
        // Quals
        document.getElementById('qual_attack').checked = true;
        document.getElementById('rate_4').checked = true; 
    }

    calculateRisk();
}