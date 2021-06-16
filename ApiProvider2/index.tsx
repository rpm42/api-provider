import React, { createContext, useContext, useEffect } from 'react'
import { useAppContext } from '../AppProvider'
import ApiCore from './ApiCore'
import controllers from './api'

export const api = new ApiCore(controllers)
export const apiContext = createContext<ApiCore>(api)
export const useApiContext = () => useContext<ApiCore>(apiContext)

const { Provider } = apiContext

const ApiProvider: React.FC = ({ children }) => {
  const appCtx = useAppContext()
  useEffect(() => {
    api.setApiBase(appCtx.env.API_BASE)
  }, [])
  return <Provider value={api}>{children}</Provider>
}

export default ApiProvider