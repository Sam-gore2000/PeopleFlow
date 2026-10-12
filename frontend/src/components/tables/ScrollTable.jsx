import { useCallback, useEffect, useRef, useState } from "react";

const NON_DRAG = "button, a, input, select, textarea, label, [role='button']";

// Wraps a wide table so it scrolls sideways inside its card:
//  - "More columns" bar with < > buttons, shown only when the table is wider than the space;
//  - a fade on the side where more columns are hidden;
//  - swipe on touch screens, drag with a mouse, arrow keys when focused.
export function ScrollTable({ children, label = "Table" }) {
  const scroller = useRef(null);
  const drag = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [dragging, setDragging] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((current) => (current.left === left && current.right === right ? current : { left, right }));
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    update();
    el.addEventListener("scroll", update, { passive: true });
    // Rows load, columns change, the screen rotates: re-check whether there is more to the side.
    const resize = new ResizeObserver(update);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    const mutations = new MutationObserver(update);
    mutations.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [update]);

  function scrollByPage(direction) {
    const el = scroller.current;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.8), behavior: smooth ? "smooth" : "auto" });
  }

  // Mouse drag to scroll (touch screens already swipe natively).
  function onPointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest(NON_DRAG)) return;
    drag.current = { x: event.clientX, scroll: scroller.current.scrollLeft, moved: false };
  }
  function onPointerMove(event) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    if (!drag.current.moved && Math.abs(dx) < 5) return;
    if (!drag.current.moved) {
      drag.current.moved = true;
      setDragging(true);
      scroller.current.setPointerCapture?.(event.pointerId);
    }
    scroller.current.scrollLeft = drag.current.scroll - dx;
  }
  function endDrag(event) {
    if (drag.current?.moved) scroller.current.releasePointerCapture?.(event.pointerId);
    drag.current = null;
    setDragging(false);
  }

  const overflowing = edges.left || edges.right;

  return (
    <div className={`scroll-table${edges.left ? " can-left" : ""}${edges.right ? " can-right" : ""}`}>
      {overflowing && (
        <div className="scroll-table-bar">
          <span className="scroll-table-hint"><i className="bi bi-arrow-left-right" aria-hidden="true" /> Swipe for more columns</span>
          <div className="scroll-table-buttons">
            <button type="button" onClick={() => scrollByPage(-1)} disabled={!edges.left} aria-label="Show columns on the left"><i className="bi bi-chevron-left" aria-hidden="true" /></button>
            <button type="button" onClick={() => scrollByPage(1)} disabled={!edges.right} aria-label="Show columns on the right"><i className="bi bi-chevron-right" aria-hidden="true" /></button>
          </div>
        </div>
      )}
      <div className="scroll-table-viewport">
        <div
          ref={scroller}
          className={`table-responsive${dragging ? " is-dragging" : ""}`}
          tabIndex={overflowing ? 0 : -1}
          role="region"
          aria-label={overflowing ? `${label} - scroll sideways for more columns` : label}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
