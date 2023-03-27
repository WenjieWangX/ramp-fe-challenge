import { useCallback } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithoutCache, clearCache, loading } = useCustomFetch()

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      // Bug 7: This bug is cause by the data in the cache is not updated
      // Since I am not super familiar with Cache in React what I did to fix this bug is clear cache and then fetch again with updated data
      // However, the con side of this method is time it takes to clear cache and fetch data
      // Better way could be updated every data information in the cache with given transaction id
      // That method can be achieve by using map (or loop through everything in the cache to find the corresponding transactionId and updated data)
      // However, as size of cache increase the time it take will also increase to update (or search) the data
      // I am confident there's definitely be a better solution to solve this bug
      clearCache()
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })
    },
    [fetchWithoutCache, clearCache]
  )

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
