import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { memberService, paymentService } from '../services/index'
import { toast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { formatDate, formatCurrency, getInitials } from '../lib/utils'
import { ArrowLeft, Phone, Mail, Cake, Shield, AlertCircle, Loader2 } from 'lucide-react'

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
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    memberService.getOne(id)
      .then((res) => setMember(res.data.member))
      .catch(() => { toast({ title: 'Not found', description: 'Member not found.', variant: 'destructive' }); navigate('/members') })
      .finally(() => setLoading(false))
  }, [id])

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
