/* js/presentation.js */

let currentSlide = 1;
const totalSlides = 6; 

document.addEventListener("DOMContentLoaded", function() {
    // Sørg for at telleren er korrekt ved start
    updateCounter();
});

function changeSlide(direction) {
    // Skjul nåværende slide
    const currentEl = document.getElementById(`slide-${currentSlide}`);
    if (currentEl) currentEl.classList.remove('slide-active');
    
    // Beregn ny slide
    currentSlide += direction;
    if (currentSlide < 1) currentSlide = 1;
    if (currentSlide > totalSlides) currentSlide = totalSlides;
    
    // Vis ny slide
    const nextEl = document.getElementById(`slide-${currentSlide}`);
    if (nextEl) nextEl.classList.add('slide-active');
    
    updateCounter();
}

function updateCounter() {
    const counterEl = document.getElementById('slide-counter');
    if (counterEl) {
        counterEl.innerText = `${currentSlide} / ${totalSlides}`;
    }
}

// Tastaturnavigasjon
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowLeft") {
        changeSlide(-1);
    } else if (event.key === "ArrowRight") {
        changeSlide(1);
    }
});