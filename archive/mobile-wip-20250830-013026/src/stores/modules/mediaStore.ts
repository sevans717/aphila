import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MediaItem,
  MediaCollection,
  MediaFilter,
  CameraSettings,
  MediaProcessingSettings,
} from "../../types/media";

interface MediaState {
  // Media library
  mediaItems: MediaItem[];
  collections: MediaCollection[];

  // Camera state
  cameraSettings: CameraSettings;
  isRecording: boolean;
  recordingDuration: number;
  captureMode: "photo" | "video" | "story";

  // Processing state
  processingQueue: MediaItem[];
  uploadQueue: MediaItem[];
  processingSettings: MediaProcessingSettings;

  // Gallery state
  selectedItems: string[];
  viewMode: "grid" | "timeline" | "albums";
  currentFilter: MediaFilter;

  // Content creation
  editingItem: MediaItem | null;
  editHistory: MediaItem[];

  // Storage and sync
  storageUsed: number;
  storageLimit: number;
  syncStatus: "idle" | "syncing" | "error";
  offlineItems: string[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Statistics
  totalPhotos: number;
  totalVideos: number;
  totalStorage: number;
}

interface MediaActions {
  // Media management
  loadMediaLibrary: () => Promise<void>;
  addMediaItem: (item: MediaItem) => void;
  removeMediaItem: (itemId: string) => void;
  updateMediaItem: (itemId: string, updates: Partial<MediaItem>) => void;

  // Collection management
  createCollection: (name: string, description?: string) => string;
  addToCollection: (collectionId: string, mediaIds: string[]) => void;
  removeFromCollection: (collectionId: string, mediaIds: string[]) => void;
  deleteCollection: (collectionId: string) => void;

  // Camera operations
  updateCameraSettings: (settings: Partial<CameraSettings>) => void;
  setCaptureMode: (mode: "photo" | "video" | "story") => void;
  startRecording: () => void;
  stopRecording: () => MediaItem;
  capturePhoto: () => MediaItem;

  // Processing and editing
  startProcessing: (itemId: string) => void;
  applyFilter: (itemId: string, filterName: string) => void;
  cropMedia: (itemId: string, cropData: any) => void;
  rotateMedia: (itemId: string, degrees: number) => void;
  adjustBrightness: (itemId: string, value: number) => void;
  adjustContrast: (itemId: string, value: number) => void;
  adjustSaturation: (itemId: string, value: number) => void;

  // Upload and sync
  queueForUpload: (itemId: string) => void;
  uploadMedia: (itemId: string) => Promise<void>;
  syncLibrary: () => Promise<void>;
  downloadForOffline: (itemId: string) => Promise<void>;

  // Selection and filtering
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilter: (filter: MediaFilter) => void;
  setViewMode: (mode: "grid" | "timeline" | "albums") => void;

  // Editing workflow
  startEditing: (itemId: string) => void;
  saveEdit: () => void;
  undoEdit: () => void;
  redoEdit: () => void;
  discardEdits: () => void;

  // Storage management
  updateStorageUsage: () => Promise<void>;
  cleanupStorage: () => Promise<void>;

  // Cleanup
  clearMediaData: () => void;
}

type MediaStore = MediaState & MediaActions;

export const useMediaStore = create<MediaStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mediaItems: [],
      collections: [],
      cameraSettings: {
        mode: "photo",
        quality: "high",
        flashMode: "auto",
        focusMode: "auto",
        aspectRatio: "4:3",
        timer: 0,
        gridLines: false,
        mirrorFrontCamera: false,
        geotagging: true,
        stabilization: true,
      },
      isRecording: false,
      recordingDuration: 0,
      captureMode: "photo",
      processingQueue: [],
      uploadQueue: [],
      processingSettings: {
        autoResize: true,
        quality: 0.8,
        format: "original",
        watermark: false,
        compression: true,
      },
      selectedItems: [],
      viewMode: "grid",
      currentFilter: {
        id: "default",
        name: "All Media",
        category: "custom",
        thumbnailUrl: "",
        isPremium: false,
        parameters: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          tint: 0,
          exposure: 0,
          highlights: 0,
          shadows: 0,
          vibrance: 0,
          clarity: 0,
          vignette: 0,
          grain: 0,
        },
      },
      editingItem: null,
      editHistory: [],
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
      syncStatus: "idle",
      offlineItems: [],
      isLoading: false,
      error: null,
      totalPhotos: 0,
      totalVideos: 0,
      totalStorage: 0,

      // Actions
      loadMediaLibrary: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement API call
          // const mediaItems = await MediaService.getMediaLibrary();
          // const collections = await MediaService.getCollections();
          // set({ mediaItems, collections, isLoading: false });
          set({ isLoading: false });
        } catch (error) {
          console.error("Failed to load media library:", error);
          set({ error: "Failed to load media library", isLoading: false });
        }
      },

      addMediaItem: (item: MediaItem) => {
        set((state) => ({
          mediaItems: [item, ...state.mediaItems],
          totalPhotos:
            item.type === "image" ? state.totalPhotos + 1 : state.totalPhotos,
          totalVideos:
            item.type === "video" ? state.totalVideos + 1 : state.totalVideos,
        }));
      },

      removeMediaItem: (itemId: string) => {
        set((state) => {
          const item = state.mediaItems.find((item) => item.id === itemId);
          return {
            mediaItems: state.mediaItems.filter((item) => item.id !== itemId),
            selectedItems: state.selectedItems.filter((id) => id !== itemId),
            totalPhotos:
              item?.type === "image"
                ? state.totalPhotos - 1
                : state.totalPhotos,
            totalVideos:
              item?.type === "video"
                ? state.totalVideos - 1
                : state.totalVideos,
          };
        });
      },

      updateMediaItem: (itemId: string, updates: Partial<MediaItem>) => {
        set((state) => ({
          mediaItems: state.mediaItems.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }));
      },

      createCollection: (name: string, description?: string) => {
        const collection: MediaCollection = {
          id: `collection_${Date.now()}`,
          userId: "", // TODO: Get from auth
          name,
          description,
          coverImageUrl: undefined,
          mediaItems: [],
          privacy: {
            visibility: "private",
            allowCollaboration: false,
            allowComments: true,
          },
          isShared: false,
          collaborators: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          collections: [...state.collections, collection],
        }));

        return collection.id;
      },

      addToCollection: (collectionId: string, mediaIds: string[]) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  mediaItems: Array.from(
                    new Set([...collection.mediaItems, ...mediaIds])
                  ),
                  updatedAt: new Date().toISOString(),
                  coverImageUrl:
                    collection.coverImageUrl || mediaIds[0] || undefined,
                }
              : collection
          ),
        }));
      },

      removeFromCollection: (collectionId: string, mediaIds: string[]) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  mediaItems: collection.mediaItems.filter(
                    (id: string) => !mediaIds.includes(id)
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : collection
          ),
        }));
      },

      deleteCollection: (collectionId: string) => {
        set((state) => ({
          collections: state.collections.filter(
            (collection) => collection.id !== collectionId
          ),
        }));
      },

      updateCameraSettings: (settings: Partial<CameraSettings>) => {
        set((state) => ({
          cameraSettings: { ...state.cameraSettings, ...settings },
        }));
      },

      setCaptureMode: (mode: "photo" | "video" | "story") => {
        set({ captureMode: mode });
      },

      startRecording: () => {
        set({ isRecording: true, recordingDuration: 0 });

        // Start duration timer
        const timer = setInterval(() => {
          const { isRecording } = get();
          if (!isRecording) {
            clearInterval(timer);
            return;
          }
          set((state) => ({ recordingDuration: state.recordingDuration + 1 }));
        }, 1000);
      },

      stopRecording: () => {
        const { recordingDuration } = get();
        set({ isRecording: false, recordingDuration: 0 });

        // Create video item
        const videoItem: MediaItem = {
          id: `video_${Date.now()}`,
          userId: "", // TODO: Get from auth
          type: "video",
          url: `file://video_${Date.now()}.mp4`,
          thumbnailUrl: `file://thumb_${Date.now()}.jpg`,
          originalUrl: `file://video_${Date.now()}.mp4`,
          fileName: `video_${Date.now()}.mp4`,
          mimeType: "video/mp4",
          size: recordingDuration * 1024 * 1024, // Estimate
          dimensions: {
            width: 1920,
            height: 1080,
            aspectRatio: 16 / 9,
          },
          duration: recordingDuration,
          metadata: {
            originalFileName: `video_${Date.now()}.mp4`,
            uploadSource: "camera",
            deviceInfo: {
              platform: "ios", // TODO: Get from device
              model: "iPhone", // TODO: Get from device
              osVersion: "15.0", // TODO: Get from device
              appVersion: "1.0.0",
            },
            location: undefined,
            exif: undefined,
            isHDR: false,
            hasTransparency: false,
            frameRate: 30,
            codec: "h264",
            bitrate: 5000000,
          },
          processing: {
            status: "completed",
            progress: 100,
            stages: [],
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
          privacy: {
            visibility: "private",
            allowDownload: true,
            allowShare: true,
            allowEmbed: false,
            watermark: false,
          },
          analytics: {
            views: 0,
            uniqueViews: 0,
            likes: 0,
            shares: 0,
            downloads: 0,
            comments: 0,
            engagement: {
              totalEngagements: 0,
              engagementRate: 0,
              topReferrers: [],
              viewsByCountry: {},
              viewsByDevice: {},
            },
          },
          tags: [],
          categories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        get().addMediaItem(videoItem);
        return videoItem;
      },

      capturePhoto: () => {
        const photoItem: MediaItem = {
          id: `photo_${Date.now()}`,
          userId: "", // TODO: Get from auth
          type: "image",
          url: `file://photo_${Date.now()}.jpg`,
          thumbnailUrl: `file://thumb_${Date.now()}.jpg`,
          originalUrl: `file://photo_${Date.now()}.jpg`,
          fileName: `photo_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          size: 2 * 1024 * 1024, // 2MB estimate
          dimensions: {
            width: 3024,
            height: 4032,
            aspectRatio: 3 / 4,
          },
          metadata: {
            originalFileName: `photo_${Date.now()}.jpg`,
            uploadSource: "camera",
            deviceInfo: {
              platform: "ios", // TODO: Get from device
              model: "iPhone", // TODO: Get from device
              osVersion: "15.0", // TODO: Get from device
              appVersion: "1.0.0",
            },
            location: undefined,
            exif: undefined,
            isHDR: false,
            hasTransparency: false,
          },
          processing: {
            status: "completed",
            progress: 100,
            stages: [],
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
          privacy: {
            visibility: "private",
            allowDownload: true,
            allowShare: true,
            allowEmbed: false,
            watermark: false,
          },
          analytics: {
            views: 0,
            uniqueViews: 0,
            likes: 0,
            shares: 0,
            downloads: 0,
            comments: 0,
            engagement: {
              totalEngagements: 0,
              engagementRate: 0,
              topReferrers: [],
              viewsByCountry: {},
              viewsByDevice: {},
            },
          },
          tags: [],
          categories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        get().addMediaItem(photoItem);
        return photoItem;
      },

      startProcessing: (itemId: string) => {
        const item = get().mediaItems.find((item) => item.id === itemId);
        if (item) {
          set((state) => ({
            processingQueue: [...state.processingQueue, item],
          }));
        }
      },

      applyFilter: (itemId: string, filterName: string) => {
        // TODO: Implement filter application
        console.log("Applying filter:", itemId, filterName);
      },

      cropMedia: (itemId: string, cropData: any) => {
        // TODO: Implement crop functionality
        console.log("Cropping media:", itemId, cropData);
      },

      rotateMedia: (itemId: string, degrees: number) => {
        // TODO: Implement rotation
        console.log("Rotating media:", itemId, degrees);
      },

      adjustBrightness: (itemId: string, value: number) => {
        // TODO: Implement brightness adjustment
        console.log("Adjusting brightness:", itemId, value);
      },

      adjustContrast: (itemId: string, value: number) => {
        // TODO: Implement contrast adjustment
        console.log("Adjusting contrast:", itemId, value);
      },

      adjustSaturation: (itemId: string, value: number) => {
        // TODO: Implement saturation adjustment
        console.log("Adjusting saturation:", itemId, value);
      },

      queueForUpload: (itemId: string) => {
        const item = get().mediaItems.find((item) => item.id === itemId);
        if (item) {
          set((state) => ({
            uploadQueue: [...state.uploadQueue, item],
          }));
          // TODO: Update processing status to pending
          console.log("Setting upload status to pending for:", itemId);
        }
      },

      uploadMedia: async (itemId: string) => {
        // TODO: Update processing status to uploading
        console.log("Setting upload status to uploading for:", itemId);

        try {
          // TODO: Implement upload to backend
          // await MediaService.uploadMedia(itemId);

          // Simulate upload
          setTimeout(() => {
            // TODO: Update processing status to uploaded
            console.log("Setting upload status to uploaded for:", itemId);
            set((state) => ({
              uploadQueue: state.uploadQueue.filter(
                (item) => item.id !== itemId
              ),
            }));
          }, 2000);
        } catch (error) {
          console.error("Upload failed:", error);
          // TODO: Update processing status to failed
          console.log("Setting upload status to failed for:", itemId);
        }
      },

      syncLibrary: async () => {
        set({ syncStatus: "syncing" });

        try {
          // TODO: Implement sync with backend
          // await MediaService.syncLibrary();
          set({ syncStatus: "idle" });
        } catch (error) {
          console.error("Sync failed:", error);
          set({ syncStatus: "error" });
        }
      },

      downloadForOffline: async (itemId: string) => {
        try {
          // TODO: Implement offline download
          set((state) => ({
            offlineItems: [...state.offlineItems, itemId],
          }));
        } catch (error) {
          console.error("Download failed:", error);
        }
      },

      selectItem: (itemId: string) => {
        set((state) => ({
          selectedItems: state.selectedItems.includes(itemId)
            ? state.selectedItems
            : [...state.selectedItems, itemId],
        }));
      },

      deselectItem: (itemId: string) => {
        set((state) => ({
          selectedItems: state.selectedItems.filter((id) => id !== itemId),
        }));
      },

      selectAll: () => {
        set((state) => ({
          selectedItems: state.mediaItems.map((item) => item.id),
        }));
      },

      clearSelection: () => {
        set({ selectedItems: [] });
      },

      setFilter: (filter: MediaFilter) => {
        set({ currentFilter: filter });
      },

      setViewMode: (mode: "grid" | "timeline" | "albums") => {
        set({ viewMode: mode });
      },

      startEditing: (itemId: string) => {
        const item = get().mediaItems.find((item) => item.id === itemId);
        if (item) {
          set({ editingItem: item, editHistory: [item] });
        }
      },

      saveEdit: () => {
        const { editingItem } = get();
        if (editingItem) {
          get().updateMediaItem(editingItem.id, editingItem);
          set({ editingItem: null, editHistory: [] });
        }
      },

      undoEdit: () => {
        set((state) => {
          if (state.editHistory.length > 1) {
            const newHistory = [...state.editHistory];
            newHistory.pop();
            const previousState = newHistory[newHistory.length - 1];
            return {
              editingItem: previousState,
              editHistory: newHistory,
            };
          }
          return state;
        });
      },

      redoEdit: () => {
        // TODO: Implement redo functionality with forward history
        console.log("Redo edit");
      },

      discardEdits: () => {
        set({ editingItem: null, editHistory: [] });
      },

      updateStorageUsage: async () => {
        try {
          // TODO: Implement storage calculation
          const totalSize = get().mediaItems.reduce(
            (sum, item) => sum + item.size,
            0
          );
          set({
            storageUsed: totalSize,
            totalStorage: totalSize,
          });
        } catch (error) {
          console.error("Failed to update storage usage:", error);
        }
      },

      cleanupStorage: async () => {
        try {
          // TODO: Implement storage cleanup
          // Remove old temporary files, clear caches, etc.
          console.log("Cleaning up storage");
        } catch (error) {
          console.error("Failed to cleanup storage:", error);
        }
      },

      clearMediaData: () => {
        set({
          mediaItems: [],
          collections: [],
          selectedItems: [],
          editingItem: null,
          editHistory: [],
          processingQueue: [],
          uploadQueue: [],
          offlineItems: [],
          syncStatus: "idle",
          error: null,
          totalPhotos: 0,
          totalVideos: 0,
          totalStorage: 0,
          storageUsed: 0,
        });
      },
    }),
    {
      name: "media-store",
      partialize: (state) => ({
        mediaItems: state.mediaItems,
        collections: state.collections,
        cameraSettings: state.cameraSettings,
        processingSettings: state.processingSettings,
        viewMode: state.viewMode,
        currentFilter: state.currentFilter,
        storageUsed: state.storageUsed,
        offlineItems: state.offlineItems,
      }),
    }
  )
);
