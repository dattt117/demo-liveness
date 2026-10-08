import { cn } from "@/lib/utils"

const TONES = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
}

export function StatusScreen({
  icon: Icon,
  tone = "default",
  title,
  description,
  children,
  actions,
}: {
  icon: React.ElementType
  tone?: keyof typeof TONES
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-2 text-center">
      <div
        className={cn(
          "flex size-20 items-center justify-center rounded-full ring-8 ring-current/5",
          TONES[tone]
        )}
      >
        <Icon className="size-9" strokeWidth={1.75} />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-balance text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
      {actions && (
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          {actions}
        </div>
      )}
    </div>
  )
}
