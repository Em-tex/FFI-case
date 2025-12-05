/* js/auth-logic.js */

// Info Dictionary
const infoData = {
    "droneType": "Velg plattformen som best beskriver luftfartøyet. For hybrider (f.eks. VTOL fixed wing), velg VTOL.",
    "weight": "Maksimal avgangsvekt (MTOM) inkludert nyttelast og drivstoff.",
    "class": "C-klasse gjelder kun droner som er CE-merket med klassemerke (C0-C6). Eksperimentell/Prototype gjelder egenbygde eller modifiserte droner.",
    "area": "Et kontrollert bakkeområde innebærer at du har kontroll på risikoen for tredjepart på bakken. Dette kan være et inngjerdet område, eller et åpent område (f.eks. jorde) med god sikt der operasjonen kan stanses hvis uvedkommende nærmer seg. Fareområde (Firing Range) er for militær øvelse/testing.",
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
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target == modal) modal.style.display = "none";
}

// Function to toggle warning icons
function toggleWarningIcon(groupId, show, type) {
    const group = document.getElementById('grp_' + groupId);
    if (!group) return;
    const icon = group.querySelector(type === 'danger' ? '.warning-icon-dynamic' : '.warning-icon-dynamic');
    // For enkelhets skyld bruker vi samme icon class i HTML men bytter farge via CSS eller bare viser den
    // Her viser vi den hvis show = true
    if (icon) {
        icon.style.display = show ? 'inline-block' : 'none';
        icon.style.color = type === 'danger' ? '#dc3545' : '#ffc107';
    }
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

    // Pilot
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
    const rateVtol = document.getElementById('rate_vtol').checked;
    const rateLta = document.getElementById('rate_lta').checked;
    
    // Weight Ratings
    const rate4 = document.getElementById('rate_4').checked;
    const rate25 = document.getElementById('rate_25').checked;
    const rate150 = document.getElementById('rate_150').checked;
    const rateHeavy = document.getElementById('rate_heavy').checked;

    // Ops Ratings
    const rateBvlos = document.getElementById('rate_bvlos').checked;
    const rateAbove120 = document.getElementById('rate_above120').checked;

    // RESET VISUALS
    document.querySelectorAll('.input-warning, .input-danger, .missing-competence').forEach(el => {
        el.classList.remove('input-warning', 'input-danger', 'missing-competence');
    });
    document.querySelectorAll('.warning-icon-dynamic').forEach(el => el.style.display = 'none');

    function mark(id, level) {
        const el = document.getElementById(id);
        if(el) el.classList.add(level === 'red' ? 'input-danger' : 'input-warning');
        // Show icon
        toggleWarningIcon(id, true, level === 'red' ? 'danger' : 'warning');
    }
    
    function markLabel(id) {
        const el = document.getElementById('lbl_' + id);
        if(el) el.classList.add('missing-competence');
    }

    let status = "green"; 
    let icon = "fa-circle-check";
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard operation. You may proceed in accordance with OM-A.";
    let warnings = [];

    // --- LOGIC ---

    // 1. CRITICAL STOPPERS (RED)
    if (!ffiCourse) { status = "red"; warnings.push("STOP: Pilot has not completed mandatory FFI UAS Ground Course."); }
    if (competence === "none") { status = "red"; mark('competence', 'red'); warnings.push("STOP: Pilot lacks valid EASA competency certificate."); }

    // Type Rating Mismatch
    if ((droneType === 'multirotor' && !rateMulti)) { status = "red"; mark('droneType', 'red'); markLabel('rate_multi'); warnings.push(`STOP: Pilot lacks type rating for MULTIROTOR.`); }
    if ((droneType.includes('fixed') && !rateFixed)) { status = "red"; mark('droneType', 'red'); markLabel('rate_fixed'); warnings.push(`STOP: Pilot lacks type rating for FIXED WING.`); }
    if ((droneType === 'helicopter' && !rateHeli)) { status = "red"; mark('droneType', 'red'); markLabel('rate_heli'); warnings.push(`STOP: Pilot lacks type rating for HELICOPTER.`); }
    if ((droneType === 'vtol' && !rateVtol)) { status = "red"; mark('droneType', 'red'); markLabel('rate_vtol'); warnings.push(`STOP: Pilot lacks type rating for VTOL.`); }
    if ((droneType === 'lta' && !rateLta)) { status = "red"; mark('droneType', 'red'); markLabel('rate_lta'); warnings.push(`STOP: Pilot lacks type rating for LIGHTER THAN AIR.`); }

    // Weight Mismatch
    if (weight === 'sub4' && !rate4) { status = "red"; mark('weight', 'red'); markLabel('rate_4'); warnings.push("STOP: Pilot lacks '250g - 4kg' rating."); }
    if (weight === 'sub25' && !rate25) { status = "red"; mark('weight', 'red'); markLabel('rate_25'); warnings.push("STOP: Pilot lacks '4 - 25kg' rating."); }
    if (weight === 'sub150' && !rate150) { status = "red"; mark('weight', 'red'); markLabel('rate_150'); warnings.push("STOP: Pilot lacks '25 - 150kg' rating."); }
    if (weight === 'over150' && !rateHeavy) { status = "red"; mark('weight', 'red'); markLabel('rate_heavy'); warnings.push("STOP: Pilot lacks 'Heavy (>150kg)' rating."); }

    // Hydrogen
    if (energySource === "hydrogen") {
        if (!hasRA) {
            status = "red"; mark('energySource', 'red'); mark('riskAssessment', 'red');
            warnings.push("STOP: Hydrogen operations require an approved Risk Assessment.");
        } else if (!qualHydrogen) {
            status = "red"; markLabel('qual_hydrogen');
            warnings.push("STOP: Pilot is not qualified for RA-003 (Hydrogen Ops).");
        }
    }

    // Dangerous Goods (Weapons)
    if (dangerousGoods === "yes") {
        if (!hasRA) {
            status = "red"; mark('dangerousGoods', 'red');
            warnings.push("STOP: Live weapons/munitions require an APPROVED risk assessment.");
        } else if (!qualAttack) {
            status = "red"; markLabel('qual_attack');
            warnings.push("STOP: Pilot is not qualified for RA-006 (Live Fire).");
        }
    }

    // Altitude
    if (altitude === "above120") {
        if (!hasRA) {
            status = "red"; mark('altitude', 'red');
            warnings.push("STOP: Flight above 120m requires approved Risk Assessment.");
        } else if (!rateAbove120) {
            status = "red"; markLabel('rate_above120');
            warnings.push("STOP: Pilot lacks 'Above 120m' operational rating.");
        }
    }

    // Demo Flight Logic (FIXED)
    if (purpose === "demo") {
        if (!hasRA) {
            status = "red"; mark('purpose', 'red');
            warnings.push("STOP: Public demonstrations require an approved Risk Assessment (RA-005).");
        } else if (!qualDemo) {
            status = "red"; markLabel('qual_demo');
            warnings.push("STOP: Pilot is not qualified for Display/Demo flying.");
        } else {
            // If Pilot has RA and Qual -> OK (Green/Orange depending on other factors)
        }
    }

    // Experimental
    if (area === "populated" && classStatus === "experimental" && !hasRA) {
        status = "red"; mark('area', 'red'); mark('classStatus', 'red');
        warnings.push("STOP: Experimental drones prohibited in populated areas without approved risk assessment.");
    }

    // 2. WARNINGS (YELLOW/ORANGE)
    if (status !== "red") {
        // Flight Info Form logic (Orange)
        if (weight === 'sub150' || weight === 'over150' || dangerousGoods === 'yes') {
            status = "orange";
            warnings.push("REQUIREMENT: High Risk Asset. <strong>Submit Flight Information Form</strong> to Head of Ops before flight.");
        }

        if (classStatus === "experimental" && !hasRA) {
            if(status!=='orange') status = "yellow";
            mark('classStatus', 'yellow');
            warnings.push("NOTICE: Experimental hardware requires Head of Operations awareness.");
        }

        if (recency === "expired") {
            if(status!=='orange') status = "yellow";
            mark('recency', 'yellow');
            warnings.push("NOTICE: Pilot recency >90 days. Practical checkflight required.");
        }
    }

    // UI UPDATE
    const resultBox = document.getElementById('result-box');
    const warningDiv = document.getElementById('warningList');
    
    // Clean old classes
    resultBox.className = '';
    resultBox.classList.add(`res-${status}`);
    
    if (status === "red") {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing.";
        icon = "fa-circle-xmark";
    } else if (status === "orange") {
        title = "FLIGHT INFO FORM REQUIRED";
        desc = "Operation approved, but Flight Information Form must be filed due to risk profile.";
        icon = "fa-file-contract";
    } else if (status === "yellow") {
        title = "REQUIRES APPROVAL (HEAD OF OPS)";
        desc = "Elevated risk profile. Submit for approval.";
        icon = "fa-triangle-exclamation";
    } else {
        title = "SELF-AUTHORIZATION PERMITTED";
        desc = "Standard operation. Fly safe!";
        icon = "fa-circle-check";
    }

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
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('ffiCourse').checked = true;
    document.getElementById('rate_multi').checked = true;
    document.getElementById('rate_vlos').checked = true;
    document.getElementById('rate_4').checked = true; 
    document.getElementById('dangerousGoods').value = 'no';
    document.getElementById('recency').value = 'recent';

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
    } 
    else if (type === 'hydrogen_safe') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'controlled_ground';
        document.getElementById('riskAssessment').value = 'yes';
        document.getElementById('competence').value = 'sts';
        document.getElementById('qual_hydrogen').checked = true;
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
        document.getElementById('qual_attack').checked = true;
    } else if (type === 'demo_flight') {
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('purpose').value = 'demo';
        document.getElementById('area').value = 'populated';
        document.getElementById('riskAssessment').value = 'yes';
        document.getElementById('competence').value = 'sts';
        document.getElementById('qual_demo').checked = true;
    }

    calculateRisk();
}