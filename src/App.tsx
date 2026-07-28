import { useCallback, useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { fetchUsers } from './api'
import type { Settings, User } from './types'
import './App.css'

const DEFAULT_SETTINGS: Settings = {
  sort: { field: 'name', direction: 'asc' },
  view: { dateFormat: 'MMM D, YYYY', showRelative: true }
}

// Deterministic stand-in for a "joined" timestamp, since the demo API
// does not return one.
function joinedAt(user: User) {
  return moment().subtract(user.id * 37, 'days').startOf('day')
}

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [settings, setSettings] = useState<Settings>(() =>
    _.merge({}, DEFAULT_SETTINGS, { view: { dateFormat: 'D MMM YYYY' } })
  )

  useEffect(() => {
    let cancelled = false

    fetchUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Request failed')
        }
      })
      .then(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const applyQuery = useMemo(() => _.debounce(setQuery, 250), [])
  useEffect(() => () => applyQuery.cancel(), [applyQuery])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const matched = needle
      ? _.filter(users, (u) =>
          _.some(
            [u.name, u.username, u.email, u.company.name, u.address.city],
            (field) => field.toLowerCase().indexOf(needle) !== -1
          )
        )
      : users

    const key = (u: User) => {
      if (settings.sort.field === 'city') return u.address.city.toLowerCase()
      if (settings.sort.field === 'joined') return joinedAt(u).valueOf()
      return u.name.toLowerCase()
    }

    return _.orderBy(matched, [key], [settings.sort.direction])
  }, [users, query, settings.sort.field, settings.sort.direction])

  const byCity = useMemo(
    () => _.groupBy(visible, (u) => u.address.city),
    [visible]
  )

  const toggleDirection = useCallback(() => {
    setSettings((prev) => {
      const direction: Settings['sort']['direction'] =
        prev.sort.direction === 'asc' ? 'desc' : 'asc'
      return _.merge({}, prev, { sort: { direction } })
    })
  }, [])

  const setSortField = useCallback((field: Settings['sort']['field']) => {
    setSettings((prev) => _.merge({}, prev, { sort: { field } }))
  }, [])

  return (
    <main className="app">
      <header className="app__header">
        <h1>Blue Sky</h1>
        <p className="app__subtitle">
          Directory demo &mdash; {users.length} records loaded,{' '}
          {_.size(byCity)} cities. Rendered{' '}
          {moment().format('dddd, MMMM Do YYYY, h:mm a')}.
        </p>
      </header>

      <section className="controls">
        <input
          className="controls__search"
          type="search"
          placeholder="Search name, email, company, city&hellip;"
          onChange={(e) => applyQuery(e.target.value)}
        />

        <div className="controls__group">
          {(['name', 'city', 'joined'] as const).map((field) => (
            <button
              key={field}
              type="button"
              className={
                'chip' + (settings.sort.field === field ? ' chip--on' : '')
              }
              onClick={() => setSortField(field)}
            >
              {_.capitalize(field)}
            </button>
          ))}
          <button type="button" className="chip" onClick={toggleDirection}>
            {settings.sort.direction === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </section>

      {loading && <p className="state">Loading&hellip;</p>}
      {error && <p className="state state--error">Failed to load: {error}</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="state">No records match &ldquo;{query}&rdquo;.</p>
      )}

      <ul className="cards">
        {visible.map((user) => {
          const joined = joinedAt(user)

          return (
            <li key={user.id} className="card">
              <div className="card__top">
                <span className="card__avatar">
                  {_.words(user.name)
                    .slice(0, 2)
                    .map((w) => w.charAt(0).toUpperCase())
                    .join('')}
                </span>
                <div>
                  <h2 className="card__name">{user.name}</h2>
                  <p className="card__meta">@{user.username}</p>
                </div>
              </div>

              <dl className="card__rows">
                <div>
                  <dt>Email</dt>
                  <dd>{user.email.toLowerCase()}</dd>
                </div>
                <div>
                  <dt>Company</dt>
                  <dd>{user.company.name}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>
                    {user.address.city} &middot; {user.address.zipcode}
                  </dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>
                    {joined.format(settings.view.dateFormat)}
                    {settings.view.showRelative && (
                      <span className="card__rel"> ({joined.fromNow()})</span>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="card__phrase">
                &ldquo;{_.truncate(user.company.catchPhrase, { length: 64 })}
                &rdquo;
              </p>
            </li>
          )
        })}
      </ul>

      <footer className="app__footer">
        Pinned to outdated <code>moment</code>, <code>axios</code> and{' '}
        <code>lodash</code> releases on purpose &mdash; see README.
      </footer>
    </main>
  )
}
