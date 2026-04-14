# EverSiteAudit - Technical Architecture Specification

## Privacy-First Mobile Site Auditing Application

**Version:** 1.0  
**Date:** January 2025  
**Classification:** Technical Architecture Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Data Architecture](#3-data-architecture)
4. [Security Architecture](#4-security-architecture)
5. [File System Design](#5-file-system-design)
6. [Component Architecture](#6-component-architecture)
7. [Export System Design](#7-export-system-design)
8. [State Management](#8-state-management)
9. [Performance Strategy](#9-performance-strategy)
10. [Platform Considerations](#10-platform-considerations)

---

## 1. Executive Summary

### 1.1 Architecture Philosophy

EverSiteAudit is built on three foundational principles:

1. **Privacy-First by Design**: All data remains on-device. No backend infrastructure, no cloud sync, no telemetry.
2. **100% Offline Functionality**: Full feature parity regardless of network connectivity.
3. **Enterprise-Grade Security**: Hardware-backed encryption with defense-in-depth strategy.

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Flutter 3.24+** | Superior performance, compiled native code, excellent camera/file system APIs |
| Database | **SQLite + SQLCipher** via `drift` | Battle-tested, full SQL support, transparent AES-256 encryption |
| Encryption | **Hardware-backed + SQLCipher** | Defense in depth: OS-level + database-level |
| PDF Generation | **Native PDFKit (iOS) / PDFBox (Android)** | Performance-critical for 100+ photo reports |
| State Management | **Riverpod 2.x** | Type-safe, testable, excellent for complex offline state |

### 1.3 Why Not Alternatives

**Why Not React Native?**
- JavaScript bridge overhead impacts camera/file system performance
- Encryption library ecosystem less mature for enterprise requirements
- PDF generation requires additional native modules or JavaScript-based solutions with memory issues
- While RN has improved with New Architecture, Flutter's AOT compilation provides more predictable performance for media-heavy operations

**Why Not Pure Native (Swift/Kotlin)?**
- 2x development cost for feature parity
- Maintenance burden of dual codebases for a single-developer premium app
- Cross-platform testing complexity

**Why Not Realm?**
- MongoDB deprecated Realm Sync in 2024, signaling reduced future investment
- Object-based model less suitable for complex relational queries needed for audit reporting
- Larger binary size (~5MB vs <1MB for SQLite)
- Migration path uncertainty

---

## 2. Technology Stack

### 2.1 Primary Framework

```yaml
Framework: Flutter 3.24.0+
Language: Dart 3.5+
Minimum iOS: 14.0
Minimum Android: API 26 (Android 8.0)
Target SDK: iOS 17 / Android API 34
```

**Justification:**
- Flutter compiles to native ARM code via AOT, delivering near-native performance
- Impeller rendering engine (default on iOS) provides consistent 60fps
- Direct platform channel access for hardware integration without bridge overhead
- Single codebase with 95%+ code reuse between platforms

### 2.2 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drift` | ^2.18.0 | Type-safe SQLite with SQLCipher support |
| `sqlcipher_flutter_libs` | ^0.6.0 | SQLCipher native bindings |
| `flutter_secure_storage` | ^9.2.0 | Hardware-backed key storage |
| `local_auth` | ^2.2.0 | Biometric authentication |
| `photo_manager` | ^3.2.0 | High-performance photo gallery access |
| `camera` | ^0.11.0 | Camera capture with full control |
| `image` | ^4.1.0 | Image processing (thumbnails, EXIF) |
| `path_provider` | ^2.1.0 | Standardized directory access |
| `share_plus` | ^9.0.0 | Export sharing |
| `archive` | ^3.6.0 | ZIP creation |
| `riverpod` | ^2.5.0 | State management |
| `freezed` | ^2.5.0 | Immutable data classes |
| `json_serializable` | ^6.8.0 | JSON serialization |

### 2.3 Platform-Specific PDF Dependencies

**iOS:**
- Native PDFKit framework (built-in, no external dependency)
- Custom Swift plugin for PDF generation pipeline

**Android:**
- `android-pdf-generator` (wrapper around PdfDocument API)
- Custom Kotlin plugin for complex layouts

### 2.4 Development Tools

```yaml
IDE: VS Code / Android Studio
Linting: flutter_lints ^4.0.0
Testing: flutter_test, mockito, drift_test
CI/CD: GitHub Actions (optional for solo dev)
Code Generation: build_runner, drift_dev
```

### 2.5 Build Configuration

```yaml
# pubspec.yaml key configurations
flutter:
  uses-material-design: true
  
  # Assets bundled with app
  assets:
    - assets/templates/
    - assets/fonts/
    
  # Native plugin configuration
  plugin:
    platforms:
      ios:
        pluginClass: EsaPdfKitPlugin
      android:
        package: com.eversiteaudit.pdf
        pluginClass: EsaPdfGeneratorPlugin
```

---

## 3. Data Architecture

### 3.1 Database Selection: SQLite + SQLCipher via Drift

**Why SQLite + SQLCipher:**
- Industry standard with 20+ years of production use
- Full SQL support for complex reporting queries
- SQLCipher provides transparent AES-256 encryption
- Drift provides type-safe Dart API with compile-time query validation
- Small footprint (<1MB)

**Why Not ObjectBox:**
- NoSQL model makes complex relational queries difficult
- Less mature ecosystem for Flutter
- Proprietary sync (not needed for this app)

**Why Not Hive:**
- Key-value store unsuitable for relational data
- No built-in encryption
- No SQL query capabilities

### 3.2 Database Schema

#### 3.2.1 Projects Table

```sql
CREATE TABLE projects (
    -- Primary Key
    id TEXT PRIMARY KEY,  -- UUID v4
    
    -- Core Fields
    name TEXT NOT NULL,
    description TEXT,
    site_address TEXT,
    client_name TEXT,
    
    -- Status & Metadata
    status TEXT NOT NULL DEFAULT 'active',  -- active, completed, archived
    priority INTEGER DEFAULT 0,  -- 0=low, 1=medium, 2=high, 3=critical
    
    -- Timestamps
    created_at INTEGER NOT NULL,  -- Unix timestamp (milliseconds)
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    
    -- Audit Fields
    created_by TEXT,  -- Inspector name/ID
    
    -- Soft Delete
    is_deleted INTEGER DEFAULT 0,  -- 0=false, 1=true
    deleted_at INTEGER
) STRICT;

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
CREATE INDEX idx_projects_deleted ON projects(is_deleted) WHERE is_deleted = 0;
```

#### 3.2.2 Issues Table

```sql
CREATE TABLE issues (
    -- Primary Key
    id TEXT PRIMARY KEY,  -- UUID v4
    
    -- Foreign Key
    project_id TEXT NOT NULL,
    
    -- Core Fields
    title TEXT NOT NULL,
    description TEXT,
    
    -- Categorization
    category TEXT,  -- safety, quality, compliance, environmental, other
    severity TEXT DEFAULT 'medium',  -- low, medium, high, critical
    status TEXT DEFAULT 'open',  -- open, in_progress, resolved, closed
    
    -- Location (optional)
    location_description TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    gps_accuracy REAL,
    
    -- Assignment
    assigned_to TEXT,
    due_date INTEGER,  -- Unix timestamp
    
    -- Resolution
    resolution_notes TEXT,
    resolved_at INTEGER,
    resolved_by TEXT,
    
    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Soft Delete
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    
    -- Constraints
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) STRICT;

-- Indexes
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_updated ON issues(updated_at DESC);
CREATE INDEX idx_issues_deleted ON issues(is_deleted) WHERE is_deleted = 0;
```

#### 3.2.3 Photos Table

```sql
CREATE TABLE photos (
    -- Primary Key
    id TEXT PRIMARY KEY,  -- UUID v4
    
    -- Foreign Keys
    project_id TEXT NOT NULL,
    issue_id TEXT,  -- NULL if project-level photo
    
    -- File References (relative paths)
    original_path TEXT NOT NULL,  -- Full-resolution image
    thumbnail_path TEXT NOT NULL,  -- 300x300 thumbnail
    compressed_path TEXT,  -- 1920x1080 compressed for PDF
    
    -- EXIF/Metadata (extracted on capture)
    capture_timestamp INTEGER,
    camera_make TEXT,
    camera_model TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    gps_altitude REAL,
    
    -- Dimensions
    width INTEGER,
    height INTEGER,
    file_size_bytes INTEGER,
    
    -- User Metadata
    caption TEXT,
    tags TEXT,  -- JSON array of tag strings
    
    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Soft Delete
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    
    -- Constraints
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL
) STRICT;

-- Indexes
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_photos_issue ON photos(issue_id) WHERE issue_id IS NOT NULL;
CREATE INDEX idx_photos_created ON photos(created_at DESC);
CREATE INDEX idx_photos_deleted ON photos(is_deleted) WHERE is_deleted = 0;
```

#### 3.2.4 Annotations Table (Photo Markup)

```sql
CREATE TABLE annotations (
    -- Primary Key
    id TEXT PRIMARY KEY,  -- UUID v4
    
    -- Foreign Key
    photo_id TEXT NOT NULL,
    
    -- Annotation Type
    type TEXT NOT NULL,  -- arrow, circle, rectangle, text, highlight
    
    -- Position (normalized 0.0-1.0 coordinates)
    x REAL NOT NULL,  -- Center X
    y REAL NOT NULL,  -- Center Y
    width REAL,  -- For shapes
    height REAL,
    rotation REAL DEFAULT 0,  -- Degrees
    
    -- Style
    color TEXT DEFAULT '#FF0000',  -- Hex color
    stroke_width REAL DEFAULT 2.0,
    
    -- Content (for text annotations)
    text_content TEXT,
    font_size REAL,
    
    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Soft Delete
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER,
    
    -- Constraints
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
) STRICT;

-- Indexes
CREATE INDEX idx_annotations_photo ON annotations(photo_id);
CREATE INDEX idx_annotations_deleted ON annotations(is_deleted) WHERE is_deleted = 0;
```

#### 3.2.5 Templates Table

```sql
CREATE TABLE templates (
    -- Primary Key
    id TEXT PRIMARY KEY,  -- UUID v4
    
    -- Core Fields
    name TEXT NOT NULL,
    description TEXT,
    
    -- Template Type
    type TEXT NOT NULL,  -- project_structure, issue_categories, export_format
    
    -- Template Content (JSON)
    content TEXT NOT NULL,  -- Flexible JSON structure
    
    -- Usage
    is_default INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Soft Delete
    is_deleted INTEGER DEFAULT 0,
    deleted_at INTEGER
) STRICT;

-- Indexes
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_default ON templates(is_default) WHERE is_default = 1;
```

#### 3.2.6 Settings Table (Key-Value Store)

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    value_type TEXT DEFAULT 'string',  -- string, int, double, bool, json
    updated_at INTEGER NOT NULL
) STRICT;

-- Common Settings Keys
-- 'encryption_enabled' -> 'true'/'false'
-- 'biometric_required' -> 'true'/'false'
-- 'auto_lock_timeout' -> '300' (seconds)
-- 'thumbnail_quality' -> '85' (0-100)
-- 'pdf_compression' -> 'medium' (low/medium/high)
-- 'default_export_format' -> 'pdf'
-- 'last_backup_date' -> timestamp
```

#### 3.2.7 Export History Table

```sql
CREATE TABLE export_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    export_type TEXT NOT NULL,  -- pdf, zip, json
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER,
    export_timestamp INTEGER NOT NULL,
    password_protected INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_export_history_project ON export_history(project_id);
CREATE INDEX idx_export_history_timestamp ON export_history(export_timestamp DESC);
```

### 3.3 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    projects     │       │     issues      │       │     photos      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK: id          │◄──────┤ FK: project_id  │       │ FK: project_id  │
│    name         │  1:M  │    title        │       │ FK: issue_id    │
│    status       │       │    severity     │       │    original_path│
│    created_at   │       │    status       │       │    thumbnail    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                       │                           │
         │                       │                           │
         │                       │                    ┌─────────────────┐
         │                       │                    │  annotations    │
         │                       │                    ├─────────────────┤
         │                       │                    │ FK: photo_id    │
         │                       │                    │    type         │
         │                       │                    │    x, y         │
         │                       │                    └─────────────────┘
         │                       │
         │                       ▼
         │               ┌─────────────────┐
         │               │ export_history  │
         │               ├─────────────────┤
         │               │ FK: project_id  │
         └──────────────►│    export_type  │
                         │    file_name    │
                         └─────────────────┘
```

### 3.4 Indexing Strategy

**Primary Indexes:**
- All foreign keys indexed for JOIN performance
- `updated_at DESC` for "recently modified" queries
- `is_deleted` partial indexes to exclude soft-deleted records

**Query Pattern Optimization:**
- Project list: `idx_projects_status` + `idx_projects_deleted`
- Issue filtering: `idx_issues_project` + `idx_issues_status` + `idx_issues_severity`
- Gallery loading: `idx_photos_project` + `idx_photos_created`

### 3.5 Migration Strategy

**Schema Versioning:**
```dart
// In Drift database class
@DriftDatabase(tables: [Projects, Issues, Photos, Annotations, Templates, Settings, ExportHistory])
class AppDatabase extends _$AppDatabase {
  @override
  int get schemaVersion => 1;  // Increment on schema changes

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      await m.createAll();
      await _seedDefaultTemplates();
    },
    onUpgrade: (m, from, to) async {
      // Step-by-step migrations
      if (from < 2) {
        await m.addColumn(photos, photos.compressedPath);
      }
      if (from < 3) {
        await m.createTable(exportHistory);
      }
    },
  );
}
```

**Migration Principles:**
1. Never drop data in migrations
2. Add nullable columns first, backfill, then add constraints
3. Test migrations with production-sized datasets
4. Keep migration scripts idempotent

---

## 4. Security Architecture

### 4.1 Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Device theft | High | High | Full-disk encryption + app-level encryption |
| App cloning | Medium | High | Device-bound encryption keys |
| Forensic recovery | Medium | High | SQLCipher + secure key storage |
| Shoulder surfing | High | Medium | Biometric auth + auto-lock |
| Malware/rooted device | Low | High | Hardware-backed keystore, key attestation |
| Data leakage via backups | Medium | High | Exclude from cloud backups |

### 4.2 Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: OS PROTECTION                    │
│  • iOS Data Protection (NSFileProtectionComplete)           │
│  • Android File-Based Encryption (FBE)                      │
│  • Device PIN/Biometric required                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 2: APPLICATION ENCRYPTION              │
│  • SQLCipher AES-256 database encryption                    │
│  • Hardware-backed key derivation                           │
│  • Memory encryption for sensitive operations               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 3: KEY MANAGEMENT                     │
│  • iOS: Secure Enclave / Keychain                           │
│  • Android: TEE / StrongBox Keystore                        │
│  • Key rotation on app reinstall                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Encryption Implementation

#### 4.3.1 Database Encryption (SQLCipher)

```dart
// SQLCipher configuration
import 'package:drift/drift.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';

class EncryptedDatabase extends AppDatabase {
  static Future<EncryptedDatabase> create() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'eversiteaudit.db'));
    
    // Retrieve or generate encryption key
    final encryptionKey = await _getOrCreateEncryptionKey();
    
    return EncryptedDatabase._internal(
      NativeDatabase.createInBackground(
        file,
        setup: (rawDb) {
          // Apply SQLCipher key
          rawDb.execute("PRAGMA key = '$encryptionKey';");
          
          // Security hardening
          rawDb.execute('PRAGMA cipher_page_size = 4096;');
          rawDb.execute('PRAGMA kdf_iter = 256000;');  // PBKDF2 iterations
          rawDb.execute('PRAGMA cipher_hmac_algorithm = HMAC_SHA512;');
          rawDb.execute('PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;');
        },
      ),
    );
  }
}
```

#### 4.3.2 Key Management

```dart
// Key retrieval/creation with hardware backing
Future<String> _getOrCreateEncryptionKey() async {
  const keyAlias = 'eversiteaudit_db_key';
  const keyStorageKey = 'db_encryption_key_encrypted';
  
  final secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_PKCS1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accountName: keyAlias,
      accessibility: KeychainAccessibility.whenUnlockedThisDeviceOnly,
    ),
  );
  
  // Try to retrieve existing key
  final existingKey = await secureStorage.read(key: keyStorageKey);
  if (existingKey != null) {
    return existingKey;
  }
  
  // Generate new 256-bit key (64 hex characters)
  final keyBytes = SecureRandom(32).bytes;
  final keyHex = keyBytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  
  // Store in hardware-backed secure storage
  await secureStorage.write(key: keyStorageKey, value: keyHex);
  
  return keyHex;
}
```

#### 4.3.3 iOS Secure Enclave Integration

```swift
// iOS native code for Secure Enclave key generation
import LocalAuthentication
import CryptoKit

class SecureEnclaveManager {
    static func generateDatabaseKey() throws -> String {
        let context = LAContext()
        context.localizedReason = "Secure your audit data"
        
        // Generate key in Secure Enclave (P-256 for SE compatibility)
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: "com.eversiteaudit.dbkey",
                kSecAttrAccessControl as String: SecAccessControlCreateWithFlags(
                    nil,
                    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                    .privateKeyUsage,
                    nil
                )!
            ]
        ]
        
        // Generate and derive database encryption key
        // Note: Secure Enclave only supports P-256, so we derive AES key
        let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, nil)
        // Derive 256-bit AES key using HKDF
        // ... derivation logic
        
        return derivedKeyHex
    }
}
```

#### 4.3.4 Android Keystore Integration

```kotlin
// Android native code for TEE/StrongBox key generation
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class AndroidKeystoreManager {
    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val KEY_ALIAS = "eversiteaudit_db_key"
        
        fun generateDatabaseKey(): String {
            val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
            keyStore.load(null)
            
            // Check if key exists
            if (keyStore.containsAlias(KEY_ALIAS)) {
                return retrieveExistingKey()
            }
            
            // Generate new AES-256 key
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            
            val builder = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setUserAuthenticationRequired(false)  // App-level auth instead
            
            // Use StrongBox if available (dedicated secure hardware)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                builder.setIsStrongBoxBacked(true)
            }
            
            keyGenerator.init(builder.build())
            val secretKey = keyGenerator.generateKey()
            
            // Export key material for SQLCipher (wrapped)
            return exportKeyForSqlCipher(secretKey)
        }
    }
}
```

### 4.4 Memory Security

```dart
// Clear sensitive data when app backgrounds
class SecurityLifecycleManager extends WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || 
        state == AppLifecycleState.inactive) {
      _clearSensitiveMemory();
      _lockDatabaseConnection();
    }
    
    if (state == AppLifecycleState.resumed) {
      _promptAuthenticationIfRequired();
    }
  }
  
  void _clearSensitiveMemory() {
    // Clear any cached passwords/keys from memory
    EncryptionKeyCache.instance.clear();
    
    // Force garbage collection hint
    // Note: Dart doesn't allow direct GC control
  }
  
  void _lockDatabaseConnection() {
    // Close database connection when backgrounded
    DatabaseProvider.instance.closeConnection();
  }
}
```

### 4.5 Export Password Protection

```dart
// Password-protected ZIP/PDF exports
import 'package:archive/archive.dart';
import 'package:crypto/crypto.dart';

Future<File> createPasswordProtectedExport(
  List<File> files,
  String password,
) async {
  // Derive key using PBKDF2
  final salt = SecureRandom(16).bytes;
  final keyDerivation = await _deriveKey(password, salt);
  
  // Create AES-256 encrypted ZIP
  final archive = Archive();
  
  for (final file in files) {
    final bytes = await file.readAsBytes();
    final encrypted = _aesEncrypt(bytes, keyDerivation.key);
    
    archive.addFile(ArchiveFile(
      file.path.split('/').last,
      encrypted.length,
      encrypted,
    ));
  }
  
  // Write with salt prepended for decryption
  final zipEncoder = ZipEncoder();
  final encoded = zipEncoder.encode(archive);
  
  final outputFile = await _getExportFilePath();
  return outputFile.writeAsBytes([...salt, ...encoded!]);
}

Future<DerivedKey> _deriveKey(String password, List<int> salt) async {
  // PBKDF2 with 100,000 iterations
  final pbkdf2 = PBKDF2(
    algorithm: sha256,
    blockLength: 64,
    desiredKeyLength: 32,
    iterations: 100000,
  );
  
  final key = pbkdf2.deriveKey(
    utf8.encode(password) as Uint8List,
    Uint8List.fromList(salt),
  );
  
  return DerivedKey(key: key, salt: salt);
}
```

### 4.6 Backup Exclusion

```xml
<!-- Android: res/xml/backup_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <!-- Exclude database and photos from cloud backup -->
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="FlutterSecureStorage" />
</full-backup-content>
```

```xml
<!-- AndroidManifest.xml -->
<application
    android:allowBackup="false"
    android:fullBackupContent="@xml/backup_rules"
    ... >
```

```swift
// iOS: Exclude from iCloud backup
func excludeFromBackup(_ url: URL) throws {
    var resourceValues = URLResourceValues()
    resourceValues.isExcludedFromBackup = true
    
    var mutableURL = url
    try mutableURL.setResourceValues(resourceValues)
}
```

---

## 5. File System Design

### 5.1 Directory Structure

```
${APP_DOCUMENTS}/
├── database/
│   └── eversiteaudit.db          # SQLCipher encrypted database
│
├── photos/
│   ├── original/                 # Full-resolution captured photos
│   │   └── ${PROJECT_ID}/
│   │       └── ${PHOTO_ID}.jpg
│   │
│   ├── thumbnails/               # 300x300 thumbnails
│   │   └── ${PROJECT_ID}/
│   │       └── ${PHOTO_ID}.jpg
│   │
│   └── compressed/               # 1920x1080 for PDF embedding
│       └── ${PROJECT_ID}/
│           └── ${PHOTO_ID}.jpg
│
├── exports/                      # Temporary export staging
│   ├── pdf/
│   │   └── ${EXPORT_ID}.pdf
│   └── zip/
│       └── ${EXPORT_ID}.zip
│
├── cache/                        # Non-essential cache (can be purged)
│   ├── image_processing/         # Temporary processing files
│   └── pdf_generation/           # PDF build temp files
│
└── logs/                         # Diagnostic logs (optional)
    └── app.log
```

### 5.2 Photo Storage Naming Convention

```dart
class PhotoPathManager {
  static const String _photosDir = 'photos';
  static const String _originalDir = 'original';
  static const String _thumbnailDir = 'thumbnails';
  static const String _compressedDir = 'compressed';
  
  /// Generate storage paths for a new photo
  static PhotoPaths generatePaths(String projectId) {
    final photoId = _generatePhotoId();  // UUID v4
    
    return PhotoPaths(
      photoId: photoId,
      original: '$_photosDir/$_originalDir/$projectId/$photoId.jpg',
      thumbnail: '$_photosDir/$_thumbnailDir/$projectId/$photoId.jpg',
      compressed: '$_photosDir/$_compressedDir/$projectId/$photoId.jpg',
    );
  }
  
  /// Photo ID format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
  /// Benefits:
  /// - Globally unique, no collision risk
  /// - No sequential enumeration (security)
  /// - Sortable by creation time (UUID v7 variant)
  static String _generatePhotoId() {
    return const Uuid().v4();
  }
  
  /// Full path resolution
  static Future<String> resolveFullPath(String relativePath) async {
    final appDir = await getApplicationDocumentsDirectory();
    return p.join(appDir.path, relativePath);
  }
}

class PhotoPaths {
  final String photoId;
  final String original;
  final String thumbnail;
  final String compressed;
  
  PhotoPaths({
    required this.photoId,
    required this.original,
    required this.thumbnail,
    required this.compressed,
  });
}
```

### 5.3 Thumbnail Generation Strategy

```dart
class ThumbnailGenerator {
  static const int thumbnailSize = 300;
  static const int compressedMaxWidth = 1920;
  static const int compressedMaxHeight = 1080;
  static const int jpegQuality = 85;
  
  /// Generate thumbnail and compressed versions
  static Future<void> generateVariants(String originalPath) async {
    final originalFile = File(originalPath);
    final bytes = await originalFile.readAsBytes();
    
    // Decode original
    final originalImage = img.decodeImage(bytes);
    if (originalImage == null) throw Exception('Failed to decode image');
    
    // Generate thumbnail (300x300, cropped to center)
    final thumbnail = img.copyResizeCropSquare(
      originalImage,
      size: thumbnailSize,
    );
    
    // Generate compressed (max 1920x1080, maintain aspect ratio)
    final compressed = img.copyResize(
      originalImage,
      width: originalImage.width > compressedMaxWidth 
          ? compressedMaxWidth 
          : originalImage.width,
      height: originalImage.height > compressedMaxHeight 
          ? compressedMaxHeight 
          : originalImage.height,
      maintainAspect: true,
    );
    
    // Save variants
    await _saveImage(thumbnailPath, thumbnail, quality: 80);
    await _saveImage(compressedPath, compressed, quality: jpegQuality);
  }
  
  static Future<void> _saveImage(
    String path,
    img.Image image, {
    required int quality,
  }) async {
    final encoded = img.encodeJpg(image, quality: quality);
    final file = File(path);
    await file.parent.create(recursive: true);
    await file.writeAsBytes(encoded);
  }
}
```

### 5.4 Cache Strategy and Cleanup

```dart
class CacheManager {
  static const Duration maxCacheAge = Duration(days: 7);
  static const int maxCacheSizeMB = 500;
  
  /// Clean up old cache files
  static Future<void> cleanupCache() async {
    final cacheDir = await _getCacheDirectory();
    final now = DateTime.now();
    
    await for (final entity in cacheDir.list(recursive: true)) {
      if (entity is File) {
        final stat = await entity.stat();
        final age = now.difference(stat.modified);
        
        if (age > maxCacheAge) {
          await entity.delete();
        }
      }
    }
    
    // If still over size limit, delete oldest files
    await _enforceSizeLimit();
  }
  
  /// Purge all cache (call on low storage)
  static Future<void> purgeAllCache() async {
    final cacheDir = await _getCacheDirectory();
    if (await cacheDir.exists()) {
      await cacheDir.delete(recursive: true);
      await cacheDir.create(recursive: true);
    }
  }
  
  /// Get total cache size
  static Future<int> getCacheSizeBytes() async {
    final cacheDir = await _getCacheDirectory();
    int totalSize = 0;
    
    await for (final entity in cacheDir.list(recursive: true)) {
      if (entity is File) {
        totalSize += await entity.length();
      }
    }
    
    return totalSize;
  }
}
```

### 5.5 Storage Monitoring

```dart
class StorageMonitor {
  /// Check available storage before operations
  static Future<bool> hasSufficientStorage(int requiredBytes) async {
    final info = await DiskSpaceInfo.get();
    final available = info.availableBytes;
    
    // Require 2x the requested space for safety margin
    return available >= (requiredBytes * 2);
  }
  
  /// Get storage breakdown for UI display
  static Future<StorageBreakdown> getStorageBreakdown() async {
    final appDir = await getApplicationDocumentsDirectory();
    
    return StorageBreakdown(
      database: await _getDirectorySize('${appDir.path}/database'),
      photosOriginal: await _getDirectorySize('${appDir.path}/photos/original'),
      photosThumbnails: await _getDirectorySize('${appDir.path}/photos/thumbnails'),
      photosCompressed: await _getDirectorySize('${appDir.path}/photos/compressed'),
      exports: await _getDirectorySize('${appDir.path}/exports'),
      cache: await _getDirectorySize('${appDir.path}/cache'),
    );
  }
}
```

---

## 6. Component Architecture

### 6.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Project    │  │   Issue     │  │   Camera    │  │  Gallery   │ │
│  │    List     │  │   Detail    │  │   Screen    │  │   Screen   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │               │        │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌────┴──────┐ │
│  │  Project    │  │   Issue     │  │   Photo     │  │  Export   │ │
│  │   Editor    │  │   Editor    │  │  Annotator  │  │   Flow    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT (Riverpod)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Project     │  │   Issue     │  │   Photo     │  │   Export   │ │
│  │  Provider   │  │  Provider   │  │  Provider   │  │  Provider  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
└─────────┼────────────────┼────────────────┼───────────────┼────────┘
          │                │                │               │
          ▼                ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DOMAIN/BUSINESS LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Project    │  │   Issue     │  │   Photo     │  │   Export   │ │
│  │   Service   │  │   Service   │  │   Service   │  │   Service  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
└─────────┼────────────────┼────────────────┼───────────────┼────────┘
          │                │                │               │
          ▼                ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Repository Layer                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │  Project    │  │   Issue     │  │   Photo     │           │  │
│  │  │ Repository  │  │ Repository  │  │ Repository  │           │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │  │
│  │         │                │                │                   │  │
│  │  ┌──────┴────────────────┴────────────────┴──────┐            │  │
│  │  │              Drift Database (SQLCipher)        │            │  │
│  │  └────────────────────────────────────────────────┘            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    File System Layer                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │   Photo     │  │   Export    │  │   Cache     │           │  │
│  │  │   Store     │  │   Store     │  │   Manager   │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │                │                │               │
          ▼                ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PLATFORM SERVICES                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Camera    │  │   Gallery   │  │  PDF Gen    │  │  Sharing   │ │
│  │   Service   │  │   Service   │  │  (Native)   │  │  Service   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Repository Pattern Implementation

```dart
// Base repository interface
abstract class Repository<T, ID> {
  Future<T?> getById(ID id);
  Future<List<T>> getAll();
  Future<ID> insert(T entity);
  Future<void> update(T entity);
  Future<void> delete(ID id);
  Future<void> softDelete(ID id);
}

// Project Repository
class ProjectRepository implements Repository<Project, String> {
  final AppDatabase _db;
  
  ProjectRepository(this._db);
  
  @override
  Future<Project?> getById(String id) async {
    final query = _db.select(_db.projects)
      ..where((p) => p.id.equals(id))
      ..where((p) => p.isDeleted.equals(false));
    return query.getSingleOrNull();
  }
  
  @override
  Future<List<Project>> getAll() async {
    final query = _db.select(_db.projects)
      ..where((p) => p.isDeleted.equals(false))
      ..orderBy([(p) => OrderingTerm.desc(p.updatedAt)]);
    return query.get();
  }
  
  @override
  Future<String> insert(Project project) async {
    final companion = ProjectsCompanion.insert(
      id: project.id,
      name: project.name,
      description: Value(project.description),
      // ... other fields
      createdAt: Value(DateTime.now().millisecondsSinceEpoch),
      updatedAt: Value(DateTime.now().millisecondsSinceEpoch),
    );
    
    await _db.into(_db.projects).insert(companion);
    return project.id;
  }
  
  @override
  Future<void> update(Project project) async {
    final companion = ProjectsCompanion(
      name: Value(project.name),
      description: Value(project.description),
      updatedAt: Value(DateTime.now().millisecondsSinceEpoch),
    );
    
    await _db.update(_db.projects).replace(companion);
  }
  
  @override
  Future<void> delete(String id) async {
    await _db.delete(_db.projects).delete(ProjectsCompanion(id: Value(id)));
  }
  
  @override
  Future<void> softDelete(String id) async {
    await (_db.update(_db.projects)
      ..where((p) => p.id.equals(id)))
      .write(ProjectsCompanion(
        isDeleted: const Value(true),
        deletedAt: Value(DateTime.now().millisecondsSinceEpoch),
      ));
  }
}
```

---

## 7. Export System Design

### 7.1 Export Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXPORT PIPELINE                               │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │ User Request │
  │  Export PDF  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ 1. VALIDATION PHASE                                              │
  │    • Check storage availability                                  │
  │    • Validate project exists                                     │
  │    • Count photos for memory estimation                          │
  └──────┬───────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ 2. DATA GATHERING PHASE                                          │
  │    • Query project metadata                                      │
  │    • Fetch all issues with filters                               │
  │    • Collect photo paths (use compressed versions)               │
  │    • Load annotations for each photo                             │
  └──────┬───────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ 3. PDF GENERATION PHASE (Native)                                 │
  │    • Create PDF document                                         │
  │    • Add cover page (project info)                               │
  │    • Add summary page (issue counts by category)                 │
  │    • For each issue:                                             │
  │      - Issue details page                                        │
  │      - Photo pages with annotations                              │
  │    • Add appendix (full photo gallery)                           │
  └──────┬───────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ 4. POST-PROCESSING PHASE                                         │
  │    • Apply password protection (if requested)                    │
  │    • Add metadata (creation date, app version)                   │
  │    • Optimize PDF size                                           │
  └──────┬───────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ 5. DELIVERY PHASE                                                │
  │    • Save to exports directory                                   │
  │    • Present share sheet                                         │
  │    • Log export history                                          │
  │    • Schedule cleanup of temp files                              │
  └──────────────────────────────────────────────────────────────────┘
```

### 7.2 PDF Generation Implementation

#### iOS PDFKit Implementation

```swift
// iOS: PDFReportGenerator.swift
import PDFKit
import UIKit

class PDFReportGenerator {
    
    static func generateProjectReport(
        project: Project,
        issues: [Issue],
        photos: [Photo],
        progressCallback: @escaping (Float) -> Void
    ) throws -> URL {
        
        let pdfDocument = PDFDocument()
        var currentPage = 0
        let totalPages = estimatePageCount(issues: issues, photos: photos)
        
        // Cover Page
        let coverPage = createCoverPage(project: project)
        pdfDocument.insert(coverPage, at: currentPage)
        currentPage += 1
        progressCallback(Float(currentPage) / Float(totalPages))
        
        // Summary Page
        let summaryPage = createSummaryPage(issues: issues)
        pdfDocument.insert(summaryPage, at: currentPage)
        currentPage += 1
        progressCallback(Float(currentPage) / Float(totalPages))
        
        // Issue Detail Pages
        for issue in issues {
            let issuePages = createIssuePages(issue: issue, photos: photos)
            for page in issuePages {
                pdfDocument.insert(page, at: currentPage)
                currentPage += 1
            }
            progressCallback(Float(currentPage) / Float(totalPages))
        }
        
        // Save PDF
        let outputURL = getExportURL(fileName: "\(project.name)_Report.pdf")
        pdfDocument.write(to: outputURL)
        
        return outputURL
    }
    
    private static func createCoverPage(project: Project) -> PDFPage {
        let pageBounds = CGRect(x: 0, y: 0, width: 612, height: 792)  // Letter size
        let renderer = UIGraphicsPDFRenderer(bounds: pageBounds)
        
        let data = renderer.pdfData { context in
            context.beginPage()
            
            // Title
            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 32),
                .foregroundColor: UIColor.black
            ]
            let title = "Site Audit Report"
            title.draw(at: CGPoint(x: 50, y: 100), withAttributes: titleAttributes)
            
            // Project Name
            let projectAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 24),
                .foregroundColor: UIColor.darkGray
            ]
            project.name.draw(at: CGPoint(x: 50, y: 200), withAttributes: projectAttributes)
            
            // Metadata
            let metaAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 14),
                .foregroundColor: UIColor.gray
            ]
            let dateText = "Generated: \(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))"
            dateText.draw(at: CGPoint(x: 50, y: 700), withAttributes: metaAttributes)
        }
        
        return PDFPage(image: UIImage(data: data)!)!
    }
}
```

#### Android PDF Generation

```kotlin
// Android: PdfReportGenerator.kt
import android.graphics.pdf.PdfDocument
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import java.io.FileOutputStream

class PdfReportGenerator {
    
    companion object {
        private const val PAGE_WIDTH = 612  // Letter width in points
        private const val PAGE_HEIGHT = 792  // Letter height in points
        
        fun generateProjectReport(
            project: Project,
            issues: List<Issue>,
            photos: List<Photo>,
            progressCallback: (Float) -> Unit
        ): File {
            
            val pdfDocument = PdfDocument()
            var currentPage = 0
            val totalPages = estimatePageCount(issues, photos)
            
            // Cover Page
            val coverPageInfo = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, ++currentPage).create()
            val coverPage = pdfDocument.startPage(coverPageInfo)
            drawCoverPage(coverPage.canvas, project)
            pdfDocument.finishPage(coverPage)
            progressCallback(currentPage.toFloat() / totalPages)
            
            // Summary Page
            val summaryPageInfo = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, ++currentPage).create()
            val summaryPage = pdfDocument.startPage(summaryPageInfo)
            drawSummaryPage(summaryPage.canvas, issues)
            pdfDocument.finishPage(summaryPage)
            progressCallback(currentPage.toFloat() / totalPages)
            
            // Issue Pages
            for (issue in issues) {
                val issuePages = createIssuePages(pdfDocument, issue, photos, currentPage)
                currentPage += issuePages.size
                progressCallback(currentPage.toFloat() / totalPages)
            }
            
            // Save PDF
            val outputFile = File(getExportDirectory(), "${project.name}_Report.pdf")
            FileOutputStream(outputFile).use { output ->
                pdfDocument.writeTo(output)
            }
            pdfDocument.close()
            
            return outputFile
        }
        
        private fun drawCoverPage(canvas: Canvas, project: Project) {
            val titlePaint = Paint().apply {
                color = android.graphics.Color.BLACK
                textSize = 48f
                typeface = Typeface.DEFAULT_BOLD
            }
            
            canvas.drawText("Site Audit Report", 50f, 150f, titlePaint)
            
            val projectPaint = Paint().apply {
                color = android.graphics.Color.DKGRAY
                textSize = 36f
            }
            canvas.drawText(project.name, 50f, 250f, projectPaint)
        }
    }
}
```

### 7.3 Memory Management During Export

```dart
class ExportMemoryManager {
  static const int maxConcurrentImageLoads = 3;
  
  /// Process photos in batches to control memory usage
  static Future<void> processPhotosBatched(
    List<Photo> photos,
    Future<void> Function(Photo photo) processor,
  ) async {
    final chunks = _chunkList(photos, maxConcurrentImageLoads);
    
    for (final chunk in chunks) {
      // Process chunk concurrently
      await Future.wait(chunk.map(processor));
      
      // Force memory cleanup between chunks
      await _suggestGarbageCollection();
      
      // Check memory pressure
      if (await _isUnderMemoryPressure()) {
        await Future.delayed(const Duration(milliseconds: 100));
      }
    }
  }
  
  static List<List<T>> _chunkList<T>(List<T> list, int chunkSize) {
    final chunks = <List<T>>[];
    for (var i = 0; i < list.length; i += chunkSize) {
      chunks.add(list.sublist(i, i + chunkSize > list.length ? list.length : i + chunkSize));
    }
    return chunks;
  }
  
  static Future<void> _suggestGarbageCollection() async {
    // Dart doesn't allow direct GC, but we can help by:
    // 1. Clearing image caches
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();
    
    // 2. Small delay to allow cleanup
    await Future.delayed(const Duration(milliseconds: 50));
  }
  
  static Future<bool> _isUnderMemoryPressure() async {
    // Platform-specific memory check
    // Returns true if available memory is low
    return await MemoryInfo.isLowMemory();
  }
}
```

### 7.4 Progress Tracking

```dart
@freezed
class ExportProgress with _$ExportProgress {
  const factory ExportProgress({
    required ExportPhase phase,
    required double progress,  // 0.0 to 1.0
    String? currentOperation,
    int? itemsProcessed,
    int? totalItems,
  }) = _ExportProgress;
}

enum ExportPhase {
  validating,
  gatheringData,
  generatingPdf,
  postProcessing,
  finalizing,
  completed,
  error,
}

class ExportController extends StateNotifier<ExportProgress> {
  ExportController() : super(const ExportProgress(
    phase: ExportPhase.validating,
    progress: 0.0,
  ));
  
  Future<File> exportProject(
    String projectId, {
    String? password,
  }) async {
    try {
      // Validation
      _updatePhase(ExportPhase.validating, 0.0, 'Checking storage...');
      await _validateExport(projectId);
      
      // Data gathering
      _updatePhase(ExportPhase.gatheringData, 0.1, 'Collecting data...');
      final data = await _gatherExportData(projectId);
      
      // PDF Generation
      _updatePhase(ExportPhase.generatingPdf, 0.2, 'Generating PDF...');
      final pdfPath = await _generatePdf(
        data,
        onProgress: (p) => _updateProgress(0.2 + (p * 0.6)),
      );
      
      // Post-processing
      _updatePhase(ExportPhase.postProcessing, 0.8, 'Applying protection...');
      final finalPath = await _postProcess(pdfPath, password: password);
      
      // Finalize
      _updatePhase(ExportPhase.finalizing, 0.95, 'Completing export...');
      await _logExport(projectId, finalPath);
      
      _updatePhase(ExportPhase.completed, 1.0, 'Export complete!');
      return File(finalPath);
      
    } catch (e) {
      _updatePhase(ExportPhase.error, state.progress, 'Export failed: $e');
      rethrow;
    }
  }
  
  void _updatePhase(ExportPhase phase, double progress, String operation) {
    state = state.copyWith(
      phase: phase,
      progress: progress,
      currentOperation: operation,
    );
  }
  
  void _updateProgress(double progress) {
    state = state.copyWith(progress: progress);
  }
}
```

---

## 8. State Management

### 8.1 Riverpod Architecture

```dart
// Provider definitions

// Database provider (singleton)
final databaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('Override in main.dart');
});

// Repository providers
final projectRepositoryProvider = Provider<ProjectRepository>((ref) {
  return ProjectRepository(ref.watch(databaseProvider));
});

final issueRepositoryProvider = Provider<IssueRepository>((ref) {
  return IssueRepository(ref.watch(databaseProvider));
});

final photoRepositoryProvider = Provider<PhotoRepository>((ref) {
  return PhotoRepository(ref.watch(databaseProvider));
});

// Service providers
final photoServiceProvider = Provider<PhotoService>((ref) {
  return PhotoService(ref.watch(photoRepositoryProvider));
});

final exportServiceProvider = Provider<ExportService>((ref) {
  return ExportService(
    projectRepo: ref.watch(projectRepositoryProvider),
    issueRepo: ref.watch(issueRepositoryProvider),
    photoRepo: ref.watch(photoRepositoryProvider),
  );
});

// State providers
final projectsProvider = StreamProvider<List<Project>>((ref) {
  return ref.watch(projectRepositoryProvider).watchAll();
});

final projectDetailProvider = StreamProvider.family<Project?, String>((ref, id) {
  return ref.watch(projectRepositoryProvider).watchById(id);
});

final projectIssuesProvider = StreamProvider.family<List<Issue>, String>((ref, projectId) {
  return ref.watch(issueRepositoryProvider).watchByProject(projectId);
});

final issuePhotosProvider = StreamProvider.family<List<Photo>, String>((ref, issueId) {
  return ref.watch(photoRepositoryProvider).watchByIssue(issueId);
});
```

### 8.2 Camera State Management

```dart
@freezed
class CameraState with _$CameraState {
  const factory CameraState.initial() = _CameraStateInitial;
  const factory CameraState.initializing() = _CameraStateInitializing;
  const factory CameraState.ready({
    required CameraController controller,
    required FlashMode flashMode,
    required bool isRecording,
  }) = _CameraStateReady;
  const factory CameraState.capturing() = _CameraStateCapturing;
  const factory CameraState.processing() = _CameraStateProcessing;
  const factory CameraState.error(String message) = _CameraStateError;
}

class CameraNotifier extends StateNotifier<CameraState> {
  CameraNotifier() : super(const CameraState.initial());
  
  CameraController? _controller;
  
  Future<void> initialize() async {
    state = const CameraState.initializing();
    
    try {
      final cameras = await availableCameras();
      final backCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
      );
      
      _controller = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      
      await _controller!.initialize();
      
      state = CameraState.ready(
        controller: _controller!,
        flashMode: FlashMode.auto,
        isRecording: false,
      );
    } catch (e) {
      state = CameraState.error('Failed to initialize camera: $e');
    }
  }
  
  Future<Photo?> capturePhoto(String projectId, {String? issueId}) async {
    final currentState = state;
    if (currentState is! _CameraStateReady) return null;
    
    state = const CameraState.capturing();
    
    try {
      final file = await currentState.controller.takePicture();
      
      state = const CameraState.processing();
      
      // Process and save photo
      final photo = await _processCapturedPhoto(
        file.path,
        projectId: projectId,
        issueId: issueId,
      );
      
      state = currentState;
      return photo;
    } catch (e) {
      state = CameraState.error('Capture failed: $e');
      return null;
    }
  }
  
  Future<void> setFlashMode(FlashMode mode) async {
    final currentState = state;
    if (currentState is! _CameraStateReady) return;
    
    await currentState.controller.setFlashMode(mode);
    state = currentState.copyWith(flashMode: mode);
  }
  
  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}

final cameraProvider = StateNotifierProvider<CameraNotifier, CameraState>((ref) {
  return CameraNotifier();
});
```

### 8.3 Gallery State Management

```dart
@freezed
class GalleryState with _$GalleryState {
  const factory GalleryState({
    required List<Photo> photos,
    required GalleryFilter filter,
    required GallerySort sort,
    required Set<String> selectedIds,
    required bool isLoading,
    String? error,
  }) = _GalleryState;
}

@freezed
class GalleryFilter with _$GalleryFilter {
  const factory GalleryFilter({
    String? projectId,
    String? issueId,
    DateTime? dateFrom,
    DateTime? dateTo,
    Set<String>? tags,
  }) = _GalleryFilter;
  
  const GalleryFilter._();
  
  bool get hasFilters => 
    projectId != null || 
    issueId != null || 
    dateFrom != null || 
    dateTo != null ||
    (tags?.isNotEmpty ?? false);
}

enum GallerySort {
  newestFirst,
  oldestFirst,
  nameAsc,
  nameDesc,
}

class GalleryNotifier extends StateNotifier<GalleryState> {
  final PhotoRepository _photoRepo;
  
  GalleryNotifier(this._photoRepo) : super(GalleryState(
    photos: [],
    filter: const GalleryFilter(),
    sort: GallerySort.newestFirst,
    selectedIds: {},
    isLoading: false,
  ));
  
  Future<void> loadPhotos() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final photos = await _photoRepo.getFiltered(
        projectId: state.filter.projectId,
        issueId: state.filter.issueId,
        dateFrom: state.filter.dateFrom,
        dateTo: state.filter.dateTo,
        tags: state.filter.tags,
        sort: state.sort,
      );
      
      state = state.copyWith(photos: photos, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }
  
  void setFilter(GalleryFilter filter) {
    state = state.copyWith(filter: filter);
    loadPhotos();
  }
  
  void setSort(GallerySort sort) {
    state = state.copyWith(sort: sort);
    loadPhotos();
  }
  
  void toggleSelection(String photoId) {
    final selected = Set<String>.from(state.selectedIds);
    if (selected.contains(photoId)) {
      selected.remove(photoId);
    } else {
      selected.add(photoId);
    }
    state = state.copyWith(selectedIds: selected);
  }
  
  void clearSelection() {
    state = state.copyWith(selectedIds: {});
  }
  
  Future<void> deleteSelected() async {
    for (final id in state.selectedIds) {
      await _photoRepo.softDelete(id);
    }
    clearSelection();
    await loadPhotos();
  }
}

final galleryProvider = StateNotifierProvider<GalleryNotifier, GalleryState>((ref) {
  return GalleryNotifier(ref.watch(photoRepositoryProvider));
});
```

### 8.4 Export State Management

```dart
@freezed
class ExportState with _$ExportState {
  const factory ExportState.idle() = _ExportStateIdle;
  const factory ExportState.preparing() = _ExportStatePreparing;
  const factory ExportState.exporting({
    required ExportProgress progress,
  }) = _ExportStateExporting;
  const factory ExportState.completed(File file) = _ExportStateCompleted;
  const factory ExportState.error(String message) = _ExportStateError;
}

class ExportNotifier extends StateNotifier<ExportState> {
  final ExportService _exportService;
  
  ExportNotifier(this._exportService) : super(const ExportState.idle());
  
  Future<void> exportProject(
    String projectId, {
    ExportFormat format = ExportFormat.pdf,
    String? password,
  }) async {
    state = const ExportState.preparing();
    
    try {
      final progressStream = _exportService.exportProject(
        projectId,
        format: format,
        password: password,
      );
      
      await for (final progress in progressStream) {
        state = ExportState.exporting(progress: progress);
      }
      
      // Get final file
      final file = await _exportService.getLastExport();
      state = ExportState.completed(file);
    } catch (e) {
      state = ExportState.error('Export failed: $e');
    }
  }
  
  void reset() {
    state = const ExportState.idle();
  }
}

final exportProvider = StateNotifierProvider<ExportNotifier, ExportState>((ref) {
  return ExportNotifier(ref.watch(exportServiceProvider));
});
```

---

## 9. Performance Strategy

### 9.1 Photo Loading and Caching

```dart
class PhotoCacheManager {
  static final ImageCache _thumbnailCache = ImageCache()
    ..maximumSize = 200  // Max 200 thumbnails
    ..maximumSizeBytes = 100 * 1024 * 1024;  // 100MB
  
  static final ImageCache _previewCache = ImageCache()
    ..maximumSize = 50  // Max 50 preview images
    ..maximumSizeBytes = 200 * 1024 * 1024;  // 200MB
  
  /// Get thumbnail with caching
  static Widget getThumbnail(String path) {
    return Image.file(
      File(path),
      cacheWidth: 300,
      cacheHeight: 300,
      fit: BoxFit.cover,
      filterQuality: FilterQuality.low,
      gaplessPlayback: true,
    );
  }
  
  /// Get full image with progressive loading
  static Widget getFullImage(String path) {
    return Image.file(
      File(path),
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      gaplessPlayback: true,
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded) return child;
        return AnimatedOpacity(
          opacity: frame == null ? 0 : 1,
          duration: const Duration(milliseconds: 200),
          child: child,
        );
      },
    );
  }
  
  /// Preload thumbnails for visible items
  static Future<void> preloadThumbnails(List<String> paths) async {
    for (final path in paths) {
      final file = FileImage(File(path));
      await file.evict();  // Clear if exists
    }
  }
  
  /// Clear caches when memory pressure detected
  static void clearCaches() {
    _thumbnailCache.clear();
    _thumbnailCache.clearLiveImages();
    _previewCache.clear();
    _previewCache.clearLiveImages();
  }
}
```

### 9.2 Lazy Loading for Large Galleries

```dart
class LazyGallery extends StatefulWidget {
  final List<Photo> photos;
  final int pageSize;
  
  const LazyGallery({
    super.key,
    required this.photos,
    this.pageSize = 30,
  });
  
  @override
  State<LazyGallery> createState() => _LazyGalleryState();
}

class _LazyGalleryState extends State<LazyGallery> {
  final ScrollController _scrollController = ScrollController();
  final List<Photo> _displayedPhotos = [];
  int _currentPage = 0;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadMorePhotos();
    _scrollController.addListener(_onScroll);
  }
  
  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 500) {
      _loadMorePhotos();
    }
  }
  
  Future<void> _loadMorePhotos() async {
    if (_isLoading) return;
    if (_displayedPhotos.length >= widget.photos.length) return;
    
    setState(() => _isLoading = true);
    
    final start = _currentPage * widget.pageSize;
    final end = (start + widget.pageSize).clamp(0, widget.photos.length);
    
    // Simulate async load (actual images load via Image.file)
    await Future.delayed(const Duration(milliseconds: 50));
    
    setState(() {
      _displayedPhotos.addAll(widget.photos.sublist(start, end));
      _currentPage++;
      _isLoading = false;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      controller: _scrollController,
      itemCount: _displayedPhotos.length + (_isLoading ? 1 : 0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemBuilder: (context, index) {
        if (index >= _displayedPhotos.length) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final photo = _displayedPhotos[index];
        return PhotoThumbnail(photo: photo);
      },
    );
  }
}
```

### 9.3 Memory Pressure Handling

```dart
class MemoryPressureHandler {
  static final List<VoidCallback> _callbacks = [];
  
  static void initialize() {
    // Register for system memory warnings
    SystemChannels.lifecycle.setMessageHandler((message) async {
      if (message == 'memory_pressure') {
        _handleMemoryPressure();
      }
      return null;
    });
  }
  
  static void registerCallback(VoidCallback callback) {
    _callbacks.add(callback);
  }
  
  static void unregisterCallback(VoidCallback callback) {
    _callbacks.remove(callback);
  }
  
  static void _handleMemoryPressure() {
    // Clear image caches
    PhotoCacheManager.clearCaches();
    
    // Notify all registered components
    for (final callback in _callbacks) {
      callback();
    }
    
    // Suggest garbage collection
    // (Dart handles this automatically, but we can help)
    PaintingBinding.instance.imageCache.clear();
  }
}
```

### 9.4 Background Processing

```dart
class BackgroundExportService {
  static const String exportTaskName = 'com.eversiteaudit.export';
  
  /// Schedule export to run in background
  static Future<void> scheduleExport(String projectId) async {
    await Workmanager().registerOneOffTask(
      'export_$projectId',
      exportTaskName,
      inputData: {'projectId': projectId},
      constraints: Constraints(
        networkType: NetworkType.not_required,
        requiresBatteryNotLow: true,
        requiresStorageNotLow: true,
      ),
      existingWorkPolicy: ExistingWorkPolicy.replace,
    );
  }
  
  /// Background task handler
  static Future<bool> handleBackgroundExport(
    String taskName,
    Map<String, dynamic>? inputData,
  ) async {
    if (taskName != exportTaskName) return false;
    
    final projectId = inputData?['projectId'] as String?;
    if (projectId == null) return false;
    
    try {
      // Get database instance
      final db = await DatabaseProvider.instance.database;
      final exportService = ExportService(
        projectRepo: ProjectRepository(db),
        issueRepo: IssueRepository(db),
        photoRepo: PhotoRepository(db),
      );
      
      // Perform export
      await exportService.exportProject(projectId);
      
      // Show completion notification
      await _showExportCompleteNotification(projectId);
      
      return true;
    } catch (e) {
      await _showExportFailedNotification(projectId, e.toString());
      return false;
    }
  }
  
  static Future<void> _showExportCompleteNotification(String projectId) async {
    // Local notification implementation
  }
}
```

### 9.5 Battery Optimization

```dart
class BatteryOptimizer {
  /// Check if device is in low power mode
  static Future<bool> isLowPowerMode() async {
    return await BatteryInfo.isLowPowerModeEnabled;
  }
  
  /// Adjust app behavior based on battery state
  static Future<void> optimizeForBattery() async {
    final isLowPower = await isLowPowerMode();
    
    if (isLowPower) {
      // Reduce animation quality
      // Disable auto-sync (not applicable for offline app)
      // Reduce background processing
      // Lower image preview quality
      
      PhotoCacheManager.setLowPowerMode(true);
      await _reduceBackgroundActivity();
    }
  }
  
  static Future<void> _reduceBackgroundActivity() async {
    // Cancel non-essential background tasks
    // Reduce thumbnail generation quality
    // Disable preloading
  }
}
```

---

## 10. Platform Considerations

### 10.1 iOS-Specific Implementations

#### Camera Permissions
```swift
// Info.plist additions
<key>NSCameraUsageDescription</key>
<string>EverSiteAudit needs camera access to capture site photos for your audit reports.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>EverSiteAudit needs photo library access to save and manage your audit photos.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>EverSiteAudit uses your location to tag photos with GPS coordinates.</string>
```

#### App Groups for Extensions (Future)
```xml
<!-- Entitlements -->
<key>com.apple.security.application-groups</key>
<array>
    <string>group.com.eversiteaudit.shared</string>
</array>
```

#### Background Modes
```xml
<!-- Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>processing</string>  <!-- For background exports -->
</array>
```

### 10.2 Android-Specific Implementations

#### Permissions (AndroidManifest.xml)
```xml
<!-- Camera and Storage -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />

<!-- Hardware features -->
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

#### File Provider Configuration
```xml
<!-- res/xml/file_paths.xml -->
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <files-path name="exports" path="exports/" />
    <files-path name="photos" path="photos/" />
    <cache-path name="cache" path="cache/" />
</paths>
```

```xml
<!-- AndroidManifest.xml -->
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

### 10.3 Platform Abstraction Layer

```dart
/// Abstract interface for platform-specific operations
abstract class PlatformService {
  Future<bool> requestCameraPermission();
  Future<bool> requestStoragePermission();
  Future<bool> requestLocationPermission();
  
  Future<String> getAppDocumentsPath();
  Future<String> getTempDirectoryPath();
  Future<String> getCacheDirectoryPath();
  
  Future<void> shareFile(File file, {String? subject});
  Future<void> openFile(File file);
  
  Future<bool> isLowPowerMode();
  Future<StorageInfo> getStorageInfo();
}

/// Factory for platform-specific implementations
class PlatformServiceFactory {
  static PlatformService get instance {
    if (Platform.isIOS) {
      return IosPlatformService();
    } else if (Platform.isAndroid) {
      return AndroidPlatformService();
    }
    throw UnsupportedError('Platform not supported');
  }
}

/// iOS implementation
class IosPlatformService implements PlatformService {
  static const MethodChannel _channel = MethodChannel('com.eversiteaudit/platform');
  
  @override
  Future<bool> requestCameraPermission() async {
    return await _channel.invokeMethod('requestCameraPermission');
  }
  
  @override
  Future<String> getAppDocumentsPath() async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }
  
  @override
  Future<void> shareFile(File file, {String? subject}) async {
    await Share.shareXFiles(
      [XFile(file.path)],
      subject: subject,
    );
  }
  
  // ... other implementations
}

/// Android implementation
class AndroidPlatformService implements PlatformService {
  @override
  Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.request();
    return status.isGranted;
  }
  
  @override
  Future<bool> requestStoragePermission() async {
    if (Platform.isAndroid && await _isAndroid13OrHigher()) {
      final status = await Permission.photos.request();
      return status.isGranted;
    } else {
      final status = await Permission.storage.request();
      return status.isGranted;
    }
  }
  
  Future<bool> _isAndroid13OrHigher() async {
    final deviceInfo = DeviceInfoPlugin();
    final androidInfo = await deviceInfo.androidInfo;
    return androidInfo.version.sdkInt >= 33;
  }
  
  // ... other implementations
}
```

### 10.4 Feature Parity Matrix

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Camera Capture | ✅ | ✅ | Native camera package |
| Photo Gallery | ✅ | ✅ | photo_manager package |
| GPS Tagging | ✅ | ✅ | geolocator package |
| PDF Generation | ✅ | ✅ | Native PDFKit/PdfDocument |
| ZIP Export | ✅ | ✅ | archive package |
| Biometric Auth | ✅ | ✅ | local_auth package |
| Share Sheet | ✅ | ✅ | share_plus package |
| Background Export | ✅ | ✅ | workmanager package |
| Hardware Encryption | ✅ | ✅ | Secure Enclave / TEE |
| Database Encryption | ✅ | ✅ | SQLCipher |

### 10.5 Testing Strategy

```dart
// Unit Tests
void main() {
  group('ProjectRepository', () {
    late AppDatabase db;
    late ProjectRepository repo;
    
    setUp(() async {
      db = AppDatabase(NativeDatabase.memory());
      repo = ProjectRepository(db);
    });
    
    tearDown(() => db.close());
    
    test('insert and retrieve project', () async {
      final project = Project(
        id: 'test-1',
        name: 'Test Project',
        createdAt: DateTime.now().millisecondsSinceEpoch,
        updatedAt: DateTime.now().millisecondsSinceEpoch,
      );
      
      await repo.insert(project);
      final retrieved = await repo.getById('test-1');
      
      expect(retrieved?.name, equals('Test Project'));
    });
  });
}

// Widget Tests
void main() {
  testWidgets('Project list displays correctly', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          projectsProvider.overrideWithValue(
            AsyncValue.data([mockProject]),
          ),
        ],
        child: const MaterialApp(home: ProjectListScreen()),
      ),
    );
    
    expect(find.text('Test Project'), findsOneWidget);
  });
}

// Integration Tests
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  test('Full export flow', () async {
    app.main();
    await tester.pumpAndSettle();
    
    // Create project
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    
    await tester.enterText(find.byType(TextField), 'Integration Test Project');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    
    // Export project
    await tester.tap(find.byIcon(Icons.share));
    await tester.pumpAndSettle();
    
    await tester.tap(find.text('Export as PDF'));
    await tester.pumpAndSettle();
    
    // Verify export completed
    expect(find.text('Export complete'), findsOneWidget);
  });
}
```

---

## Appendix A: Dependency Versions Lock

```yaml
# pubspec.lock excerpt (key dependencies)
dependencies:
  flutter:
    sdk: flutter
  drift: ^2.18.0
  sqlcipher_flutter_libs: ^0.6.0
  flutter_secure_storage: ^9.2.0
  local_auth: ^2.2.0
  camera: ^0.11.0
  photo_manager: ^3.2.0
  image: ^4.1.0
  path_provider: ^2.1.0
  share_plus: ^9.0.0
  archive: ^3.6.0
  riverpod: ^2.5.0
  flutter_riverpod: ^2.5.0
  freezed_annotation: ^2.4.0
  json_annotation: ^4.9.0
  uuid: ^4.4.0
  crypto: ^3.0.3
  path: ^1.9.0
  intl: ^0.19.0
  permission_handler: ^11.3.0
  geolocator: ^12.0.0
  workmanager: ^0.5.2
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.0
  drift_dev: ^2.18.0
  freezed: ^2.5.0
  json_serializable: ^6.8.0
  mockito: ^5.4.0
  integration_test:
    sdk: flutter
```

## Appendix B: Database Migration History

| Version | Changes | Migration Script |
|---------|---------|------------------|
| 1 | Initial schema | `CREATE TABLE` statements |
| 2 | Add photo.compressed_path | `ALTER TABLE photos ADD COLUMN compressed_path TEXT;` |
| 3 | Add export_history table | `CREATE TABLE export_history (...)` |

## Appendix C: Security Checklist

- [ ] SQLCipher enabled with AES-256
- [ ] Hardware-backed keystore for encryption keys
- [ ] iOS Data Protection (NSFileProtectionComplete)
- [ ] Android FBE with Direct Boot awareness
- [ ] Excluded from cloud backups
- [ ] Memory clearing on background
- [ ] Biometric authentication option
- [ ] Export password protection
- [ ] Secure random key generation
- [ ] Key rotation on reinstall

---

**Document End**

*This architecture specification provides the technical foundation for implementing EverSiteAudit. All decisions are based on current best practices for privacy-first, offline-capable mobile applications with enterprise security requirements.*
