import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

/**
 * Reusable client-side pagination component.
 * @param {number} currentPage - 1-indexed current page
 * @param {number} totalPages - total number of pages
 * @param {function} onPageChange - callback with new page number
 * @param {string} [className] - optional wrapper class
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className = "" }) {
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="ניווט בין עמודים" className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`} dir="ltr">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="עמוד קודם"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="sm"
            className="h-9 min-w-[36px]"
            onClick={() => onPageChange(1)}
            aria-label="עמוד 1"
            aria-current={currentPage === 1 ? 'page' : undefined}
          >
            1
          </Button>
          {startPage > 2 && <span className="text-slate-400 px-1" aria-hidden="true">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          className={`h-9 min-w-[36px] ${page === currentPage ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
          onClick={() => onPageChange(page)}
          aria-label={`עמוד ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-400 px-1" aria-hidden="true">...</span>}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="sm"
            className="h-9 min-w-[36px]"
            onClick={() => onPageChange(totalPages)}
            aria-label={`עמוד ${totalPages}`}
            aria-current={currentPage === totalPages ? 'page' : undefined}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="עמוד הבא"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

/**
 * Hook to paginate an array client-side.
 * @param {Array} items - full array of items
 * @param {number} perPage - items per page
 * @returns {{ page, setPage, pageItems, totalPages }}
 */
export function usePagination(items, perPage = 12) {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  // Reset to page 1 if items change (e.g. filter applied)
  React.useEffect(() => {
    setPage(1);
  }, [items.length]);

  // Clamp page if it exceeds total
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  return { page: safePage, setPage, pageItems, totalPages };
}
