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
  createdAt: string;
  ultimoAccesso?: string;
}

const ROLE_LABELS: Record<string, string> = {
  credente: "Credente",
  madre: "Madre",
  padre: "Padre",
  ospite_chiesa: "Ospite",
};

const AGE_LABELS: Record<string, string> = {
  "0-11": "0–11",
  "12-18": "12–18",
  "19-29": "19–29",
  "30-45": "30–45",
  "46-65": "46–65",
  "65+": "65+",
};

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

  const callerRuolo = getCallerRuolo();
  const isSuperAdmin = callerRuolo === "superadmin";

  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/utenti?page=${page}&limit=${limit}`);
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
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.nome.toLowerCase().includes(search.toLowerCase()) ||
          u.cognome.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase())
      )
    : users;

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

  const totalPages = Math.ceil(total / limit);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const isUserAdmin = (u: UserPublic) => u.adminRequest === "approved";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-600" />
            Gestione Utenti
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} utenti registrati</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca utente..."
            autoComplete="off"
            aria-label="Cerca utente"
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full sm:w-64"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

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
                    {user.adminRequest === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {user.adminRequest === "pending" && (
                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">Pendente</span>
                    )}
                    {user.adminRequest === "rejected" && (
                      <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">Rifiutato</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Pagina {page} di {totalPages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
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
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="edit-attivo" className="text-sm text-gray-700">Account attivo</label>
              </div>

                {editForm.role === "ospite_chiesa" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Chiesa di provenienza</label>
                    <select
                      value={editForm.chiesa}
                      onChange={(e) => setEditForm({ ...editForm, chiesa: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                  className="flex-1 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
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
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
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
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <button
                      onClick={handleResetPassword}
                      disabled={savingPassword || !newPassword}
                      className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
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
