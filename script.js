// app.js
const appRoot = document.getElementById('app-root');

const routes = {
    '/': 'home-page',
    '/challenge': 'challenge',
    '/barcode': 'barcode-test'
};

function renderPage(path) {
    appRoot.innerHTML = ''; // Clear current content
    const componentTag = routes[path] || 'home-page'; // Default to home
    const pageComponent = document.createElement(componentTag);
    appRoot.appendChild(pageComponent);
}

function navigate(event, path) {
    event.preventDefault(); // Stop default link behavior
    window.history.pushState({}, path, path);
    renderPage(path);
}

// Handle initial load and browser back/forward buttons
window.addEventListener('popstate', () => {
    renderPage(window.location.pathname);
});

// Initial render based on current URL
renderPage(window.location.pathname);