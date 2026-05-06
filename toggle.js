const toggleSwitch = document.querySelector('.toggle-switch');
const track = document.getElementById('track');
const draggable = document.getElementById('draggable');

let isPointerDown = false;
let hasDragged = false;
let startX;
let initialLeft;
let maxLeft;
let isToggled = false; 

function updateBounds() {
    maxLeft = track.clientWidth - draggable.offsetWidth;
    draggable.style.left = isToggled ? `${maxLeft}px` : '0px';
}

function setSide(side) {
    const targetLeft = side === 'right' ? maxLeft : 0;
    const currentPos = parseInt(draggable.style.left, 10) || 0;
    
    // Update state variables
    isToggled = (side === 'right');
    toggleSwitch.classList.toggle('toggled', isToggled);

    // Failsafe: If the slider is already at the target position, there won't be a 
    // transition. Remove the glass effect immediately to prevent it getting stuck.
    if (currentPos === targetLeft) {
        draggable.classList.remove('grabbed');
        return;
    }

    // Apply animation class and the glass effect class
    draggable.classList.add('animate-movement', 'grabbed');
    draggable.style.left = `${targetLeft}px`;
}

function toggle() {
    setSide(isToggled ? 'left' : 'right');
}

// --- NEW: Clean up the glass effect after the slide animation finishes ---
draggable.addEventListener('transitionend', (e) => {
    // We only care about the 'left' property finishing.
    // Also, don't remove it if the user is currently holding the thumb down!
    if (e.propertyName === 'left' && !isPointerDown) {
        draggable.classList.remove('grabbed');
    }
});

// Initialize
updateBounds();
setSide('left'); 
draggable.classList.remove('grabbed'); // Clear any initial animation artifacts
window.addEventListener('resize', updateBounds);

/**
 * DRAG LOGIC (Thumb only)
 */
draggable.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); 
    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    initialLeft = parseInt(window.getComputedStyle(draggable).left, 10) || 0;
    
    // Instantly show glass effect and remove transition for 1:1 dragging
    draggable.classList.add('grabbed');
    draggable.classList.remove('animate-movement');
    
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
        const currentPos = parseInt(draggable.style.left, 10) || 0;
        setSide((currentPos / maxLeft) >= 0.5 ? 'right' : 'left'); 
    } else {
        toggle(); 
    }
});

draggable.addEventListener('pointercancel', (e) => {
    isPointerDown = false;
    draggable.classList.remove('grabbed');
    draggable.releasePointerCapture(e.pointerId);
    const currentPos = parseInt(draggable.style.left, 10) || 0;
    setSide((currentPos / maxLeft) >= 0.5 ? 'right' : 'left');
});

/**
 * CLICK LOGIC (Wrapper)
 */
toggleSwitch.addEventListener('click', (e) => {
    // --- NEW ARCHITECTURE: closest() check ---
    // Because the handles are now nested inside .draggable, clicking them sets e.target 
    // to the handle, not the draggable. closest() checks up the DOM tree to prevent 
    // the wrapper click from firing when interacting with the thumb.
    if (e.target.closest('#draggable')) return;
    
    toggle();
});