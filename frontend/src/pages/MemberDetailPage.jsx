import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { memberService, paymentService } from '../services/index'
import { useAuth } from '../context/AuthContext'
import { toast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { formatDate, formatCurrency, getInitials } from '../lib/utils'
import { ArrowLeft, Phone, Mail, Cake, Shield, AlertCircle, Loader2, Salad, Dumbbell, Send, X, Plus, Pencil } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  )
}

export default function MemberDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isOwner } = useAuth()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState({ mealPlan: null, workout: null })
  const [planModal, setPlanModal] = useState(null) // 'MEAL_PLAN' | 'WORKOUT' | null
  const [planForm, setPlanForm] = useState({ title: '', content: '' })
  const [planSending, setPlanSending] = useState(false)

  useEffect(() => {
    memberService.getOne(id)
      .then((res) => setMember(res.data.member))
      .catch(() => { toast({ title: 'Not found', description: 'Member not found.', variant: 'destructive' }); navigate('/members') })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    memberService.getPlans(id).then((res) => setPlans({ mealPlan: res.data.mealPlan, workout: res.data.workout }))
  }, [id])

  const openModal = (type) => {
    const existing = type === 'MEAL_PLAN' ? plans.mealPlan : plans.workout
    setPlanForm({ title: existing?.title || '', content: existing?.content || '' })
    setPlanModal(type)
  }

  const handleSendPlan = async () => {
    if (!planForm.content.trim()) {
      toast({ title: 'Content required', description: 'Please enter the plan content.', variant: 'destructive' })
      return
    }
    setPlanSending(true)
    try {
      const res = await memberService.sendPlan(id, { type: planModal, title: planForm.title, content: planForm.content })
      setPlans((prev) => ({ ...prev, [planModal === 'MEAL_PLAN' ? 'mealPlan' : 'workout']: res.data.plan }))
      toast({ title: 'Plan sent!', description: member?.email ? 'Plan saved and emailed to member.' : 'Plan saved (member has no email).' })
      setPlanModal(null)
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to send plan.', variant: 'destructive' })
    } finally {
      setPlanSending(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!member) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/members')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{member.fullName}</h1>
          <p className="text-muted-foreground text-sm">
            {member.memberNumber && <span className="font-mono text-primary font-semibold mr-2">{member.memberNumber}</span>}
            Member details & payment history
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Profile */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary text-2xl font-bold">
              {getInitials(member.fullName)}
            </div>
            <div>
              <p className="font-bold text-lg">{member.fullName}</p>
              <Badge className="mt-1" variant={member.status === 'ACTIVE' ? 'success' : 'destructive'}>
                {member.status}
              </Badge>
            </div>
            <div className="w-full space-y-2 text-left">
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {member.phone}
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {member.email}
                </div>
              )}
              {member.birthday && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cake className="h-3.5 w-3.5" /> {formatDate(member.birthday)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Member ID" value={member.memberNumber} />
            <InfoRow label="NIC" value={member.nic} />
            <InfoRow label="Join Date" value={formatDate(member.joinDate)} />
            <InfoRow label="Due Date" value={formatDate(member.dueDate)} />
            <InfoRow label="Emergency Contact" value={member.emergencyContact} />
            {member.medicalNotes && (
              <div className="mt-3 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">{member.medicalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      {isOwner && (
        <div className="grid gap-5 md:grid-cols-2">
          {[{ type: 'MEAL_PLAN', label: 'Meal Plan', icon: Salad, plan: plans.mealPlan },
            { type: 'WORKOUT',   label: 'Workout Schedule', icon: Dumbbell, plan: plans.workout }]
            .map(({ type, label, icon: Icon, plan }) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" /> {label}
                  </CardTitle>
                  <Button size="sm" className={`h-7 text-xs gap-1 ${plan ? 'bg-transparent border border-primary text-primary hover:bg-primary/10' : 'bg-primary text-white hover:bg-primary/90'}`} onClick={() => openModal(type)}>
                    {plan ? <Pencil className="h-3 w-3" /> : <Plus className="h-3.5 w-3.5" />} {plan ? 'Edit' : 'Add'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plan ? (
                  <div>
                    {plan.title && <p className="text-sm font-semibold text-primary mb-2">{plan.title}</p>}
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{plan.content}</pre>
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">Last sent: {formatDate(plan.sentAt)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No {label.toLowerCase()} assigned yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold">{planModal === 'MEAL_PLAN' ? 'Meal Plan' : 'Workout Schedule'}</h2>
              <button onClick={() => setPlanModal(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title (optional)</label>
                <input
                  type="text"
                  value={planForm.title}
                  onChange={(e) => setPlanForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Bulk Phase — March"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Content <span className="text-destructive">*</span></label>
                <textarea
                  rows={10}
                  value={planForm.content}
                  onChange={(e) => setPlanForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Type the plan here..."
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
                />
              </div>
              {!member?.email && (
                <p className="text-xs text-yellow-400">⚠ This member has no email — plan will be saved but not emailed.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setPlanModal(null)}>Cancel</Button>
              <Button onClick={handleSendPlan} disabled={planSending}>
                {planSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                {planSending ? 'Sending...' : 'Save & Send'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {member.payments?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Receipt</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Period</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Amount</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Paid Date</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  {member.payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="px-3 py-2.5 font-mono text-xs text-primary">{p.receiptNumber}</td>
                      <td className="px-3 py-2.5">{MONTHS[p.month - 1]} {p.year}</td>
                      <td className="px-3 py-2.5 text-emerald-400 font-medium">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDate(p.paidDate)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.collectedBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
