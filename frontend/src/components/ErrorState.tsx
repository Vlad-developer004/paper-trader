import { Card } from "./Card.js";
import { Button } from "./Button.js";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="mt-2">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="text-negative">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.1" fill="currentColor" />
        </svg>
        <div>
          <div className="font-bold">Something went wrong</div>
          <div className="mt-1 text-sm text-muted">{message}</div>
        </div>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </Card>
  );
}
