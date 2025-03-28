class InventoryModule {
    constructor(app) {
        this.app = app;
        this.items = JSON.parse(localStorage.getItem('inventory')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || [];
        this.units = JSON.parse(localStorage.getItem('units')) || [];
    }

    render(container) {
        container.innerHTML = `
            <div class="inventory-module">
                <h2>Inventory Management</h2>
                
                <div class="tabs">
                    <div class="tab active" data-tab="items">Items</div>
                    <div class="tab" data-tab="categories">Categories</div>
                    <div class="tab" data-tab="units">Units</div>
                    <div class="tab" data-tab="stock-alerts">Stock Alerts</div>
                </div>
                
                <div class="tab-content active" id="items-tab">
                    <div class="toolbar">
                        <button class="btn btn-primary" id="addItem"><i class="fas fa-plus"></i> Add Item</button>
                        <button class="btn btn-secondary" id="importItems"><i class="fas fa-file-import"></i> Import</button>
                        <button class="btn btn-secondary" id="exportItems"><i class="fas fa-file-export"></i> Export</button>
                        <div class="search-box">
                            <input type="text" placeholder="Search items..." id="searchItems">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Rate</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="itemsTable">
                            <!-- Items will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="tab-content" id="categories-tab">
                    <div class="toolbar">
                        <button class="btn btn-primary" id="addCategory"><i class="fas fa-plus"></i> Add Category</button>
                        <div class="search-box">
                            <input type="text" placeholder="Search categories..." id="searchCategories">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Items</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="categoriesTable">
                            <!-- Categories will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="tab-content" id="units-tab">
                    <div class="toolbar">
                        <button class="btn btn-primary" id="addUnit"><i class="fas fa-plus"></i> Add Unit</button>
                        <div class="search-box">
                            <input type="text" placeholder="Search units..." id="searchUnits">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Symbol</th>
                                <th>Items</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="unitsTable">
                            <!-- Units will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="tab-content" id="stock-alerts-tab">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> Items below reorder level will be shown here
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Current Stock</th>
                                <th>Reorder Level</th>
                                <th>Deficit</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="alertsTable">
                            <!-- Alerts will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Initialize tabs
        this.initTabs(container);
        
        // Load data
        this.loadItems();
        this.loadCategories();
        this.loadUnits();
        this.loadStockAlerts();
        
        // Add event listeners
        this.initEventListeners();
    }

    initTabs(container) {
        container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            });
        });
    }

    loadItems() {
        const tableBody = document.getElementById('itemsTable');
        
        tableBody.innerHTML = this.items.map(item => `
            <tr class="${item.stock <= item.reorderLevel ? 'low-stock' : ''}">
                <td>${item.code || 'N/A'}</td>
                <td>${item.name}</td>
                <td>${this.getCategoryName(item.category)}</td>
                <td>${item.stock} ${this.getUnitSymbol(item.unit)}</td>
                <td>${this.app.formatCurrency(item.rate)}</td>
                <td>${this.app.formatCurrency(item.stock * item.rate)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${item.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="adjust" data-id="${item.id}"><i class="fas fa-sliders-h"></i></button>
                </td>
            </tr>
        `).join('');
    }

    loadCategories() {
        const tableBody = document.getElementById('categoriesTable');
        
        tableBody.innerHTML = this.categories.map(category => `
            <tr>
                <td>${category.name}</td>
                <td>${category.description || 'N/A'}</td>
                <td>${this.items.filter(i => i.category === category.id).length}</td>
                <td>
                    <button class="btn-icon" data-action="edit" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="delete" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    loadUnits() {
        const tableBody = document.getElementById('unitsTable');
        
        tableBody.innerHTML = this.units.map(unit => `
            <tr>
                <td>${unit.name}</td>
                <td>${unit.symbol || unit.name}</td>
                <td>${this.items.filter(i => i.unit === unit.id).length}</td>
                <td>
                    <button class="btn-icon" data-action="edit" data-id="${unit.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="delete" data-id="${unit.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    loadStockAlerts() {
        const lowStockItems = this.getLowStockItems();
        const tableBody = document.getElementById('alertsTable');
        
        if (lowStockItems.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No stock alerts at this time</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = lowStockItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.stock} ${this.getUnitSymbol(item.unit)}</td>
                <td>${item.reorderLevel} ${this.getUnitSymbol(item.unit)}</td>
                <td>${Math.max(0, item.reorderLevel - item.stock)} ${this.getUnitSymbol(item.unit)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" data-action="purchase" data-id="${item.id}">Create Purchase</button>
                </td>
            </tr>
        `).join('');
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'N/A';
    }

    getUnitSymbol(unitId) {
        const unit = this.units.find(u => u.id === unitId);
        return unit ? (unit.symbol || unit.name) : '';
    }

    getLowStockItems() {
        return this.items.filter(item => item.stock <= item.reorderLevel);
    }

    initEventListeners() {
        // Add item button
        document.getElementById('addItem').addEventListener('click', () => this.showItemForm());
        
        // Add category button
        document.getElementById('addCategory').addEventListener('click', () => this.showCategoryForm());
        
        // Add unit button
        document.getElementById('addUnit').addEventListener('click', () => this.showUnitForm());
        
        // Table actions
        document.getElementById('itemsTable').addEventListener('click', (e) => this.handleItemAction(e));
        document.getElementById('categoriesTable').addEventListener('click', (e) => this.handleCategoryAction(e));
        document.getElementById('unitsTable').addEventListener('click', (e) => this.handleUnitAction(e));
        document.getElementById('alertsTable').addEventListener('click', (e) => this.handleAlertAction(e));
        
        // Search functionality
        document.getElementById('searchItems').addEventListener('input', (e) => this.searchItems(e.target.value));
        document.getElementById('searchCategories').addEventListener('input', (e) => this.searchCategories(e.target.value));
        document.getElementById('searchUnits').addEventListener('input', (e) => this.searchUnits(e.target.value));
        
        // Import/export
        document.getElementById('importItems').addEventListener('click', () => this.importItems());
        document.getElementById('exportItems').addEventListener('click', () => this.exportItems());
    }

    showItemForm(item = null) {
        const isEdit = item !== null;
        
        const modal = this.app.showModal(
            isEdit ? 'Edit Item' : 'Add New Item',
            `
                <form id="itemForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Name*</label>
                            <input type="text" class="form-control" id="itemName" value="${isEdit ? item.name : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Code</label>
                            <input type="text" class="form-control" id="itemCode" value="${isEdit ? item.code : ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select class="form-control" id="itemCategory">
                                <option value="">-- Select Category --</option>
                                ${this.categories.map(c => `
                                    <option value="${c.id}" ${isEdit && item.category === c.id ? 'selected' : ''}>${c.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Unit</label>
                            <select class="form-control" id="itemUnit" required>
                                <option value="">-- Select Unit --</option>
                                ${this.units.map(u => `
                                    <option value="${u.id}" ${isEdit && item.unit === u.id ? 'selected' : ''}>${u.name} (${u.symbol || u.name})</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Purchase Rate (₹)*</label>
                            <input type="number" step="0.01" class="form-control" id="itemPurchaseRate" value="${isEdit ? item.purchaseRate : '0'}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Selling Rate (₹)*</label>
                            <input type="number" step="0.01" class="form-control" id="itemSellingRate" value="${isEdit ? item.rate : '0'}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Current Stock</label>
                            <input type="number" step="0.01" class="form-control" id="itemStock" value="${isEdit ? item.stock : '0'}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Reorder Level</label>
                            <input type="number" step="0.01" class="form-control" id="itemReorder" value="${isEdit ? item.reorderLevel : '0'}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Tax Rate (%)</label>
                        <input type="number" step="0.01" class="form-control" id="itemTax" value="${isEdit ? item.taxRate : '0'}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="itemDescription">${isEdit ? item.description : ''}</textarea>
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelItem' },
                { text: isEdit ? 'Update' : 'Save', class: 'btn-primary', id: 'saveItem' }
            ]
        );
        
        // Save item
        modal.querySelector('#saveItem').addEventListener('click', () => {
            const itemData = {
                id: isEdit ? item.id : this.generateId(),
                name: document.getElementById('itemName').value,
                code: document.getElementById('itemCode').value,
                category: document.getElementById('itemCategory').value || null,
                unit: document.getElementById('itemUnit').value,
                purchaseRate: parseFloat(document.getElementById('itemPurchaseRate').value) || 0,
                rate: parseFloat(document.getElementById('itemSellingRate').value) || 0,
                stock: parseFloat(document.getElementById('itemStock').value) || 0,
                reorderLevel: parseFloat(document.getElementById('itemReorder').value) || 0,
                taxRate: parseFloat(document.getElementById('itemTax').value) || 0,
                description: document.getElementById('itemDescription').value,
                createdAt: isEdit ? item.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!itemData.name || !itemData.unit) {
                alert('Name and unit are required');
                return;
            }
            
            if (isEdit) {
                const index = this.items.findIndex(i => i.id === item.id);
                this.items[index] = itemData;
            } else {
                this.items.push(itemData);
            }
            
            this.saveData();
            this.loadItems();
            this.loadStockAlerts();
            modal.remove();
            
            this.app.showNotification(`Item ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        });
    }

    showCategoryForm(category = null) {
        const isEdit = category !== null;
        
        const modal = this.app.showModal(
            isEdit ? 'Edit Category' : 'Add New Category',
            `
                <form id="categoryForm">
                    <div class="form-group">
                        <label class="form-label">Name*</label>
                        <input type="text" class="form-control" id="categoryName" value="${isEdit ? category.name : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="categoryDescription">${isEdit ? category.description : ''}</textarea>
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelCategory' },
                { text: isEdit ? 'Update' : 'Save', class: 'btn-primary', id: 'saveCategory' }
            ]
        );
        
        // Save category
        modal.querySelector('#saveCategory').addEventListener('click', () => {
            const categoryData = {
                id: isEdit ? category.id : this.generateId(),
                name: document.getElementById('categoryName').value,
                description: document.getElementById('categoryDescription').value,
                createdAt: isEdit ? category.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!categoryData.name) {
                alert('Name is required');
                return;
            }
            
            if (isEdit) {
                const index = this.categories.findIndex(c => c.id === category.id);
                this.categories[index] = categoryData;
            } else {
                this.categories.push(categoryData);
            }
            
            this.saveData();
            this.loadCategories();
            modal.remove();
            
            this.app.showNotification(`Category ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        });
    }

    showUnitForm(unit = null) {
        const isEdit = unit !== null;
        
        const modal = this.app.showModal(
            isEdit ? 'Edit Unit' : 'Add New Unit',
            `
                <form id="unitForm">
                    <div class="form-group">
                        <label class="form-label">Name*</label>
                        <input type="text" class="form-control" id="unitName" value="${isEdit ? unit.name : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Symbol</label>
                        <input type="text" class="form-control" id="unitSymbol" value="${isEdit ? unit.symbol : ''}">
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelUnit' },
                { text: isEdit ? 'Update' : 'Save', class: 'btn-primary', id: 'saveUnit' }
            ]
        );
        
        // Save unit
        modal.querySelector('#saveUnit').addEventListener('click', () => {
            const unitData = {
                id: isEdit ? unit.id : this.generateId(),
                name: document.getElementById('unitName').value,
                symbol: document.getElementById('unitSymbol').value,
                createdAt: isEdit ? unit.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!unitData.name) {
                alert('Name is required');
                return;
            }
            
            if (isEdit) {
                const index = this.units.findIndex(u => u.id === unit.id);
                this.units[index] = unitData;
            } else {
                this.units.push(unitData);
            }
            
            this.saveData();
            this.loadUnits();
            modal.remove();
            
            this.app.showNotification(`Unit ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        });
    }

    handleItemAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const itemId = actionBtn.dataset.id;
        const item = this.items.find(i => i.id === itemId);
        
        switch(action) {
            case 'view':
                this.showItemDetails(item);
                break;
            case 'edit':
                this.showItemForm(item);
                break;
            case 'adjust':
                this.showStockAdjustmentForm(item);
                break;
        }
    }

    handleCategoryAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const categoryId = actionBtn.dataset.id;
        const category = this.categories.find(c => c.id === categoryId);
        
        switch(action) {
            case 'edit':
                this.showCategoryForm(category);
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this category?')) {
                    this.deleteCategory(categoryId);
                }
                break;
        }
    }

    handleUnitAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const unitId = actionBtn.dataset.id;
        const unit = this.units.find(u => u.id === unitId);
        
        switch(action) {
            case 'edit':
                this.showUnitForm(unit);
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this unit?')) {
                    this.deleteUnit(unitId);
                }
                break;
        }
    }

    handleAlertAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const itemId = actionBtn.dataset.id;
        
        if (action === 'purchase') {
            this.createPurchaseOrderForItem(itemId);
        }
    }

    showItemDetails(item) {
        const modal = this.app.showModal(
            `Item: ${item.name}`,
            `
                <div class="item-details">
                    <div class="detail-row">
                        <span class="detail-label">Code:</span>
                        <span class="detail-value">${item.code || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">${this.getCategoryName(item.category)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Unit:</span>
                        <span class="detail-value">${this.getUnitSymbol(item.unit)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Current Stock:</span>
                        <span class="detail-value ${item.stock <= item.reorderLevel ? 'negative' : ''}">
                            ${item.stock} ${this.getUnitSymbol(item.unit)}
                            ${item.stock <= item.reorderLevel ? '(Low Stock)' : ''}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Reorder Level:</span>
                        <span class="detail-value">${item.reorderLevel} ${this.getUnitSymbol(item.unit)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Purchase Rate:</span>
                        <span class="detail-value">${this.app.formatCurrency(item.purchaseRate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Selling Rate:</span>
                        <span class="detail-value">${this.app.formatCurrency(item.rate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tax Rate:</span>
                        <span class="detail-value">${item.taxRate}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Description:</span>
                        <span class="detail-value">${item.description || 'N/A'}</span>
                    </div>
                    
                    <h3 style="margin-top: 1.5rem;">Stock Movement</h3>
                    <div class="stock-movement" id="stockMovement">
                        <!-- Stock movement will be loaded here -->
                    </div>
                </div>
            `,
            [
                { text: 'Close', class: 'btn-secondary', id: 'closeItemDetails' }
            ]
        );
        
        // Load stock movement
        this.loadStockMovement(item.id, modal.querySelector('#stockMovement'));
    }

    loadStockMovement(itemId, container) {
        // In a real app, this would show purchase/sales history for the item
        container.innerHTML = '<p>Stock movement history will be shown here</p>';
    }

    showStockAdjustmentForm(item) {
        const modal = this.app.showModal(
            `Adjust Stock: ${item.name}`,
            `
                <form id="adjustmentForm">
                    <div class="form-group">
                        <label class="form-label">Current Stock</label>
                        <input type="number" step="0.01" class="form-control" id="currentStock" value="${item.stock}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Adjustment Type</label>
                        <select class="form-control" id="adjustmentType">
                            <option value="increase">Increase Stock</option>
                            <option value="decrease">Decrease Stock</option>
                            <option value="set">Set Stock</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Quantity</label>
                        <input type="number" step="0.01" class="form-control" id="adjustmentQty" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Reason</label>
                        <select class="form-control" id="adjustmentReason">
                            <option value="purchase">Purchase</option>
                            <option value="sale">Sale</option>
                            <option value="return">Return</option>
                            <option value="damage">Damage</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="adjustmentNotes"></textarea>
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelAdjustment' },
                { text: 'Save', class: 'btn-primary', id: 'saveAdjustment' }
            ]
        );
        
        // Save adjustment
        modal.querySelector('#saveAdjustment').addEventListener('click', () => {
            const type = document.getElementById('adjustmentType').value;
            const qty = parseFloat(document.getElementById('adjustmentQty').value);
            const reason = document.getElementById('adjustmentReason').value;
            const notes = document.getElementById('adjustmentNotes').value;
            
            if (!qty || qty <= 0) {
                alert('Please enter a valid quantity');
                return;
            }
            
            // Find the item
            const itemIndex = this.items.findIndex(i => i.id === item.id);
            if (itemIndex === -1) {
                alert('Item not found');
                return;
            }
            
            // Calculate new stock
            let newStock = item.stock;
            switch(type) {
                case 'increase':
                    newStock += qty;
                    break;
                case 'decrease':
                    newStock -= qty;
                    break;
                case 'set':
                    newStock = qty;
                    break;
            }
            
            // Update item stock
            this.items[itemIndex].stock = newStock;
            this.items[itemIndex].updatedAt = new Date().toISOString();
            
            // Create stock adjustment record
            const adjustment = {
                id: this.generateId(),
                itemId: item.id,
                type,
                quantity: qty,
                previousStock: item.stock,
                newStock,
                reason,
                notes,
                date: new Date().toISOString()
            };
            
            // Save data
            this.saveData();
            
            // Update UI
            this.loadItems();
            this.loadStockAlerts();
            
            // Update dashboard
            this.app.updateDashboardSummary();
            
            modal.remove();
            this.app.showNotification('Stock adjusted successfully', 'success');
        });
    }

    deleteCategory(categoryId) {
        // Check if category is used by any items
        const itemsUsingCategory = this.items.filter(i => i.category === categoryId);
        if (itemsUsingCategory.length > 0) {
            alert('Cannot delete category because it is being used by some items');
            return;
        }
        
        // Delete category
        this.categories = this.categories.filter(c => c.id !== categoryId);
        this.saveData();
        this.loadCategories();
        
        this.app.showNotification('Category deleted successfully', 'success');
    }

    deleteUnit(unitId) {
        // Check if unit is used by any items
        const itemsUsingUnit = this.items.filter(i => i.unit === unitId);
        if (itemsUsingUnit.length > 0) {
            alert('Cannot delete unit because it is being used by some items');
            return;
        }
        
        // Delete unit
        this.units = this.units.filter(u => u.id !== unitId);
        this.saveData();
        this.loadUnits();
        
        this.app.showNotification('Unit deleted successfully', 'success');
    }

    createPurchaseOrderForItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            alert('Item not found');
            return;
        }
        
        // In a real app, this would create a purchase order for the item
        alert(`Creating purchase order for ${item.name} to replenish stock`);
    }

    searchItems(query) {
        const filtered = this.items.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            (item.code && item.code.toLowerCase().includes(query.toLowerCase()))
        );
        
        const tableBody = document.getElementById('itemsTable');
        tableBody.innerHTML = filtered.map(item => `
            <tr class="${item.stock <= item.reorderLevel ? 'low-stock' : ''}">
                <td>${item.code || 'N/A'}</td>
                <td>${item.name}</td>
                <td>${this.getCategoryName(item.category)}</td>
                <td>${item.stock} ${this.getUnitSymbol(item.unit)}</td>
                <td>${this.app.formatCurrency(item.rate)}</td>
                <td>${this.app.formatCurrency(item.stock * item.rate)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${item.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="adjust" data-id="${item.id}"><i class="fas fa-sliders-h"></i></button>
                </td>
            </tr>
        `).join('');
    }

    searchCategories(query) {
        const filtered = this.categories.filter(category => 
            category.name.toLowerCase().includes(query.toLowerCase())
        );
        
        const tableBody = document.getElementById('categoriesTable');
        tableBody.innerHTML = filtered.map(category => `
            <tr>
                <td>${category.name}</td>
                <td>${category.description || 'N/A'}</td>
                <td>${this.items.filter(i => i.category === category.id).length}</td>
                <td>
                    <button class="btn-icon" data-action="edit" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="delete" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    searchUnits(query) {
        const filtered = this.units.filter(unit => 
            unit.name.toLowerCase().includes(query.toLowerCase()) ||
            (unit.symbol && unit.symbol.toLowerCase().includes(query.toLowerCase()))
        );
        
        const tableBody = document.getElementById('unitsTable');
        tableBody.innerHTML = filtered.map(unit => `
            <tr>
                <td>${unit.name}</td>
                <td>${unit.symbol || unit.name}</td>
                <td>${this.items.filter(i => i.unit === unit.id).length}</td>
                <td>
                    <button class="btn-icon" data-action="edit" data-id="${unit.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="delete" data-id="${unit.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    importItems() {
        // In a real app, this would import items from a file
        alert('Import functionality will be implemented here');
    }

    exportItems() {
        // In a real app, this would export items to a file
        alert('Export functionality will be implemented here');
    }

    updateItemStock(itemId, quantity, action = 'decrease') {
        const itemIndex = this.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;
        
        if (action === 'decrease') {
            this.items[itemIndex].stock -= quantity;
        } else if (action === 'increase') {
            this.items[itemIndex].stock += quantity;
        }
        
        this.items[itemIndex].updatedAt = new Date().toISOString();
        this.saveData();
        
        // Update UI if on inventory page
        if (document.getElementById('itemsTable')) {
            this.loadItems();
            this.loadStockAlerts();
        }
        
        // Update dashboard
        this.app.updateDashboardSummary();
        
        return true;
    }

    getItemById(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    getInventoryChartData() {
        // Group items by category
        const categories = this.categories.map(category => {
            const categoryItems = this.items.filter(item => item.category === category.id);
            const totalValue = categoryItems.reduce((sum, item) => sum + (item.stock * item.rate), 0);
            return {
                name: category.name,
                value: totalValue
            };
        });
        
        // Sort by value descending
        categories.sort((a, b) => b.value - a.value);
        
        // Limit to top 5 and group others
        const topCategories = categories.slice(0, 5);
        if (categories.length > 5) {
            const othersValue = categories.slice(5).reduce((sum, c) => sum + c.value, 0);
            topCategories.push({
                name: 'Others',
                value: othersValue
            });
        }
        
        return {
            labels: topCategories.map(c => c.name),
            data: topCategories.map(c => c.value)
        };
    }

    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    saveData() {
        localStorage.setItem('inventory', JSON.stringify(this.items));
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('units', JSON.stringify(this.units));
    }
}