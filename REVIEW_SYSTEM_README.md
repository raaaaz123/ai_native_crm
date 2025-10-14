# Review Forms System

A comprehensive review and feedback collection system built with Next.js and FastAPI.

## Features

### 🎯 Form Builder
- **Drag & Drop Interface**: Easy form creation with visual field builder
- **Multiple Field Types**: Text, textarea, rating (stars/hearts/thumbs), select, checkbox, email, phone, date
- **Field Configuration**: Required/optional fields, custom labels, placeholders
- **Rating Customization**: Min/max values, different rating types
- **Form Settings**: Anonymous submissions, email requirements, progress bars, custom thank you messages

### 📊 Analytics Dashboard
- **Submission Metrics**: Total submissions, completion rates, average ratings
- **Geographic Analytics**: Location-based insights with country/region/city data
- **Device Analytics**: Platform and browser usage statistics
- **Field Analytics**: Response analysis for each form field
- **Export Functionality**: CSV export of all submission data

### 🔗 Sharing & Embedding
- **Direct Links**: Shareable URLs for form access
- **Embed Widget**: JavaScript widget for website integration
- **Customizable Widget**: Button text, colors, position, size options
- **Responsive Design**: Works on desktop and mobile devices

### 📱 User Experience
- **Mobile-First Design**: Optimized for all screen sizes
- **Progress Indicators**: Visual progress bars during form completion
- **Real-time Validation**: Instant feedback on required fields
- **Anonymous Support**: Optional anonymous submissions
- **Location Tracking**: Automatic collection of user location data
- **Device Information**: Browser and platform detection

## Technical Implementation

### Frontend (Next.js)
- **TypeScript**: Full type safety with comprehensive interfaces
- **Component Architecture**: Modular, reusable components
- **State Management**: React hooks for local state management
- **API Integration**: RESTful API calls with error handling
- **Responsive Design**: Tailwind CSS with mobile-first approach

### Backend (FastAPI)
- **RESTful API**: Complete CRUD operations for forms and submissions
- **Data Models**: Pydantic models for type validation
- **Analytics Engine**: Real-time calculation of form metrics
- **Export Functionality**: CSV generation for data export
- **Error Handling**: Comprehensive error responses

### Data Storage
- **In-Memory Storage**: Demo implementation (replace with database in production)
- **Structured Data**: Organized storage for forms, submissions, and analytics
- **Data Relationships**: Proper linking between forms and submissions

## API Endpoints

### Form Management
- `POST /api/review-forms` - Create new review form
- `GET /api/review-forms/business/{business_id}` - Get business forms
- `GET /api/review-forms/{form_id}` - Get specific form
- `PUT /api/review-forms/{form_id}` - Update form
- `DELETE /api/review-forms/{form_id}` - Delete form

### Form Submission
- `POST /api/review-forms/{form_id}/submit` - Submit form responses
- `GET /api/review-forms/{form_id}/submissions` - Get form submissions
- `GET /api/review-forms/{form_id}/analytics` - Get form analytics

## Usage

### Creating a Review Form
1. Navigate to Dashboard → Review Forms
2. Click "Create Review Form"
3. Configure form details (title, description)
4. Add fields with drag-and-drop interface
5. Configure field properties (required, labels, options)
6. Set form settings (anonymous, email requirements, etc.)
7. Save and share the form

### Sharing Forms
- **Direct Link**: Copy the form URL and share directly
- **Embed Widget**: Use the provided JavaScript code to embed on websites
- **Custom Widget**: Configure button appearance and behavior

### Viewing Analytics
1. Navigate to form analytics page
2. View submission metrics and trends
3. Analyze geographic and device data
4. Export data for further analysis

## File Structure

```
app/
├── lib/
│   ├── review-types.ts          # TypeScript interfaces
│   └── review-utils.ts          # API utility functions
├── components/review/
│   ├── ReviewFormBuilder.tsx    # Form creation interface
│   ├── ReviewFormsList.tsx      # Forms listing component
│   ├── ReviewAnalytics.tsx      # Analytics dashboard
│   └── ReviewSubmissions.tsx    # Submissions viewer
├── dashboard/
│   └── review/[formId]/
│       ├── analytics/page.tsx   # Analytics page
│       └── submissions/page.tsx  # Submissions page
└── review/[formId]/page.tsx     # Form filling page

backend/
└── pinecone_backend.py          # FastAPI backend with review endpoints

public/
└── review-embed.js             # Embed widget script
```

## Getting Started

1. **Start the Backend**:
   ```bash
   cd backend
   python pinecone_backend.py
   ```

2. **Start the Frontend**:
   ```bash
   npm run dev
   ```

3. **Access the Dashboard**:
   - Navigate to `http://localhost:3000/dashboard`
   - Create your first review form
   - Share the form URL or embed code

## Customization

### Form Fields
- Add new field types by extending the `ReviewField` interface
- Customize field rendering in the form builder
- Add validation rules for specific field types

### Analytics
- Extend analytics calculations in the backend
- Add new metric types to the analytics dashboard
- Customize data export formats

### Styling
- Modify Tailwind classes for custom styling
- Update component themes and colors
- Customize the embed widget appearance

## Production Considerations

1. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Authentication**: Add proper user authentication and authorization
3. **Rate Limiting**: Implement rate limiting for form submissions
4. **Data Privacy**: Add GDPR compliance features
5. **Backup**: Implement data backup and recovery
6. **Monitoring**: Add logging and monitoring for production use

## License

This project is part of the AI Native CRM system and follows the same licensing terms.
