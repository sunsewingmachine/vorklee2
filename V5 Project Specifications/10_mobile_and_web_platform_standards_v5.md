---
version: "5.3"
maintainer: "Vorklee2 Mobile & Web Platform Team"
last_updated: "2025-01-15 12:00:00 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready", "WCAG 2.1 AA"]
---

# 📱 12_Mobile_and_Web_Platform_Standards_v5.md  
## Mobile-First, Progressive Web App, and Native Mobile Development Standards for Vorklee2

---

## 🧭 Purpose

This document defines the **mobile and web platform standards** for the **Vorklee2 Enterprise Platform (v5.3)**.  
It ensures consistent, accessible, secure, and performant experiences across web browsers, Progressive Web Apps (PWA), and native mobile applications (iOS and Android).

---

## 🏗️ 1. Platform Architecture Overview

### Supported Platforms

| Platform | Technology Stack | Primary Use Case |
|----------|-----------------|------------------|
| **Web Application** | Next.js 14 + React Server Components | Desktop and tablet web browsers |
| **Progressive Web App (PWA)** | Next.js + Service Workers | Mobile web with app-like experience |
| **Native iOS App** | React Native / Swift (future) | iOS App Store distribution |
| **Native Android App** | React Native / Kotlin (future) | Google Play Store distribution |

### Cross-Platform Strategy

**Primary Approach**: React Native for code sharing between iOS and Android
- **Shared Business Logic**: 80%+ code sharing between platforms
- **Platform-Specific UI**: Native components when needed (20% platform-specific)
- **API Layer**: Shared TypeScript SDK generated from OpenAPI specs

**Alternative (Future)**: Native development for performance-critical apps
- Swift for iOS, Kotlin for Android
- Shared backend APIs via OpenAPI-generated SDKs

---

## 📐 2. Responsive Design Principles

### Mobile-First Design Philosophy

**Core Principle**: Design for mobile first, then enhance for larger screens.

**Breakpoint Strategy:**

| Device | Breakpoint | Container Width | Grid Columns |
|--------|------------|----------------|--------------|
| **Mobile** | < 640px | 100% | 1 column |
| **Tablet** | 640px - 1024px | 768px max | 2 columns |
| **Desktop** | 1024px - 1440px | 1200px max | 3 columns |
| **Large Desktop** | > 1440px | 1400px max | 4 columns |

**Next.js Tailwind CSS Implementation:**

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape / small tablet
      'md': '768px',   // Tablet portrait
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large desktop
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
  },
};
```

### Touch Target Guidelines

| Element Type | Minimum Size | Recommended Size |
|--------------|-------------|------------------|
| **Buttons** | 44×44px | 48×48px (iOS), 48dp (Android) |
| **Links** | 44×44px | Same as buttons |
| **Form Inputs** | 44px height | 48px height minimum |
| **Icon Buttons** | 44×44px | 48×48px |
| **List Items** | 48px height | 56px height (comfortable) |

### Typography Scaling

```css
/* Responsive typography using clamp() */
.heading-1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem); /* 28px - 40px */
}

.heading-2 {
  font-size: clamp(1.5rem, 3vw, 2rem); /* 24px - 32px */
}

.body-text {
  font-size: clamp(1rem, 2vw, 1.125rem); /* 16px - 18px */
}

.small-text {
  font-size: clamp(0.875rem, 1.5vw, 1rem); /* 14px - 16px */
}
```

### Layout Patterns

**Mobile Layout:**
- Single column layout
- Bottom navigation for primary actions
- Collapsible sidebars (drawer pattern)
- Stack cards vertically

**Tablet Layout:**
- Two-column layout for content
- Persistent sidebars
- Grid-based card layouts

**Desktop Layout:**
- Multi-column layouts
- Persistent navigation
- Side-by-side content views

---

## 🌐 3. Progressive Web App (PWA) Standards

### PWA Requirements

**Core PWA Features:**

| Feature | Requirement | Implementation |
|---------|------------|---------------|
| **Service Worker** | Mandatory | Cache API responses, offline support |
| **Web App Manifest** | Required | App metadata, icons, theme colors |
| **HTTPS** | Required | Secure context for service workers |
| **Responsive Design** | Required | Mobile-first, all screen sizes |
| **Offline Support** | Recommended | Cache static assets, API responses |
| **Push Notifications** | Optional | User permission required |
| **Install Prompt** | Optional | Custom install button |

### Service Worker Implementation

**Service Worker Strategy (Cache-First for Static, Network-First for API):**

```typescript
// public/sw.js
const CACHE_NAME = 'vorklee2-v1';
const STATIC_CACHE = 'vorklee2-static-v1';
const API_CACHE = 'vorklee2-api-v1';

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/static/css/main.css',
        '/static/js/main.js',
        // ... other static assets
      ]);
    })
  );
  self.skipWaiting();
});

// Fetch: Network-first for API, Cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // API requests: Network-first with cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((response) => {
            return response || new Response(
              JSON.stringify({ error: 'Offline' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
  } else {
    // Static assets: Cache-first
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
  }
});
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "Vorklee2 Notes",
  "short_name": "Notes",
  "description": "Collaborative note-taking platform",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "business"],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "New Note",
      "short_name": "New",
      "description": "Create a new note",
      "url": "/notes/new",
      "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
    }
  ]
}
```

### PWA Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.5s | Lighthouse |
| **Largest Contentful Paint (LCP)** | < 2.5s | Lighthouse |
| **Time to Interactive (TTI)** | < 3.5s | Lighthouse |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse |
| **First Input Delay (FID)** | < 100ms | Real User Monitoring |
| **Lighthouse PWA Score** | > 90 | Automated testing |

---

## 📱 4. Native Mobile App Architecture

### Technology Stack Decision

**Recommended**: React Native for maximum code sharing

**Rationale:**
- 80%+ code sharing between iOS and Android
- Shared TypeScript business logic
- Hot reload for faster development
- Large ecosystem of libraries
- Good performance for most use cases

**When to Use Native Development:**
- Performance-critical apps (games, video processing)
- Complex platform-specific features
- Maximum performance requirements
- Team expertise in Swift/Kotlin

### React Native Project Structure

```
apps/
├── mobile/                      # React Native app
│   ├── src/
│   │   ├── components/         # Shared React components
│   │   ├── screens/            # Screen components
│   │   ├── navigation/         # React Navigation setup
│   │   ├── services/           # API services (shared with web)
│   │   ├── store/             # State management (Redux/Zustand)
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utility functions
│   ├── ios/                   # iOS native code
│   │   ├── Vorklee2/
│   │   │   ├── AppDelegate.swift
│   │   │   └── Info.plist
│   ├── android/               # Android native code
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── java/com/vorklee2/
│   │   │   │   │   └── MainActivity.kt
│   │   │   └── AndroidManifest.xml
│   ├── package.json
│   └── metro.config.js
```

### Code Sharing Strategy

**Shared Code (80%):**
- Business logic (API calls, data transformations)
- State management (Redux stores, Zustand stores)
- Utility functions (date formatting, validation)
- Type definitions (TypeScript interfaces)
- API client SDK (generated from OpenAPI)

**Platform-Specific Code (20%):**
- UI components (when native look/feel required)
- Navigation (platform-specific patterns)
- Permissions handling (camera, location, etc.)
- Push notifications setup
- Biometric authentication

**Shared Package Structure:**

```
packages/
├── shared-mobile/              # Shared mobile code
│   ├── src/
│   │   ├── api/               # API client (shared)
│   │   ├── store/             # State management (shared)
│   │   ├── utils/             # Utilities (shared)
│   │   └── types/             # TypeScript types (shared)
│   └── package.json
```

### Native Module Integration

**When to Create Native Modules:**

| Use Case | Platform | Module Type |
|----------|----------|-------------|
| **Biometric Auth** | Both | Native module |
| **Certificate Pinning** | Both | Native module |
| **File System Access** | Both | Native module |
| **Background Tasks** | Both | Native module |
| **AR Features** | Both | Native module (future) |

**Example: Biometric Authentication Native Module**

```typescript
// packages/shared-mobile/src/native/BiometricAuth.ts
import { NativeModules, Platform } from 'react-native';

const { BiometricAuth } = NativeModules;

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function authenticate(
  reason: string
): Promise<BiometricResult> {
  try {
    if (Platform.OS === 'ios') {
      return await BiometricAuth.authenticateIOS(reason);
    } else {
      return await BiometricAuth.authenticateAndroid(reason);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## 🔒 5. Mobile App Security Standards

### Certificate Pinning

**Purpose**: Prevent man-in-the-middle attacks by validating server certificates.

**Implementation:**

```typescript
// iOS (Swift)
import TrustKit

TrustKit.initSharedInstance(withConfiguration: [
    kTSKSwizzleNetworkDelegates: true,
    kTSKPinnedDomains: [
        "api.vorklee.com": [
            kTSKPublicKeyAlgorithms: [kTSKAlgorithmRsa2048],
            kTSKPublicKeyHashes: [
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", // Replace with actual hash
            ],
            kTSKEnforcePinning: true,
            kTSKIncludeSubdomains: true
        ]
    ]
])

// Android (Kotlin)
val certificatePinner = CertificatePinner.Builder()
    .add("api.vorklee.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

**Key Management:**
- Store public key hashes (not certificates) for easier rotation
- Rotate keys every 90 days
- Support multiple pins during rotation period
- Fallback to network security config if pinning fails

### Biometric Authentication

**Supported Methods:**
- **iOS**: Face ID, Touch ID, Passcode fallback
- **Android**: Fingerprint, Face unlock, Pattern/PIN fallback

**Implementation:**

```typescript
// packages/shared-mobile/src/auth/BiometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics(): Promise<boolean> {
  // Check if device supports biometrics
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    throw new Error('Device does not support biometric authentication');
  }

  // Check enrolled biometrics
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    throw new Error('No biometrics enrolled on device');
  }

  // Authenticate
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your notes',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false, // Allow passcode fallback
  });

  return result.success;
}
```

### Secure Storage

**iOS Keychain / Android Keystore:**

```typescript
// Using expo-secure-store
import * as SecureStore from 'expo-secure-store';

// Store sensitive data (refresh tokens, API keys)
export async function storeSecure(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    requireAuthentication: true, // Require biometric to access
    authenticationPrompt: 'Authenticate to access secure data',
  });
}

// Retrieve sensitive data
export async function getSecure(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key, {
    requireAuthentication: true,
  });
}

// Remove sensitive data
export async function deleteSecure(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
```

### Mobile App Transport Security (ATS)

**iOS ATS Configuration:**

```xml
<!-- ios/Vorklee2/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.vorklee.com</key>
        <dict>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.3</string>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

**Android Network Security Config:**

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.vorklee.com</domain>
        <pin-set expiration="2025-12-31">
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

### Code Obfuscation & Anti-Tampering

**Android ProGuard Rules:**

```proguard
# android/app/proguard-rules.pro
-keep class com.vorklee2.** { *; }
-dontwarn com.vorklee2.**

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}

# Obfuscate but keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
```

**iOS Code Protection:**
- Enable Swift compiler optimization (`-O`)
- Strip debug symbols in release builds
- Enable dead code elimination
- Use code signing and provisioning profiles

---

## 📶 6. Offline-First Architecture

### Offline Data Strategy

**Storage Layers:**

| Layer | Technology | Purpose | Capacity |
|-------|------------|---------|----------|
| **Memory Cache** | React Query / Redux | In-memory state | Limited to app memory |
| **Local Database** | SQLite / Realm | Structured data | 100MB+ |
| **File Storage** | AsyncStorage / FileSystem | Files, images | Device-dependent |
| **Secure Storage** | Keychain / Keystore | Credentials | Small (KB) |

### Sync Strategy

**Optimistic Updates with Conflict Resolution:**

```typescript
// packages/shared-mobile/src/sync/NoteSync.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateNote() {
  const queryClient = useQueryClient();
  const offlineQueue = useOfflineQueue();

  return useMutation({
    mutationFn: async (note: CreateNoteInput) => {
      // 1. Save to local database immediately (optimistic)
      await localDB.notes.insert({ ...note, id: generateTempId(), synced: false });

      // 2. Try to sync to server
      try {
        const serverNote = await api.createNote(note);
        
        // 3. Update local DB with server ID
        await localDB.notes.update(note.tempId, {
          id: serverNote.id,
          synced: true,
        });
        
        return serverNote;
      } catch (error) {
        // 4. Queue for retry if offline
        if (!navigator.onLine) {
          await offlineQueue.add({
            type: 'CREATE_NOTE',
            payload: note,
            timestamp: Date.now(),
          });
        }
        throw error;
      }
    },
    onMutate: async (newNote) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(['notes']);

      // Optimistically update
      queryClient.setQueryData(['notes'], (old: Note[]) => [
        ...old,
        { ...newNote, id: generateTempId(), synced: false },
      ]);

      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      // Rollback on error
      queryClient.setQueryData(['notes'], context?.previousNotes);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
```

### Conflict Resolution

**Last-Write-Wins (LWW) with Timestamp:**

```typescript
// Conflict resolution when syncing
export async function resolveConflict(
  localNote: Note,
  serverNote: Note
): Promise<Note> {
  // Use updated_at timestamp (server is source of truth for time)
  if (serverNote.updated_at > localNote.updated_at) {
    // Server version wins
    return serverNote;
  } else {
    // Local version wins, but update server timestamp
    return {
      ...localNote,
      updated_at: new Date().toISOString(),
      conflict_resolved: true,
    };
  }
}
```

**Alternative: Operational Transformation (OT) for Real-time Collaboration**

For collaborative editing, consider OT or CRDT algorithms for conflict-free merging.

### Background Sync

**Service Worker Background Sync (PWA):**

```typescript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

async function syncNotes() {
  const offlineQueue = await getOfflineQueue();
  
  for (const item of offlineQueue) {
    try {
      await api[item.type](item.payload);
      await removeFromQueue(item.id);
    } catch (error) {
      // Retry next sync
      console.error('Sync failed:', error);
    }
  }
}
```

**React Native Background Tasks:**

```typescript
// Using @react-native-async-storage/async-storage and background-fetch
import BackgroundFetch from 'react-native-background-fetch';

BackgroundFetch.configure(
  {
    minimumFetchInterval: 15, // minutes
    stopOnTerminate: false,
    startOnBoot: true,
  },
  async (taskId) => {
    await syncOfflineQueue();
    BackgroundFetch.finish(taskId);
  },
  (error) => {
    console.error('Background fetch failed:', error);
  }
);
```

---

## 🔔 7. Push Notification Standards

### Push Notification Architecture

**Components:**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | Firebase Cloud Messaging (FCM) / Apple Push Notification (APN) | Send notifications |
| **PWA** | Web Push API | Browser notifications |
| **Native iOS** | APN | iOS App Store apps |
| **Native Android** | FCM | Google Play apps |

### Web Push (PWA)

**Service Worker Push Handler:**

```typescript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    data: data.data, // Custom data
    actions: data.actions || [], // Action buttons
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

### Native Push Notifications

**FCM Setup (Android):**

```typescript
// React Native with @react-native-firebase/messaging
import messaging from '@react-native-firebase/messaging';

// Request permission
export async function requestPushPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
}

// Get FCM token
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    // Send token to backend: await api.registerDeviceToken(token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

// Handle foreground messages
messaging().onMessage(async (remoteMessage) => {
  // Show local notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
    },
    trigger: null, // Show immediately
  });
});

// Handle background messages (in index.js)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message:', remoteMessage);
});
```

**APN Setup (iOS):**

```typescript
// Request permission (iOS)
import * as Notifications from 'expo-notifications';

export async function requestIOSPushPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Get APN token
export async function getAPNToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id',
    });
    // Send token to backend
    return token.data;
  } catch (error) {
    console.error('Failed to get APN token:', error);
    return null;
  }
}
```

### Notification Payload Format

**Standardized Payload:**

```json
{
  "title": "New note shared",
  "body": "John Doe shared a note with you",
  "data": {
    "type": "note_shared",
    "note_id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "/notes/123e4567-e89b-12d3-a456-426614174000"
  },
  "image": "https://cdn.vorklee.com/notes/thumbnail.png",
  "actions": [
    {
      "action": "open",
      "title": "Open Note"
    },
    {
      "action": "dismiss",
      "title": "Dismiss"
    }
  ],
  "priority": "high",
  "sound": "default",
  "badge": 1
}
```

---

## ⚡ 8. Mobile Performance Targets

### Performance SLAs

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| **App Launch Time (Cold)** | < 2 seconds | Firebase Performance / Sentry |
| **App Launch Time (Warm)** | < 500ms | Firebase Performance |
| **API Response Time (P95)** | < 250ms | APM (New Relic, Datadog) |
| **Screen Transition** | < 100ms | React Native Performance Monitor |
| **List Scroll FPS** | > 60 FPS | React Native Performance Monitor |
| **Image Load Time** | < 500ms | Custom metrics |
| **Offline Sync Time** | < 5 seconds | Custom metrics |

### Performance Optimization Techniques

**Code Splitting:**

```typescript
// Lazy load screens
const NotesScreen = React.lazy(() => import('./screens/NotesScreen'));
const NotebooksScreen = React.lazy(() => import('./screens/NotebooksScreen'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <NotesScreen />
</Suspense>
```

**Image Optimization:**

```typescript
// Use optimized images
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';

// For remote images, use FastImage for caching
<FastImage
  source={{
    uri: 'https://cdn.vorklee.com/image.jpg',
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>

// For local images, use require() for optimization
<Image source={require('./assets/image.png')} />
```

**List Performance (React Native):**

```typescript
// Use FlatList with optimization
import { FlatList } from 'react-native';

<FlatList
  data={notes}
  renderItem={({ item }) => <NoteItem note={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true} // Remove off-screen views
  maxToRenderPerBatch={10} // Render 10 items per batch
  windowSize={10} // Render 10 screens ahead
  getItemLayout={(data, index) => ({
    length: 80, // Fixed height
    offset: 80 * index,
    index,
  })}
/>
```

**Memory Management:**

```typescript
// Clean up subscriptions and timers
useEffect(() => {
  const subscription = api.subscribe();
  const timer = setInterval(() => {
    // Periodic task
  }, 1000);

  return () => {
    subscription.unsubscribe();
    clearInterval(timer);
  };
}, []);
```

---

## 🎨 9. Web Accessibility Standards (WCAG 2.1 AA)

### WCAG Compliance Requirements

**Level AA Compliance (Mandatory):**

| Principle | Requirement | Implementation |
|-----------|------------|---------------|
| **Perceivable** | Color contrast ratio ≥ 4.5:1 | Use accessible color palettes |
| **Perceivable** | Text alternatives for images | `alt` attributes, ARIA labels |
| **Operable** | Keyboard navigation | Tab order, focus indicators |
| **Operable** | No seizure triggers | No flashing > 3 times/second |
| **Understandable** | Error messages clear | Descriptive validation errors |
| **Robust** | Screen reader compatible | ARIA labels, semantic HTML |

### Implementation Checklist

**Keyboard Navigation:**

```typescript
// Ensure all interactive elements are keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Create new note"
>
  Create Note
</button>
```

**ARIA Labels:**

```typescript
// Use ARIA for screen readers
<div
  role="button"
  tabIndex={0}
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  onClick={handleClose}
>
  <span id="dialog-description">
    This dialog contains important information.
  </span>
</div>
```

**Color Contrast:**

```css
/* Minimum 4.5:1 contrast ratio for normal text */
.text-primary {
  color: #1f2937; /* Gray-800 on white = 12.6:1 ✓ */
}

.text-secondary {
  color: #6b7280; /* Gray-500 on white = 4.6:1 ✓ */
}

/* 3:1 for large text (18pt+ or 14pt+ bold) */
.text-large {
  color: #9ca3af; /* Gray-400 on white = 2.9:1 ✗ (use Gray-500) */
}
```

**Focus Indicators:**

```css
/* Visible focus indicators */
button:focus,
input:focus,
a:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Automated Accessibility Testing

**Tools:**
- **axe DevTools**: Browser extension + CI/CD integration
- **Lighthouse**: Automated accessibility audit
- **Pa11y**: Command-line accessibility testing
- **WAVE**: Browser extension for visual accessibility checking

**CI/CD Integration:**

```yaml
# .github/workflows/accessibility.yml
- name: Accessibility Test
  run: |
    npm install -g pa11y-ci
    pa11y-ci --sitemap https://staging.vorklee.com/sitemap.xml
```

---

## 🧪 10. Testing Standards for Mobile & Web

### Browser/Device Testing Matrix

**Required Testing:**

| Platform | Browsers | Versions | Devices |
|----------|----------|----------|---------|
| **Desktop** | Chrome, Firefox, Safari, Edge | Latest 2 versions | N/A |
| **Mobile Web** | Chrome (Android), Safari (iOS) | Latest 2 versions | iPhone 12+, Samsung Galaxy S21+ |
| **Tablet** | Safari (iPad), Chrome (Android) | Latest 2 versions | iPad Air, Samsung Galaxy Tab |

**Testing Tools:**
- **BrowserStack**: Cloud-based device/browser testing
- **Sauce Labs**: Automated cross-browser testing
- **iOS Simulator**: Local iOS testing
- **Android Emulator**: Local Android testing

### Mobile-Specific Testing

**Device Farm Testing:**

```yaml
# .github/workflows/mobile-test.yml
- name: Run Mobile Tests
  uses: browserstack/github-actions@master
  with:
    username: ${{ secrets.BROWSERSTACK_USERNAME }}
    access-key: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
    config-file-path: browserstack.yml
```

**Network Condition Testing:**

```typescript
// Test different network conditions
describe('Offline Functionality', () => {
  beforeEach(() => {
    // Simulate offline
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  });

  it('should queue requests when offline', async () => {
    const note = await createNote({ title: 'Test' });
    expect(note.synced).toBe(false);
    expect(offlineQueue.length).toBe(1);
  });
});
```

**Battery Usage Testing:**

```typescript
// Monitor battery usage (React Native)
import { useBatteryLevel } from '@react-native-community/hooks';

export function MonitorBatteryUsage() {
  const batteryLevel = useBatteryLevel();
  
  // Alert if battery usage is high
  if (batteryLevel < 0.2 && isBackgroundTaskRunning) {
    pauseBackgroundTasks();
  }
}
```

---

## 📊 11. Analytics & Crash Reporting

### Mobile Analytics

**Firebase Analytics / Mixpanel:**

```typescript
// Track screen views
import analytics from '@react-native-firebase/analytics';

export async function trackScreenView(screenName: string) {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
}

// Track events
export async function trackEvent(eventName: string, params: Record<string, any>) {
  await analytics().logEvent(eventName, params);
}
```

**Privacy-Compliant Analytics:**

```typescript
// Respect user privacy preferences
import { getPrivacyConsent } from './privacy';

export async function trackEvent(eventName: string, params: Record<string, any>) {
  const consent = await getPrivacyConsent();
  
  if (consent.analytics) {
    await analytics().logEvent(eventName, {
      ...params,
      // Redact PII
      user_id: consent.userId ? hashUserId(consent.userId) : null,
    });
  }
}
```

### Crash Reporting

**Sentry Integration:**

```typescript
// React Native
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2, // 20% of transactions
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
    }
    return event;
  },
});
```

**Error Boundary:**

```typescript
// React Error Boundary
import { ErrorBoundary } from '@sentry/react';

<ErrorBoundary
  fallback={({ error, resetError }) => (
    <ErrorScreen error={error} onReset={resetError} />
  )}
  showDialog
>
  <App />
</ErrorBoundary>
```

---

## 🚀 12. Mobile App Deployment Strategy

### App Store Submission Process

**iOS App Store:**

1. **Prerequisites:**
   - Apple Developer account ($99/year)
   - App Store Connect setup
   - Certificates and provisioning profiles

2. **Build Process:**
   ```bash
   # Build iOS app
   cd apps/mobile/ios
   xcodebuild -workspace Vorklee2.xcworkspace \
     -scheme Vorklee2 \
     -configuration Release \
     -archivePath build/Vorklee2.xcarchive \
     archive
   
   # Export for App Store
   xcodebuild -exportArchive \
     -archivePath build/Vorklee2.xcarchive \
     -exportPath build \
     -exportOptionsPlist ExportOptions.plist
   ```

3. **Submission:**
   - Upload via Xcode Organizer or Transporter
   - Fill App Store metadata (screenshots, description, keywords)
   - Submit for review (typical review time: 24-48 hours)

**Google Play Store:**

1. **Prerequisites:**
   - Google Play Console account ($25 one-time)
   - Signing key (store securely!)

2. **Build Process:**
   ```bash
   # Build Android app bundle (AAB)
   cd apps/mobile/android
   ./gradlew bundleRelease
   
   # Output: app/build/outputs/bundle/release/app-release.aab
   ```

3. **Submission:**
   - Upload AAB to Google Play Console
   - Fill store listing (screenshots, description)
   - Submit for review (typical review time: 1-3 days)

### Continuous Deployment

**Automated Build & Deploy Pipeline:**

```yaml
# .github/workflows/mobile-deploy.yml
name: Mobile App Deployment

on:
  push:
    tags:
      - 'mobile-v*'

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: cd apps/mobile && npm run build:ios
      - run: |
          # Upload to TestFlight
          xcrun altool --upload-app \
            --type ios \
            --file build/Vorklee2.ipa \
            --apiKey ${{ secrets.APPLE_API_KEY }} \
            --apiIssuer ${{ secrets.APPLE_ISSUER_ID }}

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: android-actions/setup-jdk@v1
      - run: npm ci
      - run: cd apps/mobile && npm run build:android
      - uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.vorklee2.mobile
          releaseFiles: apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
          track: internal # or alpha, beta, production
```

### Versioning Strategy

**Semantic Versioning:**

```
mobile-v1.2.3
  │   │ │
  │   │ └─ Patch (bug fixes)
  │   └─── Minor (new features, backward compatible)
  └─────── Major (breaking changes)
```

**Build Number:**

- **iOS**: Increment build number for each submission (e.g., 1, 2, 3...)
- **Android**: Version code (increment for each upload)

---

## ✅ 13. Summary

The **Mobile & Web Platform Standards** establish the foundation for consistent, accessible, secure, and performant experiences across all platforms.

**Key Standards:**
- **Mobile-First Design**: Responsive breakpoints, touch targets, typography scaling
- **PWA Support**: Service workers, web app manifest, offline capabilities
- **Native App Architecture**: React Native for code sharing, native modules when needed
- **Security**: Certificate pinning, biometric auth, secure storage, ATS/Network Security Config
- **Offline-First**: Optimistic updates, conflict resolution, background sync
- **Push Notifications**: FCM/APN integration, standardized payload format
- **Performance Targets**: App launch <2s, API <250ms, 60 FPS scrolling
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **Testing**: Browser/device matrix, network conditions, battery usage
- **Analytics & Crash Reporting**: Privacy-compliant tracking, Sentry integration
- **Deployment**: App Store/Play Store submission, CI/CD automation

By following these standards, Vorklee2 delivers **enterprise-grade mobile and web experiences** that are future-proof, scalable, secure, and accessible to all users.

---

**End of File — 12_Mobile_and_Web_Platform_Standards_v5.md**

