# UI Components - ELI5 Guide

## 🍞 TOASTS (Quick Messages)

**Like a quick note that pops up and disappears**

### When to Use:

- Success confirmations ("Post created!")
- Error messages ("Upload failed")
- Status updates ("Connecting...")
- Background action results

### How it Works:

- Appear in screen corners
- Auto-disappear after 3-5 seconds
- Don't block user interaction
- Colors: Green=success, Red=error, Yellow=warning

### SAV3 Examples:

- "Post liked!" ✓
- "Failed to send message" ✗
- "New follower: @johndoe"

---

## 📱 MODALS (Pop-up Windows)

**Like a TV commercial that interrupts your show**

### When to Use:

- Quick forms (create post, edit profile)
- Confirmations (delete, logout)
- Settings/preferences
- Short interactions

### How it Works:

- Blocks the main page
- Dark overlay behind it
- Must be closed to continue
- Usually has Cancel/OK buttons

### SAV3 Examples:

- "Create new post" form
- "Delete this post?" confirmation
- "Edit profile" settings
- "Share options" menu

---

## 🍞 BREADCRUMBS (Navigation Trail)

**Like leaving a trail of breadcrumbs in a forest**

### When to Use:

- Deep navigation (many levels)
- Complex apps with nested pages
- When users might get lost
- E-commerce product pages

### How it Works:

- Shows current location path
- Click any level to go back
- Usually at top of page
- Separated by arrows or slashes

### SAV3 Examples:

- Home > Communities > Tech Talk
- Profile > Settings > Notifications
- Feed > Post Details > Comments

---

## 🎯 Quick Reference

| Component      | Blocking? | Auto-Disappear? | Position | Use Case   |
| -------------- | --------- | --------------- | -------- | ---------- |
| **Toast**      | No        | Yes (3-5s)      | Corners  | Feedback   |
| **Modal**      | Yes       | No              | Center   | Actions    |
| **Breadcrumb** | No        | No              | Top      | Navigation |

## 💡 SAV3 Implementation Tips

- **Use toasts** for immediate feedback on user actions
- **Use modals** for forms and confirmations
- **Use breadcrumbs** in complex navigation flows
- **Combine them**: Modal with success toast, breadcrumb navigation with action modals</content>
  <parameter name="filePath">c:\Users\evans\Desktop\sav3-backend\UI_COMPONENTS_ELI5.md
