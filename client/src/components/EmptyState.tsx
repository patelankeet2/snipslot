import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}

// Never leave a blank screen: say what is missing and what to do next
export function EmptyState({ icon, title, text, action }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}
