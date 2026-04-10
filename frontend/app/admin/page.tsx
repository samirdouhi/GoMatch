import Link from "next/link";
import {
  ShieldCheck,
  Store,
  Clock3,
  BarChart3,
  ChevronRight,
  Building2,
  Users,
  Tags,
  MapPinned,
} from "lucide-react";

export default function AdminDashboardPage() {
  const cards = [
    {
      title: "Demandes commerçants",
      description:
        "Consulter, examiner et traiter les demandes commerçants en attente de validation.",
      href: "/admin/commercants",
      icon: Store,
      badge: "Priorité",
    },
    {
      title: "Validations en attente",
      description:
        "Accéder rapidement aux dossiers à approuver ou à rejeter depuis l’espace d’administration.",
      href: "/admin/commercants",
      icon: Clock3,
      badge: "Workflow",
    },
    {
      title: "Gestion des commerces",
      description:
        "Module réservé à la gestion des commerces validés. Structure prête pour l’intégration BusinessService.",
      href: "/admin/commerces",
      icon: Building2,
      badge: "À venir",
    },
    {
      title: "Catégories & tags",
      description:
        "Espace prévu pour organiser les catégories, tags culturels et métadonnées des commerces.",
      href: "/admin/categories",
      icon: Tags,
      badge: "Modèle",
    },
    {
      title: "Utilisateurs",
      description:
        "Section dédiée à la supervision des utilisateurs, rôles et profils de la plateforme.",
      href: "/admin/utilisateurs",
      icon: Users,
      badge: "Modèle",
    },
    {
      title: "Statistiques",
      description:
        "Section réservée aux statistiques et au pilotage global de la plateforme. À brancher ensuite.",
      href: "/admin/statistiques",
      icon: BarChart3,
      badge: "Bientôt",
    },
  ];

  const quickStats = [
    {
      label: "Module principal",
      value: "Validation commerçants",
      description: "Flux prioritaire actuellement branché.",
    },
    {
      label: "Gestion future",
      value: "Commerces & contenus",
      description: "Préparation du pilotage BusinessService côté admin.",
    },
    {
      label: "Statut",
      value: "Interface sécurisée",
      description: "Accès réservé au rôle Admin.",
    },
  ];

  const quickLinks = [
    {
      title: "Voir les demandes",
      href: "/admin/commercants",
      icon: Store,
    },
    {
      title: "Gérer les commerces",
      href: "/admin/commerces",
      icon: Building2,
    },
    {
      title: "Voir les statistiques",
      href: "/admin/statistiques",
      icon: BarChart3,
    },
  ];

  return (
    <div className="text-white">
      <section className="border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="px-6 py-8 lg:px-10">
          <div className="flex items-start justify-between gap-6 flex-col xl:flex-row">
            <div>
              <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">
                  Administration
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                Dashboard Admin
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-zinc-400 leading-6">
                Bienvenue dans l’espace d’administration GoMatch. Depuis ce
                panneau, l’administrateur peut superviser les demandes
                commerçants, préparer la gestion des commerces validés et
                centraliser les futurs modules de pilotage de la plateforme.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:w-auto xl:min-w-[720px]">
              {quickStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)]"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">Accès rapides</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Utilisez ces raccourcis pour naviguer dans les modules de gestion
            disponibles et ceux déjà préparés pour les prochaines intégrations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(251,191,36,0.08)]"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
                    <Icon className="h-6 w-6 text-amber-400" />
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-black tracking-tight text-white">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {card.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-amber-400">
                  <span>Ouvrir</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-6 pb-10 lg:px-10">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold tracking-tight">
                Vue d’ensemble administration
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Cette zone servira à centraliser l’état global de la plateforme :
              demandes en attente, commerces validés, catégories, contenus,
              supervision utilisateur et indicateurs clés. Pour l’instant, elle
              joue le rôle de structure visuelle prête pour l’intégration métier.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Workflow
                </p>
                <p className="mt-2 text-base font-bold text-white">
                  Demandes commerçants
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Pending / Approved / Rejected
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Business
                </p>
                <p className="mt-2 text-base font-bold text-white">
                  Commerces validés
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  CRUD à intégrer plus tard
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Pilotage
                </p>
                <p className="mt-2 text-base font-bold text-white">
                  Statistiques & suivi
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Module préparé visuellement
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-bold tracking-tight">
              Actions rapides
            </h2>

            <div className="mt-5 space-y-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-amber-500/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                        <Icon className="h-4 w-4 text-amber-400" />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {link.title}
                      </span>
                    </div>

                    <ChevronRight className="h-4 w-4 text-amber-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}