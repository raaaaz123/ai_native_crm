# Firestore Setup Instructions

This document provides instructions for setting up Firestore with proper security rules and data persistence for the AI Native CRM application.

## 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database
4. Choose "Start in test mode" initially (we'll add security rules later)

## 2. Deploy Security Rules

The project includes Firestore security rules in `firestore.rules` that ensure:

- Users can only access their own data
- Proper authentication is required for all operations
- Data isolation between users

To deploy the rules:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## 3. Environment Variables

Make sure your `.env.local` file contains all required Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 4. Security Rules Overview

The security rules ensure:

### User Documents (`/users/{userId}`)
- Users can read and write only their own user document
- Authentication is required

### Contacts (`/contacts/{contactId}`)
- Users can only access contacts where `userId` matches their UID
- Full CRUD operations allowed for own contacts

### Deals (`/deals/{dealId}`)
- Users can only access deals where `userId` matches their UID
- Full CRUD operations allowed for own deals

### Activities (`/activities/{activityId}`)
- Users can only access activities where `userId` matches their UID
- Full CRUD operations allowed for own activities

### Companies (`/companies/{companyId}`)
- Users can only access companies where `userId` matches their UID
- Full CRUD operations allowed for own companies

## 5. Data Structure

### User Document Structure
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Contact Document Structure
```typescript
{
  userId: string; // Owner's UID
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Deal Document Structure
```typescript
{
  userId: string; // Owner's UID
  title: string;
  value: number;
  status: string;
  contactId?: string;
  stage: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 6. Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the signup page
3. Create a new account with email/password or Google
4. Complete the profile setup
5. Check the Firebase Console to verify data is being saved correctly

## 7. Production Considerations

- Deploy security rules before going to production
- Set up proper indexes for your queries (see `firestore.indexes.json`)
- Monitor Firestore usage and costs
- Consider implementing data backup strategies
- Set up proper error monitoring and logging

## 8. Troubleshooting

### Common Issues:

1. **Permission Denied Errors**: Make sure security rules are deployed and user is authenticated
2. **Missing Data**: Check that `userId` field is properly set in all documents
3. **Timestamp Issues**: Use `serverTimestamp()` for consistent timestamps across clients

### Debug Mode:
You can temporarily set rules to allow all access for debugging:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Never use debug rules in production!**
