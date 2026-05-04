const { sqrt, min, max } = Math;
const sq2 = sqrt(2);
const unitCircularBezier = [0,    1, 1/16, 1, sq2 - 1, 1, sq2/2, sq2/2];
const unitSmoothBezier   = [-3/8, 1, 0,    1, sq2 - 1, 1, sq2/2, sq2/2];

const getUnitCurve = (smoothness) => 
    unitCircularBezier.map((val, i) => val + smoothness * (unitSmoothBezier[i] - val));

const buildCorner = (cx, cy, signX, signY, r, sW, sH, isVerticalStart) => {
    const uW = getUnitCurve(sW);
    const uH = getUnitCurve(sH);
    if (isVerticalStart) {
        return {
            startX: cx + signX * r * uW[1], startY: cy + signY * r * uH[0],
            pts: [
                cx + signX * r * uW[3], cy + signY * r * uH[2], cx + signX * r * uW[5], cy + signY * r * uH[4],
                cx + signX * r * uW[7], cy + signY * r * uH[6], cx + signX * r * uW[4], cy + signY * r * uH[5],
                cx + signX * r * uW[2], cy + signY * r * uH[3], cx + signX * r * uW[0], cy + signY * r * uH[1]
            ]
        };
    } else {
        return {
            startX: cx + signX * r * uW[0], startY: cy + signY * r * uH[1],
            pts: [
                cx + signX * r * uW[2], cy + signY * r * uH[3], cx + signX * r * uW[4], cy + signY * r * uH[5],
                cx + signX * r * uW[6], cy + signY * r * uH[7], cx + signX * r * uW[5], cy + signY * r * uH[4],
                cx + signX * r * uW[3], cy + signY * r * uH[2], cx + signX * r * uW[1], cy + signY * r * uH[0]
            ]
        };
    }
};

const getSVGPath = ({ x = 0, y = 0, w, h, tl = 0, tr = 0, br = 0, bl = 0 }) => {
    const clampEdge = (length, r1, r2) => (r1 + r2 <= length) ? [r1, r2] : 
        [min(r1, max(length - r2, length / 2)), min(r2, max(length - r1, length / 2))];

    const [tlTop, trTop]     = clampEdge(w, tl, tr);
    const [blBot, brBot]     = clampEdge(w, bl, br);
    const [tlLeft, blLeft]   = clampEdge(h, tl, bl);
    const [trRight, brRight] = clampEdge(h, tr, br);

    const rTL = min(tlTop, tlLeft);
    const rTR = min(trTop, trRight);
    const rBR = min(brBot, brRight);
    const rBL = min(blBot, blLeft);

    const solveEdge = (length, r1, r2) => {
        const req = (r1 + r2) * -unitSmoothBezier[0];
        return req === 0 ? 1 : max(0, min((length - r1 - r2) / req, 1));
    };

    const sTop = solveEdge(w, rTL, rTR), sBot = solveEdge(w, rBL, rBR);
    const sLeft = solveEdge(h, rTL, rBL), sRight = solveEdge(h, rTR, rBR);

    const rt = buildCorner(x + w - rTR, y + rTR,     1, -1, rTR, sTop, sRight, false);
    const rb = buildCorner(x + w - rBR, y + h - rBR, 1,  1, rBR, sBot, sRight, true);
    const lb = buildCorner(x + rBL,     y + h - rBL,-1,  1, rBL, sBot, sLeft,  false);
    const lt = buildCorner(x + rTL,     y + rTL,    -1, -1, rTL, sTop, sLeft,  true);

    const toC = (p) => `C ${p[0]} ${p[1]} ${p[2]} ${p[3]} ${p[4]} ${p[5]} C ${p[6]} ${p[7]} ${p[8]} ${p[9]} ${p[10]} ${p[11]}`;

    return `M ${rt.startX} ${rt.startY} ${toC(rt.pts)} L ${rb.startX} ${rb.startY} ${toC(rb.pts)} L ${lb.startX} ${lb.startY} ${toC(lb.pts)} L ${lt.startX} ${lt.startY} ${toC(lt.pts)} Z`.replace(/\s+/g, ' ').trim();
};



const createFluidElement = ({ 
    initState, 
    altState, 
    options = {} 
}) => {
    const { 
        duration = 900, 
        easing = 'cubic-bezier(.3,1,0,1)',
        fill = '#4455aa',
        stroke = '#7788ff',
        strokeWidth = 2,
    } = options;

    const path1 = getSVGPath(initState);
    const path2 = getSVGPath(altState);

    const maxW = Math.max((initState.x || 0) + initState.w, (altState.x || 0) + altState.w);
    const maxH = Math.max((initState.y || 0) + initState.h, (altState.y || 0) + altState.h);

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", maxW);
    svg.setAttribute("height", maxH);
    svg.setAttribute("viewBox", `0 0 ${maxW} ${maxH}`);
    svg.style.overflow = "visible";

    const uid = `clip-${Math.random().toString(36).substr(2, 9)}`;

    const defs = document.createElementNS(ns, "defs");
    const clipPath = document.createElementNS(ns, "clipPath");
    clipPath.setAttribute("id", uid);
    
    const clipPathEl = document.createElementNS(ns, "path");
    clipPathEl.setAttribute("d", path1);

    const visualPath = document.createElementNS(ns, "path");
    visualPath.setAttribute("d", path1);
    visualPath.setAttribute("fill", fill);
    visualPath.setAttribute("stroke", stroke);
    visualPath.setAttribute("stroke-width", strokeWidth * 2);
    visualPath.setAttribute("clip-path", `url(#${uid})`);

    clipPath.appendChild(clipPathEl);
    defs.appendChild(clipPath);
    svg.appendChild(defs);
    svg.appendChild(visualPath);

    let activeFluidAnim = null;
    let activeClipAnim = null;
    const timing = { duration, easing, fill: 'forwards' };

    const animateToPath = (targetPathString) => {
        let currentD = getComputedStyle(visualPath).getPropertyValue('d');
        if (!currentD || currentD === 'none') {
            currentD = `path("${visualPath.getAttribute('d')}")`;
        }

        if (activeFluidAnim) activeFluidAnim.cancel();
        if (activeClipAnim) activeClipAnim.cancel();

        const keyframes = [{ d: currentD }, { d: `path("${targetPathString}")` }];

        activeFluidAnim = visualPath.animate(keyframes, timing);
        activeClipAnim = clipPathEl.animate(keyframes, timing);
        
        activeFluidAnim.onfinish = () => visualPath.setAttribute('d', targetPathString);
        activeClipAnim.onfinish = () => clipPathEl.setAttribute('d', targetPathString);
    };

    svg.style.cursor = 'pointer';
    
    svg.addEventListener('mouseenter', () => animateToPath(path2));
    svg.addEventListener('mouseleave', () => animateToPath(path1));

    return svg;
};

const exampleElement = createFluidElement({
    initState: { x: 100, y: 40, w: 200, h: 60,  tl: 30, tr: 30, br: 30, bl: 30 },
    altState:  { x: 0,   y: 0,  w: 400, h: 100, tl: 20, tr: 20, br: 20, bl: 20 },
    options: {
        duration: 900,
        easing: 'cubic-bezier(.3,1,0,1)',
        fill: '#222',
        stroke: '#555',
        strokeWidth: 1
    }
});

document.getElementsByClassName('container')[0].appendChild(exampleElement);