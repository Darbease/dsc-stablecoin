-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil cre-install cre-bindings cre-test cre-simulate cre-broadcast

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

help:
	@echo "Usage:"
	@echo "  make deploy [ARGS=...]"
	@echo "    example: make deploy ARGS=\"--network sepolia\""

all: clean remove install update build

clean  :; forge clean

remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

install :; forge install cyfrin/foundry-devops@0.1.0 && forge install smartcontractkit/chainlink-brownie-contracts@0.6.1 && forge install foundry-rs/forge-std@v1.5.3 && forge install openzeppelin/openzeppelin-contracts@v4.8.3

update:; forge update

build:; forge build

test :; forge test

coverage :; forge coverage --report debug > coverage-report.txt

snapshot :; forge snapshot

format :; forge fmt

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

ifeq ($(findstring --network sepolia,$(ARGS)),--network sepolia)
	NETWORK_ARGS := --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv
endif

deploy:
	@forge script script/DeployDSC.s.sol:DeployDSC $(NETWORK_ARGS)

# ============================================================================
# CRE — Chainlink Runtime Environment liquidator workflow (DSCStableCoin_CRE/)
# ============================================================================

cre-install:
	@cd DSCStableCoin_CRE/CRELiquidator && bun install

cre-bindings:
	@mkdir -p DSCStableCoin_CRE/CRELiquidator/contracts/evm/src/abi
	@cp out/DSCEngine.sol/DSCEngine.json DSCStableCoin_CRE/CRELiquidator/contracts/evm/src/abi/
	@cp out/DecentralizedStableCoin.sol/DecentralizedStableCoin.json DSCStableCoin_CRE/CRELiquidator/contracts/evm/src/abi/
	@cd DSCStableCoin_CRE/CRELiquidator && cre generate-bindings evm --language typescript
	@echo "Bindings regenerated. Remember to re-apply the manual patches to contracts/evm/ts/generated/index.ts (see CLAUDE.md gotcha #2)."

cre-test:
	@cd DSCStableCoin_CRE/CRELiquidator && bun test main.test.ts

cre-simulate:
	@cd DSCStableCoin_CRE && cre workflow simulate ./CRELiquidator --target=staging-settings

cre-broadcast:
	@cd DSCStableCoin_CRE && cre workflow simulate ./CRELiquidator --target=staging-settings --broadcast
