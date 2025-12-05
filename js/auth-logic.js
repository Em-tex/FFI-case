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
    if (!document.getElementById('droneType')) return; // Exit if not on tool page

    // UAS
    const droneType = document.getElementById('droneType').value;
    const weight = document.getElementById('weight').value;
    const classStatus = document.getElementById('classStatus').value;
    const energySource = document.getElementById('energySource').value;
    const autopilot = document.getElementById('autopilot').value;
    const dangerousGoods = document.getElementById('dangerousGoods').value;

    // Operation
    const purpose = document.getElementById('purpose').value;
    const area = document.getElementById('area').value;
    const airspace = document.getElementById('airspace').value;
    const altitude = document.getElementById('altitude').value;
    const hasRA = document.getElementById('riskAssessment').value === 'yes';
    const otherUsers = document.getElementById('otherUsers').value;

    // Pilot Competence & Requirements
    const ffiCourse = document.getElementById('ffiCourse').checked;
    const competence = document.getElementById('competence').value;
    const recency = document.getElementById('recency').value;

    // Pilot Ratings (Checkboxes)
    const rateMulti = document.getElementById('rate_multi').checked;
    const rateFixed = document.getElementById('rate_fixed').checked;
    const rateHeli = document.getElementById('rate_heli').checked;
    const rateHeavy = document.getElementById('rate_heavy').checked;
    const rateVlos = document.getElementById('rate_vlos').checked;
    const rateBvlos = document.getElementById('rate_bvlos').checked;
    const rateInstructor = document.getElementById('rate_instructor').checked;

    // RESET STYLING (Fjern alle farger først)
    document.querySelectorAll('.input-warning, .input-danger').forEach(el => {
        el.classList.remove('input-warning', 'input-danger');
    });

    let status = "green"; 
    let icon = "fa-circle-check";
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard operation. You may proceed in accordance with OM-A.";
    let warnings = [];

    // --- HELPER TO MARK FIELD ---
    function mark(id, level) {
        const el = document.getElementById(id);
        if(el) el.classList.add(level === 'red' ? 'input-danger' : 'input-warning');
    }

    // --- LOGIC ENGINE ---

    // 1. CRITICAL STOPPERS (RED) - NO FLIGHT PERMITTED
    
    // Pilot Formalities
    if (!ffiCourse) {
        status = "red";
        warnings.push("STOP: Pilot has not completed mandatory FFI UAS Ground Course.");
        // Merk checkboxen rødt? Vanskelig med standard checkbox, ignorerer visuell markering her eller styler label.
    }
    if (competence === "none") {
        status = "red";
        mark('competence', 'red');
        warnings.push("STOP: Pilot lacks valid EASA competency certificate.");
    }

    // Pilot <-> Drone Mismatch
    if ((droneType === 'multirotor' && !rateMulti) ||
        (droneType.includes('fixed') && !rateFixed) ||
        (droneType === 'helicopter' && !rateHeli)) {
        status = "red";
        mark('droneType', 'red'); // Markerer dronetypen som problemet
        warnings.push(`STOP: Pilot lacks type rating for ${droneType.toUpperCase()}.`);
    }

    // Weight Mismatch
    if ((weight === 'sub25' || weight === 'sub150' || weight === 'over150') && !rateHeavy) {
        status = "red";
        mark('weight', 'red');
        warnings.push("STOP: Pilot lacks 'Heavy UAS (>4kg)' rating for this aircraft.");
    }

    // Flight Mode Mismatch
    if (altitude === 'above120' && !rateBvlos) { // Antar at høyde ofte krever mer enn VLOS rating i denne logikken, eller egen
        // Forenkling: Hvis pilot bare har VLOS men skal høyt/langt
    }

    // Dangerous Goods (Weapons) without RA
    if (dangerousGoods === "yes" && !hasRA) {
        status = "red";
        mark('dangerousGoods', 'red');
        mark('riskAssessment', 'red');
        warnings.push("STOP: Live weapons/munitions require an APPROVED risk assessment.");
    }

    // Area Constraints
    if (area === "populated" && classStatus === "experimental" && !hasRA) {
        status = "red";
        mark('area', 'red');
        mark('classStatus', 'red');
        warnings.push("STOP: Experimental drones prohibited in populated areas without an approved risk assessment.");
    }

    // 2. APPROVAL REQUIRED (YELLOW) - ELEVATED RISK
    // Only verify if not already Red
    if (status !== "red") {
        
        // Hydrogen Logic: Valid RA = Green (OK). No RA = Red (Stop).
        if (energySource === "hydrogen") {
            if (!hasRA) {
                status = "red";
                mark('energySource', 'red');
                mark('riskAssessment', 'red');
                warnings.push("STOP: Hydrogen operations require an approved Risk Assessment (SORA).");
            } else {
                // Har Hydrogen OG RA. Sjekker vi om det er OK.
                // Det er OK (Grønn), men kanskje en info-melding?
                // Vi lar den være grønn hvis alt annet er OK.
            }
        }

        // Experimental hardware
        if (classStatus === "experimental") {
            // Hvis vi har RA, er det OK. Hvis ikke, trenger vi kanskje Ops Leder sjekk?
            if (!hasRA) {
                status = "yellow";
                mark('classStatus', 'yellow');
                warnings.push("NOTICE: Experimental hardware requires Head of Operations awareness (unless covered by RA).");
            }
        }

        // Demo
        if (purpose === "demo") {
            status = "yellow";
            mark('purpose', 'yellow');
            warnings.push("NOTICE: Audience demonstrations entail 3rd party risk. Head of Ops authorization required.");
        }

        // Recency
        if (recency === "expired") {
            status = "yellow";
            mark('recency', 'yellow');
            warnings.push("NOTICE: Pilot recency >90 days. Practical checkflight with instructor required.");
        } else if (recency === "medium") {
            // Kanskje en liten warning men fortsatt grønn? La oss holde den grønn.
        }

        // Heavy Weight
        if (weight === 'over150' && hasRA) {
             // Selv med RA bør kanskje 150kg+ klareres spesielt
             status = "yellow";
             mark('weight', 'yellow');
             warnings.push("NOTICE: Heavy UAS (>150kg) requires operational clearance per flight.");
        }
    }

    // 3. OPPDATER UI
    if (status === "red") {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing. Operation cannot proceed.";
        icon = "fa-circle-xmark";
    } else if (status === "yellow") {
        title = "REQUIRES APPROVAL (HEAD OF OPS)";
        desc = "Elevated risk profile. Submit for Operational Leader approval.";
        icon = "fa-triangle-exclamation";
    } else {
        // Green
        title = "SELF-AUTHORIZATION PERMITTED";
        desc = "Standard operation within approved limitations. Fly safe!";
        icon = "fa-circle-check";
    }

    const resultBox = document.getElementById('result-box');
    const warningDiv = document.getElementById('warningList');
    
    // Reset classes
    resultBox.className = '';
    resultBox.classList.add(`res-${status}`);
    
    // Update content
    resultBox.querySelector('.result-icon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
    resultBox.querySelector('.result-title').innerText = title;
    resultBox.querySelector('.result-desc').innerText = desc;

    if (warnings.length > 0) {
        warningDiv.style.display = 'block';
        warningDiv.innerHTML = '<strong>Requirements / Limitations:</strong><ul>' + warnings.map(w => `<li>${w}</li>`).join('') + '</ul>';
    } else {
        warningDiv.style.display = 'none';
    }
}

// Preset funksjoner
function loadScenario(type) {
    // Reset all checkboxes first
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    // Set mandatory FFI course default true for ease, unless specifically testing fail
    document.getElementById('ffiCourse').checked = true;
    // Set standard ratings
    document.getElementById('rate_multi').checked = true;
    document.getElementById('rate_vlos').checked = true;

    if (type === 'jorgen') {
        // Case Jørgen: Hydrogen, Experimental, No RA, No Comp, Populated
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'populated';
        document.getElementById('riskAssessment').value = 'no';
        
        document.getElementById('competence').value = 'none'; 
        document.getElementById('ffiCourse').checked = false; // Han mangler kurset
        document.getElementById('recency').value = 'medium';
    } 
    else if (type === 'standard') {
        // Safe DJI flight
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'c_class';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'sparsely';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('dangerousGoods').value = 'no';
        
        document.getElementById('competence').value = 'a1a3';
        document.getElementById('recency').value = 'recent';
    } 
    else if (type === 'hydrogen_safe') {
        // Jørgen etter tiltak
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'controlled_ground'; // Tiltak: flyttet
        document.getElementById('riskAssessment').value = 'yes'; // Tiltak: RA på plass
        
        document.getElementById('competence').value = 'sts'; // Tiltak: kompetanse ok
        document.getElementById('ffiCourse').checked = true;
        document.getElementById('recency').value = 'recent';
        
        // Må ha rating
        document.getElementById('rate_multi').checked = true;
        document.getElementById('rate_vlos').checked = true;
    }

    calculateRisk();
}