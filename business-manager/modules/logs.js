class LogsModule {
    constructor(app) {
        this.app = app;
        this.logs = JSON.parse(localStorage.getItem('auditLogs')) || [];
    }

    render(container) {
        container.innerHTML = `
            <div class="logs-module">
                <h2>Audit Logs</h2>
                
                <div class="toolbar">
                    <div class="filters">
                        <select id="logTypeFilter">
                            <option value="all">All Activities</option>
                            <option value="create">Created</option>
                            <option value="update">Updated</option>
                            <option value="delete">Deleted</option>
                            <option value="system">System</option>
                        </select>
                        <input type="date" id="logDateFrom">
                        <input type="date" id="logDateTo">
                        <button class="btn btn-primary" id="applyLogFilters">Apply</button>
                        <button class="btn btn-danger" id="clearLogs">Clear Logs</button>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody id="logsTable">
                        <!-- Logs will be loaded here -->
                    </tbody>
                </table>
            </div>
        `;
        
        // Load logs
        this.loadLogs();
        
        // Add event listeners
        document.getElementById('applyLogFilters').addEventListener('click', () => this.loadLogs());
        document.getElementById('clearLogs').addEventListener('click', () => this.clearLogs());
    }

    loadLogs() {
        const typeFilter = document.getElementById('logTypeFilter').value;
        const dateFrom = document.getElementById('logDateFrom').value;
        const dateTo = document.getElementById('logDateTo').value;
        
        let filteredLogs = this.logs;
        
        // Filter by type
        if (typeFilter !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.actionType === typeFilter);
        }
        
        // Filter by date range
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
        }
        
        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Update table
        const tableBody = document.getElementById('logsTable');
        tableBody.innerHTML = filteredLogs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><span class="badge ${this.getLogBadgeClass(log)}">${log.actionType}</span></td>
                <td>${log.user || 'System'}</td>
                <td>${log.details}</td>
            </tr>
        `).join('');
    }

    getLogBadgeClass(log) {
        switch(log.actionType) {
            case 'create': return 'badge-success';
            case 'update': return 'badge-primary';
            case 'delete': return 'badge-danger';
            case 'system': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    clearLogs() {
        if (confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
            this.logs = [];
            localStorage.setItem('auditLogs', JSON.stringify(this.logs));
            this.loadLogs();
            this.app.showNotification('Audit logs cleared', 'success');
        }
    }

    addLog(actionType, details, user = null) {
        const log = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            actionType,
            details,
            user: user || 'Admin'
        };
        
        this.logs.push(log);
        localStorage.setItem('auditLogs', JSON.stringify(this.logs));
        
        // Update UI if on logs page
        if (document.getElementById('logsTable')) {
            this.loadLogs();
        }
    }

    generateId() {
        return 'log_' + Math.random().toString(36).substr(2, 9);
    }
}