// Coordinates belong to the approved raster artwork, not screen dimensions.
// The elbow/neck overlap sits behind the torso to keep joints connected.
export const ONBOARDING_CHARACTERS = {
  student: {
    source: require('../assets/onboarding-student.webp'),
    width: 640, height: 585,
    head: { x: 210, y: 0, width: 430, height: 205, pivot: { x: 351, y: 199 } },
    arm: { x: 0, y: 205, width: 230, height: 225, pivot: { x: 214, y: 378 },
      // The shirt above the elbow belongs to the anchored torso.
      regions: [
        { x: 0, y: 205, width: 210, height: 135 },
        { x: 0, y: 340, width: 230, height: 90 },
      ],
    },
    body: [
      { x: 210, y: 197, width: 430, height: 388 },
      { x: 0, y: 430, width: 210, height: 155 },
    ],
  },
  staff: {
    source: require('../assets/onboarding-staff.webp'),
    width: 640, height: 427,
    cropLeft: 78, cropRight: 95,
    head: { x: 202, y: 0, width: 438, height: 173, pivot: { x: 311, y: 171 } },
    arm: { x: 0, y: 140, width: 222, height: 174, pivot: { x: 213, y: 276 },
      // Keep the adjacent loose hair in the head layer, outside the forearm.
      regions: [
        { x: 0, y: 140, width: 202, height: 100 },
        { x: 0, y: 240, width: 222, height: 74 },
      ],
    },
    body: [
      { x: 192, y: 165, width: 448, height: 262 },
      { x: 0, y: 314, width: 192, height: 113 },
    ],
  },
};

// Each pose has its own neck/elbow geometry. The remaining rectangles partition
// the original canvas so the anchored torso never duplicates the moving pieces.
function pose(source, head, arm, bottomInset, armDegrees = 4) {
  const width = 640, height = 640;
  const moving = [...(head.regions || [head]), ...(arm.regions || [arm])];
  const xs = [...new Set([0, width, ...moving.flatMap(rect => [rect.x, rect.x + rect.width])])].sort((a, b) => a - b);
  const ys = [...new Set([0, height, ...moving.flatMap(rect => [rect.y, rect.y + rect.height])])].sort((a, b) => a - b);
  const inside = (x, y, rect) => x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
  const body = [];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x = xs[i], y = ys[j];
    // A small source-pixel overlap prevents fractional device-pixel seams between
    // adjacent native crops without moving the torso or changing the artwork.
    if (!moving.some(rect => inside(x, y, rect))) body.push({ x: Math.max(0, x - 4), y: Math.max(0, y - 4), width: Math.min(width, xs[i + 1] + 4) - Math.max(0, x - 4), height: Math.min(height, ys[j + 1] + 4) - Math.max(0, y - 4) });
  }
  return { source, width, height, head, arm, body, bottomInset, headDegrees: 1, armDegrees };
}

export const ONBOARDING_POSES = {
  student: [
    ONBOARDING_CHARACTERS.student,
    pose(require('../assets/onboarding-student-feedback.webp'),
      { x: 110, y: 0, width: 300, height: 240, pivot: { x: 228, y: 236 } },
      { x: 396, y: 280, width: 244, height: 214, pivot: { x: 399, y: 435 } }, 10),
    pose(require('../assets/onboarding-student-updates.webp'),
      { x: 215, y: 0, width: 260, height: 253, pivot: { x: 341, y: 250 } },
      { x: 0, y: 145, width: 190, height: 300, pivot: { x: 112, y: 390 } }, 9),
  ],
  staff: [
    ONBOARDING_CHARACTERS.staff,
    pose(require('../assets/onboarding-staff-register.webp'),
      { x: 190, y: 0, width: 245, height: 267, pivot: { x: 313, y: 263 } },
      { x: 267, y: 294, width: 93, height: 85, pivot: { x: 285, y: 376 } }, 10, 1.5),
    pose(require('../assets/onboarding-staff-review.webp'),
      { x: 200, y: 0, width: 370, height: 245, pivot: { x: 368, y: 241 } },
      { x: 0, y: 200, width: 170, height: 205, pivot: { x: 145, y: 380 } }, 18),
    pose(require('../assets/onboarding-staff-archive.webp'),
      { x: 175, y: 0, width: 390, height: 252, pivot: { x: 334, y: 248 } },
      { x: 0, y: 80, width: 145, height: 275, pivot: { x: 110, y: 324 } }, 8),
  ],
};
