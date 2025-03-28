class BusinessManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize all modules
        this.initModules();
        this.initEventListeners();
        this.loadModule('dashboard'); // Load dashboard by default
        
        // Check for previous session
        this.checkSession();
    }

    initModules() {
        // Initialize all modules with the main app instance
        this.accounting = new AccountingModule(this);
        this.inventory = new InventoryModule(this);
        this.invoicing = new InvoicingModule(this);
        this.reporting = new ReportingModule(this);
        this.backup = new BackupModule(this);
        this.logs = new LogsModule(this);
        this.sync = new SyncModule(this);
        this.ai = new AIModule(this);
    }

    initEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.addEventListener('click', () => {
                this.loadModule(item.dataset.module);
                
                // Update active state
                document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Quick actions
        document.getElementById('newInvoice').addEventListener('click', () => this.invoicing.showNewInvoiceModal());
        document.getElementById('newPayment').addEventListener('click', () => this.accounting.showNewPaymentModal());
        document.getElementById('newItem').addEventListener('click', () => this.inventory.showNewItemModal());

        // Backup and sync buttons
        document.getElementById('backupNow').addEventListener('click', () => this.backup.manualBackup());
        document.getElementById('syncNow').addEventListener('click', () => this.sync.initiateSync());
    }

    loadModule(moduleName) {
        const moduleContainer = document.getElementById('moduleContainer');
        moduleContainer.innerHTML = '';
        
        const moduleContent = document.createElement('div');
        moduleContent.id = `${moduleName}-module`;
        moduleContent.className = 'module-content';
        
        switch(moduleName) {
            case 'dashboard':
                moduleContent.innerHTML = `
                    <div class="dashboard-module">
                        <div class="summary-cards">
                            <div class="card">
                                <h3>Today's Sales</h3>
                                <p class="value" id="todaySales">₹0.00</p>
                                <p class="change positive">+0% from yesterday</p>
                            </div>
                            <div class="card">
                                <h3>Inventory Alerts</h3>
                                <p class="value" id="stockAlerts">0</p>
                                <p class="change negative">Items low in stock</p>
                            </div>
                            <div class="card">
                                <h3>Pending Payments</h3>
                                <p class="value" id="pendingPayments">₹0.00</p>
                                <p class="change neutral">From 0 customers</p>
                            </div>
                        </div>

                        <div class="charts-section">
                            <div class="chart-container">
                                <canvas id="salesChart"></canvas>
                            </div>
                            <div class="chart-container">
                                <canvas id="inventoryChart"></canvas>
                            </div>
                        </div>

                        <div class="ai-suggestions">
                            <h3><i class="fas fa-lightbulb"></i> AI Suggestions</h3>
                            <div class="suggestion-list" id="aiSuggestions"></div>
                        </div>
                    </div>
                `;
                this.loadDashboard();
                break;
            case 'accounting':
                this.accounting.render(moduleContent);
                break;
            case 'inventory':
                this.inventory.render(moduleContent);
                break;
            case 'invoicing':
                this.invoicing.render(moduleContent);
                break;
            case 'reports':
                this.reporting.render(moduleContent);
                break;
            case 'backup':
                this.backup.render(moduleContent);
                break;
            case 'logs':
                this.logs.render(moduleContent);
                break;
            case 'settings':
                this.renderSettings(moduleContent);
                break;
        }
        
        moduleContainer.appendChild(moduleContent);
    }

    loadDashboard() {
        this.updateDashboardSummary();
        this.initDashboardCharts();
        this.ai.loadSuggestions();
    }

    updateDashboardSummary() {
        const todaySales = this.invoicing.getTodaysSales();
        document.getElementById('todaySales').textContent = `₹${todaySales.toFixed(2)}`;
        
        const lowStockItems = this.inventory.getLowStockItems().length;
        document.getElementById('stockAlerts').textContent = lowStockItems;
        
        const pendingPayments = this.accounting.getPendingPayments();
        document.getElementById('pendingPayments').textContent = `₹${pendingPayments.total.toFixed(2)}`;
        document.querySelector('.change.neutral').textContent = `From ${pendingPayments.count} customers`;
    }

    initDashboardCharts() {
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        const salesData = this.reporting.getSalesChartData();
        
        this.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Sales',
                    data: salesData.data,
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        const inventoryCtx = document.getElementById('inventoryChart').getContext('2d');
        const inventoryData = this.inventory.getInventoryChartData();
        
        this.inventoryChart = new Chart(inventoryCtx, {
            type: 'doughnut',
            data: {
                labels: inventoryData.labels,
                datasets: [{
                    data: inventoryData.data,
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(248, 150, 30, 0.7)',
                        'rgba(111, 66, 193, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    renderSettings(container) {
        container.innerHTML = `
            <div class="settings-module">
                <h2>System Settings</h2>
                
                <div class="tabs">
                    <div class="tab active" data-tab="general">General</div>
                    <div class="tab" data-tab="backup">Backup</div>
                    <div class="tab" data-tab="appearance">Appearance</div>
                </div>
                
                <div class="tab-content active" id="general-tab">
                    <form id="generalSettings">
                        <div class="form-group">
                            <label class="form-label">Business Name</label>
                            <input type="text" class="form-control" id="businessName" value="${localStorage.getItem('businessName') || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Currency</label>
                            <select class="form-control" id="currency">
                                <option value="₹" ${localStorage.getItem('currency') === '₹' ? 'selected' : ''}>Indian Rupee (₹)</option>
                                <option value="$" ${localStorage.getItem('currency') === '$' ? 'selected' : ''}>US Dollar ($)</option>
                                <option value="€" ${localStorage.getItem('currency') === '€' ? 'selected' : ''}>Euro (€)</option>
                                <option value="£" ${localStorage.getItem('currency') === '£' ? 'selected' : ''}>Pound (£)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tax Rate (%)</label>
                            <input type="number" class="form-control" id="taxRate" value="${localStorage.getItem('taxRate') || '18'}">
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Save Settings</button>
                    </form>
                </div>
                
                <div class="tab-content" id="backup-tab">
                    <div class="form-group">
                        <label class="form-label">Auto Backup Frequency</label>
                        <select class="form-control" id="backupFrequency">
                            <option value="15">Every 15 minutes</option>
                            <option value="30" selected>Every 30 minutes</option>
                            <option value="60">Every 1 hour</option>
                            <option value="120">Every 2 hours</option>
                            <option value="0">Disabled</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Backup Location</label>
                        <select class="form-control" id="backupLocation">
                            <option value="local" selected>Local Storage</option>
                            <option value="cloud">Cloud Sync</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" id="saveBackupSettings">Save Backup Settings</button>
                </div>
                
                <div class="tab-content" id="appearance-tab">
                    <div class="form-group">
                        <label class="form-label">Theme</label>
                        <select class="form-control" id="theme">
                            <option value="light" selected>Light</option>
                            <option value="dark">Dark</option>
                            <option value="blue">Blue</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Font Size</label>
                        <select class="form-control" id="fontSize">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" id="saveAppearanceSettings">Save Appearance Settings</button>
                </div>
            </div>
        `;
        
        // Tab switching
        container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // Form submission
        document.getElementById('generalSettings').addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('businessName', document.getElementById('businessName').value);
            localStorage.setItem('currency', document.getElementById('currency').value);
            localStorage.setItem('taxRate', document.getElementById('taxRate').value);
            
            this.showNotification('General settings saved successfully', 'success');
        });
        
        // Backup settings
        document.getElementById('saveBackupSettings').addEventListener('click', () => {
            localStorage.setItem('backupFrequency', document.getElementById('backupFrequency').value);
            localStorage.setItem('backupLocation', document.getElementById('backupLocation').value);
            
            this.showNotification('Backup settings saved successfully', 'success');
        });
        
        // Appearance settings
        document.getElementById('saveAppearanceSettings').addEventListener('click', () => {
            localStorage.setItem('theme', document.getElementById('theme').value);
            localStorage.setItem('fontSize', document.getElementById('fontSize').value);
            
            this.showNotification('Appearance settings saved successfully', 'success');
        });
    }

    checkSession() {
        const lastBackup = localStorage.getItem('lastBackup');
        if (lastBackup) {
            this.showNotification(`Last backup: ${new Date(parseInt(lastBackup)).toLocaleString()}`);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.textContent = message;
        
        const moduleContainer = document.getElementById('moduleContainer');
        moduleContainer.insertBefore(notification, moduleContainer.firstChild);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class || ''}" ${btn.id ? `id="${btn.id}"` : ''}>
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        return modal;
    }

    formatCurrency(amount) {
        const currency = localStorage.getItem('currency') || '₹';
        return `${currency}${parseFloat(amount || 0).toFixed(2)}`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BusinessManager();
    window.app = app; // Make app globally available for debugging
});