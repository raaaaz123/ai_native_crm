# Notion Integration - Quick Setup Guide

## 🚀 5-Minute Setup

Follow these simple steps to connect your Notion workspace to Rexa AI.

---

## Step 1: Create Notion Integration (2 minutes)

### **A. Go to Notion Integrations Page**
1. Visit: [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Log in to your Notion account if needed

### **B. Create New Integration**
1. Click the "**+ New integration**" button
2. Fill in the form:
   ```
   Name: Rexa AI Knowledge Base
   Associated workspace: [Select your workspace]
   Type: Internal integration
   ```
3. Click "**Submit**"

### **C. Copy Integration Token**
1. You'll see a page with your new integration
2. Find "**Internal Integration Token**"
3. Click "**Show**" then "**Copy**"
4. Token looks like: `secret_xxxxxxxxxxxxxxxxxxxxx`
5. **Save this token** - you'll need it in Step 3!

---

## Step 2: Share Pages with Integration (1 minute)

Your integration needs permission to access pages. Two options:

### **Option A: Share Specific Pages** (Recommended)

For each page you want to import:

1. Open the page in Notion
2. Click the "**•••**" menu (top right)
3. Click "**Connections**"
4. Search for "**Rexa AI Knowledge Base**"
5. Click to add the connection
6. ✅ Done! Repeat for other pages.

### **Option B: Share Entire Workspace**

Grant access to all pages at once:

1. Go to Notion **Settings & Members**
2. Click "**Connections**" tab
3. Find "**Rexa AI Knowledge Base**"
4. Toggle it on
5. ✅ All pages accessible!

**Note:** You can change permissions anytime.

---

## Step 3: Import to Rexa AI (2 minutes)

### **A. Open Knowledge Base**
1. Go to your Rexa AI dashboard
2. Navigate to "**Knowledge Base**"
3. Select your widget

### **B. Start Import**
1. Click "**Add Article**"
2. Select "**Notion Page/Database**" type
3. Paste your API token (from Step 1)
4. Click "**Connect to Notion**"

### **C. Choose Content**

**For Single Page:**
1. Select "**📄 Single Page**"
2. Choose from dropdown
3. Title auto-fills
4. Click "**Add Article**"
5. ✅ Imported!

**For Database:**
1. Select "**📊 Entire Database**"
2. Enter database ID:
   - Open database in Notion
   - Copy URL: `notion.so/DATABASE_ID?v=...`
   - Paste the `DATABASE_ID` part
3. Click "**Add Article**"
4. ✅ All pages imported!

---

## 🎯 Quick Video Guide

### **Creating Integration (30 seconds):**
```
1. notion.so/my-integrations
2. Click "+ New integration"
3. Name it "Rexa AI"
4. Submit
5. Copy token ✓
```

### **Sharing Pages (15 seconds):**
```
1. Open Notion page
2. Click "•••"
3. Add "Rexa AI" connection ✓
```

### **Importing (30 seconds):**
```
1. Knowledge Base → Add Article
2. Select "Notion"
3. Paste token → Connect
4. Choose page → Import ✓
```

**Total time: ~1 minute 15 seconds!** ⚡

---

## 🔐 Security Notes

### **Your API Token:**
- ✅ Only used during import
- ✅ Not stored in database
- ✅ Not logged
- ✅ You can regenerate anytime

### **Access Control:**
- ✅ You control which pages are shared
- ✅ Can revoke access anytime
- ✅ Integration can't modify pages
- ✅ Read-only access

### **Best Practices:**
- 🔒 Don't share your token publicly
- 🔒 Only share necessary pages
- 🔒 Revoke unused integrations
- 🔒 Regenerate tokens periodically

---

## 💡 Common Questions

### **Q: Do I need to reconnect every time?**
A: No! Once you import, content is stored. You only reconnect to import new/updated pages.

### **Q: Will changes in Notion auto-update?**
A: No. To update content, delete the old import and re-import the page.

### **Q: Can I import multiple databases?**
A: Yes! Import one at a time. Each import is separate.

### **Q: What if I have 1000+ pages?**
A: Import databases one by one, or import only important pages. Large databases take longer (3-5 min for 100 pages).

### **Q: Is my Notion data safe?**
A: Yes! We only read content. We can't modify, delete, or share your Notion pages. You control access.

### **Q: Can I revoke access later?**
A: Yes! Go to Notion Settings → Connections → Remove "Rexa AI". Or delete the integration entirely at notion.so/my-integrations.

---

## 🎉 You're Ready!

Your Notion workspace is now connected to Rexa AI! 

### **Next Steps:**
1. ✅ Import your first page
2. ✅ Test AI responses
3. ✅ Import more content as needed
4. ✅ Keep knowledge base updated

### **Need Help?**
- Check the detailed [NOTION_INTEGRATION.md](./NOTION_INTEGRATION.md)
- Review backend logs for errors
- Test connection first before importing

---

**Happy importing! 🚀**

Your documentation is now accessible to your AI assistant, making customer support easier and more accurate!

