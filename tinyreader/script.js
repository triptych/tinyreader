let book;
let rendition;

function setStatus(message) {
    const statusElement = document.getElementById('current-page');
    if (statusElement) {
        statusElement.textContent = message;
    } else {
        console.warn('Status element not found:', message);
    }
}

async function loadEpub(source) {
    try {
        // Clear previous book if it exists
        if (book) {
            book.destroy();
        }
        if (rendition) {
            rendition.destroy();
        }

        setStatus('Loading EPUB...');
        book = ePub(source);
        
        setStatus('Rendering EPUB...');
        rendition = book.renderTo('viewer', {
            width: '100%',
            height: '100%'
        });

        await rendition.display();
        setStatus('EPUB loaded successfully.');

        await book.ready;
        await book.locations.generate(1024);  // Generate locations for pagination

        loadTableOfContents();
        setupEventListeners();
        updatePageNumber();
    } catch (error) {
        setStatus(`Error: ${error.message}`);
        console.error('Error loading EPUB:', error);
    }
}

function loadTableOfContents() {
    const toc = document.getElementById('toc');
    if (!toc) {
        console.warn('Table of contents element not found');
        return;
    }
    toc.innerHTML = '';
    book.loaded.navigation.then(nav => {
        nav.toc.forEach(chapter => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = chapter.label;
            a.href = chapter.href;
            a.onclick = (e) => {
                e.preventDefault();
                rendition.display(chapter.href);
            };
            li.appendChild(a);
            toc.appendChild(li);
        });
    });
}

function setupEventListeners() {
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const toggleSidebarButton = document.getElementById('toggle-sidebar');

    if (prevButton) prevButton.onclick = () => rendition.prev();
    if (nextButton) nextButton.onclick = () => rendition.next();
    if (toggleSidebarButton) toggleSidebarButton.onclick = toggleSidebar;

    rendition.on('relocated', updatePageNumber);
}

function updatePageNumber(location) {
    if (location && location.start) {
        const currentPage = book.locations.locationFromCfi(location.start.cfi);
        const totalPages = book.locations.total;
        setStatus(`Page ${currentPage} of ${totalPages}`);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const loadUrlButton = document.getElementById('load-url');
    const urlInput = document.getElementById('url-input');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type !== 'application/epub+zip') {
                setStatus('Please select an EPUB file.');
                return;
            }
            await loadEpub(file);
        });
    }

    if (loadUrlButton && urlInput) {
        loadUrlButton.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) {
                setStatus('Please enter a valid URL.');
                return;
            }
            await loadEpub(url);
        });
    }

    // Set up collapsible functionality
    const collapsibles = document.getElementsByClassName("collapsible");
    for (let i = 0; i < collapsibles.length; i++) {
        collapsibles[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }

    if (typeof JSZip === 'undefined' || typeof ePub === 'undefined') {
        setStatus('Error: Required libraries are not loaded.');
    } else {
        setStatus('Ready to load EPUB. Please select a file or enter a URL.');
    }
});