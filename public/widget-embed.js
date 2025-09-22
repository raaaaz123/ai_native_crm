(function() {
  'use strict';
  
  // Get widget configuration from script tag
  const script = document.currentScript || document.querySelector('script[data-widget-id]');
  const widgetId = script?.getAttribute('data-widget-id');
  
  if (!widgetId) {
    console.error('Chat Widget: No widget ID provided');
    return;
  }

  // Widget configuration
  const config = {
    widgetId: widgetId,
    baseUrl: script?.getAttribute('data-base-url') || window.location.origin,
    position: script?.getAttribute('data-position') || 'bottom-right'
  };

  // Create widget container
  async function createWidget() {
    // Check if widget already exists
    if (document.getElementById('chat-widget-container')) {
      return;
    }

    // Fetch widget configuration
     let widgetConfig = null;
     try {
       const response = await fetch(`${baseUrl}/api/widget/${widgetId}`);
       if (response.ok) {
         widgetConfig = await response.json();
       }
     } catch (error) {
       console.warn('Could not fetch widget config, using defaults');
     }

    const buttonText = widgetConfig?.buttonText || 'Chat with us';
    const primaryColor = widgetConfig?.primaryColor || '#3B82F6';

    // Create container
    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.style.cssText = `
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create chat button
    const chatButton = document.createElement('button');
    chatButton.id = 'chat-widget-button';
    chatButton.title = buttonText;
    chatButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    `;
    chatButton.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;

    // Create iframe for chat
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-widget-iframe';
    iframe.src = `${config.baseUrl}/widget/${config.widgetId}`;
    iframe.style.cssText = `
      width: 400px;
      height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      background: white;
      display: none;
      position: absolute;
      ${config.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
      ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
    `;

    // Mobile responsive
    if (window.innerWidth <= 768) {
      iframe.style.cssText += `
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        width: auto;
        height: auto;
      `;
    }

    // Button hover effects
    chatButton.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    });

    chatButton.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Toggle chat
    let isOpen = false;
    chatButton.addEventListener('click', function() {
      isOpen = !isOpen;
      iframe.style.display = isOpen ? 'block' : 'none';
      
      // Update button icon
      if (isOpen) {
        chatButton.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      } else {
        chatButton.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        `;
      }
    });

    // Close chat when clicking outside (for mobile)
    document.addEventListener('click', function(e) {
      if (isOpen && !container.contains(e.target)) {
        isOpen = false;
        iframe.style.display = 'none';
        chatButton.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        `;
      }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768) {
        iframe.style.cssText = iframe.style.cssText.replace(
          /width: 400px; height: 600px;.*?right: 0;/,
          `width: calc(100vw - 40px);
           height: calc(100vh - 100px);
           position: fixed;
           top: 20px;
           left: 20px;
           right: 20px;
           bottom: 20px;
           width: auto;
           height: auto;`
        );
      } else {
        iframe.style.cssText = `
          width: 400px;
          height: 600px;
          border: none;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          background: white;
          display: ${isOpen ? 'block' : 'none'};
          position: absolute;
          ${config.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
          ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
        `;
      }
    });

    // Append elements
    container.appendChild(chatButton);
    container.appendChild(iframe);
    document.body.appendChild(container);

    // Add notification dot (optional)
    const notificationDot = document.createElement('div');
    notificationDot.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #EF4444;
      border-radius: 50%;
      border: 2px solid white;
      display: none;
    `;
    chatButton.appendChild(notificationDot);

    // Listen for messages from iframe (optional)
    window.addEventListener('message', function(event) {
      if (event.origin !== config.baseUrl) return;
      
      if (event.data.type === 'CHAT_WIDGET_NEW_MESSAGE') {
        // Show notification dot
        notificationDot.style.display = 'block';
      }
      
      if (event.data.type === 'CHAT_WIDGET_OPENED') {
        // Hide notification dot
        notificationDot.style.display = 'none';
      }
    });
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();