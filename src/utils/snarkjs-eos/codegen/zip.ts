import { generateDemoContractFiles } from ".";
import type { VerifierGeneratorConfig } from "./types";
import * as zip from '@zip.js/zip.js';


async function generateDemoContractZip(cfg: VerifierGeneratorConfig){
  const files = generateDemoContractFiles(cfg);
  
  const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"), { bufferedWrite: true });
  for(let f of files){
    await zipWriter.add(f.parent_path+f.name, new zip.TextReader(f.content));
  }

}
