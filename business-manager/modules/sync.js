class SyncModule {
    constructor(app) {
        this.app = app;
        this.syncStatus = 'idle'; // 'idle', 'syncing', 'error'
    }

    render(container) {
        container.innerHTML = `
            <div class="sync-module">
                <h2>Data Sync</h2>
                
                <div class="sync-status">
                    <div class="status-card">
                        <h3>Last Sync</h3>
                        <p id="lastSyncTime">${localStorage.getItem('lastSync') ? 
                            new Date(parseInt(localStorage.getItem('lastSync'))).toLocaleString() : 
                            'Never'}</p>
                    </div>
                    
                    <div class="status-card">
                        <h3>Sync Status</h3>
                        <p id="currentSyncStatus">
                            <span class="status-indicator ${this.syncStatus}"></span>
                            ${this.syncStatus.charAt(0).toUpperCase() + this.syncStatus.slice(1)}
                        </p>
                    </div>
                    
                    <div class="status-card">
                        <h3>Cloud Storage</h3>
                        <p id="cloudStorageStatus">${localStorage.getItem('cloudEnabled') === 'true' ? 'Connected' : 'Not connected'}</p>
                    </div>
                </div>
                
                <div class="sync-actions">
                    <button class="btn btn-primary" id="syncNowBtn"><i class="fas fa-sync-alt"></i> Sync Now</button>
                    <button class="btn btn-secondary" id="setupCloudBtn"><i class="fas fa-cloud"></i> Setup Cloud Sync</button>
                    <button class="btn btn-secondary" id="usbSyncBtn"><i class="fas fa-usb"></i> USB Sync</button>
                    <button class="btn btn-secondary" id="bluetoothSyncBtn"><i class="fas fa-bluetooth"></i> Bluetooth Sync</button>
                </div>
                
                <div class="sync-devices" id="pairedDevices">
                    <h3>Paired Devices</h3>
                    <div class="device-list">
                        <!-- Paired devices will be shown here -->
                    </div>
                </div>
            </div>
        `;
        
        // Load paired devices
        this.loadPairedDevices();
        
        // Add event listeners
        document.getElementById('syncNowBtn').addEventListener('click', () => this.initiateSync());
        document.getElementById('setupCloudBtn').addEventListener('click', () => this.setupCloudSync());
        document.getElementById('usbSyncBtn').addEventListener('click', () => this.initiateUSBSync());
        document.getElementById('bluetoothSyncBtn').addEventListener('click', () => this.initiateBluetoothSync());
    }

    initiateSync() {
        this.setSyncStatus('syncing');
        
        // Simulate sync process
        setTimeout(() => {
            const timestamp = Date.now();
            localStorage.setItem('lastSync', timestamp.toString());
            
            if (document.getElementById('lastSyncTime')) {
                document.getElementById('lastSyncTime').textContent = new Date(timestamp).toLocaleString();
            }
            
            this.setSyncStatus('idle');
            this.app.showNotification('Data sync completed', 'success');
        }, 2000);
    }

    setSyncStatus(status) {
        this.syncStatus = status;
        
        if (document.getElementById('currentSyncStatus')) {
            const indicator = document.querySelector('#currentSyncStatus .status-indicator');
            const text = document.querySelector('#currentSyncStatus');
            
            indicator.className = 'status-indicator ' + status;
            text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
    }

    setupCloudSync() {
        const modal = this.app.showModal(
            'Setup Cloud Sync',
            `
                <div class="form-group">
                    <label class="form-label">Cloud Service</label>
                    <select class="form-control" id="cloudService">
                        <option value="google">Google Drive</option>
                        <option value="dropbox">Dropbox</option>
                        <option value="onedrive">OneDrive</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="cloudEmail">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" id="cloudPassword">
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="autoSync"> Enable Auto Sync
                    </label>
                </div>
            `,
            [
                { text: 'Cancel', class: 'btn-secondary', id: 'cancelCloudSetup' },
                { text: 'Connect', class: 'btn-primary', id: 'connectCloud' }
            ]
        );
        
        // Connect button
        modal.querySelector('#connectCloud').addEventListener('click', () => {
            const service = document.getElementById('cloudService').value;
            const email = document.getElementById('cloudEmail').value;
            const password = document.getElementById('cloudPassword').value;
            const autoSync = document.getElementById('autoSync').checked;
            
            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }
            
            // In a real app, would authenticate with cloud service
            localStorage.setItem('cloudEnabled', 'true');
            localStorage.setItem('cloudService', service);
            localStorage.setItem('cloudAutoSync', autoSync.toString());
            
            if (document.getElementById('cloudStorageStatus')) {
                document.getElementById('cloudStorageStatus').textContent = 'Connected';
            }
            
            modal.remove();
            this.app.showNotification('Cloud sync setup successfully', 'success');
        });
    }

    initiateUSBSync() {
        // In a real app, would detect USB devices and sync data
        alert('USB sync would be implemented here');
    }

    initiateBluetoothSync() {
        // In a real app, would detect Bluetooth devices and sync data
        alert('Bluetooth sync would be implemented here');
    }

    loadPairedDevices() {
        const devices = JSON.parse(localStorage.getItem('pairedDevices')) || [];
        const container = document.querySelector('#pairedDevices .device-list');
        
        if (devices.length === 0) {
            container.innerHTML = '<p>No devices paired</p>';
            return;
        }
        
        container.innerHTML = devices.map(device => `
            <div class="device-item">
                <div class="device-info">
                    <i class="fas ${device.type === 'usb' ? 'fa-usb' : 'fa-bluetooth'}"></i>
                    <span>${device.name} (${device.lastSync ? 
                        `Last sync: ${new Date(device.lastSync).toLocaleString()}` : 
                        'Never synced'})</span>
                </div>
                <div class="device-actions">
                    <button class="btn-icon" data-action="sync" data-id="${device.id}"><i class="fas fa-sync-alt"></i></button>
                    <button class="btn-icon" data-action="remove" data-id="${device.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for device actions
        container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            
            const action = actionBtn.dataset.action;
            const deviceId = actionBtn.dataset.id;
            const device = devices.find(d => d.id === deviceId);
            
            switch(action) {
                case 'sync':
                    this.syncWithDevice(device);
                    break;
                case 'remove':
                    this.removeDevice(deviceId);
                    break;
            }
        });
    }

    syncWithDevice(device) {
        // In a real app, would sync data with the specific device
        alert(`Syncing with ${device.name} (${device.type})`);
        
        // Update last sync time
        device.lastSync = new Date().toISOString();
        localStorage.setItem('pairedDevices', JSON.stringify(
            JSON.parse(localStorage.getItem('pairedDevices')).map(d => 
                d.id === device.id ? device : d
            )
        ));
        
        this.loadPairedDevices();
    }

    removeDevice(deviceId) {
        if (confirm('Are you sure you want to remove this device?')) {
            const updatedDevices = JSON.parse(localStorage.getItem('pairedDevices'))
                .filter(d => d.id !== deviceId);
            
            localStorage.setItem('pairedDevices', JSON.stringify(updatedDevices));
            this.loadPairedDevices();
            
            this.app.showNotification('Device removed', 'success');
        }
    }
}