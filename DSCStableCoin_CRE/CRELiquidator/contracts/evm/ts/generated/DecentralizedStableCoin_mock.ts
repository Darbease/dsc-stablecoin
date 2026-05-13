// Code generated — DO NOT EDIT.
import type { Address } from 'viem'
import { addContractMock, type ContractMock, type EvmMock } from '@chainlink/cre-sdk/test'

import { DecentralizedStableCoinABI } from './DecentralizedStableCoin'

export type DecentralizedStableCoinMock = {
  allowance?: (owner: `0x${string}`, spender: `0x${string}`) => bigint
  balanceOf?: (account: `0x${string}`) => bigint
  decimals?: () => number
  name?: () => string
  owner?: () => `0x${string}`
  symbol?: () => string
  totalSupply?: () => bigint
} & Pick<ContractMock<typeof DecentralizedStableCoinABI>, 'writeReport'>

export function newDecentralizedStableCoinMock(address: Address, evmMock: EvmMock): DecentralizedStableCoinMock {
  return addContractMock(evmMock, { address, abi: DecentralizedStableCoinABI }) as DecentralizedStableCoinMock
}

