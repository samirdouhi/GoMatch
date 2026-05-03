'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, Eye, MousePointer,
  TrendingUp, DollarSign, ArrowLeft, X, Calendar, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { Promotion, CreatePromotionDto, PromotionStats } from '@/lib/notificationApi';
import {
  getPromotions, createPromotion, updatePromotion,
  togglePromotion, deletePromotion, getPromotionStats,
} from '@/lib/notificationApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number | string) {
  return `${Number(n).toFixed(2)} €`;
}

// ─── Promotion Form ────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  imageUrl: string;
  radiusKm: number;
  budget: number;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  imageUrl: '',
  radiusKm: 2,
  budget: 50,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
};

function PromotionForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<FormState>;
  onSubmit: (dto: CreatePromotionDto) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [error, setError] = useState('');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Le titre et la description sont obligatoires.');
      return;
    }
    if (form.budget < 10) {
      setError('Budget minimum : 10 €');
      return;
    }
    try {
      await onSubmit({
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        radiusKm: form.radiusKm,
        budget: form.budget,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-lg bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-black text-white">
            {initial ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h2>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">Titre de l'offre *</label>
            <input
              value={form.title}
              onChange={set('title')}
              placeholder="Ex: -20% sur votre menu match day"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Décrivez votre offre en quelques mots"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#facc15] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">Image URL (optionnel)</label>
            <input
              value={form.imageUrl}
              onChange={set('imageUrl')}
              placeholder="https://..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
                <MapPin size={11} /> Rayon (km)
              </label>
              <input
                type="number"
                min={0.5}
                max={50}
                step={0.5}
                value={form.radiusKm}
                onChange={set('radiusKm')}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
                <DollarSign size={11} /> Budget (€)
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={form.budget}
                onChange={set('budget')}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#facc15]"
              />
              <p className="text-[10px] text-zinc-600 mt-1">Min. 10 € · 0.05 €/impression</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar size={11} /> Date de début
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={set('startDate')}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar size={11} /> Date de fin
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={set('endDate')}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>

          {/* Budget estimate */}
          <div className="rounded-2xl bg-[#facc15]/8 border border-[#facc15]/20 px-4 py-3">
            <p className="text-xs text-zinc-400">
              Avec <span className="text-[#facc15] font-bold">{fmtMoney(form.budget)}</span> de budget,
              votre offre peut atteindre jusqu'à{' '}
              <span className="text-white font-bold">{Math.floor(form.budget / 0.05).toLocaleString('fr-FR')}</span> utilisateurs.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl border border-zinc-700 text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-[#facc15] text-black text-sm font-black hover:bg-[#fbbf24] transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement…' : initial ? 'Mettre à jour' : 'Lancer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Stats Modal ───────────────────────────────────────────────────────────────

function StatsModal({ promo, onClose }: { promo: Promotion; onClose: () => void }) {
  const [stats, setStats] = useState<PromotionStats | null>(null);

  useEffect(() => {
    getPromotionStats(promo.id).then(setStats).catch(() => {});
  }, [promo.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-black text-white">Statistiques</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm font-bold text-zinc-300 mb-4">{promo.title}</p>
          {!stats ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-zinc-900 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Eye size={16} />} label="Impressions" value={stats.impressions.toLocaleString('fr-FR')} color="#818cf8" />
              <StatCard icon={<MousePointer size={16} />} label="Clics" value={stats.clicks.toLocaleString('fr-FR')} color="#4ade80" />
              <StatCard icon={<TrendingUp size={16} />} label="Taux de clic" value={`${stats.ctr}%`} color="#facc15" />
              <StatCard icon={<DollarSign size={16} />} label="Budget utilisé" value={fmtMoney(stats.budgetSpent)} color="#fb923c" />
              <div className="col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Budget consommé</span>
                  <span className="font-bold text-white">{stats.budgetPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#facc15] transition-all"
                    style={{ width: `${Math.min(100, stats.budgetPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-600 mt-1.5">
                  Restant : {fmtMoney(stats.budgetRemaining)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

// ─── Promotion Card ────────────────────────────────────────────────────────────

function PromoCard({
  promo,
  onToggle,
  onDelete,
  onEdit,
  onStats,
}: {
  promo: Promotion;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (promo: Promotion) => void;
  onStats: (promo: Promotion) => void;
}) {
  const isExpired = new Date(promo.endDate) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-zinc-800 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      {/* Status bar */}
      <div className={`h-1 ${promo.isActive && !isExpired ? 'bg-[#facc15]' : 'bg-zinc-700'}`} />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isExpired
                  ? 'bg-red-500/15 text-red-400'
                  : promo.isActive
                    ? 'bg-[#facc15]/15 text-[#facc15]'
                    : 'bg-zinc-800 text-zinc-500'
              }`}>
                {isExpired ? 'Expirée' : promo.isActive ? 'Active' : 'En pause'}
              </span>
              <span className="text-[10px] text-zinc-600">
                Priorité {promo.priority}/10
              </span>
            </div>
            <h3 className="text-sm font-black text-white truncate">{promo.title}</h3>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{promo.description}</p>
          </div>

          <button
            onClick={() => !isExpired && onToggle(promo.id)}
            disabled={isExpired}
            className="flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            title={promo.isActive ? 'Mettre en pause' : 'Activer'}
          >
            {promo.isActive
              ? <ToggleRight size={28} className="text-[#facc15]" />
              : <ToggleLeft size={28} className="text-zinc-600" />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-zinc-900 rounded-xl px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-zinc-500 mb-0.5">
              <Eye size={10} />
              <span className="text-[9px] uppercase font-bold">Vues</span>
            </div>
            <p className="text-sm font-black text-white">{promo.impressionCount.toLocaleString('fr-FR')}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-zinc-500 mb-0.5">
              <MousePointer size={10} />
              <span className="text-[9px] uppercase font-bold">Clics</span>
            </div>
            <p className="text-sm font-black text-white">{promo.clickCount.toLocaleString('fr-FR')}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-zinc-500 mb-0.5">
              <MapPin size={10} />
              <span className="text-[9px] uppercase font-bold">Rayon</span>
            </div>
            <p className="text-sm font-black text-white">{promo.radiusKm} km</p>
          </div>
        </div>

        {/* Dates + actions */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-zinc-600">
            {fmtDate(promo.startDate)} → {fmtDate(promo.endDate)}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStats(promo)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-[#818cf8] hover:bg-[#818cf8]/10 transition-all"
              title="Statistiques"
            >
              <TrendingUp size={14} />
            </button>
            <button
              onClick={() => onEdit(promo)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-[#facc15] hover:bg-[#facc15]/10 transition-all"
              title="Modifier"
            >
              <Tag size={14} />
            </button>
            <button
              onClick={() => onDelete(promo.id)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);
  const [statsTarget, setStatsTarget] = useState<Promotion | null>(null);

  const loadPromotions = useCallback(async () => {
    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadPromotions(); }, [loadPromotions]);

  const handleCreate = async (dto: CreatePromotionDto) => {
    setFormLoading(true);
    try {
      const created = await createPromotion(dto);
      setPromotions((prev) => [created, ...prev]);
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (dto: CreatePromotionDto) => {
    if (!editTarget) return;
    setFormLoading(true);
    try {
      const updated = await updatePromotion(editTarget.id, dto);
      setPromotions((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setEditTarget(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const { isActive } = await togglePromotion(id);
      setPromotions((prev) => prev.map((p) => p.id === id ? { ...p, isActive } : p));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    try {
      await deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  const totalImpressions = promotions.reduce((s, p) => s + p.impressionCount, 0);
  const totalClicks = promotions.reduce((s, p) => s + p.clickCount, 0);
  const activeCount = promotions.filter((p) => p.isActive && new Date(p.endDate) >= new Date()).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/commercant"
            className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Tag size={20} className="text-[#fb923c]" />
              Mes campagnes
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Sponsorisez vos offres auprès des supporters GoMatch
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#facc15] text-black text-xs font-black hover:bg-[#fbbf24] transition-colors shadow-lg shadow-[#facc15]/20"
          >
            <Plus size={14} /> Nouvelle
          </button>
        </div>

        {/* Global stats */}
        {promotions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3.5 text-center">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Actives</p>
              <p className="text-2xl font-black text-[#facc15]">{activeCount}</p>
            </div>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3.5 text-center">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Impressions</p>
              <p className="text-2xl font-black text-[#818cf8]">{totalImpressions.toLocaleString('fr-FR')}</p>
            </div>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3.5 text-center">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Clics</p>
              <p className="text-2xl font-black text-[#4ade80]">{totalClicks.toLocaleString('fr-FR')}</p>
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="rounded-2xl bg-[#fb923c]/8 border border-[#fb923c]/20 px-5 py-4 mb-6">
          <p className="text-xs text-zinc-300 leading-relaxed">
            <span className="text-[#fb923c] font-bold">Comment ça marche ?</span>{' '}
            Vos offres sont envoyées sous forme de notifications aux utilisateurs GoMatch situés
            dans le rayon défini. Vous ne payez que lorsque votre offre est affichée (0.05 €/vue).
            Plus votre budget est élevé, plus votre priorité d'affichage est haute.
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Tag size={24} className="text-zinc-600" />
            </div>
            <p className="text-base font-bold text-zinc-400 mb-1">Aucune campagne</p>
            <p className="text-sm text-zinc-600 mb-6">Créez votre première campagne pour booster votre visibilité</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#facc15] text-black text-sm font-black hover:bg-[#fbbf24] transition-colors"
            >
              <Plus size={16} /> Créer une campagne
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {promotions.map((p) => (
                <PromoCard
                  key={p.id}
                  promo={p}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={setEditTarget}
                  onStats={setStatsTarget}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <PromotionForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        )}
        {editTarget && (
          <PromotionForm
            initial={{
              title: editTarget.title,
              description: editTarget.description,
              imageUrl: editTarget.imageUrl ?? '',
              radiusKm: editTarget.radiusKm,
              startDate: editTarget.startDate.slice(0, 10),
              endDate: editTarget.endDate.slice(0, 10),
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            loading={formLoading}
          />
        )}
        {statsTarget && (
          <StatsModal promo={statsTarget} onClose={() => setStatsTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
