import {
  Briefcase,
  Send,
  XCircle,
  MessageSquare,
  Flag as FlagIcon,
  CreditCard,
  Star,
  ShieldCheck,
  ShieldOff,
  Scale,
  Bell,
} from 'lucide-react';

// Maps every Notification.type from the backend (models/Notification.js) to
// an icon + tint, so the bell dropdown and full notifications page render
// each of the spec's required types (new gig posted, proposal accepted,
// payment received, review added, ...) distinctly rather than as a generic bell.
const NOTIFICATION_ICON_MAP = {
  new_gig_posted: { icon: Briefcase, className: 'text-signal-600 bg-signal-100' },
  proposal_received: { icon: Send, className: 'text-pin bg-pin/10' },
  proposal_accepted: { icon: ShieldCheck, className: 'text-moss bg-moss/10' },
  proposal_rejected: { icon: XCircle, className: 'text-rose bg-rose/10' },
  new_message: { icon: MessageSquare, className: 'text-pin bg-pin/10' },
  milestone_update: { icon: Briefcase, className: 'text-ink-600 bg-ink-100' },
  payment_received: { icon: CreditCard, className: 'text-signal-600 bg-signal-100' },
  payment_released: { icon: CreditCard, className: 'text-moss bg-moss/10' },
  review_received: { icon: Star, className: 'text-signal-600 bg-signal-100' },
  review_flagged: { icon: FlagIcon, className: 'text-rose bg-rose/10' },
  gig_invitation: { icon: Briefcase, className: 'text-pin bg-pin/10' },
  dispute_raised: { icon: Scale, className: 'text-rose bg-rose/10' },
  dispute_resolved: { icon: Scale, className: 'text-moss bg-moss/10' },
  account_suspended: { icon: ShieldOff, className: 'text-rose bg-rose/10' },
  verification_approved: { icon: ShieldCheck, className: 'text-moss bg-moss/10' },
  system: { icon: Bell, className: 'text-ink-400 bg-ink-100' },
};

const NotificationIcon = ({ type, size = 15 }) => {
  const entry = NOTIFICATION_ICON_MAP[type] || NOTIFICATION_ICON_MAP.system;
  const Icon = entry.icon;
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${entry.className}`}>
      <Icon size={size} />
    </span>
  );
};

export default NotificationIcon;
