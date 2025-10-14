# Widget Customizer Feature

## Overview
The Widget Customizer is a comprehensive tool that allows users to customize their chat support widgets in real-time with a live preview. It provides a modern, intuitive interface for modifying widget appearance, behavior, and settings.

## Features

### 🎨 Real-time Preview
- **Live Preview**: See changes instantly as you customize
- **Mobile & Desktop Views**: Toggle between different screen sizes
- **Crispy Chat Bot Interface**: Modern, professional-looking chat widget preview
- **Interactive Demo**: Test the widget functionality within the preview

### 🛠️ Customization Options

#### Basic Settings
- **Widget Name**: Customize the display name
- **Welcome Message**: Set the initial greeting message
- **Button Text**: Customize the chat button text
- **Placeholder Text**: Set the input field placeholder
- **Offline Message**: Configure the offline state message

#### Appearance
- **Primary Color**: Color picker with hex input support
- **Position**: Choose between bottom-right and bottom-left placement
- **Real-time Color Updates**: Instant visual feedback

#### Data Collection
- **Email Collection**: Toggle email requirement
- **Phone Collection**: Toggle phone number requirement
- **Auto Reply**: Configure automatic response messages

#### Business Hours
- **Timezone Support**: Configure business hours
- **Day-specific Settings**: Enable/disable and set hours for each day
- **Online/Offline Status**: Visual indicators based on business hours

### 🔧 Technical Implementation

#### File Structure
```
app/dashboard/widget-customizer/
├── page.tsx              # Main customization page
└── WidgetPreview.tsx     # Live preview component
```

#### Key Components

**Main Page (`page.tsx`)**
- Widget selection sidebar
- Customization form panels
- Preview controls
- Save/reset functionality

**Preview Component (`WidgetPreview.tsx`)**
- Interactive chat widget simulation
- Real-time styling updates
- Mobile/desktop responsive design
- Mock conversation flow

#### Data Flow
1. **Load Widgets**: Fetch user's existing widgets from Firestore
2. **Select Widget**: Choose which widget to customize
3. **Live Updates**: Changes reflect immediately in preview
4. **Save Changes**: Persist customizations to Firestore
5. **Real-time Sync**: Updates propagate to live widgets

### 🎯 User Experience

#### Navigation
- **Sidebar Integration**: New "Widget Customizer" menu item with palette icon
- **Intuitive Layout**: Three-panel design (selection, customization, preview)
- **Responsive Design**: Works seamlessly on desktop and mobile

#### Preview Features
- **Chat Simulation**: Interactive demo with mock messages
- **Form Handling**: Real user info collection simulation
- **Business Hours**: Live online/offline status indicators
- **Smooth Animations**: Professional transitions and hover effects

### 🔄 Integration

#### Database Integration
- **Firestore**: Uses existing `chatWidgets` collection
- **Real-time Updates**: Leverages Firestore's real-time capabilities
- **Data Validation**: Ensures data integrity and proper formatting

#### Existing Systems
- **Chat Utils**: Integrates with existing `getBusinessWidgets` and `updateChatWidget`
- **Auth System**: Uses current authentication context
- **UI Components**: Leverages existing design system components

### 🚀 Usage

1. **Access**: Navigate to Dashboard → Widget Customizer
2. **Select**: Choose a widget from the sidebar
3. **Customize**: Modify settings in the middle panel
4. **Preview**: See changes in real-time on the right
5. **Save**: Click save to persist changes

### 🎨 Preview Features

The preview widget includes:
- **Professional Design**: Modern, clean interface
- **Interactive Elements**: Clickable buttons and inputs
- **Mock Conversations**: Simulated chat flow
- **Status Indicators**: Online/offline status with visual cues
- **Responsive Behavior**: Adapts to mobile/desktop preview modes

### 💡 Benefits

- **User-Friendly**: Intuitive interface for non-technical users
- **Real-time Feedback**: Instant visual confirmation of changes
- **Professional Results**: Creates polished, branded chat widgets
- **Efficient Workflow**: All customization in one place
- **Mobile Optimized**: Responsive design for all devices

### 🔮 Future Enhancements

Potential future improvements:
- **Template Gallery**: Pre-designed widget templates
- **Advanced Styling**: Custom CSS injection
- **Widget Analytics**: Usage statistics and insights
- **A/B Testing**: Multiple widget variants
- **Export/Import**: Widget configuration sharing

## Technical Notes

- Built with React/Next.js and TypeScript
- Uses Firestore for data persistence
- Leverages existing UI component library
- Fully responsive and mobile-optimized
- Real-time updates with optimistic UI
- Error handling and validation included

This feature provides a complete widget customization solution that empowers users to create professional, branded chat widgets without technical knowledge.
