# PostHog Integration Guide

This application uses PostHog for product analytics, feature flags, and session replay.

## Setup

### 1. Install Dependencies

The PostHog JavaScript library is already added to `package.json`. Install it by running:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_rnE16KOjuZNtwCGxy3O4XUYhCkg9ZOPmBjkLuQP0Gd7
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Note:** Make sure to add these same variables to your hosting provider (Vercel, Netlify, AWS, etc.) if deploying.

### 3. Configuration

PostHog is initialized in `instrumentation-client.ts` using Next.js 15.3+ instrumentation hook. The configuration includes:

- **Session Recording**: Enabled with masking for sensitive inputs
- **Page View Tracking**: Automatic page view tracking
- **Person Profiles**: Only for identified users

## Usage

### Tracking Events

Import the `events` object from `@/app/lib/posthog`:

```typescript
import { events } from '@/app/lib/posthog';

// Track a button click
events.buttonClicked('Button Name', 'location');

// Track form submission
events.formSubmitted('Form Name', true); // true = success

// Track feature usage
events.featureUsed('Feature Name', { additional: 'context' });
```

### Available Event Types

#### Authentication Events
- `events.signUp(method)` - User signs up (Google/Email)
- `events.signIn(method)` - User signs in
- `events.signOut()` - User signs out

#### Workspace Events
- `events.workspaceCreated(workspaceId, workspaceName)` - Workspace created
- `events.workspaceSwitched(workspaceId, workspaceName)` - Workspace switched

#### Agent Events
- `events.agentCreated(agentId, agentName)` - Agent created
- `events.agentDeleted(agentId)` - Agent deleted
- `events.agentDeployed(agentId, channel)` - Agent deployed to channel

#### Knowledge Base Events
- `events.knowledgeBaseItemAdded(itemType, itemId)` - KB item added
- `events.knowledgeBaseItemDeleted(itemId)` - KB item deleted

#### Chat/Conversation Events
- `events.conversationStarted(agentId, channel)` - Conversation started
- `events.messageSent(agentId, messageLength)` - Message sent
- `events.messageReceived(agentId)` - Message received

#### Widget Events
- `events.widgetEmbedded(agentId)` - Widget embedded
- `events.widgetCustomized(agentId, customizations)` - Widget customized

#### UI Events
- `events.buttonClicked(buttonName, location)` - Button clicked
- `events.linkClicked(linkUrl, linkText)` - Link clicked
- `events.formSubmitted(formName, success)` - Form submitted
- `events.formAbandoned(formName, step)` - Form abandoned

#### Feature Usage
- `events.featureUsed(featureName, context)` - Feature used

#### Error Tracking
- `events.errorOccurred(errorMessage, errorType, context)` - Error occurred

### User Identification

Users are automatically identified when they sign in. To manually identify a user:

```typescript
import { identifyUser } from '@/app/lib/posthog';

identifyUser(userId, {
  email: 'user@example.com',
  name: 'John Doe',
  // ... other properties
});
```

### Reset User (on logout)

```typescript
import { resetUser } from '@/app/lib/posthog';

resetUser();
```

### Custom Event Tracking

For custom events not covered by the predefined functions:

```typescript
import { trackEvent } from '@/app/lib/posthog';

trackEvent('custom_event_name', {
  property1: 'value1',
  property2: 'value2',
});
```

## Session Replay

Session replay is automatically enabled. To mask sensitive data:

1. Add `data-ph-mask` attribute to inputs you want to mask:
   ```html
   <input type="password" data-ph-mask />
   ```

2. Add `data-ph-block` attribute to elements you want to completely block:
   ```html
   <div data-ph-block>Sensitive content</div>
   ```

3. Add `ph-ignore` class to elements you want to ignore:
   ```html
   <div className="ph-ignore">Ignored content</div>
   ```

## Already Tracked Events

The following events are already tracked automatically:

### Authentication
- ✅ User sign up (Google/Email)
- ✅ User sign in (Google/Email)
- ✅ User sign out

### Workspace Management
- ✅ Workspace creation
- ✅ Workspace switching

### Navigation
- ✅ Page views (automatic)
- ✅ Button clicks (Navbar, Hero)
- ✅ Link clicks (Navbar)

### UI Interactions
- ✅ Hero CTA buttons
- ✅ Navbar buttons

## Adding New Event Tracking

To add tracking to a new component:

1. Import the events object:
   ```typescript
   import { events } from '@/app/lib/posthog';
   ```

2. Add tracking to the relevant action:
   ```typescript
   const handleAction = () => {
     events.featureUsed('Feature Name', { context: 'value' });
     // ... rest of your code
   };
   ```

## Viewing Analytics

1. Go to your PostHog dashboard: https://app.posthog.com
2. Navigate to **Insights** to see event analytics
3. Navigate to **Recordings** to view session replays
4. Navigate to **Persons** to see user profiles

## Privacy & Compliance

- Session recordings respect user privacy with automatic masking
- Only identified users have person profiles created
- Sensitive data can be masked using data attributes
- All tracking respects user consent (can be extended with consent management)

## Troubleshooting

### Events not appearing in PostHog

1. Check that environment variables are set correctly
2. Verify PostHog is initialized (check browser console)
3. Ensure you're using the correct project API key
4. Check network tab for PostHog API calls

### Session replay not working

1. Verify session recording is enabled in PostHog project settings
2. Check browser console for errors
3. Ensure `NEXT_PUBLIC_POSTHOG_KEY` is set correctly

### Development Mode

In development, PostHog logs initialization to the console. Check the browser console for "PostHog initialized" message.

