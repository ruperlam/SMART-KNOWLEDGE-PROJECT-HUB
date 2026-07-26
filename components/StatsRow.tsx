import { BookOpen, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function StatsRow({
  total,
  unread,
  overdue,
  completed,
}: {
  total: number;
  unread: number;
  overdue: number;
  completed: number;
}) {
  const cards = [
    {
      label: "TỔNG TÀI LIỆU / VIDEO",
      value: total,
      icon: BookOpen,
      valueClass: "text-accent-cream",
      iconClass: "bg-accent-mauve/30 text-accent-cream",
    },
    {
      label: "TÀI LIỆU CHƯA ĐỌC",
      value: unread,
      icon: Clock,
      valueClass: "text-accent-cream",
      iconClass: "bg-accent-blush/20 text-accent-blush",
    },
    {
      label: "CẦN XỬ LÝ QUÁ HẠN SLA",
      value: overdue,
      icon: AlertTriangle,
      valueClass: "text-status-red",
      iconClass: "bg-status-red/20 text-status-red",
    },
    {
      label: "ĐÃ HOÀN THÀNH",
      value: completed,
      icon: CheckCircle2,
      valueClass: "text-status-green",
      iconClass: "bg-status-green/20 text-status-green",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => (
        <div key={c.label} className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-accent-mauve font-semibold mb-2">
              {c.label}
            </p>
            <p className={`text-3xl font-heading font-bold ${c.valueClass}`}>
              {c.value}
            </p>
          </div>
          <span className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 ${c.iconClass}`}>
            <c.icon size={20} />
          </span>
        </div>
      ))}
    </div>
  );
}
