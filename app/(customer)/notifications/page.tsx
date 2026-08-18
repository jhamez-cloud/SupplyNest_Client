"use client"

import * as React from "react"
import { Bell, Inbox, Mail, MessageSquare } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { getNotifications } from "@/lib/mock-api"
import { useMockApi } from "@/hooks/use-mock-api"
import { GlassCard } from "@/components/glassmorphic/glass-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/glassmorphic/stagger"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatRelative, titleCase } from "@/lib/utils"
import type { NotificationChannel, NotificationLog } from "@/lib/types"

const CHANNEL_ICON: Record<NotificationChannel, LucideIcon> = {
  sms: MessageSquare,
  email: Mail,
  push: Bell,
}

const messageOf = (notification: NotificationLog): string | null => {
  const message = notification.payload?.message
  return typeof message === "string" ? message : null
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-3xl" />
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useMockApi(() => getNotifications())
  const [read, setRead] = React.useState<Set<string>>(new Set())

  const markRead = (id: string) =>
    setRead((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })

  const markAllRead = () => setRead(new Set((data ?? []).map((n) => n.id)))

  const unreadCount = (data ?? []).filter((n) => !read.has(n.id)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread ${
                  unreadCount === 1 ? "notification" : "notifications"
                }.`
              : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <NotificationsSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications"
          description="Updates about your orders and promotions will appear here."
        />
      ) : (
        <StaggerContainer className="space-y-3">
          {data.map((notification) => {
            const Icon = CHANNEL_ICON[notification.channel]
            const isUnread = !read.has(notification.id)
            const message = messageOf(notification)
            return (
              <StaggerItem key={notification.id}>
                <GlassCard
                  role="button"
                  tabIndex={0}
                  onClick={() => markRead(notification.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      markRead(notification.id)
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 p-5 transition-colors hover:bg-muted/40",
                    isUnread && "bg-primary/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      isUnread
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          isUnread ? "font-semibold" : "font-medium"
                        )}
                      >
                        {titleCase(notification.event_type)}
                      </p>
                      {isUnread && (
                        <span
                          className="size-2 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                    {message && (
                      <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                    {notification.sent_at && (
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(notification.sent_at)}
                      </p>
                    )}
                  </div>
                </GlassCard>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      )}
    </div>
  )
}
