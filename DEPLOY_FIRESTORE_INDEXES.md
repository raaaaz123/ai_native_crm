# Deploy Firestore Indexes - Quick Guide

## The Error

```
FirebaseError: The query requires an index.
```

This happens because Firestore needs a composite index for queries with multiple where clauses and orderBy.

---

## ✅ Index Added to Configuration

I've added the required index to `firestore.indexes.json`:

```json
{
  "collectionGroup": "companyInvites",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "companyId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

And also added an index for chat history:

```json
{
  "collectionGroup": "conversations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "widgetId", "order": "ASCENDING" },
    { "fieldPath": "customerEmail", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}
```

---

## 🚀 Option 1: Quick Fix (Click the Link)

**Fastest way** - Just click the link in your error message:

```
https://console.firebase.google.com/v1/r/project/rexa-engage/firestore/indexes?create_composite=...
```

This will:
- Open Firebase Console
- Pre-fill the index configuration
- Click "Create Index"
- Wait ~2-5 minutes for index to build
- Done!

---

## 🎯 Option 2: Deploy from Code (Recommended)

**Better for production** - Deploy all indexes at once:

### Step 1: Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### Step 2: Wait for Indexes to Build

You'll see output like:
```
✔  Deploy complete!

Indexes are being built. This may take a few minutes.
Check status: https://console.firebase.google.com/project/rexa-engage/firestore/indexes
```

### Step 3: Check Status

Visit the Firebase Console URL shown, or run:

```bash
firebase firestore:indexes
```

**Expected Output**:
```
companyInvites
  - companyId ASC, status ASC, createdAt DESC [Building...]
  
conversations
  - widgetId ASC, customerEmail ASC, updatedAt DESC [Building...]
```

### Step 4: Wait for "ENABLED" Status

Indexes typically take **2-10 minutes** to build depending on data size.

**Status progression**:
1. Creating... (0-30 seconds)
2. Building... (1-10 minutes)
3. Enabled ✅ (Ready to use!)

---

## 🔄 After Index is Built

1. **Refresh your Team Management page**
2. **Sent Invitations should load** without error
3. **Filter tabs will work** properly
4. **No more index errors**

---

## 🐛 If You Still See Errors

### Error: "Index already exists"

**Meaning**: Index was created via the click link  
**Solution**: No action needed, it's already building

### Error: "Permission denied"

**Solution**: Make sure you're logged into Firebase CLI:
```bash
firebase login
```

### Error: "Project not found"

**Solution**: Initialize Firebase in your project:
```bash
firebase init firestore
# Select existing project: rexa-engage
```

---

## 📋 All Indexes in firestore.indexes.json

After my updates, you now have indexes for:

1. **contacts** - userId + createdAt
2. **contacts** - userId + company + createdAt
3. **deals** - userId + status + createdAt
4. **deals** - userId + stage + value
5. **activities** - userId + createdAt
6. **activities** - userId + type + createdAt
7. **companies** - userId + createdAt
8. **chatConversations** - businessId + updatedAt
9. **chatMessages** - conversationId + createdAt
10. **chatWidgets** - businessId + createdAt
11. **knowledgeBase** - widgetId + createdAt
12. **knowledgeBase** - businessId + createdAt
13. **reviewForms** - businessId + createdAt
14. **reviewSubmissions** - formId + submittedAt
15. **reviewSubmissions** - businessId + submittedAt
16. **companyMembers** - userId + status
17. **companyMembers** - companyId + status
18. **companyInvites** - email + status
19. **companyInvites** - email + status + createdAt
20. **companyMembers** - companyId + createdAt
21. **scraped_websites** - widget_id + scraped_at
22. **companyInvites** - companyId + status + createdAt ✅ **NEW**
23. **conversations** - widgetId + customerEmail + updatedAt ✅ **NEW**

---

## ⚡ Quick Summary

**What to do now**:

1. **Option A** (Fastest):
   - Click the error link
   - Create index in Firebase Console
   - Wait 2-5 minutes

2. **Option B** (Recommended):
   - Run: `firebase deploy --only firestore:indexes`
   - Wait 2-10 minutes
   - All indexes deployed at once

3. **After index builds**:
   - Refresh page
   - Sent Invitations will load
   - Filter tabs will work

**The code is ready** - just waiting for Firestore indexes to build! 🎉

