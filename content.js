// AI Concept Highlighter - Content Script

class AIConceptHighlighter {
  constructor() {
    this.settings = {};
    this.floatingIcon = null;
    this.configModal = null;
    this.summaryPanel = null;
    this.isAnalyzing = false;
    this.highlights = [];
    this.originalContent = '';
    this.currentSummary = '';

    this.init();
  }
  
  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  async setup() {
    try {
      // Get current settings
      await this.loadSettings();
      
      // Create floating icon
      this.createFloatingIcon();
      
      // Set up message listener
      this.setupMessageListener();
      
      // Auto-analyze if enabled and autoAnalyze is true
      if (this.settings.enabled && this.settings.autoAnalyze !== false) {
        setTimeout(() => this.analyzeCurrentPage(), 2000);
      }
      
    } catch (error) {
      console.error('AI Concept Highlighter setup error:', error);
    }
  }
  
  async loadSettings() {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          console.warn('Extension context invalidated, using default settings');
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
            // Migrate old concept format to new format with colors
            this.migrateConcepts();
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

  migrateConcepts() {
    if (this.settings.concepts && Array.isArray(this.settings.concepts)) {
      let needsMigration = false;
      const migratedConcepts = this.settings.concepts.map(concept => {
        if (typeof concept === 'string') {
          needsMigration = true;
          return {
            text: concept,
            color: this.getRandomConceptColor()
          };
        }
        return concept;
      });

      if (needsMigration) {
        this.settings.concepts = migratedConcepts;
        console.log('Migrated concepts to new format with colors:', migratedConcepts);
        // Save the migrated concepts
        this.saveSettings(this.settings).catch(error => {
          console.warn('Failed to save migrated concepts:', error);
        });
      }
    }
  }
  
  createFloatingIcon() {
    // Remove existing icon if present
    if (this.floatingIcon) {
      this.floatingIcon.remove();
    }

    // Create floating icon
    this.floatingIcon = document.createElement('div');
    this.floatingIcon.className = 'ai-concept-floating-icon';
    this.floatingIcon.title = 'AI Concept Highlighter\n• Click for page summary\n• Drag to move position\n• Settings button in summary panel';

    // Add drag indicator
    const dragIndicator = document.createElement('div');
    dragIndicator.className = 'ai-concept-drag-indicator';
    dragIndicator.innerHTML = '⋮⋮';
    this.floatingIcon.appendChild(dragIndicator);

    // Load saved position or use default
    this.loadIconPosition();

    // Add click event
    this.floatingIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      // Only show summary if not dragging
      if (!this.isDragging) {
        // Small delay to ensure drag detection is complete
        setTimeout(() => {
          if (!this.isDragging) {
            this.showSummaryPanel();
          }
        }, 50);
      }
    });

    // Also add a double-click handler as backup
    this.floatingIcon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showSummaryPanel();
    });

    // Add drag functionality
    this.makeDraggable(this.floatingIcon);

    // Add to page
    document.body.appendChild(this.floatingIcon);

    // Update icon appearance based on settings
    this.updateIconAppearance();
  }

  loadIconPosition() {
    // Try to get saved position from localStorage
    try {
      const savedPosition = localStorage.getItem('ai-concept-icon-position');
      if (savedPosition) {
        const position = JSON.parse(savedPosition);
        this.floatingIcon.style.top = position.top;
        this.floatingIcon.style.right = position.right;
        this.floatingIcon.style.left = position.left;
        this.floatingIcon.style.bottom = position.bottom;
        return;
      }
    } catch (error) {
      console.warn('Failed to load icon position:', error);
    }

    // Default position (top-right)
    this.floatingIcon.style.top = '20px';
    this.floatingIcon.style.right = '20px';
  }

  saveIconPosition() {
    try {
      const position = {
        top: this.floatingIcon.style.top,
        right: this.floatingIcon.style.right,
        left: this.floatingIcon.style.left,
        bottom: this.floatingIcon.style.bottom
      };
      localStorage.setItem('ai-concept-icon-position', JSON.stringify(position));
    } catch (error) {
      console.warn('Failed to save icon position:', error);
    }
  }

  makeDraggable(element) {
    let isDragging = false;
    let hasMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;
    let dragStartTime = 0;
    const dragThreshold = 5; // Minimum pixels to move before considering it a drag
    const clickTimeThreshold = 200; // Maximum time for a click (ms)

    // Mouse events
    element.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only left mouse button
      this.startDrag(e, e.clientX, e.clientY);
    });

    // Touch events for mobile support
    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.startDrag(e, touch.clientX, touch.clientY);
    });

    const startDrag = (e, clientX, clientY) => {
      isDragging = true;
      hasMoved = false;
      this.isDragging = false; // Don't set to true until we actually move

      dragStartX = clientX;
      dragStartY = clientY;
      dragStartTime = Date.now();

      const rect = element.getBoundingClientRect();
      elementStartX = rect.left;
      elementStartY = rect.top;

      // Don't prevent default or add classes yet - wait for movement
      e.stopPropagation();
    };

    this.startDrag = startDrag;

    // Mouse move
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      this.handleDrag(e.clientX, e.clientY);
    });

    // Touch move
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      this.handleDrag(touch.clientX, touch.clientY);
      e.preventDefault();
    });

    // Mouse up
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        this.endDrag();
      }
    });

    // Touch end
    document.addEventListener('touchend', () => {
      if (isDragging) {
        this.endDrag();
      }
    });

    this.handleDrag = (clientX, clientY) => {
      const deltaX = clientX - dragStartX;
      const deltaY = clientY - dragStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check if we've moved enough to consider this a drag
      if (!hasMoved && distance > dragThreshold) {
        hasMoved = true;
        this.isDragging = true;

        // Now we're actually dragging, add visual feedback
        element.classList.add('ai-concept-dragging');

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
      }

      // Only update position if we're actually dragging
      if (hasMoved) {
        const newX = elementStartX + deltaX;
        const newY = elementStartY + deltaY;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const iconSize = 50; // Icon size in pixels

        // Constrain to viewport bounds
        const constrainedX = Math.max(0, Math.min(newX, viewportWidth - iconSize));
        const constrainedY = Math.max(0, Math.min(newY, viewportHeight - iconSize));

        // Update position
        element.style.left = constrainedX + 'px';
        element.style.top = constrainedY + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
      }
    };

    this.endDrag = () => {
      const wasActuallyDragging = hasMoved;
      const dragDuration = Date.now() - dragStartTime;

      isDragging = false;

      // Remove dragging class
      element.classList.remove('ai-concept-dragging');

      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      // Only do drag-related actions if we actually moved
      if (wasActuallyDragging) {
        // Snap to edges for better positioning
        this.snapToEdge(element);

        // Save new position
        this.saveIconPosition();

        // Set dragging flag to prevent click event
        this.isDragging = true;
        setTimeout(() => {
          this.isDragging = false;
        }, 150);
      } else {
        // This was a click, not a drag
        this.isDragging = false;

        // If it was a quick click (not a long press), allow the click event
        if (dragDuration < clickTimeThreshold) {
          // Small delay to ensure this runs after the click event check
          setTimeout(() => {
            this.isDragging = false;
          }, 10);
        }
      }

      // Reset movement tracking
      hasMoved = false;
    };
  }

  snapToEdge(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const iconSize = 50;
    const snapDistance = 20; // Distance from edge to snap

    let newLeft = rect.left;
    let newTop = rect.top;
    let snapped = false;

    // Snap to left edge
    if (rect.left < snapDistance) {
      newLeft = 10;
      snapped = true;
    }
    // Snap to right edge
    else if (rect.right > viewportWidth - snapDistance) {
      newLeft = viewportWidth - iconSize - 10;
      element.style.right = '10px';
      element.style.left = 'auto';
      snapped = true;
    }

    // Snap to top edge
    if (rect.top < snapDistance) {
      newTop = 10;
      snapped = true;
    }
    // Snap to bottom edge
    else if (rect.bottom > viewportHeight - snapDistance) {
      newTop = viewportHeight - iconSize - 10;
      element.style.bottom = '10px';
      element.style.top = 'auto';
      snapped = true;
    }

    // Apply snapping with animation
    if (snapped) {
      element.style.transition = 'all 0.3s ease';

      if (element.style.right === 'auto') {
        element.style.left = newLeft + 'px';
      }
      if (element.style.bottom === 'auto') {
        element.style.top = newTop + 'px';
      }

      // Remove transition after animation
      setTimeout(() => {
        element.style.transition = 'all 0.3s ease';
      }, 300);
    }
  }
  
  updateIconAppearance() {
    if (!this.floatingIcon) return;
    
    if (this.settings.enabled) {
      this.floatingIcon.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      this.floatingIcon.title = 'AI Concept Highlighter (Enabled) - Click to configure';
    } else {
      this.floatingIcon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      this.floatingIcon.title = 'AI Concept Highlighter (Disabled) - Click to configure';
    }
    
    if (this.isAnalyzing) {
      this.floatingIcon.innerHTML = '<div class="ai-concept-loading"></div>';
    } else {
      this.floatingIcon.innerHTML = '';
    }
  }
  
  showConfigModal() {
    // Remove existing modal if present
    if (this.configModal) {
      this.configModal.remove();
    }
    
    // Create modal overlay
    this.configModal = document.createElement('div');
    this.configModal.className = 'ai-concept-modal-overlay';
    
    // Create modal content
    const modalContent = this.createModalContent();
    this.configModal.appendChild(modalContent);
    
    // Add to page
    document.body.appendChild(this.configModal);
    
    // Add event listeners
    this.setupModalEventListeners();
  }
  
  createModalContent() {
    const modal = document.createElement('div');
    modal.className = 'ai-concept-modal';
    
    const isConfigured = this.settings.apiKey && this.settings.concepts && this.settings.concepts.length > 0;
    
    modal.innerHTML = `
      <button class="ai-concept-close-btn">&times;</button>
      <h2>🧠 AI Concept Highlighter</h2>
      
      <div id="ai-concept-status"></div>
      
      <div class="ai-concept-form-group">
        <label for="ai-concept-api-key">Google Gemini API Key:</label>
        <input type="password" id="ai-concept-api-key" 
               placeholder="Enter your Google Gemini API key" 
               value="${this.settings.apiKey || ''}">
        <small style="color: #666; font-size: 12px;">
          Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>
        </small>
      </div>
      
      <div class="ai-concept-form-group">
        <label>Concepts to Highlight:</label>
        <div id="ai-concept-concepts-container">
          <!-- Dynamic concept list will be inserted here -->
        </div>
        <button type="button" class="ai-concept-btn ai-concept-btn-secondary" id="ai-concept-add-concept">
          + Add Concept
        </button>

      </div>
      
      <div class="ai-concept-form-group">
        <label>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span>Enable highlighting on this page:</span>
            <label class="ai-concept-toggle">
              <input type="checkbox" id="ai-concept-enabled" ${this.settings.enabled ? 'checked' : ''}>
              <span class="ai-concept-toggle-slider"></span>
            </label>
          </div>
        </label>
      </div>

      <div class="ai-concept-form-group">
        <label>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span>Auto-analyze new pages:</span>
            <label class="ai-concept-toggle">
              <input type="checkbox" id="ai-concept-auto-analyze" ${this.settings.autoAnalyze !== false ? 'checked' : ''}>
              <span class="ai-concept-toggle-slider"></span>
            </label>
          </div>
        </label>
        <small style="color: #666; font-size: 12px; margin-top: 5px; display: block;">
          When enabled, pages are automatically analyzed when loaded. When disabled, click "Start Analysis" to analyze manually.
        </small>
      </div>
      
      <div class="ai-concept-button-group">
        ${isConfigured ? `
          <button class="ai-concept-btn ai-concept-btn-secondary" id="ai-concept-clear-highlights">
            Clear Highlights
          </button>
          <button class="ai-concept-btn ai-concept-btn-success" id="ai-concept-start-analysis">
            Start Analysis
          </button>
        ` : ''}
        <button class="ai-concept-btn ai-concept-btn-secondary" id="ai-concept-cancel">
          Cancel
        </button>
        <button class="ai-concept-btn ai-concept-btn-primary" id="ai-concept-save">
          Save Settings
        </button>
      </div>
    `;
    
    return modal;
  }
  
  setupModalEventListeners() {
    const modal = this.configModal;
    
    // Close button
    modal.querySelector('.ai-concept-close-btn').addEventListener('click', () => {
      this.hideConfigModal();
    });
    
    // Cancel button
    modal.querySelector('#ai-concept-cancel').addEventListener('click', () => {
      this.hideConfigModal();
    });
    
    // Save button
    modal.querySelector('#ai-concept-save').addEventListener('click', () => {
      this.saveConfiguration();
    });

    // Add concept button
    modal.querySelector('#ai-concept-add-concept').addEventListener('click', () => {
      this.addConceptField();
    });


    
    // Clear highlights button
    const clearBtn = modal.querySelector('#ai-concept-clear-highlights');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearHighlights();
        this.showStatus('Highlights cleared', 'success');
      });
    }

    // Start analysis button
    const startAnalysisBtn = modal.querySelector('#ai-concept-start-analysis');
    if (startAnalysisBtn) {
      startAnalysisBtn.addEventListener('click', () => {
        this.analyzeCurrentPage();
        this.showStatus('Starting analysis...', 'info');
      });
    }
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideConfigModal();
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.configModal) {
        this.hideConfigModal();
      }
    });

    // Initialize concept fields
    this.initializeConceptFields();
  }

  initializeConceptFields() {
    const container = document.getElementById('ai-concept-concepts-container');
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
    const container = document.getElementById('ai-concept-concepts-container');
    const conceptId = 'concept-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

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
    conceptDiv.className = 'ai-concept-field-group';
    conceptDiv.innerHTML = `
      <div class="ai-concept-input-wrapper">
        <input type="text"
               id="${conceptId}"
               class="ai-concept-input"
               placeholder="Enter a concept (e.g., machine learning)"
               value="${conceptText}">
        <input type="color"
               class="ai-concept-color-picker"
               value="${conceptColor}"
               title="Choose highlight color">
        <button type="button" class="ai-concept-remove-btn" title="Remove this concept">×</button>
      </div>
    `;

    container.appendChild(conceptDiv);

    // Add event listeners
    const input = conceptDiv.querySelector('.ai-concept-input');
    const colorPicker = conceptDiv.querySelector('.ai-concept-color-picker');
    const removeBtn = conceptDiv.querySelector('.ai-concept-remove-btn');

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
        const allInputs = container.querySelectorAll('.ai-concept-input');
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

    // Clean up empty fields when losing focus (except the last one)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        const allInputs = container.querySelectorAll('.ai-concept-input');
        const emptyInputs = Array.from(allInputs).filter(inp => inp.value.trim() === '');

        // Keep at least one empty field, remove others
        if (emptyInputs.length > 1) {
          emptyInputs.slice(0, -1).forEach(emptyInput => {
            const fieldGroup = emptyInput.closest('.ai-concept-field-group');
            if (fieldGroup) {
              fieldGroup.remove();
            }
          });
          this.updateRemoveButtons();
        }
      }, 200); // Small delay to allow for field switching
    });

    this.updateRemoveButtons();

    // Debug: Log color picker creation
    console.log('Created concept field with color:', conceptColor);

    return conceptDiv;
  }

  removeConceptField(conceptDiv) {
    const container = document.getElementById('ai-concept-concepts-container');
    const inputs = container.querySelectorAll('.ai-concept-input');

    // Don't remove if it's the only field
    if (inputs.length <= 1) {
      // Just clear the value instead
      inputs[0].value = '';
      return;
    }

    conceptDiv.remove();
    this.updateRemoveButtons();
  }

  updateRemoveButtons() {
    const container = document.getElementById('ai-concept-concepts-container');
    const removeButtons = container.querySelectorAll('.ai-concept-remove-btn');
    const inputs = container.querySelectorAll('.ai-concept-input');

    // Hide remove button if only one field exists
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
    const container = document.getElementById('ai-concept-concepts-container');
    const fieldGroups = container.querySelectorAll('.ai-concept-field-group');
    const concepts = [];

    fieldGroups.forEach(group => {
      const input = group.querySelector('.ai-concept-input');
      const colorPicker = group.querySelector('.ai-concept-color-picker');
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



  showSummaryPanel() {
    // Remove existing panel if present
    if (this.summaryPanel) {
      this.summaryPanel.remove();
    }

    // Create summary panel
    this.summaryPanel = document.createElement('div');
    this.summaryPanel.className = 'ai-concept-summary-panel';

    // Position near the floating icon
    const iconRect = this.floatingIcon.getBoundingClientRect();
    const panelWidth = 350;
    const panelHeight = 400;

    // Calculate position (try to place to the left of icon, fallback to right)
    let left = iconRect.left - panelWidth - 10;
    if (left < 10) {
      left = iconRect.right + 10;
    }

    let top = iconRect.top;
    if (top + panelHeight > window.innerHeight - 10) {
      top = window.innerHeight - panelHeight - 10;
    }

    this.summaryPanel.style.left = left + 'px';
    this.summaryPanel.style.top = top + 'px';

    // Create panel content
    const panelContent = this.createSummaryContent();
    this.summaryPanel.appendChild(panelContent);

    // Add to page
    document.body.appendChild(this.summaryPanel);

    // Add event listeners
    this.setupSummaryEventListeners();

    // Generate summary if not already available
    if (!this.currentSummary) {
      this.generatePageSummary();
    }
  }

  createSummaryContent() {
    const panel = document.createElement('div');
    panel.className = 'ai-concept-summary-content';

    const isConfigured = this.settings.apiKey && this.settings.concepts && this.settings.concepts.length > 0;
    let conceptsDisplay = 'No concepts configured';

    if (isConfigured) {
      const conceptsData = this.settings.concepts;
      conceptsDisplay = conceptsData.map(concept => {
        const text = typeof concept === 'string' ? concept : concept.text;
        const color = typeof concept === 'object' && concept.color ? concept.color : '#667eea';
        return `<span class="ai-concept-tag" style="background-color: ${this.lightenColor(color, 0.8)}; border-left: 3px solid ${color}; padding: 2px 6px; margin: 2px; border-radius: 3px; display: inline-block;">${text}</span>`;
      }).join('');
    }

    panel.innerHTML = `
      <div class="ai-concept-summary-header">
        <h3>🧠 Page Summary</h3>
        <div class="ai-concept-summary-controls">
          <button class="ai-concept-summary-btn ai-concept-summary-settings-btn" title="Settings">⚙️</button>
          <button class="ai-concept-summary-btn ai-concept-summary-close-btn" title="Close">×</button>
        </div>
      </div>

      <div class="ai-concept-summary-body">
        <div class="ai-concept-summary-concepts">
          <strong>Concepts:</strong> <div class="ai-concept-concepts-display">${conceptsDisplay}</div>
        </div>

        <div class="ai-concept-summary-content-area">
          <div id="ai-concept-summary-text" class="ai-concept-summary-text">
            ${this.currentSummary || '<div class="ai-concept-summary-loading">Loading summary...</div>'}
          </div>
        </div>

        <div class="ai-concept-summary-actions">
          <button class="ai-concept-btn ai-concept-btn-secondary ai-concept-refresh-summary">
            🔄 Refresh Summary
          </button>
          ${isConfigured ? `
            <button class="ai-concept-btn ai-concept-btn-success ai-concept-highlight-concepts">
              ✨ Highlight Concepts
            </button>
          ` : ''}
        </div>

        <div class="ai-concept-relevance-legend">
          <div class="ai-concept-legend-title">Highlight Levels:</div>
          <div class="ai-concept-legend-items">
            <span class="ai-concept-legend-item">
              <span class="ai-concept-legend-sample ai-concept-legend-high">High</span>
              <small>Bold + Underline</small>
            </span>
            <span class="ai-concept-legend-item">
              <span class="ai-concept-legend-sample ai-concept-legend-medium">Medium</span>
              <small>Underline</small>
            </span>
            <span class="ai-concept-legend-item">
              <span class="ai-concept-legend-sample ai-concept-legend-low">Low</span>
              <small>Color only</small>
            </span>
          </div>
        </div>
      </div>
    `;

    return panel;
  }

  setupSummaryEventListeners() {
    const panel = this.summaryPanel;

    // Close button
    panel.querySelector('.ai-concept-summary-close-btn').addEventListener('click', () => {
      this.hideSummaryPanel();
    });

    // Settings button
    panel.querySelector('.ai-concept-summary-settings-btn').addEventListener('click', () => {
      this.hideSummaryPanel();
      this.showConfigModal();
    });

    // Refresh summary button
    panel.querySelector('.ai-concept-refresh-summary').addEventListener('click', () => {
      this.generatePageSummary();
    });

    // Highlight concepts button
    const highlightBtn = panel.querySelector('.ai-concept-highlight-concepts');
    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => {
        this.analyzeCurrentPage();
        this.hideSummaryPanel();
      });
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.summaryPanel && !this.summaryPanel.contains(e.target) && !this.floatingIcon.contains(e.target)) {
        this.hideSummaryPanel();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.summaryPanel) {
        this.hideSummaryPanel();
      }
    });
  }

  hideSummaryPanel() {
    if (this.summaryPanel) {
      this.summaryPanel.remove();
      this.summaryPanel = null;
    }
  }

  hideConfigModal() {
    if (this.configModal) {
      this.configModal.remove();
      this.configModal = null;
    }
  }
  
  async saveConfiguration() {
    const apiKey = document.getElementById('ai-concept-api-key').value.trim();
    const concepts = this.getConceptsFromFields();
    const enabled = document.getElementById('ai-concept-enabled').checked;
    const autoAnalyze = document.getElementById('ai-concept-auto-analyze').checked;

    // Validate inputs
    if (!apiKey) {
      this.showStatus('Please enter your Google Gemini API key', 'error');
      return;
    }

    if (concepts.length === 0) {
      this.showStatus('Please add at least one concept to highlight', 'error');
      return;
    }

    // Check extension context
    if (!chrome.runtime?.id) {
      this.showStatus('Extension context invalidated. Please reload the page and try again.', 'error');
      return;
    }

    // Show loading
    this.showStatus('Validating API key...', 'info');

    try {
      // Validate API key
      const validation = await this.validateApiKey(apiKey);

      if (!validation.valid) {
        this.showStatus(`API key validation failed: ${validation.error}`, 'error');
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
        this.showStatus(`Error saving configuration: ${saveResult.error}`, 'error');
        return;
      }

      this.settings = newSettings;
      this.showStatus('Configuration saved successfully!', 'success');

      // Update icon appearance
      this.updateIconAppearance();

      // Analyze page if enabled and auto-analyze is on
      if (enabled && autoAnalyze) {
        setTimeout(() => {
          this.analyzeCurrentPage();
          this.hideConfigModal();
        }, 1500);
      } else {
        setTimeout(() => {
          this.hideConfigModal();
        }, 1500);
      }

    } catch (error) {
      console.error('Configuration save error:', error);
      this.showStatus(`Error saving configuration: ${error.message}`, 'error');
    }
  }
  
  validateApiKey(apiKey) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve({ valid: false, error: 'Extension context invalidated. Please reload the page.' });
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

  saveSettings(settings) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve({ success: false, error: 'Extension context invalidated. Please reload the page.' });
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
  
  showStatus(message, type) {
    const statusDiv = document.getElementById('ai-concept-status');
    if (statusDiv) {
      statusDiv.innerHTML = `<div class="ai-concept-status ai-concept-status-${type}">${message}</div>`;
    }
  }
  
  async generatePageSummary() {
    if (this.isAnalyzing) return;

    // Validate configuration
    if (!this.settings.apiKey) {
      this.updateSummaryContent('⚠️ API key not configured. Click the settings button (⚙️) to configure your Google Gemini API key.');
      return;
    }

    this.updateSummaryContent('<div class="ai-concept-summary-loading">🤖 Generating summary...</div>');

    try {
      // Get page content
      const content = this.extractPageContent();

      if (!content || content.length < 50) {
        this.updateSummaryContent('📄 Page content too short for meaningful summary.');
        return;
      }

      // Send for summary generation
      const result = await this.generateSummary(content);

      if (result.success && result.summary) {
        this.currentSummary = result.summary;
        this.updateSummaryContent(result.summary);
      } else if (result.error) {
        this.updateSummaryContent(`❌ Summary generation failed: ${result.error}`);
      } else {
        this.updateSummaryContent('❌ Failed to generate summary. Please try again.');
      }

    } catch (error) {
      console.error('Summary generation error:', error);
      this.updateSummaryContent('❌ Summary generation error. Please try again.');
    }
  }

  updateSummaryContent(content) {
    const summaryElement = document.getElementById('ai-concept-summary-text');
    if (summaryElement) {
      summaryElement.innerHTML = content;
    }
  }

  generateSummary(content) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve({ success: false, error: 'Extension context invalidated. Please reload the page.' });
          return;
        }

        chrome.runtime.sendMessage({
          action: 'generateSummary',
          data: {
            content: content,
            concepts: this.settings.concepts || []
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: false, error: 'No response received' });
          }
        });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  async analyzeCurrentPage() {
    if (this.isAnalyzing || !this.settings.enabled) return;

    // Validate configuration
    if (!this.settings.apiKey) {
      this.showNotification('API key not configured. Click the brain icon to set up.', 'warning');
      return;
    }

    if (!this.settings.concepts || this.settings.concepts.length === 0) {
      this.showNotification('No concepts configured. Click the brain icon to add concepts.', 'warning');
      return;
    }

    this.isAnalyzing = true;
    this.updateIconAppearance();

    try {
      // Get page content
      const content = this.extractPageContent();

      if (!content || content.length < 50) {
        this.showNotification('Page content too short for analysis', 'info');
        return;
      }

      if (content.length > 10000) {
        this.showNotification('Analyzing large page content...', 'info');
      }

      // Send for analysis
      const result = await this.analyzeContent(content);

      if (result.success && result.highlights) {
        this.applyHighlights(result.highlights);
        const message = `Found ${result.highlights.length} highlights for ${result.conceptsFound?.length || 0} concepts`;
        this.showNotification(message, 'success');
        console.log(`Applied ${result.highlights.length} highlights for concepts:`, result.conceptsFound);
      } else if (result.error) {
        this.showNotification(`Analysis failed: ${result.error}`, 'error');
        console.error('Analysis failed:', result.error);
      } else {
        this.showNotification('No concept-related content found on this page', 'info');
      }

    } catch (error) {
      console.error('Page analysis error:', error);
      this.showNotification('Analysis error. Please try again.', 'error');
    } finally {
      this.isAnalyzing = false;
      this.updateIconAppearance();
    }
  }
  
  extractPageContent() {
    // Check if this is a Google Patents page
    if (this.isGooglePatentsPage()) {
      return this.extractGooglePatentsContent();
    }

    // Get main content, avoiding navigation, ads, etc.
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      'body'
    ];

    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    if (!contentElement) {
      contentElement = document.body;
    }

    // Extract text content
    return contentElement.innerText || contentElement.textContent || '';
  }
  
  isGooglePatentsPage() {
    return window.location.hostname === 'patents.google.com' &&
           window.location.pathname.includes('/patent/');
  }

  extractGooglePatentsContent() {
    console.log('🔍 GOOGLE PATENTS: Starting content extraction');
    console.log('🌐 Current URL:', window.location.href);

    const patentContent = {
      title: '',
      abstract: '',
      claims: '',
      description: ''
    };

    try {
      // Extract title
      const titleElement = document.querySelector('h1#title, h1[id="title"]');
      if (titleElement) {
        patentContent.title = titleElement.textContent.trim();
      }

      // Extract abstract
      const abstractElement = document.querySelector('section#abstract patent-text, [id="abstract"] patent-text, .abstract');
      if (abstractElement) {
        patentContent.abstract = abstractElement.textContent.trim();
      }

      // Extract claims
      const claimsElements = document.querySelectorAll('section#claims patent-text, [id="claims"] patent-text, .claims patent-text, ol.claims li');
      if (claimsElements.length > 0) {
        patentContent.claims = Array.from(claimsElements)
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0)
          .join('\n\n');
      }

      // Extract description
      const descriptionElements = document.querySelectorAll('section#description patent-text, [id="description"] patent-text, .description-paragraph');
      if (descriptionElements.length > 0) {
        patentContent.description = Array.from(descriptionElements)
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0)
          .join('\n\n');
      }

      // Combine all content with clear sections - NO TRUNCATION
      const combinedContent = [
        patentContent.title ? `TITLE:\n${patentContent.title}\n` : '',
        patentContent.abstract ? `ABSTRACT:\n${patentContent.abstract}\n` : '',
        patentContent.claims ? `CLAIMS:\n${patentContent.claims}\n` : '',
        patentContent.description ? `DESCRIPTION:\n${patentContent.description}` : ''
      ].filter(section => section.length > 0).join('\n\n');

      console.log('🔍 GOOGLE PATENTS: Full content extracted (NO TRUNCATION):', {
        titleLength: patentContent.title.length,
        abstractLength: patentContent.abstract.length,
        claimsLength: patentContent.claims.length,
        descriptionLength: patentContent.description.length,
        totalLength: combinedContent.length,
        willUseMultipleQueries: combinedContent.length > 30000
      });

      if (combinedContent.length > 30000) {
        console.log('📄 Large patent content detected - will use multiple AI queries for complete analysis');
      }

      return combinedContent || 'No patent content found';

    } catch (error) {
      console.error('Error extracting Google Patents content:', error);
      return 'Error extracting patent content';
    }
  }

  analyzeContent(content) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime?.id) {
          resolve({ success: false, error: 'Extension context invalidated. Please reload the page.' });
          return;
        }

        console.log('🔍 CONTENT SCRIPT: Sending content to AI for analysis');
        console.log('📄 Content length:', content.length);
        console.log('🌐 Current URL:', window.location.href);
        console.log('📝 Content preview (first 500 chars):', content.substring(0, 500));
        console.log('📝 Content preview (last 500 chars):', content.substring(Math.max(0, content.length - 500)));

        const messageData = {
          action: 'analyzeContent',
          data: { content: content }
        };

        console.log('📤 Full message being sent to background script:', messageData);

        chrome.runtime.sendMessage(messageData, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error from background script:', chrome.runtime.lastError.message);
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('✅ Response received from background script:', response);
            resolve(response || { success: false, error: 'No response received' });
          }
        });
      } catch (error) {
        console.error('❌ Error in analyzeContent:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }
  
  applyHighlights(highlights) {
    // Clear existing highlights first
    this.clearHighlights();

    // Apply new highlights with colors, relevance levels, and explanations
    highlights.forEach((highlight, index) => {
      const conceptColors = this.getConceptColors(highlight.concepts);
      const relevance = highlight.relevance || 'medium'; // Default to medium if not specified
      const explanation = highlight.explanation || 'AI identified this as relevant';
      console.log(`Applying highlight ${index + 1}:`, highlight.text, 'with colors:', conceptColors, 'relevance:', relevance, 'explanation:', explanation);
      this.highlightText(highlight.text, highlight.concepts, conceptColors, relevance, explanation);
    });

    this.highlights = highlights;
    console.log(`Applied ${highlights.length} highlights with custom colors and relevance levels`);
  }

  getConceptColors(conceptNames) {
    const conceptsData = this.settings.concepts || [];
    const colors = {};

    console.log('Getting colors for concepts:', conceptNames);
    console.log('Available concept data:', conceptsData);

    conceptNames.forEach(conceptName => {
      // Find the concept data
      const conceptData = conceptsData.find(c => {
        const conceptText = typeof c === 'string' ? c : c.text;
        return conceptText && conceptText.toLowerCase() === conceptName.toLowerCase();
      });

      if (conceptData && typeof conceptData === 'object' && conceptData.color) {
        colors[conceptName] = conceptData.color;
        console.log(`Found color for "${conceptName}":`, conceptData.color);
      } else if (typeof conceptData === 'string') {
        // Old format, assign a default color
        colors[conceptName] = this.getRandomConceptColor();
        console.log(`Using random color for "${conceptName}":`, colors[conceptName]);
      } else {
        // Fallback to default color
        colors[conceptName] = '#a8edea';
        console.log(`Using fallback color for "${conceptName}":`, colors[conceptName]);
      }
    });

    return colors;
  }
  
  highlightText(text, concepts, conceptColors = {}, relevance = 'medium', explanation = '') {
    // Find and highlight text in the DOM
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, and already highlighted elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          if (parent.classList.contains('ai-concept-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
        textNodes.push(node);
      }
    }

    // Highlight matching text nodes
    textNodes.forEach(textNode => {
      const content = textNode.textContent;
      const lowerContent = content.toLowerCase();
      const lowerText = text.toLowerCase();
      const index = lowerContent.indexOf(lowerText);

      if (index !== -1) {
        const beforeText = content.substring(0, index);
        const matchText = content.substring(index, index + text.length);
        const afterText = content.substring(index + text.length);

        const span = document.createElement('span');
        span.className = 'ai-concept-highlight';
        span.textContent = matchText;

        // Apply custom color based on primary concept
        const primaryConcept = concepts[0];
        const color = conceptColors[primaryConcept] || '#a8edea';

        // Create a lighter version for background
        const lightColor = this.lightenColor(color, 0.85);

        // Apply styling based on relevance level
        const styling = this.getRelevanceStyles(relevance, color, lightColor);
        span.style.cssText = styling;

        // Add concept indicator with color, relevance, and explanation
        span.setAttribute('data-concept-color', color);
        span.setAttribute('data-concepts', concepts.join(', '));
        span.setAttribute('data-relevance', relevance);

        // Store explanation from the highlight data
        const finalExplanation = explanation || 'AI identified this as relevant';
        span.setAttribute('data-explanation', finalExplanation);

        // Add hover event to show concept info
        span.addEventListener('mouseenter', () => {
          const explanation = span.getAttribute('data-explanation') || 'No explanation provided';
          span.title = `Concepts: ${concepts.join(', ')}\nRelevance: ${relevance.toUpperCase()}\nExplanation: ${explanation}`;
        });

        const parent = textNode.parentNode;

        if (beforeText) {
          parent.insertBefore(document.createTextNode(beforeText), textNode);
        }

        parent.insertBefore(span, textNode);

        if (afterText) {
          parent.insertBefore(document.createTextNode(afterText), textNode);
        }

        parent.removeChild(textNode);
      }
    });
  }

  getRelevanceStyles(relevance, color, lightColor) {
    const baseStyles = `
      border-radius: 3px !important;
      padding: 2px 4px !important;
      margin: 0 1px !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
      position: relative !important;
      display: inline !important;
    `;

    switch (relevance.toLowerCase()) {
      case 'high':
        return baseStyles + `
          background-color: ${lightColor} !important;
          border-left: 4px solid ${color} !important;
          font-weight: bold !important;
          text-decoration: underline !important;
          text-decoration-color: ${color} !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
        `;

      case 'medium':
        return baseStyles + `
          background-color: ${lightColor} !important;
          border-left: 3px solid ${color} !important;
          text-decoration: underline !important;
          text-decoration-color: ${color} !important;
        `;

      case 'low':
      default:
        return baseStyles + `
          background-color: ${lightColor} !important;
          border-left: 2px solid ${color} !important;
        `;
    }
  }

  lightenColor(color, amount) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Lighten by mixing with white
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  clearHighlights() {
    const highlights = document.querySelectorAll('.ai-concept-highlight');
    console.log(`Clearing ${highlights.length} existing highlights`);

    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.insertBefore(document.createTextNode(highlight.textContent), highlight);
        parent.removeChild(highlight);
        parent.normalize(); // Merge adjacent text nodes
      }
    });

    this.highlights = [];
  }
  
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.ai-concept-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `ai-concept-notification ai-concept-notification-${type}`;
    notification.innerHTML = `
      <div class="ai-concept-notification-content">
        <span class="ai-concept-notification-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span class="ai-concept-notification-text">${message}</span>
        <button class="ai-concept-notification-close">&times;</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: white;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .ai-concept-notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #333;
      }
      .ai-concept-notification-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        margin-left: auto;
      }
      .ai-concept-notification-close:hover {
        color: #333;
      }
    `;

    if (!document.querySelector('#ai-concept-notification-styles')) {
      style.id = 'ai-concept-notification-styles';
      document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Add close event
    notification.querySelector('.ai-concept-notification-close').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        switch (request.action) {
          case 'settingsChanged':
            this.settings = request.settings;
            this.updateIconAppearance();
            if (request.settings.enabled && request.settings.autoAnalyze !== false) {
              this.analyzeCurrentPage();
            } else if (!request.settings.enabled) {
              this.clearHighlights();
            }
            break;

          case 'initializeExtension':
            this.settings = request.settings;
            this.updateIconAppearance();
            break;

          case 'analyzeCurrentPage':
            this.analyzeCurrentPage();
            break;

          case 'clearHighlights':
            this.clearHighlights();
            break;

          default:
            console.warn('Unknown message action:', request.action);
        }
      } catch (error) {
        console.error('Message handler error:', error);
      }
    });
  }
}

// Initialize the extension when the script loads
const aiConceptHighlighter = new AIConceptHighlighter();
