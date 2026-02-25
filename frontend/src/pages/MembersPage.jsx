import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { memberService } from '../services/index'
import { toast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { formatDate, getInitials } from '../lib/utils'
import { Plus, Search, Eye, Pencil, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ConfirmModal } from '../components/ui/confirm-modal'

const EMPTY_FORM = {
  fullName: '', nic: '', email: '', phone: '', birthday: '',
  medicalNotes: '', emergencyContact: '', joinDate: '', status: 'ACTIVE',
}

function MemberModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState(member
    ? { ...member, birthday: member.birthday ? member.birthday.split('T')[0] : '', joinDate: member.joinDate ? member.joinDate.split('T')[0] : '' }
    : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (member) {
        await memberService.update(member.id, form)
        toast({ title: 'Member updated', description: `${form.fullName} has been updated.` })
      } else {
        await memberService.create(form)
        toast({ title: 'Member added', description: `${form.fullName} has been added.` })
      }
      onSaved()
      onClose()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold">{member ? 'Edit Member' : 'Add New Member'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required placeholder="John Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} required placeholder="077 123 4567" />
            </div>
            <div className="space-y-1.5">
              <Label>NIC</Label>
              <Input value={form.nic} onChange={(e) => set('nic', e.target.value)} placeholder="990123456V" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Birthday</Label>
              <Input type="date" value={form.birthday} onChange={(e) => set('birthday', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Join Date</Label>
              <Input type="date" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Emergency Contact</Label>
              <Input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Name – 077 xxx xxxx" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Medical Notes</Label>
              <Textarea value={form.medicalNotes} onChange={(e) => set('medicalNotes', e.target.value)} placeholder="Any medical conditions..." rows={2} />
            </div>
            {member && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const limit = 15

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await memberService.list({ search, status: statusFilter, page, limit })
      setMembers(res.data.members)
      setTotal(res.data.total)
    } catch {
      toast({ title: 'Error', description: 'Failed to load members.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const handleDelete = (member) => setConfirmDelete(member)

  const doDelete = async () => {
    const member = confirmDelete
    setConfirmDelete(null)
    try {
      await memberService.delete(member.id)
      toast({ title: 'Deleted', description: `${member.fullName} removed.` })
      fetchMembers()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete.', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} total members</p>
        </div>
        <Button onClick={() => { setEditMember(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, NIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter} className="w-40">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">NIC</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Due Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No members found.</td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-primary font-bold">{m.memberNumber || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                          {getInitials(m.fullName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{m.fullName}</p>
                            {m.memberNumber && <span className="font-mono text-xs text-primary font-bold sm:hidden">{m.memberNumber}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground md:hidden">{m.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{m.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{m.nic || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(m.dueDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'destructive'}>{m.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/members/${m.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditMember(m); setModalOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(m)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
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

      {modalOpen && (
        <MemberModal
          member={editMember}
          onClose={() => setModalOpen(false)}
          onSaved={fetchMembers}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Member"
          message={`Delete ${confirmDelete.fullName}? This cannot be undone. Their payment history will be preserved.`}
          confirmLabel="Delete Member"
          onConfirm={doDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
