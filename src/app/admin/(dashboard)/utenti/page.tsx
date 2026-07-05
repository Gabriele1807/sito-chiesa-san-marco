"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  SlidersHorizontal,
} from "lucide-react";
import { CHIESE_LIST } from "@/lib/churches";

interface UserPublic {
  _id: string;
  email: string;
  username: string;
  nome: string;
  cognome: string;
  role: string;
  ageGroup: string;
  chiesa?: string;
  attivo: boolean;
  emailVerificata: boolean;
  adminRequest: string;
  adminRequestReason?: string;
  createdAt: string;
  ultimoAccesso?: string;
}

const ROLE_LABELS: Record<string, string> = {
  credente: "Credente",
  madre: "Madre",
  padre: "Padre",
  ospite_chiesa: "Ospite",
  prete: "Prete",
};

const AGE_LABELS: Record<string, string> = {
  "0-11": "0–11",
  "12-18": "12–18",
  "19-29": "19–29",
  "30-45": "30–45",
  "46-65": "46–65",
  "65+": "65+",
};

const AGE_GROUP_OPTIONS = ["all", "0-11", "12-18", "19-29", "30-45", "46-65", "65+"] as const;
const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Tutti i ruoli" },
  { value: "credente", label: "Credenti" },
  { value: "madre", label: "Madri" },
  { value: "padre", label: "Padri" },
  { value: "ospite_chiesa", label: "Ospiti" },
  { value: "prete", label: "Preti" },
];
const ADMIN_REQUEST_FILTER_OPTIONS = [
  { value: "all", label: "Tutti" },
  { value: "pending", label: "In attesa" },
  { value: "rejected", label: "Rifiutate" },
];

function getCallerRuolo(): string {
  if (typeof window === "undefined") return "";
  try {
    return JSON.parse(localStorage.getItem("admin_info") || "{}").ruolo ?? "";
  } catch {
    return "";
  }
}

export default function GestioneUtentiPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [roleFilter, setRoleFilter] = useState("all");
  const [adminRequestFilter, setAdminRequestFilter] = useState<"all" | "pending" | "rejected">("all");
  const [ageMin, setAgeMin] = useState<(typeof AGE_GROUP_OPTIONS)[number]>("all");
  const [ageMax, setAgeMax] = useState<(typeof AGE_GROUP_OPTIONS)[number]>("all");
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", cognome: "", role: "", ageGroup: "", chiesa: "", attivo: true });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Superadmin-only extras inside edit modal
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [promoteRuolo, setPromoteRuolo] = useState<"admin" | "superadmin">("admin");
  const [promoting, setPromoting] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [requestModalUser, setRequestModalUser] = useState<UserPublic | null>(null);
  const [requestRole, setRequestRole] = useState<"admin" | "superadmin">("admin");
  const [requestReason, setRequestReason] = useState("");
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestMessage, setRequestMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const callerRuolo = getCallerRuolo();
  const isSuperAdmin = callerRuolo === "superadmin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (query) params.set("q", query);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (adminRequestFilter !== "all") params.set("adminRequest", adminRequestFilter);
      if (ageMin !== "all") params.set("ageMin", ageMin);
      if (ageMax !== "all") params.set("ageMax", ageMax);
      const res = await fetch(`/api/admin/utenti?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      } else {
        setError(data.error || "Errore nel caricamento");
      }
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, roleFilter, adminRequestFilter, ageMin, ageMax]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      setError("Solo i superadmin possono gestire gli utenti.");
      return;
    }

    fetchUsers();
  }, [fetchUsers, isSuperAdmin]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, adminRequestFilter, ageMin, ageMax]);

  const filteredUsers = users;

  function resetFilters() {
    setSearch("");
    setQuery("");
    setPage(1);
    setRoleFilter("all");
    setAdminRequestFilter("all");
    setAgeMin("all");
    setAgeMax("all");
  }

  function openEdit(user: UserPublic) {
    setEditingUser(user);
    setEditForm({
      nome: user.nome,
      cognome: user.cognome,
      role: user.role,
      ageGroup: user.ageGroup,
      chiesa: user.chiesa ?? "",
      attivo: user.attivo,
    });
    setNewPassword("");
    setPasswordMsg(null);
    setPromoteMsg(null);
    setPromoteRuolo("admin");
  }

  function closeEdit() {
    setEditingUser(null);
    setNewPassword("");
    setPasswordMsg(null);
    setPromoteMsg(null);
  }

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/utenti", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser._id,
          ...editForm,
          chiesa: editForm.role === "ospite_chiesa" ? editForm.chiesa : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u =>
          u._id === editingUser._id
            ? { ...u, ...editForm, chiesa: editForm.role === "ospite_chiesa" ? editForm.chiesa : undefined }
            : u
        ));
        closeEdit();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Errore di connessione");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!editingUser || !newPassword) return;
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: "La password deve avere almeno 8 caratteri" });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await fetch("/api/admin/utenti", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingUser._id, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ ok: true, text: "Password aggiornata con successo" });
        setNewPassword("");
      } else {
        setPasswordMsg({ ok: false, text: data.error || "Errore" });
      }
    } catch {
      setPasswordMsg({ ok: false, text: "Errore di connessione" });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePromote() {
    if (!editingUser) return;
    setPromoting(true);
    setPromoteMsg(null);
    try {
      const res = await fetch("/api/admin/richieste-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser._id, action: "promote", ruolo: promoteRuolo }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoteMsg({ ok: true, text: data.message || "Utente promosso admin" });
        setUsers(prev => prev.map(u =>
          u._id === editingUser._id ? { ...u, adminRequest: "approved" } : u
        ));
        setEditingUser((prev) => prev ? { ...prev, adminRequest: "approved" } : prev);
      } else {
        setPromoteMsg({ ok: false, text: data.error || "Errore" });
      }
    } catch {
      setPromoteMsg({ ok: false, text: "Errore di connessione" });
    } finally {
      setPromoting(false);
    }
  }

  async function handleRevoke() {
    if (!editingUser) return;
    setPromoting(true);
    setPromoteMsg(null);
    try {
      const res = await fetch("/api/admin/richieste-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser._id, action: "revoke" }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoteMsg({ ok: true, text: "Accesso admin revocato" });
        setUsers(prev => prev.map(u =>
          u._id === editingUser._id ? { ...u, adminRequest: "none" } : u
        ));
        setEditingUser((prev) => prev ? { ...prev, adminRequest: "none" } : prev);
      } else {
        setPromoteMsg({ ok: false, text: data.error || "Errore" });
      }
    } catch {
      setPromoteMsg({ ok: false, text: "Errore di connessione" });
    } finally {
      setPromoting(false);
    }
  }

  function openAdminRequestModal(user: UserPublic) {
    setRequestModalUser(user);
    setRequestRole("admin");
    setRequestReason("");
    setRequestMessage(null);
  }

  async function handleAdminRequest(action: "approve" | "reject" | "revoke") {
    if (!requestModalUser) return;
    setRequestSaving(true);
    setRequestMessage(null);
    try {
      const res = await fetch("/api/admin/richieste-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: requestModalUser._id,
          action,
          ruolo: action === "approve" ? requestRole : undefined,
          motivation: requestReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u._id !== requestModalUser._id) return u;
            if (action === "approve") {
              return { ...u, adminRequest: "approved", adminRequestReason: undefined };
            }
            if (action === "reject") {
              return { ...u, adminRequest: "rejected", adminRequestReason: requestReason.trim() || undefined };
            }
            return { ...u, adminRequest: "none", adminRequestReason: undefined };
          })
        );
        setRequestModalUser(null);
        setRequestReason("");
        await fetchUsers();
      } else {
        setRequestMessage({ ok: false, text: data.error || "Errore" });
      }
    } catch {
      setRequestMessage({ ok: false, text: "Errore di connessione" });
    } finally {
      setRequestSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/admin/utenti", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDelete(null);
        await fetchUsers();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Errore di connessione");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const isUserAdmin = (u: UserPublic) => u.adminRequest === "approved";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-600" />
            Gestione Utenti
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} utenti registrati</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Filtri */}
      <div className="rounded-xl p-4 -mt-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          <div className="relative lg:max-w-xl flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome, cognome, email..."
              autoComplete="off"
              className="w-full pl-9 pr-2 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 flex-1">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Ruolo
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none"
              >
                {ROLE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Richiesta admin
              </span>
              <select
                value={adminRequestFilter}
                onChange={(e) =>
                  setAdminRequestFilter(e.target.value as "all" | "pending" | "rejected")
                }
                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none"
              >
                {ADMIN_REQUEST_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Età da
              </span>
              <select
                value={ageMin}
                onChange={(e) =>
                  setAgeMin(e.target.value as (typeof AGE_GROUP_OPTIONS)[number])
                }
                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none"
              >
                {AGE_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Tutte" : AGE_LABELS[option] || option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Età a
              </span>
              <select
                value={ageMax}
                onChange={(e) =>
                  setAgeMax(e.target.value as (typeof AGE_GROUP_OPTIONS)[number])
                }
                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none"
              >
                {AGE_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Tutte" : AGE_LABELS[option] || option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center lg:items-start">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Utente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Ruolo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Età</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Stato</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Admin</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.nome} {user.cognome}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{AGE_LABELS[user.ageGroup] || user.ageGroup}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${user.attivo ? "bg-green-500" : "bg-red-500"}`}
                      title={user.attivo ? "Attivo" : "Disattivato"}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => openAdminRequestModal(user)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:bg-gray-100"
                    >
                      {user.adminRequest === "approved" && (
                        <>
                          <ShieldCheck className="w-3 h-3 text-green-700" />
                          <span className="text-green-700">Approvata</span>
                        </>
                      )}
                      {user.adminRequest === "pending" && (
                        <span className="text-amber-700">In attesa</span>
                      )}
                      {user.adminRequest === "rejected" && (
                        <span className="text-red-700">Rifiutata</span>
                      )}
                      {!user.adminRequest || user.adminRequest === "none" ? (
                        <span className="text-gray-600">Nessuna</span>
                      ) : null}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg text-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(user._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {search ? "Nessun utente trovato" : "Nessun utente registrato"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Mostra</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>di {total} utenti</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">Pagina {page} di {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Edit Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <button onClick={closeEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {editingUser.nome} {editingUser.cognome}
            </h3>
            <p className="text-xs text-gray-400 mb-5">@{editingUser.username} · {editingUser.email}</p>

            {/* â”€â”€ Base fields â”€â”€ */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    autoComplete="off"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={editForm.cognome}
                    onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                    autoComplete="off"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ruolo nella comunità</label>
                <select
                  value={editForm.role}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      role: e.target.value,
                      chiesa: e.target.value === "ospite_chiesa" ? editForm.chiesa : "",
                    })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="credente">Credente</option>
                  <option value="madre">Madre</option>
                  <option value="padre">Padre</option>
                  <option value="ospite_chiesa">Ospite da altra chiesa</option>
                  <option value="prete">Prete</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fascia d&apos;età</label>
                <select
                  value={editForm.ageGroup}
                  onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="0-11">0–11</option>
                  <option value="12-18">12–18</option>
                  <option value="19-29">19–29</option>
                  <option value="30-45">30–45</option>
                  <option value="46-65">46–65</option>
                  <option value="65+">65+</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-attivo"
                  checked={editForm.attivo}
                  onChange={(e) => setEditForm({ ...editForm, attivo: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                />
                <label htmlFor="edit-attivo" className="text-sm text-gray-700">Account attivo</label>
              </div>

                {editForm.role === "ospite_chiesa" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Chiesa di provenienza</label>
                    <select
                      value={editForm.chiesa}
                      onChange={(e) => setEditForm({ ...editForm, chiesa: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    >
                      <option value="">Seleziona una chiesa...</option>
                      {CHIESE_LIST.map((chiesa) => (
                        <option key={chiesa} value={chiesa}>
                          {chiesa}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeEdit}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-gold text-white text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva modifiche"}
                </button>
              </div>
            </div>

            {/* â”€â”€ Superadmin extras â”€â”€ */}
            {isSuperAdmin && (
              <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">

                {/* Promozione / Revoca admin */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold" />
                    <p className="text-sm font-semibold text-gray-800">Accesso Admin</p>
                  </div>

                  {isUserAdmin(editingUser) ? (
                    // Already admin â†’ show revoke button
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Questo utente ha già accesso admin.</p>
                      <button
                        onClick={handleRevoke}
                        disabled={promoting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <ShieldOff className="w-4 h-4" />
                        {promoting ? "Revoca in corso..." : "Revoca accesso admin"}
                      </button>
                    </div>
                  ) : (
                    // Not admin â†’ show promote form
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">
                        {editingUser.adminRequest === "pending"
                          ? "L'utente ha fatto richiesta – puoi approvarla oppure promuoverlo direttamente."
                          : "Promuovi questo utente ad admin senza che abbia fatto richiesta."}
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={promoteRuolo}
                          onChange={(e) => setPromoteRuolo(e.target.value as "admin" | "superadmin")}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        >
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                        <button
                          onClick={handlePromote}
                          disabled={promoting}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {promoting ? "..." : "Promuovi"}
                        </button>
                      </div>
                    </div>
                  )}

                  {promoteMsg && (
                    <p className={`text-xs font-medium ${promoteMsg.ok ? "text-green-700" : "text-red-600"}`}>
                      {promoteMsg.text}
                    </p>
                  )}
                </div>

                {/* Reset password */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-gray-800">Reset password</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Honeypot nascosto per impedire al browser di autofillare il campo ricerca con lo username salvato */}
                    <input type="text" aria-hidden="true" tabIndex={-1} style={{ display: "none" }} autoComplete="username" readOnly />
                    <input
                      type="password"
                      placeholder="Nuova password (min. 8 caratteri)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    />
                    <button
                      onClick={handleResetPassword}
                      disabled={savingPassword || !newPassword}
                      className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
                    >
                      {savingPassword ? "..." : "Salva"}
                    </button>
                  </div>
                  {passwordMsg && (
                    <p className={`text-xs font-medium ${passwordMsg.ok ? "text-green-700" : "text-red-600"}`}>
                      {passwordMsg.text}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal gestione richiesta admin */}
      {requestModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRequestModalUser(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setRequestModalUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Gestione richiesta admin</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Valuta la richiesta di <span className="font-semibold text-gray-800">{requestModalUser.nome} {requestModalUser.cognome}</span>
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Utente</p>
                  <p className="mt-1 font-semibold text-gray-900">{requestModalUser.nome} {requestModalUser.cognome}</p>
                  <p className="text-sm text-gray-600">@{requestModalUser.username}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contatti</p>
                  <p className="mt-1 font-semibold text-gray-900">{requestModalUser.email}</p>
                  <p className="text-sm text-gray-600">{ROLE_LABELS[requestModalUser.role] || requestModalUser.role}</p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Stato attuale</p>
                <p className="mt-1">
                  {requestModalUser.adminRequest === "approved"
                    ? "Richiesta già approvata"
                    : requestModalUser.adminRequest === "pending"
                      ? "Richiesta in attesa di valutazione"
                      : requestModalUser.adminRequest === "rejected"
                        ? "Richiesta rifiutata"
                        : "Nessuna richiesta attiva"}
                </p>
                {requestModalUser.adminRequestReason && (
                  <p className="mt-2 text-xs text-amber-800">Motivazione precedente: {requestModalUser.adminRequestReason}</p>
                )}
              </div>
              {requestModalUser.adminRequest === "approved" ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">L’utente ha già accesso admin. Puoi revocarlo se necessario.</p>
                  <button
                    type="button"
                    onClick={() => handleAdminRequest("revoke")}
                    disabled={requestSaving}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <ShieldOff className="w-4 h-4" />
                    {requestSaving ? "Operazione in corso..." : "Revoca accesso admin"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Ruolo da assegnare</label>
                    <select
                      value={requestRole}
                      onChange={(e) => setRequestRole(e.target.value as "admin" | "superadmin")}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleAdminRequest("approve")}
                      disabled={requestSaving}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {requestSaving ? "Salvataggio..." : "Accetta richiesta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminRequest("reject")}
                      disabled={requestSaving}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <ShieldOff className="w-4 h-4" />
                      {requestSaving ? "Salvataggio..." : "Rifiuta richiesta"}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Motivazione del rifiuto (opzionale)</label>
                    <textarea
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-gold focus:outline-none"
                      placeholder="Inserisci una motivazione da conservare per la richiesta"
                    />
                  </div>
                </div>
              )}
              {requestMessage && (
                <p className={`text-sm font-medium ${requestMessage.ok ? "text-green-700" : "text-red-600"}`}>
                  {requestMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Conferma eliminazione</h3>
            <p className="text-sm text-gray-500 mb-4">
              Sei sicuro di voler eliminare questo utente? L&apos;azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
