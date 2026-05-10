import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <main class="shell">
    <section class="status-panel">
      <p class="eyebrow">3D Racing Demo</p>
      <h1>Browser racing prototype</h1>
      <p>Scaffold is ready. Next slice: render the first Three.js scene.</p>
    </section>
  </main>
`;
