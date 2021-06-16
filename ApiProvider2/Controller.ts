import { Observable, Subject } from 'rxjs'
import { IO, IApiRequest, IApiResponse } from './api'

export default class ControllerBase {
  static ROUTE = ''
  constructor(
    protected readonly apiBase$: Observable<string>,
    protected readonly syscall: (req: IApiRequest) => Promise<IApiResponse>
  ) {}
}