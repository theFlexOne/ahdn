export function DateBadge({ date }: { date: Date }) {
  return (
    <div className="text-center leading-none">
      <div className="text-xs tracking-widest">
        {formatMonth(date).toUpperCase()}
      </div>

      <div className="text-3xl font-bold text-red-800">
        {formatDay(date)}
      </div>

      <div className="text-sm">
        {formatTime(date).toLowerCase()}
      </div>
    </div>
  );
}

function formatMonth(dateTime: Date) {
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
  });
  return monthFormatter.format(dateTime);
}

function formatDay(dateTime: Date) {
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  });
  return dayFormatter.format(dateTime);
}

function formatTime(dateTime: Date) {
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return timeFormatter.format(dateTime);
}