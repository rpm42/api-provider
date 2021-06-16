import { BehaviorSubject, Subject, of } from 'rxjs'
import { mapTo, tap } from 'rxjs/operators'
import { IApiRequest, IApiResponse } from './api'
import Completion from '~/utils/Completion'

enum IO_STATE {
  INITIAL,
  WAITING,
  QUEUING,
  FETCHING,
  LOADING,
  PENDING,
  COMPLETED,
  ERROR
}

enum IO_ACTION {
  WAIT,
  QUEUE,
  FETCH_START,
  FETCH_COMPLETE,
  LOAD_START,
  LOAD_COMPLETE,
  COMPLETE,
  ERROR,
}

class IOError extends Error {
  constructor(message:string){
    super(message)
  }
}

interface IrpAction {
  type: IO_ACTION,
  data?: any
}

export default class Irp<I = any, O = any> {
  public res: IApiResponse<O> = {}
  public state$ = new BehaviorSubject<IO_STATE>(IO_STATE.INITIAL)
  public ok = false
  public errorMessage: string
  public errorState: IO_STATE
  public token: string = null

  public error = (msg: string) => {
    this.dispatch({ type: IO_ACTION.ERROR, data: msg })
    return this
  }

  public withToken(token: string) {
    this.token = token
    return this
  }

  public get state() {
    return this.state$.value
  }

  get action() {
    return {
      waiting: () => {
        this.dispatch({ type: IO_ACTION.WAIT })
        return this
      },
      queue: () => {
        this.dispatch({ type: IO_ACTION.QUEUE })
        return this
      },
      fetchStart: () => {
        this.dispatch({ type: IO_ACTION.FETCH_START })
        return this
      },
      fetchComplete: () => {
        this.dispatch({ type: IO_ACTION.FETCH_COMPLETE })
        return this
      },
      loadStart: () => {
        this.dispatch({ type: IO_ACTION.LOAD_START })
        return this
      },
      loadComplete: () => {
        this.dispatch({ type: IO_ACTION.LOAD_COMPLETE })
        return this
      }
    }
  }

  private dispatch(action: IrpAction) {
    switch (action.type) {
      case IO_ACTION.WAIT:
        return of(action.data).pipe(mapTo(IO_STATE.WAITING))
      case IO_ACTION.QUEUE:
        return of(action.data).pipe(mapTo(IO_STATE.QUEUING))
      case IO_ACTION.FETCH_START:
        return of(action.data).pipe(mapTo(IO_STATE.FETCHING))
      case IO_ACTION.FETCH_COMPLETE:
        return of(action.data).pipe(mapTo(IO_STATE.PENDING))
      case IO_ACTION.LOAD_START:
        return of(action.data).pipe(mapTo(IO_STATE.LOADING))
      case IO_ACTION.LOAD_COMPLETE:
        return of(action.data).pipe(mapTo(IO_STATE.PENDING))
      case IO_ACTION.ERROR:
        return of(action.data).pipe(
          tap(msg => (this.errorMessage = msg)),
          tap(_ => (this.errorState = this.state)),
          mapTo(IO_STATE.ERROR)
        )
    }
  }

  constructor(public readonly req: IApiRequest<I>) {}

  private completionStack: Completion[]

  pushCompletion = (completion = new Completion()) => {
    this.completionStack.push(completion)
  }

  complete = () => {
    const completion = this.completionStack.pop()
    completion.complete()
  }

  get completionLevel() { return this.completionStack.length }
}
