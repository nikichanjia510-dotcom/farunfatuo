interface MascotProps {
  size?: 'small' | 'medium' | 'large';
  mood?: 'hello' | 'thinking' | 'celebrate';
}

export function Mascot({ size = 'medium', mood = 'hello' }: MascotProps) {
  const alt =
    mood === 'celebrate'
      ? '托宝占位形象正在庆祝'
      : mood === 'thinking'
        ? '托宝占位形象正在思考'
        : '托宝占位形象向你问好';
  return (
    <div className={`mascot mascot--${size} mascot--${mood}`}>
      <span className="mascot__spark" aria-hidden="true">
        {mood === 'celebrate' ? '✨' : mood === 'thinking' ? '💭' : '✦'}
      </span>
      <img src="/assets/tuobao/mascot-placeholder.svg" alt={alt} />
    </div>
  );
}
