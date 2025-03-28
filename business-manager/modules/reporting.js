class ReportingModule {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        container.innerHTML = `
            <div class="reporting-module">
                <h2>Reports & Analytics</h2>
                
                <div class="tabs">
                    <div class="tab active" data-tab="sales">Sales</div>
                    <div class="tab" data-tab="inventory">Inventory</div>
                    <div class="tab" data-tab="financial">Financial</div>
                    <div class="tab" data-tab="custom">Custom</div>
                </div>
                
                <div class="tab-content active" id="sales-tab">
                    <div class="report-filters">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Date From</label>
                                <input type="date" class="form-control" id="salesDateFrom">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date To</label>
                                <input type="date" class="form-control" id="salesDateTo">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Group By</label>
                                <select class="form-control" id="salesGroupBy">
                                    <option value="day">Day</option>
                                    <option value="week">Week</option>
                                    <option value="month">Month</option>
                                    <option value="year">Year</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" id="applySalesFilters">Apply</button>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <canvas id="salesReportChart"></canvas>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Invoices</th>
                                <th>Items Sold</th>
                                <th>Total Sales</th>
                                <th>Tax</th>
                                <th>Net</th>
                            </tr>
                        </thead>
                        <tbody id="salesReportTable">
                            <!-- Sales data will be loaded here -->
                        </tbody>
                    </table>
                    
                    <div class="report-actions">
                        <button class="btn btn-secondary" id="exportSalesCSV">Export CSV</button>
                        <button class="btn btn-secondary" id="exportSalesPDF">Export PDF</button>
                        <button class="btn btn-primary" id="printSalesReport">Print</button>
                    </div>
                </div>
                
                <div class="tab-content" id="inventory-tab">
                    <div class="report-filters">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select class="form-control" id="inventoryCategory">
                                    <option value="">All Categories</option>
                                    ${this.app.inventory.categories.map(c => `
                                        <option value="${c.id}">${c.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <button class="btn btn-primary" id="applyInventoryFilters">Apply</button>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <canvas id="inventoryReportChart"></canvas>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Rate</th>
                                <th>Value</th>
                                <th>Sales (30d)</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryReportTable">
                            <!-- Inventory data will be loaded here -->
                        </tbody>
                    </table>
                    
                    <div class="report-actions">
                        <button class="btn btn-secondary" id="exportInventoryCSV">Export CSV</button>
                        <button class="btn btn-secondary" id="exportInventoryPDF">Export PDF</button>
                        <button class="btn btn-primary" id="printInventoryReport">Print</button>
                    </div>
                </div>
                
                <div class="tab-content" id="financial-tab">
                    <div class="report-filters">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Date From</label>
                                <input type="date" class="form-control" id="financialDateFrom">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date To</label>
                                <input type="date" class="form-control" id="financialDateTo">
                            </div>
                            <button class="btn btn-primary" id="applyFinancialFilters">Apply</button>
                        </div>
                    </div>
                    
                    <div class="financial-summary">
                        <div class="summary-card">
                            <h3>Income</h3>
                            <p class="value" id="totalIncome">₹0.00</p>
                        </div>
                        <div class="summary-card">
                            <h3>Expenses</h3>
                            <p class="value" id="totalExpenses">₹0.00</p>
                        </div>
                        <div class="summary-card">
                            <h3>Profit</h3>
                            <p class="value" id="totalProfit">₹0.00</p>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <canvas id="financialReportChart"></canvas>
                    </div>
                    
                    <div class="report-actions">
                        <button class="btn btn-secondary" id="exportFinancialCSV">Export CSV</button>
                        <button class="btn btn-secondary" id="exportFinancialPDF">Export PDF</button>
                        <button class="btn btn-primary" id="printFinancialReport">Print</button>
                    </div>
                </div>
                
                <div class="tab-content" id="custom-tab">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Create and save custom reports based on your specific needs
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Report Type</label>
                        <select class="form-control" id="customReportType">
                            <option value="">-- Select Report Type --</option>
                            <option value="sales_by_customer">Sales by Customer</option>
                            <option value="sales_by_item">Sales by Item</option>
                            <option value="customer_balances">Customer Balances</option>
                            <option value="supplier_balances">Supplier Balances</option>
                            <option value="stock_movement">Stock Movement</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Date Range</label>
                        <div class="form-row">
                            <input type="date" class="form-control" id="customDateFrom">
                            <input type="date" class="form-control" id="customDateTo">
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" id="generateCustomReport">Generate Report</button>
                    
                    <div id="customReportResults" style="margin-top: 2rem;">
                        <!-- Custom report results will be shown here -->
                    </div>
                </div>
            </div>
        `;
        
        // Initialize tabs
        this.initTabs(container);
        
        // Load initial data
        this.loadSalesReport();
        this.loadInventoryReport();
        this.loadFinancialReport();
        
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
                
                // Initialize charts when tab is shown
                switch(tab.dataset.tab) {
                    case 'sales':
                        this.initSalesChart();
                        break;
                    case 'inventory':
                        this.initInventoryChart();
                        break;
                    case 'financial':
                        this.initFinancialChart();
                        break;
                }
            });
        });
    }

    initEventListeners() {
        // Sales report filters
        document.getElementById('applySalesFilters').addEventListener('click', () => this.loadSalesReport());
        
        // Inventory report filters
        document.getElementById('applyInventoryFilters').addEventListener('click', () => this.loadInventoryReport());
        
        // Financial report filters
        document.getElementById('applyFinancialFilters').addEventListener('click', () => this.loadFinancialReport());
        
        // Custom report
        document.getElementById('generateCustomReport').addEventListener('click', () => this.generateCustomReport());
        
        // Export buttons
        document.getElementById('exportSalesCSV').addEventListener('click', () => this.exportReport('sales', 'csv'));
        document.getElementById('exportSalesPDF').addEventListener('click', () => this.exportReport('sales', 'pdf'));
        document.getElementById('printSalesReport').addEventListener('click', () => this.printReport('sales'));
        
        document.getElementById('exportInventoryCSV').addEventListener('click', () => this.exportReport('inventory', 'csv'));
        document.getElementById('exportInventoryPDF').addEventListener('click', () => this.exportReport('inventory', 'pdf'));
        document.getElementById('printInventoryReport').addEventListener('click', () => this.printReport('inventory'));
        
        document.getElementById('exportFinancialCSV').addEventListener('click', () => this.exportReport('financial', 'csv'));
        document.getElementById('exportFinancialPDF').addEventListener('click', () => this.exportReport('financial', 'pdf'));
        document.getElementById('printFinancialReport').addEventListener('click', () => this.printReport('financial'));
    }

    loadSalesReport() {
        const dateFrom = document.getElementById('salesDateFrom').value;
        const dateTo = document.getElementById('salesDateTo').value;
        const groupBy = document.getElementById('salesGroupBy').value;
        
        // Filter invoices by date range
        let filteredInvoices = this.app.invoicing.invoices;
        
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredInvoices = filteredInvoices.filter(i => new Date(i.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredInvoices = filteredInvoices.filter(i => new Date(i.date) <= toDate);
        }
        
        // Group data
        const groupedData = this.groupSalesData(filteredInvoices, groupBy);
        
        // Update table
        this.updateSalesTable(groupedData);
        
        // Update chart
        this.initSalesChart(groupedData);
    }

    groupSalesData(invoices, groupBy) {
        const groups = {};
        
        invoices.forEach(invoice => {
            const date = new Date(invoice.date);
            let key;
            
            switch(groupBy) {
                case 'day':
                    key = date.toLocaleDateString();
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `Week of ${weekStart.toLocaleDateString()}`;
                    break;
                case 'month':
                    key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
            }
            
            if (!groups[key]) {
                groups[key] = {
                    period: key,
                    invoiceCount: 0,
                    itemCount: 0,
                    totalSales: 0,
                    totalTax: 0,
                    netSales: 0
                };
            }
            
            groups[key].invoiceCount += 1;
            groups[key].itemCount += invoice.items.reduce((sum, item) => sum + item.quantity, 0);
            groups[key].totalSales += invoice.total;
            groups[key].totalTax += invoice.tax;
            groups[key].netSales += invoice.subtotal;
        });
        
        return Object.values(groups);
    }

    updateSalesTable(data) {
        const tableBody = document.getElementById('salesReportTable');
        
        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No sales data found for the selected period</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = data.map(row => `
            <tr>
                <td>${row.period}</td>
                <td>${row.invoiceCount}</td>
                <td>${row.itemCount}</td>
                <td>${this.app.formatCurrency(row.totalSales)}</td>
                <td>${this.app.formatCurrency(row.totalTax)}</td>
                <td>${this.app.formatCurrency(row.netSales)}</td>
            </tr>
        `).join('');
    }

    initSalesChart(data = null) {
        const ctx = document.getElementById('salesReportChart').getContext('2d');
        
        // Destroy previous chart if exists
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        
        // If no data provided, create empty chart
        if (!data || data.length === 0) {
            this.salesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['No data'],
                    datasets: [{
                        label: 'Sales',
                        data: [0],
                        backgroundColor: 'rgba(67, 97, 238, 0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Sales Report'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            return;
        }
        
        // Create chart with data
        this.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(row => row.period),
                datasets: [
                    {
                        label: 'Net Sales',
                        data: data.map(row => row.netSales),
                        backgroundColor: 'rgba(67, 97, 238, 0.7)'
                    },
                    {
                        label: 'Tax',
                        data: data.map(row => row.totalTax),
                        backgroundColor: 'rgba(247, 37, 133, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sales Report'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    loadInventoryReport() {
        const categoryId = document.getElementById('inventoryCategory').value;
        
        // Filter items by category
        let filteredItems = this.app.inventory.items;
        
        if (categoryId) {
            filteredItems = filteredItems.filter(item => item.category === categoryId);
        }
        
        // Sort by stock value (descending)
        filteredItems.sort((a, b) => (b.stock * b.rate) - (a.stock * a.rate));
        
        // Update table
        this.updateInventoryTable(filteredItems);
        
        // Update chart
        this.initInventoryChart(filteredItems);
    }

    updateInventoryTable(items) {
        const tableBody = document.getElementById('inventoryReportTable');
        
        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No inventory items found</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = items.map(item => `
            <tr class="${item.stock <= item.reorderLevel ? 'low-stock' : ''}">
                <td>${item.name}</td>
                <td>${this.app.inventory.getCategoryName(item.category)}</td>
                <td>${item.stock} ${this.app.inventory.getUnitSymbol(item.unit)}</td>
                <td>${this.app.formatCurrency(item.rate)}</td>
                <td>${this.app.formatCurrency(item.stock * item.rate)}</td>
                <td>${this.getItemSalesCount(item.id)}</td>
            </tr>
        `).join('');
    }

    getItemSalesCount(itemId) {
        // Count how many times item appears in invoices in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return this.app.invoicing.invoices
            .filter(i => new Date(i.date) >= thirtyDaysAgo)
            .reduce((count, invoice) => {
                const itemInInvoice = invoice.items.find(i => i.id === itemId);
                return count + (itemInInvoice ? itemInInvoice.quantity : 0);
            }, 0);
    }

    initInventoryChart(items = null) {
        const ctx = document.getElementById('inventoryReportChart').getContext('2d');
        
        // Destroy previous chart if exists
        if (this.inventoryChart) {
            this.inventoryChart.destroy();
        }
        
        // If no items provided, create empty chart
        if (!items || items.length === 0) {
            this.inventoryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['No data'],
                    datasets: [{
                        label: 'Stock Value',
                        data: [0],
                        backgroundColor: 'rgba(67, 97, 238, 0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Inventory Value Report'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            return;
        }
        
        // Limit to top 10 items by value
        const topItems = items.slice(0, 10);
        
        this.inventoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topItems.map(item => item.name),
                datasets: [{
                    label: 'Stock Value',
                    data: topItems.map(item => item.stock * item.rate),
                    backgroundColor: 'rgba(67, 97, 238, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Top 10 Items by Stock Value'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    loadFinancialReport() {
        const dateFrom = document.getElementById('financialDateFrom').value;
        const dateTo = document.getElementById('financialDateTo').value;
        
        // Filter transactions by date range
        let filteredTransactions = this.app.accounting.transactions;
        
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= toDate);
        }
        
        // Calculate totals
        const income = filteredTransactions
            .filter(t => t.type === 'receipt')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = filteredTransactions
            .filter(t => t.type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const profit = income - expenses;
        
        // Update summary cards
        document.getElementById('totalIncome').textContent = this.app.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = this.app.formatCurrency(expenses);
        document.getElementById('totalProfit').textContent = this.app.formatCurrency(profit);
        
        // Update chart
        this.initFinancialChart(income, expenses, profit);
    }

    initFinancialChart(income = 0, expenses = 0, profit = 0) {
        const ctx = document.getElementById('financialReportChart').getContext('2d');
        
        // Destroy previous chart if exists
        if (this.financialChart) {
            this.financialChart.destroy();
        }
        
        this.financialChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses', 'Profit'],
                datasets: [{
                    data: [income, expenses, profit],
                    backgroundColor: [
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(67, 97, 238, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Financial Summary'
                    }
                }
            }
        });
    }

    generateCustomReport() {
        const reportType = document.getElementById('customReportType').value;
        const dateFrom = document.getElementById('customDateFrom').value;
        const dateTo = document.getElementById('customDateTo').value;
        
        if (!reportType) {
            alert('Please select a report type');
            return;
        }
        
        const resultsContainer = document.getElementById('customReportResults');
        resultsContainer.innerHTML = '<p>Generating report...</p>';
        
        // Simulate delay for processing
        setTimeout(() => {
            let reportHtml = '';
            
            switch(reportType) {
                case 'sales_by_customer':
                    reportHtml = this.generateSalesByCustomerReport(dateFrom, dateTo);
                    break;
                case 'sales_by_item':
                    reportHtml = this.generateSalesByItemReport(dateFrom, dateTo);
                    break;
                case 'customer_balances':
                    reportHtml = this.generateCustomerBalancesReport();
                    break;
                case 'supplier_balances':
                    reportHtml = this.generateSupplierBalancesReport();
                    break;
                case 'stock_movement':
                    reportHtml = this.generateStockMovementReport(dateFrom, dateTo);
                    break;
                default:
                    reportHtml = '<p>Report type not implemented</p>';
            }
            
            resultsContainer.innerHTML = reportHtml;
        }, 500);
    }

    generateSalesByCustomerReport(dateFrom, dateTo) {
        // Filter invoices by date range
        let filteredInvoices = this.app.invoicing.invoices;
        
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredInvoices = filteredInvoices.filter(i => new Date(i.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredInvoices = filteredInvoices.filter(i => new Date(i.date) <= toDate);
        }
        
        // Group by customer
        const customerSales = {};
        
        filteredInvoices.forEach(invoice => {
            const customerId = invoice.customerId || 'walk-in';
            const customerName = invoice.customerId ? 
                this.app.accounting.getPartyName(invoice.customerId) : 'Walk-in Customers';
            
            if (!customerSales[customerId]) {
                customerSales[customerId] = {
                    name: customerName,
                    invoiceCount: 0,
                    totalSales: 0
                };
            }
            
            customerSales[customerId].invoiceCount += 1;
            customerSales[customerId].totalSales += invoice.total;
        });
        
        // Convert to array and sort by total sales
        const salesArray = Object.values(customerSales);
        salesArray.sort((a, b) => b.totalSales - a.totalSales);
        
        if (salesArray.length === 0) {
            return '<p>No sales data found for the selected period</p>';
        }
        
        return `
            <h3>Sales by Customer</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Invoices</th>
                        <th>Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesArray.map(customer => `
                        <tr>
                            <td>${customer.name}</td>
                            <td>${customer.invoiceCount}</td>
                            <td>${this.app.formatCurrency(customer.totalSales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateSalesByItemReport(dateFrom, dateTo) {
        // Filter invoices by date range
        let filteredInvoices = this.app.invoicing.invoices;
        
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredInvoices = filteredInvoices.filter(i => new Date(i.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredInvoices = filteredInvoices.filter(i => new Date(i.date) <= toDate);
        }
        
        // Aggregate item sales
        const itemSales = {};
        
        filteredInvoices.forEach(invoice => {
            invoice.items.forEach(item => {
                if (!itemSales[item.id]) {
                    const inventoryItem = this.app.inventory.getItemById(item.id);
                    itemSales[item.id] = {
                        name: inventoryItem ? inventoryItem.name : item.name,
                        quantity: 0,
                        total: 0
                    };
                }
                
                itemSales[item.id].quantity += item.quantity;
                itemSales[item.id].total += item.amount;
            });
        });
        
        // Convert to array and sort by total sales
        const salesArray = Object.values(itemSales);
        salesArray.sort((a, b) => b.total - a.total);
        
        if (salesArray.length === 0) {
            return '<p>No sales data found for the selected period</p>';
        }
        
        return `
            <h3>Sales by Item</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity Sold</th>
                        <th>Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesArray.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${this.app.formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateCustomerBalancesReport() {
        const customers = this.app.accounting.ledgers
            .filter(l => l.type === 'customer')
            .map(c => ({
                name: c.name,
                balance: c.balance
            }))
            .sort((a, b) => a.balance - b.balance); // Sort by balance ascending (most negative first)
        
        if (customers.length === 0) {
            return '<p>No customer data found</p>';
        }
        
        return `
            <h3>Customer Balances</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(customer => `
                        <tr>
                            <td>${customer.name}</td>
                            <td class="${customer.balance < 0 ? 'negative' : ''}">${this.app.formatCurrency(customer.balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateSupplierBalancesReport() {
        const suppliers = this.app.accounting.ledgers
            .filter(l => l.type === 'supplier')
            .map(s => ({
                name: s.name,
                balance: s.balance
            }))
            .sort((a, b) => b.balance - a.balance); // Sort by balance descending (most positive first)
        
        if (suppliers.length === 0) {
            return '<p>No supplier data found</p>';
        }
        
        return `
            <h3>Supplier Balances</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Supplier</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${suppliers.map(supplier => `
                        <tr>
                            <td>${supplier.name}</td>
                            <td class="${supplier.balance > 0 ? 'negative' : ''}">${this.app.formatCurrency(supplier.balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateStockMovementReport(dateFrom, dateTo) {
        // In a real app, this would show stock movements (purchases, sales, adjustments)
        return `
            <h3>Stock Movement Report</h3>
            <p>This report would show stock movements (purchases, sales, adjustments) between ${dateFrom || 'start'} and ${dateTo || 'end'}</p>
            <p>Implementation would track inventory changes over time.</p>
        `;
    }

    exportReport(reportType, format) {
        // In a real app, this would export the report data
        alert(`Exporting ${reportType} report as ${format.toUpperCase()}`);
    }

    printReport(reportType) {
        // In a real app, this would print the report
        alert(`Printing ${reportType} report`);
    }

    getSalesChartData() {
        // Get sales data for the last 7 days
        const dates = [];
        const sales = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const daySales = this.app.invoicing.invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.toDateString() === date.toDateString();
                })
                .reduce((sum, inv) => sum + inv.total, 0);
            
            dates.push(dateStr);
            sales.push(daySales);
        }
        
        return {
            labels: dates,
            data: sales
        };
    }
}