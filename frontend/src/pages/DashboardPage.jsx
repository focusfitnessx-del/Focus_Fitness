import { useEffect, useState } from 'react'
import { dashboardService, paymentService } from '../services/index'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatCurrency, formatDate } from '../lib/utils'
import { Users, TrendingUp, UserCheck, UserX, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel }) {
  const isPositive = trend >= 0
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trendLabel && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trendLabel}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm">{MONTH_NAMES[label - 1]}</p>
        <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
        <p className="text-muted-foreground text-xs">{payload[0].payload.count} payments</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const year = new Date().getFullYear()
    Promise.all([
      dashboardService.summary(),
      dashboardService.recentActivity(),
      paymentService.monthlyRevenue(year),
    ])
      .then(([s, a, r]) => {
        setSummary(s.data)
        setActivity(a.data)
        setRevenueData(r.data.months || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    )
  }

  const revenueTrendPct = summary?.lastMonthRevenue > 0
    ? Math.round(((summary.currentMonthRevenue - summary.lastMonthRevenue) / summary.lastMonthRevenue) * 100)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of Focus Fitness</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={summary?.totalMembers || 0}
          icon={Users}
        />
        <StatCard
          title="Active Members"
          value={summary?.activeMembers || 0}
          subtitle={`${summary?.expiredMembers || 0} expired`}
          icon={UserCheck}
          trend={1}
          trendLabel="Currently active"
        />
        <StatCard
          title="This Month Revenue"
          value={formatCurrency(summary?.currentMonthRevenue || 0)}
          subtitle={`${summary?.currentMonthPaymentsCount || 0} payments`}
          icon={TrendingUp}
          trend={revenueTrendPct}
          trendLabel={
            revenueTrendPct !== null
              ? `${revenueTrendPct >= 0 ? '+' : ''}${revenueTrendPct}% vs last month`
              : undefined
          }
        />
        <StatCard
          title="Last Month Revenue"
          value={formatCurrency(summary?.lastMonthRevenue || 0)}
          subtitle={`${summary?.lastMonthPaymentsCount || 0} payments`}
          icon={UserX}
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue — {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={(m) => MONTH_NAMES[m - 1]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v / 1000}k`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.recentPayments?.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No payments yet.</p>
            )}
            {activity?.recentPayments?.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.member?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{p.receiptNumber} · {formatDate(p.paidDate)}</p>
                </div>
                <span className="text-primary font-bold text-sm">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Newest Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.recentMembers?.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No members yet.</p>
            )}
            {activity?.recentMembers?.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground">{m.phone} · Joined {formatDate(m.createdAt)}</p>
                </div>
                <Badge variant={m.status === 'ACTIVE' ? 'success' : 'destructive'}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
