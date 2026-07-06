import { useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// DELETE CONFIRMATION MODAL
// ══════════════════════════════════════════════════════════════════════════════
export function DeleteConfirmModal({
  delConfirm,
  customers,
  setDelConfirm,
  confirmDel
}) {
  if (!delConfirm) return null;
  var dc = customers.find(function(x) { return x.id === delConfirm; });

  return (
    <DeleteConfirmModalInner
      dc={dc}
      delConfirm={delConfirm}
      setDelConfirm={setDelConfirm}
      confirmDel={confirmDel}
    />
  );
}

// Inner component so hooks run only when the modal is open
function DeleteConfirmModalInner({ dc, delConfirm, setDelConfirm, confirmDel }) {
  var cancelRef = useRef(null);

  // Auto-focus Cancel on open for keyboard safety
  useEffect(function() {
    if (cancelRef.current) cancelRef.current.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-modal-title"
      aria-describedby="del-modal-desc"
    >
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-4xl text-center mb-3" aria-hidden="true">🗑️</div>
        <h3 id="del-modal-title" className="text-lg font-black text-stone-800 text-center">Delete {dc ? dc.name : "Customer"}?</h3>
        <p id="del-modal-desc" className="text-sm text-stone-500 text-center mt-2 mb-6">All their payment history will also be removed. This cannot be undone.</p>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={function() { setDelConfirm(null); }}
            className="flex-1 py-3 border-2 border-stone-200 rounded-2xl text-stone-600 font-bold"
          >
            Cancel
          </button>
          <button
            onClick={function() { confirmDel(delConfirm); }}
            className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
