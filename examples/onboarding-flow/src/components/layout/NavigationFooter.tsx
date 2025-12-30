import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationFooterProps {
  canGoBack: boolean
  canGoNext: boolean
  isSubmitting: boolean
  isComplete: boolean
  onBack: () => void
  onReset: () => void
  onNext: () => Promise<void>
}

export function NavigationFooter({
  canGoBack,
  canGoNext,
  isSubmitting,
  isComplete,
  onBack,
  onReset,
  onNext,
}: NavigationFooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap px-2">
      <div className="flex gap-3">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 shadow-sm h-12 px-6"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={isSubmitting}
          className="hover:bg-white/40 h-12 px-6"
        >
          <RotateCcw className="size-4 mr-2" />
          Start Over
        </Button>
      </div>

      {canGoNext && !isComplete && (
        <Button
          onClick={() => {
            onNext().catch((error) => {
              console.error('Navigation error:', error)
            })
          }}
          disabled={isSubmitting}
          className="ml-auto bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 h-12 px-8 text-base font-semibold"
        >
          {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
          {isSubmitting ? 'Processing...' : 'Continue'}
        </Button>
      )}
    </div>
  )
}
