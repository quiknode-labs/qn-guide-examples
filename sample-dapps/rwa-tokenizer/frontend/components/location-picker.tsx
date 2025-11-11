'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { NFTLocation } from '@/lib/ipfs'

interface LocationPickerProps {
  onLocationSelect: (location: NFTLocation | null) => void
  initialLocation?: NFTLocation
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [location, setLocation] = useState<NFTLocation | null>(initialLocation || null)
  const [isLoadingMaps, setIsLoadingMaps] = useState(false)
  const [isLoadingGeolocation, setIsLoadingGeolocation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<unknown>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load Google Maps API
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key not configured')
      return
    }

    if (!searchInputRef.current) return

    const loadGoogleMaps = async () => {
      try {
        setIsLoadingMaps(true)

        // Load the Google Maps API script
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any).google) {
          const callbackName = 'initGoogleMaps_' + Date.now()

          await new Promise<void>((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(window as any)[callbackName] = () => {
              resolve()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              delete (window as any)[callbackName]
            }

            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`
            script.async = true
            script.defer = true
            script.onerror = () => reject(new Error('Failed to load Google Maps'))
            document.head.appendChild(script)
          })
        }

        // Wait for google.maps.places to be available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any).google?.maps?.places) {
          throw new Error('Google Maps Places library not loaded')
        }

        // Initialize Autocomplete using the legacy API (which works reliably)
        if (searchInputRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['formatted_address', 'geometry', 'place_id', 'name'],
          })

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(autocompleteRef.current as any).addListener('place_changed', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const place = (autocompleteRef.current as any)?.getPlace()

            if (place?.geometry?.location && place.formatted_address) {
              const newLocation: NFTLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                formatted_address: place.formatted_address,
                place_id: place.place_id,
              }
              setLocation(newLocation)
              onLocationSelect(newLocation)
              setError(null)
            }
          })
        }

        setIsLoadingMaps(false)
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load Google Maps')
        setIsLoadingMaps(false)
      }
    }

    loadGoogleMaps()
  }, [apiKey, onLocationSelect])

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsLoadingGeolocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Wait for Google Maps to be loaded
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(window as any).google?.maps) {
            throw new Error('Google Maps not loaded')
          }

          // Reverse geocode to get address
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const geocoder = new (window as any).google.maps.Geocoder()
          const response = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          })

          if (response.results[0]) {
            const newLocation: NFTLocation = {
              lat: latitude,
              lng: longitude,
              formatted_address: response.results[0].formatted_address,
              place_id: response.results[0].place_id,
            }
            setLocation(newLocation)
            onLocationSelect(newLocation)

            // Update the search input with the address
            if (searchInputRef.current) {
              searchInputRef.current.value = response.results[0].formatted_address
            }
          }
        } catch (err) {
          console.error('Error reverse geocoding:', err)
          setError('Failed to get address for current location')
        } finally {
          setIsLoadingGeolocation(false)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Failed to get your location. Please check browser permissions.')
        setIsLoadingGeolocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleClear = () => {
    setLocation(null)
    onLocationSelect(null)
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
    setError(null)
  }

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-600">
        <p className="font-medium">Google Maps API key not configured</p>
        <p className="text-xs mt-1">
          To use location features, add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location-search">Location (Optional)</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="location-search"
              ref={searchInputRef}
              placeholder="Search for a location..."
              defaultValue={initialLocation?.formatted_address}
              disabled={isLoadingMaps}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={isLoadingMaps || isLoadingGeolocation}
          >
            {isLoadingGeolocation ? 'Getting...' : 'Current Location'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Search for an address or use your current location
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {location && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">Selected Location</p>
              <p className="text-sm text-muted-foreground">{location.formatted_address}</p>
              <p className="text-xs text-muted-foreground">
                Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>

          {/* Small preview map */}
          <div className="mt-3 rounded-lg overflow-hidden border">
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=14&size=400x200&markers=color:red%7C${location.lat},${location.lng}&key=${apiKey}`}
              alt="Location preview"
              className="w-full h-32 object-cover"
            />
          </div>
        </Card>
      )}
    </div>
  )
}
