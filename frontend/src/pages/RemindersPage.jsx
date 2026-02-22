import { useState, useEffect, useCallback } from 'react'
import { reminderService } from '../services/index'
import { useAuth } from '../context/AuthContext'
import { toast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { formatDate } from '../lib/utils'
import { Bell, Play, Loader2, ChevronLeft, ChevronRight, Mail, MessageSquare } from 'lucide-react'

const statusVariant = { SENT: 'success', FAILED: 'destructive', SKIPPED: 'warning' }

export default function RemindersPage() {
  const { isOwner } = useAuth()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ type: '', channel: '', status: '' })
  const limit = 30

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reminderService.logs({ ...filters, page, limit })
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } catch {
      toast({ title: 'Error', description: 'Failed to load reminder logs.', variant: 'destructive' })
    } finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { setPage(1) }, [filters])

  const trigger = async (type, fn, label) => {
    setTriggering(type)
    try {
      const res = await fn()
      toast({ title: `${label} triggered`, description: `Processed ${res.data.processed ?? res.data.expired ?? 0} items.` })
      fetchLogs()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed.', variant: 'destructive' })
    } finally { setTriggering('') }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Automated notification logs & manual triggers</p>
        </div>
        {isOwner && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm" variant="outline"
              onClick={() => trigger('payment', reminderService.triggerPayment, 'Payment reminders')}
              disabled={!!triggering}
            >
              {triggering === 'payment' ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
              Run Payment Reminders
            </Button>
            <Button
              size="sm" variant="outline"
              onClick={() => trigger('birthday', reminderService.triggerBirthday, 'Birthday wishes')}
              disabled={!!triggering}
            >
              {triggering === 'birthday' ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
              Run Birthday Wishes
            </Button>
            <Button
              size="sm" variant="secondary"
              onClick={() => trigger('expire', reminderService.triggerAutoExpire, 'Auto-expire')}
              disabled={!!triggering}
            >
              {triggering === 'expire' ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
              Run Auto-Expire
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))} className="w-44">
          <option value="">All Types</option>
          <option value="PAYMENT_DUE">Payment Due</option>
          <option value="BIRTHDAY">Birthday</option>
        </Select>
        <Select value={filters.channel} onValueChange={(v) => setFilters((f) => ({ ...f, channel: v }))} className="w-40">
          <option value="">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))} className="w-36">
          <option value="">All Status</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="SKIPPED">Skipped</option>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Channel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Message</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No reminder logs yet.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.member?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{log.member?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {log.type === 'PAYMENT_DUE' ? '💳 Payment' : '🎂 Birthday'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {log.channel === 'EMAIL' ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                        <span className="text-xs">{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[log.status] || 'outline'}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate hidden lg:table-cell">
                      {log.error || log.message || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {formatDate(log.sentAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
