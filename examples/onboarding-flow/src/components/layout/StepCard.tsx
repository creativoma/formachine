import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StepCardProps {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}

export function StepCard({ icon, title, description, children }: StepCardProps) {
  return (
    <Card className="shadow-xl rounded-2xl border-0 backdrop-blur-sm bg-white/95 overflow-hidden max-w-3xl mx-auto">
      <CardHeader className="pb-6 pt-8 px-8 md:px-10">
        <div className="flex items-start gap-4">
          <div className="size-14 md:size-16 rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            {icon}
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8 md:px-10 md:pb-10">{children}</CardContent>
    </Card>
  )
}
