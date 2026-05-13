# Foundry DeFi Stablecoin

A decentralized, exogenously-collateralized, USD-pegged stablecoin built with Foundry.

## About

This protocol implements a minimal stablecoin (`DSC`) that is algorithmically pegged to $1 USD and backed by exogenous crypto collateral (WETH and WBTC). It is conceptually similar to DAI, but stripped of governance, fees, and the multi-collateral complexity of MakerDAO — just the core mechanism: deposit collateral, mint DSC, stay overcollateralized or get liquidated.

The system enforces a 200% minimum collateralization ratio via `LIQUIDATION_THRESHOLD = 50` (a position's collateral is only counted at 50% of its USD value when computing the health factor). Any position whose health factor drops below `MIN_HEALTH_FACTOR = 1e18` becomes liquidatable, and liquidators receive a 10% collateral discount (`LIQUIDATION_BONUS = 10`) as incentive. All USD valuations come from Chainlink price feeds, wrapped in an oracle library that reverts on stale data — by design, the entire protocol freezes if the oracle network goes down.

Built as part of the Cyfrin Updraft Foundry course. This is a learning / portfolio project, not production code.

## Getting Started

### Requirements

- [git](https://git-scm.com/)
- [foundry](https://getfoundry.sh/)

### Quickstart

```bash
git clone https://github.com/Darbease/dsc-stablecoin.git
cd dsc-stablecoin
forge install
forge build
```

## Usage

### Start a local node

```bash
make anvil
```

### Deploy locally

In a separate terminal (anvil must be running):

```bash
make deploy
```

### Deploy to Sepolia

Create a `.env` file at the project root with the following variables:

```
SEPOLIA_RPC_URL=...
PRIVATE_KEY=...
ETHERSCAN_API_KEY=...
```

Then:

```bash
make deploy ARGS="--network sepolia"
```

## Testing

Per Patrick Collins' framing, there are 4 tiers of tests: unit, integration, forked, and staging. This repo covers **unit** and **fuzz/invariant**.

```bash
forge test                                            # all tests
forge test --match-path "test/unit/*"                 # unit only
forge test --match-path "test/fuzz/*"                 # fuzz / invariant only
forge coverage                                        # coverage report
```

Current line coverage on the core source contracts:

| Contract                          | Lines            | Branches       | Functions       |
| --------------------------------- | ---------------- | -------------- | --------------- |
| `src/DSCEngine.sol`               | 96.67% (116/120) | 72.73% (8/11)  | 100.00% (34/34) |
| `src/DecentralizedStableCoin.sol` | 100.00% (18/18)  | 100.00% (4/4)  | 100.00% (3/3)   |
| `src/libraries/OracleLib.sol`     | 100.00% (10/10)  | 100.00% (2/2)  | 100.00% (2/2)   |

The fuzz suite exercises the protocol's core invariant: **total collateral value (USD) must always exceed total DSC supply (USD)**, verified by `invariant_protocolMustHaveMoreValueThanTotalSupply()` in `test/fuzz/InvariantsTest.t.sol`.

## Architecture

```
DSCEngine (owner of DSC)
    ├── mints / burns ────► DecentralizedStableCoin
    ├── reads prices via ─► OracleLib ──► Chainlink feeds
    └── holds collateral ─► WETH + WBTC (ERC20)
```

**`src/DSCEngine.sol`** is the core of the protocol. It owns the DSC token and handles all logic: depositing and redeeming collateral, minting and burning DSC, and liquidating undercollateralized positions. Key parameters:

- `LIQUIDATION_THRESHOLD = 50` — requires 200% overcollateralization
- `LIQUIDATION_BONUS = 10` — liquidators receive a 10% collateral discount
- `LIQUIDATION_PRECISION = 100` — denominator for the two ratios above
- `MIN_HEALTH_FACTOR = 1e18` — positions below this are liquidatable
- `PRECISION = 1e18` — scaling factor used throughout
- `ADDITIONAL_FEED_PRECISION = 1e10` — bumps 8-decimal Chainlink prices to 18-decimal math

**`src/DecentralizedStableCoin.sol`** is the ERC20 DSC token (extends `ERC20Burnable` and `Ownable`). Only its owner — the DSCEngine — can mint or burn. The token itself contains no collateral or health-factor logic; it is a pure mintable / burnable token controlled by the engine.

**`src/libraries/OracleLib.sol`** wraps Chainlink's `latestRoundData()` with a `TIMEOUT = 3 hours` staleness check. If a price feed has not been updated within that window, the library reverts, which propagates through every engine function that touches a price. The entire protocol freezing on stale prices is the intentional safety stance — it's better to halt than to operate on bad data.

### Network configuration

`script/HelperConfig.s.sol` provides per-network configuration:

- **Sepolia (chainid 11155111)** — uses real Chainlink ETH/USD and BTC/USD feeds and real WETH/WBTC addresses
- **Anvil (anything else)** — deploys `MockV3Aggregator` price feeds (ETH = $2000, BTC = $1000) and `ERC20Mock` tokens for WETH and WBTC

`script/DeployDSC.s.sol` deploys the DSC token, deploys the engine wired to the configured tokens / feeds, then transfers DSC ownership to the engine.

### Dependencies

Pinned in `foundry.toml` remappings:

- `openzeppelin-contracts@v4.8.3` — v4.9 removed `ERC20Mock` from the bundled mocks, so this is intentionally pinned
- `chainlink-brownie-contracts@0.6.1`
- `forge-std@v1.5.3`
- `foundry-devops@0.1.0`

## CRE integration (`DSCStableCoin_CRE/`)

A [Chainlink Runtime Environment](https://docs.chain.link/cre) workflow that monitors deployed `DSCEngine` positions on a cron and automatically liquidates any user whose health factor drops below `MIN_HEALTH_FACTOR`. Lives in `DSCStableCoin_CRE/` as a self-contained TypeScript project (Bun + `@chainlink/cre-sdk`).

End-to-end **local simulation** is working: cron trigger → read `getHealthFactor()` for tracked users against a local Anvil-deployed `DSCEngine` → for underwater positions, generate a CRE-signed report wrapping a `liquidate(...)` call → dispatch via `writeReport`. Verified by manufacturing an underwater position (10 WETH @ $1700 collateralizing 9000 DSC → HF = 0.944) and watching the workflow detect + queue the liquidation.

**Onchain broadcast is intentionally deferred** — it requires deploying a `KeystoneForwarder` to the target chain plus a `ReceiverTemplate` consumer adapter, which is Chainlink-infrastructure work separate from the workflow itself. See [`DSCStableCoin_CRE/CRELiquidator/README.md`](DSCStableCoin_CRE/CRELiquidator/README.md) for the full architecture, the dry-run vs broadcast split, and the path to wire onchain execution.

Quick start (after deploying DSCEngine to Anvil via `make deploy`):

```bash
cd DSCStableCoin_CRE/CRELiquidator
bun install
cd ..
cre workflow simulate ./CRELiquidator --target=staging-settings
```

## Acknowledgments

- [Cyfrin Updraft](https://updraft.cyfrin.io/) and [Patrick Collins](https://github.com/PatrickAlphaC) for the curriculum and the [reference implementation](https://github.com/Cyfrin/foundry-defi-stablecoin-cu) this project is built against.
- The Foundry team for the tooling.
