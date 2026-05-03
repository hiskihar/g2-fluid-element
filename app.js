const fluidPath = document.getElementById('fluid-path');
const { sqrt, min, max } = Math;
const sq2 = sqrt(2);

const unitCircularBezier = [0,    1, 1/16, 1, sq2 - 1, 1, sq2/2, sq2/2];
const unitSmoothBezier   = [-1/4, 1, 1/16, 1, sq2 - 1, 1, sq2/2, sq2/2];

const getUnitCurve = (smoothness) => 
    unitCircularBezier.map((val, i) => val + smoothness * (unitSmoothBezier[i] - val));

const getParams = (dimensions) => {
    const { w, h, unitRadius } = dimensions;
    const radius = unitRadius * min(w, h) / 2;
    
    const requiredOvershoot = radius * -unitSmoothBezier[0]; 

    const solve = (side) => requiredOvershoot === 0 ? 1 : 
        max(0, min((side / 2 - radius) / requiredOvershoot, 1));

    return { 
        w, h, radius, 
        smoothW: solve(w), 
        smoothH: solve(h) 
    };
};

// Generates the absolute X/Y coordinates for the 12 control points of a corner
const getCurves = (dimensions) => {
    const { w, h, radius, smoothW, smoothH } = getParams(dimensions);
    const cW = getUnitCurve(smoothW);
    const cH = getUnitCurve(smoothH);

    // Maps the 1D curve array to absolute 2D space based on the quadrant
    const buildQuadrant = (cx, cy, signX, signY, curveX, curveY, swapXY = false) => {
        // If swapXY is true (e.g., drawing down the right edge), we swap the X/Y logic
        const pts = swapXY 
            ? [ curveX[3], curveX[2], curveX[5], curveX[4], curveX[7], curveX[6],
                curveY[4], curveY[5], curveY[2], curveY[3], curveY[0], curveY[1] ]
            : [ curveX[2], curveX[3], curveX[4], curveX[5], curveX[6], curveX[7],
                curveY[5], curveY[4], curveY[3], curveY[2], curveY[1], curveY[0] ];

        // Apply absolute transformations: Center Offset + (Axis Sign * Radius * Value)
        return pts.map((val, i) => {
            const isX = i % 2 === 0;
            return (isX ? cx : cy) + (isX ? signX : signY) * radius * val;
        });
    };

    return {
        // Top-Right:    Center(w-r, r),   X moves right (+), Y moves up (-)
        rt: buildQuadrant(w - radius, radius,     1,  -1, cW, cH, false),
        // Bottom-Right: Center(w-r, h-r), X moves right (+), Y moves down (+)
        rb: buildQuadrant(w - radius, h - radius, 1,  1,  cH, cW, true),
        // Bottom-Left:  Center(r, h-r),   X moves left (-),  Y moves down (+)
        lb: buildQuadrant(radius,     h - radius, -1, 1,  cW, cH, false),
        // Top-Left:     Center(r, r),     X moves left (-),  Y moves up (-)
        lt: buildQuadrant(radius,     radius,     -1, -1, cH, cW, true),
    };
};

const getSVGPath = (dimensions) => {
    const { w, h, radius, smoothW, smoothH } = getParams(dimensions);
    const curves = getCurves(dimensions);
    
    const cW = getUnitCurve(smoothW);
    const cH = getUnitCurve(smoothH);
    
    const toCubic = (pts) => 
        `C ${pts[0]} ${pts[1]} ${pts[2]} ${pts[3]} ${pts[4]}  ${pts[5]} ` +
        `C ${pts[6]} ${pts[7]} ${pts[8]} ${pts[9]} ${pts[10]} ${pts[11]}`;

    return `
        M ${radius - radius * cW[0]} 0
        L ${w - radius + radius * cW[0]} 0
        ${toCubic(curves.rt)}
        L ${w} ${h - radius + radius * cH[0]}
        ${toCubic(curves.rb)}
        L ${radius - radius * cW[0]} ${h}
        ${toCubic(curves.lb)}
        L 0 ${radius - radius * cH[0]}
        ${toCubic(curves.lt)}
        Z
    `.replace(/\s+/g, ' ').trim();
};

// Example
const pathString = getSVGPath({ w: 500, h: 200, unitRadius: 1 });
fluidPath.setAttribute('d', pathString);