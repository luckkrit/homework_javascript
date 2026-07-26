// handlers.js
// Fake in-memory "todos" data + MSW handlers that simulate a real backend,
// entirely in the browser. No Bun, no real server, no persistence beyond
// this page load.
//
// NOTE: this is a plain <script> (not type="module"). It relies on the
// global `MockServiceWorker` object provided by the IIFE build loaded via
// CDN in index.html -- see the comment there for why (esm.sh's ESM build
// triggers a false "non-browser environment" error).

const { http, HttpResponse, delay } = MockServiceWorker;

let todos = [
  { id: 1, title: "Learn htmx", done: false },
  { id: 2, title: "Simulate a backend with MSW", done: false },
];
let nextId = 3;

function todoRowHTML(todo) {
  return `
  <li id="todo-${todo.id}" class="todo-item">
    <input
      type="checkbox"
      ${todo.done ? "checked" : ""}
      hx-put="/todos/${todo.id}/toggle"
      hx-target="#todo-${todo.id}"
      hx-swap="outerHTML"
    />
    <span style="${todo.done ? "text-decoration: line-through; color:#888;" : ""}">
      ${todo.title}
    </span>
    <button
      hx-delete="/todos/${todo.id}"
      hx-target="#todo-${todo.id}"
      hx-swap="outerHTML swap:200ms"
      hx-confirm="Delete this todo?"
    >&times;</button>
  </li>`;
}

function countOOB() {
  const remaining = todos.filter((t) => !t.done).length;
  return `<span id="count" hx-swap-oob="true">${remaining} remaining</span>`;
}

const handlers = [
  // Simulated network latency, like a real server would have
  http.post("/todos", async ({ request }) => {
    await delay(300);
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    if (!title) return new HttpResponse(null, { status: 400 });

    const todo = { id: nextId++, title, done: false };
    todos.push(todo);

    return HttpResponse.text(`${todoRowHTML(todo)}\n${countOOB()}`, {
      headers: { "Content-Type": "text/html" },
    });
  }),

  http.put("/todos/:id/toggle", async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    const todo = todos.find((t) => t.id === id);
    if (!todo) return new HttpResponse(null, { status: 404 });

    todo.done = !todo.done;

    return HttpResponse.text(`${todoRowHTML(todo)}\n${countOOB()}`, {
      headers: { "Content-Type": "text/html" },
    });
  }),

  http.delete("/todos/:id", async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    todos = todos.filter((t) => t.id !== id);

    return HttpResponse.text(countOOB(), {
      headers: { "Content-Type": "text/html" },
    });
  }),
];

function initialTodosHTML() {
  return todos.map(todoRowHTML).join("\n");
}

function initialCount() {
  return todos.filter((t) => !t.done).length;
}
