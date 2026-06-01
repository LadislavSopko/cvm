# Services Layer

<block id="03-task-store">
## TDDAB-3: Create TaskStore

<intro>
Create a TaskStore class that manages an array of tasks with add, complete, and list operations.
File to create: /home/laco/cvm/test/examples/multi-file-plan/src/task-store.ts
Depends on blocks 01-task-interface and 02-task-helpers.
</intro>

<red>
- test: task-store.ts file exists
- test: store.add("Buy milk") adds a task and returns it
- test: store.complete(id) marks the task as done
- test: store.list() returns all tasks
- test: store.listPending() returns only tasks with done false
</red>

### Implementation
```typescript
import { Task, createTask } from "./task.js";
import { completeTask } from "./task-helpers.js";

export class TaskStore {
  private tasks: Task[] = [];

  add(title: string): Task {
    const task = createTask(title);
    this.tasks.push(task);
    return task;
  }

  complete(id: string): Task | undefined {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    this.tasks[index] = completeTask(this.tasks[index]);
    return this.tasks[index];
  }

  list(): Task[] {
    return [...this.tasks];
  }

  listPending(): Task[] {
    return this.tasks.filter(t => !t.done);
  }
}
```

<success>
- [ ] src/task-store.ts exists with TaskStore class
- [ ] store.add("Buy milk") returns task with title "Buy milk"
- [ ] store.complete(id) marks task done
- [ ] store.listPending() returns only non-done tasks
</success>
</block>

<block id="04-task-summary">
## TDDAB-4: Create Summary Function

<intro>
Create a summary function that takes a TaskStore and returns a formatted string with all tasks.
File to create: /home/laco/cvm/test/examples/multi-file-plan/src/summary.ts
Depends on block 03-task-store.
</intro>

<red>
- test: summary.ts file exists
- test: summary with empty store returns "No tasks."
- test: summary with tasks returns formatted list
</red>

### Implementation
```typescript
import { TaskStore } from "./task-store.js";
import { formatTask } from "./task-helpers.js";

export function summary(store: TaskStore): string {
  const tasks = store.list();
  if (tasks.length === 0) return "No tasks.";
  return tasks.map(formatTask).join("\n");
}
```

<success>
- [ ] src/summary.ts exists with summary function
- [ ] summary returns "No tasks." for empty store
- [ ] summary returns formatted task list for non-empty store
</success>
</block>
