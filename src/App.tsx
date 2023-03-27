import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
    // Bug 5: change isLoading depends on the employee loading
    // However, this introduce another bug which is users are able to click on the filter by employee while paginated is still loading
    setIsLoading(employeeUtils.loading)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()

      // Additional Bug: when first employee (i.e. James Smith) is been click it will show loading... because transactions is null
      // However, when second employee (i.e. Mary Miller) is been click it will show what you have for first employee instead of loading...
      // To fixed it simply set transactionsByEmployee to null
      // This is just what I find it seems to be a bug if the way it act is what is expected then remove the line below and ignore the comment above
      transactionsByEmployeeUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />
        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          // Bug 3: load all transactions if id is empty else load transaction by employee id
          onChange={async (newValue) => {
            if (newValue?.id === "") {
              await loadAllTransactions()
            } else if (newValue?.id) {
              await loadTransactionsByEmployee(newValue.id)
            } else {
              return
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {/* Bug 6: remove View More button when paginatedTransactions nextPage is null and transactionsByEmployee is not null 
              When paginatedTransactions next page is null that means there's no more data available to load
              When transactionsByEmployee is null that means it is on All Employee and not null means it is on employee*/}
          {transactions !== null && paginatedTransactions?.nextPage !== null && transactionsByEmployee === null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
