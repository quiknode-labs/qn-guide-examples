'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { uploadImageToIPFS, uploadMetadataToIPFS, NFTAttribute, NFTMetadata, NFTLocation } from '@/lib/ipfs'
import { getContractAddress } from '@/config/addresses'
import { RWA721_ABI } from '@/lib/abi/rwa721'
import { Navigation } from '@/components/navigation'
import { LocationPicker } from '@/components/location-picker'
import { OutrunBackground } from '@/components/outrun-background'
import { toast } from 'sonner'
import Link from 'next/link'

export default function MintPage() {
  const { address, chainId, isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [attributes, setAttributes] = useState<NFTAttribute[]>([])
  const [newAttrType, setNewAttrType] = useState('')
  const [newAttrValue, setNewAttrValue] = useState('')
  const [location, setLocation] = useState<NFTLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Helper to get block explorer URL
  const getBlockExplorerUrl = (txHash: string, chainId: number) => {
    if (chainId === 84532) {
      return `https://sepolia.basescan.org/tx/${txHash}`
    } else if (chainId === 11155111) {
      return `https://sepolia.etherscan.io/tx/${txHash}`
    }
    return ''
  }

  // Handle transaction state changes with toasts
  useEffect(() => {
    if (hash && chainId) {
      const explorerUrl = getBlockExplorerUrl(hash, chainId)
      toast.success('Transaction Sent!', {
        description: (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            View on Explorer →
          </a>
        ),
        duration: 5000,
      })
    }
  }, [hash, chainId])

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('NFT Minted Successfully!', {
        description: (
          <div className="flex flex-col gap-2">
            <span>Your RWA token has been minted!</span>
            <Link href="/assets" className="underline hover:text-primary">
              View in My Assets →
            </Link>
          </div>
        ),
        duration: 10000,
      })
      // Clear form after successful mint
      resetForm()
    }
  }, [isSuccess, hash])

  // Standard RWA attributes
  const [category, setCategory] = useState('') // RealEstate, Art, Vehicle, Commodity
  const [externalUrl, setExternalUrl] = useState('')
  const [valuation, setValuation] = useState('')
  const [issuanceDate, setIssuanceDate] = useState(() => {
    // Auto-fill with today's date in YYYY-MM-DD format
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Category-specific attributes - Real Estate
  const [squareFootage, setSquareFootage] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')

  // Category-specific attributes - Art
  const [artist, setArtist] = useState('')
  const [medium, setMedium] = useState('')
  const [yearCreated, setYearCreated] = useState('')
  const [style, setStyle] = useState('')
  const [dimensions, setDimensions] = useState('')

  // Category-specific attributes - Vehicle
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')
  const [mileage, setMileage] = useState('')

  // Category-specific attributes - Commodity
  const [weight, setWeight] = useState('')
  const [purity, setPurity] = useState('')
  const [origin, setOrigin] = useState('')
  const [certification, setCertification] = useState('')

  // Category-specific attributes - Collectibles
  const [condition, setCondition] = useState('')
  const [grader, setGrader] = useState('')
  const [collectibleCategory, setCollectibleCategory] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addAttribute = () => {
    if (newAttrType && newAttrValue) {
      setAttributes([...attributes, { trait_type: newAttrType, value: newAttrValue }])
      setNewAttrType('')
      setNewAttrValue('')
    }
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleMint = async () => {
    console.log('[Mint] Starting mint process...')

    if (!isConnected || !chainId || !address) {
      console.error('[Mint] Wallet not connected')
      setError('Please connect your wallet')
      return
    }

    if (!name || !description || !imageFile || !category || !issuanceDate) {
      console.error('[Mint] Missing required fields')
      setError('Please fill in all required fields (name, description, image, category, and issuance date)')
      return
    }

    console.log('[Mint] Minting on chain:', chainId)
    console.log('[Mint] NFT details:', { name, description, attributesCount: attributes.length })

    try {
      setIsUploading(true)
      setError(null)

      console.log('[Mint] Uploading image to IPFS...', { fileName: imageFile.name, fileSize: imageFile.size })
      const imageUri = await uploadImageToIPFS(imageFile)
      console.log('[Mint] Image uploaded successfully:', imageUri)

      // Build standard attributes
      const standardAttributes: NFTAttribute[] = []

      standardAttributes.push({ trait_type: 'Asset Type', value: category })

      if (valuation) {
        standardAttributes.push({ trait_type: 'Valuation (USD)', value: valuation })
      }

      standardAttributes.push({ trait_type: 'Issuance Date', value: issuanceDate })

      // Extract country from location if available
      if (location?.formatted_address) {
        // Try to extract country from formatted address (usually last part after last comma)
        const addressParts = location.formatted_address.split(',').map(p => p.trim())
        const country = addressParts[addressParts.length - 1]
        standardAttributes.push({ trait_type: 'Country', value: country })
      }

      standardAttributes.push({
        trait_type: 'Bridge Origin Chain',
        value: chainId === 84532 ? 'Base' : 'Ethereum'
      })
      standardAttributes.push({ trait_type: 'Token Standard', value: 'ERC-721 (ONFT)' })

      // Build category-specific attributes
      const categoryAttributes: NFTAttribute[] = []

      if (category === 'RealEstate') {
        if (squareFootage) categoryAttributes.push({ trait_type: 'Square Footage', value: squareFootage })
        if (propertyType) categoryAttributes.push({ trait_type: 'Property Type', value: propertyType })
        if (bedrooms) categoryAttributes.push({ trait_type: 'Bedrooms', value: bedrooms })
        if (bathrooms) categoryAttributes.push({ trait_type: 'Bathrooms', value: bathrooms })
        if (yearBuilt) categoryAttributes.push({ trait_type: 'Year Built', value: yearBuilt })
      } else if (category === 'Art') {
        if (artist) categoryAttributes.push({ trait_type: 'Artist', value: artist })
        if (medium) categoryAttributes.push({ trait_type: 'Medium', value: medium })
        if (yearCreated) categoryAttributes.push({ trait_type: 'Year Created', value: yearCreated })
        if (style) categoryAttributes.push({ trait_type: 'Style', value: style })
        if (dimensions) categoryAttributes.push({ trait_type: 'Dimensions', value: dimensions })
      } else if (category === 'Vehicle') {
        if (make) categoryAttributes.push({ trait_type: 'Make', value: make })
        if (model) categoryAttributes.push({ trait_type: 'Model', value: model })
        if (year) categoryAttributes.push({ trait_type: 'Year', value: year })
        if (vin) categoryAttributes.push({ trait_type: 'VIN', value: vin })
        if (mileage) categoryAttributes.push({ trait_type: 'Mileage', value: mileage })
      } else if (category === 'Commodity') {
        if (weight) categoryAttributes.push({ trait_type: 'Weight', value: weight })
        if (purity) categoryAttributes.push({ trait_type: 'Purity', value: purity })
        if (origin) categoryAttributes.push({ trait_type: 'Origin', value: origin })
        if (certification) categoryAttributes.push({ trait_type: 'Certification', value: certification })
      } else if (category === 'Collectibles') {
        if (condition) categoryAttributes.push({ trait_type: 'Condition', value: condition })
        if (grader) categoryAttributes.push({ trait_type: 'Grader', value: grader })
        if (collectibleCategory) categoryAttributes.push({ trait_type: 'Collectible Type', value: collectibleCategory })
      }

      const metadata: NFTMetadata = {
        name,
        description,
        image: imageUri,
        attributes: [...attributes, ...standardAttributes, ...categoryAttributes], // Combine custom, standard, and category-specific attributes
        ...(location && { location }), // Only include location if it exists
        ...(externalUrl && { external_url: externalUrl }), // Only include external_url if provided
      }
      console.log('[Mint] Metadata prepared:', metadata)

      console.log('[Mint] Uploading metadata to IPFS...')
      const metadataUri = await uploadMetadataToIPFS(metadata)
      console.log('[Mint] Metadata uploaded successfully:', metadataUri)

      setIsUploading(false)

      const contractAddress = getContractAddress(chainId, 'rwa721')
      console.log('[Mint] Contract address:', contractAddress)
      console.log('[Mint] Calling mint function with args:', [address, metadataUri])

      writeContract({
        address: contractAddress,
        abi: RWA721_ABI,
        functionName: 'mint',
        args: [address, metadataUri],
      })

      console.log('[Mint] Transaction submitted')
    } catch (err) {
      console.error('[Mint] Error during mint process:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint NFT')
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setImageFile(null)
    setImagePreview(null)
    setAttributes([])
    setLocation(null)
    setError(null)

    // Reset standard RWA attributes
    setCategory('')
    setExternalUrl('')
    setValuation('')
    // Reset to today's date
    const today = new Date()
    setIssuanceDate(today.toISOString().split('T')[0])

    // Reset category-specific attributes
    setSquareFootage('')
    setPropertyType('')
    setBedrooms('')
    setBathrooms('')
    setYearBuilt('')
    setArtist('')
    setMedium('')
    setYearCreated('')
    setStyle('')
    setDimensions('')
    setMake('')
    setModel('')
    setYear('')
    setVin('')
    setMileage('')
    setWeight('')
    setPurity('')
    setOrigin('')
    setCertification('')
    setCondition('')
    setGrader('')
    setCollectibleCategory('')
  }

  return (
    <>
      <OutrunBackground />
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="text-3xl glow-text-pink" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Mint RWA Token
              </CardTitle>
              <CardDescription className="text-base">
                Create a new tokenized real world asset on {chainId === 84532 ? 'Base Sepolia' : 'Ethereum Sepolia'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected && (
                <div className="p-4 border rounded-lg bg-muted text-center">
                  Please connect your wallet to mint an NFT
                </div>
              )}

              {error && (
                <div className="p-4 border border-red-500 rounded-lg bg-red-500/10 text-red-500">
                  {error}
                </div>
              )}

              {/* 2-column grid for desktop, single column for mobile */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Gold Bar Certificate"
                      disabled={isPending || isConfirming || isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Certified 1kg gold bar stored in secure vault..."
                      rows={4}
                      disabled={isPending || isConfirming || isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Asset Category *</Label>
                    <Select value={category} onValueChange={setCategory} disabled={isPending || isConfirming || isUploading}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select asset category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RealEstate">Real Estate</SelectItem>
                        <SelectItem value="Art">Art</SelectItem>
                        <SelectItem value="Vehicle">Vehicle</SelectItem>
                        <SelectItem value="Commodity">Commodity</SelectItem>
                        <SelectItem value="Collectibles">Collectibles</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valuation">Valuation (USD, Optional)</Label>
                    <Input
                      id="valuation"
                      type="number"
                      value={valuation}
                      onChange={(e) => setValuation(e.target.value)}
                      placeholder="500000"
                      disabled={isPending || isConfirming || isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuance-date">Issuance Date *</Label>
                    <Input
                      id="issuance-date"
                      type="date"
                      value={issuanceDate}
                      onChange={(e) => setIssuanceDate(e.target.value)}
                      disabled={isPending || isConfirming || isUploading}
                    />
                  </div>
                </div>

                {/* Right Column - Image & Location */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image">Image *</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isPending || isConfirming || isUploading}
                    />
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full rounded-lg border glow-purple"
                        />
                      </div>
                    )}
                  </div>

                  <LocationPicker
                    onLocationSelect={setLocation}
                    initialLocation={location || undefined}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="external-url">External URL (Optional)</Label>
                    <Input
                      id="external-url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://example.com/asset-details"
                      disabled={isPending || isConfirming || isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Category-specific attributes */}
              {category === 'RealEstate' && (
                <div className="space-y-4 border-t pt-6">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Real Estate Attributes</h3>
                    <p className="text-sm text-muted-foreground">Optional property-specific details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="square-footage">Square Footage</Label>
                      <Input
                        id="square-footage"
                        type="number"
                        value={squareFootage}
                        onChange={(e) => setSquareFootage(e.target.value)}
                        placeholder="2000"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property-type">Property Type</Label>
                      <Input
                        id="property-type"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        placeholder="Residential, Commercial"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        placeholder="3"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        placeholder="2"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year-built">Year Built</Label>
                      <Input
                        id="year-built"
                        type="number"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value)}
                        placeholder="2020"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'Art' && (
                <div className="space-y-4 border-t pt-6">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Art Attributes</h3>
                    <p className="text-sm text-muted-foreground">Optional artwork-specific details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artist">Artist</Label>
                      <Input
                        id="artist"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Artist Name"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medium">Medium</Label>
                      <Input
                        id="medium"
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                        placeholder="Oil on Canvas"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year-created">Year Created</Label>
                      <Input
                        id="year-created"
                        type="number"
                        value={yearCreated}
                        onChange={(e) => setYearCreated(e.target.value)}
                        placeholder="2023"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style">Style</Label>
                      <Input
                        id="style"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder="Abstract, Realism"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="24 x 36 inches"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'Vehicle' && (
                <div className="space-y-4 border-t pt-6">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Vehicle Attributes</h3>
                    <p className="text-sm text-muted-foreground">Optional vehicle-specific details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="make">Make</Label>
                      <Input
                        id="make"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Tesla"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Model 3"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="2023"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN</Label>
                      <Input
                        id="vin"
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                        placeholder="1HGBH41JXMN109186"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        placeholder="15000"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'Commodity' && (
                <div className="space-y-4 border-t pt-6">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Commodity Attributes</h3>
                    <p className="text-sm text-muted-foreground">Optional commodity-specific details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="1kg"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purity">Purity</Label>
                      <Input
                        id="purity"
                        value={purity}
                        onChange={(e) => setPurity(e.target.value)}
                        placeholder="99.9%"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin</Label>
                      <Input
                        id="origin"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Country or Region"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certification">Certification</Label>
                      <Input
                        id="certification"
                        value={certification}
                        onChange={(e) => setCertification(e.target.value)}
                        placeholder="Certification Number"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'Collectibles' && (
                <div className="space-y-4 border-t pt-6">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Collectibles Attributes</h3>
                    <p className="text-sm text-muted-foreground">Optional collectible-specific details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Input
                        id="condition"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        placeholder="Mint, Near Mint, Excellent"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grader">Grader (Optional)</Label>
                      <Input
                        id="grader"
                        value={grader}
                        onChange={(e) => setGrader(e.target.value)}
                        placeholder="PSA, BGS, CGC"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collectible-category">Collectible Type (Optional)</Label>
                      <Input
                        id="collectible-category"
                        value={collectibleCategory}
                        onChange={(e) => setCollectibleCategory(e.target.value)}
                        placeholder="Basketball, Pokemon, Toy"
                        disabled={isPending || isConfirming || isUploading}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t pt-6">
                <Label>Custom Attributes</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Trait type (e.g., Weight)"
                    value={newAttrType}
                    onChange={(e) => setNewAttrType(e.target.value)}
                    disabled={isPending || isConfirming || isUploading}
                  />
                  <Input
                    placeholder="Value (e.g., 1kg)"
                    value={newAttrValue}
                    onChange={(e) => setNewAttrValue(e.target.value)}
                    disabled={isPending || isConfirming || isUploading}
                  />
                  <Button
                    onClick={addAttribute}
                    type="button"
                    variant="outline"
                    disabled={isPending || isConfirming || isUploading}
                  >
                    Add
                  </Button>
                </div>

                {attributes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {attributes.map((attr, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {attr.trait_type}: {attr.value}
                        <button
                          onClick={() => removeAttribute(index)}
                          className="ml-2 hover:text-red-500"
                          disabled={isPending || isConfirming || isUploading}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleMint}
                disabled={!isConnected || isPending || isConfirming || isUploading || !name || !description || !imageFile || !category || !issuanceDate}
                className="w-full"
                size="lg"
              >
                {isUploading
                  ? 'Uploading to IPFS...'
                  : isPending
                  ? 'Confirming...'
                  : isConfirming
                  ? 'Minting...'
                  : 'Mint RWA Token'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
