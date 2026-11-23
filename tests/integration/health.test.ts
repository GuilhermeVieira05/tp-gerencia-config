import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /health', () => {
  it('responde 200 com status ok e a versao da aplicacao', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' });
  });
});
