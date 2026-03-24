import { useState, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { X, ArrowLeft, Car, Trash2, Check } from 'lucide-react'
import {
  vehicleStore,
  closeVehicleModal,
  setSelectionStep,
  addVehicle,
  setSelectedVehicleById,
  removeVehicle,
  type Vehicle,
} from '@/store/vehicle'
import {
  VEHICLE_YEARS,
  getMakesForYear,
  getModelsForMake,
  getEnginesForVariant,
} from '@/data/vehicles'

/**
 * Vehicle list screen - shows all loaded vehicles
 */
function VehicleListScreen() {
  const vehicle = useSnapshot(vehicleStore)

  return (
    <div className="p-6 space-y-4">
      <p className="text-gray-700 mb-4">
        Select a vehicle to find <strong>Exact Fit Parts</strong>
      </p>

      {/* Vehicle Cards */}
      <div className="space-y-3">
        {vehicle.vehicles.map((v, index) => {
          const isSelected = vehicle.selectedVehicleId === index
          
          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Car Icon */}
                <Car className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                
                {/* Vehicle Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base mb-1">
                    {v.year} {v.make} {v.model}
                  </div>
                  <div className="text-sm text-gray-600">
                    {v.engine}
                    {v.vin && ` VIN: ${v.vin}`}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeVehicle(index)
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  aria-label="Remove vehicle"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Vehicle Button - shown when vehicle is selected */}
              {isSelected ? (
                <button
                  onClick={() => {
                    setSelectedVehicleById(index, true) // Mark as programmatic selection
                    closeVehicleModal()
                  }}
                  className="w-full mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Selected Vehicle
                </button>
              ) : (
                /* Select Vehicle Button - shown when vehicle is not selected */
                <button
                  onClick={() => {
                    setSelectedVehicleById(index, true) // Mark as programmatic selection
                    closeVehicleModal()
                  }}
                  className="w-full mt-4 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Select Vehicle
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add New Vehicle Button */}
      <button
        onClick={() => setSelectionStep('method')}
        className="w-full mt-4 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
      >
        ADD NEW VEHICLE
      </button>
    </div>
  )
}

/**
 * Method selection screen - first step of vehicle selection
 */
function MethodSelectionScreen() {
  return (
    <div className="p-6 space-y-4">
      <p className="text-gray-700 mb-6">
        To add a new vehicle you can use the following options:
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => setSelectionStep('year-make-model')}
          className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left font-medium text-gray-900"
        >
          Year / Make / Model
        </button>
        
        <button
          onClick={() => setSelectionStep('license-plate')}
          className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left font-medium text-gray-900"
        >
          License Plate
        </button>
        
        <button
          onClick={() => setSelectionStep('vin')}
          className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left font-medium text-gray-900"
        >
          Enter VIN
        </button>
      </div>
    </div>
  )
}

/**
 * Year/Make/Model selection screen with dropdowns
 */
function YearMakeModelScreen() {
  const [vehicleType, setVehicleType] = useState<Vehicle['type']>('Car/Truck')
  const [year, setYear] = useState<string>('')
  const [make, setMake] = useState<string>('')
  const [modelWithVariant, setModelWithVariant] = useState<string>('')
  const [engine, setEngine] = useState<string>('')

  // Parse model and variant from combined selection (format: "Model|Variant")
  const [selectedModel, selectedVariant] = modelWithVariant.split('|')

  // Get filtered options based on selections
  const makes = year ? getMakesForYear(year) : []
  const models = year && make ? getModelsForMake(year, make) : []
  
  // Create combined model+variant options
  const modelOptions: Array<{ value: string; label: string; model: string; variant: string }> = []
  if (models.length > 0) {
    models.forEach((model) => {
      model.variants.forEach((variant) => {
        modelOptions.push({
          value: `${model.name}|${variant.name}`,
          label: variant.name !== 'Base' ? `${model.name} ${variant.name}` : model.name,
          model: model.name,
          variant: variant.name,
        })
      })
    })
  }

  // Get engines for selected model and variant
  const engines = year && make && selectedModel && selectedVariant
    ? getEnginesForVariant(year, make, selectedModel, selectedVariant)
    : []

  // Reset dependent fields when parent field changes
  const handleYearChange = (newYear: string) => {
    setYear(newYear)
    setMake('')
    setModelWithVariant('')
    setEngine('')
  }

  const handleMakeChange = (newMake: string) => {
    setMake(newMake)
    setModelWithVariant('')
    setEngine('')
  }

  const handleModelChange = (newModelWithVariant: string) => {
    setModelWithVariant(newModelWithVariant)
    setEngine('')
  }

  const handleAdd = () => {
    if (year && make && selectedModel && selectedVariant && engine) {
      const vehicle: Vehicle = {
        type: vehicleType,
        year,
        make,
        model: selectedVariant !== 'Base' ? `${selectedModel} ${selectedVariant}` : selectedModel,
        engine,
      }
      addVehicle(vehicle, true) // Mark as programmatic (from form submission)
    }
  }

  const canAdd = year && make && selectedModel && selectedVariant && engine

  return (
    <div className="p-6 space-y-4">
      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What type of vehicle?
        </label>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value as Vehicle['type'])}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
        >
          <option value="Car/Truck">Car/Truck</option>
          <option value="Motorcycle">Motorcycle</option>
          <option value="ATV/UTV">ATV/UTV</option>
          <option value="RV">RV</option>
          <option value="Boat">Boat</option>
        </select>
      </div>

      {/* Year */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className="w-full px-4 py-2 border-2 border-yellow-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
        >
          <option value="">Select Year</option>
          {VEHICLE_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Make */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Make
        </label>
        <select
          value={make}
          onChange={(e) => handleMakeChange(e.target.value)}
          disabled={!year}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Make</option>
          {makes.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model (includes variant) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          value={modelWithVariant}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={!make}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Model</option>
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Engine */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Engine
        </label>
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          disabled={!modelWithVariant || engines.length === 0}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Engine</option>
          {engines.map((e) => (
            <option key={e.code} value={e.name}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  )
}

/**
 * License Plate input screen
 */
function LicensePlateScreen() {
  const [plate, setPlate] = useState<string>('')
  const [state, setState] = useState<string>('')

  const handleAdd = () => {
    if (plate && state) {
      // In a real app, you would look up the vehicle by license plate
      // For now, we'll just show a placeholder
      alert('License plate lookup not implemented. Please use Year/Make/Model.')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          License Plate Number
        </label>
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="ABC1234"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State
        </label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
        >
          <option value="">Select State</option>
          <option value="FL">Florida</option>
          <option value="CA">California</option>
          <option value="TX">Texas</option>
          <option value="NY">New York</option>
        </select>
      </div>
      <button
        onClick={handleAdd}
        disabled={!plate || !state}
        className="w-full mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  )
}

/**
 * VIN input screen
 */
function VINScreen() {
  const [vin, setVin] = useState<string>('')

  const handleAdd = () => {
    if (vin.length === 17) {
      // In a real app, you would decode the VIN to get vehicle details
      // For now, we'll just show a placeholder
      alert('VIN lookup not implemented. Please use Year/Make/Model.')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Identification Number (VIN)
        </label>
        <input
          type="text"
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          placeholder="Enter 17-character VIN"
          maxLength={17}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your 17-character VIN
        </p>
      </div>
      <button
        onClick={handleAdd}
        disabled={vin.length !== 17}
        className="w-full mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  )
}

/**
 * Vehicle selector modal component
 * Allows users to select a vehicle using various methods
 * Positioned as a dropdown attached to the vehicle button
 */
export function VehicleSelectorModal({ buttonRef }: { buttonRef: React.RefObject<HTMLButtonElement | null> }) {
  const vehicle = useSnapshot(vehicleStore)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    const updatePosition = () => {
      if (vehicle.modalOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const modalWidth = Math.max(rect.width, 400) // Minimum width of 400px
        const maxWidth = window.innerWidth - 16 // Account for padding
        const actualWidth = Math.min(modalWidth, maxWidth)
        
        // Calculate left position to prevent overflow
        let left = rect.left
        if (left + actualWidth > window.innerWidth - 8) {
          left = window.innerWidth - actualWidth - 8 // Align to right edge with padding
        }
        if (left < 8) {
          left = 8 // Ensure minimum padding from left edge
        }

        setPosition({
          top: rect.bottom + 8, // 8px gap below button
          left,
          width: actualWidth,
        })
      }
    }

    updatePosition()
    
    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [vehicle.modalOpen, buttonRef])

  if (!vehicle.modalOpen) return null

  const getTitle = () => {
    switch (vehicle.selectionStep) {
      case 'list':
        return 'Search Parts for:'
      case 'year-make-model':
        return 'Enter a Vehicle'
      case 'license-plate':
        return 'Enter License Plate'
      case 'vin':
        return 'Enter VIN'
      case 'method':
        return 'Add a Vehicle'
      default:
        return 'Search Parts for:'
    }
  }

  const showBackButton = vehicle.selectionStep !== 'method' && vehicle.selectionStep !== 'list'
  
  // Show vehicle list when step is 'list'
  const showVehicleList = vehicle.selectionStep === 'list'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeVehicleModal}
      />

      {/* Modal - positioned below button */}
      <div
        className="fixed bg-white rounded-lg shadow-2xl z-50 max-h-[calc(100vh-200px)] overflow-hidden flex flex-col"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxWidth: 'calc(100vw - 16px)', // Ensure it doesn't overflow viewport
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {showBackButton && (
            <button
              onClick={() => {
                // If we have vehicles, go back to list, otherwise go to method selection
                if (vehicle.vehicles.length > 0) {
                  // Reset to show vehicle list
                  setSelectionStep('list')
                } else {
                  setSelectionStep('method')
                }
              }}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="flex-1 text-center text-lg font-bold text-gray-900">
            {getTitle()}
          </h2>
          <button
            onClick={closeVehicleModal}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showVehicleList && <VehicleListScreen />}
          {!showVehicleList && vehicle.selectionStep === 'method' && <MethodSelectionScreen />}
          {vehicle.selectionStep === 'year-make-model' && <YearMakeModelScreen />}
          {vehicle.selectionStep === 'license-plate' && <LicensePlateScreen />}
          {vehicle.selectionStep === 'vin' && <VINScreen />}
        </div>
      </div>
    </>
  )
}
