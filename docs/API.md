# API Documentation

## Overview

All API endpoints are located in `/pages/api/`. Most endpoints require authentication via Bearer token.

---

## Authentication

### Getting the Access Token

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { session } = useAuth();
const accessToken = session?.access_token;
```

### Making Authenticated Requests

```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify(data),
});
```

---

## Endpoints

### 1. Save Shared Content

Save a new link to the database.

**Endpoint:** `POST /api/save-shared-content`

**Auth Required:** ✅ Yes

**Request Body:**

```typescript
{
  url: string;           // Required - Link URL
  title?: string;        // Optional - Link title
  text?: string;         // Optional - Description
  category?: string;     // Optional - Category
}
```

**Response:**

```typescript
// Success (200)
{
  message: "Link saved successfully",
  data: {
    id: number;
    url: string;
    title: string | null;
    description: string | null;
    platform: string;
    image_url: string | null;
    category: string | null;
    is_read: boolean;
    user_id: string;
    created_at: string;
  }
}

// Error (400)
{ error: "URL is required" }

// Error (401)
{ error: "Unauthorized" }

// Error (500)
{ error: "Failed to save link" }
```

**Example:**

```typescript
const saveLink = async (url: string, title?: string) => {
  const response = await fetch('/api/save-shared-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url, title }),
  });
  
  return response.json();
};
```

---

### 2. Check Duplicate

Check if a URL already exists in user's library.

**Endpoint:** `POST /api/check-duplicate`

**Auth Required:** ✅ Yes

**Request Body:**

```typescript
{
  url: string;  // Required - URL to check
}
```

**Response:**

```typescript
// No duplicate found (200)
{
  isDuplicate: false,
  existingLink: null
}

// Duplicate found (200)
{
  isDuplicate: true,
  existingLink: {
    id: number;
    url: string;
    title: string;
    platform: string;
    created_at: string;
    // ... other fields
  }
}

// Error (401)
{ error: "Unauthorized" }
```

**Example:**

```typescript
const checkDuplicate = async (url: string) => {
  const response = await fetch('/api/check-duplicate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url }),
  });
  
  const { isDuplicate, existingLink } = await response.json();
  
  if (isDuplicate) {
    console.log('Link already saved:', existingLink);
  }
};
```

---

### 3. Delete Link

Delete a link from the database.

**Endpoint:** `DELETE /api/delete-link`

**Auth Required:** ✅ Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Link ID to delete |

**Response:**

```typescript
// Success (200)
{ message: "Link deleted successfully" }

// Error (400)
{ error: "Link ID is required" }

// Error (401)
{ error: "Unauthorized" }

// Error (500)
{ error: "Failed to delete link" }
```

**Example:**

```typescript
const deleteLink = async (linkId: number) => {
  const response = await fetch(`/api/delete-link?id=${linkId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  
  return response.json();
};
```

---

### 4. Toggle Read Status

Toggle the read/unread status of a link.

**Endpoint:** `PATCH /api/toggle-read`

**Auth Required:** ✅ Yes

**Request Body:**

```typescript
{
  id: number;      // Required - Link ID
  is_read: boolean; // Required - New read status
}
```

**Response:**

```typescript
// Success (200)
{
  message: "Read status updated",
  data: {
    id: number;
    is_read: boolean;
    // ... other fields
  }
}

// Error (400)
{ error: "Link ID and is_read status are required" }

// Error (401)
{ error: "Unauthorized" }
```

**Example:**

```typescript
const toggleRead = async (linkId: number, isRead: boolean) => {
  const response = await fetch('/api/toggle-read', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id: linkId, is_read: isRead }),
  });
  
  return response.json();
};
```

---

### 5. Update Link

Update link information (title, description, category).

**Endpoint:** `PATCH /api/update-link`

**Auth Required:** ✅ Yes

**Request Body:**

```typescript
{
  id: number;          // Required - Link ID
  title?: string;      // Optional - New title
  description?: string; // Optional - New description
  category?: string;   // Optional - New category
}
```

**Response:**

```typescript
// Success (200)
{
  message: "Link updated successfully",
  data: {
    id: number;
    title: string;
    description: string;
    category: string;
    // ... other fields
  }
}

// Error (400)
{ error: "Link ID is required" }

// Error (401)
{ error: "Unauthorized" }
```

**Example:**

```typescript
const updateLink = async (linkId: number, updates: object) => {
  const response = await fetch('/api/update-link', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id: linkId, ...updates }),
  });
  
  return response.json();
};
```

---

### 6. Get Playlist

Fetch YouTube playlist videos (public endpoint).

**Endpoint:** `GET /api/playlist`

**Auth Required:** ❌ No

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list` | string | Yes | YouTube playlist ID |

**Response:**

```typescript
// Success (200)
{
  videos: [
    {
      title: string;
      videoId: string;
      lengthSeconds: number;
      author: string;
    },
    // ... more videos
  ]
}

// Error (400)
{ error: "Playlist ID is required" }

// Error (500)
{ error: "Failed to fetch playlist" }
```

**Example:**

```typescript
const fetchPlaylist = async (playlistId: string) => {
  const response = await fetch(`/api/playlist?list=${playlistId}`);
  const { videos } = await response.json();
  return videos;
};
```

---

## Error Handling

All endpoints return consistent error responses:

```typescript
// Client Error (4xx)
{
  error: string;  // Human-readable error message
}

// Server Error (5xx)
{
  error: string;  // Error message
  details?: any;  // Optional debug info (dev only)
}
```

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request body/params |
| 401 | Unauthorized | Re-authenticate user |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Retry or contact support |

---

## Rate Limiting

Currently no rate limiting is implemented. For production:

- Consider adding rate limiting via middleware
- Use Supabase's built-in rate limiting features
- Implement client-side request throttling

---

## TypeScript Types

```typescript
// types/api.ts

interface SaveLinkRequest {
  url: string;
  title?: string;
  text?: string;
  category?: string;
}

interface CheckDuplicateRequest {
  url: string;
}

interface ToggleReadRequest {
  id: number;
  is_read: boolean;
}

interface UpdateLinkRequest {
  id: number;
  title?: string;
  description?: string;
  category?: string;
}

interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingLink: SharedLink | null;
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const response = await fetch('/api/endpoint', options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
}
```

### 2. Use Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const saveLink = async () => {
  setIsLoading(true);
  try {
    await fetch('/api/save-shared-content', ...);
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Optimistic Updates

```typescript
// Update UI immediately
setLinks(prev => prev.map(link => 
  link.id === id ? { ...link, is_read: true } : link
));

// Then sync with server
await fetch('/api/toggle-read', ...);
```
