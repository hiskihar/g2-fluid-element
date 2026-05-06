const toggleSwitch = document.querySelector('.toggle-switch');
const track = document.getElementById('track');
const draggable = document.getElementById('draggable');

let isPointerDown = false;
let hasDragged = false;
let startX;
let initialLeft;
let maxLeft;

// NEW: The readable state variable
let isToggled = false; 

const currentLeft = () => parseInt(window.getComputedStyle(draggable).left, 10) || 0;

function updateBounds() {
    maxLeft = track.clientWidth - draggable.offsetWidth;
    // On window resize, lock the thumb to the correct side based on state
    draggable.style.left = isToggled ? `${maxLeft}px` : '0px';
}

// Unified function to move the thumb AND update the state
function setSide(side) {
    draggable.classList.add('animate-movement');
    
    // Update the boolean state
    isToggled = (side === 'right');
    
    // Move the thumb
    draggable.style.left = isToggled ? `${maxLeft}px` : '0px';
    
    // Add or remove the CSS class on the parent wrapper
    if (isToggled) {
        toggleSwitch.classList.add('toggled');
    } else {
        toggleSwitch.classList.remove('toggled');
    }
}

function toggle() {
    setSide(isToggled ? 'left' : 'right');
}

updateBounds();
setSide('left');
window.addEventListener('resize', updateBounds);

draggable.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); 
    draggable.classList.remove('animate-movement');
    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    initialLeft = currentLeft();
    draggable.setPointerCapture(e.pointerId);
});

draggable.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const deltaX = e.clientX - startX;
    if (!hasDragged && Math.abs(deltaX) > 3) hasDragged = true;
    if (hasDragged) {
        let newLeft = Math.max(0, Math.min(initialLeft + deltaX, maxLeft));
        draggable.style.left = `${newLeft}px`;
    }
});

draggable.addEventListener('pointerup', (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    draggable.releasePointerCapture(e.pointerId);
    if (hasDragged) {
        const t = currentLeft() / maxLeft;
        setSide(t >= 0.5 ? 'right' : 'left'); 
    } else {
        toggle(); 
    }
});

toggleSwitch.addEventListener('click', (e) => {
    if (e.target === draggable) return;
    toggle();
});