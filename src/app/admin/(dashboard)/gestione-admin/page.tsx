"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  nome: string;
  cognome: string;
  ruolo: "superadmin" | "admin";
  attivo: boolean;
  ultimo_accesso: string | null;
  created_at: string;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  nome: string;
  cognome: string;
  ruolo: "superadmin" | "admin";
}

const emptyForm: FormData = {
  username: "",
  email: "",
  password: "",
  nome: "",
  cognome: "",
  ruolo: "admin",
};

export default function GestioneAdminPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        setError(data.error || "Errore nel caricamento");
      }
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(admin: AdminUser) {
    setEditingId(admin.id);
    setForm({
      username: admin.username,
      email: admin.email || "",
      password: "", // non precompilare
      nome: admin.nome,
      cognome: admin.cognome,
      ruolo: admin.ruolo,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      if (editingId) {
        // Modifica
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: Record<string, any> = {
          email: form.email,
          nome: form.nome,
          cognome: form.cognome,
          ruolo: form.ruolo,
        };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error);
          return;
        }
      } else {
        // Creazione
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error);
          return;
        }
      }

      setShowForm(false);
      setEditingId(null);
      await fetchAdmins();
    } catch {
      setFormError("Errore di connessione");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        await fetchAdmins();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Errore di connessione");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDelete(null);
        await fetchAdmins();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Errore di connessione");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Amministratori</h1>
          <p className="text-sm text-gray-500 mt-1">
            {admins.length} amministrator{admins.length === 1 ? "e" : "i"} registrat{admins.length === 1 ? "o" : "i"}
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuovo Admin
        </button>
      </div>

      {/* Admin list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Admin</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Username</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ruolo</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Stato</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ultimo accesso</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  {/* Nome con avatar iniziali */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          admin.ruolo === "superadmin" ? "bg-amber-500" : "bg-blue-500"
                        }`}
                      >
                        {admin.nome[0]}{admin.cognome[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{admin.nome} {admin.cognome}</p>
                        {admin.email && (
                          <p className="text-xs text-gray-400">{admin.email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Username */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-600 font-mono">{admin.username}</span>
                  </td>

                  {/* Ruolo badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        admin.ruolo === "superadmin"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {admin.ruolo === "superadmin" ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : (
                        <Shield className="w-3 h-3" />
                      )}
                      {admin.ruolo === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>

                  {/* Stato */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        admin.attivo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.attivo ? "bg-green-500" : "bg-red-400"}`} />
                      {admin.attivo ? "Attivo" : "Disattivato"}
                    </span>
                  </td>

                  {/* Ultimo accesso */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {admin.ultimo_accesso
                      ? new Date(admin.ultimo_accesso).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Mai"}
                  </td>

                  {/* Azioni */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle attivo/disattivo */}
                      <button
                        onClick={() => handleToggle(admin.id)}
                        disabled={togglingId === admin.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                        title={admin.attivo ? "Disattiva" : "Attiva"}
                      >
                        {togglingId === admin.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : admin.attivo ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-red-400" />
                        )}
                      </button>

                      {/* Modifica */}
                      <button
                        onClick={() => openEditForm(admin)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Elimina */}
                      {confirmDelete === admin.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(admin.id)}
                            disabled={deletingId === admin.id}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            {deletingId === admin.id ? "..." : "Conferma"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(admin.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form crea/modifica */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? "Modifica Admin" : "Nuovo Admin"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    value={form.cognome}
                    onChange={(e) => setForm({ ...form, cognome: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Password {editingId ? "(lascia vuoto per non modificare)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  minLength={8}
                  placeholder={editingId ? "••••••••" : "Minimo 8 caratteri"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Ruolo *
                </label>
                <select
                  value={form.ruolo}
                  onChange={(e) => setForm({ ...form, ruolo: e.target.value as "superadmin" | "admin" })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
                >
                  <option value="admin">Admin (gestione contenuti)</option>
                  <option value="superadmin">Super Admin (accesso completo)</option>
                </select>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Salva modifiche" : "Crea admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
