class AIModule {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        // This module doesn't have its own view, it enhances other modules
    }

    loadSuggestions() {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;
        
        // Clear previous suggestions
        container.innerHTML = '';
        
        // Generate suggestions based on business data
        const suggestions = this.generateSuggestions();
        
        // Add to container
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <i class="fas ${suggestion.icon}"></i>
                <span>${suggestion.text}</span>
            `;
            container.appendChild(div);
        });
    }

    generateSuggestions() {
        const suggestions = [];
        
        // 1. Check for low stock items
        const lowStockItems = this.app.inventory.getLowStockItems();
        if (lowStockItems.length > 0) {
            suggestions.push({
                text: `You have ${lowStockItems.length} items low in stock. Consider reordering.`,
                icon: 'fa-boxes'
            });
        }
        
        // 2. Check for pending payments
        const pendingPayments = this.app.accounting.getPendingPayments();
        if (pendingPayments.total > 0) {
            suggestions.push({
                text: `₹${pendingPayments.total.toFixed(2)} pending from ${pendingPayments.count} customers. Follow up for payments.`,
                icon: 'fa-rupee-sign'
            });
        }
        
        // 3. Check for today's sales vs yesterday
        const todaySales = this.app.invoicing.getTodaysSales();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdaySales = this.app.invoicing.invoices
            .filter(inv => new Date(inv.date).toDateString() === yesterday.toDateString())
            .reduce((sum, inv) => sum + inv.total, 0);
        
        const salesChange = yesterdaySales > 0 ? 
            ((todaySales - yesterdaySales) / yesterdaySales * 100) : 0;
        
        suggestions.push({
            text: `Today's sales: ₹${todaySales.toFixed(2)} (${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}% from yesterday)`,
            icon: salesChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'
        });
        
        // 4. Top selling item suggestion
        const itemsWithSales = this.app.inventory.items.map(item => {
            const salesCount = this.app.invoicing.invoices
                .filter(inv => new Date(inv.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
                .reduce((count, invoice) => {
                    const itemInInvoice = invoice.items.find(i => i.id === item.id);
                    return count + (itemInInvoice ? itemInInvoice.quantity : 0);
                }, 0);
            
            return {
                ...item,
                salesCount
            };
        });
        
        itemsWithSales.sort((a, b) => b.salesCount - a.salesCount);
        const topItem = itemsWithSales[0];
        
        if (topItem && topItem.salesCount > 0) {
            suggestions.push({
                text: `Top seller: ${topItem.name} (${topItem.salesCount} sold in last 30 days)`,
                icon: 'fa-star'
            });
        }
        
        // 5. Slow moving items
        const slowMovingItems = itemsWithSales
            .filter(item => item.salesCount === 0 && item.stock > 0)
            .slice(0, 5); // Limit to top 5
        
        if (slowMovingItems.length > 0) {
            suggestions.push({
                text: `Slow moving items: ${slowMovingItems.map(i => i.name).join(', ')}`,
                icon: 'fa-exclamation-triangle'
            });
        }
        
        return suggestions;
    }

    predictSalesTrend() {
        // In a real app, would use historical data to predict future sales
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const daySales = this.app.invoicing.invoices
                .filter(inv => inv.date.split('T')[0] === dateStr)
                .reduce((sum, inv) => sum + inv.total, 0);
            
            last7Days.push(daySales);
        }
        
        // Simple average prediction
        const average = last7Days.reduce((sum, val) => sum + val, 0) / last7Days.length;
        return average;
    }

    suggestReorderItems() {
        const items = this.app.inventory.items;
        const suggestions = [];
        
        items.forEach(item => {
            if (item.stock <= item.reorderLevel) {
                suggestions.push({
                    item: item.name,
                    currentStock: item.stock,
                    reorderLevel: item.reorderLevel,
                    suggestedOrder: Math.max(item.reorderLevel * 2 - item.stock, 10) // At least 10
                });
            }
        });
        
        return suggestions;
    }

    analyzeCustomerBehavior() {
        const customers = this.app.accounting.ledgers
            .filter(l => l.type === 'customer')
            .map(customer => {
                const customerInvoices = this.app.invoicing.invoices
                    .filter(inv => inv.customerId === customer.id);
                
                const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
                const invoiceCount = customerInvoices.length;
                const avgOrderValue = invoiceCount > 0 ? totalSpent / invoiceCount : 0;
                
                return {
                    ...customer,
                    totalSpent,
                    invoiceCount,
                    avgOrderValue
                };
            });
        
        // Sort by total spent
        customers.sort((a, b) => b.totalSpent - a.totalSpent);
        
        return {
            topCustomers: customers.slice(0, 5),
            averageOrderValue: customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / Math.max(1, customers.length)
        };
    }
}