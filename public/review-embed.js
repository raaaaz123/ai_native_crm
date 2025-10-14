(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    baseUrl: window.location.origin,
    widgetId: null,
    position: 'bottom-right',
    buttonText: 'Leave a Review',
    primaryColor: '#3b82f6',
    buttonSize: 'medium'
  };

  // Get widget configuration from script tag
  function getConfig() {
    const script = document.querySelector('script[data-widget-id]');
    if (script) {
      CONFIG.widgetId = script.getAttribute('data-widget-id');
      CONFIG.position = script.getAttribute('data-position') || 'bottom-right';
      CONFIG.buttonText = script.getAttribute('data-button-text') || 'Leave a Review';
      CONFIG.primaryColor = script.getAttribute('data-primary-color') || '#3b82f6';
      CONFIG.buttonSize = script.getAttribute('data-button-size') || 'medium';
    }
  }

  // Create widget button
  function createWidgetButton() {
    if (!CONFIG.widgetId) {
      console.error('Review widget: No widget ID provided');
      return;
    }

    const button = document.createElement('button');
    button.id = 'review-widget-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        ${CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        ${CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        z-index: 9999;
        background: ${CONFIG.primaryColor};
        color: white;
        border: none;
        border-radius: 50px;
        padding: ${CONFIG.buttonSize === 'large' ? '16px 24px' : CONFIG.buttonSize === 'small' ? '8px 16px' : '12px 20px'};
        font-size: ${CONFIG.buttonSize === 'large' ? '16px' : CONFIG.buttonSize === 'small' ? '12px' : '14px'};
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        ${CONFIG.buttonText}
      </div>
    `;

    button.addEventListener('click', openReviewForm);
    document.body.appendChild(button);
  }

  // Open review form
  function openReviewForm() {
    const url = `${CONFIG.baseUrl}/review/${CONFIG.widgetId}`;
    
    // Check if we should open in popup or new tab
    const openInPopup = window.innerWidth > 768; // Open popup on desktop, new tab on mobile
    
    if (openInPopup) {
      const popup = window.open(
        url,
        'reviewForm',
        'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (popup) {
        popup.focus();
      }
    } else {
      window.open(url, '_blank');
    }
  }

  // Initialize widget
  function init() {
    getConfig();
    createWidgetButton();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global functions for external control
  window.ReviewWidget = {
    open: openReviewForm,
    close: function() {
      const button = document.getElementById('review-widget-button');
      if (button) {
        button.remove();
      }
    },
    show: function() {
      const button = document.getElementById('review-widget-button');
      if (button) {
        button.style.display = 'block';
      }
    },
    hide: function() {
      const button = document.getElementById('review-widget-button');
      if (button) {
        button.style.display = 'none';
      }
    }
  };

})();
