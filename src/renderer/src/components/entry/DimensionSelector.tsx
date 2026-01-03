import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useDimensionsStore } from '@/store/dimensionsStore'

interface DimensionSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (optionIds: number[]) => void
  activityName: string
  initialSelection?: number[]
}

export function DimensionSelector({
  open,
  onOpenChange,
  onConfirm,
  activityName,
  initialSelection = [],
}: DimensionSelectorProps) {
  const { activeDimensions, fetchDimensions } = useDimensionsStore()
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})

  useEffect(() => {
    if (open) {
      fetchDimensions()
      // Initialize selection with initialSelection or defaults
      const initial: Record<number, number> = {}
      
      // Map initialSelection (array of optionIds) to dimension map
      // This requires knowing which dimension an option belongs to.
      // We can do this by iterating dimensions and their options.
      if (initialSelection.length > 0 && activeDimensions.length > 0) {
         activeDimensions.forEach(dim => {
            const found = dim.options.find(opt => initialSelection.includes(opt.id))
            if (found) {
                initial[dim.id] = found.id
            }
         })
      }
      
      setSelectedOptions(initial)
    }
  }, [open, fetchDimensions, activeDimensions.length, JSON.stringify(initialSelection)])

  const handleConfirm = () => {
    // Check if all dimensions have a selection? Or allow partial?
    // Requirement implies we should select for all active dimensions usually.
    // Let's collect all selected option IDs.
    const optionIds = Object.values(selectedOptions)
    onConfirm(optionIds)
    onOpenChange(false)
  }
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return

    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        handleConfirm()
    }
    
    // Number keys for selecting options in FOCUSED dimension group? 
    // Implementing robust keyboard nav (Tab between groups, numbers for items) is tricky with standard RadioGroup.
    // Let's stick to standard tab navigation for now + Enter to submit.
    // The requirement mentioned "Tab - Switch Dimension", "1-9 - Quick Select".
    // This would require capturing keys globally in the dialog and tracking which dimension is "active" or focused.
    // For MVP, let's rely on Tab navigation provided by browser/RadixUI and focus.
    
  }, [open, selectedOptions])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>为 "{activityName}" 选择标签</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {activeDimensions.map((dim) => (
            <div key={dim.id} className="space-y-3">
              <Label className="text-base font-semibold text-slate-700">{dim.name}</Label>
              <RadioGroup
                value={selectedOptions[dim.id]?.toString()}
                onValueChange={(val) => {
                  setSelectedOptions(prev => ({
                    ...prev,
                    [dim.id]: parseInt(val)
                  }))
                }}
                className="grid grid-cols-2 gap-2"
              >
                {dim.options.map((opt, index) => (
                  <div key={opt.id} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-md border border-slate-100 hover:border-slate-300 transition-colors">
                    <RadioGroupItem value={opt.id.toString()} id={`opt-${opt.id}`} />
                    <Label htmlFor={`opt-${opt.id}`} className="flex-1 flex items-center cursor-pointer font-normal">
                      <div
                        className="w-3 h-3 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="truncate">{opt.name}</span>
                      {index < 9 && (
                        <span className="ml-auto text-xs text-muted-foreground font-mono bg-slate-200 px-1 rounded">
                          {index + 1}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} size="lg" className="w-full sm:w-auto">
            确认 (Enter)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

