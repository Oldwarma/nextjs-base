# Menu Management System

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Dynamic Menu Loading](#dynamic-menu-loading)
5. [Icon & Parent Linkage](#icon--parent-linkage)
6. [Best Practices](#best-practices)
7. [Technical Implementation](#technical-implementation)

---

## Overview

The menu management system provides complete CRUD functionality for backend menus, supporting tree structure, parent-child relationships, sorting, enable/disable, and more.

**Access Path**: `/admin/menus`

### Key Features

- **Tree Table Display** - Auto-expand all levels with clear hierarchy
- **Complete CRUD** - Create, Read, Update, Delete operations
- **Dynamic Loading** - Menus loaded from database in real-time
- **Icon Picker** - Select from predefined icon library
- **Parent-Child Relationship** - Support for unlimited nesting levels
- **Sorting** - Custom order with sortOrder field
- **Enable/Disable** - Control menu visibility
- **Icon-Parent Linkage** - Auto-disable icon for sub-menus (Ant Design Pro standard)

---

## Quick Start

### 1. Access Menu Management

```
http://localhost:3000/admin/menus
```

### 2. Create First Menu

Click "Create" button and fill in:

```
Menu Key: dashboard
Menu Name: Dashboard
Icon: [Click to select] LayoutDashboard
URL: /admin
Sort Order: 100
Parent Menu: [Leave empty]
Enabled: On
Hidden: Off
```

### 3. Create Sub-Menu

Click "Create" again for a sub-menu:

```
Menu Key: user_list
Menu Name: User List
Icon: [Click to select] Users
URL: /admin/users
Sort Order: 90
Parent Menu: [Select] Dashboard
Enabled: On
Hidden: Off
```

### 4. View Tree Structure

You'll see in the table:

```
📊 Dashboard (100)
  └─ 👥 User List (90)
```

### 5. Edit Menu

Click "..." → "Edit" on any menu row

### 6. Delete Menu

Click "..." → "Delete" on any menu row
(Note: Cannot delete menus with children)

---

## Features

### 1. Field Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Menu Key** | Text | ✅ | Unique identifier, e.g., `dashboard`, `users` |
| **Menu Name** | Text | ✅ | Display name, e.g., "User Management" |
| **Icon** | Icon Picker | ❌ | Select from icon library (top-level only) |
| **URL** | Text | ❌ | Internal: `/admin/users`<br>External: `https://example.com` |
| **Sort Order** | Number | ✅ | Larger numbers appear first (descending) |
| **Parent Menu** | TreeSelect | ❌ | Leave empty for root menu |
| **Remark** | TextArea | ❌ | Description text |
| **Enabled** | Switch | - | Default enabled |
| **Hidden** | Switch | - | Hidden but accessible |

### 2. Database Schema

```javascript
{
  _id: ObjectId,
  key: String,          // Menu identifier (unique)
  name: String,         // Menu display name
  icon: String,         // Icon name
  url: String,          // URL path
  sortOrder: Number,    // Sort value (descending)
  parentId: String,     // Parent menu ID
  remark: String,       // Remark
  enabled: Boolean,     // Is enabled
  hidden: Boolean,      // Is hidden
  createdAt: Date,      // Create time
  updatedAt: Date,      // Update time
  deletedAt: Date,      // Soft delete time
}
```

### 3. Server Actions

**File**: `app/(admin)/actions/admin-menus.js`

```javascript
// Get menu list (tree structure)
getMenuListAction({ pageIndex, pageSize, ...filters })

// Get menu tree (for parent selection)
getMenuTreeAction()

// Create menu
createMenuAction(data)

// Update menu
updateMenuAction(id, data)

// Delete menu (soft delete)
deleteMenuAction(id)
```

---

## Dynamic Menu Loading

### Overview

Backend menus are dynamically loaded from the database instead of being hard-coded, supporting real-time menu configuration updates.

### Features

1. **Dynamic Loading** - Read from MongoDB `menus` collection
2. **Auto-Sort** - Sort by `sortOrder` ascending (smaller values first)
3. **Tree Structure** - Support multi-level menu tree
4. **Auto-Filter** - Filter out disabled and hidden menus

### Menu Data Structure

```javascript
{
  _id: 'ObjectId',
  key: 'dashboard',           // Menu unique identifier
  name: 'Dashboard',          // Menu display name
  icon: 'LayoutDashboard',    // Lucide React icon name
  url: '/admin',              // Menu link
  sortOrder: 0,               // Sort value (smaller first)
  parentId: null,             // Parent menu ID (null for top-level)
  enabled: true,              // Is enabled
  hidden: false,              // Is hidden
  remark: '...',             // Remark
  createdAt: Date,
  updatedAt: Date
}
```

### Icon Dynamic Rendering

Support for all Lucide React icons:

```javascript
// Store icon name in database
icon: 'LayoutDashboard'

// Component auto-converts to icon
import * as LucideIcons from 'lucide-react';
const IconComponent = LucideIcons['LayoutDashboard'];
```

**Common Icon Names:**
- `LayoutDashboard` - Dashboard
- `Users` - Users
- `Menu` - Menu
- `Package` - Package/Gift
- `CreditCard` - Credits/Points
- `BarChart` - Charts/Statistics
- `Settings` - Settings
- `Store` - Shop
- `Users2` - Team

### Breadcrumb Navigation

Breadcrumbs automatically match current page name from menu data:

```javascript
// Recursively find menu by path
const findMenuByPath = (menus, path) => {
  for (const menu of menus) {
    const menuPath = menu.url || `/admin/${menu.key}`;
    if (menuPath === path) return menu;
    if (menu.children?.length > 0) {
      const found = findMenuByPath(menu.children, path);
      if (found) return found;
    }
  }
  return null;
};
```

### Implementation

**File**: `components/admin/admin-layout.jsx`

1. **Import Menu Action**
```javascript
import { getMenuListAction } from '@/app/(admin)/actions/admin-menus';
```

2. **State Management**
```javascript
const [menuData, setMenuData] = useState([]);
const [menuLoading, setMenuLoading] = useState(true);
```

3. **Load Menu Data**
```javascript
useEffect(() => {
  const loadMenus = async () => {
    setMenuLoading(true);
    try {
      const result = await getMenuListAction({});
      if (result.success) {
        setMenuData(result.data || []);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setMenuLoading(false);
    }
  };
  loadMenus();
}, []);
```

4. **Convert Menu Format**
```javascript
const convertMenuToRoute = (menu) => {
  const IconComponent = menu.icon && LucideIcons[menu.icon] 
    ? LucideIcons[menu.icon] 
    : null;
  
  const route = {
    path: menu.url || `/admin/${menu.key}`,
    name: menu.name,
    key: menu.key,
    icon: IconComponent ? <IconComponent /> : null,
  };

  // Recursively process sub-menus
  if (menu.children?.length > 0) {
    route.routes = menu.children
      .filter(child => child.enabled && !child.hidden)
      .map(convertMenuToRoute);
  }

  return route;
};
```

---

## Icon & Parent Linkage

### Design Rationale

Following Ant Design Pro's official design standards, **sub-menu items do not display icons**, only top-level menus show icons. To prevent users from mistakenly setting icons for sub-menus, we added form linkage: **when a parent menu is selected, the icon picker is automatically disabled and cleared**.

### Ant Design Pro Menu Design Standard

- ✅ **Top-level menu**: Display icon
- ❌ **Sub-menu items**: No icon (keep interface clean)

This is ProLayout's default behavior, conforming to Ant Design's design system.

### Features

#### 1. Icon Picker Disable

When "Parent Menu" is selected in the form:
- Icon picker automatically becomes disabled
- Previously selected icon is automatically cleared
- Hint text informs user that sub-menus don't display icons

#### 2. Dynamic Linkage

Form fields use `dependencies` and `fieldProps` for dynamic linkage:

```javascript
{
  key: 'icon',
  title: 'Icon',
  type: 'icon',
  form: {
    placeholder: 'Select an icon',
    tips: 'Icon is only for top-level menus. Sub-menu items do not display icons.',
    // Depend on parentId field
    dependencies: ['parentId'],
    fieldProps: (form) => {
      const parentId = form?.getFieldValue('parentId');
      return {
        disabled: !!parentId, // Disable when has parent
      };
    },
  },
}
```

#### 3. Auto-Clear Icon

When user selects parent menu, icon field is auto-cleared via `onChange` callback:

```javascript
{
  key: 'parentId',
  title: 'Parent Menu',
  type: 'tree-select',
  form: {
    fieldProps: (form) => ({
      treeData: menuTree,
      // Clear icon when parent menu selected
      onChange: (value) => {
        if (value) {
          form?.setFieldValue('icon', null);
        }
      },
    }),
    tips: 'Sub-menus do not display icons. Selecting a parent will clear the icon field.',
  },
}
```

### User Experience

#### Creating Top-Level Menu
1. Don't select "Parent Menu"
2. Icon picker is enabled
3. Can select any icon
4. Icon displays in sidebar

#### Creating Sub-Menu
1. Select "Parent Menu"
2. Icon picker auto-disables (grays out)
3. Previously selected icon is auto-cleared
4. Hint: "Sub-menus do not display icons. Selecting a parent will clear the icon field."

#### Editing Menu

**From top-level to sub-menu:**
1. Select a parent menu
2. Original icon auto-clears
3. Icon picker becomes disabled

**From sub-menu to top-level:**
1. Clear parent menu selection
2. Icon picker auto-enables
3. Can select icon again

---

## Best Practices

### 1. Menu Key Naming Convention

✅ **Recommended:**
```
dashboard
user_management
system_settings
order_list
```

❌ **Not Recommended:**
```
Dashboard  // Avoid uppercase
user-management  // Avoid hyphens
用户管理  // Avoid non-English
```

### 2. Sort Order Planning

Use multiples of 10 for easy insertion:
```
100 - First menu
 90 - Second menu
 80 - Third menu
 ...
```

To insert between 100 and 90:
```
100
 95 - Newly inserted menu
 90
```

### 3. URL Format

**Internal Links** (Next.js routes):
```
/admin
/admin/users
/admin/settings
```

**External Links:**
```
https://docs.example.com
https://help.example.com
```

### 4. Icon Selection

Prioritize semantic icons:
- Dashboard → `LayoutDashboard`
- Users → `Users`
- Settings → `Settings`
- Package → `Package`
- Chart → `BarChart`

### 5. Initial Menu Structure

```
System Management (sortOrder: 100)
├─ User Management (sortOrder: 90)
├─ Menu Management (sortOrder: 80)
├─ Role Management (sortOrder: 70)
└─ System Settings (sortOrder: 60)

Business Management (sortOrder: 50)
├─ Package Management (sortOrder: 40)
├─ Credits Management (sortOrder: 30)
└─ Usage Statistics (sortOrder: 20)
```

---

## Technical Implementation

### Tree Structure Building

```javascript
function buildMenuTree(menus, parentId = null) {
  const tree = [];
  
  for (const menu of menus) {
    if (menu.parentId === parentId) {
      const children = buildMenuTree(menus, menu._id);
      if (children.length > 0) {
        menu.children = children;
      }
      tree.push(menu);
    }
  }
  
  return tree;
}
```

### Menu Sorting Logic

**File**: `app/(admin)/actions/admin-menus.js`

```javascript
const menus = await menusCollection.find(query, {
  sort: { sortOrder: 1, createdAt: 1 }, // Sort by sortOrder ascending, then createdAt
});
```

- `sortOrder: 1` - Ascending order (smaller values first)
- `createdAt: 1` - When sortOrder is same, sort by creation time

### Parent Selection

Using `TreeSelect` component:

```javascript
{
  key: 'parentId',
  type: 'tree-select',
  data: menuTree, // Dynamically loaded menu tree
  form: {
    fieldProps: {
      treeData: menuTree,
      showSearch: true,
      allowClear: true, // Can clear = root menu
    }
  }
}
```

### Soft Delete Protection

```javascript
// Check for child menus
const childMenus = await menusCollection.findOne({
  parentId: id,
  deletedAt: { $exists: false },
});

if (childMenus) {
  return {
    success: false,
    error: 'Cannot delete menu with child menus',
  };
}
```

---

## Common Issues

### Q1: Why delete failed?

**A**: Cannot delete menus with child menus. Delete all child menus first.

### Q2: How to change menu order?

**A**: Edit menu and modify "Sort Order" field. Larger numbers appear first.

### Q3: Menu key duplicate?

**A**: System will show "Menu key already exists". Use a unique identifier.

### Q4: How to create 3-level menu?

**A**: 
1. Create level-1 menu A
2. Create level-2 menu B, set parent to A
3. Create level-3 menu C, set parent to B

### Q5: How do external links open?

**A**: System auto-detects external links (starting with http/https) and opens in new tab.

---

## Advanced Features

### 1. Create Group Menu

Don't set URL, only for grouping:

```javascript
{
  key: 'system_group',
  name: 'System',
  icon: 'Folder',
  url: null, // Don't set
  sortOrder: 100,
  enabled: true,
}
```

### 2. Create Hidden Page

Some pages don't show in menu but can be directly accessed:

```javascript
{
  key: 'user_detail',
  name: 'User Detail',
  url: '/admin/users/[id]',
  hidden: true, // Hidden
  enabled: true,
}
```

### 3. Temporarily Disable Menu

Don't delete, just temporarily disable:

```javascript
{
  enabled: false, // Disabled
}
```

### 4. Quick Order Adjustment

Modify sortOrder to adjust order:

```
User Management: 90 → 95  (Move up)
Role Management: 80 (Keep unchanged)
```

---

## Performance Optimization

### 1. useMemo Cache

Use `useMemo` to cache route config and breadcrumb, avoiding unnecessary recalculation:

```javascript
const route = useMemo(() => {
  // ... conversion logic
}, [menuData]);

const breadcrumbItems = useMemo(() => {
  // ... breadcrumb generation logic
}, [pathname, menuData]);
```

### 2. On-Demand Icon Loading

Icon components dynamically referenced via `Icons[iconName]`, avoiding importing all icons.

### 3. Client-Side Rendering

ProLayout uses `dynamic` import to avoid SSR hydration issues:

```javascript
const ProLayout = dynamic(
  () => import('@ant-design/pro-components').then((mod) => mod.ProLayout),
  { ssr: false }
);
```

---

## Notes

1. **Icon names must be correct**
   - Must be existing icon name from Lucide React
   - Case-sensitive
   - Wrong icon names won't display (but won't error)

2. **URL paths must match**
   - Menu `url` must match actual page path
   - Otherwise breadcrumbs may not display correctly

3. **sortOrder planning**
   - Recommend using multiples of 10 to leave adjustment space
   - Same sortOrder sorted by creation time

4. **Parent-child relationship**
   - Must delete all child menus before deleting parent
   - Cannot set menu's parent to itself or its children

5. **Permission control**
   - Current version only checks `enabled` and `hidden` status
   - Can extend to role-based menu permissions later

---

## Related Files

- `components/admin/admin-layout.jsx` - Admin layout component
- `app/(admin)/actions/admin-menus.js` - Menu Server Actions
- `app/(admin)/admin/menus/page.js` - Menu management page

---

## Test Checklist

Test the following functions to ensure system works:

- [ ] ✅ Create root menu
- [ ] ✅ Create sub-menu
- [ ] ✅ Create 3-level menu
- [ ] ✅ Edit menu info
- [ ] ✅ Change parent menu
- [ ] ✅ Adjust sort order
- [ ] ✅ Enable/disable menu
- [ ] ✅ Show/hide menu
- [ ] ✅ Delete leaf menu
- [ ] ✅ Delete parent menu fails (with children)
- [ ] ✅ Tree table expand/collapse
- [ ] ✅ Icon picker
- [ ] ✅ Search function
- [ ] ✅ View details

---

## Future Extensions

1. **Role Permission Control**
   - Display different menus based on user role
   - Menu-item level permission control

2. **Menu Badges**
   - Display unread message count
   - Status indicator marks

3. **Drag & Drop Sorting**
   - Adjust menu order via drag & drop
   - Drag to modify parent-child relationship

4. **Menu Search**
   - Quick search to locate menus
   - Keyboard shortcut support

5. **Menu Caching**
   - Local cache menu data
   - Reduce database queries

---

## Changelog

### 2024-11-03
- ✅ Confirm menu sorting is ascending (sortOrder ascending)
- ✅ Change backend layout menu to database loading
- ✅ Implement dynamic icon rendering
- ✅ Implement dynamic breadcrumb matching
- ✅ Add menu loading state
- ✅ Support multi-level menu tree structure
- ✅ Auto-filter disabled and hidden menus
- ✅ Restore AdminLayout to official version (sub-menus don't show icons)
- ✅ Add icon field and parent menu linkage
- ✅ Implement icon picker dynamic disable function
- ✅ Auto-clear icon when parent menu selected
- ✅ Update form hint text

---

**Status**: ✅ Feature Complete  
**Version**: v1.0.0  
**Last Updated**: 2025-11-03

