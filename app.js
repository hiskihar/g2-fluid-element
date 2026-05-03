const fluidPath = document.getElementById('fluid-path');
const unit = 256;
const sqrt = Math.sqrt;
const sq2 = sqrt(2);

const c = [
    0, 1,
    1/16, 1,
    sq2 - 1, 1,
    sq2 / 2, sq2 / 2,
]
const s = [
    -1/4, 1,
    1/8, 1,
    sq2 - 1, 1,
    sq2 / 2, sq2 / 2,
];

// Scaler helper: multiplies by size and rounds to 3 decimals
const p = (val) => Number((val * unit).toFixed(3));

// Standard Path using c
const circular = 
    `M 0 0 `+
    `L   ${unit + p(c[0])}   ${p(1-c[1])}   `+
    `C   ${unit + p(c[2])}   ${p(1-c[3])}   ${unit + p(c[4])}   ${p(1-c[5])}   ${unit + p(c[6])}   ${p(1-c[7])}   `+
    `C   ${unit + p(c[5])}   ${p(1-c[4])}   ${unit + p(c[3])}   ${p(1-c[2])}   ${unit + p(c[1])}   ${p(1-c[0])}   `+
    `L   ${2 * unit} ${2 * unit} L ${0} ${2 * unit}   Z`;

// Smooth Path using s
const smooth = 
    `M 0 0 `+
    `L   ${unit + p(s[0])}   ${p(1-s[1])}   `+
    `C   ${unit + p(s[2])}   ${p(1-s[3])}   ${unit + p(s[4])}   ${p(1-s[5])}   ${unit + p(s[6])}   ${p(1-s[7])}   `+
    `C   ${unit + p(s[5])}   ${p(1-s[4])}   ${unit + p(s[3])}   ${p(1-s[2])}   ${unit + p(s[1])}   ${p(1-s[0])}   `+
    `L   ${2 * unit} ${2 * unit} L ${0} ${2 * unit}   Z`;

// Set initial state
fluidPath.setAttribute('d', circular);

// Trigger Animation
fluidPath.animate([
    { d: `path("${circular}")` },
    { d: `path("${smooth}")` }
], {
    duration: 2000,
    iterations: Infinity,
    direction: 'normal', // Changed to alternate for a smoother loop
    easing: 'ease-in-out'    // Linear can feel a bit robotic for fluid shapes
});