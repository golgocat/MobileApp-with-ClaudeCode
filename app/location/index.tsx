import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, GRADIENTS } from "../../constants/theme";
import { SavedLocation } from "../../types/location.types";
import { locationStorage } from "../../services/locationStorage";
import { locationService, PlacePrediction } from "../../services/locationService";

export default function LocationPickerScreen() {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locations = await locationStorage.getLocations();
      setSavedLocations(locations);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await locationService.searchPlaces(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelectSearchResult = async (prediction: PlacePrediction) => {
    setAddingLocation(true);
    try {
      await locationService.addPlaceToSaved(prediction.placeId);
      await loadLocations();
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding location:", error);
      Alert.alert("Error", "Failed to add location. Please try again.");
    } finally {
      setAddingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setAddingLocation(true);
    try {
      await locationService.addCurrentLocationToSaved();
      await loadLocations();
    } catch (error: any) {
      console.error("Error getting current location:", error);
      Alert.alert(
        "Error",
        error.message === "Location permission denied"
          ? "Please enable location permissions in your device settings."
          : "Failed to get current location. Please try again."
      );
    } finally {
      setAddingLocation(false);
    }
  };

  const handleSelectLocation = (location: SavedLocation) => {
    router.back();
    // The parent screen should listen for this via params or context
    router.setParams({ selectedLocationId: location.id });
  };

  const handlePinLocation = async (location: SavedLocation) => {
    try {
      await locationStorage.setPinnedLocation(location.id);
      await loadLocations();
    } catch (error) {
      console.error("Error pinning location:", error);
    }
  };

  const handleDeleteLocation = (location: SavedLocation) => {
    if (location.isPreset) {
      Alert.alert("Cannot Delete", "Preset locations cannot be removed.");
      return;
    }

    Alert.alert(
      "Delete Location",
      `Remove ${location.displayName} from saved locations?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await locationStorage.removeLocation(location.id);
              await loadLocations();
            } catch (error) {
              console.error("Error deleting location:", error);
            }
          },
        },
      ]
    );
  };

  const presetLocations = savedLocations.filter((l) => l.isPreset);
  const customLocations = savedLocations.filter((l) => !l.isPreset);

  if (loading) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.textSecondary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a city..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCorrect={false}
              />
              {searching && (
                <ActivityIndicator size="small" color={COLORS.textMuted} />
              )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((result) => (
                  <Pressable
                    key={result.placeId}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(result)}
                    disabled={addingLocation}
                  >
                    <Text style={styles.searchResultMain}>
                      {result.mainText}
                    </Text>
                    <Text style={styles.searchResultSecondary}>
                      {result.secondaryText}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Current Location Button */}
          <Pressable
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
            disabled={addingLocation}
          >
            <Text style={styles.currentLocationIcon}>📍</Text>
            <Text style={styles.currentLocationText}>Use Current Location</Text>
            {addingLocation && (
              <ActivityIndicator size="small" color={COLORS.accentBlue} />
            )}
          </Pressable>

          {/* Custom Locations */}
          {customLocations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Locations</Text>
              {customLocations.map((location) => (
                <LocationItem
                  key={location.id}
                  location={location}
                  onSelect={() => handleSelectLocation(location)}
                  onPin={() => handlePinLocation(location)}
                  onDelete={() => handleDeleteLocation(location)}
                />
              ))}
            </View>
          )}

          {/* Preset Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            {presetLocations.map((location) => (
              <LocationItem
                key={location.id}
                location={location}
                onSelect={() => handleSelectLocation(location)}
                onPin={() => handlePinLocation(location)}
                onDelete={() => handleDeleteLocation(location)}
              />
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function LocationItem({
  location,
  onSelect,
  onPin,
  onDelete,
}: {
  location: SavedLocation;
  onSelect: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable style={styles.locationItem} onPress={onSelect}>
      <View style={styles.locationInfo}>
        <View style={styles.locationNameRow}>
          <Text style={styles.locationName}>{location.displayName}</Text>
          {location.isPinned && <Text style={styles.pinnedBadge}>📌</Text>}
        </View>
        <Text style={styles.locationCountry}>{location.countryCode}</Text>
      </View>
      <View style={styles.locationActions}>
        {!location.isPinned && (
          <Pressable style={styles.actionButton} onPress={onPin}>
            <Text style={styles.actionButtonText}>Pin</Text>
          </Pressable>
        )}
        {!location.isPreset && (
          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  searchResults: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  searchResultMain: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  searchResultSecondary: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  currentLocationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  currentLocationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.accentBlue,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  pinnedBadge: {
    fontSize: 14,
    marginLeft: 8,
  },
  locationCountry: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  locationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(74, 144, 217, 0.1)",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.accentBlue,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  bottomPadding: {
    height: 40,
  },
});
