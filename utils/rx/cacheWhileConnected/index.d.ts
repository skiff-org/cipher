// @flow

import type { Observable } from '../__wmelonRxShim'

// Equivalent to observable |> distinctUntilChanged |> publishReplayLatestWhileConnected |> refCount
//
// Creates an observable that shares the connection with and replays the latest value from the underlying
// observable, and skips emissions that are the same as the previous one

export default function cacheWhileConnected<T>(source: Observable<T>): Observable<T>
