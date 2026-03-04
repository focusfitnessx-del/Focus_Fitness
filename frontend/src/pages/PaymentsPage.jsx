import { useState, useEffect, useCallback } from 'react'
import { paymentService, memberService } from '../services/index'
import { useAuth } from '../context/AuthContext'
import { toast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { formatDate, formatCurrency } from '../lib/utils'
import { Plus, X, Loader2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const MEMBERSHIP_PRICES = {
  STUDENT: 3000,
  ADULT: 4000,
  COUPLE: 7000,
  CAMPUS: 2000,
}

const PAYMENT_TYPE_LABELS = {
  MONTHLY: 'Monthly',
  ADMISSION: 'Admission',
}

function RecordPaymentModal({ onClose, onSaved }) {
  const { user } = useAuth()
  const now = new Date()
  const [form, setForm] = useState({
    memberId: '',
    paymentType: 'MONTHLY',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: '4000',
    notes: '',
  })
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const searchMembers = useCallback(async (q) => {
    if (!q.trim()) { setMemberResults([]); return }
    setSearching(true)
    try {
      const res = await memberService.list({ search: q, limit: 8 })
      setMemberResults(res.data.members)
    } finally { setSearching(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchMembers(memberSearch), 300)
    return () => clearTimeout(t)
  }, [memberSearch, searchMembers])

  const selectMember = (m) => {
    setSelectedMember(m)
    setForm((f) => ({
      ...f,
      memberId: m.id,
      amount: f.paymentType === 'ADMISSION' ? '2500' : (m.membershipType ? String(MEMBERSHIP_PRICES[m.membershipType]) : f.amount),
    }))
    setMemberResults([])
    setMemberSearch(m.fullName)
  }

  const set = (k, v) => {
    setForm((f) => {
      const updated = { ...f, [k]: v }
      // Auto-fill amount when payment type changes
      if (k === 'paymentType') {
        if (v === 'ADMISSION') {
          updated.amount = '2500'
        } else if (selectedMember?.membershipType) {
          updated.amount = String(MEMBERSHIP_PRICES[selectedMember.membershipType])
        }
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.memberId) { toast({ title: 'Error', description: 'Please select a member.', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await paymentService.record({ ...form, collectedById: user.id })
      toast({ title: 'Payment recorded!', description: `Receipt: ${res.data.payment.receiptNumber}` })
      onSaved()
      onClose()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to record payment.', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 pt-3 pb-20 sm:p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Record Payment</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
            {/* Member Search */}
            <div className="space-y-1.5 relative">
              <Label>Member *</Label>
              <Input
                placeholder="Search member by name or phone..."
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setSelectedMember(null); set('memberId', '') }}
              />
              {searching && <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-muted-foreground" />}
              {memberResults.length > 0 && (
                <div className="absolute top-full z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-accent text-sm transition-colors"
                      onClick={() => selectMember(m)}
                    >
                      <p className="font-medium">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.phone} · {m.status}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMember && (
              <div className="p-3 rounded-md bg-primary/10 border border-primary/20 text-sm">
                <p className="font-medium text-primary">{selectedMember.fullName}</p>
                <p className="text-muted-foreground text-xs">
                  {selectedMember.phone} · Due: {formatDate(selectedMember.dueDate)}
                  {selectedMember.membershipType && (
                    <span className="ml-2 capitalize">· {selectedMember.membershipType.charAt(0) + selectedMember.membershipType.slice(1).toLowerCase()}</span>
                  )}
                </p>
              </div>
            )}

            {/* Payment Type */}
            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select value={form.paymentType} onValueChange={(v) => set('paymentType', v)}>
                <option value="MONTHLY">Monthly Fee</option>
                <option value="ADMISSION">Admission Fee</option>
              </Select>
            </div>

            {form.paymentType === 'MONTHLY' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Month</Label>
                  <Select value={form.month} onValueChange={(v) => set('month', Number(v))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} min={2020} max={2050} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Amount (LKR)</Label>
              <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} required min={1} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>

          <div className="flex gap-3 p-4 sm:p-6 border-t border-border shrink-0">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ month: '', year: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const limit = 20

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentService.list({ ...filters, page, limit })
      setPayments(res.data.payments)
      setTotal(res.data.total)
    } catch {
      toast({ title: 'Error', description: 'Failed to load payments.', variant: 'destructive' })
    } finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { setPage(1) }, [filters])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} total records</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filters.month} onValueChange={(v) => setFilters((f) => ({ ...f, month: v }))} className="w-40">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </Select>
        <Select value={filters.year} onValueChange={(v) => setFilters((f) => ({ ...f, year: v }))} className="w-32">
          <option value="">All Years</option>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Period</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Paid Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Collected By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No payments found.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{p.receiptNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.member?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{p.member?.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {p.paymentType === 'ADMISSION'
                        ? <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">Admission</span>
                        : <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">Monthly</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(p.paidDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.collectedBy?.name}</td>
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

      {modalOpen && <RecordPaymentModal onClose={() => setModalOpen(false)} onSaved={fetchPayments} />}
    </div>
  )
}
