import { describe, expect, it } from 'vitest'
import { createApp } from './app'
import { createMemoryStore } from './store'

describe('API', () => {
  const app = () =>
    createApp(
      createMemoryStore([
        { id: 1, title: 'Test', category: 'A', note: '', done: false, createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    )

  it('health liefert ok', async () => {
    const res = await app().request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('GET /api/items liefert die Einträge', async () => {
    const res = await app().request('/api/items')
    const body = (await res.json()) as unknown[]
    expect(body).toHaveLength(1)
  })

  it('POST /api/items erstellt einen Eintrag und weist ungültige Eingaben zurück', async () => {
    const instance = app()
    const created = await instance.request('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Neuer Eintrag' }),
    })
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({ title: 'Neuer Eintrag', category: 'Allgemein' })

    const invalid = await instance.request('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    })
    expect(invalid.status).toBe(400)
  })

  it('PATCH /api/items/:id aktualisiert, validiert und findet Einträge', async () => {
    const instance = app()
    const updated = await instance.request('/api/items/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })
    expect(updated.status).toBe(200)
    expect(await updated.json()).toMatchObject({ id: 1, done: true })

    const invalid = await instance.request('/api/items/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: 'ja' }),
    })
    expect(invalid.status).toBe(400)
    expect((await instance.request('/api/items/2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })).status).toBe(404)
    expect((await instance.request('/api/items/abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })).status).toBe(400)
  })

  it('DELETE /api/items/:id löscht Einträge und meldet ungültige oder unbekannte IDs', async () => {
    const instance = app()
    expect((await instance.request('/api/items/1', { method: 'DELETE' })).status).toBe(204)
    expect((await instance.request('/api/items/1', { method: 'DELETE' })).status).toBe(404)
    expect((await instance.request('/api/items/abc', { method: 'DELETE' })).status).toBe(400)
  })
})
