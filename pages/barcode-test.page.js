class BarcodePage extends HTMLElement {
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
        <h1>Barcode Scanner Test Page</h1>
        <p>This page is for testing barcode scanning functionality.</p>
        <button id="scan-button">Scan Barcode</button>
        <div id="result"></div>
        `;
    
        this.shadowRoot.querySelector('#scan-button').addEventListener('click', () => {
        this.scanBarcode();
        });
    }
    
    async scanBarcode() {
        // Simulate a barcode scan
        const result = await new Promise(resolve => setTimeout(() => resolve('1234567890'), 2000));
        this.shadowRoot.querySelector('#result').textContent = `Scanned Barcode: ${result}`;
    }
}