import { useState, useEffect } from 'react'
import { settingService, authService } from '../services/index'
import { useAuth } from '../context/AuthContext'
import { toast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { Loader2, Save, Lock, Users, Send, Mail } from 'lucide-react'
import { ConfirmModal } from '../components/ui/confirm-modal'

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const { isOwner, user } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'TRAINER' })
  const [addingStaff, setAddingStaff] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState('')

  useEffect(() => {
    settingService.getAll()
      .then((res) => setSettings(res.data.settings))
      .finally(() => setLoading(false))

    if (isOwner) {
      authService.getStaff()
        .then((res) => setStaffList(res.data.staff))
        .finally(() => setLoadingStaff(false))
    } else {
      setLoadingStaff(false)
    }
  }, [isOwner])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }))
      await settingService.updateBulk(updates)
      toast({ title: 'Settings saved', description: 'All settings have been updated.' })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save.', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    if (newStaff.password.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters.', variant: 'destructive' }); return
    }
    setAddingStaff(true)
    try {
      const res = await authService.createStaff(newStaff)
      setStaffList((s) => [...s, res.data.user])
      setNewStaff({ name: '', email: '', password: '', role: 'TRAINER' })
      toast({ title: 'Staff added', description: `${res.data.user.name} has been added.` })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed.', variant: 'destructive' })
    } finally { setAddingStaff(false) }
  }

  const handleDeactivateStaff = (id, name) => setConfirmDeactivate({ id, name })

  const doDeactivate = async () => {
    const { id, name } = confirmDeactivate
    setConfirmDeactivate(null)
    try {
      await authService.deactivateStaff(id)
      setStaffList((s) => s.filter((u) => u.id !== id))
      toast({ title: 'Deactivated', description: `${name} has been deactivated.` })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed.', variant: 'destructive' })
    }
  }

  const handleTestEmail = async (type) => {
    if (!testEmail.trim()) {
      toast({ title: 'Error', description: 'Enter a test email address.', variant: 'destructive' })
      return
    }
    setTestSending(type)
    try {
      await settingService.sendTestEmail(type, testEmail)
      toast({ title: 'Test email sent', description: `${type.replace(/_/g, ' ')} email sent to ${testEmail}` })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to send.', variant: 'destructive' })
    } finally { setTestSending('') }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' }); return
    }
    setChangingPw(true)
    try {
      await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      toast({ title: 'Password changed', description: 'Your password has been updated.' })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed.', variant: 'destructive' })
    } finally { setChangingPw(false) }
  }

  const setSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">System configuration and preferences</p>
      </div>

      {/* Gym Settings */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gym Settings</CardTitle>
            <CardDescription>General configuration for Focus Fitness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Gym Name</Label>
              <Input value={settings.GYM_NAME || ''} onChange={(e) => setSetting('GYM_NAME', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monthly Package Amount (LKR)</Label>
                <Input type="number" value={settings.MONTHLY_PACKAGE_AMOUNT || '3000'} onChange={(e) => setSetting('MONTHLY_PACKAGE_AMOUNT', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Day (of month)</Label>
                <Input type="number" min={1} max={28} value={settings.DUE_DAY || '10'} onChange={(e) => setSetting('DUE_DAY', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reminder Days Before Due (default: 3)</Label>
              <Input type="number" min={1} max={14} value={settings.REMINDER_DAYS_BEFORE || '3'} onChange={(e) => setSetting('REMINDER_DAYS_BEFORE', e.target.value)} />
            </div>

            {/* Auto-expire toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="font-medium text-sm">Auto-Expire Members</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically mark members as EXPIRED after the due date if no payment is recorded.
                </p>
              </div>
              <ToggleSwitch
                checked={settings.AUTO_EXPIRE_ENABLED === 'true'}
                onChange={(v) => setSetting('AUTO_EXPIRE_ENABLED', v ? 'true' : 'false')}
              />
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Staff Management (OWNER only) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Staff Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Staff List */}
            {!loadingStaff && (
              <div className="space-y-2">
                {staffList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email} · {s.role}</p>
                    </div>
                    {s.id !== user.id && (
                      <Button size="sm" variant="destructive" onClick={() => handleDeactivateStaff(s.id, s.name)}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Staff */}
            <div className="pt-2 border-t border-border">
              <p className="font-medium text-sm mb-3">Add Staff Member</p>
              <form onSubmit={handleAddStaff} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} required placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                      <option value="TRAINER">Trainer</option>
                      <option value="OWNER">Owner</option>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} required placeholder="staff@focusfitness.lk" />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} required placeholder="Min 8 characters" />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={addingStaff}>
                  {addingStaff ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Staff Member
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full" disabled={changingPw}>
              {changingPw ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Testing (OWNER only) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Email Testing</CardTitle>
            <CardDescription>Send test emails to verify delivery is working correctly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Test Email Address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              {[
                { type: 'welcome', label: 'Welcome Email', desc: 'New member welcome & membership details' },
                { type: 'payment_reminder', label: 'Payment Reminder', desc: 'Monthly fee due notification' },
                { type: 'birthday', label: 'Birthday Wish', desc: 'Member birthday greeting message' },
              ].map(({ type, label, desc }) => (
                <button
                  key={type}
                  disabled={!!testSending}
                  onClick={() => handleTestEmail(type)}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/30 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  {testSending === type ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  ) : (
                    <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title="Deactivate Staff Member"
          message={`Deactivate ${confirmDeactivate.name}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          onConfirm={doDeactivate}
          onClose={() => setConfirmDeactivate(null)}
        />
      )}
    </div>
  )
}
