class InvoicingModule {
    constructor(app) {
        this.app = app;
        this.invoices = JSON.parse(localStorage.getItem('invoices')) || [];
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.templates = JSON.parse(localStorage.getItem('templates')) || this.getDefaultTemplates();
    }

    render(container) {
        container.innerHTML = `
            <div class="invoicing-module">
                <h2>Invoicing</h2>
                
                <div class="tabs">
                    <div class="tab active" data-tab="cart">Cart</div>
                    <div class="tab" data-tab="invoices">Invoices</div>
                    <div class="tab" data-tab="templates">Templates</div>
                </div>
                
                <div class="tab-content active" id="cart-tab">
                    <div class="cart-container">
                        <div class="cart-items">
                            <div class="toolbar">
                                <button class="btn btn-primary" id="addToCart"><i class="fas fa-plus"></i> Add Item</button>
                                <button class="btn btn-danger" id="clearCart"><i class="fas fa-trash"></i> Clear Cart</button>
                                <div class="search-box">
                                    <input type="text" placeholder="Search items..." id="searchCartItems">
                                    <i class="fas fa-search"></i>
                                </div>
                            </div>
                            
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Rate</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="cartTable">
                                    <!-- Cart items will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="cart-summary">
                            <div class="summary-card">
                                <h3>Cart Summary</h3>
                                
                                <div class="summary-row">
                                    <span>Subtotal:</span>
                                    <span id="cartSubtotal">₹0.00</span>
                                </div>
                                
                                <div class="summary-row">
                                    <span>Tax:</span>
                                    <span id="cartTax">₹0.00</span>
                                </div>
                                
                                <div class="summary-row total">
                                    <span>Total:</span>
                                    <span id="cartTotal">₹0.00</span>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Customer</label>
                                    <select class="form-control" id="cartCustomer">
                                        <option value="">Walk-in Customer</option>
                                        ${this.app.accounting.ledgers
                                            .filter(l => l.type === 'customer')
                                            .map(c => `<option value="${c.id}">${c.name}</option>`)
                                            .join('')}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" id="cartNotes"></textarea>
                                </div>
                                
                                <button class="btn btn-primary btn-block" id="createInvoice">Create Invoice</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" id="invoices-tab">
                    <div class="toolbar">
                        <div class="filters">
                            <select id="invoiceStatus">
                                <option value="all">All Invoices</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                            <input type="date" id="invoiceDateFrom">
                            <input type="date" id="invoiceDateTo">
                            <button class="btn btn-primary" id="applyInvoiceFilters">Apply</button>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Invoice No.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="invoicesTable">
                            <!-- Invoices will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="tab-content" id="templates-tab">
                    <div class="toolbar">
                        <button class="btn btn-primary" id="addTemplate"><i class="fas fa-plus"></i> Add Template</button>
                    </div>
                    
                    <div class="templates-grid" id="templatesGrid">
                        <!-- Templates will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Initialize tabs
        this.initTabs(container);
        
        // Load data
        this.loadCart();
        this.loadInvoices();
        this.loadTemplates();
        
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

    loadCart() {
        const tableBody = document.getElementById('cartTable');
        
        if (this.cart.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Your cart is empty</td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = this.cart.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${this.app.formatCurrency(item.rate)}</td>
                    <td>
                        <input type="number" min="1" step="1" class="form-control qty-input" value="${item.quantity}" data-id="${item.id}">
                    </td>
                    <td>${this.app.formatCurrency(item.amount)}</td>
                    <td>
                        <button class="btn-icon" data-action="remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
        
        this.updateCartSummary();
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.amount, 0);
        const taxRate = parseFloat(localStorage.getItem('taxRate')) || 18;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        document.getElementById('cartSubtotal').textContent = this.app.formatCurrency(subtotal);
        document.getElementById('cartTax').textContent = this.app.formatCurrency(tax);
        document.getElementById('cartTotal').textContent = this.app.formatCurrency(total);
    }

    loadInvoices() {
        const tableBody = document.getElementById('invoicesTable');
        
        tableBody.innerHTML = this.invoices.map(invoice => `
            <tr>
                <td>${invoice.invoiceNo}</td>
                <td>${new Date(invoice.date).toLocaleDateString()}</td>
                <td>${this.getCustomerName(invoice.customerId)}</td>
                <td>${this.app.formatCurrency(invoice.total)}</td>
                <td>
                    <span class="badge ${invoice.paid ? 'badge-success' : 'badge-warning'}">
                        ${invoice.paid ? 'Paid' : 'Unpaid'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${invoice.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="print" data-id="${invoice.id}"><i class="fas fa-print"></i></button>
                    ${!invoice.paid ? `
                        <button class="btn-icon" data-action="payment" data-id="${invoice.id}"><i class="fas fa-rupee-sign"></i></button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    loadTemplates() {
        const container = document.getElementById('templatesGrid');
        
        container.innerHTML = this.templates.map(template => `
            <div class="template-card">
                <div class="template-preview" style="background-color: ${template.bgColor || '#fff'}; color: ${template.textColor || '#000'}">
                    <div class="template-header">
                        <h3>${template.businessName || 'Your Business'}</h3>
                        <p>INVOICE</p>
                    </div>
                    <div class="template-body">
                        <div class="template-row">
                            <span>Invoice #:</span>
                            <span>INV-001</span>
                        </div>
                        <div class="template-row">
                            <span>Date:</span>
                            <span>${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="template-actions">
                    <span>${template.name}</span>
                    <div>
                        <button class="btn-icon" data-action="edit-template" data-id="${template.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" data-action="delete-template" data-id="${template.id}"><i class="fas fa-trash"></i></button>
                        <button class="btn-icon" data-action="use-template" data-id="${template.id}"><i class="fas fa-check"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCustomerName(customerId) {
        if (!customerId) return 'Walk-in Customer';
        const customer = this.app.accounting.ledgers.find(l => l.id === customerId && l.type === 'customer');
        return customer ? customer.name : 'Unknown';
    }

    getDefaultTemplates() {
        return [
            {
                id: 'template1',
                name: 'Simple Receipt',
                type: 'receipt',
                businessName: '',
                headerColor: '#4361ee',
                bgColor: '#ffffff',
                textColor: '#000000',
                showLogo: false,
                showTaxDetails: true,
                footerText: 'Thank you for your business!',
                createdAt: new Date().toISOString()
            },
            {
                id: 'template2',
                name: 'Professional Invoice',
                type: 'invoice',
                businessName: '',
                headerColor: '#2b2d42',
                bgColor: '#f8f9fa',
                textColor: '#212529',
                showLogo: true,
                showTaxDetails: true,
                footerText: 'Terms: Payment due within 15 days',
                createdAt: new Date().toISOString()
            },
            {
                id: 'template3',
                name: 'Minimal A5',
                type: 'a5',
                businessName: '',
                headerColor: '#ffffff',
                bgColor: '#ffffff',
                textColor: '#000000',
                showLogo: false,
                showTaxDetails: false,
                footerText: '',
                createdAt: new Date().toISOString()
            }
        ];
    }

    initEventListeners() {
        // Add to cart button
        document.getElementById('addToCart').addEventListener('click', () => this.showAddItemModal());
        
        // Clear cart button
        document.getElementById('clearCart').addEventListener('click', () => this.clearCart());
        
        // Create invoice button
        document.getElementById('createInvoice').addEventListener('click', () => this.createInvoice());
        
        // Cart quantity changes
        document.getElementById('cartTable').addEventListener('change', (e) => {
            if (e.target.classList.contains('qty-input')) {
                this.updateCartItemQuantity(e.target.dataset.id, parseInt(e.target.value));
            }
        });
        
        // Cart item actions
        document.getElementById('cartTable').addEventListener('click', (e) => this.handleCartAction(e));
        
        // Invoice filters
        document.getElementById('applyInvoiceFilters').addEventListener('click', () => this.applyInvoiceFilters());
        
        // Invoice actions
        document.getElementById('invoicesTable').addEventListener('click', (e) => this.handleInvoiceAction(e));
        
        // Template actions
        document.getElementById('addTemplate').addEventListener('click', () => this.showTemplateForm());
        document.getElementById('templatesGrid').addEventListener('click', (e) => this.handleTemplateAction(e));
    }

    showAddItemModal() {
        const modal = this.app.showModal(
            'Add Item to Cart',
            `
                <div class="form-group">
                    <label class="form-label">Search Items</label>
                    <input type="text" class="form-control" id="itemSearch" placeholder="Type to search...">
                </div>
                
                <div id="searchResults" style="max-height: 300px; overflow-y: auto; margin-top: 1rem;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Rate</th>
                                <th>Stock</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="searchResultsTable">
                            ${this.app.inventory.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${this.app.formatCurrency(item.rate)}</td>
                                    <td>${item.stock} ${this.app.inventory.getUnitSymbol(item.unit)}</td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" data-action="add" data-id="${item.id}">Add</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `,
            [
                { text: 'Close', class: 'btn-secondary', id: 'closeAddItem' }
            ]
        );
        
        // Search functionality
        document.getElementById('itemSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.app.inventory.items.filter(item => 
                item.name.toLowerCase().includes(query) ||
                (item.code && item.code.toLowerCase().includes(query))
            );
            
            document.getElementById('searchResultsTable').innerHTML = filtered.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${this.app.formatCurrency(item.rate)}</td>
                    <td>${item.stock} ${this.app.inventory.getUnitSymbol(item.unit)}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" data-action="add" data-id="${item.id}">Add</button>
                    </td>
                </tr>
            `).join('');
        });
        
        // Add item to cart
        document.getElementById('searchResultsTable').addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn || actionBtn.dataset.action !== 'add') return;
            
            const itemId = actionBtn.dataset.id;
            this.addItemToCart(itemId);
            modal.remove();
        });
    }

    addItemToCart(itemId, quantity = 1) {
        const item = this.app.inventory.getItemById(itemId);
        if (!item) return;
        
        // Check if item already in cart
        const existingItem = this.cart.find(i => i.id === itemId);
        
        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
            existingItem.amount = existingItem.quantity * existingItem.rate;
        } else {
            // Add new item
            this.cart.push({
                id: item.id,
                name: item.name,
                rate: item.rate,
                quantity: quantity,
                amount: item.rate * quantity,
                taxRate: item.taxRate
            });
        }
        
        this.saveCart();
        this.loadCart();
    }

    updateCartItemQuantity(itemId, quantity) {
        if (quantity < 1) {
            this.removeItemFromCart(itemId);
            return;
        }
        
        const item = this.cart.find(i => i.id === itemId);
        if (item) {
            item.quantity = quantity;
            item.amount = item.rate * quantity;
            this.saveCart();
            this.updateCartSummary();
        }
    }

    removeItemFromCart(itemId) {
        this.cart = this.cart.filter(i => i.id !== itemId);
        this.saveCart();
        this.loadCart();
    }

    clearCart() {
        if (this.cart.length === 0 || confirm('Are you sure you want to clear the cart?')) {
            this.cart = [];
            this.saveCart();
            this.loadCart();
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    createInvoice() {
        if (this.cart.length === 0) {
            alert('Cart is empty. Add items to create an invoice.');
            return;
        }
        
        const customerId = document.getElementById('cartCustomer').value;
        const notes = document.getElementById('cartNotes').value;
        
        // Calculate totals
        const subtotal = this.cart.reduce((sum, item) => sum + item.amount, 0);
        const taxRate = parseFloat(localStorage.getItem('taxRate')) || 18;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        // Create invoice
        const invoice = {
            id: this.generateId(),
            invoiceNo: this.generateInvoiceNumber(),
            date: new Date().toISOString(),
            customerId: customerId || null,
            items: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                rate: item.rate,
                quantity: item.quantity,
                amount: item.amount,
                taxRate: item.taxRate
            })),
            subtotal,
            tax,
            total,
            paid: false,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // Add to invoices
        this.invoices.push(invoice);
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
        
        // Update customer balance if applicable
        if (customerId) {
            const customer = this.app.accounting.ledgers.find(l => l.id === customerId);
            if (customer) {
                customer.balance -= total;
                customer.updatedAt = new Date().toISOString();
                this.app.accounting.saveData();
            }
            
            // Add transaction
            this.app.accounting.transactions.push({
                id: this.app.accounting.generateId(),
                type: 'invoice',
                partyId: customerId,
                amount: total,
                date: invoice.date,
                balance: customer.balance,
                invoiceId: invoice.id,
                createdAt: new Date().toISOString()
            });
            this.app.accounting.saveData();
        }
        
        // Update inventory
        this.cart.forEach(item => {
            this.app.inventory.updateItemStock(item.id, item.quantity, 'decrease');
        });
        
        // Clear cart
        this.cart = [];
        this.saveCart();
        
        // Update UI
        this.loadCart();
        this.loadInvoices();
        
        // Update dashboard
        this.app.updateDashboardSummary();
        
        // Show success
        this.app.showNotification('Invoice created successfully', 'success');
        
        // Print invoice
        this.printInvoice(invoice);
    }

    generateInvoiceNumber() {
        const lastInvoice = this.invoices[this.invoices.length - 1];
        const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNo.split('-')[1]) || 0 : 0;
        return `INV-${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    handleCartAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const itemId = actionBtn.dataset.id;
        
        if (action === 'remove') {
            this.removeItemFromCart(itemId);
        }
    }

    handleInvoiceAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const invoiceId = actionBtn.dataset.id;
        const invoice = this.invoices.find(i => i.id === invoiceId);
        
        switch(action) {
            case 'view':
                this.showInvoiceDetails(invoice);
                break;
            case 'print':
                this.printInvoice(invoice);
                break;
            case 'payment':
                this.recordInvoicePayment(invoice);
                break;
        }
    }

    showInvoiceDetails(invoice) {
        const modal = this.app.showModal(
            `Invoice #${invoice.invoiceNo}`,
            `
                <div class="invoice-details">
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${new Date(invoice.date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Customer:</span>
                        <span class="detail-value">${this.getCustomerName(invoice.customerId)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="badge ${invoice.paid ? 'badge-success' : 'badge-warning'}">
                                ${invoice.paid ? 'Paid' : 'Unpaid'}
                            </span>
                        </span>
                    </div>
                    
                    <h3 style="margin-top: 1.5rem;">Items</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Rate</th>
                                <th>Qty</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${this.app.formatCurrency(item.rate)}</td>
                                    <td>${item.quantity}</td>
                                    <td>${this.app.formatCurrency(item.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="invoice-totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${this.app.formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax (${invoice.items[0]?.taxRate || 18}%):</span>
                            <span>${this.app.formatCurrency(invoice.tax)}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total:</span>
                            <span>${this.app.formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                    
                    ${invoice.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">Notes:</span>
                            <span class="detail-value">${invoice.notes}</span>
                        </div>
                    ` : ''}
                </div>
            `,
            [
                { text: 'Print', class: 'btn-primary', id: 'printInvoice' },
                { text: 'Close', class: 'btn-secondary', id: 'closeInvoice' }
            ]
        );
        
        // Print button
        modal.querySelector('#printInvoice').addEventListener('click', () => {
            this.printInvoice(invoice);
        });
    }

    printInvoice(invoice) {
        // In a real app, this would open a print dialog with a nicely formatted invoice
        alert(`Printing invoice ${invoice.invoiceNo}`);
    }

    recordInvoicePayment(invoice) {
        const customer = this.app.accounting.ledgers.find(l => l.id === invoice.customerId);
        if (!customer) {
            alert('Customer not found');
            return;
        }
        
        const modal = this.app.showModal(
            `Record Payment for Invoice #${invoice.invoiceNo}`,
            `
                <form id="paymentForm">
                    <div class="form-group">
                        <label class="form-label">Customer</label>
                        <input type="text" class="form-control" value="${customer.name}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Invoice Amount</label>
                        <input type="text" class="form-control" value="${this.app.formatCurrency(invoice.total)}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Amount Received*</label>
                        <input type="number" class="form-control" id="paymentAmount" value="${invoice.total}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Payment Method</label>
                        <select class="form-control" id="paymentMethod">
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="upi">UPI</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Reference No.</label>
                        <input type="text" class="form-control" id="paymentReference">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="paymentNotes"></textarea>
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelPayment' },
                { text: 'Record Payment', class: 'btn-primary', id: 'savePayment' }
            ]
        );
        
        // Save payment
        modal.querySelector('#savePayment').addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const method = document.getElementById('paymentMethod').value;
            const reference = document.getElementById('paymentReference').value;
            const notes = document.getElementById('paymentNotes').value;
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            // Update invoice status
            invoice.paid = true;
            localStorage.setItem('invoices', JSON.stringify(this.invoices));
            
            // Update customer balance
            customer.balance += amount;
            customer.updatedAt = new Date().toISOString();
            this.app.accounting.saveData();
            
            // Add transaction
            this.app.accounting.transactions.push({
                id: this.app.accounting.generateId(),
                type: 'receipt',
                partyId: invoice.customerId,
                amount: amount,
                date: new Date().toISOString(),
                method,
                reference,
                notes,
                balance: customer.balance,
                invoiceId: invoice.id,
                createdAt: new Date().toISOString()
            });
            this.app.accounting.saveData();
            
            // Update UI
            this.loadInvoices();
            this.app.accounting.loadCustomers();
            this.app.accounting.loadTransactions();
            
            // Update dashboard
            this.app.updateDashboardSummary();
            
            modal.remove();
            this.app.showNotification('Payment recorded successfully', 'success');
        });
    }

    applyInvoiceFilters() {
        const status = document.getElementById('invoiceStatus').value;
        const dateFrom = document.getElementById('invoiceDateFrom').value;
        const dateTo = document.getElementById('invoiceDateTo').value;
        
        let filtered = this.invoices;
        
        // Filter by status
        if (status !== 'all') {
            filtered = filtered.filter(i => i.paid === (status === 'paid'));
        }
        
        // Filter by date range
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(i => new Date(i.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filtered = filtered.filter(i => new Date(i.date) <= toDate);
        }
        
        // Update table
        const tableBody = document.getElementById('invoicesTable');
        tableBody.innerHTML = filtered.map(invoice => `
            <tr>
                <td>${invoice.invoiceNo}</td>
                <td>${new Date(invoice.date).toLocaleDateString()}</td>
                <td>${this.getCustomerName(invoice.customerId)}</td>
                <td>${this.app.formatCurrency(invoice.total)}</td>
                <td>
                    <span class="badge ${invoice.paid ? 'badge-success' : 'badge-warning'}">
                        ${invoice.paid ? 'Paid' : 'Unpaid'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${invoice.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="print" data-id="${invoice.id}"><i class="fas fa-print"></i></button>
                    ${!invoice.paid ? `
                        <button class="btn-icon" data-action="payment" data-id="${invoice.id}"><i class="fas fa-rupee-sign"></i></button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    showTemplateForm(template = null) {
        const isEdit = template !== null;
        
        const modal = this.app.showModal(
            isEdit ? 'Edit Template' : 'Add New Template',
            `
                <form id="templateForm">
                    <div class="form-group">
                        <label class="form-label">Name*</label>
                        <input type="text" class="form-control" id="templateName" value="${isEdit ? template.name : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <select class="form-control" id="templateType">
                            <option value="invoice" ${isEdit && template.type === 'invoice' ? 'selected' : ''}>Invoice</option>
                            <option value="receipt" ${isEdit && template.type === 'receipt' ? 'selected' : ''}>Receipt</option>
                            <option value="a5" ${isEdit && template.type === 'a5' ? 'selected' : ''}>A5 Format</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Business Name</label>
                        <input type="text" class="form-control" id="templateBusiness" value="${isEdit ? template.businessName : ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Header Color</label>
                            <input type="color" class="form-control" id="templateHeaderColor" value="${isEdit ? template.headerColor : '#4361ee'}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Background Color</label>
                            <input type="color" class="form-control" id="templateBgColor" value="${isEdit ? template.bgColor : '#ffffff'}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Text Color</label>
                            <input type="color" class="form-control" id="templateTextColor" value="${isEdit ? template.textColor : '#000000'}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="templateShowLogo" ${isEdit && template.showLogo ? 'checked' : ''}>
                                Show Logo
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="templateShowTax" ${isEdit && template.showTaxDetails !== false ? 'checked' : ''}>
                                Show Tax Details
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Footer Text</label>
                        <textarea class="form-control" id="templateFooter">${isEdit ? template.footerText : ''}</textarea>
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelTemplate' },
                { text: isEdit ? 'Update' : 'Save', class: 'btn-primary', id: 'saveTemplate' }
            ]
        );
        
        // Save template
        modal.querySelector('#saveTemplate').addEventListener('click', () => {
            const templateData = {
                id: isEdit ? template.id : this.generateId(),
                name: document.getElementById('templateName').value,
                type: document.getElementById('templateType').value,
                businessName: document.getElementById('templateBusiness').value,
                headerColor: document.getElementById('templateHeaderColor').value,
                bgColor: document.getElementById('templateBgColor').value,
                textColor: document.getElementById('templateTextColor').value,
                showLogo: document.getElementById('templateShowLogo').checked,
                showTaxDetails: document.getElementById('templateShowTax').checked,
                footerText: document.getElementById('templateFooter').value,
                createdAt: isEdit ? template.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!templateData.name) {
                alert('Name is required');
                return;
            }
            
            if (isEdit) {
                const index = this.templates.findIndex(t => t.id === template.id);
                this.templates[index] = templateData;
            } else {
                this.templates.push(templateData);
            }
            
            localStorage.setItem('templates', JSON.stringify(this.templates));
            this.loadTemplates();
            modal.remove();
            
            this.app.showNotification(`Template ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        });
    }

    handleTemplateAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const templateId = actionBtn.dataset.id;
        const template = this.templates.find(t => t.id === templateId);
        
        switch(action) {
            case 'edit-template':
                this.showTemplateForm(template);
                break;
            case 'delete-template':
                if (confirm('Are you sure you want to delete this template?')) {
                    this.deleteTemplate(templateId);
                }
                break;
            case 'use-template':
                this.setDefaultTemplate(templateId);
                break;
        }
    }

    deleteTemplate(templateId) {
        this.templates = this.templates.filter(t => t.id !== templateId);
        localStorage.setItem('templates', JSON.stringify(this.templates));
        this.loadTemplates();
        
        this.app.showNotification('Template deleted successfully', 'success');
    }

    setDefaultTemplate(templateId) {
        // In a real app, this would set the template as default for new invoices
        alert(`Template ${templateId} set as default`);
    }

    getTodaysSales() {
        const today = new Date().toISOString().split('T')[0];
        return this.invoices
            .filter(i => i.date.split('T')[0] === today)
            .reduce((sum, i) => sum + i.total, 0);
    }

    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }
}