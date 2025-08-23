import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../index'

describe('rush routes', () => {
  it('ping works', async () => {
    const res = await request(app).get('/ping')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
  })

  it('rejects bad score body', async () => {
    const res = await request(app).post('/rush/score').send({})
    expect(res.status).toBe(400)
  })
})
