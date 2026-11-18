import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Download,
  LogOut,
  MessageSquare,
  Send,
} from 'lucide-react';
import type { ClientAccount, SupportRequest } from '../types';
import { summarizeClientMetrics } from '../utils/velanzaLogic';

interface ClientPortalProps {
  onBackHome: () => void;
  onLogout: () => void;
}

export function ClientPortal({ onBackHome, onLogout }: ClientPortalProps) {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Omit<ClientAccount, 'internalNotes'> | null>(null);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');
  const [error, setError] = useState('');

  const loadClientPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/dashboard');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Could not load client portal.');
        return;
      }
      const data = await res.json();
      setClient(data.client);
      setSupportRequests(data.supportRequests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientPortal();
  }, []);

  const handleSupportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitNotice('');
    try {
      const res = await fetch('/api/client/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSupportRequests((prev) => [data.supportRequest, ...prev]);
        setSubject('');
        setMessage('');
        setSubmitNotice('Support ticket sent to your Velanza.co account manager.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    await fetch('/api/client/notifications/read', { method: 'POST' });
    setClient((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) => ({ ...n, read: true })),
          }
        : prev,
    );
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-10 w-72 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-4">
          <p className="text-sm text-red-700 font-medium">{error || 'Client workspace unavailable.'}</p>
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  const metrics = summarizeClientMetrics(client.pendingWork, client.completedWork, client.orders);
  const maxSales = Math.max(1, ...client.salesHistory.map((s) => s.revenueUsd));

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-emerald-800">
            Private Client Portal · {client.marketplace} · Status: {client.accountStatus}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {client.businessName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Public Website
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Revenue & Work KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white">
          <p className="text-xs text-slate-500">Total Store Revenue</p>
          <p className="font-mono text-2xl font-bold text-emerald-900 mt-1 tabular-nums">
            ${client.revenueTotalUsd.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Account Status: {client.accountStatus}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 bg-white">
          <p className="text-xs text-slate-500">Pending Agency Work</p>
          <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {metrics.pendingWorkCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active deliverables</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 bg-white">
          <p className="text-xs text-slate-500">Completed Milestones</p>
          <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {metrics.completedWorkCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">{metrics.completionRatePercent}% completion rate</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 bg-white">
          <p className="text-xs text-slate-500">Recent Tracked Orders</p>
          <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {metrics.totalOrdersCount}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            ${metrics.ordersRevenueUsd.toFixed(2)} recent batch
          </p>
        </div>
      </section>

      {/* Sales Report Chart + Notifications */}
      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Monthly Sales &amp; Revenue Summary
              </h2>
              <p className="text-xs text-slate-500">Verified marketplace gross revenue trend (USD)</p>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-800 tabular-nums">
              Retainer: ${client.monthlyFeeUsd}/mo
            </span>
          </div>

          <div className="grid grid-cols-5 gap-4 items-end h-48 pt-6 border-b border-slate-200 pb-3">
            {client.salesHistory.map((point) => {
              const heightPct = Math.max(12, Math.round((point.revenueUsd / maxSales) * 100));
              return (
                <div key={point.month} className="flex flex-col items-center justify-end h-full gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-700 tabular-nums">
                    ${point.revenueUsd.toLocaleString()}
                  </span>
                  <div className="w-full max-w-[48px] bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-emerald-800 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{point.month}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-800" />
              <span>Notifications</span>
            </h2>
            <button
              type="button"
              onClick={handleMarkNotificationsRead}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-3">
            {client.notifications.length === 0 ? (
              <p className="text-xs text-slate-500">No notifications yet.</p>
            ) : (
              client.notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border text-xs ${
                    n.read ? 'border-slate-200 bg-white text-slate-600' : 'border-emerald-200 bg-emerald-50 text-slate-900'
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="font-mono text-[11px] text-slate-500 mt-1">{n.date}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Pending Work & Completed Work */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <span>Pending Work</span>
          </h2>
          {client.pendingWork.length === 0 ? (
            <p className="text-sm text-slate-500">All scheduled tasks are up to date.</p>
          ) : (
            <div className="space-y-3">
              {client.pendingWork.map((w) => (
                <div key={w.id} className="p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{w.title}</p>
                  <p className="text-xs text-slate-500">
                    Assignee: {w.assignee} · Due: <span className="font-mono">{w.dueDate}</span> ·{' '}
                    <span className="font-medium text-amber-700">{w.status.replace('_', ' ')}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Completed Work</span>
          </h2>
          {client.completedWork.length === 0 ? (
            <p className="text-sm text-slate-500">Completed deliverables will appear here.</p>
          ) : (
            <div className="space-y-3">
              {client.completedWork.map((w) => (
                <div key={w.id} className="p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{w.title}</p>
                  <p className="text-xs text-slate-500">
                    Delivered by {w.assignee} · <span className="font-mono">{w.dueDate}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Orders Table */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900">Store Orders Log</h2>
        </div>
        {client.orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No store orders recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Marketplace</th>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (USD)</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 font-mono text-xs font-semibold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ord.marketplace}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{ord.productName}</td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-slate-900">
                      ${ord.amountUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-emerald-800 capitalize">
                      {ord.status}
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-slate-500">{ord.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Progress Timeline, File Downloads & Support Requests */}
      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900">Progress Timeline</h2>
          <div className="space-y-4">
            {client.timeline.map((ev) => (
              <div key={ev.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <p className="font-mono text-xs text-emerald-800">{ev.date}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{ev.title}</p>
                <p className="text-xs text-slate-600 mt-1">{ev.detail}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900">File Downloads</h3>
            {client.files.length === 0 ? (
              <p className="text-xs text-slate-500">No reports uploaded yet.</p>
            ) : (
              client.files.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  download
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{file.name}</p>
                    <p className="text-slate-500">
                      {file.category} · {file.uploadedAt}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-emerald-800 shrink-0" />
                </a>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-800" />
            <span>Support Requests &amp; Account Manager Desk</span>
          </h2>
          <form onSubmit={handleSupportSubmit} className="space-y-3">
            <div>
              <label htmlFor="sup-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <input
                id="sup-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Request new product batch or marketplace expansion"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
            <div>
              <label htmlFor="sup-msg" className="block text-xs font-semibold text-slate-700 mb-1">
                Details
              </label>
              <textarea
                id="sup-msg"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your request for our account operations team..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
            {submitNotice && (
              <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                {submitNotice}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending...' : 'Submit Support Request'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500">Ticket History</h3>
            {supportRequests.map((req) => (
              <div key={req.id} className="p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{req.subject}</span>
                  <span
                    className={
                      req.status === 'resolved'
                        ? 'text-emerald-800 font-semibold'
                        : 'text-amber-700 font-semibold'
                    }
                  >
                    {req.status === 'resolved' ? 'Resolved' : 'Open'}
                  </span>
                </div>
                <p className="text-slate-600">{req.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
