import { createApp } from '../../src/app';
import { InMemoryTaskRepository } from '../../src/domain/task-repository';
import { TaskService } from '../../src/domain/task-service';

export const START = '2026-11-13T12:00:00.000Z';

// App com repositorio novo, relogio controlavel e ids previsiveis (id-1, id-2...).
// Cada teste chama makeApp() e, por isso, nao enxerga dados dos outros.
export function makeApp() {
  const clock = { now: new Date(START) };
  let seq = 0;
  const service = new TaskService(new InMemoryTaskRepository(), {
    now: () => clock.now,
    generateId: () => `id-${++seq}`,
  });
  return { app: createApp(service), clock };
}
