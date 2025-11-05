# Rexa Chat Widget Embed Script Documentation

## Overview

The Rexa Chat Widget embed script allows you to easily integrate a chat widget into any website. The script is designed to be lightweight, responsive, and fully functional across all modern browsers.

## Files Created

### 1. `/public/embed.min.js`
The main embed script that handles:
- Widget initialization and configuration
- Chat button creation and styling
- Iframe management for the chat interface
- Mobile responsiveness
- Message handling and notifications
- Public API for programmatic control

### 2. `/public/test-embed.html`
A test page to verify the embed script functionality with:
- Visual testing interface
- Programmatic control buttons
- Integration code examples
- Feature demonstration

## Integration Methods

### Method 1: Standard Embed Script (Recommended)

```html
<script>
(function(){
  if(!window.rexaChat || window.rexaChat("getState") !== "initialized") {
    window.rexaChat = (...arguments) => {
      if(!window.rexaChat.q) { window.rexaChat.q = [] }
      window.rexaChat.q.push(arguments)
    };
    window.rexaChat = new Proxy(window.rexaChat, {
      get(target, prop) {
        if(prop === "q") { return target.q }
        return (...args) => target(prop, ...args)
      }
    })
  }

  const onLoad = function() {
    const script = document.createElement("script");
    script.src = "http://localhost:3001/embed.min.js";
    script.id = "CHANNEL_ID";
    script.setAttribute("data-agent-id", "AGENT_ID");
    script.setAttribute("data-workspace", "WORKSPACE_SLUG");
    document.body.appendChild(script);
  };

  if(document.readyState === "complete") {
    onLoad()
  } else {
    window.addEventListener("load", onLoad)
  }
})();
</script>
```

### Method 2: Direct Script Include

```html
<script 
  src="http://localhost:3001/embed.min.js" 
  id="CHANNEL_ID"
  data-agent-id="AGENT_ID" 
  data-workspace="WORKSPACE_SLUG">
</script>
```

### Method 3: Direct Iframe Embed

For simple iframe embedding without the widget functionality:

```html
<iframe 
  src="http://localhost:3001/chat/WORKSPACE_SLUG/AGENT_ID/CHANNEL_ID" 
  width="100%" 
  style="height: 100%; min-height: 700px" 
  frameborder="0">
</iframe>
```

## Configuration Options

The embed script accepts the following data attributes:

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-agent-id` | Yes | - | The unique agent identifier |
| `data-workspace` | Yes | - | The workspace slug |
| `data-base-url` | No | `http://localhost:3001` | Base URL for the chat service |
| `data-position` | No | `bottom-right` | Widget position (`bottom-right`, `bottom-left`, `top-right`, `top-left`) |
| `data-theme` | No | `light` | Widget theme (`light`, `dark`) |

## Public API

The embed script exposes a global `rexaChat` function with the following methods:

### Core Methods

```javascript
// Initialize the widget (called automatically)
rexaChat('init');

// Open the chat widget
rexaChat('open');

// Close the chat widget
rexaChat('close');

// Toggle the chat widget
rexaChat('toggle');

// Check if widget is open
rexaChat('isOpen'); // returns boolean

// Get initialization state
rexaChat('getState'); // returns 'initialized'
```

### Notification Methods

```javascript
// Show notification dot
rexaChat('showNotification');

// Hide notification dot
rexaChat('hideNotification');
```

## Features

### 1. Responsive Design
- **Desktop**: 400x600px chat window positioned relative to button
- **Mobile**: Full-screen overlay with proper spacing
- **Automatic**: Switches based on screen width (768px breakpoint)

### 2. Visual Elements
- **Chat Button**: Circular button with chat icon
- **Hover Effects**: Scale and shadow animations
- **Notification Dot**: Pulsing red dot for new messages
- **Smooth Transitions**: CSS transitions for all interactions

### 3. Message Handling
- **Cross-Origin Communication**: Secure postMessage API
- **Event Types**:
  - `NEW_MESSAGE`: Shows notification when chat is closed
  - `WIDGET_READY`: Iframe loaded and ready
  - `MINIMIZE_WIDGET`: Close widget programmatically
  - `RESIZE_WIDGET`: Adjust iframe height

### 4. Mobile Optimizations
- **Touch-Friendly**: Proper touch targets and gestures
- **Full-Screen**: Mobile chat takes full viewport
- **Outside Click**: Close chat when clicking outside on mobile
- **Responsive Iframe**: Adjusts to screen size automatically

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Features Used**:
  - ES6 Proxy (for API)
  - PostMessage API (for iframe communication)
  - CSS Flexbox (for layout)
  - CSS Transitions (for animations)

## Security Features

### 1. Origin Validation
```javascript
window.addEventListener('message', function(event) {
  if (event.origin !== config.baseUrl) return;
  // Process message
});
```

### 2. Content Security Policy (CSP) Friendly
- No inline styles in HTML
- All styles applied via JavaScript
- No eval() or unsafe operations

### 3. Iframe Sandboxing
```javascript
iframe.allow = 'microphone; camera'; // Only necessary permissions
```

## Performance Optimizations

### 1. Lazy Loading
- Widget only loads when script is executed
- Iframe created on demand
- Configuration fetched asynchronously

### 2. Minimal DOM Impact
- Single container element
- Event delegation where possible
- Cleanup on widget removal

### 3. Network Efficiency
- Compressed embed script
- Cached configuration requests
- Minimal API calls

## Troubleshooting

### Common Issues

1. **Widget Not Appearing**
   - Check console for JavaScript errors
   - Verify `data-agent-id` and `data-workspace` attributes
   - Ensure embed.min.js is accessible

2. **Iframe Not Loading**
   - Check network tab for 404 errors
   - Verify base URL configuration
   - Check CORS settings

3. **Mobile Issues**
   - Test viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
   - Check for CSS conflicts
   - Verify touch event handling

### Debug Mode

Enable debug logging by adding to console:
```javascript
window.rexaChatDebug = true;
```

## Testing

### Manual Testing Checklist

- [ ] Widget button appears in correct position
- [ ] Click opens/closes chat interface
- [ ] Hover effects work on desktop
- [ ] Mobile responsive behavior
- [ ] Notification dot appears/disappears
- [ ] Programmatic API functions work
- [ ] Cross-browser compatibility
- [ ] Performance on slow connections

### Automated Testing

Use the test page at `/test-embed.html` to verify:
- Basic functionality
- API methods
- Visual appearance
- Responsive behavior

## Deployment

### Production Checklist

1. **Update Base URL**: Change from localhost to production domain
2. **Minification**: Ensure embed.min.js is properly minified
3. **CDN**: Consider serving from CDN for better performance
4. **SSL**: Ensure HTTPS for production deployments
5. **Analytics**: Add tracking for widget interactions
6. **Error Monitoring**: Implement error reporting

### Example Production Script

```html
<script>
(function(){
  if(!window.rexaChat || window.rexaChat("getState") !== "initialized") {
    window.rexaChat = (...arguments) => {
      if(!window.rexaChat.q) { window.rexaChat.q = [] }
      window.rexaChat.q.push(arguments)
    };
    window.rexaChat = new Proxy(window.rexaChat, {
      get(target, prop) {
        if(prop === "q") { return target.q }
        return (...args) => target(prop, ...args)
      }
    })
  }

  const onLoad = function() {
    const script = document.createElement("script");
    script.src = "https://your-domain.com/embed.min.js";
    script.id = "your-channel-id";
    script.setAttribute("data-agent-id", "your-agent-id");
    script.setAttribute("data-workspace", "your-workspace");
    document.body.appendChild(script);
  };

  if(document.readyState === "complete") {
    onLoad()
  } else {
    window.addEventListener("load", onLoad)
  }
})();
</script>
```

### Development Script (localhost:3001)

```html
<script>
(function(){
  if(!window.rexaChat || window.rexaChat("getState") !== "initialized") {
    window.rexaChat = (...arguments) => {
      if(!window.rexaChat.q) { window.rexaChat.q = [] }
      window.rexaChat.q.push(arguments)
    };
    window.rexaChat = new Proxy(window.rexaChat, {
      get(target, prop) {
        if(prop === "q") { return target.q }
        return (...args) => target(prop, ...args)
      }
    })
  }

  const onLoad = function() {
    const script = document.createElement("script");
    script.src = "http://localhost:3001/embed.min.js";
    script.id = "p3pLCzxDV3E5DGYWIgOu";
    script.setAttribute("data-agent-id", "XHptkClQCsVUHa8obTrm");
    script.setAttribute("data-workspace", "rasheed-m");
    document.body.appendChild(script);
  };

  if(document.readyState === "complete") {
    onLoad()
  } else {
    window.addEventListener("load", onLoad)
  }
})();
</script>
```

## Support

For technical support or feature requests, please refer to the main documentation or contact the development team.