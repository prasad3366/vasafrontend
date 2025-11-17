// Small navigation bridge so non-react modules can trigger client-side navigation
// Default behavior falls back to full reload if a router hasn't registered yet.

type NavigateFn = (to: string, opts?: { replace?: boolean }) => void;

let navigateFn: NavigateFn = (to: string) => {
  // Fallback to full reload navigation if react-router hasn't registered
  try {
    window.location.href = to;
  } catch (e) {
    // ignore
  }
};

export function setNavigate(fn: NavigateFn) {
  navigateFn = fn;
}

export function navigateTo(to: string, opts?: { replace?: boolean }) {
  try {
    navigateFn(to, opts);
  } catch (e) {
    // final fallback
    window.location.href = to;
  }
}

export default navigateTo;
