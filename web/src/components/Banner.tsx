import Icon from './Icon';

type Props = { text: string; tone?: 'error' | 'info'; onDismiss?: () => void };

export default function Banner({ text, tone = 'error', onDismiss }: Props) {
  return (
    <div className={`banner banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{text}</span>
      {onDismiss ? (
        <button type="button" className="icon-btn icon-btn-sm" onClick={onDismiss} aria-label="Dismiss message">
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  );
}
