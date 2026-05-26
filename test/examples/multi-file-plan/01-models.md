# Models Layer

<block id="01-task-interface">
## TDDAB-1: Create Task Interface and Factory

<intro>
Create the Task interface with id, title, done fields, and a createTask factory function.
File to create: /home/laco/cvm/test/examples/multi-file-plan/src/task.ts
</intro>

<red>
- test: task.ts file exists
- test: createTask("Buy milk") returns object with title "Buy milk" and done false
- test: createTask generates unique id for each task
</red>

### Implementation
```typescript
export interface Task {
  id: string;
  title: string;
  done: boolean;
}

let nextId = 1;

export function createTask(title: string): Task {
  return { id: "task-" + nextId++, title, done: false };
}
```

<success>
- [ ] src/task.ts exists with Task interface and createTask function
- [ ] createTask("Buy milk") returns { id: "task-1", title: "Buy milk", done: false }
</success>
</block>

<block id="02-task-helpers">
## TDDAB-2: Create Task Helper Functions

<intro>
Create helper functions to mark a task as done and to format a task as string.
File to create: /home/laco/cvm/test/examples/multi-file-plan/src/task-helpers.ts
Depends on block 01-task-interface.
</intro>

<red>
- test: task-helpers.ts file exists
- test: completeTask sets done to true
- test: formatTask returns "[x] title" for done task and "[ ] title" for pending
</red>

### Implementation
```typescript
import { Task } from "./task.js";

export function completeTask(task: Task): Task {
  return { ...task, done: true };
}

export function formatTask(task: Task): string {
  return (task.done ? "[x] " : "[ ] ") + task.title;
}
```

<success>
- [ ] src/task-helpers.ts exists with completeTask and formatTask
- [ ] completeTask returns new task with done: true
- [ ] formatTask returns correct string format
</success>
</block>
