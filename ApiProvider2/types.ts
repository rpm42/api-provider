import Irp from './Irp'
import { IO, IApiRequest, IApiResponse } from './api'
import { Subject } from 'rxjs'
import Token from '~/utils/Token'

export enum A {
  SET_API_BASE = 'SET_API_BASE',
  PING_OK = 'PING_OK',
  PING_FAIL = 'PING_FAIL',
  LOGIN = 'LOGIN',
  LOGIN_COMPLETE = 'LOGIN_COMPLETE',
  AUTH_OK = 'AUTH_OK',
  AUTH_FAIL = 'AUTH_FAIL',
  LOGOUT = 'LOGOUT',
  CALL = 'CALL',
  COMPLETE = 'COMPLETE',
  EXCLUSIVE_CALL = 'EXCLUSIVE_CALL',
  UNLOCK = 'UNLOCK',
  REGEN = 'REGEN',
  REGEN_OK = 'REGEN_OK',
  REGEN_FAIL = 'REGEN_FAIL'
}

export enum S {
  INITIAL = 'INITIAL',
  PINGING = 'PINGING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATING = 'AUTHENTICATING',
  READY = 'READY',
  BUSY = 'BUSY',
  LOCKED = 'LOCKED',
  REGENERATING = 'REGENERATING'
}

export interface IErrorData {
  error: string
}

export interface IPingOkData {
  apiBase: string
  version: string
}

export interface IAuthData {
  login: string
  password: string
}

export interface IAuthToken {
  token: string
}

export interface ApiActionBase {
  type: A
  data?: any
}

export interface ActionSetApiBase extends ApiActionBase {
  type: A.SET_API_BASE
  data: Irp
}

export interface ActionPingOk extends ApiActionBase {
  type: A.PING_OK
  data: IPingOkData
}

export interface ActionPingFail extends ApiActionBase {
  type: A.PING_FAIL
  data: IErrorData
}

export interface ActionLogin extends ApiActionBase {
  type: A.LOGIN
  data: Irp
}

export interface ActionAuthOk extends ApiActionBase {
  type: A.AUTH_OK
  data: string
}

export interface ActionAuthFail extends ApiActionBase {
  type: A.AUTH_FAIL
  data: IErrorData
}

export interface ActionLogout extends ApiActionBase {
  type: A.LOGOUT
  data?: never
}

export interface ActionCall extends ApiActionBase {
  type: A.CALL
  data: Irp
}

// export interface ExCallData {
//   completion: Subject<void>
// }

export interface ActionExclusiveCall extends ApiActionBase {
  type: A.EXCLUSIVE_CALL
  data: Irp
}

export interface ActionComplete extends ApiActionBase {
  type: A.COMPLETE
  data?: never
}

export interface ActionUnlock extends ApiActionBase {
  type: A.UNLOCK
  data?: never
}

export interface ActionRegen extends ApiActionBase {
  type: A.REGEN
  data: Irp
}

export interface ActionRegenOk extends ApiActionBase {
  type: A.REGEN_OK
  data: string
}

export interface ActionRegenFail extends ApiActionBase {
  type: A.REGEN_FAIL
  data: IErrorData
}

export type AnyApiAction =
  | ActionSetApiBase
  | ActionPingOk
  | ActionPingFail
  | ActionLogin
  | ActionAuthOk
  | ActionAuthFail
  | ActionLogout
  | ActionCall
  | ActionExclusiveCall
  | ActionComplete
  | ActionUnlock
  | ActionRegen
  | ActionRegenOk
  | ActionRegenFail
