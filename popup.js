// AI Concept Highlighter - Popup Script

class PopupManager {
  constructor() {
    this.settings = {};
    this.currentTab = null;
    this.init();
  }
  
  async init() {
    try {
      // Get current tab
      await this.getCurrentTab();
      
      // Load settings
      await this.loadSettings();
      
      // Setup UI
      this.setupUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update status
      this.updateStatus();
      
    } catch (error) {
      console.error('Popup initialization error:', error);
      this.showError('Failed to initialize popup');
    }
  }
  
  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        this.currentTab = tabs[0];
        resolve();
      });
    });
  }
  
  async loadSettings() {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          console.warn('Extension context invalidated');
          this.settings = {};
          resolve();
          return;
        }

        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Error loading settings:', chrome.runtime.lastError.message);
            this.settings = {};
          } else {
            this.settings = response || {};
          }
          resolve();
        });
      } catch (error) {
        console.warn('Failed to load settings:', error);
        this.settings = {};
        resolve();
      }
    });
  }
  
  setupUI() {
    // Populate form fields
    document.getElementById('api-key').value = this.settings.apiKey || '';
    document.getElementById('enable-toggle').checked = this.settings.enabled || false;
    document.getElementById('auto-analyze-toggle').checked = this.settings.autoAnalyze !== false;

    // Initialize concept fields
    this.initializeConceptFields();

    // Show stats if configured
    if (this.isConfigured()) {
      document.getElementById('stats-section').classList.remove('hidden');
      this.updateStats();
    }
  }
  
  setupEventListeners() {
    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
      this.saveConfiguration();
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
      this.clearHighlights();
    });
    
    // Enable toggle
    document.getElementById('enable-toggle').addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    // Auto-analyze toggle
    document.getElementById('auto-analyze-toggle').addEventListener('change', (e) => {
      this.toggleAutoAnalyze(e.target.checked);
    });

    // Start analysis button
    document.getElementById('analyze-btn').addEventListener('click', () => {
      this.startAnalysis();
    });
    
    // API key input - validate on blur
    document.getElementById('api-key').addEventListener('blur', () => {
      this.validateApiKeyInput();
    });

    // Add concept button
    document.getElementById('popup-add-concept').addEventListener('click', () => {
      this.addConceptField();
    });


  }
  
  isConfigured() {
    return this.settings.apiKey && this.settings.concepts && this.settings.concepts.length > 0;
  }
  
  updateStatus() {
    const statusCard = document.getElementById('status-card');
    const statusTitle = statusCard.querySelector('.status-title');
    const statusText = statusCard.querySelector('.status-text');
    
    if (!this.isConfigured()) {
      statusCard.className = 'status-card warning';
      statusTitle.textContent = 'Configuration Required';
      statusText.textContent = 'Please configure your API key and concepts to get started.';
    } else if (!this.settings.enabled) {
      statusCard.className = 'status-card';
      statusTitle.textContent = 'Ready to Use';
      statusText.textContent = 'Extension is configured but disabled. Enable it to start highlighting.';
    } else {
      statusCard.className = 'status-card';
      statusTitle.textContent = 'Active';
      statusText.textContent = 'Extension is active and highlighting concepts on this page.';
    }
  }
  
  async validateApiKeyInput() {
    const apiKey = document.getElementById('api-key').value.trim();
    
    if (!apiKey) return;
    
    try {
      const validation = await this.validateApiKey(apiKey);
      
      if (!validation.valid) {
        this.showError(`Invalid API key: ${validation.error}`);
      }
      
    } catch (error) {
      console.error('API key validation error:', error);
    }
  }
  
  validateApiKey(apiKey) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve({ valid: false, error: 'Extension context invalidated. Please reload the extension.' });
          return;
        }

        chrome.runtime.sendMessage({
          action: 'validateApiKey',
          apiKey: apiKey
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ valid: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { valid: false, error: 'No response received' });
          }
        });
      } catch (error) {
        resolve({ valid: false, error: error.message });
      }
    });
  }

  initializeConceptFields() {
    const container = document.getElementById('popup-concepts-container');
    const concepts = this.settings.concepts || [];

    // Clear existing fields
    container.innerHTML = '';

    // Add existing concepts
    if (concepts.length > 0) {
      concepts.forEach(concept => {
        // Handle both old string format and new object format
        if (typeof concept === 'string') {
          this.addConceptField({
            text: concept,
            color: this.getRandomConceptColor()
          });
        } else {
          this.addConceptField(concept);
        }
      });
    } else {
      // Add one empty field to start
      this.addConceptField();
    }
  }

  addConceptField(conceptData = null) {
    const container = document.getElementById('popup-concepts-container');
    const conceptId = 'popup-concept-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Handle both string and object input for backward compatibility
    let conceptText = '';
    let conceptColor = this.getRandomConceptColor();

    if (typeof conceptData === 'string') {
      conceptText = conceptData;
    } else if (conceptData && typeof conceptData === 'object') {
      conceptText = conceptData.text || '';
      conceptColor = conceptData.color || conceptColor;
    }

    const conceptDiv = document.createElement('div');
    conceptDiv.className = 'concept-field-group';
    conceptDiv.innerHTML = `
      <div class="concept-input-wrapper">
        <input type="text"
               id="${conceptId}"
               class="concept-input"
               placeholder="Enter a concept"
               value="${conceptText}">
        <input type="color"
               class="concept-color-picker"
               value="${conceptColor}"
               title="Choose highlight color">
        <button type="button" class="concept-remove-btn" title="Remove">×</button>
      </div>
    `;

    container.appendChild(conceptDiv);

    // Add event listeners
    const input = conceptDiv.querySelector('.concept-input');
    const colorPicker = conceptDiv.querySelector('.concept-color-picker');
    const removeBtn = conceptDiv.querySelector('.concept-remove-btn');

    if (!input || !colorPicker || !removeBtn) {
      console.error('Failed to create concept field elements');
      conceptDiv.remove();
      return null;
    }

    // Auto-add new field when typing in the last empty field (with debounce)
    let addFieldTimeout;
    input.addEventListener('input', (e) => {
      // Clear previous timeout
      clearTimeout(addFieldTimeout);

      // Add delay to prevent field creation on every keystroke
      addFieldTimeout = setTimeout(() => {
        const allInputs = container.querySelectorAll('.concept-input');
        const lastInput = allInputs[allInputs.length - 1];

        // Only add field if this is the last input, has meaningful content, and no empty fields exist
        if (e.target === lastInput && e.target.value.trim().length > 3) {
          // Check if there are any empty fields
          const emptyFields = Array.from(allInputs).filter(input => input.value.trim() === '');

          // Only add if no empty fields exist and we don't have too many fields
          if (emptyFields.length === 0 && allInputs.length < 10) {
            this.addConceptField();
          }
        }

        this.updateRemoveButtons();
      }, 1200); // Increased delay to 1200ms for more stability
    });

    // Remove concept
    removeBtn.addEventListener('click', () => {
      this.removeConceptField(conceptDiv);
    });

    // Focus the new input if it's empty (with small delay to ensure DOM is ready)
    if (!conceptText) {
      setTimeout(() => {
        input.focus();
      }, 100);
    }

    // Prevent auto-addition when field is focused but empty
    input.addEventListener('focus', () => {
      if (addFieldTimeout) {
        clearTimeout(addFieldTimeout);
      }
    });

    this.updateRemoveButtons();
    return conceptDiv;
  }

  removeConceptField(conceptDiv) {
    const container = document.getElementById('popup-concepts-container');
    const inputs = container.querySelectorAll('.concept-input');

    // Don't remove if it's the only field
    if (inputs.length <= 1) {
      inputs[0].value = '';
      return;
    }

    conceptDiv.remove();
    this.updateRemoveButtons();
  }

  updateRemoveButtons() {
    const container = document.getElementById('popup-concepts-container');
    const removeButtons = container.querySelectorAll('.concept-remove-btn');
    const inputs = container.querySelectorAll('.concept-input');

    removeButtons.forEach(btn => {
      btn.style.display = inputs.length > 1 ? 'block' : 'none';
    });
  }

  getRandomConceptColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getConceptsFromFields() {
    const container = document.getElementById('popup-concepts-container');
    const fieldGroups = container.querySelectorAll('.concept-field-group');
    const concepts = [];

    fieldGroups.forEach(group => {
      const input = group.querySelector('.concept-input');
      const colorPicker = group.querySelector('.concept-color-picker');
      const value = input.value.trim();

      if (value) {
        // Check if concept already exists (by text)
        const existingIndex = concepts.findIndex(c => c.text === value);
        if (existingIndex === -1) {
          concepts.push({
            text: value,
            color: colorPicker.value
          });
        }
      }
    });

    return concepts;
  }

  // Backward compatibility method for simple concept arrays
  getConceptTextsFromFields() {
    return this.getConceptsFromFields().map(concept => concept.text);
  }



  async toggleAutoAnalyze(autoAnalyze) {
    try {
      const newSettings = {
        ...this.settings,
        autoAnalyze: autoAnalyze
      };

      const saveResult = await this.saveSettings(newSettings);

      if (saveResult.success) {
        this.settings = newSettings;
        this.updateStatus();

        if (autoAnalyze) {
          this.showSuccess('Auto-analysis enabled');
        } else {
          this.showSuccess('Auto-analysis disabled - use "Start Analysis" button');
        }
      } else {
        this.showError(`Error updating auto-analysis: ${saveResult.error}`);
        // Revert toggle state
        document.getElementById('auto-analyze-toggle').checked = !autoAnalyze;
      }

    } catch (error) {
      this.showError(`Error toggling auto-analysis: ${error.message}`);
      // Revert toggle state
      document.getElementById('auto-analyze-toggle').checked = !autoAnalyze;
    }
  }

  startAnalysis() {
    // Send message to content script to start analysis
    if (this.currentTab) {
      chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'analyzeCurrentPage'
      }).catch(() => {
        // Content script might not be ready
      });
    }

    this.showSuccess('Analysis started');
  }

  async saveConfiguration() {
    const saveBtn = document.getElementById('save-btn');
    const saveText = document.getElementById('save-text');
    const saveLoading = document.getElementById('save-loading');

    // Get form values
    const apiKey = document.getElementById('api-key').value.trim();
    const concepts = this.getConceptsFromFields();
    const enabled = document.getElementById('enable-toggle').checked;
    const autoAnalyze = document.getElementById('auto-analyze-toggle').checked;
    
    // Validate inputs
    if (!apiKey) {
      this.showError('Please enter your Google Gemini API key');
      return;
    }

    if (concepts.length === 0) {
      this.showError('Please add at least one concept to highlight');
      return;
    }
    
    // Check extension context
    if (!chrome.runtime?.id) {
      this.showError('Extension context invalidated. Please reload the extension and try again.');
      return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveText.classList.add('hidden');
    saveLoading.classList.remove('hidden');

    try {
      // Validate API key first
      const validation = await this.validateApiKey(apiKey);

      if (!validation.valid) {
        this.showError(`API key validation failed: ${validation.error}`);
        return;
      }

      // Save settings
      const newSettings = {
        ...this.settings,
        apiKey: apiKey,
        concepts: concepts,
        enabled: enabled,
        autoAnalyze: autoAnalyze
      };

      const saveResult = await this.saveSettings(newSettings);

      if (!saveResult.success) {
        this.showError(`Error saving configuration: ${saveResult.error}`);
        return;
      }

      this.settings = newSettings;
      
      // Update UI
      this.updateStatus();
      this.showSuccess('Configuration saved successfully!');
      
      // Show stats section
      document.getElementById('stats-section').classList.remove('hidden');
      
      // Trigger analysis if enabled
      if (enabled) {
        this.triggerAnalysis();
      }
      
    } catch (error) {
      this.showError(`Error saving configuration: ${error.message}`);
    } finally {
      // Reset button state
      saveBtn.disabled = false;
      saveText.classList.remove('hidden');
      saveLoading.classList.add('hidden');
    }
  }
  
  saveSettings(settings) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve({ success: false, error: 'Extension context invalidated. Please reload the extension.' });
          return;
        }

        chrome.runtime.sendMessage({
          action: 'saveSettings',
          settings: settings
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: true });
          }
        });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }
  
  async toggleExtension(enabled) {
    try {
      const newSettings = {
        ...this.settings,
        enabled: enabled
      };
      
      await this.saveSettings(newSettings);
      this.settings = newSettings;
      
      this.updateStatus();
      
      if (enabled) {
        this.showSuccess('Extension enabled on this page');
        this.triggerAnalysis();
      } else {
        this.showSuccess('Extension disabled on this page');
        this.clearHighlights();
      }
      
    } catch (error) {
      this.showError(`Error toggling extension: ${error.message}`);
      // Revert toggle state
      document.getElementById('enable-toggle').checked = !enabled;
    }
  }
  
  triggerAnalysis() {
    // Send message to content script to analyze page
    if (this.currentTab) {
      chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'analyzeCurrentPage'
      }).catch(() => {
        // Content script might not be ready, that's okay
      });
    }
  }
  
  clearHighlights() {
    // Send message to content script to clear highlights
    if (this.currentTab) {
      chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'clearHighlights'
      }).catch(() => {
        // Content script might not be ready, that's okay
      });
    }
    
    this.showSuccess('Highlights cleared');
    this.updateStats(0, 0);
  }
  
  updateStats(highlightsCount = 0, conceptsFound = 0) {
    document.getElementById('highlights-count').textContent = highlightsCount;
    document.getElementById('concepts-found').textContent = conceptsFound;
  }
  
  showSuccess(message) {
    this.showStatus(message, 'success');
  }
  
  showError(message) {
    this.showStatus(message, 'error');
  }
  
  showStatus(message, type) {
    const statusCard = document.getElementById('status-card');
    const statusTitle = statusCard.querySelector('.status-title');
    const statusText = statusCard.querySelector('.status-text');
    
    statusCard.className = `status-card ${type}`;
    
    if (type === 'success') {
      statusTitle.textContent = 'Success';
    } else if (type === 'error') {
      statusTitle.textContent = 'Error';
    }
    
    statusText.textContent = message;
    
    // Reset to normal status after 3 seconds
    setTimeout(() => {
      this.updateStatus();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
