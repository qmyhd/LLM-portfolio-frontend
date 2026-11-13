/** Shared class strings for the Users and access page (Settings page tokens only). */

export const tagBase = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
export const tagMuted = `${tagBase} bg-foreground-muted/10 text-foreground-muted`;
export const tagWarning = `${tagBase} bg-status-warning/10 text-status-warning`;
export const tagOwner = `${tagBase} bg-primary-muted text-primary`;
export const tagYou = `${tagBase} bg-gain/10 text-gain`;

const btn = 'btn min-h-[44px] sm:min-h-[40px] px-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed';
export const btnPrimary = `btn-primary ${btn}`;
export const btnSecondary = `btn-secondary ${btn}`;
export const btnDanger = `btn-secondary ${btn} text-loss`;

export const fieldLabel = 'block text-xs font-medium text-foreground-muted mb-1';
export const fieldInput = 'input min-h-[44px] sm:min-h-[40px] disabled:opacity-60';
export const errorText = 'text-xs text-loss mt-2';
