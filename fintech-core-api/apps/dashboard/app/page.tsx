"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  LogIn,
  RefreshCw,
  ShieldCheck,
  WalletCards
} from "lucide-react";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

type Account = {
  id: string;
  user_id: string;
  currency: string;
  balance_cents: number;
  status: string;
};

type Transaction = {
  id: string;
  type: string;
  from_account_id?: string;
  to_account_id?: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string;
  created_at: string;
};

type MonthlyBalance = {
  month: string;
  balance_cents: number;
};

const authApi = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:8081";
const transactionApi = process.env.NEXT_PUBLIC_TRANSACTION_API_URL ?? "http://localhost:8082";

export default function DashboardPage() {
  const [email, setEmail] = useState("admin@fintech.local");
  const [password, setPassword] = useState("ChangeMe123!Secure");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [selectedAccountID, setSelectedAccountID] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("Ready");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountID) ?? accounts[0],
    [accounts, selectedAccountID]
  );

  const formatMoney = useCallback((amountCents: number, activeCurrency = selectedAccount?.currency ?? "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: activeCurrency,
      maximumFractionDigits: 2
    }).format(amountCents / 100);
  }, [selectedAccount?.currency]);

  const refresh = useCallback(async (activeToken = token, activeAccountID = selectedAccount?.id) => {
    if (!activeToken) return;
    setIsRefreshing(true);
    try {
      const headers = { Authorization: `Bearer ${activeToken}` };
      const accountResponse = await fetch(`${transactionApi}/v1/accounts`, { headers });
      if (!accountResponse.ok) throw new Error("Account API unavailable");
      const accountBody = await accountResponse.json();
      const nextAccounts: Account[] = accountBody.data ?? [];
      setAccounts(nextAccounts);

      const accountID = activeAccountID || nextAccounts[0]?.id || "";
      if (accountID && !selectedAccountID) {
        setSelectedAccountID(accountID);
      }

      const transactionResponse = await fetch(`${transactionApi}/v1/transactions?limit=20`, { headers });
      if (!transactionResponse.ok) throw new Error("Transaction API unavailable");
      const transactionBody = await transactionResponse.json();
      setTransactions(transactionBody.data ?? []);

      if (accountID) {
        const reportResponse = await fetch(`${transactionApi}/v1/reports/monthly-balances?account_id=${accountID}&months=12`, { headers });
        if (!reportResponse.ok) throw new Error("Reporting API unavailable");
        const reportBody = await reportResponse.json();
        setMonthlyBalances(reportBody.data ?? []);
      }
      setStatus("Live");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedAccount?.id, selectedAccountID, token]);

  useEffect(() => {
    if (!token) return;
    refresh();
    const interval = window.setInterval(() => refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [refresh, token]);

  async function login() {
    setStatus("Authenticating");
    const response = await fetch(`${authApi}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      setStatus("Login failed");
      return;
    }
    const body = await response.json();
    setToken(body.access_token);
    setUser(body.user);
    setStatus("Authenticated");
    await refresh(body.access_token);
  }

  async function createAccount() {
    if (!token) return;
    const response = await fetch(`${transactionApi}/v1/accounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ currency })
    });
    setStatus(response.ok ? "Account created" : "Create account failed");
    await refresh();
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance_cents, 0);
  const maxBalance = Math.max(...monthlyBalances.map((point) => Math.abs(point.balance_cents)), 1);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">FinTech Core API</p>
          <h1>Reporting Dashboard</h1>
        </div>
        <div className="status" aria-live="polite">
          <Activity size={18} />
          <span>{status}</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="controlPanel">
          <div className="panelHeader">
            <ShieldCheck size={20} />
            <h2>Access</h2>
          </div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          <button className="primaryButton" onClick={login}>
            <LogIn size={18} />
            Sign in
          </button>
          <div className="identity">
            <span>{user?.full_name ?? "No active session"}</span>
            <strong>{user?.role ?? "guest"}</strong>
          </div>

          <div className="divider" />

          <div className="panelHeader">
            <Database size={20} />
            <h2>Account</h2>
          </div>
          <label>
            Active account
            <select value={selectedAccount?.id ?? ""} onChange={(event) => setSelectedAccountID(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.currency} · {account.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Currency
            <input value={currency} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
          </label>
          <button className="secondaryButton" onClick={createAccount}>
            <WalletCards size={18} />
            New account
          </button>
        </aside>

        <section className="content">
          <div className="metrics">
            <article className="metricCard">
              <WalletCards size={24} />
              <span>Total balance</span>
              <strong>{formatMoney(totalBalance)}</strong>
            </article>
            <article className="metricCard">
              <ArrowUpRight size={24} />
              <span>Deposits</span>
              <strong>{transactions.filter((item) => item.type === "deposit").length}</strong>
            </article>
            <article className="metricCard">
              <ArrowDownRight size={24} />
              <span>Withdrawals</span>
              <strong>{transactions.filter((item) => item.type === "withdrawal").length}</strong>
            </article>
            <article className="metricCard">
              <Activity size={24} />
              <span>Transfers</span>
              <strong>{transactions.filter((item) => item.type === "transfer").length}</strong>
            </article>
          </div>

          <section className="chartSection">
            <div className="sectionTitle">
              <h2>Monthly Balance</h2>
              <button className="iconButton" onClick={() => refresh()} aria-label="Refresh dashboard">
                <RefreshCw size={18} className={isRefreshing ? "spin" : ""} />
              </button>
            </div>
            <div className="chart">
              {monthlyBalances.length === 0 && <p className="emptyState">No balance data yet</p>}
              {monthlyBalances.map((point) => (
                <div className="barGroup" key={point.month}>
                  <div
                    className="bar"
                    style={{ height: `${Math.max(8, (Math.abs(point.balance_cents) / maxBalance) * 100)}%` }}
                    title={`${point.month}: ${formatMoney(point.balance_cents)}`}
                  />
                  <span>{point.month.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="tableSection">
            <div className="sectionTitle">
              <h2>Transaction History</h2>
              <span>{transactions.length} records</span>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reference</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.type}</td>
                      <td>{formatMoney(transaction.amount_cents, transaction.currency)}</td>
                      <td><span className="badge">{transaction.status}</span></td>
                      <td>{transaction.reference || "Internal"}</td>
                      <td>{new Date(transaction.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <p className="emptyState">No transactions available</p>}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
