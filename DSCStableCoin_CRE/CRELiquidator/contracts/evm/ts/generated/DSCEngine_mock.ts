// Code generated — DO NOT EDIT.
import type { Address } from 'viem'
import { addContractMock, type ContractMock, type EvmMock } from '@chainlink/cre-sdk/test'

import { DSCEngineABI } from './DSCEngine'

export type DSCEngineMock = {
  calculateHealthFactor?: (totalDscMinted: bigint, collateralValueInUsd: bigint) => bigint
  getAccountCollateralValue?: (user: `0x${string}`) => bigint
  getAccountInformation?: (user: `0x${string}`) => readonly [bigint, bigint]
  getAdditionalFeedPrecision?: () => bigint
  getCollateralBalanceOfUser?: (user: `0x${string}`, token: `0x${string}`) => bigint
  getCollateralTokenPriceFeed?: (token: `0x${string}`) => `0x${string}`
  getCollateralTokens?: () => readonly `0x${string}`[]
  getDsc?: () => `0x${string}`
  getHealthFactor?: (user: `0x${string}`) => bigint
  getLiquidationBonus?: () => bigint
  getLiquidationPrecision?: () => bigint
  getLiquidationThreshold?: () => bigint
  getMinHealthFactor?: () => bigint
  getPrecision?: () => bigint
  getTokenAmountFromUsd?: (token: `0x${string}`, usdAmountInWei: bigint) => bigint
  getUsdValue?: (token: `0x${string}`, amount: bigint) => bigint
} & Pick<ContractMock<typeof DSCEngineABI>, 'writeReport'>

export function newDSCEngineMock(address: Address, evmMock: EvmMock): DSCEngineMock {
  return addContractMock(evmMock, { address, abi: DSCEngineABI }) as DSCEngineMock
}

