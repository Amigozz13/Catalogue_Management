const API_URL = "http://localhost:5000/catalogues";

let currentSort = 'desc';
let currentFilter = 'all';
let currentPage = 1;
const PAGE_SIZE = 10;
let allCataloguesCache = []; // Store all catalogues for searching/filtering

function showForm(type) {
    document.getElementById('output').innerHTML = '';
    let html = '';
    // Only show ID input for get, update, delete (not create)
    if ((type === 'update') || (type === 'get') || (type === 'delete')) {
        html += `<div class="form-group">
                    <label>Catalogue ID:</label>
                    <input type="number" id="cat_id" min="1" required>
                </div>`;
    }
    // Show name and dates for create and update
    if (type === 'create' || type === 'update') {
        html += `<div class="form-group">
                    <label>Catalogue Name:</label>
                    <input type="text" id="cat_name" required>
                </div>
                <div class="form-group">
                    <label>Effective From (YYYY-MM-DD):</label>
                    <input type="date" id="cat_from" required>
                </div>
                <div class="form-group">
                    <label>Effective To (YYYY-MM-DD):</label>
                    <input type="date" id="cat_to" required>
                </div>
                <div class="form-group">
                    <label>Status:</label>
                    <select id="cat_status" class="status-select">
                        <option value="Active" selected>Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>`;
    }
    html += `<div class="actions">`;
    if (type === 'create') {
        html += `<button onclick="createCatalogue()">Create</button>`;
    } else if (type === 'get') {
        html += `<button onclick="getCatalogue()">Get</button>`;
    } else if (type === 'update') {
        html += `<button class="action-btn update-btn" onclick="updateCatalogue()">Update</button>`;
    } else if (type === 'delete') {
        html += `<button onclick="deleteCatalogue()">Delete</button>`;
    }
    html += `<button onclick="clearForm()">Cancel</button></div>`;
    document.getElementById('form-section').innerHTML = html;
}

function clearForm() {
    document.getElementById('form-section').innerHTML = '';
    document.getElementById('output').innerHTML = '';
}

// Fetch all catalogues and cache them
function fetchAndCacheAllCatalogues(sort = 'desc') {
    return fetch(`${API_URL}?sort=${sort}`)
        .then(res => res.json())
        .then(data => {
            allCataloguesCache = data;
            return data;
        });
}

// Show all catalogues (with optional filter)
function showAllCatalogues(sort = 'desc', filter = 'all', page = 1, searchTerm = '') {
    currentSort = sort;
    currentFilter = filter;
    currentPage = page;

    // Use cached data if available, otherwise fetch and cache
    const render = (data) => {
        // Filter by status
        if (filter !== 'all') {
            data = data.filter(cat => (cat.status || '').toLowerCase() === filter);
        }
        // Filter by search term (ID or name, case-insensitive)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(cat =>
                cat.id.toString().includes(term) ||
                (cat.name && cat.name.toLowerCase().includes(term))
            );
        }

        // Pagination logic
        const total = data.length;
        const totalPages = Math.ceil(total / PAGE_SIZE);
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const paginatedData = data.slice(start, end);

        let html = `
            <h3>All Catalogues</h3>
            <div class="catalogue-controls">
                <label for="sort-select"><strong>Sort by ID:</strong></label>
                <select id="sort-select" onchange="onSortChange()">
                    <option value="desc" ${sort === 'desc' ? 'selected' : ''}>Descending</option>
                    <option value="asc" ${sort === 'asc' ? 'selected' : ''}>Ascending</option>
                </select>
                <label for="filter-select" style="margin-left:18px;"><strong>Filter by Status:</strong></label>
                <select id="filter-select" onchange="onFilterChange()">
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>All</option>
                    <option value="active" ${filter === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${filter === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
        `;
        html += `
            <div class="catalogue-table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Effective From</th>
                            <th>Effective To</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        paginatedData.forEach(cat => {
            html += `<tr>
                <td>${cat.id}</td>
                <td>${cat.name}</td>
                <td>${cat.effective_from}</td>
                <td>${cat.effective_to}</td>
                <td class="${cat.status === 'Active' ? 'status-active' : 'status-inactive'}">${cat.status}</td>
                <td>
                    <button class="table-action-btn update" onclick="showUpdateForm(${cat.id}, '${cat.name.replace(/'/g, "\\'")}', '${cat.effective_from}', '${cat.effective_to}', '${cat.status}')">Edit</button>
                    <button class="table-action-btn delete" onclick="deleteCatalogueById(${cat.id})">Delete</button>
                </td>
            </tr>`;
        });
        html += `</tbody></table></div>`;

        // Pagination controls (only if more than 1 page)
        if (totalPages > 1) {
            html += `<div class="pagination">`;

            // Previous button
            if (page > 1) {
                html += `<button class="pagination-btn" onclick="showAllCatalogues('${sort}', '${filter}', ${page - 1})">&laquo; Prev</button>`;
            } else {
                html += `<button class="pagination-btn" disabled>&laquo; Prev</button>`;
            }

            // Show up to 2 pages before and after current page
            let startPage = Math.max(1, page - 2);
            let endPage = Math.min(totalPages, page + 2);

            // If near the start, show first 5 pages
            if (page <= 3) {
                endPage = Math.min(5, totalPages);
            }
            // If near the end, show last 5 pages
            if (page >= totalPages - 2) {
                startPage = Math.max(1, totalPages - 4);
            }

            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="pagination-btn${i === page ? ' active' : ''}" onclick="showAllCatalogues('${sort}', '${filter}', ${i})">${i}</button>`;
            }

            // Next button
            if (page < totalPages) {
                html += `<button class="pagination-btn" onclick="showAllCatalogues('${sort}', '${filter}', ${page + 1})">Next &raquo;</button>`;
            } else {
                html += `<button class="pagination-btn" disabled>Next &raquo;</button>`;
            }

            html += `</div>`;
        }

        document.getElementById('all-catalogues-section').innerHTML = html;
    };

    if (allCataloguesCache.length === 0) {
        fetchAndCacheAllCatalogues(sort).then(render);
    } else {
        render(allCataloguesCache);
    }
}

// Search handler for the search bar
function onSearchInput() {
    const searchTerm = document.getElementById('search-bar').value.trim();
    showAllCatalogues(currentSort, currentFilter, 1, searchTerm);
}

// Handler for sort dropdown change
function onSortChange() {
    const sort = document.getElementById('sort-select').value;
    allCataloguesCache = [];
    document.getElementById('search-bar').value = '';
    showAllCatalogues(sort, currentFilter, 1, '');
}

// Handler for filter dropdown change
function onFilterChange() {
    const filter = document.getElementById('filter-select').value;
    document.getElementById('search-bar').value = '';
    showAllCatalogues(currentSort, filter, 1, '');
}

function createCatalogue() {
    let name = document.getElementById('cat_name').value.trim();
    let from = document.getElementById('cat_from').value;
    let to = document.getElementById('cat_to').value;
    let status = document.getElementById('cat_status').value;
    if (!name || !from || !to) {
        document.getElementById('output').innerHTML = `<span class="error">All fields are required.</span>`;
        return;
    }
    fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name,
            effective_from: from,
            effective_to: to,
            status
        })
    })
    .then(res => res.json())
    .then(result => {
        if (result.message === 'Created') {
            document.getElementById('output').innerHTML = `<span class="success">Catalogue created successfully!</span>`;
            allCataloguesCache = []; // Clear cache
            showAllCatalogues(currentSort, currentFilter, 1); // Instant refresh
            clearForm(); // Optional: clear the form after creation
        } else {
            document.getElementById('output').innerHTML = `<span class="error">${result.error || 'Error creating catalogue.'}</span>`;
        }
    })
    .catch(() => {
        document.getElementById('output').innerHTML = `<span class="error">Network error.</span>`;
    });
}

function getCatalogue() {
    let id = parseInt(document.getElementById('cat_id').value);
    if (!id) {
        document.getElementById('output').innerHTML = `<span class="error">Catalogue ID is required.</span>`;
        return;
    }
    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(cat => {
            if (cat.error) {
                document.getElementById('output').innerHTML = `<span class="error">${cat.error}</span>`;
            } else {
                const statusValue = (cat.status || "").toLowerCase();
                const statusClass = statusValue === "active" ? "status-active" : "status-inactive";
                let html = `
                    <div>
                        <strong>ID:</strong> ${cat.id}<br>
                        <strong>Name:</strong> ${cat.name}<br>
                        <strong>Effective From:</strong> ${cat.effective_from}<br>
                        <strong>Effective To:</strong> ${cat.effective_to}<br>
                        <strong>Status:</strong> <span class="${statusClass}">${cat.status}</span>
                        <div style="margin-top:18px;">
                            <button class="table-action-btn update" onclick="showUpdateForm(${cat.id}, '${cat.name}', '${cat.effective_from}', '${cat.effective_to}', '${cat.status}')">Edit</button>
                            <button class="table-action-btn delete" onclick="deleteCatalogueById(${cat.id})">Delete</button>
                        </div>
                    </div>
                `;
                document.getElementById('output').innerHTML = html;
            }
        })
        .catch(err => {
            document.getElementById('output').innerHTML = `<span class="error">Network error: ${err}</span>`;
        });
}

// Show update form with pre-filled data
function showUpdateForm(id, name, from, to, status = "ACTIVE") {
    const statusValue = (status || "ACTIVE").toLowerCase();
    let html = `
        <div class="form-group">
            <label>Catalogue Name:</label>
            <input type="text" id="cat_name" value="${name}" required>
        </div>
        <div class="form-group">
            <label>Effective From (YYYY-MM-DD):</label>
            <input type="date" id="cat_from" value="${from}" required>
        </div>
        <div class="form-group">
            <label>Effective To (YYYY-MM-DD):</label>
            <input type="date" id="cat_to" value="${to}" required>
        </div>
        <div class="form-group">
            <label>Status:</label>
            <select id="cat_status">
                <option value="ACTIVE" ${statusValue === "ACTIVE" ? "selected" : ""}>ACTIVE</option>
                <option value="INACTIVE" ${statusValue === "INACTIVE" ? "selected" : ""}>INACTIVE</option>
            </select>
        </div>
        <div class="actions">
            <button onclick="updateCatalogueById(${id})">Update</button>
            <button onclick="clearForm()">Cancel</button>
        </div>
    `;
    document.getElementById('output').innerHTML = html;
}

// Update catalogue by ID
function updateCatalogueById(id) {
    let name = document.getElementById('cat_name').value.trim();
    let from = document.getElementById('cat_from').value;
    let to = document.getElementById('cat_to').value;
    let status = document.getElementById('cat_status').value;
    if (!name || !from || !to) {
        document.getElementById('output').innerHTML = `<span class="error">All fields are required.</span>`;
        return;
    }
    fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, effective_from: from, effective_to: to, status})
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById('output').innerHTML = `<span class="error">${data.error}</span>`;
        } else {
            document.getElementById('output').innerHTML = `<span class="success">Catalogue updated successfully.</span>`;
            allCataloguesCache = []; // Clear cache
            showAllCatalogues(currentSort, currentFilter, 1); // Instant refresh
            clearForm(); // Optional: clear the form after update
        }
    })
    .catch(err => {
        document.getElementById('output').innerHTML = `<span class="error">Network error: ${err}</span>`;
    });
}

// Delete catalogue by ID (from table)
function deleteCatalogueById(id) {
    if (!confirm("Are you sure you want to delete this catalogue?")) return;
    fetch(`${API_URL}/${id}`, {method: "DELETE"})
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                document.getElementById('output').innerHTML = `<span class="error">${data.error}</span>`;
            } else {
                document.getElementById('output').innerHTML = `<span class="success">Catalogue deleted successfully.</span>`;
                showAllCatalogues();
            }
        })
        .catch(err => {
            document.getElementById('output').innerHTML = `<span class="error">Network error: ${err}</span>`;
        });
}

function exitSystem() {
    if (confirm("Are you sure you want to exit the Catalogue Management System?")) {
        window.location.href = "/login";
    }
}

// Automatically show all catalogues when the page loads
window.onload = () => {
    allCataloguesCache = [];
    showAllCatalogues('desc', 'all', 1, '');
};