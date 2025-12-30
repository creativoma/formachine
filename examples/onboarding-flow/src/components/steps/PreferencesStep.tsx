import { useFormFlowContext } from '@formachine/react'
import { Bell, Mail, Palette, Settings } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StepCard } from '../layout/StepCard'

export function PreferencesStep() {
  const { form } = useFormFlowContext()

  return (
    <StepCard
      icon={<Settings className="size-6" />}
      title="Preferences"
      description="Customize your experience"
    >
      <div className="space-y-4">
        <div className="p-5 rounded-xl border border-border/50 bg-linear-to-br from-white to-gray-50/50 hover:border-primary/30 transition-colors">
          <div className="flex items-start gap-4">
            <Checkbox
              id="notifications"
              checked={form.watch('notifications')}
              onCheckedChange={(checked) => form.setValue('notifications', checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="notifications"
                className="flex items-center gap-2 cursor-pointer font-semibold text-base"
              >
                <Bell className="size-4 text-primary" />
                Enable notifications
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive updates about your account and important changes
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border/50 bg-linear-to-br from-white to-gray-50/50 hover:border-primary/30 transition-colors">
          <div className="flex items-start gap-4">
            <Checkbox
              id="newsletter"
              checked={form.watch('newsletter')}
              onCheckedChange={(checked) => form.setValue('newsletter', checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="newsletter"
                className="flex items-center gap-2 cursor-pointer font-semibold text-base"
              >
                <Mail className="size-4 text-primary" />
                Subscribe to newsletter
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get weekly updates, tips, and product announcements
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme" className="flex items-center gap-2">
            <Palette className="size-4" />
            Theme Preference
          </Label>
          <Select
            value={form.watch('theme')}
            onValueChange={(value) => form.setValue('theme', value as 'light' | 'dark' | 'auto')}
          >
            <SelectTrigger id="theme">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="auto">Auto (System)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </StepCard>
  )
}
