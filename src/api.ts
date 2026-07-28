import axios from 'axios'
import type { User } from './types'

// axios 0.18.0 API surface: no `AxiosResponse<T>` generics on the request
// methods, so the response body is cast at the call site.
const client = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: { Accept: 'application/json' }
})

export function fetchUsers(): Promise<User[]> {
  return client.get('/users').then((res) => res.data as User[])
}
