/* js/auth-logic.js */

document.addEventListener('DOMContentLoaded', function() {
    // Legg til lyttere på alle inputs for å oppdatere status live
    const inputs = document.querySelectorAll('select, input');
    inputs.forEach(input => {
        input.addEventListener('change', calculateRisk);
    });
    
    // Kjør en gang ved oppstart
    calculateRisk();
});

function calculateRisk() {
    // 1. Hent verdier fra skjemaet
    // Vi bruker try/catch eller sjekker om elementet finnes for å unngå feil på sider som mangler skjemaet
    if (!document.getElementById('droneType')) return; 

    const droneType = document.getElementById('droneType').value;
    const weight = document.getElementById('weight').value;
    const classStatus = document.getElementById('classStatus').value;
    const energySource = document.getElementById('energySource').value;
    const dangerousGoods = document.getElementById('dangerousGoods').value;
    
    const purpose = document.getElementById('purpose').value;
    const area = document.getElementById('area').value;
    const airspace = document.getElementById('airspace').value;
    const altitude = document.getElementById('altitude').value;
    const hasRA = document.getElementById('riskAssessment').value === 'yes';
    
    const ffiCourse = document.getElementById('ffiCourse').checked;
    const competence = document.getElementById('competence').value;
    const recency = document.getElementById('recency').value;

    // 2. Nullstill status
    let status = "green"; 
    let title = "SELF-AUTHORIZATION PERMITTED";
    let desc = "Standard Operation. You may proceed in accordance with OM-A procedures.";
    let warnings = [];

    // --- LOGIC ENGINE ---

    // A. AUTOMATIC NO-GO (RØD)
    if (!ffiCourse) {
        status = "red";
        warnings.push("STOP: Pilot has not completed mandatory FFI UAS Ground Course.");
    }
    if (competence === "none") {
        status = "red";
        warnings.push("STOP: Pilot lacks valid EASA competency certificate.");
    }
    
    // Hydrogen / Energy Logic
    if (energySource === "hydrogen" && !hasRA) {
        status = "red";
        warnings.push("STOP: Hydrogen Operations involve Dangerous Goods & High Energy. Valid SORA required.");
    }

    // Dangerous Goods
    if (dangerousGoods === "yes" && !hasRA) {
        status = "red";
        warnings.push("STOP: Live weapons/munitions require an approved Risk Assessment (SORA).");
    }

    // Area & Class Logic
    if (area === "populated" && classStatus === "experimental" && !hasRA) {
        status = "red";
        warnings.push("STOP: Experimental drones prohibited in populated areas without Specific Authorization.");
    }
    
    // Altitude
    if (altitude === "above120" && !hasRA) {
        status = "red";
        warnings.push("STOP: Flight above 120m requires approved Risk Assessment / Specific Authorization.");
    }

    // B. REQUIRES APPROVAL (GUL) - Kun hvis ikke allerede RØD
    if (status !== "red") {
        if (classStatus === "experimental") {
            status = "yellow";
            warnings.push("NOTICE: Experimental hardware requires Head of Operations awareness.");
        }
        if (energySource === "hydrogen") {
            status = "yellow";
            warnings.push("NOTICE: Hydrogen fuel cells: Ensure compliance with HazMat handling procedures.");
        }
        if (purpose === "demo") {
            status = "yellow";
            warnings.push("NOTICE: Audience demonstrations entail 3rd party risk. Head of Ops authorization required.");
        }
        if (weight === "sub150" || weight === "over150") {
            status = "yellow";
            warnings.push("NOTICE: Heavy UAS (>25kg) operations require Head of Ops authorization.");
        }
        if (recency === "expired") {
            status = "yellow";
            warnings.push("NOTICE: Pilot recency >90 days. Practical checkflight required.");
        }
        if (dangerousGoods === "yes" && hasRA) {
            status = "yellow";
            warnings.push("NOTICE: Operations with weapons/munitions always require Head of Ops final sign-off.");
        }
    }

    // Oppdater Titler basert på status
    if (status === "red") {
        title = "AUTHORIZATION DENIED";
        desc = "Critical safety requirements missing. Operation cannot proceed.";
    } else if (status === "yellow") {
        title = "REQUIRES APPROVAL (HEAD OF OPS)";
        desc = "Elevated risk profile. Submit for Operational Leader approval.";
    }

    // 3. Oppdater UI
    const resultBox = document.getElementById('result-box');
    const warningDiv = document.getElementById('warningList');
    
    resultBox.className = `status-${status}`;
    resultBox.querySelector('.result-title').innerText = title;
    resultBox.querySelector('.result-desc').innerText = desc;

    if (warnings.length > 0) {
        warningDiv.style.display = 'block';
        warningDiv.innerHTML = warnings.join('<br>');
    } else {
        warningDiv.style.display = 'none';
    }
}

// Preset funksjon for demo
function loadScenario(type) {
    if (type === 'jorgen') {
        // Case Jørgen: Hydrogen, Experimental, Ingen RA, Ingen kurs
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'populated'; 
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'none'; 
        document.getElementById('ffiCourse').checked = false;
    } else if (type === 'standard') {
        // Safe standard flight
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'c_class';
        document.getElementById('energySource').value = 'battery';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'sparsely';
        document.getElementById('riskAssessment').value = 'no';
        document.getElementById('competence').value = 'a1a3';
        document.getElementById('ffiCourse').checked = true;
        document.getElementById('recency').value = 'recent';
        document.getElementById('dangerousGoods').value = 'no';
    } else if (type === 'hydrogen_safe') {
        // Jørgen etter at han har fikset ting
        document.getElementById('droneType').value = 'multirotor';
        document.getElementById('classStatus').value = 'experimental';
        document.getElementById('energySource').value = 'hydrogen';
        document.getElementById('purpose').value = 'testing';
        document.getElementById('area').value = 'controlled_ground'; // Flyttet til trygt område
        document.getElementById('riskAssessment').value = 'yes'; // Har nå RA
        document.getElementById('competence').value = 'sts'; // Har tatt kurs
        document.getElementById('ffiCourse').checked = true;
        document.getElementById('recency').value = 'recent';
    }
    
    // Oppdater beregning
    calculateRisk();
}