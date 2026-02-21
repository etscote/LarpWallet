// Wallet management and UI controller
const WalletApp = {
  currencies: [
    { id: 'sol', name: 'Solana', symbol: 'SOL', logo: '/images/solana.avif', color: '#ab9ff2' },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', logo: '/images/btc.avif', color: '#f7931a' },
    { id: 'usdt', name: 'Tether', symbol: 'USDT', logo: '/images/usdt.avif', color: '#26a17b' },
    { id: 'xrp', name: 'XRP', symbol: 'XRP', logo: '/images/xrp.avif', color: '#23292f' },
    { id: 'pol', name: 'Polygon', symbol: 'POL', logo: '/images/pol.svg', color: '#8247e5' },
    { id: 'usdc', name: 'USD Coin', symbol: 'USDC', logo: '/images/usdc.avif', color: '#2775ca' }
  ],

  // Pull to refresh variables
  startY: 0,
  currentY: 0,
  isDragging: false,
  isRefreshing: false,
  lastPrices: {}, // Cache prices to prevent reset

  init() {
    this.loadStoredData();
    this.setupEventListeners();
    this.setupPullToRefresh();
    this.updateMainDisplay();
  },

  loadStoredData() {
    const stored = localStorage.getItem('walletData');
    if (stored) {
      this.walletData = JSON.parse(stored);
      // Ensure emoji exists for old data
      if (!this.walletData.emoji) {
        this.walletData.emoji = '💎';
      }
    } else {
      this.walletData = {
        username: '@username',
        accountName: 'account name',
        emoji: '💎',
        balances: {
          sol: 643.22523
        }
      };
    }
    
    // Update emoji on page
    const emojiEl = document.getElementById('profileEmoji');
    if (emojiEl) {
      emojiEl.textContent = this.walletData.emoji;
    }
  },

  saveData() {
    localStorage.setItem('walletData', JSON.stringify(this.walletData));
  },

  setupEventListeners() {
    // Open settings page
    const buyBtn = document.getElementById('openSettings');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => this.openSettings());
    }

    // Close settings
    const closeBtn = document.getElementById('closeSettings');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSettings());
    }

    // Save settings
    const saveBtn = document.getElementById('saveSettings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }
  },

  setupPullToRefresh() {
    const contentWrapper = document.getElementById('content-wrapper');
    const spinner = document.querySelector('.spinner.center');
    
    if (!contentWrapper || !spinner) return;

    // Touch start
    contentWrapper.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0 && !this.isRefreshing) {
        this.startY = e.touches[0].pageY;
        this.isDragging = true;
      }
    }, { passive: true });

    // Touch move
    contentWrapper.addEventListener('touchmove', (e) => {
      if (!this.isDragging || this.isRefreshing) return;

      this.currentY = e.touches[0].pageY;
      const pullDistance = this.currentY - this.startY;

      if (pullDistance > 0 && window.scrollY === 0) {
        // Pull down detected
        const translateY = Math.min(pullDistance * 0.5, 80); // Max 80px pull
        contentWrapper.style.transform = `translateY(${translateY}px)`;
        
        // Show spinner based on pull distance
        if (pullDistance > 60) {
          spinner.style.opacity = '1';
        } else {
          spinner.style.opacity = pullDistance / 60;
        }
      }
    }, { passive: true });

    // Touch end
    contentWrapper.addEventListener('touchend', async (e) => {
      if (!this.isDragging) return;

      const pullDistance = this.currentY - this.startY;

      if (pullDistance > 60 && !this.isRefreshing) {
        // Trigger refresh
        this.isRefreshing = true;
        
        // Hold at refresh position for 1 second
        contentWrapper.style.transition = 'transform 0.3s ease';
        contentWrapper.style.transform = 'translateY(60px)';
        spinner.style.opacity = '1';

        // Wait 1 second with spinner showing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Snap back
        contentWrapper.style.transform = 'translateY(0)';
        spinner.style.opacity = '0';

        // Update display after animation
        setTimeout(async () => {
          await this.updateMainDisplay(true); // Force fetch new prices
          this.isRefreshing = false;
          contentWrapper.style.transition = '';
        }, 300);

      } else {
        // Snap back without refresh
        contentWrapper.style.transition = 'transform 0.3s ease';
        contentWrapper.style.transform = 'translateY(0)';
        spinner.style.opacity = '0';
        
        setTimeout(() => {
          contentWrapper.style.transition = '';
        }, 300);
      }

      this.isDragging = false;
      this.startY = 0;
      this.currentY = 0;
    }, { passive: true });
  },

  openSettings() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'block';
    
    // Populate current values
    document.getElementById('settingsEmoji').value = this.walletData.emoji || '💎';
    document.getElementById('settingsUsername').value = this.walletData.username.replace('@', '');
    document.getElementById('settingsAccountName').value = this.walletData.accountName;
    
    // Populate currency amounts
    this.currencies.forEach(currency => {
      const input = document.getElementById(`amount-${currency.id}`);
      if (input) {
        input.value = this.walletData.balances[currency.id] || 0;
      }
    });
  },

  closeSettings() {
    document.getElementById('settingsPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
  },

  async saveSettings() {
    // Get updated values
    const newEmoji = document.getElementById('settingsEmoji').value.trim();
    const newUsername = document.getElementById('settingsUsername').value.trim();
    const newAccountName = document.getElementById('settingsAccountName').value.trim();
    
    if (newEmoji) {
      this.walletData.emoji = newEmoji;
    }
    if (newUsername) {
      this.walletData.username = newUsername.startsWith('@') ? newUsername : `@${newUsername}`;
    }
    if (newAccountName) {
      this.walletData.accountName = newAccountName;
    }

    // Get currency amounts
    const newBalances = {};
    this.currencies.forEach(currency => {
      const input = document.getElementById(`amount-${currency.id}`);
      const value = parseFloat(input.value) || 0;
      if (value > 0) {
        newBalances[currency.id] = value;
      }
    });

    // Save data
    this.walletData.balances = newBalances;
    this.saveData();

    // Update display elements
    document.getElementById('profileEmoji').textContent = this.walletData.emoji;
    document.getElementById('username').textContent = this.walletData.username;
    document.getElementById('accountName').textContent = this.walletData.accountName;

    // Close settings immediately
    this.closeSettings();
    
    // Wait 3 seconds before updating the display
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update display with new prices
    await this.updateMainDisplay(true); // Force fetch new prices
  },

  async updateMainDisplay(forceFetch = false) {
    const container = document.querySelector('.ReactVirtualized__Grid__innerScrollContainer');
    if (!container) return;

    // Fetch prices for all currencies (or use cached if not forcing)
    const prices = await this.fetchPrices(forceFetch);
    
    container.innerHTML = '';
    
    let totalValue = 0;
    let totalChange = 0;
    
    let index = 0;
    for (const [currencyId, balance] of Object.entries(this.walletData.balances)) {
      const currency = this.currencies.find(c => c.id === currencyId);
      if (!currency) continue;

      const price = prices[currencyId] || { usd: 0, usd_24h_change: 0 };
      const value = balance * price.usd;
      const change = value * (price.usd_24h_change / 100);
      
      totalValue += value;
      totalChange += change;

      const tokenRow = this.createTokenRow(currency, balance, price, index);
      container.appendChild(tokenRow);
      index++;
    }

    // Update container height
    const height = index * 84;
    container.style.height = `${height}px`;
    container.style.maxHeight = `${height}px`;
    
    // Update main portfolio display
    this.updatePortfolioDisplay(totalValue, totalChange);
  },

  async fetchPrices(forceFetch = false) {
    // Return cached prices if available and not forcing fetch
    if (!forceFetch && Object.keys(this.lastPrices).length > 0) {
      return this.lastPrices;
    }

    try {
      // Map our IDs to CoinGecko IDs
      const coinGeckoIds = {
        sol: 'solana',
        btc: 'bitcoin',
        usdt: 'tether',
        xrp: 'ripple',
        pol: 'polygon-ecosystem-token',
        usdc: 'usd-coin'
      };
      
      const ids = Object.values(coinGeckoIds).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      
      // Convert back to our IDs
      const prices = {};
      for (const [ourId, geckoId] of Object.entries(coinGeckoIds)) {
        if (data[geckoId]) {
          prices[ourId] = data[geckoId];
        }
      }
      
      // Cache the prices
      this.lastPrices = prices;
      
      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Return cached prices if fetch fails
      return this.lastPrices || {};
    }
  },

  updatePortfolioDisplay(totalValue, totalChange) {
    const moneyEl = document.getElementById('money');
    const pnlEl = document.getElementById('pnl');
    const changeEl = document.getElementById('change');
    
    if (moneyEl) {
      moneyEl.textContent = `$${totalValue.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
    
    const changePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;
    const pnlSign = totalChange >= 0 ? '+' : '';
    const percentSign = changePercent >= 0 ? '+' : '';
    
    if (pnlEl) {
      pnlEl.textContent = `${pnlSign}$${Math.abs(totalChange).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
      pnlEl.style.color = totalChange >= 0 ? '#30a46c' : '#e54d2e';
    }
    
    if (changeEl) {
      changeEl.textContent = `${percentSign}${Math.abs(changePercent).toFixed(2)}%`;
      changeEl.style.color = changePercent >= 0 ? '#30a46c' : '#e54d2e';
      changeEl.style.backgroundColor = changePercent >= 0 
        ? 'rgba(48, 164, 108, 0.2)' 
        : 'rgba(229, 77, 46, 0.2)';
    }
  },

  createTokenRow(currency, balance, price, index) {
    const value = balance * price.usd;
    const change = value * (price.usd_24h_change / 100);
    const changeSign = change >= 0 ? '+' : '';
    
    const div = document.createElement('div');
    div.role = 'gridcell';
    div.className = 't8qixv0 t8qixv1 _51gazn8 _51gazn1kj _51gazn1m7 _51gazn1nq';
    div.style.height = '84px';
    div.style.left = '0px';
    div.style.position = 'absolute';
    div.style.top = `${index * 84}px`;
    div.style.width = '100%';

    div.innerHTML = `
      <div class="t8qixv0 t8qixv1 _51gaznbb _51gaznef _51gazn8 _51gazn1kj _51gazn1m7 _51gazn1nq">
        <button type="button" class="_1a9sfe77 _1a9sfe70 _51gazn1c8 _51gazn1me _51gazn1kj _51gaznkx _51gaznxg _51gazn3e _1a9sfe78 _1a9sfe71 _51gazn1xp _1a9sfe7e _1a9sfe7a _1a9sfe72 _51gaznu2 _51gaznv2 _51gaznx2 _51gaznw2 _1a9sfe75 _51gazn6m _51gazn88 _1a9sfe7h t8qixv0 t8qixvf t8qixv1 t8qixv6 t8qixve _1a9sfe7g _51gazn1y5 _51gazn5q0 _51gazn1ui">
          <div class="_1a9sfe715 _1a9sfe7z _51gazn1mq _51gazn1kj _51gazn1mr _51gaznkv _51gazn1nm _51gazn9f _1a9sfe71b _1a9sfe716 _1a9sfe710 _51gazn1me">
            <div style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center;">
              <img src="${currency.logo}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
            </div>
          </div>
          <div class="_1a9sfe7q _1a9sfe7i _51gazn1nd _51gazn1h4 _51gazn1me _51gazn1kj _51gaznkv _51gazn1mq _1a9sfe7y _1a9sfe7r _1a9sfe7j _51gazn50 _1a9sfe7t">
            <div style="gap: 0.2rem !important;" class="_1a9sfe71p _51gazn1nd _51gazn1h4 _51gazn1kj _51gazn1nq _51gaznkr">
              <div class="_1a9sfe71q _51gazn1nd _51gazn1mv _51gazn1h4 _51gaznkv _51gazn1kj _51gazn1me">
                <div class="t8qixv0 t8qixv1 _51gazn8 _51gazn1kf _51gazn44v _51gaznv _51gazn1 _1a9sfe71t _1a9sfe71r _51gazn1kj _51gazn1me _51gaznkt _51gazn1h4 _51gazn1fg _1a9sfe71s _51gazn1mt">
                  <div class="_51gazn1kq _51gazn1">${currency.name}</div>
                  ${currency.id === 'sol' ? `
                  <div class="_1a9sfe720 _1a9sfe71w _51gazn1nm _51gazn1kj _51gazn1me _1a9sfe71z _51gazn1ms">
                    <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none" style="max-width: 15px; max-height: 15px; fill: #ab9ff2;">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z" fill="#ab9ff2"></path>
                    </svg>
                  </div>` : ''}
                </div>
                <div class="t8qixv0 t8qixv1 _51gazn8 _51gazn1kf _51gazn44v _51gaznv _51gazn3 _1a9sfe71v _1a9sfe71r _51gazn1kj _51gazn1me _51gaznkt _51gazn1h4 _51gazn1fg _1a9sfe71u _51gazn1ms _51gazn9f _1a9sfe71f _1a9sfe71e _51gazn1nm">
                  <div class="_51gazn1kq _51gazn3">
                    <div class="t8qixv0 t8qixv1 _51gazn8 _51gazn1kf _51gazn4fa _51gaznv">$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
              <div class="_1a9sfe71q _51gazn1nd _51gazn1mv _51gazn1h4 _51gaznkv _51gazn1kj _51gazn1me">
                <div class="t8qixv0 t8qixv1 _51gazn8 _51gazn1kf _51gazn45a _51gaznz _51gazn1 _1a9sfe71t _1a9sfe71r _51gazn1kj _51gazn1me _51gaznkt _51gazn1h4 _51gazn1fg _1a9sfe71s _51gazn1mt">
                  <div class="_51gazn1kq _51gazn1">${balance.toFixed(5)} ${currency.symbol}</div>
                </div>
                <div class="t8qixv0 t8qixv1 _51gazn8 _51gazn1kf _51gazn45a _51gaznz _51gazn3 _1a9sfe71v _1a9sfe71r _51gazn1kj _51gazn1me _51gaznkt _51gazn1h4 _51gazn1fg _1a9sfe71u _51gazn1ms _51gazn9f _1a9sfe71f _1a9sfe71e _51gazn1nm">
                  <div class="_51gazn1kq _51gazn3">
                    <div class="t8qixv0 t8qixv1 _51gazn8 _51gazn1kf _51gazn46y _51gaznz" style="color: ${change >= 0 ? '#30a46c' : '#e54d2e'}">${changeSign}$${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    `;

    return div;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WalletApp.init());
} else {
  WalletApp.init();
}