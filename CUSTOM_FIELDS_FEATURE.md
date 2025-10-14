# Custom Fields Feature - Data Collection

## What Was Added

✅ **Collect Name Toggle** - Control whether to collect visitor names  
✅ **Custom Fields Management** - Add unlimited custom form fields  
✅ **Live Preview** - All changes show immediately in widget preview  

---

## Features

### 1. Collect Name Control

You can now toggle whether to collect the visitor's name:

**Location**: Dashboard → Widgets → [Your Widget] → Customize → Data Collection

**Toggle**: "Collect Name"
- ✅ **ON** (default): Name field appears in contact form
- ❌ **OFF**: Name field is hidden

---

### 2. Custom Fields

Add any custom form fields you need to collect additional information from visitors.

**Location**: Dashboard → Widgets → [Your Widget] → Customize → Data Collection → Custom Fields

**Features**:
- ✅ Add unlimited custom fields
- ✅ Choose field type: Text, Email, Phone, Number
- ✅ Set custom label (e.g., "Company", "Job Title")
- ✅ Add placeholder text
- ✅ Mark fields as required or optional
- ✅ Reorder, edit, or delete fields anytime

---

## How to Use

### Adding a Custom Field

1. **Navigate to Widget Settings**:
   - Dashboard → Widgets → [Your Widget] → Customize

2. **Scroll to Data Collection Section**

3. **Click "Add Field"** button in the Custom Fields area

4. **Configure the Field**:
   - **Label**: The field name shown to users (e.g., "Company Name")
   - **Type**: Choose from Text, Email, Phone, or Number
   - **Placeholder**: Optional hint text (e.g., "Enter your company name")
   - **Required**: Toggle ON to make this field mandatory

5. **Click Save** at the top of the page

6. **Test in Preview**: Click the chat button to see your custom field in action!

---

## Example Use Cases

### 1. B2B Lead Collection
```
Field 1: Company Name (Text, Required)
Field 2: Job Title (Text, Required)
Field 3: Company Size (Number, Optional)
```

### 2. Support Ticket
```
Field 1: Order Number (Text, Required)
Field 2: Issue Type (Text, Required)
Field 3: Product Name (Text, Optional)
```

### 3. Event Registration
```
Field 1: Organization (Text, Optional)
Field 2: Dietary Restrictions (Text, Optional)
Field 3: T-Shirt Size (Text, Optional)
```

---

## Field Types

| Type | Description | Example |
|------|-------------|---------|
| **Text** | Single line text input | Name, Company, Job Title |
| **Email** | Email address with validation | Work Email, Secondary Email |
| **Phone** | Phone number input | Mobile, Office Phone |
| **Number** | Numeric values only | Age, Employee Count, Order # |

---

## Default Data Collection

By default, widgets collect:
- ✅ **Name** (can be toggled off)
- ✅ **Email** (can be toggled off)
- ❌ **Phone** (can be toggled on)
- ➕ **Custom Fields** (add as many as you need)

---

## Widget Preview

All changes appear **instantly** in the widget preview:

1. **Toggle collectName OFF**: Name field disappears from form
2. **Add a custom field**: It appears in the contact form
3. **Mark field as required**: An asterisk (*) shows next to the label
4. **Change placeholder**: New text appears in the input field

**Test it**: Click the chat button on the customize page to see the live preview!

---

## How It Works

### Contact Form Flow

1. **Visitor clicks chat button**
2. **Contact form appears** with:
   - Name field (if enabled)
   - Email field (if enabled)
   - Phone field (if enabled)
   - All custom fields (in order added)
3. **Visitor fills out required fields**
4. **Clicks "Start Chat"**
5. **Chat begins** with collected information

---

## Managing Custom Fields

### Editing a Field

1. Find the field in the list
2. Click on the input to edit:
   - Change label
   - Change type
   - Update placeholder
   - Toggle required status
3. Click **Save** to apply changes

### Deleting a Field

1. Find the field you want to remove
2. Click the **X** button in the top-right corner
3. Field is removed immediately
4. Click **Save** to apply changes

### Reordering Fields

Fields appear in the contact form in the order they're listed. To reorder:
1. Delete the field you want to move
2. Click "Add Field" at the desired position
3. Re-enter the field details

*(Note: Drag-and-drop reordering coming soon!)*

---

## Best Practices

### ✅ Do's

- **Keep it short**: Ask for only essential information (3-5 fields max)
- **Use clear labels**: "Company Name" not "Co. Name"
- **Add helpful placeholders**: "e.g., Acme Corporation"
- **Mark required wisely**: Only require fields you truly need
- **Test your form**: Use the preview to experience what visitors see

### ❌ Don'ts

- **Too many fields**: More than 7 fields reduces completion rate
- **Unclear labels**: Avoid jargon or abbreviations
- **All required**: Give optional fields when possible
- **No placeholders**: Help users understand what you're asking for

---

## Technical Details

### Data Structure

Custom fields are stored as:
```javascript
customFields: [
  {
    id: "custom_1234567890",
    label: "Company Name",
    type: "text",
    required: true,
    placeholder: "e.g., Acme Corporation"
  }
]
```

### Widget Configuration

The widget configuration includes:
```javascript
{
  collectName: true,      // Toggle name collection
  collectEmail: true,     // Toggle email collection
  collectPhone: false,    // Toggle phone collection
  customFields: [...]     // Array of custom fields
}
```

---

## Updates to Widget Preview

The `WidgetPreview` component now:
- ✅ Conditionally shows Name field based on `collectName`
- ✅ Renders all custom fields dynamically
- ✅ Applies field types (text, email, phone, number)
- ✅ Shows required field indicators (*)
- ✅ Uses custom placeholders
- ✅ Validates required fields on submit

---

## Example Configuration

Here's a complete example for a B2B SaaS company:

```javascript
{
  collectName: true,           // ✅ Collect names
  collectEmail: true,          // ✅ Collect emails  
  collectPhone: false,         // ❌ Don't collect phone
  customFields: [
    {
      id: "custom_company",
      label: "Company Name",
      type: "text",
      required: true,
      placeholder: "e.g., Acme Corporation"
    },
    {
      id: "custom_jobtitle",
      label: "Job Title", 
      type: "text",
      required: false,
      placeholder: "e.g., Marketing Manager"
    },
    {
      id: "custom_employees",
      label: "Number of Employees",
      type: "number",
      required: false,
      placeholder: "e.g., 50"
    }
  ]
}
```

**Result**: Contact form will show Name, Email, Company Name (required), Job Title (optional), and Number of Employees (optional).

---

## Summary

✅ **Collect Name Toggle** - Added  
✅ **Custom Fields** - Fully functional  
✅ **Field Types** - Text, Email, Phone, Number  
✅ **Required/Optional** - Configurable  
✅ **Placeholders** - Supported  
✅ **Live Preview** - Working  
✅ **Edit/Delete** - Implemented  

All changes appear **immediately in the widget preview** so you can test before deploying! 🎉

---

## Next Steps

1. **Go to**: Dashboard → Widgets → [Your Widget] → Customize
2. **Scroll to**: Data Collection section
3. **Toggle**: Collect Name (if you want to disable it)
4. **Click**: "Add Field" to create custom fields
5. **Test**: Click the chat button to see the preview
6. **Save**: Click Save button at the top

Your custom fields will now appear in the live widget on your website!

