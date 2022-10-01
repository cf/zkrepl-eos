import { convertArrayOfNumberStringsToCArray } from "../helpers";
import type {VerifierGeneratorConfig, TextFileRecord} from '../types';

function generateVerifierHeaderRaw(cfg: VerifierGeneratorConfig){
  const vk  = cfg.vk;
  const const_vars_str = `
  const int NUMBER_OF_INPUTS = ${vk.nPublic};
  
  
  const uint8_t g16_alpha1[] = {${convertArrayOfNumberStringsToCArray(vk.vk_alpha_1.slice(0,2))}};
  const uint8_t g16_beta2[] ={${convertArrayOfNumberStringsToCArray(vk.vk_beta_2.slice(0,2).map((x: any)=>x.concat([]).reverse()))}};
  const uint8_t g16_gamma2[] = {${convertArrayOfNumberStringsToCArray(vk.vk_gamma_2.slice(0,2).map((x: any)=>x.concat([]).reverse()))}};
  const uint8_t g16_delta2[] =  {${convertArrayOfNumberStringsToCArray(vk.vk_delta_2.slice(0,2).map((x: any)=>x.concat([]).reverse()))}};
  
  const uint8_t g16_snark_ic[] =  {${convertArrayOfNumberStringsToCArray(vk.IC.map((x: any)=>x.slice(0,2)))}};
  `;

  const full_file=`#include <eosio/eosio.hpp>
#include <eosio/crypto_ext.hpp>
#include "rapiduint256.hpp"

namespace ${cfg.namespace_name} {

${const_vars_str}

void calculate_vk_x(char** inputs, int input_count, char* output)
{
   char tmp_b[64] = {0};
   char vk_x[128] = {0};
   int  i         = 0;
   eosio::check(NUMBER_OF_INPUTS == input_count, "invalid input size");
   for (i = 0; i < NUMBER_OF_INPUTS; i++) {
      eosio::check(rapid_uint256_basic::is_input_be_in_snark_field((uint8_t*)(inputs[i])), "input must be in field");
      eosio::check(eosio::alt_bn128_mul((const char*)(&g16_snark_ic[(i + 1) * 64]), 64, (const char*)(inputs[i]), 32,
                                        &tmp_b[0], 64) == 0,
                   "error multiplying snark ic by input");
      if ((i & 1) == 1) {
         eosio::check(eosio::alt_bn128_add(&vk_x[0], 64, &tmp_b[0], 64, &vk_x[64], 64) == 0,
                      "error updating vk_x calculation");
      } else {
         eosio::check(eosio::alt_bn128_add(&vk_x[64], 64, &tmp_b[0], 64, &vk_x[0], 64) == 0,
                      "error updating vk_x calculation");
      }
   }
   if ((i & 1) == 1) {
      eosio::check(eosio::alt_bn128_add((const char*)(&g16_snark_ic[0]), 64, &vk_x[0], 64, output, 64) == 0,
                   "error performing final vk_x update");
   } else {
      eosio::check(eosio::alt_bn128_add((const char*)(&g16_snark_ic[0]), 64, &vk_x[64], 64, output, 64) == 0,
                   "error performing final vk_x update");
   }
}
void calculate_vk_x(std::vector<std::string> input, char* output)
{
   char tmp[32]   = {0};
   char tmp_b[64] = {0};
   char vk_x[128] = {0};
   eosio::check(NUMBER_OF_INPUTS == input.size(), "invalid input size");
   int i = 0;
   for (i = 0; i < NUMBER_OF_INPUTS; i++) {
      rapid_uint256_basic::from_hex(input.at(i), (char*)(&tmp[0]), 32);
      eosio::check(rapid_uint256_basic::is_input_be_in_snark_field((uint8_t*)tmp), "input must be in field");

      eosio::check(eosio::alt_bn128_mul((const char*)(&g16_snark_ic[(i + 1) * 64]), 64, (const char*)(&tmp[0]), 32,
                                        &tmp_b[0], 64) == 0,
                   "error multiplying snark ic by input");

      if ((i & 1) == 1) {
         eosio::check(eosio::alt_bn128_add(&vk_x[0], 64, &tmp_b[0], 64, &vk_x[64], 64) == 0,
                      "error updating vk_x calculation");
      } else {
         eosio::check(eosio::alt_bn128_add(&vk_x[64], 64, &tmp_b[0], 64, &vk_x[0], 64) == 0,
                      "error updating vk_x calculation");
      }
   }
   if ((i & 1) == 1) {
      eosio::check(eosio::alt_bn128_add((const char*)(&g16_snark_ic[0]), 64, &vk_x[0], 64, output, 64) == 0,
                   "error performing final vk_x update");
   } else {
      eosio::check(eosio::alt_bn128_add((const char*)(&g16_snark_ic[0]), 64, &vk_x[64], 64, output, 64) == 0,
                   "error performing final vk_x update");
   }
}
int verify_groth16_proof(std::vector<std::string> input,
                         std::vector<std::string> proof_a,
                         std::vector<std::string> proof_b,
                         std::vector<std::string> proof_c)
{
   char pairing_buffer[768] = {0};
   char d_proof_a_y[32]     = {0};
   char vk_x[64]            = {0};
   calculate_vk_x(input, &vk_x[0]);

   rapid_uint256_basic::from_hex(proof_a.at(0), (char*)(&pairing_buffer[0]), 32);
   rapid_uint256_basic::from_hex(proof_a.at(1), (char*)(&d_proof_a_y[0]), 32);

   rapid_uint256_basic::negate_y_field(&d_proof_a_y[0], &pairing_buffer[32]);

   rapid_uint256_basic::from_hex(proof_b.at(0), (char*)(&pairing_buffer[64]), 32);
   rapid_uint256_basic::from_hex(proof_b.at(1), (char*)(&pairing_buffer[64 + 32]), 32);
   rapid_uint256_basic::from_hex(proof_b.at(2), (char*)(&pairing_buffer[64 + 64]), 32);
   rapid_uint256_basic::from_hex(proof_b.at(3), (char*)(&pairing_buffer[64 + 96]), 32);

   memcpy(&pairing_buffer[192], &g16_alpha1[0], 64);
   memcpy(&pairing_buffer[192 + 64], &g16_beta2[0], 128);

   memcpy(&pairing_buffer[192 * 2], &vk_x[0], 64);

   memcpy(&pairing_buffer[192 * 2 + 64], &g16_gamma2[0], 128);

   rapid_uint256_basic::from_hex(proof_c.at(0), (char*)(&pairing_buffer[192 * 3]), 32);
   rapid_uint256_basic::from_hex(proof_c.at(1), (char*)(&pairing_buffer[192 * 3 + 32]), 32);
   memcpy(&pairing_buffer[192 * 3 + 64], &g16_delta2[0], 128);

   auto ret = eosio::alt_bn128_pair(&pairing_buffer[0], 768);
   eosio::check(ret != -1, "alt_bn128_pair error");
   return ret == 0 ? 1 : 0;
}
} // namespace ${cfg.namespace_name}`.trim();
  return full_file;
}

function generateVerifierHeader(cfg: VerifierGeneratorConfig): TextFileRecord[]{
  return [{
    name: cfg.namespace_name+".hpp",
    parent_path:`contracts/${cfg.contract_name}/include/${cfg.contract_name}/`,
    content: generateVerifierHeaderRaw(cfg),
  }];

}
export {
  generateVerifierHeader,
}