# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is a Cyfrin Updraft course project (Patrick Collins). The user is learning Solidity / Foundry / DeFi security patterns alongside the videos. The reference repo is **https://github.com/Cyfrin/foundry-defi-stablecoin-cu** — when there are divergences between local code and the reference, prefer learning *why* Patrick chose his pattern rather than blindly copying. Patrick is a recognized security educator; treat his conventions as industry-grade defaults to internalize.

## Commands

```bash
# Build
forge build
make build

# Test
forge test                                          # All tests
forge test --match-path "test/unit/DSCEngineTest.t.sol"  # Single file
forge test --match-contract DSCEngineTest --match-function testCanDepositCollateral  # Single test
forge test -vvvv                                    # Max verbosity (full traces)
forge test --match-path "test/fuzz/*"               # Fuzz/invariant tests only

# Code quality
forge fmt                   # Format code (Patrick's fmt block — see below)
forge snapshot              # Gas snapshots
forge coverage --report debug > coverage-report.txt

# Local node
make anvil                  # Anvil with deterministic test mnemonic

# Deploy
make deploy                                  # Localhost (Anvil)
make deploy ARGS="--network sepolia"         # Sepolia
```

## Architecture

Decentralized, exogenously-collateralized USD-pegged stablecoin (simplified MakerDAO with no governance, no fees).

### Core contracts

- **`src/DecentralizedStableCoin.sol`** — DSC ERC20. Extends `ERC20Burnable` + `Ownable`. Owner (DSCEngine) is the only caller of `mint` / `burn`.
- **`src/DSCEngine.sol`** — All protocol logic.
  - `LIQUIDATION_THRESHOLD = 50` → 200% overcollateralization required
  - `LIQUIDATION_BONUS = 10` → liquidator gets 10% discount on collateral
  - `MIN_HEALTH_FACTOR = 1e18` → below this, position is liquidatable
  - Accepts WETH + WBTC; values via Chainlink (wrapped by `OracleLib`)
- **`src/libraries/OracleLib.sol`** — `staleCheckLatestRoundData(...)` wraps Chainlink with a 3-hour timeout. Stale price → revert → entire protocol freezes. **This freeze is intentional**, not a bug.

### Relationships

```
DSCEngine (owner of DSC)
    ├── mints/burns → DecentralizedStableCoin
    ├── reads prices via → OracleLib → Chainlink feeds
    └── holds collateral → WETH + WBTC (ERC20)
```

Deployment transfers DSC ownership to DSCEngine immediately (`script/DeployDSC.s.sol`).

### Deployment scripts

- **`script/DeployDSC.s.sol`** — Deploys DSC + DSCEngine, transfers ownership.
- **`script/HelperConfig.s.sol`** — Network-aware config. On Anvil: deploys `ERC20Mock` tokens and `MockV3Aggregator` feeds (ETH=$2000, BTC=$1000). On Sepolia: real addresses.

### Test organization

- `test/unit/DSCEngineTest.t.sol` — 33 unit tests covering deposit/redeem, mint/burn, health factor, liquidation, getters, and 4 failure-mode revert paths wired through broken mocks.
- `test/unit/DecentralizedStablecoinTest.t.sol` — 8 unit tests covering DSC token mint/burn revert paths.
- `test/unit/OracleLibTest.t.sol` — 3 tests covering staleness checks (timeout, bad answered-in-round, happy path via `getTimeout`).
- `test/fuzz/InvariantsTest.t.sol` — Handler-based invariant suite. Two invariants: `invariant_protocolMustHaveMoreValueThanTotalSupply`, `invariant_gettersShouldNotRevert`.
- `test/fuzz/OpenInvariantsTest.t.sol` — Open (un-handled) invariant test kept for pedagogical contrast. Demonstrates that `targetContract(address(dsce))` with random args reverts 100% of the time, motivating the handler pattern.
- `test/fuzz/Handler.t.sol` — wraps DSCEngine for the strict suite. Tracks depositors in `usersWithCollateralDeposited[]` ghost array so `mintDsc` can target real users. `updateCollateralPrice` is intentionally commented out (it can drive `wethValue + wbtcValue < totalSupply` to zero, which is a known design limitation the protocol accepts).
- `test/mocks/` — `MockV3Aggregator` for Chainlink simulation; `MockFailedMintDSC`, `MockFailedTransfer`, `MockFailedTransferFrom`, `MockMoreDebtDSC` for testing the `if (!success) revert ...` branches.

**Core invariant:** total collateral USD value ≥ total DSC supply. Plus `invariant_gettersShouldNotRevert` — every parameterless view should be safe to call regardless of state.

**Final coverage** (production code in `src/`):
- `DSCEngine.sol`: 98.33% lines, 90.91% branches, 100% funcs
- `DecentralizedStableCoin.sol`: 100% across all dimensions
- `OracleLib.sol`: 100% across all dimensions

### CRE integration (`DSCStableCoin_CRE/`)

TypeScript Chainlink Runtime Environment workflow that monitors DSC positions on a cron and surfaces / dispatches liquidations. Self-contained project (Bun + `@chainlink/cre-sdk`), separate from the Foundry tree. Detailed setup + architecture in `DSCStableCoin_CRE/CRELiquidator/README.md`.

**Status**: local-sim read + dry-run write working end-to-end against Anvil. Broadcast deferred (needs `KeystoneForwarder` + `ReceiverTemplate` consumer adapter on the target chain).

**Project layout split**: project root config (`project.yaml`, `.env`, `secrets.yaml`) lives at `DSCStableCoin_CRE/`; the workflow lives at `DSCStableCoin_CRE/CRELiquidator/`. CRE CLI commands run from `DSCStableCoin_CRE/`, not from `CRELiquidator/`.

---

## CRE-specific gotchas (hard-won lessons — read before touching this code)

These cost real time during the integration. Filing them so they don't have to be rediscovered.

### 1. `cre generate-bindings` requires the rigid `contracts/<chain-family>/src/abi/` layout
The `--abi` flag overrides the file path but the tool still does a sanity check for a `contracts/` directory at the project root. Copy or symlink ABI JSON files into `contracts/evm/src/abi/`, then run `cre generate-bindings evm --language typescript` with no `--abi` flag.

### 2. Generated bindings collide on `DecodedLog<T>` when two contracts are present
Every generated `<Contract>.ts` exports its own `DecodedLog<T>` interface. The auto-generated `index.ts` does `export *` from each, which fails compilation with TS2308. Patch `index.ts` to be explicit:
```typescript
export { DSCEngineABI, DSCEngine } from './DSCEngine'
export { DecentralizedStableCoinABI, DecentralizedStableCoin } from './DecentralizedStableCoin'
```
Re-applied every time you regenerate bindings.

### 3. `_mock.ts` files leak `bun:test` into the WASM bundle
The generated `*_mock.ts` files import `@chainlink/cre-sdk/test`, which transitively imports `bun:test`. `cre-compile` targets browser/WASM and rejects `bun:test`. **Production code (`main.ts`) must NOT import from a barrel that re-exports the mocks**. In tests, import the mocks directly: `import { newDSCEngineMock } from './contracts/evm/ts/generated/DSCEngine_mock'`.

### 4. Anvil's `finalized` block tag points to genesis
The generated bindings hardcode `blockNumber: LAST_FINALIZED_BLOCK_NUMBER`. Anvil's `finalized` defaults to block 0. Result: every read returns `0x` (empty), viem fails with "Cannot decode zero data". After every state-changing tx on Anvil that you want the simulator to see, run:
```bash
cast rpc anvil_mine 100 --rpc-url http://localhost:8545
```

### 5. `rpcs:` config alone doesn't register the EVM capability for non-mainstream chains
For Anvil (chain selector `7759470850252068959`), adding to `rpcs:` in `project.yaml` is not enough — the simulator fails with `no compatible capability found for id evm:ChainSelector:<n>@1.0.0`. Move to `experimental-chains:`:
```yaml
experimental-chains:
  - chain-selector: 7759470850252068959
    rpc-url: http://localhost:8545
    forwarder: "0x0000000000000000000000000000000000000000"
```
The simulator output will confirm with `Added experimental chain (chain-selector: ...)`.

### 6. `writeReport*` is not what it looks like
The generated `dsce.writeReportFromLiquidate(...)` is **not** a direct call to `dsce.liquidate(...)`. It generates a CRE-signed report wrapping the calldata, submits it to a `KeystoneForwarder` at the configured address, and the Forwarder calls `consumer.onReport(metadata, report)` on the receiver. The consumer must inherit `ReceiverTemplate` and route `onReport` to whatever it wants. Calling `liquidate` directly via this binding **does not work** unless the receiver knows how to dispatch the report back to `dsce.liquidate(...)` — typically via a separate adapter contract.

### 7. `--broadcast` requires a real Forwarder
Dry-run (default) works without a Forwarder — the simulator stops at report generation. `--broadcast` actually submits to the chain via the Forwarder. With `forwarder: 0x000...000` and `--broadcast`, you get:
```
WriteReport returned an error: no contract code at given address
```
Either deploy a real `KeystoneForwarder` to Anvil, or ship the dry-run as the demo.

### 8. `cre workflow simulate` runs from the project root, not the workflow folder
```bash
cd DSCStableCoin_CRE && cre workflow simulate ./CRELiquidator --target=staging-settings
```
Running it from inside `CRELiquidator/` fails — it can't find `project.yaml`.

### 9. Chain selectors are JSON-unsafe as `bigint`
Chain selectors like `16015286601757825753n` overflow standard JSON `number`. Store them in config as strings, then `BigInt(config.chainSelector)` in the workflow.

---

## Patrick's industry patterns (study these)

These show up across every Cyfrin codebase. Internalizing them gives you a security-minded vocabulary for reviewing other Solidity code.

### 1. Contract layout block (literal comment header)

Every contract starts with two comment blocks specifying the file's structure:

```solidity
// Layout of Contract:
// version
// imports
// errors
// interfaces, libraries, contracts
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// internal & private view & pure functions
// external & public view & pure functions
```

Inside the body, use `///////////////////` separators to delineate sections (`Errors`, `State Variables`, `Events`, `Modifiers`, `External Functions`, `Private & Internal Functions`, `View & Pure Functions`).

### 2. Naming conventions

| Kind | Pattern | Example |
|---|---|---|
| Storage var | `s_` prefix | `s_priceFeeds`, `s_collateralDeposited` |
| Immutable | `i_` prefix | `i_dsc` |
| Constant | `SCREAMING_SNAKE_CASE` | `LIQUIDATION_THRESHOLD`, `MIN_HEALTH_FACTOR` |
| Custom error | `ContractName__ErrorName(params)` | `DSCEngine__BreaksHealthFactor(uint256)` |
| Event | `PastTenseAction` | `CollateralDeposited`, `CollateralRedeemed` |
| Test | `testCanX`, `testRevertsIfX`, `testCantX` | `testCanDepositCollateral` |

Forge's newer linter wants `mixedCase` for storage — **ignore those notes**, the `s_`/`i_` convention is widely accepted in the security community and used by major audit firms.

### 3. Custom errors with parameters

Errors should carry diagnostic info:

```solidity
error DSCEngine__TokenNotAllowed(address token);
error DSCEngine__BreaksHealthFactor(uint256 healthFactorValue);
```

When matching in tests, use `abi.encodeWithSelector`:

```solidity
vm.expectRevert(abi.encodeWithSelector(DSCEngine.DSCEngine__BreaksHealthFactor.selector, expectedHF));
```

### 4. NatSpec on storage vars + libraries

```solidity
/// @dev Mapping of token address to price feed address
mapping(address collateralToken => address priceFeed) private s_priceFeeds;
```

Library docs explain the **design intent**, not just behavior — e.g., `OracleLib` documents that the protocol is *meant* to freeze when oracles fail, so a reviewer doesn't "fix" it.

### 5. CEI (Checks-Effects-Interactions) ordering

State changes happen *before* external calls. Pattern in `_redeemCollateral`:

```solidity
s_collateralDeposited[from][token] -= amount;        // EFFECT first
emit CollateralRedeemed(from, to, token, amount);    // EVENT
bool success = IERC20(token).transfer(to, amount);   // INTERACTION last
if (!success) revert DSCEngine__TransferFailed();
```

Even though `nonReentrant` protects most paths, CEI ordering is the belt-and-suspenders default.

### 6. Library binding via `using`

```solidity
using OracleLib for AggregatorV3Interface;
// ...
priceFeed.staleCheckLatestRoundData();   // method-style call
```

The wrapped call is a drop-in replacement for `latestRoundData()`. Pattern: any time you wrap an external dependency for safety, expose it via a library so existing call sites don't have to change shape.

### 7. Internal helper + external pure mirror

When test code needs to verify computation independently, expose the math as an external `pure` function that delegates to an internal helper:

```solidity
function _calculateHealthFactor(uint256 totalDscMinted, uint256 collateralValueInUsd)
    internal pure returns (uint256) { /* math */ }

function calculateHealthFactor(uint256 totalDscMinted, uint256 collateralValueInUsd)
    external pure returns (uint256)
{ return _calculateHealthFactor(totalDscMinted, collateralValueInUsd); }
```

Tests then compute *expected* values via the contract's own function — they stay correct if the math is refactored, and a price-feed change doesn't silently invalidate hardcoded literals.

### 8. Test patterns

- **Inherit `StdCheats, Test`** in test contracts (gives `makeAddr`, `hoax`, `deal`, etc.).
- **Use modifiers for shared state setup**: `depositedCollateral`, `depositedCollateralAndMintedDsc`. Apply with `function testX() public depositedCollateral`.
- **Read live values, don't hardcode**: pull mock price from `MockV3Aggregator(feed).latestRoundData()` and compute expected amounts. Don't bake `0.5 ether` into a HF assertion when you can call `dsce.calculateHealthFactor(...)`.
- **Section headers**: same `////////////////` pattern as the source.
- **Failure-mode mocks** for revert paths that need a deliberately broken dependency (`MockFailedMintDSC`, `MockFailedTransfer`, `MockFailedTransferFrom`, `MockMoreDebtDSC`).

### 9. Invariant / fuzz patterns (handler-based)

Two test contracts:
- **Invariants test** — sets `targetContract(address(handler))` so the fuzzer only calls the handler, defines `invariant_*` functions.
- **Handler** — wraps the engine. Each public function in the handler is a *bounded valid action*:
  - `bound(amount, 1, MAX_DEPOSIT_SIZE)` to keep fuzzed args in a sane range
  - Short-circuit invalid states with `if (cond) return;` instead of letting the call revert
  - `_getCollateralFromSeed(uint256 seed)` maps fuzzer-provided uint to one of the allowed tokens
  - `vm.prank(msg.sender)` so the handler simulates many distinct actors
  - Track ghost variables (e.g., set of users who deposited) for invariant assertions

**Two suite variants:**
- `failOnRevert/` — `fail_on_revert = true`. Handler must produce only valid sequences. Strictest correctness check.
- `continueOnRevert/` — `fail_on_revert = false`. Handler can call invalid sequences; the fuzzer explores wider. Looser, broader.

**Always include `invariant_gettersShouldNotRevert`** — every parameterless view function should be callable in any state. Cheap insurance against accidentally introducing a getter that divides by zero, etc.

### 10. Failure-mode mocks

When you need to test the `if (!success) revert` branch of an external call, you can't use a normal mock — you need a mock that *deliberately misbehaves*:

- `MockFailedMintDSC` — `mint()` always returns `false`
- `MockFailedTransfer` / `MockFailedTransferFrom` — same for ERC20 transfer paths
- `MockMoreDebtDSC` — used for liquidation edge case where burning increases debt

Test pattern: deploy a `DSCEngine` with the broken mock as the DSC token, then exercise the path that should revert.

### 11. Makefile patterns

```makefile
-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil

DEFAULT_ANVIL_KEY := 0xac0974...

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

ifeq ($(findstring --network sepolia,$(ARGS)),--network sepolia)
    NETWORK_ARGS := --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify ...
endif

deploy:
    @forge script script/DeployDSC.s.sol:DeployDSC $(NETWORK_ARGS)
```

Key idea: a *single* `make deploy` target switches between local + remote networks based on `ARGS`. Avoids duplicate targets per network.

### 12. `foundry.toml` formatting block (Patrick's defaults)

```toml
[fmt]
bracket_spacing = true        # import { X } — note spaces inside braces
int_types = "long"            # uint256, not uint
line_length = 120
multiline_func_header = "all" # function headers always wrap when long
number_underscore = "thousands"  # 1_000_000
quote_style = "double"
tab_width = 4
wrap_comments = true
```

```toml
[invariant]
runs = 64
depth = 64
fail_on_revert = true   # strict — can be overridden in continueOnRevert suite
```

---

## Local project state (workshop complete)

- **Author tag in source is `DARB`** (intentional — the user wrote this following the course). Reference repo says "Patrick Collins."
- **Modifiers wrap to internal helpers** (`_moreThanZero`, `_isAllowedToken`) per a forge-lint code-size suggestion. Reference inlines the bodies. Functionally identical; ours is slightly smaller bytecode.
- **Error names diverge** from reference: ours uses `DSCEngine__NotAllowedToken()` (no param) and `DSCEngine__TokenAddressesAndPriceFeedAddressesMustBeSameLength()`. DSC token errors are `DecentralizedStableCoin__MustBeAboveZero` and `DecentralizedStableCoin__NotZeroAddress`. Test code asserts these names.
- **`_healthFactor` zero-debt branch fixed** — `if (totalDscMinted == 0) return type(uint256).max;` was added locally. This is the divide-by-zero bug Patrick mentions but doesn't fix in his on-screen first pass.
- **`OracleLib` integrated** — `DSCEngine` uses `using OracleLib for AggregatorV3Interface` and routes all price reads through `staleCheckLatestRoundData()`. Stale prices freeze the protocol by design.
- **Failure-mode mocks shipped** — `MockFailedMintDSC`, `MockFailedTransfer`, `MockFailedTransferFrom`, `MockMoreDebtDSC` live in `test/mocks/`. Each is wired into a fresh `DSCEngine` instance per test to hit the `if (!success) revert ...` branches.
- **Fuzz suite is single-folder** at `test/fuzz/` (not split into `failOnRevert/` + `continueOnRevert/` like Patrick's reference). Our handler is strict-mode-safe (zero reverts across 16,384 fuzzed calls), and `foundry.toml` runs `fail_on_revert = false` for the broader exploration mode. A split is optional polish, not a correctness gap.
- **`updateCollateralPrice` in the handler is commented out** — preserves the teaching artifact of the headline invariant failing under arbitrary oracle manipulation. The commented function stays in the file with a docstring explaining why.
- **Project is ready for GitHub.** README + Makefile present at the root; coverage on production code is ~98.6%; all 47 tests pass.

## Foundry config notes

- Remappings: `@chainlink/contracts/` → `lib/chainlink-brownie-contracts/contracts/`, `@openzeppelin/contracts` → `lib/openzeppelin-contracts/contracts`
- Dependencies (pinned per Patrick): OpenZeppelin **v4.8.3** (newer versions removed `ERC20Mock`), Chainlink brownie contracts v0.6.1, forge-std v1.5.3, foundry-devops v0.1.0
- Note: `lib/openzeppelin-contracts/contracts/mocks/ERC20Mock.sol` works in v4.8.3. The reference repo ships its own `test/mocks/ERC20Mock.sol` so future OZ upgrades don't break tests — likely worth adopting once we hit a place where it matters.
