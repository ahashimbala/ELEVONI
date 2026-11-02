import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    let secondFrame = 0;
    let retryTimer = 0;

    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const scrollToTarget = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    // Route content may finish mounting after the location change (for example,
    // when returning from a category page to a homepage section). Retry once.
    const firstFrame = window.requestAnimationFrame(() => {
      if (!scrollToTarget()) {
        secondFrame = window.requestAnimationFrame(() => {
          if (!scrollToTarget()) retryTimer = window.setTimeout(scrollToTarget, 120);
        });
      }
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(retryTimer);
    };
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
