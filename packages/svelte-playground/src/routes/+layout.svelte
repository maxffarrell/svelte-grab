<script>
  import '../app.css';
  
  // Initialize Svelte Grab in development
  if (import.meta.env.DEV) {
    import('svelte-grab');
  }
</script>

<slot />