# CRELiquidator — automated liquidation keeper for DSC

A [Chainlink Runtime Environment (CRE)](https://docs.chain.link/cre) workflow that monitors the [DSCEngine](../../src/DSCEngine.sol) stablecoin protocol and identifies / liquidates underwater positions.

## What it does

On a cron schedule (default 30s):

1. Reads `MIN_HEALTH_FACTOR` from the deployed `DSCEngine`.
2. For each address in `trackedUsers`, reads `getHealthFactor(user)` and `getAccountInformation(user)` via the CRE `EVMClient`.
3. For users where `healthFactor < MIN_HEALTH_FACTOR`, looks up the user's collateral via `getCollateralBalanceOfUser(user, token)` for each token returned by `getCollateralTokens()`, picks the first non-zero one.
4. Generates a CRE-signed report wrapping a `liquidate(collateral, user, totalDscMinted)` call and dispatches it via `writeReportFromLiquidate(...)`.

In **dry-run** mode (default), the workflow generates the signed report but does not broadcast onchain. In **`--broadcast`** mode the report is sent through a `KeystoneForwarder` to a CRE-aware consumer contract; that path is documented in the "Onchain broadcast" section below.

## Local simulation (the working path)

The fully-tested path is dry-run against a local Anvil node.

### 1. Deploy DSCEngine to Anvil

From the project root:

```bash
anvil --silent &                                       # start anvil in background
forge script script/DeployDSC.s.sol:DeployDSC \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Record the deployed `DSCEngine` address from the broadcast output (or `cat broadcast/DeployDSC.s.sol/31337/run-latest.json | jq '.transactions[]|select(.contractName=="DSCEngine").contractAddress'`).

### 2. Push Anvil's `finalized` block past the deployment

CRE bindings call with `blockNumber: LAST_FINALIZED_BLOCK_NUMBER`. Anvil's `finalized` tag points at genesis by default, so contracts deployed after genesis look like they have no bytecode. Mine ahead:

```bash
cast rpc anvil_mine 100 --rpc-url http://localhost:8545
```

After **any** state change you want the simulator to see (new deposit, new mint, price update), re-run that. The simulator only sees finalized state.

### 3. Configure

`config.staging.json`:
```json
{
  "schedule": "*/30 * * * * *",
  "chainSelector": "7759470850252068959",
  "dscEngineAddress": "0x<your-anvil-deployed-DSCEngine>",
  "trackedUsers": ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"]
}
```

`7759470850252068959` is the Chainlink chain selector for `anvil-devnet`. `0x7099...` is Anvil's account #1 — useful as a guinea-pig user when generating an underwater position.

`../project.yaml` must register Anvil as an experimental chain (chain selectors registered in `rpcs:` won't get an EVM capability auto-attached for non-mainstream chains):
```yaml
staging-settings:
  rpcs:
    - chain-name: ethereum-testnet-sepolia
      url: https://ethereum-sepolia-rpc.publicnode.com
  experimental-chains:
    - chain-selector: 7759470850252068959
      rpc-url: http://localhost:8545
      forwarder: "0x0000000000000000000000000000000000000000"
```

### 4. Install + simulate

```bash
bun install
# from DSCStableCoin_CRE (the project root, not CRELiquidator):
cre workflow simulate ./CRELiquidator --target=staging-settings
```

Successful output looks like:
```
[USER LOG] MIN_HEALTH_FACTOR = 1000000000000000000
[USER LOG] Tracked users: 1
[USER LOG] user=0x70997970... hf=944444444444444444 dsc=9000000000000000000000 ...
[USER LOG] LIQUIDATE user=0x70997970... collateral=0x9fE4... debtToCover=9000...
[USER LOG] LIQUIDATED user=0x70997970...
✓ Workflow Simulation Result: "Done: 1/1 liquidations executed (of 1 tracked)"
```

### 5. Generate a test underwater position

```bash
USER=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
USER_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
WETH=<your-weth-mock-addr>
WETH_FEED=<your-weth-feed-mock-addr>
DSCE=<your-dscengine-addr>
DEPLOYER_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC=http://localhost:8545

cast send $WETH "mint(address,uint256)" $USER 10ether --rpc-url $RPC --private-key $DEPLOYER_PK
cast send $WETH "approve(address,uint256)" $DSCE 10ether --rpc-url $RPC --private-key $USER_PK
cast send $DSCE "depositCollateralAndMintDsc(address,uint256,uint256)" $WETH 10ether 9000ether --rpc-url $RPC --private-key $USER_PK

# Crash ETH/USD from $2000 to $1700 → HF drops to ~0.944
cast send $WETH_FEED "updateAnswer(int256)" 170000000000 --rpc-url $RPC --private-key $DEPLOYER_PK
cast rpc anvil_mine 100 --rpc-url $RPC
```

## Tests

```bash
bun test main.test.ts
```

Tests use `EvmMock.testInstance(chainSelector)` + `newDSCEngineMock(address, evmMock)` to stub the chain interaction. No anvil needed for unit tests.

## Generated bindings

Bindings live in `contracts/evm/ts/generated/` (committed). Regenerate after any DSCEngine ABI change:

```bash
cp ../../out/DSCEngine.sol/DSCEngine.json contracts/evm/src/abi/
cp ../../out/DecentralizedStableCoin.sol/DecentralizedStableCoin.json contracts/evm/src/abi/
cre generate-bindings evm --language typescript
```

Two manual patches are needed after every regen:
1. `index.ts` — the auto-generated `export *` from both contracts collides on `DecodedLog<T>`. Patch to explicit re-exports.
2. The same `index.ts` must not pull in `_mock.ts` files at the production-bundle level — they transitively import `bun:test`, which the CRE WASM compiler rejects. Import mocks directly from `./contracts/evm/ts/generated/DSCEngine_mock` in test files.

## Onchain broadcast (not yet wired)

`cre workflow simulate --broadcast` would actually send the liquidation tx, but it currently fails because:

1. **`writeReport` requires a real `KeystoneForwarder` contract** at the address configured in `project.yaml > experimental-chains > forwarder`. We have `0x0000...0000` as a placeholder, so the simulator's submitter tries to call zero-bytecode.

2. **The Forwarder calls `consumer.onReport(metadata, report)` on the receiver**, not arbitrary functions. Our `DSCEngine` doesn't inherit from `ReceiverTemplate` and has no `onReport`, so even with a working Forwarder the call wouldn't dispatch correctly.

To actually broadcast on Anvil you'd need to:

- Deploy a `KeystoneForwarder` to Anvil (Chainlink open-source contract).
- Build a `DSCLiquidatorAgent` adapter that:
  - Inherits `ReceiverTemplate`.
  - Holds DSC (treasury or pre-deposited).
  - Has approval to `DSCEngine`.
  - Implements `onReport(metadata, report)` to decode `(collateral, user, debt)` and call `dsce.liquidate(...)`.
- Wire the Forwarder address into `project.yaml` and target the agent (not `DSCEngine` directly) in the workflow.

The dry-run path proves the workflow logic end-to-end; the broadcast path is a Chainlink-infrastructure problem separate from the workflow itself. Deferred.

## File layout

```
DSCStableCoin_CRE/
├── .env                       # CRE_ETH_PRIVATE_KEY (gitignored)
├── .gitignore
├── project.yaml               # RPC + chain config
├── secrets.yaml               # CRE secrets (gitignored)
├── CRELiquidator/
│   ├── main.ts                # workflow entry
│   ├── main.test.ts           # bun unit tests
│   ├── config.staging.json    # workflow config
│   ├── config.production.json
│   ├── workflow.yaml          # CRE workflow metadata
│   ├── package.json
│   ├── tsconfig.json
│   └── contracts/evm/
│       ├── src/abi/           # Foundry ABI artifacts
│       └── ts/generated/      # typed bindings (committed)
└── README.md
```
