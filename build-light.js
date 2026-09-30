/**
 * alldl — light release build (npm scanner friendly)
 * Usage: node build-light.js
 *
 * 2.0.6+: npm's publish-time security scan rejected the heavily obfuscated
 * build (javascript-obfuscator + XOR eval pack). This builds index.js with
 * standard terser minification only: names are mangled (basic protection)
 * but there is no string encryption, no control-flow flattening and no
 * eval() packer — so it looks like a normal minified bundle to scanners.
 */
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const SRC = path.join(__dirname, "src.js");
const OUT = path.join(__dirname, "index.js");

function verify(outFile) {
  delete require.cache[require.resolve(outFile)];
  const { alldl } = require(outFile);
  const fns = [
    "tiktok", "fb", "insta", "likee", "threads",
    "pinterest", "youtube", "capcut", "kwai", "x", "twitter",
    "snapchat",
  ];
  const missing = fns.filter((k) => typeof alldl[k] !== "function");
  if (typeof alldl !== "function" || missing.length) {
    throw new Error("verify failed, missing: " + missing.join(", "));
  }
  console.log("verify: alldl + 12 platform functions OK");
}

(async () => {
  try {
    if (!fs.existsSync(SRC)) throw new Error("src.js not found");
    const src = fs.readFileSync(SRC, "utf8");
    console.log("minifying src.js with terser...");
    const result = await minify(src, {
      compress: { passes: 2 },
      mangle: true,
      format: { comments: false },
    });
    if (result.error) throw result.error;
    const code = result.code;
    if (/[^a-zA-Z]eval\s*\(/.test(code)) {
      throw new Error("minified output unexpectedly contains eval()");
    }
    fs.writeFileSync(OUT, code);
    console.log(`index.js written (${(code.length / 1024).toFixed(0)} KB)`);
    verify(OUT);
    console.log("Light build ready for publish.");
  } catch (e) {
    console.error("Light build failed:", e.message);
    process.exit(1);
  }
})();
