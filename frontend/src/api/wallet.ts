import request from '@/utils/http'

export function fetchWallet() {
  return request.get<Api.Wallet.WalletInfo>({
    url: '/user/wallet'
  })
}

export function fetchTransactions(params: { page?: number; pageSize?: number; type?: string }) {
  return request.get<Api.Common.PaginatedResponse<Api.Wallet.TransactionItem>>({
    url: '/user/wallet/transactions',
    params
  })
}
