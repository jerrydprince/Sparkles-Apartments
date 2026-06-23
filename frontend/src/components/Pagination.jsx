import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A reusable pagination control with premium styling.
 * Props:
 * - currentPage: number (1‑based)
 * - totalPages: number
 * - onPageChange: (newPage: number) => void
 * - limit: number (items per page, optional for display)
 */
const Pagination = ({ currentPage, totalPages, onPageChange, limit }) => {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800/60 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
        Prev
      </button>

      <span className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}{limit ? ` (· ${limit} per page)` : ''}
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800/60 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default Pagination;
