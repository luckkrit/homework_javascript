// server.ts
// Run with: bun run server.ts
// Then open http://localhost:3000

type Todo = { id: number; title: string; done: boolean };

let todos: Todo[] = [
    { id: 1, title: "Learn htmx", done: false },
    { id: 2, title: "Wire it up to Bun", done: false },
];
let nextId = 3;

function todoRow(todo: Todo): string {
    return `
  <li id="todo-${todo.id}" class="todo-item">
    <input
      type="checkbox"
      ${todo.done ? "checked" : ""}
      hx-put="/todos/${todo.id}/toggle"
      hx-target="#todo-${todo.id}"
      hx-swap="outerHTML"
    />
    <span style="${todo.done ? "text-decoration: line-through; color: #888;" : ""}">
      ${todo.title}
    </span>
    <button
      hx-delete="/todos/${todo.id}"
      hx-target="#todo-${todo.id}"
      hx-swap="outerHTML swap:200ms"
      hx-confirm="Delete this todo?"
    >
      &times;
    </button>
  </li>`;
}

function todoListHTML(): string {
    return todos.map(todoRow).join("\n");
}

// OOB fragment to keep the counter in sync on every response
function countOOB(): string {
    const remaining = todos.filter((t) => !t.done).length;
    return `<span id="count" hx-swap-oob="true">${remaining} remaining</span>`;
}

const pageHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Bun + htmx Todos</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; }
    .todo-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .todo-item span { flex: 1; }
    form { display: flex; gap: 8px; margin-bottom: 16px; }
    input[type="text"] { flex: 1; padding: 6px; }
    button { cursor: pointer; }
  </style>
</head>
<body>
  <h1>Todos <span id="count">${todos.filter((t) => !t.done).length} remaining</span></h1>

  <form
    hx-post="/todos"
    hx-target="#todo-list"
    hx-swap="beforeend"
    hx-on::after-request="this.reset()"
  >
    <input type="text" name="title" placeholder="New todo" required />
    <button type="submit">Add</button>
  </form>

  <ul id="todo-list" style="list-style: none; padding: 0;">
    ${todoListHTML()}
  </ul>
</body>
</html>`;

Bun.serve({
    port: 3000,
    routes: {
        "/": () => new Response(pageHTML(), { headers: { "Content-Type": "text/html" } }),

        "/todos": {
            POST: async (req) => {
                const form = await req.formData();
                const title = String(form.get("title") ?? "").trim();
                if (!title) return new Response("", { status: 400 });

                const todo: Todo = { id: nextId++, title, done: false };
                todos.push(todo);

                // Return the new <li> plus an OOB update for the counter
                const html = `${todoRow(todo)}\n${countOOB()}`;
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            },
        },

        "/todos/:id/toggle": {
            PUT: (req) => {
                const id = Number(req.params.id);
                const todo = todos.find((t) => t.id === id);
                if (!todo) return new Response("Not found", { status: 404 });

                todo.done = !todo.done;

                const html = `${todoRow(todo)}\n${countOOB()}`;
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            },
        },

        "/todos/:id": {
            DELETE: (req) => {
                const id = Number(req.params.id);
                todos = todos.filter((t) => t.id !== id);

                // Empty response removes the <li> (outerHTML swap), plus OOB counter update
                return new Response(countOOB(), { headers: { "Content-Type": "text/html" } });
            },
        },
    },

    error(err) {
        console.error(err);
        return new Response("Internal Server Error", { status: 500 });
    },
});

console.log("Listening on http://localhost:3000");
