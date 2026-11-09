/**
 * Zoho Mail & SMTP Management Page for MyMitraa TaskFlow
 * Provides configuration, live email testing, quick notifications,
 * and delivery activity logs.
 */

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Key,
  ShieldCheck,
  RefreshCw,
  FileText,
  UserCheck,
  Radio,
  ExternalLink,
  Info,
  Check,
  Calendar
} from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { useAppTheme } from '../../context/ThemeContext';
import { EmailLogEntry } from '../../api/types';

export const EmailZohoManagement: React.FC = () => {
  const { isGlass } = useAppTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [sendingTaskEmail, setSendingTaskEmail] = useState(false);

  // Email Config State
  const [host, setHost] = useState('smtp.zoho.com');
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [from, setFrom] = useState('"MyMitraa TaskFlow" <notifications@mymitraa.com>');
  const [isConfigured, setIsConfigured] = useState(false);

  // Test Email State (User must provide recipient explicitly)
  const [testRecipient, setTestRecipient] = useState('');
  const [testSubject, setTestSubject] = useState('MyMitraa TaskFlow - Zoho Mail SMTP Live Test');
  const [testMessage, setTestMessage] = useState('This confirms that Zoho Mail SMTP delivery is operational and integrated with MyMitraa TaskFlow.');

  // Logs State
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Load initial email configuration & logs
  const loadData = async () => {
    setLoading(true);
    try {
      const configRes = await ApiClient.email.getConfig();
      if (configRes && configRes.data) {
        setHost(configRes.data.host || 'smtp.zoho.com');
        setPort(configRes.data.port || 465);
        setSecure(configRes.data.secure !== false);
        setUser(configRes.data.user || '');
        setFrom(configRes.data.from || '"MyMitraa TaskFlow" <notifications@mymitraa.com>');
        setIsConfigured(Boolean(configRes.data.isConfigured));
      }

      const logsRes = await ApiClient.email.getLogs();
      if (logsRes && logsRes.data) {
        setLogs(logsRes.data);
      }

      const healthRes = await ApiClient.system.getHealth();
      if (healthRes && healthRes.data) {
        setDbStatus(healthRes.data);
      }
    } catch (err) {
      console.error('Error fetching email data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Zoho Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await ApiClient.email.updateConfig({
        host,
        port: Number(port),
        secure,
        user,
        pass: password,
        from,
      });

      if (res.code === 200) {
        setIsConfigured(Boolean(user && (password || isConfigured)));
        showToast('Settings Saved', 'Zoho Mail SMTP configuration updated successfully.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed saving configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Dispatch Live Test Email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      showToast('Validation', 'Please provide a recipient email address', 'error');
      return;
    }

    setTestingEmail(true);
    try {
      const res = await ApiClient.email.testEmail({
        to: testRecipient,
        subject: testSubject,
        message: testMessage,
      });

      if (res.code === 200) {
        showToast('Email Dispatched', res.message || 'Test email dispatched', 'success');
        // Reload logs
        const updatedLogs = await ApiClient.email.getLogs();
        if (updatedLogs && updatedLogs.data) {
          setLogs(updatedLogs.data);
        }
      } else {
        showToast('Delivery Notice', res.message || 'Could not complete delivery', 'info');
      }
    } catch (err: any) {
      showToast('Test Failed', err.message || 'Error sending test email', 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  // Quick Trigger: Task Owner Notification
  const handleQuickTaskOwnerEmail = async () => {
    if (!testRecipient) {
      showToast('Recipient Required', 'Please enter a test recipient email in the form above first.', 'error');
      return;
    }
    setSendingTaskEmail(true);
    try {
      const res = await ApiClient.taskOwnerEmail.save({
        task_id: 'MTF-2026',
        owner_name: 'Lead Developer',
        owner_email: testRecipient,
        assigned_by: 'Engineering Lead',
        subject: 'Optimize Full-Stack Aggregations & Zoho SMTP Service',
        priority: 'Critical P0',
        eta: '10-Nov-2026',
        description: 'Ensure full integration of backend Express controllers with MongoDB database and Zoho Mail SMTP transport.',
      });
      if (res && res.code === 200) {
        showToast('Task Notification', res.message || 'Task owner email notification dispatched', 'success');
        const updatedLogs = await ApiClient.email.getLogs();
        if (updatedLogs && updatedLogs.data) setLogs(updatedLogs.data);
      } else {
        showToast('Dispatch Failed', res?.message || 'Error triggering task notification', 'error');
      }
    } catch (e: any) {
      showToast('Dispatch Error', e.message || 'Error triggering task notification', 'error');
    } finally {
      setSendingTaskEmail(false);
    }
  };

  // Quick Trigger: Weekly Report Email
  const handleQuickWeeklyEmail = async () => {
    if (!testRecipient) {
      showToast('Recipient Required', 'Please enter a test recipient email in the form above first.', 'error');
      return;
    }
    setSendingWeekly(true);
    try {
      const res = await ApiClient.weeklyUpdates.sendWeeklyMail({
        email: testRecipient,
        projectName: 'MyMitraa TaskFlow - Production Release',
        weekNumber: 'Sprint 45',
        milestonesCompleted: '1) Backend Spring Boot & Zoho Mail SMTP architecture configured. 2) MongoDB target database defined (mymitraa_taskflow). 3) 7 business modules verified.',
        highlights: 'API contract verified with accurate Spring Boot CustomResponse format.',
        nextWeekGoals: 'Execute live staging tests with customer MongoDB credentials.',
      });
      showToast('Weekly Report Sent', res.message || 'Weekly update email sent via Zoho Mail', 'success');
      const updatedLogs = await ApiClient.email.getLogs();
      if (updatedLogs && updatedLogs.data) setLogs(updatedLogs.data);
    } catch (e: any) {
      showToast('Report Error', e.message || 'Error sending weekly report', 'error');
    } finally {
      setSendingWeekly(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        isGlass
          ? 'bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-[#0A1021]/80 backdrop-blur-2xl border-white/10 text-white'
          : 'bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#7B3AEC]/15 text-[#7B3AEC] border border-[#7B3AEC]/30">
              <Mail className="w-3.5 h-3.5" />
              <span>Enterprise Email Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Zoho Mail &amp; SMTP Integration
            </h1>
            <p className={`text-sm max-w-2xl ${isGlass ? 'text-zinc-300' : 'text-slate-600'}`}>
              Configure Zoho Mail SMTP for automated Task Owner email assignments, weekly project status reports,
              and team notification workflows directly connected to the <strong>mymitraa_taskflow</strong> backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${
              isConfigured
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
            }`}>
              <span className={`w-3 h-3 rounded-full animate-pulse ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <div className="text-left">
                <div className="text-xs font-bold uppercase tracking-wider">
                  {isConfigured ? 'Zoho Mail Connected' : 'Simulation Mode'}
                </div>
                <div className="text-[11px] opacity-80">
                  {isConfigured ? `${host}:${port}` : 'Ready for Zoho credentials'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                isGlass ? 'border-white/15 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7B3AEC]' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>

        {/* Database & System Badges */}
        <div className="mt-6 pt-6 border-t border-slate-200/50 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#7B3AEC]" />
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>Target Database:</span>
            <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-[#7B3AEC]/10 text-[#7B3AEC]">
              {dbStatus?.database || 'mymitraa_taskflow'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>Backend Engine:</span>
            <span className="font-semibold text-emerald-600">Express + Node.js 22 (Spring Boot Compatible)</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00A6FC]" />
            <span className={isGlass ? 'text-zinc-400' : 'text-slate-500'}>REST APIs:</span>
            <span className="font-semibold text-[#00A6FC]">102 Verified Endpoints</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Config Form & Test Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Zoho Mail Configuration */}
        <div className={`lg:col-span-7 p-6 sm:p-7 rounded-3xl border transition-all ${
          isGlass
            ? 'bg-[#0A1021]/80 backdrop-blur-xl border-white/10 text-white'
            : 'bg-white border-slate-200/90 shadow-xs text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#7B3AEC]/15 text-[#7B3AEC] flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Zoho SMTP Credentials</h2>
                <p className="text-xs text-slate-500">Configure connection details for Zoho Mail gateway</p>
              </div>
            </div>
            <a
              href="https://www.zoho.com/mail/help/smtp-settings.html"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#7B3AEC] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Zoho Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {/* Host presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Zoho Mail SMTP Host
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setHost('smtp.zoho.com'); setPort(465); setSecure(true); }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-all ${
                    host === 'smtp.zoho.com'
                      ? 'border-[#7B3AEC] bg-[#7B3AEC]/10 text-[#7B3AEC]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">smtp.zoho.com</div>
                  <div className="text-[10px] text-slate-400">Zoho Personal &amp; Standard</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setHost('smtppro.zoho.com'); setPort(465); setSecure(true); }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-all ${
                    host === 'smtppro.zoho.com'
                      ? 'border-[#7B3AEC] bg-[#7B3AEC]/10 text-[#7B3AEC]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">smtppro.zoho.com</div>
                  <div className="text-[10px] text-slate-400">Zoho Workplace &amp; Custom Domain</div>
                </button>
              </div>
              <input
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="smtp.zoho.com"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7B3AEC]/30"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Port
                </label>
                <select
                  value={port}
                  onChange={e => {
                    const p = Number(e.target.value);
                    setPort(p);
                    setSecure(p === 465);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7B3AEC]/30"
                >
                  <option value={465}>465 (SSL / TLS - Recommended)</option>
                  <option value={587}>587 (STARTTLS)</option>
                  <option value={25}>25 (Standard SMTP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Encryption
                </label>
                <div className="h-10 px-3 flex items-center gap-2 border border-slate-200 rounded-2xl bg-slate-50/50 text-xs">
                  <input
                    type="checkbox"
                    id="secureCheck"
                    checked={secure}
                    onChange={e => setSecure(e.target.checked)}
                    className="rounded text-[#7B3AEC] focus:ring-[#7B3AEC]"
                  />
                  <label htmlFor="secureCheck" className="text-slate-600 font-medium cursor-pointer">
                    SSL / TLS Secured
                  </label>
                </div>
              </div>
            </div>

            {/* Zoho User & App Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Zoho Email Address / Username
              </label>
              <input
                type="email"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="your-name@zohomail.com or user@yourdomain.com"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B3AEC]/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Zoho App Password
                </label>
                <span className="text-[11px] text-slate-400">
                  (Generate in Zoho Account &gt; Security &gt; App Passwords)
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isConfigured ? '•••••••••••••••• (Saved in environment)' : 'Enter 16-character Zoho App Password'}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7B3AEC]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                From Name &amp; Email Address
              </label>
              <input
                type="text"
                value={from}
                onChange={e => setFrom(e.target.value)}
                placeholder='"MyMitraa TaskFlow" <notifications@mymitraa.com>'
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7B3AEC]/30"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Info className="w-4 h-4 text-[#7B3AEC]" />
                <span>Credentials persist in backend environment safely</span>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-2xl bg-[#7B3AEC] hover:bg-[#682FD0] text-white text-xs font-bold transition-all shadow-md shadow-[#7B3AEC]/20 flex items-center gap-2 cursor-pointer"
              >
                {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Zoho Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Email Test & Quick Triggers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Test Email Dispatcher */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isGlass
              ? 'bg-[#0A1021]/80 backdrop-blur-xl border-white/10 text-white'
              : 'bg-white border-slate-200/90 shadow-xs text-slate-900'
          }`}>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-2xl bg-[#00A6FC]/15 text-[#00A6FC] flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold">Live Zoho Email Test</h3>
                <p className="text-xs text-slate-500">Verify end-to-end SMTP dispatch right now</p>
              </div>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  placeholder="deeneshsabat2002@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A6FC]/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={e => setTestSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A6FC]/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Message
                </label>
                <textarea
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A6FC]/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={testingEmail}
                className="w-full py-2.5 rounded-2xl bg-[#00A6FC] hover:bg-[#0090DC] text-white text-xs font-bold transition-all shadow-md shadow-[#00A6FC]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {testingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Zoho SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Test Email via Zoho</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Triggers from Java Controllers */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isGlass
              ? 'bg-[#0A1021]/80 backdrop-blur-xl border-white/10 text-white'
              : 'bg-white border-slate-200/90 shadow-xs text-slate-900'
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              TaskFlow Notification Triggers
            </h4>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleQuickTaskOwnerEmail}
                disabled={sendingTaskEmail}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-[#7B3AEC]/40 bg-slate-50/50 hover:bg-[#7B3AEC]/5 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#7B3AEC]/10 text-[#7B3AEC] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold group-hover:text-[#7B3AEC]">
                      Task Owner Assignment Email
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Dispatches `/api/task_owner_email/save`
                    </div>
                  </div>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7B3AEC]" />
              </button>

              <button
                type="button"
                onClick={handleQuickWeeklyEmail}
                disabled={sendingWeekly}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-[#00A6FC]/40 bg-slate-50/50 hover:bg-[#00A6FC]/5 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#00A6FC]/10 text-[#00A6FC] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold group-hover:text-[#00A6FC]">
                      Weekly Status Report Email
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Dispatches `/api/optima_weekly_update_tracker/send-weekly-mail`
                    </div>
                  </div>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00A6FC]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Activity & Delivery Logs Table */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        isGlass
          ? 'bg-[#0A1021]/80 backdrop-blur-xl border-white/10 text-white'
          : 'bg-white border-slate-200/90 shadow-xs text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Email Dispatch &amp; Delivery Log</h3>
              <p className="text-xs text-slate-500">Audit trail of all automated and manual email notifications</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {logs.length} logs recorded
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No emails recorded yet. Send a test email above to verify delivery.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Gateway Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.to}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.category === 'TASK_OWNER'
                          ? 'bg-[#7B3AEC]/10 text-[#7B3AEC]'
                          : log.category === 'WEEKLY_REPORT'
                          ? 'bg-[#00A6FC]/10 text-[#00A6FC]'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'SIMULATED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {log.status === 'SENT' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        {log.status === 'SIMULATED' && <Clock className="w-3 h-3 text-amber-500" />}
                        {log.status === 'FAILED' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-sm truncate" title={log.details || log.error}>
                      {log.details || log.error || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
