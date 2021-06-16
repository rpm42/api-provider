import ControllerBase from '../Controller'
import { Observable, Subject } from 'rxjs'
import { filter, map, tap } from 'rxjs/operators'
import { IO, IApiRequest, IApiResponse } from './index'

declare module '../index' {
  interface Partial<IApiEnabled> {
    auth: ControllerAuth
  }
}

export default class ControllerAuth extends ControllerBase {
  static ROUTE = 'auth'
  protected apiBase: string
  constructor(apiBase$: Observable<string>, syscall: (req: IApiRequest) => Promise<IApiResponse>) {
    super(apiBase$, syscall)
    this.apiBase$.pipe(map(base => `${base}/${ControllerAuth.ROUTE}`)).subscribe(value => {
      this.apiBase = value
    })
  }

  async login(login: string, password: string) {
    if (!this.apiBase) return
    console.log('call auth.login')
    const res = await this.syscall({
      type: IO.AUTH,
      url: `${this.apiBase}/login`,
      method: 'POST',
      body: { login, password }
    })
    return res.data
  }
}
