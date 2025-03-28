class AccountingModule {
    constructor(app) {
        this.app = app;
        this.ledgers = JSON.parse(localStorage.getItem('ledgers')) || [];
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    }

    render(container) {
        container.innerHTML = `
            <div class="accounting-module">
                <h2>Accounting Ledger</h2>
                
                <div class="tabs">
                    <div class="tab active" data-tab="customers">Customers</div>
                    <div class="tab" data-tab="suppliers">Suppliers</div>
                    <div class="tab" data-tab="transactions">Transactions</div>
                </div>
                
                <div class="tab-content active" id="customers-tab">
                    <div class="toolbar">
                        <button class="btn btn-primary" id="addCustomer"><i class="fas fa-plus"></i> Add Customer</button>
                        <div class="search-box">
                            <input type="text" placeholder="Search customers..." id="searchCustomers">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Credit Limit</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="customersTable">
                            <!-- Customers will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="tab-content" id="suppliers-tab">
                    <div class="toolbar">
                        <button class="btn btn-primary" id="addSupplier"><i class="fas fa-plus"></i> Add Supplier</button>
                        <div class="search-box">
                            <input type="text" placeholder="Search suppliers..." id="searchSuppliers">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Credit Terms</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="suppliersTable">
                            <!-- Suppliers will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="tab-content" id="transactions-tab">
                    <div class="toolbar">
                        <div class="filters">
                            <select id="transactionType">
                                <option value="all">All Transactions</option>
                                <option value="payment">Payments</option>
                                <option value="receipt">Receipts</option>
                                <option value="invoice">Invoices</option>
                                <option value="purchase">Purchases</option>
                            </select>
                            <input type="date" id="transactionDateFrom">
                            <input type="date" id="transactionDateTo">
                            <button class="btn btn-primary" id="applyFilters">Apply</button>
                        </div>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Party</th>
                                <th>Amount</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="transactionsTable">
                            <!-- Transactions will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Initialize tabs
        this.initTabs(container);
        
        // Load data
        this.loadCustomers();
        this.loadSuppliers();
        this.loadTransactions();
        
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

    loadCustomers() {
        const customers = this.ledgers.filter(ledger => ledger.type === 'customer');
        const tableBody = document.getElementById('customersTable');
        
        tableBody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone || ''}<br>${customer.email || ''}</td>
                <td>${this.app.formatCurrency(customer.creditLimit || 0)}</td>
                <td class="${customer.balance < 0 ? 'negative' : ''}">${this.app.formatCurrency(customer.balance || 0)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${customer.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${customer.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="payment" data-id="${customer.id}"><i class="fas fa-rupee-sign"></i></button>
                </td>
            </tr>
        `).join('');
    }

    loadSuppliers() {
        const suppliers = this.ledgers.filter(ledger => ledger.type === 'supplier');
        const tableBody = document.getElementById('suppliersTable');
        
        tableBody.innerHTML = suppliers.map(supplier => `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.phone || ''}<br>${supplier.email || ''}</td>
                <td>${supplier.creditTerms || 'COD'}</td>
                <td class="${supplier.balance > 0 ? 'negative' : ''}">${this.app.formatCurrency(supplier.balance || 0)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${supplier.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${supplier.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="payment" data-id="${supplier.id}"><i class="fas fa-rupee-sign"></i></button>
                </td>
            </tr>
        `).join('');
    }

    loadTransactions() {
        const tableBody = document.getElementById('transactionsTable');
        
        tableBody.innerHTML = this.transactions.map(transaction => `
            <tr>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td><span class="badge ${this.getTransactionBadgeClass(transaction)}">${transaction.type}</span></td>
                <td>${this.getPartyName(transaction.partyId)}</td>
                <td>${this.app.formatCurrency(transaction.amount)}</td>
                <td>${this.app.formatCurrency(transaction.balance)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${transaction.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="print" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                </td>
            </tr>
        `).join('');
    }

    getTransactionBadgeClass(transaction) {
        switch(transaction.type) {
            case 'payment': return 'badge-primary';
            case 'receipt': return 'badge-success';
            case 'invoice': return 'badge-warning';
            case 'purchase': return 'badge-danger';
            default: return 'badge-primary';
        }
    }

    getPartyName(partyId) {
        const party = this.ledgers.find(ledger => ledger.id === partyId);
        return party ? party.name : 'Unknown';
    }

    initEventListeners() {
        // Add customer button
        document.getElementById('addCustomer').addEventListener('click', () => this.showCustomerForm());
        
        // Add supplier button
        document.getElementById('addSupplier').addEventListener('click', () => this.showSupplierForm());
        
        // Table actions
        document.getElementById('customersTable').addEventListener('click', (e) => this.handleCustomerAction(e));
        document.getElementById('suppliersTable').addEventListener('click', (e) => this.handleSupplierAction(e));
        document.getElementById('transactionsTable').addEventListener('click', (e) => this.handleTransactionAction(e));
        
        // Search functionality
        document.getElementById('searchCustomers').addEventListener('input', (e) => this.searchCustomers(e.target.value));
        document.getElementById('searchSuppliers').addEventListener('input', (e) => this.searchSuppliers(e.target.value));
        
        // Transaction filters
        document.getElementById('applyFilters').addEventListener('click', () => this.applyTransactionFilters());
    }

    showCustomerForm(customer = null) {
        const isEdit = customer !== null;
        
        const modal = this.app.showModal(
            isEdit ? 'Edit Customer' : 'Add New Customer',
            `
                <form id="customerForm">
                    <div class="form-group">
                        <label class="form-label">Name*</label>
                        <input type="text" class="form-control" id="customerName" value="${isEdit ? customer.name : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-control" id="customerPhone" value="${isEdit ? customer.phone : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="customerEmail" value="${isEdit ? customer.email : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea class="form-control" id="customerAddress">${isEdit ? customer.address : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">GSTIN</label>
                        <input type="text" class="form-control" id="customerGst" value="${isEdit ? customer.gst : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Credit Limit (₹)</label>
                        <input type="number" class="form-control" id="customerCredit" value="${isEdit ? customer.creditLimit : '0'}">
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelCustomer' },
                { text: isEdit ? 'Update' : 'Save', class: 'btn-primary', id: 'saveCustomer' }
            ]
        );
        
        // Save customer
        modal.querySelector('#saveCustomer').addEventListener('click', () => {
            const customerData = {
                id: isEdit ? customer.id : this.generateId(),
                type: 'customer',
                name: document.getElementById('customerName').value,
                phone: document.getElementById('customerPhone').value,
                email: document.getElementById('customerEmail').value,
                address: document.getElementById('customerAddress').value,
                gst: document.getElementById('customerGst').value,
                creditLimit: parseFloat(document.getElementById('customerCredit').value) || 0,
                balance: isEdit ? customer.balance : 0,
                createdAt: isEdit ? customer.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!customerData.name) {
                alert('Name is required');
                return;
            }
            
            if (isEdit) {
                const index = this.ledgers.findIndex(c => c.id === customer.id);
                this.ledgers[index] = customerData;
            } else {
                this.ledgers.push(customerData);
            }
            
            this.saveData();
            this.loadCustomers();
            modal.remove();
            
            this.app.showNotification(`Customer ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        });
    }

    showSupplierForm(supplier = null) {
        const isEdit = supplier !== null;
        
        const modal = this.app.showModal(
            isEdit ? 'Edit Supplier' : 'Add New Supplier',
            `
                <form id="supplierForm">
                    <div class="form-group">
                        <label class="form-label">Name*</label>
                        <input type="text" class="form-control" id="supplierName" value="${isEdit ? supplier.name : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-control" id="supplierPhone" value="${isEdit ? supplier.phone : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="supplierEmail" value="${isEdit ? supplier.email : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea class="form-control" id="supplierAddress">${isEdit ? supplier.address : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">GSTIN</label>
                        <input type="text" class="form-control" id="supplierGst" value="${isEdit ? supplier.gst : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Credit Terms</label>
                        <input type="text" class="form-control" id="supplierTerms" value="${isEdit ? supplier.creditTerms : 'COD'}">
                    </div>
                </form>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelSupplier' },
                { text: isEdit ? 'Update' : 'Save', class: 'btn-primary', id: 'saveSupplier' }
            ]
        );
        
        // Save supplier
        modal.querySelector('#saveSupplier').addEventListener('click', () => {
            const supplierData = {
                id: isEdit ? supplier.id : this.generateId(),
                type: 'supplier',
                name: document.getElementById('supplierName').value,
                phone: document.getElementById('supplierPhone').value,
                email: document.getElementById('supplierEmail').value,
                address: document.getElementById('supplierAddress').value,
                gst: document.getElementById('supplierGst').value,
                creditTerms: document.getElementById('supplierTerms').value || 'COD',
                balance: isEdit ? supplier.balance : 0,
                createdAt: isEdit ? supplier.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!supplierData.name) {
                alert('Name is required');
                return;
            }
            
            if (isEdit) {
                const index = this.ledgers.findIndex(s => s.id === supplier.id);
                this.ledgers[index] = supplierData;
            } else {
                this.ledgers.push(supplierData);
            }
            
            this.saveData();
            this.loadSuppliers();
            modal.remove();
            
            this.app.showNotification(`Supplier ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        });
    }

    handleCustomerAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const customerId = actionBtn.dataset.id;
        const customer = this.ledgers.find(c => c.id === customerId);
        
        switch(action) {
            case 'view':
                this.showCustomerDetails(customer);
                break;
            case 'edit':
                this.showCustomerForm(customer);
                break;
            case 'payment':
                this.showNewPaymentModal(customer);
                break;
        }
    }

    handleSupplierAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const supplierId = actionBtn.dataset.id;
        const supplier = this.ledgers.find(s => s.id === supplierId);
        
        switch(action) {
            case 'view':
                this.showSupplierDetails(supplier);
                break;
            case 'edit':
                this.showSupplierForm(supplier);
                break;
            case 'payment':
                this.showNewPaymentModal(supplier);
                break;
        }
    }

    handleTransactionAction(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const transactionId = actionBtn.dataset.id;
        const transaction = this.transactions.find(t => t.id === transactionId);
        
        switch(action) {
            case 'view':
                this.showTransactionDetails(transaction);
                break;
            case 'print':
                this.printTransaction(transaction);
                break;
        }
    }

    showCustomerDetails(customer) {
        const modal = this.app.showModal(
            `Customer: ${customer.name}`,
            `
                <div class="customer-details">
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${customer.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${customer.email || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${customer.address || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">GSTIN:</span>
                        <span class="detail-value">${customer.gst || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Credit Limit:</span>
                        <span class="detail-value">${this.app.formatCurrency(customer.creditLimit)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Current Balance:</span>
                        <span class="detail-value ${customer.balance < 0 ? 'negative' : ''}">${this.app.formatCurrency(customer.balance)}</span>
                    </div>
                    
                    <h3 style="margin-top: 1.5rem;">Transaction History</h3>
                    <div class="transaction-history" id="customerTransactions">
                        <!-- Transactions will be loaded here -->
                    </div>
                </div>
            `,
            [
                { text: 'Close', class: 'btn-secondary', id: 'closeCustomerDetails' }
            ]
        );
        
        // Load customer transactions
        this.loadCustomerTransactions(customer.id, modal.querySelector('#customerTransactions'));
    }

    showSupplierDetails(supplier) {
        const modal = this.app.showModal(
            `Supplier: ${supplier.name}`,
            `
                <div class="supplier-details">
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${supplier.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${supplier.email || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${supplier.address || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">GSTIN:</span>
                        <span class="detail-value">${supplier.gst || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Credit Terms:</span>
                        <span class="detail-value">${supplier.creditTerms || 'COD'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Current Balance:</span>
                        <span class="detail-value ${supplier.balance > 0 ? 'negative' : ''}">${this.app.formatCurrency(supplier.balance)}</span>
                    </div>
                    
                    <h3 style="margin-top: 1.5rem;">Transaction History</h3>
                    <div class="transaction-history" id="supplierTransactions">
                        <!-- Transactions will be loaded here -->
                    </div>
                </div>
            `,
            [
                { text: 'Close', class: 'btn-secondary', id: 'closeSupplierDetails' }
            ]
        );
        
        // Load supplier transactions
        this.loadSupplierTransactions(supplier.id, modal.querySelector('#supplierTransactions'));
    }

    loadCustomerTransactions(customerId, container) {
        const transactions = this.transactions
            .filter(t => t.partyId === customerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (transactions.length === 0) {
            container.innerHTML = '<p>No transactions found</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td>${new Date(t.date).toLocaleDateString()}</td>
                            <td>${t.type}</td>
                            <td>${this.app.formatCurrency(t.amount)}</td>
                            <td>${this.app.formatCurrency(t.balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    loadSupplierTransactions(supplierId, container) {
        const transactions = this.transactions
            .filter(t => t.partyId === supplierId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (transactions.length === 0) {
            container.innerHTML = '<p>No transactions found</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td>${new Date(t.date).toLocaleDateString()}</td>
                            <td>${t.type}</td>
                            <td>${this.app.formatCurrency(t.amount)}</td>
                            <td>${this.app.formatCurrency(t.balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    showTransactionDetails(transaction) {
        const party = this.ledgers.find(l => l.id === transaction.partyId);
        const partyName = party ? party.name : 'Unknown';
        
        const modal = this.app.showModal(
            `Transaction Details`,
            `
                <div class="transaction-details">
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${new Date(transaction.date).toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${transaction.type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Party:</span>
                        <span class="detail-value">${partyName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">${this.app.formatCurrency(transaction.amount)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Balance:</span>
                        <span class="detail-value">${this.app.formatCurrency(transaction.balance)}</span>
                    </div>
                    
                    ${transaction.items ? `
                        <h3 style="margin-top: 1.5rem;">Items</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transaction.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>${this.app.formatCurrency(item.rate)}</td>
                                        <td>${this.app.formatCurrency(item.amount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}
                    
                    ${transaction.notes ? `
                        <div class="detail-row" style="margin-top: 1.5rem;">
                            <span class="detail-label">Notes:</span>
                            <span class="detail-value">${transaction.notes}</span>
                        </div>
                    ` : ''}
                </div>
            `,
            [
                { text: 'Print', class: 'btn-primary', id: 'printTransaction' },
                { text: 'Close', class: 'btn-secondary', id: 'closeTransactionDetails' }
            ]
        );
        
        // Print button
        modal.querySelector('#printTransaction').addEventListener('click', () => {
            this.printTransaction(transaction);
            modal.remove();
        });
    }

    printTransaction(transaction) {
        // In a real app, this would open a print dialog with a nicely formatted receipt
        alert(`Printing transaction ${transaction.id}`);
    }

    searchCustomers(query) {
        const filtered = this.ledgers
            .filter(ledger => ledger.type === 'customer' && 
                  ledger.name.toLowerCase().includes(query.toLowerCase()));
        
        const tableBody = document.getElementById('customersTable');
        tableBody.innerHTML = filtered.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone || ''}<br>${customer.email || ''}</td>
                <td>${this.app.formatCurrency(customer.creditLimit || 0)}</td>
                <td class="${customer.balance < 0 ? 'negative' : ''}">${this.app.formatCurrency(customer.balance || 0)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${customer.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${customer.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="payment" data-id="${customer.id}"><i class="fas fa-rupee-sign"></i></button>
                </td>
            </tr>
        `).join('');
    }

    searchSuppliers(query) {
        const filtered = this.ledgers
            .filter(ledger => ledger.type === 'supplier' && 
                  ledger.name.toLowerCase().includes(query.toLowerCase()));
        
        const tableBody = document.getElementById('suppliersTable');
        tableBody.innerHTML = filtered.map(supplier => `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.phone || ''}<br>${supplier.email || ''}</td>
                <td>${supplier.creditTerms || 'COD'}</td>
                <td class="${supplier.balance > 0 ? 'negative' : ''}">${this.app.formatCurrency(supplier.balance || 0)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${supplier.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${supplier.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="payment" data-id="${supplier.id}"><i class="fas fa-rupee-sign"></i></button>
                </td>
            </tr>
        `).join('');
    }

    applyTransactionFilters() {
        const type = document.getElementById('transactionType').value;
        const dateFrom = document.getElementById('transactionDateFrom').value;
        const dateTo = document.getElementById('transactionDateTo').value;
        
        let filtered = this.transactions;
        
        // Filter by type
        if (type !== 'all') {
            filtered = filtered.filter(t => t.type === type);
        }
        
        // Filter by date range
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(t => new Date(t.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filtered = filtered.filter(t => new Date(t.date) <= toDate);
        }
        
        // Update table
        const tableBody = document.getElementById('transactionsTable');
        tableBody.innerHTML = filtered.map(transaction => `
            <tr>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td><span class="badge ${this.getTransactionBadgeClass(transaction)}">${transaction.type}</span></td>
                <td>${this.getPartyName(transaction.partyId)}</td>
                <td>${this.app.formatCurrency(transaction.amount)}</td>
                <td>${this.app.formatCurrency(transaction.balance)}</td>
                <td>
                    <button class="btn-icon" data-action="view" data-id="${transaction.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="print" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                </td>
            </tr>
        `).join('');
    }

    showNewPaymentModal(party = null) {
        const isCustomer = party ? party.type === 'customer' : true;
        const title = isCustomer ? 'Receive Payment' : 'Make Payment';
        
        const modal = this.app.showModal(
            title,
            `
                <form id="paymentForm">
                    <div class="form-group">
                        <label class="form-label">${isCustomer ? 'Customer' : 'Supplier'}*</label>
                        <select class="form-control" id="paymentParty" ${party ? 'disabled' : ''}>
                            ${party ? `<option value="${party.id}">${party.name}</option>` : 
                               this.ledgers
                                   .filter(l => l.type === (isCustomer ? 'customer' : 'supplier'))
                                   .map(l => `<option value="${l.id}">${l.name}</option>`)
                                   .join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Amount (₹)*</label>
                        <input type="number" class="form-control" id="paymentAmount" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Date</label>
                        <input type="date" class="form-control" id="paymentDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Payment Method</label>
                        <select class="form-control" id="paymentMethod">
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="upi">UPI</option>
                            <option value="other">Other</option>
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
                { text: 'Save', class: 'btn-primary', id: 'savePayment' }
            ]
        );
        
        // Save payment
        modal.querySelector('#savePayment').addEventListener('click', () => {
            const partyId = party ? party.id : document.getElementById('paymentParty').value;
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const date = document.getElementById('paymentDate').value || new Date().toISOString();
            const method = document.getElementById('paymentMethod').value;
            const reference = document.getElementById('paymentReference').value;
            const notes = document.getElementById('paymentNotes').value;
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            // Find the party
            const partyRecord = this.ledgers.find(l => l.id === partyId);
            if (!partyRecord) {
                alert('Party not found');
                return;
            }
            
            // Create transaction
            const transaction = {
                id: this.generateId(),
                type: isCustomer ? 'receipt' : 'payment',
                partyId,
                amount,
                date,
                method,
                reference,
                notes,
                balance: isCustomer ? (partyRecord.balance - amount) : (partyRecord.balance + amount),
                createdAt: new Date().toISOString()
            };
            
            // Update party balance
            partyRecord.balance = transaction.balance;
            partyRecord.updatedAt = new Date().toISOString();
            
            // Save data
            this.transactions.push(transaction);
            this.saveData();
            
            // Update UI
            if (partyRecord.type === 'customer') {
                this.loadCustomers();
            } else {
                this.loadSuppliers();
            }
            this.loadTransactions();
            
            // Update dashboard
            this.app.updateDashboardSummary();
            
            modal.remove();
            this.app.showNotification('Payment recorded successfully', 'success');
        });
    }

    getPendingPayments() {
        const customers = this.ledgers.filter(l => l.type === 'customer' && l.balance < 0);
        const total = customers.reduce((sum, c) => sum + Math.abs(c.balance), 0);
        
        return {
            count: customers.length,
            total: total
        };
    }

    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    saveData() {
        localStorage.setItem('ledgers', JSON.stringify(this.ledgers));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }
}