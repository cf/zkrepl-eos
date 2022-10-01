import { convertArrayOfNumberStringsToCArray } from "../helpers";
import type {VerifierGeneratorConfig, TextFileRecord} from '../types';

function generateDemoContractCppRaw(cfg: VerifierGeneratorConfig){
  const full_file=`#include <${cfg.contract_name}/${cfg.contract_name}.hpp>

ACTION ${cfg.contract_name}::submitproof(std::vector<std::string> input, std::vector<std::string> proof_a, std::vector<std::string> proof_b, std::vector<std::string> proof_c){
  check(${cfg.namespace_name}::verify_groth16_proof(input, proof_a, proof_b, proof_c)==1,"invalid proof");
  uint64_t new_pid = tbl_proofs.available_primary_key();
  tbl_proofs.emplace(_self, [&]( auto& p ) {
    p.pid = new_pid;
    p.input = input;
    p.proof_a = proof_a;
    p.proof_b = proof_b;
    p.proof_c = proof_c;
  });
}

ACTION ${cfg.contract_name}::clearproofs(uint32_t max_erase_iterations){
  auto proof_itr = tbl_proofs.lower_bound(0);
  while(max_erase_iterations>0&&proof_itr != tbl_proofs.end()){
    proof_itr = tbl_proofs.erase(proof_itr);
    max_erase_iterations--;
  }
}`.trim();
  return full_file;
}
function generateDemoContractHppRaw(cfg: VerifierGeneratorConfig){
  const full_file=`

#include "${cfg.namespace_name}.hpp"

using namespace eosio;

CONTRACT ${cfg.contract_name} : public contract {
   public:
      using contract::contract;
      ${cfg.contract_name}( name receiver, name code, datastream<const char*> ds )
         : contract(receiver, code, ds), tbl_proofs(receiver, receiver.value) {}

      ACTION submitproof(std::vector<std::string> input, std::vector<std::string> proof_a, std::vector<std::string> proof_b, std::vector<std::string> proof_c);
      ACTION clearproofs(uint32_t max_erase_iterations);

      TABLE s_tbl_proofs {
         uint64_t pid;
         std::vector<std::string> input;
         std::vector<std::string> proof_a;
         std::vector<std::string> proof_b;
         std::vector<std::string> proof_c;
         uint64_t primary_key()const { return pid; }
      };

      typedef eosio::multi_index<"proofs"_n, s_tbl_proofs> t_tbl_proofs;

      using submitproof_action = action_wrapper<"submitproof"_n, &${cfg.contract_name}::submitproof>;
      using clearproofs_action = action_wrapper<"clearproofs"_n, &${cfg.contract_name}::clearproofs>;

      t_tbl_proofs tbl_proofs;
};`.trim();
  return full_file;
}

function generateDemoContract(cfg: VerifierGeneratorConfig): TextFileRecord[]{
  return [{
    name: cfg.contract_name+".hpp",
    parent_path:`contracts/${cfg.contract_name}/include/${cfg.contract_name}/`,
    content: generateDemoContractHppRaw(cfg),
  },{
    name: cfg.contract_name+".cpp",
    parent_path:`contracts/${cfg.contract_name}/src/`,
    content: generateDemoContractCppRaw(cfg),
  }];

}
export {
  generateDemoContract,
}