interface TextFileRecord {
  content: string;
  name: string;
  parent_path: string;
}
type VKGroth16 = any;

interface VerifierGeneratorConfig {
  vk: VKGroth16;
  contract_name: string;
  namespace_name: string;
}
export type {
  TextFileRecord,
  VerifierGeneratorConfig,
}