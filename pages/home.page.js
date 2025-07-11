class HomePage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          color: #333;
          padding: 20px;
        }
      </style>
      <h1>Welcome to the Home Page</h1>
      <p>This is a simple home page component.</p>
      <a href="/barcode" class="nav-link" onclick="window.navigate(event, '/barcode')">Go to Barcode Scanner Test Page!</a>
    `;
  }
}

customElements.define('home-page', HomePage);
