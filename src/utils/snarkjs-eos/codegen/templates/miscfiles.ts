import { convertArrayOfNumberStringsToCArray } from "../helpers";
import type {VerifierGeneratorConfig, TextFileRecord} from '../types';


function generateMiscFiles(cfg: VerifierGeneratorConfig): TextFileRecord[]{
  return [{
    name: "CMakeLists.txt",
    parent_path:``,
    content: `
cmake_minimum_required(VERSION 3.5)

project(eosio_contracts)

set(VERSION_MAJOR 3)
set(VERSION_MINOR 2)
set(VERSION_PATCH 0)
set(VERSION_SUFFIX dev)

if(VERSION_SUFFIX)
  set(VERSION_FULL "\${VERSION_MAJOR}.\${VERSION_MINOR}.\${VERSION_PATCH}-\${VERSION_SUFFIX}")
else()
  set(VERSION_FULL "\${VERSION_MAJOR}.\${VERSION_MINOR}.\${VERSION_PATCH}")
endif()

message(STATUS "Building eosio.contracts v\${VERSION_FULL}")

include(ExternalProject)

find_package(cdt)

option(SYSTEM_CONFIGURABLE_WASM_LIMITS
       "Enables use of the host functions activated by the CONFIGURABLE_WASM_LIMITS protocol feature" ON)

option(SYSTEM_BLOCKCHAIN_PARAMETERS
       "Enables use of the host functions activated by the BLOCKCHAIN_PARAMETERS protocol feature" ON)

ExternalProject_Add(
  contracts_project
  SOURCE_DIR \${CMAKE_SOURCE_DIR}/contracts
  BINARY_DIR \${CMAKE_BINARY_DIR}/contracts
  CMAKE_ARGS -DCMAKE_BUILD_TYPE=Release
             -DCMAKE_TOOLCHAIN_FILE=\${CDT_ROOT}/lib/cmake/cdt/CDTWasmToolchain.cmake
             -DSYSTEM_CONFIGURABLE_WASM_LIMITS=\${SYSTEM_CONFIGURABLE_WASM_LIMITS}
             -DSYSTEM_BLOCKCHAIN_PARAMETERS=\${SYSTEM_BLOCKCHAIN_PARAMETERS}
  UPDATE_COMMAND ""
  PATCH_COMMAND ""
  TEST_COMMAND ""
  INSTALL_COMMAND ""
  BUILD_ALWAYS 1)

if(APPLE)
  set(OPENSSL_ROOT "/usr/local/opt/openssl")
elseif(UNIX)
  set(OPENSSL_ROOT "/usr/include/openssl")
endif()
set(SECP256K1_ROOT "/usr/local")

if(APPLE)
  set(OPENSSL_ROOT "/usr/local/opt/openssl")
elseif(UNIX)
  set(OPENSSL_ROOT "/usr/include/openssl")
endif()
set(SECP256K1_ROOT "/usr/local")

    `.trim(),
  },
  {
    name: "CMakeLists.txt",
    parent_path:`contracts/`,
    content: `
cmake_minimum_required(VERSION 3.5)

project(contracts)

option(SYSTEM_CONFIGURABLE_WASM_LIMITS
       "Enables use of the host functions activated by the CONFIGURABLE_WASM_LIMITS protocol feature" ON)

option(SYSTEM_BLOCKCHAIN_PARAMETERS
       "Enables use of the host functions activated by the BLOCKCHAIN_PARAMETERS protocol feature" ON)

find_package(cdt)

set(CDT_VERSION_MIN "3.0")
set(CDT_VERSION_SOFT_MAX "3.0")
# set(CDT_VERSION_HARD_MAX "")

# Check the version of CDT
set(VERSION_MATCH_ERROR_MSG "")
CDT_CHECK_VERSION(VERSION_OUTPUT "\${CDT_VERSION}" "\${CDT_VERSION_MIN}" "\${CDT_VERSION_SOFT_MAX}"
                    "\${CDT_VERSION_HARD_MAX}" VERSION_MATCH_ERROR_MSG)
if(VERSION_OUTPUT STREQUAL "MATCH")
  message(STATUS "Using CDT version \${CDT_VERSION}")
elseif(VERSION_OUTPUT STREQUAL "WARN")
  message(
    WARNING
      "Using CDT version \${CDT_VERSION} even though it exceeds the maximum supported version of \${CDT_VERSION_SOFT_MAX}; continuing with configuration, however build may fail.\nIt is recommended to use CDT version \${CDT_VERSION_SOFT_MAX}.x"
  )
else() # INVALID OR MISMATCH
  message(
    FATAL_ERROR
      "Found CDT version \${CDT_VERSION} but it does not satisfy version requirements: \${VERSION_MATCH_ERROR_MSG}\nPlease use CDT version \${CDT_VERSION_SOFT_MAX}.x"
  )
endif(VERSION_OUTPUT STREQUAL "MATCH")

add_subdirectory(${cfg.contract_name})

    `.trim(),
  },
  {
    name: "CMakeLists.txt",
    parent_path:`contracts/${cfg.contract_name}/`,
    content: `
add_contract(${cfg.contract_name} ${cfg.contract_name} \${CMAKE_CURRENT_SOURCE_DIR}/src/${cfg.contract_name}.cpp)

target_include_directories(${cfg.contract_name}
   PUBLIC
   \${CMAKE_CURRENT_SOURCE_DIR}/include)

set_target_properties(${cfg.contract_name}
   PROPERTIES
   RUNTIME_OUTPUT_DIRECTORY "\${CMAKE_CURRENT_BINARY_DIR}")


target_compile_options( ${cfg.contract_name} PUBLIC -R\${CMAKE_CURRENT_SOURCE_DIR}/ricardian -R\${CMAKE_CURRENT_BINARY_DIR}/ricardian )

    `.trim(),
  },
  {
    name: ".dockerignore",
    parent_path:``,
    content: `
.git
.cicd
.cspell
/build
.DS_Store
    `.trim(),
  },
  {
    name: ".gitignore",
    parent_path:``,
    content: `
# Prerequisites
*.d

# Compiled Object files
*.slo
*.lo
*.o
*.obj

# Precompiled Headers
*.gch
*.pch

# Compiled Dynamic libraries
*.so
*.dylib
*.dll

# Fortran module files
*.mod
*.smod

# Compiled Static libraries
*.lai
*.la
*.a
*.lib

# Executables
*.exe
*.out
*.app

build/*
.DS_Store
.vscode

    `.trim(),
  },

  {
    name: "build.sh",
    parent_path:``,
    content: `
#!/usr/bin/env bash
set -eo pipefail

function usage() {
  printf "Usage: \$0 OPTION...
  -c DIR      Path to CDT installation/build directory. (Optional if using CDT installled at standard system location.)
  -l DIR      Path to Leap build directory. Optional, but must be specified to build tests.
  -h          Print this help menu.
  \\\\n" "\$0" 1>&2
  exit 1
}

BUILD_TESTS=OFF

if [ \$# -ne 0 ]; then
  while getopts "c:l:h" opt; do
    case "\${opt}" in
      c )
        CDT_INSTALL_DIR=\$(realpath \$OPTARG)
      ;;
      l )
        LEAP_BUILD_DIR=\$(realpath \$OPTARG)
        BUILD_TESTS=ON
      ;;
      h )
        usage
      ;;
      ? )
        echo "Invalid Option!" 1>&2
        usage
      ;;
      : )
        echo "Invalid Option: -\${OPTARG} requires an argument." 1>&2
        usage
      ;;
      * )
        usage
      ;;
    esac
  done
fi

LEAP_DIR_CMAKE_OPTION=''

if [[ "\${BUILD_TESTS}" == "ON" ]]; then
  if [[ ! -f "\$LEAP_BUILD_DIR/lib/cmake/leap/leap-config.cmake" ]]; then
    echo "Invalid path to Leap build directory: \$LEAP_BUILD_DIR"
    echo "Leap build directory is required to build tests. If you do not wish to build tests, leave off the -l option."
    echo "Cannot proceed. Exiting..."
    exit 1;
  fi

  echo "Using Leap build directory at: \$LEAP_BUILD_DIR"
  echo ""
  LEAP_DIR_CMAKE_OPTION="-Dleap_DIR=\${LEAP_BUILD_DIR}/lib/cmake/leap"
fi

CDT_DIR_CMAKE_OPTION=''

if [[ -z \$CDT_INSTALL_DIR ]]; then
  echo "No CDT location was specified. Assuming installed in standard location."
  echo ""
else
  if [[ ! -f "\$CDT_INSTALL_DIR/lib/cmake/cdt/cdt-config.cmake" ]]; then
    echo "Invalid path to CDT installation/build directory: \$CDT_INSTALL_DIR"
    echo "If CDT is installed at the standard system location, then you do not need to use the -c option."
    echo "Cannot proceed. Exiting..."
    exit 1;
  fi
  
  echo "Using CDT installation/build at: \$CDT_INSTALL_DIR"
  echo ""
  CDT_DIR_CMAKE_OPTION="-Dcdt_DIR=\${CDT_INSTALL_DIR}/lib/cmake/cdt"
fi

printf "\\t=========== Building reference-contracts ===========\\n\\n"
RED='\\033[0;31m'
NC='\\033[0m'
CPU_CORES=\$(getconf _NPROCESSORS_ONLN)
mkdir -p build
rm -rf build/contracts_out

mkdir -p build/contracts_out
pushd build &> /dev/null
cmake -DBUILD_TESTS=\${BUILD_TESTS} \${LEAP_DIR_CMAKE_OPTION} \${CDT_DIR_CMAKE_OPTION} ../
make -j \$CPU_CORES
popd &> /dev/null

cp  /work/build/contracts/*/*.wasm /work/build/contracts_out
cp  /work/build/contracts/*/*.abi /work/build/contracts_out
    `.trim(),
  },
  {
    name: "builddocker.sh",
    parent_path:``,
    content: `
#!/bin/bash


docker build --platform linux/x86_64 -t eoscontractbuildercircom:latest .

rm -rf ./build
mkdir -p ./build
copyfilefromdockerimage() {
  DOCKER_IMAGE="$1"
  IMAGE_PATH="$2"
  HOST_PATH="$3"
  id=$(docker create $DOCKER_IMAGE)
  docker cp "$id:$IMAGE_PATH" "$HOST_PATH"
  docker rm -v $id
}

copyfilefromdockerimage "eoscontractbuildercircom:latest" "/work/build/contracts_out" "./build"
    `.trim(),
  },
  {
    name: "Dockerfile",
    parent_path:``,
    content: `
FROM ubuntu:20.04
ENV TZ=America/Chicago \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y && apt-get install -y   \
        build-essential             \
        clang                       \
        cmake                       \
        git                         \
        libxml2-dev                 \
        opam ocaml-interp           \
        python3                     \
        python3-pip                 \
        time
RUN wget https://github.com/AntelopeIO/cdt/releases/download/v3.0.1/cdt_3.0.1_amd64.deb && apt-get install -y ./cdt_3.0.1_amd64.deb && rm ./cdt_3.0.1_amd64.deb
WORKDIR /work
ADD . /work
RUN cd /work && chmod +x ./build.sh && ./build.sh
CMD ["./build.sh"]
    `.trim(),
  },
  {
    name: "README.md",
    parent_path:``,
    content: `
# Circom Demo Contract by EOS Rapid
## Getting Started
1. Run:
\`\`\`bash
chmod +x ./builddocker.sh && ./builddocker.sh
\`\`\`

2. Publish Contract
The abi and wasm can be found in build/contracts_out

3.
Generate a proof (you can use our online too or circom's command line)

4.
Call your contract's 'submitproof' function, ensuring that all inputs and proof variables are encoding using hex and are padded out to be 32 bytes long (64 hex characters per variable, zero padded in the front as per big endian)

5.
View the proofs table and see your successfully verified proof!
    `.trim(),
  },
  {
    name: "LICENSE",
    parent_path:``,
    content: `
Copyright (c) 2021-2022 EOS Rapid.  All rights reserved. 

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
    `.trim(),
  },

];

}
export {
  generateMiscFiles,
}