// The value-stack pictures (AI-made) have an off-white, slightly noisy
// background (252-254 grey) that shows as a box on the white card around it
// ("l'immagine ha uno sfondo bianco che è diverso", 11-06). This makes the
// background pure white: near-white pixels reached from the picture's edge
// (so white inside a shape, like the "€27" circle, stays as it is).
// usage: node tools/value_stack_white.js public/funnels/midi-drum-kit
const path = require("path");
const sharp = require("sharp");
const dir = process.argv[2];
const NAMES = ["value-stack", "value-stack-fr", "value-stack-es", "value-stack-de", "value-stack-it"];

(async () => {
  for (const name of NAMES) {
    const { data, info } = await sharp(path.join(dir, `${name}.webp`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const near = (i) => {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
      return lo >= 232 && hi - lo <= 14;
    };
    const seen = new Uint8Array(W * H);
    const stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    let n = 0;
    while (stack.length) {
      const p = stack.pop();
      if (seen[p]) continue;
      seen[p] = 1;
      if (!near(p * 3)) continue;
      data[p * 3] = data[p * 3 + 1] = data[p * 3 + 2] = 255;
      n++;
      const x = p % W;
      if (x > 0) stack.push(p - 1);
      if (x < W - 1) stack.push(p + 1);
      if (p >= W) stack.push(p - W);
      if (p < W * (H - 1)) stack.push(p + W);
    }
    await sharp(data, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 88 }).toFile(path.join(dir, `${name}-w.webp`));
    console.log(name, `${Math.round((n / (W * H)) * 100)}% made white`);
  }
})();
