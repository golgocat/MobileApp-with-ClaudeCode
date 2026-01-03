import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedLocation } from "../types/location.types";
import { DESTINATIONS } from "../constants/destinations";

const STORAGE_KEY = "saved_locations";
const PINNED_KEY = "pinned_location_id";

// Convert preset destinations to SavedLocation format
function getPresetLocations(): SavedLocation[] {
  return DESTINATIONS.map((dest) => ({
    id: dest.id,
    displayName: dest.displayName,
    countryCode: dest.countryCode,
    timezone: dest.timezone,
    accuweatherLocationKey: dest.accuweatherLocationKey,
    lat: dest.lat,
    lon: dest.lon,
    isPinned: dest.id === "dubai", // Default pinned location
    isPreset: true,
    addedAt: 0,
  }));
}

class LocationStorageService {
  private cachedLocations: SavedLocation[] | null = null;
  private cachedPinnedId: string | null = null;

  async getLocations(): Promise<SavedLocation[]> {
    if (this.cachedLocations) {
      return this.cachedLocations;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.cachedLocations = JSON.parse(stored);
        return this.cachedLocations!;
      }
    } catch (error) {
      console.error("Error reading locations:", error);
    }

    // Initialize with preset locations
    const presets = getPresetLocations();
    await this.saveLocations(presets);
    return presets;
  }

  private async saveLocations(locations: SavedLocation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
      this.cachedLocations = locations;
    } catch (error) {
      console.error("Error saving locations:", error);
      throw error;
    }
  }

  async addLocation(location: Omit<SavedLocation, "id" | "isPreset" | "isPinned" | "addedAt">): Promise<SavedLocation> {
    const locations = await this.getLocations();

    // Check if location already exists (by accuweather key)
    const existing = locations.find(
      (l) => l.accuweatherLocationKey === location.accuweatherLocationKey
    );
    if (existing) {
      return existing;
    }

    const newLocation: SavedLocation = {
      ...location,
      id: `custom_${Date.now()}`,
      isPreset: false,
      isPinned: false,
      addedAt: Date.now(),
    };

    locations.push(newLocation);
    await this.saveLocations(locations);
    return newLocation;
  }

  async removeLocation(id: string): Promise<void> {
    const locations = await this.getLocations();
    const location = locations.find((l) => l.id === id);

    if (location?.isPreset) {
      throw new Error("Cannot remove preset locations");
    }

    const filtered = locations.filter((l) => l.id !== id);

    // If removed location was pinned, pin the first preset
    if (location?.isPinned && filtered.length > 0) {
      const firstPreset = filtered.find((l) => l.isPreset) || filtered[0];
      firstPreset.isPinned = true;
    }

    await this.saveLocations(filtered);
  }

  async setPinnedLocation(id: string): Promise<void> {
    // Clear cache to ensure fresh data
    this.cachedLocations = null;
    const locations = await this.getLocations();

    // Unpin all, then pin the selected one
    const updated = locations.map((l) => ({
      ...l,
      isPinned: l.id === id,
    }));

    console.log("Setting pinned location:", id);
    console.log("Updated locations:", updated.map(l => ({ id: l.id, name: l.displayName, isPinned: l.isPinned })));

    await this.saveLocations(updated);
  }

  async getPinnedLocation(): Promise<SavedLocation | null> {
    // Clear cache to get fresh data (important when returning from location picker)
    this.cachedLocations = null;
    const locations = await this.getLocations();
    const pinned = locations.find((l) => l.isPinned) || locations[0] || null;
    console.log("Getting pinned location:", pinned?.displayName, pinned?.id);
    return pinned;
  }

  async getLocationById(id: string): Promise<SavedLocation | null> {
    const locations = await this.getLocations();
    return locations.find((l) => l.id === id) || null;
  }

  async getPresetLocations(): Promise<SavedLocation[]> {
    const locations = await this.getLocations();
    return locations.filter((l) => l.isPreset);
  }

  async getCustomLocations(): Promise<SavedLocation[]> {
    const locations = await this.getLocations();
    return locations.filter((l) => !l.isPreset);
  }

  // Clear cache (useful when debugging)
  clearCache(): void {
    this.cachedLocations = null;
    this.cachedPinnedId = null;
  }

  // Reset to defaults (for debugging/testing)
  async resetToDefaults(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    this.clearCache();
  }
}

export const locationStorage = new LocationStorageService();
