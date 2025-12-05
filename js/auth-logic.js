/* js/auth-logic.js */

document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('change', calculateRisk);
    });
    calculateRisk();
});

function calculateRisk() {
    // 1. HENT VERDIER
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
    // const qualBvlos = document.getElementById('qual_bvlos').checked;

    // Pilot Ratings (Generic)
    const rateMulti = document.getElementById('rate_multi').checked;
    const rateFixed = document.getElementById('rate_fixed').checked;
    const rateHeli = document.getElementById('rate_heli').checked;
    
    // Helper to clear styles
    document.querySelectorAll('.input-warning, .input-danger').forEach(el => {
        el.classList.remove('input-warning', 'input-danger');
    });
    function mark(id, level) {
        const el = document.getElementById(id);
        if(el) el.classList.add(level === 'red' ? 'input-danger' : 'input-warning');
    }

    // --- LOGIC ENGINE ---
    let status = "green"; 
    let icon = "fa-circle-check";
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard operation. You may proceed in accordance with OM-A.";
    let warnings = [];

    // ------------------------------------
    // 1. CRITICAL STOPPERS (RED)
    // ------------------------------------

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
    if ((droneType === 'multirotor' && !rateMulti) ||
        (droneType.includes('fixed') && !rateFixed) ||
        (droneType === 'helicopter' && !rateHeli)) {
        status = "red";
        mark('droneType', 'red');
        warnings.push(`STOP: Pilot lacks type rating for ${droneType.toUpperCase()}.`);
    }

    // --- COMPLEX OPERATIONS LOGIC ---

    // Hydrogen Logic
    if (energySource === "hydrogen") {
        if (!hasRA) {
            status = "red";
            mark('energySource', 'red');
            mark('riskAssessment', 'red');
            warnings.push("STOP: Hydrogen operations require an approved Risk Assessment (SORA).");
        } else if (!qualHydrogen) {
            status = "red";
            mark('qual_hydrogen', 'red'); // Highlight the checkbox logic (conceptually)
            warnings.push("STOP: Pilot is not qualified for RA-003 (Hydrogen Ops).");
        }
    }

    // Heavy Lift (>25kg)
    if ((weight === "sub150" || weight === "over150")) {
        // Krever både RA og Pilot Qualification
        if (!hasRA) {
            status = "red";
            mark('weight', 'red');
            warnings.push("STOP: Heavy UAS (>25kg) requires an approved Risk Assessment.");
        } else if (!qualHeavy) {
            status = "red";
            warnings.push("STOP: Pilot is not qualified for RA-002 (Heavy Lift).");
        }
    }

    // Demonstration / Audience
    if (purpose === "demo") {
        if (!hasRA) {
            status = "red";
            mark('purpose', 'red');
            warnings.push("STOP: Public demonstrations require an approved Risk Assessment covering crowd control.");
        } else if (!qualDemo) {
            status = "red";
            warnings.push("STOP: Pilot is not qualified for Display/Demo flying (RA-005).");
        }
    }

    // Experimental in Populated Area
    if (area === "populated" && classStatus === "experimental" && !hasRA) {
        status = "red";
        mark('area', 'red');
        mark('classStatus', 'red');
        warnings.push("STOP: Experimental drones prohibited in populated areas without approved risk assessment.");
    }

    // Dangerous Goods (Weapons)
    if (dangerousGoods === "yes") {
        status = "red";
        // Always red unless specific override logic exists, but let's say RA allows it
        if (!hasRA) {
            mark('dangerousGoods', 'red');
            warnings.push("STOP: Live weapons/munitions require an APPROVED risk assessment.");
        } else {
            // Even with RA, weapons usually require Ops Leader signature per flight
            // so we keep it at least Yellow, or maybe Red "Contact Ops Leader"
            status = "yellow";
            mark('dangerousGoods', 'yellow');
            warnings.push("RESTRICTED: Weapon operations require specific written authorization per flight from Head of Ops.");
        }
    }

    // ------------------------------------
    // 2. WARNINGS (YELLOW)
    // ------------------------------------
    if (status !== "red") {
        // Experimental hardware (Outside populated area)
        if (classStatus === "experimental" && !hasRA) {
            status = "yellow";
            mark('classStatus', 'yellow');
            warnings.push("NOTICE: Experimental hardware requires Head of Operations awareness (unless covered by RA).");
        }

        // Recency
        if (recency === "expired") {
            status = "yellow";
            mark('recency', 'yellow');
            warnings.push("NOTICE: Pilot recency >90 days. Practical checkflight with instructor required.");
        } else if (recency === "medium") {
            mark('recency', 'yellow'); // Just visual warning
        }
    }

    // ------------------------------------
    // 3. UPDATE UI
    // ------------------------------------
    if (status === "red") {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements or qualifications missing.";
        icon = "fa-circle-xmark";
    } else if (status === "yellow") {
        title = "REQUIRES APPROVAL (HEAD OF OPS)";
        desc = "Elevated risk profile. Submit for Operational Leader approval.";
        icon = "fa-triangle-exclamation";
    } else {
        // Green
        title = "SELF-AUTHORIZATION PERMITTED";
        desc = "Operation is within approved limits and pilot qualifications. Fly safe!";
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
        document.getElementById('area').value = 'sparsely';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'a1a3';
        document.getElementById('recency').value = 'recent';
    } 
    else if (type === 'hydrogen_safe') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'controlled_ground';
        document.getElementById('riskAssessment').value = 'yes';
        document.getElementById('competence').value = 'sts';
        document.getElementById('ffiCourse').checked = true;
        document.getElementById('recency').value = 'recent';
        // Pilot is qualified
        document.getElementById('qual_hydrogen').checked = true;
    }
    else if (type === 'demo_flight') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'c_class';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'demo';
        document.getElementById('area').value = 'populated';
        document.getElementById('competence').value = 'sts';
        document.getElementById('riskAssessment').value = 'yes';
        // Need demo qual
        document.getElementById('qual_demo').checked = true;
        document.getElementById('recency').value = 'recent';
    }

    calculateRisk();
}