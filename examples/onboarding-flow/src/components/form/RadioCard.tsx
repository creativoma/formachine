import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RadioCardProps {
  value: string
  label: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onChange: () => void
}

export function RadioCard({ label, description, icon, selected, onChange }: RadioCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:scale-[1.01] group border-2 overflow-hidden',
        selected
          ? 'border-primary shadow-lg shadow-primary/10 bg-linear-to-br from-primary/5 to-white'
          : 'border-border/50 bg-white hover:border-primary/40 hover:shadow-md'
      )}
      onClick={onChange}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={cn(
              'size-16 rounded-2xl flex items-center justify-center transition-all duration-200',
              selected
                ? 'bg-linear-to-br from-primary to-primary/90 text-white shadow-md shadow-primary/20'
                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
            )}
          >
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className={cn('font-bold text-lg', selected ? 'text-primary' : 'text-foreground')}>
              {label}
            </h3>
            <p className="text-sm text-muted-foreground leading-snug">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
