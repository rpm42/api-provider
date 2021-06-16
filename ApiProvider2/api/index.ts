import AuthController from './auth.controller'

export enum IO {
  PING = "PING",
  AUTH = "AUTH",
  CALL = "CALL",
  EXCALL = "EXCALL"
}

export interface IApiRequest<T = any> {
  type: IO
  url: string
  method: string //'GET'|'POST'|'HEAD'|'DELETE'|'PATCH'
  json?: boolean
  body?: T
}

export interface IApiResponse<T = any> {
  ok?: boolean
  status?: number
  error?: string
  data?: T
}

export default [AuthController]