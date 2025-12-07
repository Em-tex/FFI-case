/* js/presentation.js */

let currentSlide = 1;
const totalSlides = 6; 

document.addEventListener("DOMContentLoaded", function() {
    updateCounter();
});

function changeSlide(direction) {
    const currentEl = document.getElementById(`slide-${currentSlide}`);
    if (currentEl) currentEl.classList.remove('slide-active');
    
    currentSlide += direction;
    if (currentSlide < 1) currentSlide = 1;
    if (currentSlide > totalSlides) currentSlide = totalSlides;
    
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

// Popup funksjoner
function openPopup() {
    document.getElementById('infoPopup').style.display = 'block';
    document.getElementById('popupOverlay').style.display = 'block';
}

function closePopup() {
    document.getElementById('infoPopup').style.display = 'none';
    document.getElementById('popupOverlay').style.display = 'none';
}

// Tastaturnavigasjon
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowLeft") {
        changeSlide(-1);
    } else if (event.key === "ArrowRight") {
        changeSlide(1);
    } else if (event.key === "Escape") {
        closePopup();
    }
});