import {
  BehaviorSubject,
  Subject,
  from,
  of,
} from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import {
  map,
  switchMap,
  catchError,
  mergeMap,
} from 'rxjs/operators'

import Irp from './Irp'
import { IApiRequest, IApiResponse, IO } from './api'

export default class ApiPort {
  public irpIn$ = new Subject<Irp>()
  public irpOut$ = this.irpIn$.pipe(mergeMap(irp => this.dispatch(irp)))

  private dispatch = async (irp: Irp) => {
    irp.action.fetchStart()
    switch (irp.req.type) {
      case IO.PING:
        return irp
      case IO.CALL:
        return irp
      case IO.EXCALL:
        return irp
      case IO.AUTH:
        return fromFetch(irp.req.url, {
          // credentials: 'include',
          method: irp.req.method,
          headers: irp.req.json && { 'Content-Type': 'application/json;charset=utf-8' },
          body: irp.req.body && JSON.stringify(irp.req.body)
        }).pipe(
          switchMap(resp => {
            irp.action.fetchComplete()
            irp.res.status = resp.status
            irp.res.ok = resp.ok
            irp.action.loadStart()
            return from(resp.json()).pipe(
              map(json => {
                irp.res.data = json
                return irp.action.loadComplete()
              }),
              catchError(e => of(irp.error(e.message)))
            )
          }),
          catchError(e => of(irp.error(e.message)))
        )
    }
  }

  constructor(next$: Subject<Irp>, back$: Subject<Irp>) {
    next$.subscribe(this.irpIn$)
    this.irpOut$.subscribe(back$)
  }
}
