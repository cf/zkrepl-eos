import BigNumber from 'bignumber.js';

function validateVKObject(vk: any){

  if(!vk || typeof vk !== 'object'){
    throw new Error("Invalid verify key object");
  }else if(!Object.prototype.hasOwnProperty.call(vk, "protocol") || vk.protocol !== 'groth16' ){
    throw new Error("Invalid verify key object, missing or invalid property 'protocol', only supports groth16")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "curve") || vk.curve !== 'bn128' ){
    throw new Error("Invalid verify key object, missing or invalid property 'curve', only supports bn128")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "nPublic") || typeof vk.nPublic !== "number" || vk.nPublic<0 ){
    throw new Error("Invalid verify key object, missing or invalid property 'nPublic'")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "vk_alpha_1") || typeof vk.vk_alpha_1 !== "object" || !vk.vk_alpha_1 || !Array.isArray(vk.vk_alpha_1)){
    throw new Error("Invalid verify key object, missing or invalid property 'vk_alpha_1'")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "vk_beta_2") || typeof vk.vk_beta_2 !== "object" || !vk.vk_beta_2 || !Array.isArray(vk.vk_beta_2)){
    throw new Error("Invalid verify key object, missing or invalid property 'vk_beta_2'")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "vk_gamma_2") || typeof vk.vk_gamma_2 !== "object" || !vk.vk_gamma_2 || !Array.isArray(vk.vk_gamma_2)){
    throw new Error("Invalid verify key object, missing or invalid property 'vk_gamma_2'")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "vk_delta_2") || typeof vk.vk_delta_2 !== "object" || !vk.vk_delta_2 || !Array.isArray(vk.vk_delta_2)){
    throw new Error("Invalid verify key object, missing or invalid property 'vk_delta_2'")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "vk_alphabeta_12") || typeof vk.vk_alphabeta_12 !== "object" || !vk.vk_alphabeta_12 || !Array.isArray(vk.vk_alphabeta_12)){
    throw new Error("Invalid verify key object, missing or invalid property 'vk_alphabeta_12'")
  }else if(!Object.prototype.hasOwnProperty.call(vk, "IC") || typeof vk.IC !== "object" || !vk.IC || !Array.isArray(vk.IC)){
    throw new Error("Invalid verify key object, missing or invalid property 'IC'")
  }


  return true;
}

function hexToArray(str: any): number[] {
  const outArray : number[] = [];
  for(let i=0,l=Math.floor(str.length/2);i++){
    outArray[i] = parseInt(str.substring(i*2,i*2+2),16);
  }
  return outArray;
}
function numberStringToCArray(numStr: any): string{
  return hexToArray(new BigNumber(numStr).toString(16).padStart(32, "0")).join(",");
}
function convertArrayOfNumberStringsToCArray(numStrArray: any[]): string{
  if(Array.isArray(numStrArray[0])){
    return numStrArray.map((x: any)=>convertArrayOfNumberStringsToCArray(x)).join(",");
  }
  return numStrArray.map((x: any)=>numberStringToCArray(x)).join(",");
}


export {
  validateVKObject,
  convertArrayOfNumberStringsToCArray,
}