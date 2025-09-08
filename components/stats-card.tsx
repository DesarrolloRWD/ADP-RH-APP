import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
}

export function StatsCard({ title, value, description, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground mb-1">{value}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <Badge
              variant="secondary"
              className={`text-xs ${
                trendUp ? "bg-accent/20 text-accent-foreground" : "bg-destructive/20 text-destructive"
              }`}
            >
              {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
