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

    isToggled = (side === 'right');
    toggleSwitch.classList.toggle('toggled', isToggled);

    if (currentPos === targetLeft) {
        draggable.classList.remove('grabbed');
        return;
    }

    draggable.classList.add('animate-movement', 'grabbed');
    draggable.style.left = `${targetLeft}px`;
}

function toggle() {
    setSide(isToggled ? 'left' : 'right');
}

draggable.addEventListener('transitionend', (e) => {

    if (e.propertyName === 'left' && !isPointerDown) {
        draggable.classList.remove('grabbed');
    }
});

updateBounds();
setSide('left'); 
draggable.classList.remove('grabbed');
window.addEventListener('resize', updateBounds);

draggable.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); 
    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    initialLeft = parseInt(window.getComputedStyle(draggable).left, 10) || 0;

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

toggleSwitch.addEventListener('click', (e) => {
    if (e.target.closest('#draggable')) return;
    
    toggle();
});
