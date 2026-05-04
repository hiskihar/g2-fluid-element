const fluidPath = document.getElementById('fluid-path');
const { sqrt, min, max } = Math;
const sq2 = sqrt(2);

const unitCircularBezier = [0,    1, 1/16, 1, sq2 - 1, 1, sq2/2, sq2/2];
const unitSmoothBezier   = [-3/8, 1, 0, 1, sq2 - 1, 1, sq2/2, sq2/2];

const getUnitCurve = (smoothness) => 
    unitCircularBezier.map((val, i) => val + smoothness * (unitSmoothBezier[i] - val));

const buildCorner = (cx, cy, signX, signY, r, sW, sH, isVerticalStart) => {
    const uW = getUnitCurve(sW);
    const uH = getUnitCurve(sH);

    if (isVerticalStart) {
        return {
            startX: cx + signX * r * uW[1], 
            startY: cy + signY * r * uH[0],
            pts: [
                cx + signX * r * uW[3], cy + signY * r * uH[2],
                cx + signX * r * uW[5], cy + signY * r * uH[4],
                cx + signX * r * uW[7], cy + signY * r * uH[6],
                cx + signX * r * uW[4], cy + signY * r * uH[5],
                cx + signX * r * uW[2], cy + signY * r * uH[3],
                cx + signX * r * uW[0], cy + signY * r * uH[1]
            ]
        };
    } else {
        return {
            startX: cx + signX * r * uW[0],
            startY: cy + signY * r * uH[1],
            pts: [
                cx + signX * r * uW[2], cy + signY * r * uH[3],
                cx + signX * r * uW[4], cy + signY * r * uH[5],
                cx + signX * r * uW[6], cy + signY * r * uH[7],
                cx + signX * r * uW[5], cy + signY * r * uH[4],
                cx + signX * r * uW[3], cy + signY * r * uH[2],
                cx + signX * r * uW[1], cy + signY * r * uH[0]
            ]
        };
    }
};

const getSVGPath = ({ w, h, tl = 0, tr = 0, br = 0, bl = 0 }) => {

    // Smart Edge-Based Radii Clamping (Priority-based)
    const clampEdge = (length, r1, r2) => {
        if (r1 + r2 <= length) return [r1, r2];
        return [
            min(r1, max(length - r2, length / 2)),
            min(r2, max(length - r1, length / 2))
        ];
    };

    // Calculate maximum allowed sizes for all 4 edges independently
    const [tlTop, trTop]     = clampEdge(w, tl, tr);
    const [blBot, brBot]     = clampEdge(w, bl, br);
    const [tlLeft, blLeft]   = clampEdge(h, tl, bl);
    const [trRight, brRight] = clampEdge(h, tr, br);

    // A corner must fit on both of its connecting edges, so we take the minimum 
    // of its allowed size on the horizontal edge vs its allowed size on the vertical edge.
    const rTL = min(tlTop, tlLeft);
    const rTR = min(trTop, trRight);
    const rBR = min(brBot, brRight);
    const rBL = min(blBot, blLeft);

    // Edge-Based Smoothness Limits
    const overshoot = -unitSmoothBezier[0]; // Smoother curve's overshoot
    
    const solveEdge = (length, r1, r2) => {
        const requiredSpace = (r1 + r2) * overshoot;
        if (requiredSpace === 0) return 1;
        const availableSpace = length - r1 - r2;
        return max(0, min(availableSpace / requiredSpace, 1));
    };

    const sTop   = solveEdge(w, rTL, rTR);
    const sBot   = solveEdge(w, rBL, rBR);
    const sLeft  = solveEdge(h, rTL, rBL);
    const sRight = solveEdge(h, rTR, rBR);

    // Assemble Corners by passing Edge Smoothness (Width Edge, Height Edge)
    const rt = buildCorner(w - rTR, rTR, 1, -1, rTR, sTop, sRight, false);
    const rb = buildCorner(w - rBR, h - rBR, 1, 1, rBR, sBot, sRight, true);
    const lb = buildCorner(rBL, h - rBL, -1, 1, rBL, sBot, sLeft, false);
    const lt = buildCorner(rTL, rTL, -1, -1, rTL, sTop, sLeft, true);

    const toC = (p) => `C ${p[0]} ${p[1]} ${p[2]} ${p[3]} ${p[4]} ${p[5]} C ${p[6]} ${p[7]} ${p[8]} ${p[9]} ${p[10]} ${p[11]}`;

    return `
        M ${rt.startX} ${rt.startY}
        ${toC(rt.pts)}
        L ${rb.startX} ${rb.startY}
        ${toC(rb.pts)}
        L ${lb.startX} ${lb.startY}
        ${toC(lb.pts)}
        L ${lt.startX} ${lt.startY}
        ${toC(lt.pts)}
        Z
    `.replace(/\s+/g, ' ').trim();
};

// Example
const pathString = getSVGPath({ w: 500, h: 200, tl: 100, tr: 50, br: 1250, bl: 100 });
fluidPath.setAttribute('d', pathString);