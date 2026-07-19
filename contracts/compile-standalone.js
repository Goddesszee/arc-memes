const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "contracts");
const NODE_MODULES = path.join(__dirname, "node_modules");

function findSources(dir, base = dir, acc = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSources(full, base, acc);
    } else if (entry.name.endsWith(".sol")) {
      const rel = path.relative(base, full);
      acc[rel] = fs.readFileSync(full, "utf8");
    }
  }
  return acc;
}

const sources = {};
for (const [rel, content] of Object.entries(findSources(CONTRACTS_DIR))) {
  sources[`contracts/${rel}`] = { content };
}

function importCallback(importPath) {
  try {
    let resolved;
    if (importPath.startsWith("@openzeppelin/")) {
      resolved = path.join(NODE_MODULES, importPath);
    } else if (importPath.startsWith("./") || importPath.startsWith("../")) {
      // relative imports inside contracts/ — resolve relative to contracts dir
      resolved = path.join(CONTRACTS_DIR, importPath);
    } else {
      resolved = path.join(NODE_MODULES, importPath);
    }
    return { contents: fs.readFileSync(resolved, "utf8") };
  } catch (err) {
    return { error: `File not found: ${importPath}` };
  }
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object"] },
    },
  },
};

console.log("Compiling with solc", solc.version());
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: importCallback }));

let hasError = false;
if (output.errors) {
  for (const err of output.errors) {
    if (err.severity === "error") {
      hasError = true;
      console.error("\nERROR:\n" + err.formattedMessage);
    } else {
      console.warn("\nWARNING:\n" + err.formattedMessage);
    }
  }
}

if (hasError) {
  console.error("\nCompilation failed.");
  process.exit(1);
}

const artifactsDir = path.join(__dirname, "artifacts-manual");
fs.mkdirSync(artifactsDir, { recursive: true });

const wanted = ["MemeToken", "BondingCurve", "MemeFactory", "ProfileRegistry", "TestUSDC"];
for (const fileKey of Object.keys(output.contracts)) {
  for (const contractName of Object.keys(output.contracts[fileKey])) {
    if (!wanted.includes(contractName)) continue;
    const c = output.contracts[fileKey][contractName];
    fs.writeFileSync(
      path.join(artifactsDir, `${contractName}.json`),
      JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
    );
    console.log(`Wrote artifacts-manual/${contractName}.json (bytecode ${c.evm.bytecode.object.length / 2} bytes)`);
  }
}

console.log("\nCompilation succeeded.");
