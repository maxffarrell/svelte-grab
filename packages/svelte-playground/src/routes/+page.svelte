<script>
  let todos = [
    { id: 1, text: 'Learn Svelte', completed: false },
    { id: 2, text: 'Build a component library', completed: true },
    { id: 3, text: 'Create Svelte Grab', completed: false }
  ];

  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, {
        id: todos.length + 1,
        text: newTodo,
        completed: false
      }];
      newTodo = '';
    }
  }

  function toggleTodo(id) {
    todos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }
</script>

<div class="container">
  <div class="card">
    <h1>Svelte Grab Demo</h1>
    <p>This is a demo application for Svelte Grab. Try selecting elements by pressing Cmd+G (Ctrl+G on Windows).</p>
    <p>You can grab any element and copy its context to your clipboard.</p>
  </div>

  <div class="card">
    <h2>Todo List</h2>
    <input bind:value={newTodo} placeholder="Add a new todo..." on:keydown={(e) => e.key === 'Enter' && addTodo()} />
    <button on:click={addTodo}>Add Todo</button>
    
    <ul class="list">
      {#each todos as todo (todo.id)}
        <li class="list-item">
          <input 
            type="checkbox" 
            checked={todo.completed}
            on:change={() => toggleTodo(todo.id)}
          />
          <span class:completed={todo.completed}>{todo.text}</span>
          <button on:click={() => deleteTodo(todo.id)}>Delete</button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="card">
    <h2>Interactive Elements</h2>
    <button on:click={() => alert('Button clicked!')}>Click Me</button>
    <button on:click={() => console.log('Logged to console')}>Log to Console</button>
    
    <div style="margin-top: 1rem;">
      <label for="select-input">Select an option:</label>
      <select id="select-input" style="margin-left: 0.5rem;">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </select>
    </div>
    
    <div style="margin-top: 1rem;">
      <label for="textarea-input">Enter some text:</label>
      <textarea 
        id="textarea-input" 
        rows="4" 
        style="width: 100%; margin-top: 0.5rem;"
        placeholder="This is a textarea..."
      ></textarea>
    </div>
  </div>

  <div class="card">
    <h2>Nested Components</h2>
    <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 4px;">
      <h3>Parent Component</h3>
      <p>This is the parent component with some content.</p>
      
      <div style="background-color: #f0f0f0; padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem;">
        <h4>Child Component</h4>
        <p>This is a nested child component.</p>
        
        <div style="background-color: #e0e0e0; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem;">
          <strong>Grandchild Element</strong>
          <p>Even more nested content here.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .completed {
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>