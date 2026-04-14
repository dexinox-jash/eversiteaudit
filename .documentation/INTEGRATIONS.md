# EverSiteAudit API & Integration Guide

## Comprehensive Integration Specification for Privacy-First Mobile Site Auditing

---

## Table of Contents

1. [Overview & Integration Philosophy](#1-overview--integration-philosophy)
2. [Camera Integration](#2-camera-integration)
3. [File Sharing & Export](#3-file-sharing--export)
4. [Storage Access & File Operations](#4-storage-access--file-operations)
5. [PDF Generation](#5-pdf-generation)
6. [ZIP Archive Creation](#6-zip-archive-creation)
7. [OS-Level Integrations](#7-os-level-integrations)
8. [Encryption Integration](#8-encryption-integration)
9. [Location Services](#9-location-services)
10. [Audio/Voice Recording](#10-audiovoice-recording)
11. [Permission Management](#11-permission-management)
12. [Integration Patterns](#12-integration-patterns)

---

## 1. Overview & Integration Philosophy

### 1.1 Design Principles

EverSiteAudit follows these core integration principles:

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Privacy-First** | User data never leaves device without explicit action | Local processing, optional encryption, user-controlled exports |
| **Performance-Critical** | Camera operations must be responsive | Native modules for capture, optimized preview streams |
| **Platform-Native Experience** | Use OS-native share sheets and pickers | UIActivityViewController (iOS), Sharesheet/SAF (Android) |
| **Graceful Degradation** | App functions with limited permissions | Fallback workflows for denied permissions |
| **Battery Conscious** | Efficient background operations | WorkManager (Android), BackgroundTasks (iOS) |

### 1.2 Cross-Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CROSS-PLATFORM LAYER                      │
│         (React Native / Flutter / Shared Logic)              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  iOS Bridge   │    │  Shared Core  │    │ Android Bridge│
│  (Objective-C │    │   (Rust/C++)  │    │    (Kotlin)   │
│    /Swift)    │    │               │    │               │
└───────┬───────┘    └───────────────┘    └───────┬───────┘
        │                                          │
        ▼                                          ▼
┌───────────────┐                         ┌───────────────┐
│  iOS Native   │                         │ Android Native│
│   Frameworks  │                         │   Frameworks  │
│ • AVFoundation│                         │ • CameraX     │
│ • PDFKit      │                         │ • MediaStore  │
│ • UIKit       │                         │ • SAF         │
│ • CoreLocation│                         │ • WorkManager │
└───────────────┘                         └───────────────┘
```

### 1.3 Integration Categories

| Category | Priority | Complexity | Native Bridge Required |
|----------|----------|------------|----------------------|
| Camera | Critical | High | Yes |
| File Sharing | Critical | Medium | Minimal |
| Storage Access | Critical | High | Yes |
| PDF Generation | High | Medium | Yes |
| ZIP Creation | High | Low | Optional |
| OS Integrations | Medium | Medium | Yes |
| Encryption | High | Medium | Yes |
| Location | Medium | Low | Minimal |
| Audio Recording | Low | Low | Minimal |

---

## 2. Camera Integration

### 2.1 Platform API Comparison

| Feature | iOS AVFoundation | Android CameraX | Android Camera2 |
|---------|-----------------|-----------------|-----------------|
| **Minimum OS** | iOS 10+ | Android 5.0+ (API 21) | Android 5.0+ (API 21) |
| **Burst Capture** | AVCapturePhotoOutput | ImageCapture + Executor | Custom burst implementation |
| **Preview** | AVCaptureVideoPreviewLayer | PreviewView | SurfaceTexture/SurfaceView |
| **Memory Management** | Manual buffer handling | Automatic (UseCase-based) | Manual session management |
| **Ease of Use** | Moderate | High | Low |
| **Performance** | Excellent | Very Good | Excellent (with complexity) |
| **Customization** | High | Medium | Very High |

**Recommendation**: 
- **iOS**: Use AVFoundation (modern, well-documented, no better alternative)
- **Android**: Use CameraX (recommended by Google, easier API, consistent behavior)

### 2.2 iOS: AVFoundation Integration

#### 2.2.1 Architecture Overview

```
AVCaptureSession (coordinates inputs/outputs)
    ├── AVCaptureDeviceInput (camera device)
    ├── AVCapturePhotoOutput (photo capture)
    └── AVCaptureVideoDataOutput (preview frames)
```

#### 2.2.2 Configuration Requirements

**Session Configuration**:
```objc
// PSEUDOCODE - iOS AVFoundation Setup

// 1. Create and configure session
AVCaptureSession *session = [[AVCaptureSession alloc] init];
[session setSessionPreset:AVCaptureSessionPresetPhoto]; // or High, Medium

// 2. Select camera device
AVCaptureDevice *device = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeVideo];
// For specific camera: discoverySession with position (.back, .front)

// 3. Create device input
NSError *error = nil;
AVCaptureDeviceInput *input = [AVCaptureDeviceInput deviceInputWithDevice:device error:&error];
if ([session canAddInput:input]) {
    [session addInput:input];
}

// 4. Configure photo output for burst
AVCapturePhotoOutput *photoOutput = [[AVCapturePhotoOutput alloc] init];
photoOutput.maxPhotoQualityPrioritization = AVCapturePhotoQualityPrioritizationQuality;
if ([session canAddOutput:photoOutput]) {
    [session addOutput:photoOutput];
}

// 5. Start session (on background queue)
dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [session startRunning];
});
```

**Burst Capture Configuration**:
```objc
// PSEUDOCODE - Burst Capture Setup

// Configure photo settings for burst
AVCapturePhotoSettings *settings = [AVCapturePhotoSettings photoSettings];
settings.photoQualityPrioritization = AVCapturePhotoQualityPrioritizationSpeed; // For burst

// Enable auto flash, stabilization
settings.flashMode = AVCaptureFlashModeAuto;

// For burst: use unique IDs per photo
NSString *uniqueID = [[NSUUID UUID] UUIDString];
settings.uniqueID = uniqueID;
```

#### 2.2.3 Burst Capture Implementation

```objc
// PSEUDOCODE - Burst Photo Capture

@interface BurstCaptureDelegate : NSObject <AVCapturePhotoCaptureDelegate>
@property (nonatomic, strong) NSMutableArray<UIImage *> *capturedImages;
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *metadata;
@property (nonatomic, copy) void (^completionHandler)(NSArray *, NSError *);
@property (nonatomic) NSInteger expectedCount;
@property (nonatomic) NSInteger receivedCount;
@end

@implementation BurstCaptureDelegate

- (void)captureBurstPhotos:(NSInteger)count 
              withSession:(AVCaptureSession *)session
              photoOutput:(AVCapturePhotoOutput *)output {
    
    self.expectedCount = count;
    self.receivedCount = 0;
    self.capturedImages = [NSMutableArray arrayWithCapacity:count];
    
    // Capture photos in rapid succession
    for (NSInteger i = 0; i < count; i++) {
        AVCapturePhotoSettings *settings = [AVCapturePhotoSettings photoSettings];
        settings.photoQualityPrioritization = AVCapturePhotoQualityPrioritizationSpeed;
        
        // Capture with unique delegate per photo or track via uniqueID
        [output capturePhotoWithSettings:settings delegate:self];
    }
}

- (void)captureOutput:(AVCapturePhotoOutput *)output 
didFinishProcessingPhoto:(AVCapturePhoto *)photo 
                error:(NSError *)error {
    
    if (error) {
        // Handle error - may continue with partial results
        [self handleCaptureError:error];
        return;
    }
    
    // Get image data
    NSData *imageData = [photo fileDataRepresentation];
    UIImage *image = [UIImage imageWithData:imageData];
    
    // Extract metadata
    NSDictionary *exif = photo.metadata;
    
    @synchronized(self) {
        [self.capturedImages addObject:image];
        [self.metadata addObject:exif];
        self.receivedCount++;
        
        // Check completion
        if (self.receivedCount >= self.expectedCount) {
            dispatch_async(dispatch_get_main_queue(), ^{
                self.completionHandler(self.capturedImages, nil);
            });
        }
    }
}

@end
```

#### 2.2.4 Real-Time Preview & Thumbnail Generation

```objc
// PSEUDOCODE - Preview Layer Setup

// Create preview layer
AVCaptureVideoPreviewLayer *previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:session];
previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
previewLayer.frame = view.bounds;
[view.layer addSublayer:previewLayer];

// For thumbnail generation during capture
- (void)generateThumbnailFromImage:(UIImage *)image {
    CGSize thumbnailSize = CGSizeMake(200, 200);
    UIGraphicsBeginImageContextWithOptions(thumbnailSize, NO, 0.0);
    
    // Draw scaled image
    [image drawInRect:CGRectMake(0, 0, thumbnailSize.width, thumbnailSize.height)];
    UIImage *thumbnail = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    // Save or return thumbnail
}
```

#### 2.2.5 Memory Management

```objc
// PSEUDOCODE - Memory Management Strategies

// 1. Release image data immediately after processing
- (void)processAndReleaseImage:(NSData *)imageData {
    @autoreleasepool {
        UIImage *image = [UIImage imageWithData:imageData];
        // Process image...
        // image released when autoreleasepool drains
    }
}

// 2. Use background queue for heavy processing
dispatch_async(processingQueue, ^{
    // Heavy image processing here
});

// 3. Monitor memory pressure
[[NSNotificationCenter defaultCenter] addObserver:self
                                         selector:@selector(handleMemoryWarning)
                                             name:UIApplicationDidReceiveMemoryWarningNotification
                                           object:nil];

- (void)handleMemoryWarning {
    // Clear caches, pause burst capture
    [self clearImageCache];
    [self pauseCaptureIfNeeded];
}
```

#### 2.2.6 Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Session interruption (phone call) | Pause preview, resume after interruption ends |
| Device not available | Show error, suggest checking camera permissions |
| Out of memory | Reduce quality, clear caches, show warning |
| Capture failure | Retry once, then show error with partial results |
| Invalid configuration | Log error, fall back to default configuration |

### 2.3 Android: CameraX Integration

#### 2.3.1 Architecture Overview

```kotlin
// CameraX UseCase-based architecture
CameraX
├── Preview (viewfinder)
├── ImageCapture (photo capture)
├── ImageAnalysis (frame processing)
└── VideoCapture (video recording - optional)
```

#### 2.3.2 Configuration Requirements

```kotlin
// PSEUDOCODE - Android CameraX Setup

class CameraManager(private val context: Context) {
    
    private var imageCapture: ImageCapture? = null
    private var camera: Camera? = null
    private var preview: Preview? = null
    
    fun startCamera(previewView: PreviewView) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            // Create Preview use case
            preview = Preview.Builder()
                .setTargetResolution(Size(1280, 720))
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
            
            // Create ImageCapture use case
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .setTargetResolution(Size(4032, 3024))
                .setFlashMode(ImageCapture.FLASH_MODE_AUTO)
                .build()
            
            // Select back camera
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                // Unbind all use cases before rebinding
                cameraProvider.unbindAll()
                
                // Bind use cases to camera
                camera = cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture
                )
                
            } catch (exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
            }
            
        }, ContextCompat.getMainExecutor(context))
    }
}
```

#### 2.3.3 Burst Capture Implementation

```kotlin
// PSEUDOCODE - CameraX Burst Capture

class BurstCaptureManager {
    private val capturedImages = mutableListOf<File>()
    private var captureCount = 0
    private val expectedCount: Int
    
    fun captureBurst(count: Int, onComplete: (List<File>) -> Unit) {
        expectedCount = count
        captureCount = 0
        capturedImages.clear()
        
        // Use executor for sequential capture
        val executor = Executors.newSingleThreadExecutor()
        
        repeat(count) { index ->
            executor.execute {
                captureSinglePhoto { file ->
                    synchronized(capturedImages) {
                        capturedImages.add(file)
                        captureCount++
                        
                        if (captureCount >= expectedCount) {
                            onComplete(capturedImages.toList())
                            executor.shutdown()
                        }
                    }
                }
            }
        }
    }
    
    private fun captureSinglePhoto(onSaved: (File) -> Unit) {
        val imageCapture = imageCapture ?: return
        
        // Create file with timestamp
        val photoFile = File(
            outputDirectory,
            "IMG_${System.currentTimeMillis()}.jpg"
        )
        
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
        
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(context),
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exc: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exc.message}", exc)
                }
                
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    onSaved(photoFile)
                }
            }
        )
    }
}
```

#### 2.3.4 Memory Optimization

```kotlin
// PSEUDOCODE - Memory Optimization Strategies

// 1. Use appropriate resolution
val imageCapture = ImageCapture.Builder()
    .setTargetResolution(Size(1920, 1080)) // Balance quality/memory
    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
    .build()

// 2. Process images in background with coroutines
viewModelScope.launch(Dispatchers.Default) {
    processImagesBatch(imageFiles)
}

// 3. Monitor memory and adjust
fun checkMemoryAndAdjust() {
    val runtime = Runtime.getRuntime()
    val maxMemory = runtime.maxMemory()
    val usedMemory = runtime.totalMemory() - runtime.freeMemory()
    val memoryPercent = (usedMemory * 100) / maxMemory
    
    if (memoryPercent > 80) {
        // Reduce capture quality or pause
        reduceCaptureQuality()
    }
}

// 4. Clear CameraX use cases when not needed
fun stopCamera() {
    val cameraProvider = ProcessCameraProvider.getInstance(context).get()
    cameraProvider.unbindAll()
}
```

### 2.4 Cross-Platform Camera Libraries Evaluation

#### 2.4.1 react-native-vision-camera

| Aspect | Assessment |
|--------|------------|
| **Pros** | Fast performance, frame processors, well-maintained, TypeScript support |
| **Cons** | iOS/Android native code still needed for advanced features |
| **Burst Support** | Manual implementation via rapid takePhoto() calls |
| **Recommendation** | Good choice for React Native apps |

```typescript
// PSEUDOCODE - react-native-vision-camera usage
import { Camera, useCameraDevice } from 'react-native-vision-camera';

function CameraComponent() {
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  
  const takeBurst = async (count: number) => {
    const photos: string[] = [];
    for (let i = 0; i < count; i++) {
      const photo = await camera.current?.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'auto'
      });
      photos.push(photo!.path);
    }
    return photos;
  };
  
  return (
    <Camera
      ref={camera}
      device={device}
      isActive={true}
      photo={true}
    />
  );
}
```

#### 2.4.2 Expo Camera

| Aspect | Assessment |
|--------|------------|
| **Pros** | Easy setup, managed workflow, good documentation |
| **Cons** | Limited customization, slower than native, ejection required for advanced features |
| **Burst Support** | Not natively supported, requires custom implementation |
| **Recommendation** | Good for prototypes, limited for production burst capture |

### 2.5 Camera Permission Requirements

| Platform | Permission | Info.plist / Manifest Entry |
|----------|------------|----------------------------|
| iOS | Camera | `NSCameraUsageDescription` |
| iOS | Microphone (if video) | `NSMicrophoneUsageDescription` |
| Android | Camera | `<uses-permission android:name="android.permission.CAMERA" />` |
| Android | Record Audio (if video) | `<uses-permission android:name="android.permission.RECORD_AUDIO" />` |

---

## 3. File Sharing & Export

### 3.1 iOS: Native Share Sheet (UIActivityViewController)

#### 3.1.1 Single File Sharing

```objc
// PSEUDOCODE - iOS Share Single File

- (void)shareFile:(NSURL *)fileURL fromViewController:(UIViewController *)vc {
    // Create activity items
    NSArray *activityItems = @[fileURL];
    
    // Create activity view controller
    UIActivityViewController *activityVC = [[UIActivityViewController alloc] 
        initWithActivityItems:activityItems 
        applicationActivities:nil];
    
    // Exclude unwanted activities (optional)
    activityVC.excludedActivityTypes = @[
        UIActivityTypePostToFacebook,
        UIActivityTypePostToTwitter
    ];
    
    // Completion handler
    activityVC.completionWithItemsHandler = ^(UIActivityType activityType, 
                                               BOOL completed, 
                                               NSArray *returnedItems, 
                                               NSError *error) {
        if (completed) {
            NSLog(@"Share completed via: %@", activityType);
        } else if (error) {
            NSLog(@"Share error: %@", error.localizedDescription);
        }
    };
    
    // Present on iPad with popover
    if (UIDevice.currentDevice.userInterfaceIdiom == UIUserInterfaceIdiomPad) {
        activityVC.popoverPresentationController.sourceView = vc.view;
        activityVC.popoverPresentationController.sourceRect = CGRectMake(
            vc.view.bounds.size.width / 2,
            vc.view.bounds.size.height / 2,
            0, 0
        );
    }
    
    [vc presentViewController:activityVC animated:YES completion:nil];
}
```

#### 3.1.2 Multiple Files Sharing

```objc
// PSEUDOCODE - iOS Share Multiple Files

- (void)shareMultipleFiles:(NSArray<NSURL *> *)fileURLs 
        fromViewController:(UIViewController *)vc {
    
    // Create activity items with all files
    UIActivityViewController *activityVC = [[UIActivityViewController alloc] 
        initWithActivityItems:fileURLs 
        applicationActivities:nil];
    
    // For large batches, consider creating a ZIP first
    if (fileURLs.count > 50) {
        [self showAlert:@"Large export - creating ZIP archive..."];
        [self createZIPAndShare:fileURLs];
        return;
    }
    
    // Present share sheet
    [vc presentViewController:activityVC animated:YES completion:nil];
}
```

#### 3.1.3 Custom Share Extension (Optional)

```objc
// PSEUDOCODE - Custom Share Extension

// Create an app extension target in Xcode
// Configure NSExtension in Info.plist:

/*
<key>NSExtension</key>
<dict>
    <key>NSExtensionAttributes</key>
    <dict>
        <key>NSExtensionActivationRule</key>
        <dict>
            <key>NSExtensionActivationSupportsFileWithMaxCount</key>
            <integer>10</integer>
            <key>NSExtensionActivationSupportsImageWithMaxCount</key>
            <integer>10</integer>
        </dict>
    </dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
</dict>
*/
```

### 3.2 iOS: Document Picker for Save Locations

```objc
// PSEUDOCODE - iOS Document Picker

- (void)showDocumentPickerForExport:(NSArray<NSURL *> *)files {
    // Create document picker for exporting to user-selected location
    UIDocumentPickerViewController *picker = [[UIDocumentPickerViewController alloc] 
        initWithURLs:files 
        inMode:UIDocumentPickerModeExportToService];
    
    picker.delegate = self;
    picker.allowsMultipleSelection = NO;
    
    [self presentViewController:picker animated:YES completion:nil];
}

// Delegate methods
- (void)documentPicker:(UIDocumentPickerViewController *)controller 
didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls {
    // Files exported successfully
    NSLog(@"Exported to: %@", urls);
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
    // User cancelled
}
```

### 3.3 Android: Sharesheet Implementation

#### 3.3.1 Single File Sharing

```kotlin
// PSEUDOCODE - Android Share Single File

fun shareFile(context: Context, file: File) {
    // Get content URI via FileProvider
    val fileUri: Uri = FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        file
    )
    
    val shareIntent = Intent().apply {
        action = Intent.ACTION_SEND
        type = getMimeType(file)
        putExtra(Intent.EXTRA_STREAM, fileUri)
        putExtra(Intent.EXTRA_SUBJECT, "Site Audit Report")
        putExtra(Intent.EXTRA_TEXT, "Exported from EverSiteAudit")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    
    // Create chooser
    val chooser = Intent.createChooser(shareIntent, "Share via")
    
    // Grant permission to all potential receivers
    val resInfoList = context.packageManager.queryIntentActivities(chooser, 0)
    for (resolveInfo in resInfoList) {
        val packageName = resolveInfo.activityInfo.packageName
        context.grantUriPermission(
            packageName,
            fileUri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION
        )
    }
    
    context.startActivity(chooser)
}

private fun getMimeType(file: File): String {
    return when (file.extension.lowercase()) {
        "pdf" -> "application/pdf"
        "jpg", "jpeg" -> "image/jpeg"
        "png" -> "image/png"
        "zip" -> "application/zip"
        else -> "*/*"
    }
}
```

#### 3.3.2 Multiple Files Sharing

```kotlin
// PSEUDOCODE - Android Share Multiple Files

fun shareMultipleFiles(context: Context, files: List<File>) {
    if (files.isEmpty()) return
    
    // Convert files to content URIs
    val uris = files.map { file ->
        FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
    }
    
    val shareIntent = Intent().apply {
        action = Intent.ACTION_SEND_MULTIPLE
        type = "*/*"
        putParcelableArrayListExtra(Intent.EXTRA_STREAM, ArrayList(uris))
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    
    // For large batches, suggest creating ZIP
    if (files.size > 50) {
        showLargeExportDialog(context) {
            createZipAndShare(context, files)
        }
        return
    }
    
    context.startActivity(Intent.createChooser(shareIntent, "Share files"))
}
```

#### 3.3.3 FileProvider Configuration

```xml
<!-- PSEUDOCODE - Android FileProvider Configuration -->

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

<!-- res/xml/file_paths.xml -->
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- App-specific files -->
    <files-path name="app_files" path="." />
    
    <!-- Cache directory -->
    <cache-path name="cache" path="." />
    
    <!-- External files -->
    <external-files-path name="external_files" path="." />
    
    <!-- External cache -->
    <external-cache-path name="external_cache" path="." />
</paths>
```

### 3.4 Android: Storage Access Framework (SAF)

```kotlin
// PSEUDOCODE - Android SAF for User-Selected Location

class ExportActivity : AppCompatActivity() {
    
    private val CREATE_DOCUMENT_REQUEST = 1
    
    fun createDocument(mimeType: String, fileName: String) {
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mimeType
            putExtra(Intent.EXTRA_TITLE, fileName)
        }
        startActivityForResult(intent, CREATE_DOCUMENT_REQUEST)
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == CREATE_DOCUMENT_REQUEST && resultCode == RESULT_OK) {
            data?.data?.let { uri ->
                // User selected location, write file
                writeFileToUri(uri, fileContent)
            }
        }
    }
    
    private fun writeFileToUri(uri: Uri, content: ByteArray) {
        contentResolver.openOutputStream(uri)?.use { outputStream ->
            outputStream.write(content)
        }
    }
}
```

### 3.5 Large File Export Handling

| Scenario | Strategy | Implementation |
|----------|----------|----------------|
| 100+ photos | Create ZIP first | Batch process with progress UI |
| Large PDF | Stream generation | Generate in chunks, show progress |
| Multiple formats | User choice | Present format selection dialog |
| Slow network | Background export | Use WorkManager / BackgroundTasks |

```kotlin
// PSEUDOCODE - Progress Tracking for Large Exports

class ExportManager {
    private val _progress = MutableStateFlow(0)
    val progress: StateFlow<Int> = _progress.asStateFlow()
    
    suspend fun exportWithProgress(files: List<File>, outputFile: File) {
        val total = files.size
        
        files.forEachIndexed { index, file ->
            // Process file
            processFile(file, outputFile)
            
            // Update progress
            _progress.value = ((index + 1) * 100) / total
            
            // Yield to allow UI updates
            yield()
        }
    }
}
```

---

## 4. Storage Access & File Operations

### 4.1 iOS Storage Architecture

```
iOS File System
├── App Bundle (read-only)
├── Documents/ (user data, backed up)
├── Library/
│   ├── Application Support/ (app data, backed up)
│   └── Caches/ (temporary, not backed up)
├── tmp/ (temporary, may be purged)
└── iCloud Container/ (shared across devices)
```

#### 4.1.1 Directory Structure Recommendations

```objc
// PSEUDOCODE - iOS Directory Structure

// Recommended structure for EverSiteAudit:
// Documents/
// ├── Audits/
// │   ├── {audit_id}/
// │   │   ├── metadata.json
// │   │   ├── photos/
// │   │   │   ├── IMG_001.jpg
// │   │   │   └── ...
// │   │   └── audio/
// │   │       └── note_001.m4a
// │   └── ...
// └── Exports/ (temporary export files)

- (NSURL *)auditsDirectory {
    NSURL *docsDir = [[[NSFileManager defaultManager] 
        URLsForDirectory:NSDocumentDirectory 
        inDomains:NSUserDomainMask] firstObject];
    return [docsDir URLByAppendingPathComponent:@"Audits"];
}

- (NSURL *)auditDirectoryForId:(NSString *)auditId {
    return [[self auditsDirectory] URLByAppendingPathComponent:auditId];
}

- (NSURL *)photosDirectoryForAudit:(NSString *)auditId {
    return [[self auditDirectoryForId:auditId] URLByAppendingPathComponent:@"photos"];
}
```

#### 4.1.2 Safe File Operations

```objc
// PSEUDOCODE - iOS Safe File Operations

// 1. Atomic file writing
- (BOOL)writeDataAtomically:(NSData *)data toURL:(NSURL *)url error:(NSError **)error {
    NSURL *tempURL = [url URLByAppendingPathExtension:@"tmp"];
    
    BOOL written = [data writeToURL:tempURL options:NSDataWritingAtomic error:error];
    if (!written) return NO;
    
    // Replace original atomically
    [[NSFileManager defaultManager] removeItemAtURL:url error:nil];
    return [[NSFileManager defaultManager] moveItemAtURL:tempURL toURL:url error:error];
}

// 2. File coordination for safe access
- (void)coordinatedReadAtURL:(NSURL *)url {
    NSFileCoordinator *coordinator = [[NSFileCoordinator alloc] initWithFilePresenter:nil];
    NSError *error = nil;
    
    [coordinator coordinateReadingItemAtURL:url 
                                    options:NSFileCoordinatorReadingWithoutChanges 
                                      error:&error 
                                 byAccessor:^(NSURL *newURL) {
        // Read from newURL
        NSData *data = [NSData dataWithContentsOfURL:newURL];
    }];
}

// 3. Cleanup strategy
- (void)cleanupOldExports {
    NSURL *exportsDir = [self exportsDirectory];
    NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtURL:exportsDir 
                                                   includingPropertiesForKeys:@[NSURLCreationDateKey] 
                                                                      options:0 
                                                                        error:nil];
    
    NSDate *oneWeekAgo = [NSDate dateWithTimeIntervalSinceNow:-7 * 24 * 60 * 60];
    
    for (NSURL *file in files) {
        NSDate *creationDate = nil;
        [file getResourceValue:&creationDate forKey:NSURLCreationDateKey error:nil];
        
        if ([creationDate compare:oneWeekAgo] == NSOrderedAscending) {
            [[NSFileManager defaultManager] removeItemAtURL:file error:nil];
        }
    }
}
```

### 4.2 Android Storage Architecture

#### 4.2.1 Scoped Storage (Android 10+ API 29+)

```kotlin
// PSEUDOCODE - Android Scoped Storage

/*
Scoped Storage Model:
- App-specific directories: Full access (no permissions)
- Media files (photos, videos, audio): Read with READ_EXTERNAL_STORAGE, 
  write with MediaStore or Storage Access Framework
- Downloads/Documents: Access via Storage Access Framework
- Other apps' data: No direct access
*/

class StorageManager(private val context: Context) {
    
    // App-specific directory - no permissions needed
    fun getAppSpecificDirectory(): File {
        return context.getExternalFilesDir(null) 
            ?: context.filesDir
    }
    
    // Photos directory within app storage
    fun getPhotosDirectory(): File {
        return File(getAppSpecificDirectory(), "photos").apply {
            if (!exists()) mkdirs()
        }
    }
    
    // Save photo to MediaStore (visible to other apps)
    fun savePhotoToMediaStore(bitmap: Bitmap, fileName: String): Uri? {
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/EverSiteAudit")
        }
        
        val uri = context.contentResolver.insert(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            contentValues
        )
        
        uri?.let {
            context.contentResolver.openOutputStream(it)?.use { outputStream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream)
            }
        }
        
        return uri
    }
}
```

#### 4.2.2 Directory Structure Recommendations

```kotlin
// PSEUDOCODE - Android Directory Structure

/*
App-specific storage:
/sdcard/Android/data/com.eversiteaudit.app/
├── files/
│   ├── audits/
│   │   ├── {audit_id}/
│   │   │   ├── metadata.json
│   │   │   ├── photos/
│   │   │   └── audio/
│   │   └── ...
│   └── exports/
└── cache/
    └── thumbnails/
*/

class AuditStorageManager(context: Context) {
    private val baseDir = context.getExternalFilesDir(null) 
        ?: context.filesDir
    
    fun getAuditDirectory(auditId: String): File {
        return File(baseDir, "audits/$auditId").apply { mkdirs() }
    }
    
    fun getPhotosDirectory(auditId: String): File {
        return File(getAuditDirectory(auditId), "photos").apply { mkdirs() }
    }
    
    fun getAudioDirectory(auditId: String): File {
        return File(getAuditDirectory(auditId), "audio").apply { mkdirs() }
    }
    
    fun getExportsDirectory(): File {
        return File(baseDir, "exports").apply { mkdirs() }
    }
}
```

#### 4.2.3 File Naming Conventions

| Content Type | Format | Example |
|--------------|--------|---------|
| Photos | `IMG_{timestamp}_{sequence}.jpg` | `IMG_20240115_143022_001.jpg` |
| Audio Notes | `NOTE_{timestamp}.m4a` | `NOTE_20240115_143022.m4a` |
| Audit Metadata | `audit.json` | `audit.json` |
| PDF Export | `{audit_name}_{timestamp}.pdf` | `SiteVisit_20240115_143022.pdf` |
| ZIP Export | `{audit_name}_{timestamp}.zip` | `SiteVisit_20240115_143022.zip` |

```kotlin
// PSEUDOCODE - File Naming Utilities

object FileNaming {
    private val dateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US)
    
    fun generatePhotoName(sequence: Int): String {
        val timestamp = dateFormat.format(Date())
        return "IMG_${timestamp}_${String.format("%03d", sequence)}.jpg"
    }
    
    fun generateAudioName(): String {
        val timestamp = dateFormat.format(Date())
        return "NOTE_$timestamp.m4a"
    }
    
    fun generateExportName(auditName: String, extension: String): String {
        val timestamp = dateFormat.format(Date())
        val sanitized = auditName.replace(Regex("[^a-zA-Z0-9]"), "_")
        return "${sanitized}_$timestamp.$extension"
    }
}
```

### 4.3 Cross-Platform File Operations

| Operation | iOS | Android | Notes |
|-----------|-----|---------|-------|
| Create directory | `NSFileManager createDirectoryAtURL` | `File.mkdirs()` | Android: check return value |
| Write file | `NSData writeToURL` | `FileOutputStream` | Use atomic writes |
| Read file | `NSData dataWithContentsOfURL` | `FileInputStream` | Check file exists first |
| Delete file | `NSFileManager removeItemAtURL` | `File.delete()` | Handle errors gracefully |
| File exists | `NSFileManager fileExistsAtPath` | `File.exists()` | Thread-safe check |
| Get size | `NSURL fileSize` resource | `File.length()` | Returns bytes |

---

## 5. PDF Generation

### 5.1 iOS: PDFKit & UIGraphicsPDFRenderer

#### 5.1.1 Basic PDF Generation

```objc
// PSEUDOCODE - iOS PDF Generation

- (void)generatePDFWithImages:(NSArray<UIImage *> *)images 
                    outputURL:(NSURL *)outputURL 
                   completion:(void (^)(BOOL success, NSError *error))completion {
    
    // PDF document metadata
    NSDictionary *pdfMetadata = @{
        (NSString *)kCGPDFContextCreator: @"EverSiteAudit",
        (NSString *)kCGPDFContextTitle: @"Site Audit Report",
        (NSString *)kCGPDFContextCreationDate: [NSDate date]
    };
    
    // Create PDF renderer
    UIGraphicsPDFRenderer *renderer = [[UIGraphicsPDFRenderer alloc] 
        initWithBounds:CGRectMake(0, 0, 612, 792) // Letter size
              format:[[UIGraphicsPDFRendererFormat alloc] init]];
    
    NSError *error = nil;
    BOOL success = [renderer writePDFToURL:outputURL 
                         withActions:^(UIGraphicsPDFRendererContext *context) {
        
        for (UIImage *image in images) {
            // Start new page
            [context beginPage];
            
            // Calculate scaled size to fit page with margins
            CGRect pageBounds = context.pdfContextBounds;
            CGFloat margin = 36.0; // 0.5 inch margins
            CGFloat maxWidth = pageBounds.size.width - (margin * 2);
            CGFloat maxHeight = pageBounds.size.height - (margin * 2);
            
            CGSize imageSize = [self scaledSizeForImage:image 
                                              maxWidth:maxWidth 
                                             maxHeight:maxHeight];
            
            // Center image on page
            CGFloat x = (pageBounds.size.width - imageSize.width) / 2;
            CGFloat y = (pageBounds.size.height - imageSize.height) / 2;
            
            // Draw image
            [image drawInRect:CGRectMake(x, y, imageSize.width, imageSize.height)];
        }
        
    } error:&error];
    
    completion(success, error);
}
```

#### 5.1.2 Memory-Efficient Large PDF Generation

```objc
// PSEUDOCODE - iOS Memory-Efficient PDF Generation

- (void)generateLargePDFWithImagePaths:(NSArray<NSString *> *)imagePaths 
                             outputURL:(NSURL *)outputURL 
                              progress:(void (^)(NSInteger current, NSInteger total))progressBlock
                            completion:(void (^)(BOOL success, NSError *error))completion {
    
    CGContextRef pdfContext = NULL;
    CFURLRef url = (__bridge CFURLRef)outputURL;
    
    // PDF page size (Letter)
    CGRect pageRect = CGRectMake(0, 0, 612, 792);
    
    // Create PDF context
    pdfContext = CGPDFContextCreateWithURL(url, &pageRect, NULL);
    
    NSInteger total = imagePaths.count;
    
    for (NSInteger i = 0; i < total; i++) {
        @autoreleasepool {
            NSString *imagePath = imagePaths[i];
            
            // Load image (releases after autoreleasepool)
            UIImage *image = [UIImage imageWithContentsOfFile:imagePath];
            if (!image) continue;
            
            // Begin page
            CGPDFContextBeginPage(pdfContext, NULL);
            
            // Draw image (implementation details...)
            CGImageRef cgImage = image.CGImage;
            CGContextDrawImage(pdfContext, pageRect, cgImage);
            
            // End page
            CGPDFContextEndPage(pdfContext);
            
            // Report progress
            if (progressBlock) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    progressBlock(i + 1, total);
                });
            }
        }
        // Image released here when autoreleasepool drains
    }
    
    // Close PDF context
    CGPDFContextClose(pdfContext);
    CGContextRelease(pdfContext);
    
    completion(YES, nil);
}
```

### 5.2 Android: PdfDocument API

#### 5.2.1 Basic PDF Generation

```kotlin
// PSEUDOCODE - Android PDF Generation

fun generatePDF(
    images: List<File>,
    outputFile: File,
    onProgress: (Int, Int) -> Unit
): Result<File> {
    return try {
        val pdfDocument = PdfDocument()
        val pageWidth = 612 // Letter width in points
        val pageHeight = 792 // Letter height in points
        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        
        images.forEachIndexed { index, imageFile ->
            // Start page
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas
            
            // Load and draw image
            val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath)
            val scaledBitmap = scaleBitmapToFit(bitmap, pageWidth, pageHeight)
            
            // Center image
            val x = (pageWidth - scaledBitmap.width) / 2f
            val y = (pageHeight - scaledBitmap.height) / 2f
            
            canvas.drawBitmap(scaledBitmap, x, y, null)
            
            // Clean up bitmaps
            bitmap.recycle()
            if (scaledBitmap != bitmap) scaledBitmap.recycle()
            
            // Finish page
            pdfDocument.finishPage(page)
            
            // Report progress
            onProgress(index + 1, images.size)
        }
        
        // Write to file
        FileOutputStream(outputFile).use { outputStream ->
            pdfDocument.writeTo(outputStream)
        }
        
        pdfDocument.close()
        
        Result.success(outputFile)
    } catch (e: Exception) {
        Result.failure(e)
    }
}

private fun scaleBitmapToFit(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    
    val scale = minOf(
        maxWidth.toFloat() / width,
        maxHeight.toFloat() / height
    )
    
    val newWidth = (width * scale).toInt()
    val newHeight = (height * scale).toInt()
    
    return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
}
```

#### 5.2.2 Third-Party Library: iText

```kotlin
// PSEUDOCODE - Android iText PDF Generation

/*
Dependency: implementation 'com.itextpdf:itext7-core:7.2.5'

iText provides more advanced features:
- Text formatting
- Headers/footers
- Watermarks
- Encryption
- Digital signatures
*/

import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Image
import com.itextpdf.io.image.ImageDataFactory

fun generatePDFWithIText(
    images: List<File>,
    outputFile: File,
    auditMetadata: AuditMetadata
) {
    PdfWriter(outputFile.absolutePath).use { writer ->
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)
        
        // Add title
        document.add(Paragraph("Site Audit Report").setFontSize(20f))
        document.add(Paragraph("Location: ${auditMetadata.location}"))
        document.add(Paragraph("Date: ${auditMetadata.date}"))
        document.add(Paragraph("Inspector: ${auditMetadata.inspector}"))
        
        // Add images
        images.forEach { imageFile ->
            val imageData = ImageDataFactory.create(imageFile.absolutePath)
            val image = Image(imageData)
            
            // Scale to fit page
            image.scaleToFit(500f, 700f)
            
            document.add(image)
            document.add(Paragraph("")) // Spacing
        }
        
        document.close()
    }
}
```

### 5.3 PDF Generation Comparison

| Feature | iOS UIGraphicsPDFRenderer | iOS PDFKit | Android PdfDocument | Android iText |
|---------|---------------------------|------------|---------------------|---------------|
| **Ease of Use** | High | Medium | High | Medium |
| **Image Embedding** | Yes | Yes | Yes | Yes |
| **Text Support** | Limited | Full | Limited | Full |
| **Encryption** | No | Yes | No | Yes |
| **Performance** | Good | Good | Good | Excellent |
| **License** | Free | Free | Free | AGPL/Commercial |
| **Large Files** | Good with autoreleasepool | Good | Good with recycling | Excellent |

---

## 6. ZIP Archive Creation

### 6.1 iOS: ZIPFoundation

```objc
// PSEUDOCODE - iOS ZIP Creation with ZIPFoundation

/*
Dependency: Swift Package Manager - https://github.com/weichsel/ZIPFoundation

import ZIPFoundation

class ZIPCreator {
    func createZIP(from files: [URL], outputURL: URL, completion: @escaping (Result<URL, Error>) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                // Create archive
                guard let archive = Archive(url: outputURL, accessMode: .create) else {
                    throw ZIPError.creationFailed
                }
                
                for fileURL in files {
                    // Get file data
                    let fileData = try Data(contentsOf: fileURL)
                    
                    // Add to archive with compression
                    try archive.addEntry(
                        with: fileURL.lastPathComponent,
                        type: .file,
                        uncompressedSize: UInt32(fileData.count),
                        compressionMethod: .deflate,
                        bufferSize: 4096,
                        provider: { position, size in
                            return fileData.subdata(in: position..<position+size)
                        }
                    )
                }
                
                DispatchQueue.main.async {
                    completion(.success(outputURL))
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }
}
*/
```

### 6.2 Android: java.util.zip

```kotlin
// PSEUDOCODE - Android ZIP Creation

class ZIPCreator {
    
    fun createZIP(
        files: List<File>,
        outputFile: File,
        includeMetadata: Boolean = true,
        onProgress: ((Int, Int) -> Unit)? = null
    ): Result<File> {
        return try {
            ZipOutputStream(BufferedOutputStream(FileOutputStream(outputFile))).use { zos ->
                val buffer = ByteArray(8192)
                
                // Add metadata JSON if requested
                if (includeMetadata) {
                    val metadata = createMetadataJSON(files)
                    val metadataEntry = ZipEntry("metadata.json")
                    zos.putNextEntry(metadataEntry)
                    zos.write(metadata.toByteArray())
                    zos.closeEntry()
                }
                
                // Add files
                files.forEachIndexed { index, file ->
                    if (!file.exists()) return@forEachIndexed
                    
                    val entry = ZipEntry("photos/${file.name}")
                    zos.putNextEntry(entry)
                    
                    FileInputStream(file).use { fis ->
                        var len: Int
                        while (fis.read(buffer).also { len = it } > 0) {
                            zos.write(buffer, 0, len)
                        }
                    }
                    
                    zos.closeEntry()
                    
                    // Report progress
                    onProgress?.invoke(index + 1, files.size)
                }
            }
            
            Result.success(outputFile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun createMetadataJSON(files: List<File>): String {
        val metadata = JSONObject().apply {
            put("created_at", System.currentTimeMillis())
            put("file_count", files.size)
            put("files", JSONArray().apply {
                files.forEach { file ->
                    put(JSONObject().apply {
                        put("name", file.name)
                        put("size", file.length())
                        put("modified", file.lastModified())
                    })
                }
            })
        }
        return metadata.toString(2)
    }
}
```

### 6.3 ZIP Library Comparison

| Library | Platform | Compression Levels | Streaming | License |
|---------|----------|-------------------|-----------|---------|
| ZIPFoundation | iOS | deflate, none | Yes | MIT |
| SSZipArchive | iOS | deflate, none | Yes | MIT |
| java.util.zip | Android | deflate, stored | Yes | Built-in |
| Apache Commons Compress | Android | multiple | Yes | Apache 2.0 |
| zip4j | Android | multiple | Yes | Apache 2.0 |

---

## 7. OS-Level Integrations

### 7.1 iOS Widgets (WidgetKit)

#### 7.1.1 Widget Configuration

```objc
// PSEUDOCODE - iOS Widget Implementation

/*
1. Create Widget Extension target in Xcode
2. Configure widget with TimelineProvider
3. Add App Groups for data sharing
*/

// Widget Structure
import WidgetKit
import SwiftUI

struct AuditWidget: Widget {
    let kind: String = "AuditWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AuditProvider()) { entry in
            AuditWidgetView(entry: entry)
        }
        .configurationDisplayName("Recent Audits")
        .description("Quick access to your recent site audits")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// Timeline Provider
struct AuditProvider: TimelineProvider {
    func getSnapshot(in context: Context, completion: @escaping (AuditEntry) -> Void) {
        let entry = AuditEntry(
            date: Date(),
            recentAudits: loadRecentAudits()
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<AuditEntry>) -> Void) {
        var entries: [AuditEntry] = []
        
        // Update every 15 minutes
        let currentDate = Date()
        for hourOffset in 0..<4 {
            let entryDate = Calendar.current.date(byAdding: .minute, value: hourOffset * 15, to: currentDate)!
            let entry = AuditEntry(
                date: entryDate,
                recentAudits: loadRecentAudits()
            )
            entries.append(entry)
        }
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

// Data sharing via App Groups
func loadRecentAudits() -> [AuditSummary] {
    guard let defaults = UserDefaults(suiteName: "group.com.eversiteaudit.app") else {
        return []
    }
    
    if let data = defaults.data(forKey: "recent_audits"),
       let audits = try? JSONDecoder().decode([AuditSummary].self, from: data) {
        return audits
    }
    return []
}
```

#### 7.1.2 App Groups Configuration

```xml
<!-- PSEUDOCODE - App Groups Entitlements -->

<!-- Main App: EverSiteAudit.entitlements -->
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.eversiteaudit.app</string>
    </array>
</dict>

<!-- Widget Extension: EverSiteAuditWidget.entitlements -->
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.eversiteaudit.app</string>
    </array>
</dict>
```

### 7.2 iOS Shortcuts (SiriKit Intents)

```objc
// PSEUDOCODE - iOS Shortcuts Integration

/*
1. Create Intents Extension
2. Define custom intents in IntentDefinition file
3. Implement intent handlers
*/

// Intent Definition (in .intentdefinition file)
/*
Intent: CreateQuickAudit
- Parameters:
  - location: String
  - projectName: String
- Response:
  - auditId: String
  - success: Boolean
*/

// Intent Handler
import Intents

class CreateQuickAuditIntentHandler: NSObject, CreateQuickAuditIntentHandling {
    func handle(intent: CreateQuickAuditIntent, completion: @escaping (CreateQuickAuditIntentResponse) -> Void) {
        let location = intent.location ?? "Unknown Location"
        let projectName = intent.projectName ?? "Quick Audit"
        
        // Create audit
        let auditId = AuditManager.shared.createQuickAudit(
            location: location,
            projectName: projectName
        )
        
        let response = CreateQuickAuditIntentResponse.success(auditId: auditId)
        completion(response)
    }
}

// Intent Handler Provider
class IntentHandler: INExtension {
    override func handler(for intent: INIntent) -> Any {
        if intent is CreateQuickAuditIntent {
            return CreateQuickAuditIntentHandler()
        }
        return self
    }
}
```

### 7.3 iOS Background Tasks

```objc
// PSEUDOCODE - iOS Background Tasks

/*
Background tasks for:
- Cleanup old exports
- Sync to iCloud (if enabled)
- Generate thumbnails
*/

import BackgroundTasks

class BackgroundTaskManager {
    static let shared = BackgroundTaskManager()
    
    func registerTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.eversiteaudit.cleanup",
            using: nil
        ) { task in
            self.handleCleanupTask(task: task as! BGAppRefreshTask)
        }
    }
    
    func scheduleCleanupTask() {
        let request = BGAppRefreshTaskRequest(identifier: "com.eversiteaudit.cleanup")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 24 * 60 * 60) // 24 hours
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule cleanup: \(error)")
        }
    }
    
    private func handleCleanupTask(task: BGAppRefreshTask) {
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        
        let cleanupOperation = BlockOperation {
            // Perform cleanup
            ExportManager.shared.cleanupOldExports()
        }
        
        task.expirationHandler = {
            queue.cancelAllOperations()
        }
        
        cleanupOperation.completionBlock = {
            task.setTaskCompleted(success: !cleanupOperation.isCancelled)
        }
        
        queue.addOperations([cleanupOperation], waitUntilFinished: false)
    }
}
```

### 7.4 Android Widgets (AppWidgetProvider)

```kotlin
// PSEUDOCODE - Android Widget Implementation

class AuditWidgetProvider : AppWidgetProvider() {
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        appWidgetIds.forEach { appWidgetId ->
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_audit)
        
        // Load recent audits
        val recentAudits = loadRecentAudits(context)
        
        // Set up list adapter
        val intent = Intent(context, AuditWidgetService::class.java)
        views.setRemoteAdapter(R.id.widget_list, intent)
        
        // Set up click handler
        val clickIntent = Intent(context, MainActivity::class.java)
        val clickPendingIntent = PendingIntent.getActivity(
            context, 0, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, clickPendingIntent)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
    
    private fun loadRecentAudits(context: Context): List<AuditSummary> {
        // Load from SharedPreferences or database
        return AuditRepository.getRecentAudits(limit = 5)
    }
}
```

#### 7.4.1 Widget XML Configuration

```xml
<!-- PSEUDOCODE - Android Widget Configuration -->

<!-- res/xml/audit_widget_info.xml -->
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:previewImage="@drawable/widget_preview"
    android:initialLayout="@layout/widget_audit"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />

<!-- AndroidManifest.xml -->
<receiver android:name=".widget.AuditWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/audit_widget_info" />
</receiver>
```

### 7.5 Android App Shortcuts

```kotlin
// PSEUDOCODE - Android App Shortcuts

class ShortcutManager(private val context: Context) {
    
    fun createDynamicShortcuts() {
        val shortcutManager = context.getSystemService(ShortcutManager::class.java)
        
        // Quick Audit shortcut
        val quickAuditShortcut = ShortcutInfo.Builder(context, "quick_audit")
            .setShortLabel("Quick Audit")
            .setLongLabel("Start a quick site audit")
            .setIcon(Icon.createWithResource(context, R.drawable.ic_quick_audit))
            .setIntent(Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                putExtra("shortcut_action", "quick_audit")
            })
            .build()
        
        // Recent audits shortcuts
        val recentAudits = getRecentAudits()
        val auditShortcuts = recentAudits.map { audit ->
            ShortcutInfo.Builder(context, "audit_${audit.id}")
                .setShortLabel(audit.name)
                .setLongLabel("Open ${audit.name}")
                .setIcon(Icon.createWithResource(context, R.drawable.ic_audit))
                .setIntent(Intent(context, AuditActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    putExtra("audit_id", audit.id)
                })
                .build()
        }
        
        shortcutManager?.dynamicShortcuts = listOf(quickAuditShortcut) + auditShortcuts
    }
    
    // Static shortcuts (defined in shortcuts.xml)
    fun createStaticShortcuts() {
        // Defined in res/xml/shortcuts.xml
    }
}
```

### 7.6 Android WorkManager

```kotlin
// PSEUDOCODE - Android Background Tasks with WorkManager

class CleanupWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // Cleanup old exports
            ExportManager.cleanupOldExports()
            
            // Generate missing thumbnails
            ThumbnailManager.generateMissingThumbnails()
            
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }
}

// Schedule periodic work
class BackgroundTaskScheduler(private val context: Context) {
    
    fun scheduleCleanupTask() {
        val cleanupWork = PeriodicWorkRequestBuilder<CleanupWorker>(
            24, TimeUnit.HOURS // Run every 24 hours
        ).setConstraints(
            Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .build()
        ).build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "cleanup_work",
            ExistingPeriodicWorkPolicy.KEEP,
            cleanupWork
        )
    }
    
    fun scheduleOneTimeExport(files: List<File>, outputFile: File) {
        val exportWork = OneTimeWorkRequestBuilder<ExportWorker>()
            .setInputData(
                workDataOf(
                    "files" to files.map { it.absolutePath }.toTypedArray(),
                    "output" to outputFile.absolutePath
                )
            )
            .build()
        
        WorkManager.getInstance(context).enqueue(exportWork)
    }
}
```

### 7.7 Push Notifications

```objc
// PSEUDOCODE - iOS Push Notifications

/*
Use local notifications for:
- Backup reminders
- Export completion
- Audit inactivity reminders
*/

import UserNotifications

class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()
    
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            print("Notification permission: \(granted)")
        }
    }
    
    func scheduleBackupReminder() {
        let content = UNMutableNotificationContent()
        content.title = "Backup Your Audits"
        content.body = "You haven't backed up your audits in 7 days. Tap to export."
        content.sound = .default
        
        // Schedule for 7 days
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 7 * 24 * 60 * 60, repeats: false)
        
        let request = UNNotificationRequest(identifier: "backup_reminder", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    func scheduleExportCompletionNotification(exportURL: URL) {
        let content = UNMutableNotificationContent()
        content.title = "Export Complete"
        content.body = "Your audit export is ready to share."
        content.sound = .default
        
        // Immediate notification
        let request = UNNotificationRequest(identifier: "export_complete", content: content, trigger: nil)
        
        UNUserNotificationCenter.current().add(request)
    }
}
```

```kotlin
// PSEUDOCODE - Android Notifications

class NotificationManager(private val context: Context) {
    
    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    
    init {
        createNotificationChannels()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val exportChannel = NotificationChannel(
                "export_channel",
                "Export Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            
            val reminderChannel = NotificationChannel(
                "reminder_channel",
                "Reminders",
                NotificationManager.IMPORTANCE_LOW
            )
            
            notificationManager.createNotificationChannels(listOf(exportChannel, reminderChannel))
        }
    }
    
    fun showExportCompleteNotification(file: File) {
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, "export_channel")
            .setSmallIcon(R.drawable.ic_export_complete)
            .setContentTitle("Export Complete")
            .setContentText("Your audit export is ready: ${file.name}")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(EXPORT_NOTIFICATION_ID, notification)
    }
}
```

---

## 8. Encryption Integration

### 8.1 iOS: Secure Enclave & Keychain

#### 8.1.1 Key Generation and Storage

```objc
// PSEUDOCODE - iOS Key Generation

/*
Secure Enclave: Hardware-backed key storage (iPhone 5s+, iPad Air 2+)
Keychain Services: Secure software key storage
*/

#import <LocalAuthentication/LocalAuthentication>
#import <Security/Security.h>

@interface EncryptionManager : NSObject

// Generate key in Secure Enclave (if available)
- (SecKeyRef _Nullable)generateSecureEnclaveKeyWithTag:(NSString *)tag error:(NSError **)error {
    
    // Key attributes
    NSDictionary *attributes = @{
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeECSECPrimeRandom,
        (id)kSecAttrKeySizeInBits: @256,
        (id)kSecAttrTokenID: (id)kSecAttrTokenIDSecureEnclave,
        (id)kSecPrivateKeyAttrs: @{
            (id)kSecAttrIsPermanent: @YES,
            (id)kSecAttrApplicationTag: [tag dataUsingEncoding:NSUTF8StringEncoding],
            (id)kSecAttrAccessControl: (__bridge_transfer id)SecAccessControlCreateWithFlags(
                kCFAllocatorDefault,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                kSecAccessControlPrivateKeyUsage,
                NULL
            )
        }
    };
    
    CFErrorRef keyError = NULL;
    SecKeyRef privateKey = SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &keyError);
    
    if (keyError) {
        if (error) *error = (__bridge_transfer NSError *)keyError;
        return NULL;
    }
    
    return privateKey;
}

// Fallback: Software key generation
- (SecKeyRef _Nullable)generateSoftwareKeyWithTag:(NSString *)tag error:(NSError **)error {
    NSDictionary *attributes = @{
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeAES,
        (id)kSecAttrKeySizeInBits: @256,
        (id)kSecAttrApplicationTag: [tag dataUsingEncoding:NSUTF8StringEncoding],
        (id)kSecAttrAccessible: (id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    };
    
    // Store in Keychain
    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)attributes, NULL);
    
    if (status != errSecSuccess) {
        // Handle error
        return NULL;
    }
    
    return NULL; // AES keys are stored in Keychain, not returned as SecKeyRef
}

@end
```

#### 8.1.2 AES Encryption/Decryption

```objc
// PSEUDOCODE - iOS AES Encryption with CommonCrypto

#import <CommonCrypto/CommonCryptor.h>

@interface AESEncryption : NSObject

- (NSData *)encryptData:(NSData *)data withKey:(NSData *)key iv:(NSData *)iv error:(NSError **)error {
    // Validate key size (256 bits = 32 bytes)
    if (key.length != kCCKeySizeAES256) {
        if (error) *error = [NSError errorWithDomain:@"Encryption" code:1001 userInfo:@{NSLocalizedDescriptionKey: @"Invalid key size"}];
        return nil;
    }
    
    // Validate IV size (128 bits = 16 bytes)
    if (iv.length != kCCBlockSizeAES128) {
        if (error) *error = [NSError errorWithDomain:@"Encryption" code:1002 userInfo:@{NSLocalizedDescriptionKey: @"Invalid IV size"}];
        return nil;
    }
    
    // Allocate buffer
    size_t cryptLength = data.length + kCCBlockSizeAES128;
    NSMutableData *cryptData = [NSMutableData dataWithLength:cryptLength];
    
    size_t numBytesEncrypted = 0;
    CCCryptorStatus cryptStatus = CCCrypt(
        kCCEncrypt,
        kCCAlgorithmAES,
        kCCOptionPKCS7Padding,
        key.bytes,
        key.length,
        iv.bytes,
        data.bytes,
        data.length,
        cryptData.mutableBytes,
        cryptLength,
        &numBytesEncrypted
    );
    
    if (cryptStatus == kCCSuccess) {
        cryptData.length = numBytesEncrypted;
        return cryptData;
    } else {
        if (error) *error = [NSError errorWithDomain:@"Encryption" code:cryptStatus userInfo:nil];
        return nil;
    }
}

- (NSData *)decryptData:(NSData *)data withKey:(NSData *)key iv:(NSData *)iv error:(NSError **)error {
    // Similar implementation with kCCDecrypt
    // ...
}

@end
```

### 8.2 Android: Android Keystore & Jetpack Security

#### 8.2.1 Keystore Key Generation

```kotlin
// PSEUDOCODE - Android Keystore Key Generation

class KeystoreManager(private val context: Context) {
    
    private val KEY_ALIAS = "eversiteaudit_master_key"
    private val ANDROID_KEYSTORE = "AndroidKeyStore"
    
    fun generateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        
        // Check if key already exists
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return keyStore.getKey(KEY_ALIAS, null) as SecretKey
        }
        
        // Generate new key
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )
        
        val keyGenParameterSpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setUserAuthenticationRequired(false) // Set true for biometric
            .build()
        
        keyGenerator.init(keyGenParameterSpec)
        return keyGenerator.generateKey()
    }
    
    fun getKey(): SecretKey? {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        return keyStore.getKey(KEY_ALIAS, null) as? SecretKey
    }
}
```

#### 8.2.2 Jetpack Security (Recommended)

```kotlin
// PSEUDOCODE - Android Jetpack Security

/*
Dependency: implementation "androidx.security:security-crypto:1.1.0-alpha06"

Provides:
- EncryptedSharedPreferences
- EncryptedFile
*/

class SecureStorageManager(private val context: Context) {
    
    private val masterKeyAlias = MasterKey.DEFAULT_MASTER_KEY_ALIAS
    
    // Create or get master key
    private fun getMasterKey(): MasterKey {
        return MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    }
    
    // Encrypted SharedPreferences
    fun getEncryptedPreferences(): SharedPreferences {
        val masterKey = getMasterKey()
        
        return EncryptedSharedPreferences.create(
            context,
            "secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
    
    // Encrypted File
    fun getEncryptedFile(file: File): EncryptedFile {
        val masterKey = getMasterKey()
        
        return EncryptedFile.Builder(
            context,
            file,
            masterKey,
            EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
        ).build()
    }
    
    // Encrypt audit data
    fun encryptAudit(auditId: String, auditData: ByteArray): File {
        val encryptedFile = File(context.filesDir, "audits/$auditId.enc")
        encryptedFile.parentFile?.mkdirs()
        
        val encryptedFileWrapper = getEncryptedFile(encryptedFile)
        
        encryptedFileWrapper.openFileOutput().use { outputStream ->
            outputStream.write(auditData)
        }
        
        return encryptedFile
    }
    
    // Decrypt audit data
    fun decryptAudit(encryptedFile: File): ByteArray {
        val encryptedFileWrapper = getEncryptedFile(encryptedFile)
        
        return encryptedFileWrapper.openFileInput().use { inputStream ->
            inputStream.readBytes()
        }
    }
}
```

### 8.3 Encryption Comparison

| Feature | iOS Secure Enclave | iOS Keychain | Android Keystore | Jetpack Security |
|---------|-------------------|--------------|------------------|------------------|
| **Hardware-backed** | Yes (A7+ chips) | No | Yes (TEE/StrongBox) | Yes (via Keystore) |
| **Algorithm** | EC P-256, AES | AES-256 | AES-256 | AES-256-GCM |
| **Key Extraction** | Impossible | Difficult | Impossible | Impossible |
| **Biometric Auth** | Supported | Manual | Supported | Supported |
| **Ease of Use** | Moderate | Moderate | Moderate | High |
| **Fallback** | Software keychain | N/A | Software (deprecated) | Software |

---

## 9. Location Services

### 9.1 iOS: CoreLocation

```objc
// PSEUDOCODE - iOS Location Services

#import <CoreLocation/CoreLocation.h>

@interface LocationManager : NSObject <CLLocationManagerDelegate>
@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, copy) void (^locationUpdateHandler)(CLLocation *location, NSError *error);
@end

@implementation LocationManager

- (instancetype)init {
    self = [super init];
    if (self) {
        _locationManager = [[CLLocationManager alloc] init];
        _locationManager.delegate = self;
        _locationManager.desiredAccuracy = kCLLocationAccuracyBest;
        _locationManager.distanceFilter = 10; // meters
    }
    return self;
}

- (void)requestPermission {
    // Request when-in-use authorization
    [_locationManager requestWhenInUseAuthorization];
}

- (void)startUpdatingLocation {
    [_locationManager startUpdatingLocation];
}

- (void)stopUpdatingLocation {
    [_locationManager stopUpdatingLocation];
}

// Get single location update
- (void)requestSingleLocationUpdate:(void (^)(CLLocation *location, NSError *error))completion {
    self.locationUpdateHandler = completion;
    [_locationManager requestLocation];
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
    CLLocation *location = [locations lastObject];
    if (self.locationUpdateHandler) {
        self.locationUpdateHandler(location, nil);
        self.locationUpdateHandler = nil; // Clear after single use
    }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    if (self.locationUpdateHandler) {
        self.locationUpdateHandler(nil, error);
        self.locationUpdateHandler = nil;
    }
}

@end
```

### 9.2 Android: Fused Location Provider

```kotlin
// PSEUDOCODE - Android Fused Location Provider

class LocationManager(private val context: Context) {
    
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
    
    private val locationRequest = LocationRequest.create().apply {
        priority = LocationRequest.PRIORITY_HIGH_ACCURACY
        interval = 10000 // 10 seconds
        fastestInterval = 5000 // 5 seconds
    }
    
    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                onLocationUpdate?.invoke(location)
            }
        }
    }
    
    var onLocationUpdate: ((Location) -> Unit)? = null
    
    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }
    
    fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }
    
    @SuppressLint("MissingPermission")
    fun getLastLocation(callback: (Location?) -> Unit) {
        fusedLocationClient.lastLocation
            .addOnSuccessListener { location ->
                callback(location)
            }
            .addOnFailureListener {
                callback(null)
            }
    }
}
```

### 9.3 EXIF Metadata Handling

```objc
// PSEUDOCODE - iOS EXIF Writing

#import <ImageIO/ImageIO.h>

- (NSData *)addLocationToImage:(NSData *)imageData location:(CLLocation *)location {
    // Create image source
    CGImageSourceRef source = CGImageSourceCreateWithData((__bridge CFDataRef)imageData, NULL);
    
    // Get mutable metadata
    NSDictionary *metadata = (__bridge NSDictionary *)CGImageSourceCopyPropertiesAtIndex(source, 0, NULL);
    NSMutableDictionary *mutableMetadata = [metadata mutableCopy];
    
    // Add GPS metadata
    NSMutableDictionary *gpsMetadata = [NSMutableDictionary dictionary];
    gpsMetadata[(NSString *)kCGImagePropertyGPSLatitude] = @(fabs(location.coordinate.latitude));
    gpsMetadata[(NSString *)kCGImagePropertyGPSLatitudeRef] = location.coordinate.latitude >= 0 ? @"N" : @"S";
    gpsMetadata[(NSString *)kCGImagePropertyGPSLongitude] = @(fabs(location.coordinate.longitude));
    gpsMetadata[(NSString *)kCGImagePropertyGPSLongitudeRef] = location.coordinate.longitude >= 0 ? @"E" : @"W";
    gpsMetadata[(NSString *)kCGImagePropertyGPSAltitude] = @(location.altitude);
    gpsMetadata[(NSString *)kCGImagePropertyGPSTimeStamp] = [self gpsTimestampFromDate:location.timestamp];
    
    mutableMetadata[(NSString *)kCGImagePropertyGPSDictionary] = gpsMetadata;
    
    // Create destination with new metadata
    NSMutableData *destData = [NSMutableData data];
    CGImageDestinationRef destination = CGImageDestinationCreateWithData(
        (__bridge CFMutableDataRef)destData,
        CGImageSourceGetType(source),
        1,
        NULL
    );
    
    CGImageDestinationAddImageFromSource(destination, source, 0, (__bridge CFDictionaryRef)mutableMetadata);
    CGImageDestinationFinalize(destination);
    
    CFRelease(source);
    CFRelease(destination);
    
    return destData;
}
```

```kotlin
// PSEUDOCODE - Android EXIF Writing

import androidx.exifinterface.media.ExifInterface

fun addLocationToImage(imageFile: File, location: Location) {
    val exif = ExifInterface(imageFile)
    
    // Set GPS coordinates
    exif.setAttribute(ExifInterface.TAG_GPS_LATITUDE, location.latitude.toDMS())
    exif.setAttribute(ExifInterface.TAG_GPS_LATITUDE_REF, if (location.latitude >= 0) "N" else "S")
    exif.setAttribute(ExifInterface.TAG_GPS_LONGITUDE, location.longitude.toDMS())
    exif.setAttribute(ExifInterface.TAG_GPS_LONGITUDE_REF, if (location.longitude >= 0) "E" else "W")
    exif.setAttribute(ExifInterface.TAG_GPS_ALTITUDE, location.altitude.toString())
    
    exif.saveAttributes()
}

// Convert decimal to DMS format
fun Double.toDMS(): String {
    val degrees = this.toInt()
    val minutes = ((this - degrees) * 60).toInt()
    val seconds = ((this - degrees - minutes / 60.0) * 3600)
    return "$degrees/1,$minutes/1,${(seconds * 100).toInt()}/100"
}
```

### 9.4 Privacy: Stripping GPS from Shared Photos

```objc
// PSEUDOCODE - iOS Strip GPS Metadata

- (NSData *)stripGPSMetadataFromImage:(NSData *)imageData {
    CGImageSourceRef source = CGImageSourceCreateWithData((__bridge CFDataRef)imageData, NULL);
    
    NSMutableDictionary *metadata = [(__bridge NSDictionary *)CGImageSourceCopyPropertiesAtIndex(source, 0, NULL) mutableCopy];
    
    // Remove GPS dictionary
    [metadata removeObjectForKey:(NSString *)kCGImagePropertyGPSDictionary];
    
    // Create new image without GPS
    NSMutableData *destData = [NSMutableData data];
    CGImageDestinationRef destination = CGImageDestinationCreateWithData(
        (__bridge CFMutableDataRef)destData,
        CGImageSourceGetType(source),
        1,
        NULL
    );
    
    CGImageDestinationAddImageFromSource(destination, source, 0, (__bridge CFDictionaryRef)metadata);
    CGImageDestinationFinalize(destination);
    
    CFRelease(source);
    CFRelease(destination);
    
    return destData;
}
```

---

## 10. Audio/Voice Recording

### 10.1 iOS: AVAudioRecorder

```objc
// PSEUDOCODE - iOS Audio Recording

#import <AVFoundation/AVFoundation.h>

@interface AudioRecorder : NSObject <AVAudioRecorderDelegate>
@property (nonatomic, strong) AVAudioRecorder *recorder;
@property (nonatomic, copy) void (^recordingCompletion)(NSURL *fileURL, NSError *error);
@end

@implementation AudioRecorder

- (BOOL)startRecordingToURL:(NSURL *)url error:(NSError **)error {
    // Audio session configuration
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayAndRecord error:error];
    [session setActive:YES error:error];
    
    // Recording settings
    NSDictionary *settings = @{
        AVFormatIDKey: @(kAudioFormatMPEG4AAC),
        AVSampleRateKey: @44100.0,
        AVNumberOfChannelsKey: @2,
        AVEncoderAudioQualityKey: @(AVAudioQualityHigh)
    };
    
    // Create recorder
    _recorder = [[AVAudioRecorder alloc] initWithURL:url settings:settings error:error];
    _recorder.delegate = self;
    
    if (_recorder) {
        [_recorder prepareToRecord];
        return [_recorder record];
    }
    
    return NO;
}

- (void)stopRecording {
    [_recorder stop];
    
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setActive:NO error:nil];
}

- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder successfully:(BOOL)flag {
    if (flag) {
        self.recordingCompletion(recorder.url, nil);
    } else {
        NSError *error = [NSError errorWithDomain:@"Audio" code:1001 userInfo:@{NSLocalizedDescriptionKey: @"Recording failed"}];
        self.recordingCompletion(nil, error);
    }
}

@end
```

### 10.2 Android: MediaRecorder

```kotlin
// PSEUDOCODE - Android Audio Recording

class AudioRecorder(private val context: Context) {
    
    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null
    
    fun startRecording(auditId: String): File? {
        outputFile = File(context.getExternalFilesDir(null), "audits/$auditId/audio/note_${System.currentTimeMillis()}.m4a")
        outputFile?.parentFile?.mkdirs()
        
        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
        
        mediaRecorder?.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setOutputFile(outputFile?.absolutePath)
            
            try {
                prepare()
                start()
            } catch (e: Exception) {
                Log.e(TAG, "Recording failed", e)
                return null
            }
        }
        
        return outputFile
    }
    
    fun stopRecording(): File? {
        mediaRecorder?.apply {
            try {
                stop()
                release()
            } catch (e: Exception) {
                Log.e(TAG, "Stop recording failed", e)
            }
        }
        mediaRecorder = null
        
        return outputFile
    }
}
```

### 10.3 Audio Format Comparison

| Format | iOS Support | Android Support | Quality | Size | Use Case |
|--------|-------------|-----------------|---------|------|----------|
| AAC (M4A) | Yes | Yes | High | Small | Recommended |
| WAV | Yes | Yes | Lossless | Large | High quality needed |
| MP3 | Yes | Yes | Good | Small | Compatibility |
| FLAC | Yes (limited) | Yes | Lossless | Medium | Archival |

---

## 11. Permission Management

### 11.1 Required Permissions Summary

| Feature | iOS Permission | Android Permission | Runtime Required |
|---------|---------------|-------------------|------------------|
| Camera | `NSCameraUsageDescription` | `CAMERA` | Yes |
| Photo Library | `NSPhotoLibraryUsageDescription` | `READ_EXTERNAL_STORAGE` | Yes (Android < 13) |
| Location (Foreground) | `NSLocationWhenInUseUsageDescription` | `ACCESS_FINE_LOCATION` | Yes |
| Location (Background) | `NSLocationAlwaysUsageDescription` | `ACCESS_BACKGROUND_LOCATION` | Yes |
| Microphone | `NSMicrophoneUsageDescription` | `RECORD_AUDIO` | Yes |
| Notifications | - | `POST_NOTIFICATIONS` (Android 13+) | Yes |

### 11.2 iOS Permission Flow

```objc
// PSEUDOCODE - iOS Permission Manager

typedef NS_ENUM(NSInteger, PermissionType) {
    PermissionTypeCamera,
    PermissionTypePhotoLibrary,
    PermissionTypeLocation,
    PermissionTypeMicrophone,
    PermissionTypeNotifications
};

@interface PermissionManager : NSObject

+ (void)requestPermission:(PermissionType)type completion:(void (^)(BOOL granted))completion;
+ (PermissionStatus)checkPermission:(PermissionType)type;

@end

@implementation PermissionManager

+ (void)requestPermission:(PermissionType)type completion:(void (^)(BOOL granted))completion {
    switch (type) {
        case PermissionTypeCamera:
            [self requestCameraPermission:completion];
            break;
        case PermissionTypePhotoLibrary:
            [self requestPhotoLibraryPermission:completion];
            break;
        case PermissionTypeLocation:
            [self requestLocationPermission:completion];
            break;
        case PermissionTypeMicrophone:
            [self requestMicrophonePermission:completion];
            break;
        case PermissionTypeNotifications:
            [self requestNotificationPermission:completion];
            break;
    }
}

+ (void)requestCameraPermission:(void (^)(BOOL granted))completion {
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
    
    switch (status) {
        case AVAuthorizationStatusAuthorized:
            completion(YES);
            break;
        case AVAuthorizationStatusNotDetermined:
            [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:completion];
            break;
        case AVAuthorizationStatusDenied:
        case AVAuthorizationStatusRestricted:
            completion(NO);
            break;
    }
}

@end
```

### 11.3 Android Permission Flow

```kotlin
// PSEUDOCODE - Android Permission Manager

class PermissionManager(private val activity: AppCompatActivity) {
    
    private val permissionLauncher = activity.registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        permissions.entries.forEach { entry ->
            val permission = entry.key
            val granted = entry.value
            onPermissionResult?.invoke(permission, granted)
        }
    }
    
    var onPermissionResult: ((String, Boolean) -> Unit)? = null
    
    fun requestPermissions(permissions: Array<String>) {
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
        
        if (permissionsToRequest.isEmpty()) {
            // All permissions already granted
            permissions.forEach { onPermissionResult?.invoke(it, true) }
        } else {
            permissionLauncher.launch(permissionsToRequest)
        }
    }
    
    fun shouldShowRationale(permission: String): Boolean {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    }
    
    fun openSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", activity.packageName, null)
        }
        activity.startActivity(intent)
    }
}

// Usage
val permissionManager = PermissionManager(this)

permissionManager.onPermissionResult = { permission, granted ->
    when (permission) {
        Manifest.permission.CAMERA -> {
            if (!granted && !permissionManager.shouldShowRationale(permission)) {
                // "Don't ask again" selected - direct to settings
                showSettingsDialog()
            }
        }
    }
}

permissionManager.requestPermissions(arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.RECORD_AUDIO
))
```

### 11.4 Permission Rationale UI

```kotlin
// PSEUDOCODE - Permission Rationale Dialog

fun showPermissionRationale(activity: Activity, permission: String, onGranted: () -> Unit) {
    val (title, message) = when (permission) {
        Manifest.permission.CAMERA -> 
            "Camera Access" to "Camera access is needed to capture site photos."
        Manifest.permission.ACCESS_FINE_LOCATION -> 
            "Location Access" to "Location is used to tag photos with GPS coordinates."
        Manifest.permission.RECORD_AUDIO -> 
            "Microphone Access" to "Microphone access is needed for voice notes."
        else -> "Permission Required" to "This permission is needed for the app to function."
    }
    
    AlertDialog.Builder(activity)
        .setTitle(title)
        .setMessage(message)
        .setPositiveButton("Grant") { _, _ -> onGranted() }
        .setNegativeButton("Cancel", null)
        .show()
}
```

---

## 12. Integration Patterns

### 12.1 Native Module Structure (React Native)

```objc
// PSEUDOCODE - React Native iOS Native Module

// CameraModule.h
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface CameraModule : RCTEventEmitter <RCTBridgeModule>
@end

// CameraModule.m
#import "CameraModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation CameraModule

RCT_EXPORT_MODULE();

// Export methods to JavaScript
RCT_EXPORT_METHOD(startCamera:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    // Implementation
    resolve(@{@"status": @"started"});
}

RCT_EXPORT_METHOD(capturePhoto:(NSDictionary *)options 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // Capture photo
    // Resolve with file path or reject with error
}

RCT_EXPORT_METHOD(captureBurst:(NSInteger)count 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // Capture burst
    // Send progress events
    // Resolve with array of file paths
}

// Send events to JavaScript
- (void)sendProgressEvent:(NSInteger)current total:(NSInteger)total {
    [self sendEventWithName:@"BurstCaptureProgress" 
                       body:@{@"current": @(current), @"total": @(total)}];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"BurstCaptureProgress", @"CameraError"];
}

@end
```

```kotlin
// PSEUDOCODE - React Native Android Native Module

class CameraModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "CameraModule"
    
    @ReactMethod
    fun startCamera(promise: Promise) {
        try {
            // Start camera
            promise.resolve(mapOf("status" to "started"))
        } catch (e: Exception) {
            promise.reject("CAMERA_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun capturePhoto(options: ReadableMap, promise: Promise) {
        // Capture photo
        // Resolve with file path or reject
    }
    
    @ReactMethod
    fun captureBurst(count: Int, promise: Promise) {
        // Capture burst with progress events
        val params = Arguments.createMap().apply {
            putInt("current", current)
            putInt("total", total)
        }
        sendEvent("BurstCaptureProgress", params)
    }
    
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
```

### 12.2 Error Propagation Pattern

```typescript
// PSEUDOCODE - Cross-Platform Error Handling

// Error codes should be consistent across platforms
enum CameraErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SESSION_INTERRUPTED = 'SESSION_INTERRUPTED',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  CAPTURE_FAILED = 'CAPTURE_FAILED',
  DEVICE_NOT_AVAILABLE = 'DEVICE_NOT_AVAILABLE'
}

interface CameraError {
  code: CameraErrorCode;
  message: string;
  nativeError?: string;
  recoverable: boolean;
}

// Native modules should reject with structured errors
// iOS:
// reject(@"PERMISSION_DENIED", @"Camera permission was denied", error);

// Android:
// promise.reject("PERMISSION_DENIED", "Camera permission was denied", exception);

// JavaScript handling:
class CameraManager {
  async captureBurst(count: number): Promise<string[]> {
    try {
      return await NativeCameraModule.captureBurst(count);
    } catch (error) {
      const cameraError = this.parseError(error);
      
      switch (cameraError.code) {
        case CameraErrorCode.PERMISSION_DENIED:
          throw new CameraPermissionError(cameraError.message);
        case CameraErrorCode.OUT_OF_MEMORY:
          // Try with reduced quality
          return this.captureBurstWithReducedQuality(count);
        default:
          throw cameraError;
      }
    }
  }
}
```

### 12.3 Progress Reporting Pattern

```typescript
// PSEUDOCODE - Progress Reporting

interface ProgressEvent {
  operation: string;
  current: number;
  total: number;
  message?: string;
}

class ExportManager {
  private progressListeners: Set<(event: ProgressEvent) => void> = new Set();
  
  onProgress(callback: (event: ProgressEvent) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }
  
  private emitProgress(event: ProgressEvent) {
    this.progressListeners.forEach(cb => cb(event));
  }
  
  async exportAudit(auditId: string, format: ExportFormat): Promise<string> {
    // Subscribe to native events
    const subscription = NativeEventEmitter.addListener(
      'ExportProgress',
      (event: ProgressEvent) => this.emitProgress(event)
    );
    
    try {
      const result = await NativeExportModule.exportAudit(auditId, format);
      return result;
    } finally {
      subscription.remove();
    }
  }
}

// Usage in UI:
const exportManager = new ExportManager();

exportManager.onProgress((event) => {
  if (event.operation === 'pdf_generation') {
    updatePDFProgress(event.current / event.total);
  } else if (event.operation === 'zip_creation') {
    updateZIPProgress(event.current / event.total);
  }
});
```

### 12.4 Cancellation Pattern

```kotlin
// PSEUDOCODE - Cancellation Support

class CancellableOperation {
    private val cancellationToken = CancellationTokenSource()
    
    fun cancel() {
        cancellationToken.cancel()
    }
    
    suspend fun performLongOperation(): Result<String> {
        return try {
            withContext(Dispatchers.IO) {
                // Check cancellation periodically
                for (i in 0..100) {
                    ensureActive() // Throws CancellationException if cancelled
                    
                    // Do work
                    processItem(i)
                    
                    // Report progress
                    emitProgress(i, 100)
                }
            }
            Result.success("completed")
        } catch (e: CancellationException) {
            Result.failure(e)
        }
    }
}

// Native module method with cancellation
@ReactMethod
fun startExport(auditId: String, promise: Promise) {
    val operation = CancellableOperation()
    
    // Store operation for potential cancellation
    activeOperations[auditId] = operation
    
    operation.performLongOperation()
        .onSuccess { promise.resolve(it) }
        .onFailure { promise.reject("EXPORT_ERROR", it.message) }
}

@ReactMethod
fun cancelExport(auditId: String) {
    activeOperations[auditId]?.cancel()
    activeOperations.remove(auditId)
}
```

### 12.5 Testing Native Integrations

| Test Type | iOS Approach | Android Approach |
|-----------|--------------|------------------|
| Unit Tests | XCTest with mocking | JUnit + Mockito/Robolectric |
| Integration Tests | XCUITest | Espresso |
| Snapshot Tests | SnapshotTesting library | Shot/Paparazzi |
| Performance Tests | XCTMetric | Android Profiler |

```objc
// PSEUDOCODE - iOS Unit Test Example

- (void)testBurstCapture {
    // Given
    CameraManager *manager = [[CameraManager alloc] init];
    XCTestExpectation *expectation = [self expectationWithDescription:@"Burst capture complete"];
    
    // When
    [manager captureBurst:5 completion:^(NSArray<UIImage *> *images, NSError *error) {
        // Then
        XCTAssertNil(error);
        XCTAssertEqual(images.count, 5);
        [expectation fulfill];
    }];
    
    [self waitForExpectations:@[expectation] timeout:10.0];
}
```

```kotlin
// PSEUDOCODE - Android Unit Test Example

@Test
fun `capture burst returns correct number of photos`() = runTest {
    // Given
    val cameraManager = CameraManager(mockContext)
    
    // When
    val result = cameraManager.captureBurst(count = 5)
    
    // Then
    assertEquals(5, result.size)
}
```

---

## Appendix A: Platform Version Support Matrix

| Feature | iOS Minimum | Android Minimum | Notes |
|---------|-------------|-----------------|-------|
| Camera | 10.0 | 5.0 (API 21) | CameraX requires API 21+ |
| PDF Generation | 10.0 | 5.0 (API 21) | PdfDocument API 19+ |
| Secure Enclave | 9.0 (A7 chip) | - | Hardware dependent |
| Keystore | - | 6.0 (API 23) | Hardware-backed 7.0+ |
| Scoped Storage | - | 10 (API 29) | Mandatory 11+ |
| Widgets | 14.0 | 3.0 (API 11) | Modern widgets 12+ |
| Shortcuts | 12.0 | 7.1 (API 25) | - |

## Appendix B: Dependency Summary

### iOS (CocoaPods/SPM)
```
ZIPFoundation (ZIP creation)
PDFKit (Built-in, iOS 11+)
```

### Android (Gradle)
```groovy
// CameraX
def camerax_version = "1.3.0"
implementation "androidx.camera:camera-core:$camerax_version"
implementation "androidx.camera:camera-camera2:$camerax_version"
implementation "androidx.camera:camera-lifecycle:$camerax_version"
implementation "androidx.camera:camera-view:$camerax_version"

// WorkManager
implementation "androidx.work:work-runtime-ktx:2.9.0"

// Security
implementation "androidx.security:security-crypto:1.1.0-alpha06"

// Location
implementation "com.google.android.gms:play-services-location:21.0.1"

// PDF (optional - iText)
implementation 'com.itextpdf:itext7-core:7.2.5'
```

---

*Document Version: 1.0*
*Last Updated: January 2024*
*For EverSiteAudit Integration Team*
