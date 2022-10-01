import { generateDemoContract } from "./templates/democontract";
import { generateMiscFiles } from "./templates/miscfiles";
import { generateRapidUint256 } from "./templates/rapiduint256";
import { generateVerifierHeader } from "./templates/verifierheader";
import type { TextFileRecord, VerifierGeneratorConfig } from "./types";

function generateDemoContractFiles(cfg: VerifierGeneratorConfig){
  const outArr :TextFileRecord[] = generateMiscFiles(cfg)
    .concat(generateDemoContract(cfg))
    .concat(generateRapidUint256(cfg))
    .concat(generateVerifierHeader(cfg));
  return outArr;
}

export {
  generateDemoContractFiles,
}