import React, { createContext, useContext, useEffect } from 'react'
import {
  BehaviorSubject,
  Subject,
  Observable,
  fromEvent,
  from,
  of,
  merge,
  iif,
  combineLatest,
  throwError,
  MonoTypeOperatorFunction,
  pipe
} from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import {
  timeout,
  auditTime,
  map,
  tap,
  distinctUntilChanged,
  filter,
  switchMap,
  catchError,
  delay,
  retryWhen,
  mapTo,
  mergeMap,
  share,
  concatMap,
  withLatestFrom
} from 'rxjs/operators'
import { app, App } from '~/providers'
import { useAppContext } from '../AppProvider'
import config from '~/config'
import Token from '~/utils/Token'
import ApiPort from './ApiPort2'
import Irp from './Irp'
import { AnyApiAction, A, S, ActionPingOk, ActionPingFail, ApiActionBase, IAuthData } from './actions'
import { IApiRequest, IApiResponse, IO } from './api'
import { isBrowser } from '~/utils'
import ControllerBase from './Controller'

export interface IApiTree {}

interface IApiCore {
  readonly state: S
  readonly apiBase: string
  readonly apiVersion: string | null
  setApiBase(apiBase: string): void
  call: Partial<IApiTree>
}

export default class ApiCore implements IApiCore {
  private state$ = new BehaviorSubject<S>(S.INITIAL)
  private action$ = new Subject<AnyApiAction>()
  private token$ = new BehaviorSubject<Token>(new Token())
  private apiBase$ = new BehaviorSubject<string>('')

  private irpNext$ = new Subject<Irp>()
  private irpBack$ = new Subject<Irp>()
  private apiPort = new ApiPort(this.irpNext$, this.irpBack$)

  private numberOfPendingIrps = 0

  private get token() {
    return this.token$.value
  }

  /* --- PUBLIC INTERFACE SECTION --- */

  public apiVersion: string | null = null

  public get state() {
    return this.state$.value
  }

  public get apiBase() {
    return this.apiBase$.value
  }

  public async setApiBase(apiBase: string) {
    this.syscall({
      type: IO.PING,
      url: apiBase,
      method: 'GET'
    })
  }

  public call: Partial<IApiTree>

  /* --- METHODS SECTION --- */

  private waitUntilState = (state: S): Promise<void> => {
    return new Promise(resolve => {
      this.state$.pipe(filter(s => s === state)).subscribe(s => resolve())
    })
  }

  protected async syscall(req: IApiRequest) {
    const irp = new Irp(req)
    switch (req.type) {
      case IO.PING:
      case IO.AUTH:
        this.action$.next({ type: A.LOGIN, data: irp })
        await irp.completion
        if (!irp.ok) this.action$.next({ type: A.AUTH_FAIL, data: { error: irp.errorMessage } })
        if (!irp.res.ok) this.action$.next({ type: A.AUTH_FAIL, data: { error: irp.res.error } })
        this.action$.next({ type: A.AUTH_OK, data: irp.res.data.token })
        return irp.res
      case IO.CALL:
        this.action$.next({ type: A.CALL, data: irp })
        await irp.completion
        this.action$.next({ type: A.COMPLETE })
        return irp.res
      case IO.EXCALL:
        this.action$.next({ type: A.EXCLUSIVE_CALL, data: irp })
        await irp.completion
        this.action$.next({ type: A.UNLOCK })
        return irp.res
    }
    return irp.res
  }

  private async dispatch(action: AnyApiAction) {
    console.log('>>> dispatch', action)
    switch (action.type) {
      case A.SET_API_BASE:
        action.data.action.queue()
        this.irpNext$.next(action.data.withToken(this.token.value))
        return S.PINGING
      case A.PING_OK:
        this.apiBase$.next(action.data.apiBase)
        this.apiVersion = action.data.version
        return S.CONNECTED
      case A.PING_FAIL:
        return S.INITIAL
      case A.LOGIN:
        return S.AUTHENTICATING
      case A.AUTH_OK:
        this.setToken(action.data)
        return S.READY
      case A.AUTH_FAIL:
        return S.CONNECTED
      case A.CALL:
        action.data.action.waiting()
        if (this.state === S.BUSY) await this.waitUntilState(S.READY)
        ++this.numberOfPendingIrps
        action.data.action.queue()
        this.irpNext$.next(action.data.withToken(this.token.value))
        return S.BUSY
      case A.COMPLETE:
        --this.numberOfPendingIrps
        return this.numberOfPendingIrps > 0 ? S.BUSY : S.BUSY
      case A.EXCLUSIVE_CALL:
        action.data.action.waiting()
        await this.waitUntilState(S.READY)
        action.data.action.queue()
        this.irpNext$.next(action.data.withToken(this.token.value))
        return S.LOCKED
      case A.UNLOCK:
        return S.READY
    }
    return this.state
  }

  constructor(Controllers: typeof ControllerBase[]) {
    let call: any = {}
    for (const Controller of Controllers) {
      call[Controller.ROUTE] = new Controller(this.apiBase$, this.syscall.bind(this))
    }
    this.call = call

    this.irpBack$.subscribe(irp => irp.complete())

    if (isBrowser()) {
      ;(window as any).apiRoot = this
    }
  }
}
