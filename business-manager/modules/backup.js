class BackupModule {
    constructor(app) {
        this.app = app;
        this.backupInterval = null;
    }

    render(container) {
        container.innerHTML = `
            <div class="backup-module">
                <h2>Backup & Security</h2>
                
                <div class="backup-status">
                    <div class="status-card">
                        <h3>Last Backup</h3>
                        <p id="lastBackupTime">${localStorage.getItem('lastBackup') ? 
                            new Date(parseInt(localStorage.getItem('lastBackup'))).toLocaleString() : 
                            'Never'}</p>
                    </div>
                    
                    <div class="status-card">
                        <h3>Backup Frequency</h3>
                        <p id="backupFrequency">Every ${localStorage.getItem('backupFrequency') || '30'} minutes</p>
                    </div>
                    
                    <div class="status-card">
                        <h3>Data Size</h3>
                        <p id="dataSize">${this.getDataSize()} KB</p>
                    </div>
                </div>
                
                <div class="backup-actions">
                    <button class="btn btn-primary" id="backupNowBtn"><i class="fas fa-save"></i> Backup Now</button>
                    <button class="btn btn-secondary" id="restoreBackupBtn"><i class="fas fa-history"></i> Restore Backup</button>
                    <button class="btn btn-danger" id="exportDataBtn"><i class="fas fa-file-export"></i> Export All Data</button>
                </div>
                
                <div class="backup-settings">
                    <h3>Backup Settings</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Auto Backup Frequency</label>
                        <select class="form-control" id="backupFreqSetting">
                            <option value="15" ${localStorage.getItem('backupFrequency') === '15' ? 'selected' : ''}>Every 15 minutes</option>
                            <option value="30" ${!localStorage.getItem('backupFrequency') || localStorage.getItem('backupFrequency') === '30' ? 'selected' : ''}>Every 30 minutes</option>
                            <option value="60" ${localStorage.getItem('backupFrequency') === '60' ? 'selected' : ''}>Every 1 hour</option>
                            <option value="120" ${localStorage.getItem('backupFrequency') === '120' ? 'selected' : ''}>Every 2 hours</option>
                            <option value="0" ${localStorage.getItem('backupFrequency') === '0' ? 'selected' : ''}>Disabled</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Backup Location</label>
                        <select class="form-control" id="backupLocationSetting">
                            <option value="local" ${!localStorage.getItem('backupLocation') || localStorage.getItem('backupLocation') === 'local' ? 'selected' : ''}>Local Storage</option>
                            <option value="cloud" ${localStorage.getItem('backupLocation') === 'cloud' ? 'selected' : ''}>Cloud Sync</option>
                            <option value="both" ${localStorage.getItem('backupLocation') === 'both' ? 'selected' : ''}>Both</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" id="saveBackupSettings">Save Settings</button>
                </div>
                
                <div class="security-settings">
                    <h3>Security Settings</h3>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" id="enableEncryption" ${localStorage.getItem('dataEncrypted') === 'true' ? 'checked' : ''}>
                            Enable Data Encryption
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Change Password</label>
                        <input type="password" class="form-control" id="newPassword" placeholder="New password">
                    </div>
                    
                    <button class="btn btn-primary" id="saveSecuritySettings">Save Security Settings</button>
                </div>
            </div>
        `;
        
        // Setup auto backup if not already running
        this.setupAutoBackup();
        
        // Add event listeners
        document.getElementById('backupNowBtn').addEventListener('click', () => this.manualBackup());
        document.getElementById('restoreBackupBtn').addEventListener('click', () => this.showRestoreModal());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportAllData());
        document.getElementById('saveBackupSettings').addEventListener('click', () => this.saveBackupSettings());
        document.getElementById('saveSecuritySettings').addEventListener('click', () => this.saveSecuritySettings());
    }

    setupAutoBackup() {
        // Clear any existing interval
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }
        
        // Get backup frequency from settings (default 30 minutes)
        const frequency = parseInt(localStorage.getItem('backupFrequency')) || 30;
        
        // If frequency is 0, auto backup is disabled
        if (frequency === 0) {
            return;
        }
        
        // Set up new interval
        this.backupInterval = setInterval(() => {
            this.autoBackup();
        }, frequency * 60 * 1000);
    }

    autoBackup() {
        const backupData = this.getAllData();
        const timestamp = Date.now();
        
        // Save to local storage
        localStorage.setItem(`backup_${timestamp}`, JSON.stringify(backupData));
        localStorage.setItem('lastBackup', timestamp.toString());
        
        // Update UI
        if (document.getElementById('lastBackupTime')) {
            document.getElementById('lastBackupTime').textContent = new Date(timestamp).toLocaleString();
        }
        
        // In a real app, would also sync to cloud if enabled
        const location = localStorage.getItem('backupLocation') || 'local';
        if (location === 'cloud' || location === 'both') {
            this.syncToCloud(backupData);
        }
        
        this.app.showNotification(`Auto backup completed at ${new Date(timestamp).toLocaleTimeString()}`, 'success');
    }

    manualBackup() {
        this.autoBackup(); // For now, same as auto backup
        this.app.showNotification('Manual backup completed', 'success');
    }

    syncToCloud(backupData) {
        // In a real app, this would sync data to cloud storage
        console.log('Syncing data to cloud...', backupData);
    }

    showRestoreModal() {
        // Get all backups from local storage
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('backup_')) {
                const timestamp = parseInt(key.split('_')[1]);
                backups.push({
                    timestamp,
                    date: new Date(timestamp),
                    key
                });
            }
        }
        
        // Sort by date (newest first)
        backups.sort((a, b) => b.timestamp - a.timestamp);
        
        const modal = this.app.showModal(
            'Restore Backup',
            `
                <div class="restore-options">
                    ${backups.length === 0 ? `
                        <p>No backups found in local storage</p>
                    ` : `
                        <p>Select a backup to restore:</p>
                        <div class="backup-list" style="max-height: 300px; overflow-y: auto;">
                            ${backups.map(backup => `
                                <div class="backup-item">
                                    <label>
                                        <input type="radio" name="backupToRestore" value="${backup.key}">
                                        ${backup.date.toLocaleString()}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    `}
                    
                    <div class="form-group" style="margin-top: 1rem;">
                        <label class="form-label">Or upload backup file:</label>
                        <input type="file" class="form-control" id="backupFileUpload" accept=".json">
                    </div>
                </div>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelRestore' },
                { text: 'Restore', class: 'btn-primary', id: 'confirmRestore' }
            ]
        );
        
        // Restore button
        modal.querySelector('#confirmRestore').addEventListener('click', () => {
            const selectedBackup = modal.querySelector('input[name="backupToRestore"]:checked');
            const fileInput = modal.querySelector('#backupFileUpload');
            
            if (selectedBackup) {
                // Restore from local storage backup
                const backupData = JSON.parse(localStorage.getItem(selectedBackup.value));
                this.restoreData(backupData);
                modal.remove();
            } else if (fileInput.files.length > 0) {
                // Restore from uploaded file
                const file = fileInput.files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const backupData = JSON.parse(e.target.result);
                        this.restoreData(backupData);
                        modal.remove();
                    } catch (error) {
                        alert('Error parsing backup file: ' + error.message);
                    }
                };
                
                reader.readAsText(file);
            } else {
                alert('Please select a backup to restore or upload a backup file');
            }
        });
    }

    restoreData(backupData) {
        if (!backupData || typeof backupData !== 'object') {
            alert('Invalid backup data');
            return;
        }
        
        if (confirm('Are you sure you want to restore this backup? All current data will be replaced.')) {
            // Restore each module's data
            if (backupData.accounting) {
                localStorage.setItem('ledgers', JSON.stringify(backupData.accounting.ledgers));
                localStorage.setItem('transactions', JSON.stringify(backupData.accounting.transactions));
            }
            
            if (backupData.inventory) {
                localStorage.setItem('inventory', JSON.stringify(backupData.inventory.items));
                localStorage.setItem('categories', JSON.stringify(backupData.inventory.categories));
                localStorage.setItem('units', JSON.stringify(backupData.inventory.units));
            }
            
            if (backupData.invoicing) {
                localStorage.setItem('invoices', JSON.stringify(backupData.invoicing.invoices));
                localStorage.setItem('cart', JSON.stringify(backupData.invoicing.cart));
                localStorage.setItem('templates', JSON.stringify(backupData.invoicing.templates));
            }
            
            // Reload all modules
            this.app.initModules();
            
            // Update UI
            if (document.getElementById('lastBackupTime')) {
                document.getElementById('lastBackupTime').textContent = new Date().toLocaleString();
            }
            
            this.app.showNotification('Data restored successfully', 'success');
        }
    }

    exportAllData() {
        const data = this.getAllData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const a = document.createElement('a');
        a.href = URL.createObjectURL(dataBlob);
        a.download = `business_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.app.showNotification('All data exported successfully', 'success');
    }

    getAllData() {
        return {
            accounting: {
                ledgers: JSON.parse(localStorage.getItem('ledgers')) || [],
                transactions: JSON.parse(localStorage.getItem('transactions')) || []
            },
            inventory: {
                items: JSON.parse(localStorage.getItem('inventory')) || [],
                categories: JSON.parse(localStorage.getItem('categories')) || [],
                units: JSON.parse(localStorage.getItem('units')) || []
            },
            invoicing: {
                invoices: JSON.parse(localStorage.getItem('invoices')) || [],
                cart: JSON.parse(localStorage.getItem('cart')) || [],
                templates: JSON.parse(localStorage.getItem('templates')) || []
            },
            settings: {
                businessName: localStorage.getItem('businessName'),
                currency: localStorage.getItem('currency'),
                taxRate: localStorage.getItem('taxRate'),
                backupFrequency: localStorage.getItem('backupFrequency'),
                backupLocation: localStorage.getItem('backupLocation'),
                dataEncrypted: localStorage.getItem('dataEncrypted') === 'true'
            },
            meta: {
                exportedAt: new Date().toISOString(),
                version: '1.0'
            }
        };
    }

    saveBackupSettings() {
        const frequency = document.getElementById('backupFreqSetting').value;
        const location = document.getElementById('backupLocationSetting').value;
        
        localStorage.setItem('backupFrequency', frequency);
        localStorage.setItem('backupLocation', location);
        
        // Update UI
        document.getElementById('backupFrequency').textContent = frequency === '0' ? 
            'Disabled' : `Every ${frequency} minutes`;
        
        // Restart auto backup with new frequency
        this.setupAutoBackup();
        
        this.app.showNotification('Backup settings saved', 'success');
    }

    saveSecuritySettings() {
        const encryptData = document.getElementById('enableEncryption').checked;
        const newPassword = document.getElementById('newPassword').value;
        
        localStorage.setItem('dataEncrypted', encryptData.toString());
        
        if (newPassword) {
            // In a real app, would properly hash and store password
            localStorage.setItem('appPassword', newPassword);
            document.getElementById('newPassword').value = '';
        }
        
        this.app.showNotification('Security settings saved', 'success');
    }

    getDataSize() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            total += key.length + value.length;
        }
        return (total / 1024).toFixed(2); // Size in KB
    }
}