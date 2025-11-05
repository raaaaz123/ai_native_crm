# Chat Widget Implementation Approaches

This document compares two different approaches for implementing chat widgets: **Embed Script** vs **Next.js Components**.

## 🎯 Overview

We provide **two different approaches** for integrating chat widgets, each optimized for different use cases:

1. **Embed Script (`embed.min.js`)** - Universal JavaScript for any website
2. **Next.js Components** - React components for Next.js/React applications

## 📊 Comparison Table

| Feature | Embed Script | Next.js Components |
|---------|-------------|-------------------|
| **Compatibility** | ✅ Any website/framework | ❌ Next.js/React only |
| **Bundle Size** | ✅ ~15KB standalone | ❌ Requires React (~40KB+) |
| **Developer Experience** | ❌ Vanilla JavaScript | ✅ TypeScript + React |
| **SSR Support** | ❌ Client-side only | ✅ Server-side rendering |
| **State Integration** | ❌ Limited | ✅ Full React state |
| **Styling** | ❌ CSS-in-JS only | ✅ Tailwind, CSS modules |
| **Testing** | ❌ Manual testing | ✅ React Testing Library |
| **Maintenance** | ❌ Harder to maintain | ✅ Component-based |
| **Performance** | ✅ Lightweight | ❌ Larger bundle |
| **Cross-Domain** | ✅ Works anywhere | ❌ Same-origin preferred |

## 🚀 Approach 1: Embed Script (Universal)

### **Use Cases**
- WordPress, Shopify, or any CMS
- Static HTML websites
- Non-React applications
- Third-party integrations
- Maximum compatibility needed

### **Implementation**

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

### **API Methods**
```javascript
// Control the widget programmatically
rexaChat('open');           // Open chat
rexaChat('close');          // Close chat
rexaChat('toggle');         // Toggle open/close
rexaChat('showNotification'); // Show notification dot
rexaChat('hideNotification'); // Hide notification dot
rexaChat('isOpen');         // Check if open
rexaChat('debug');          // Get debug info
```

### **Advantages**
- ✅ Works on **any website** (WordPress, Shopify, static HTML)
- ✅ **Lightweight** - no framework dependencies
- ✅ **Easy integration** - just add script tag
- ✅ **Cross-domain** compatible
- ✅ **CDN friendly** for global distribution

### **Disadvantages**
- ❌ Vanilla JavaScript - harder to maintain
- ❌ No SSR benefits
- ❌ Limited styling options
- ❌ Harder to test

## ⚛️ Approach 2: Next.js Components (React)

### **Use Cases**
- Next.js applications
- React applications
- When you need SSR/SSG
- Better developer experience needed
- Integration with existing React state

### **Implementation**

#### **Chat Widget Component**
```tsx
import { ChatWidget } from '@/app/components/chat-widget';

export default function MyPage() {
  return (
    <div>
      <h1>My Website</h1>
      
      <ChatWidget
        agentId="XHptkClQCsVUHa8obTrm"
        workspaceSlug="rasheed-m"
        channelId="p3pLCzxDV3E5DGYWIgOu"
        baseUrl="http://localhost:3001"
        position="bottom-right"
        theme="light"
        primaryColor="#3B82F6"
      />
    </div>
  );
}
```

#### **Chat Iframe Component**
```tsx
import { ChatIframe } from '@/app/components/chat-widget';

export default function SupportPage() {
  return (
    <div className="container mx-auto p-8">
      <h1>Customer Support</h1>
      
      <ChatIframe
        agentId="XHptkClQCsVUHa8obTrm"
        workspaceSlug="rasheed-m"
        channelId="p3pLCzxDV3E5DGYWIgOu"
        width="100%"
        height={600}
        onLoad={() => console.log('Chat loaded')}
        onError={(error) => console.error('Chat error:', error)}
      />
    </div>
  );
}
```

### **Component Props**

#### **ChatWidget Props**
```typescript
interface ChatWidgetProps {
  agentId: string;
  workspaceSlug: string;
  channelId: string;
  baseUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  theme?: 'light' | 'dark';
  className?: string;
}
```

#### **ChatIframe Props**
```typescript
interface ChatIframeProps {
  agentId: string;
  workspaceSlug: string;
  channelId: string;
  baseUrl?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}
```

### **Advantages**
- ✅ **TypeScript support** with full type safety
- ✅ **React hooks** for state management
- ✅ **SSR/SSG support** for better SEO
- ✅ **Easy styling** with Tailwind, CSS modules
- ✅ **Better testing** with React Testing Library
- ✅ **Component reuse** and composition
- ✅ **State integration** with parent app

### **Disadvantages**
- ❌ **Next.js/React only** - not universal
- ❌ **Larger bundle** size due to React
- ❌ **Framework dependency** required

## 🎯 When to Use Which Approach?

### **Use Embed Script When:**
- 🌐 **Universal compatibility** is required
- 📦 **Bundle size** is critical
- 🔧 **Easy integration** is priority
- 🌍 **Cross-domain** deployment needed
- 📱 **Third-party** websites integration

### **Use Next.js Components When:**
- ⚛️ **React/Next.js** application
- 🛠️ **Better DX** is important
- 🎨 **Advanced styling** needed
- 🧪 **Testing** is required
- 🔄 **State integration** needed
- 🚀 **SSR/SSG** benefits wanted

## 📁 File Structure

```
app/
├── components/
│   └── chat-widget/
│       ├── ChatWidget.tsx      # React widget component
│       ├── ChatIframe.tsx      # React iframe component
│       └── index.ts            # Exports
├── demo/
│   └── chat-components/
│       └── page.tsx            # Demo page
public/
├── embed.min.js                # Universal embed script
├── test-embed.html             # Embed script test
└── simple-test.html            # Simple embed test
```

## 🚀 Getting Started

### **Option 1: Try the Embed Script**
1. Visit: `http://localhost:3001/test-embed.html`
2. Test the widget functionality
3. Copy the embed code for your website

### **Option 2: Try Next.js Components**
1. Visit: `http://localhost:3001/demo/chat-components`
2. Test both widget and iframe components
3. Copy the React code for your Next.js app

## 🔧 Customization

### **Embed Script Customization**
- Modify `embed.min.js` for behavior changes
- Use data attributes for configuration
- CSS-in-JS for styling

### **Component Customization**
- Props for configuration
- Tailwind classes for styling
- React hooks for behavior
- TypeScript for type safety

## 📈 Performance Comparison

| Metric | Embed Script | Next.js Components |
|--------|-------------|-------------------|
| **Initial Load** | ~15KB | ~45KB (with React) |
| **Runtime Memory** | ~2MB | ~5MB (with React) |
| **First Paint** | Fast | Faster (with SSR) |
| **Interactivity** | Good | Excellent |
| **Bundle Impact** | Minimal | Moderate |

## 🎉 Conclusion

Both approaches have their place:

- **Embed Script** = **Universal compatibility** and **lightweight**
- **Next.js Components** = **Better developer experience** and **advanced features**

Choose based on your specific needs, target audience, and technical constraints. You can even use both approaches in different parts of your application ecosystem!

## 🔗 Demo Links

- **Embed Script Demo**: [http://localhost:3001/test-embed.html](http://localhost:3001/test-embed.html)
- **Next.js Components Demo**: [http://localhost:3001/demo/chat-components](http://localhost:3001/demo/chat-components)
- **Simple Embed Test**: [http://localhost:3001/simple-test.html](http://localhost:3001/simple-test.html)