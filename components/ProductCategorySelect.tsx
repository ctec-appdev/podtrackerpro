"use client";

import * as React from "react";

export const PRODUCT_CATEGORIES = [
  {
    id: "apparel",
    label: "T-Shirts & Apparel",
    hint: "tees, hoodies, leggings, kids",
  },
  {
    id: "headwear",
    label: "Headwear",
    hint: "caps, beanies, buckets",
  },
  {
    id: "accessories",
    label: "Accessories",
    hint: "totes, bags, wallets, keychains",
  },
  {
    id: "drinkware",
    label: "Drinkware",
    hint: "mugs, tumblers, bottles",
  },
  {
    id: "wall-art",
    label: "Wall Art & Prints",
    hint: "posters, canvases, framed art",
  },
  {
    id: "home-living",
    label: "Home & Living",
    hint: "pillows, blankets, towels, decor",
  },
  {
    id: "stickers-stationery-tech",
    label: "Stickers, Stationery & Tech",
    hint: "stickers, notebooks, phone cases, mouse pads",
  },
] as const;

type ProductCategorySelectProps = {
  // Used by the component runtime; ignored here so the base ESLint rule does not flag the TS prop type.
  // eslint-disable-next-line no-unused-vars
  value: string | undefined;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string) => void;
  label?: string;
};

export default function ProductCategorySelect({
  value,
  onChange,
  label,
}: ProductCategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(() => {
    const selectedIndex = PRODUCT_CATEGORIES.findIndex((item) => item.id === value);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = React.useId();
  const labelId = React.useId();

  const selectedCategory =
    PRODUCT_CATEGORIES.find((item) => item.id === value) ?? null;

  const openMenu = React.useCallback(
    (startIndex?: number) => {
      const selectedIndex = PRODUCT_CATEGORIES.findIndex((item) => item.id === value);
      const nextIndex =
        typeof startIndex === "number"
          ? startIndex
          : selectedIndex >= 0
            ? selectedIndex
            : 0;

      setFocusedIndex(nextIndex);
      setOpen(true);
    },
    [value]
  );

  const closeMenu = React.useCallback(() => {
    setOpen(false);
  }, []);

  const selectIndex = React.useCallback(
    (index: number) => {
      const option = PRODUCT_CATEGORIES[index];
      if (!option) return;
      onChange(option.id);
      setFocusedIndex(index);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeMenu]);

  React.useEffect(() => {
    if (!open) return;
    optionRefs.current[focusedIndex]?.focus();
  }, [focusedIndex, open]);

  React.useEffect(() => {
    const selectedIndex = PRODUCT_CATEGORIES.findIndex((item) => item.id === value);
    if (selectedIndex >= 0) {
      setFocusedIndex(selectedIndex);
    }
  }, [value]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(
        value
          ? Math.max(
              PRODUCT_CATEGORIES.findIndex((item) => item.id === value),
              0
            )
          : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(
        value
          ? Math.max(
              PRODUCT_CATEGORIES.findIndex((item) => item.id === value),
              0
            )
          : PRODUCT_CATEGORIES.length - 1
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        selectIndex(focusedIndex);
      } else {
        openMenu();
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((index + 1) % PRODUCT_CATEGORIES.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((index - 1 + PRODUCT_CATEGORIES.length) % PRODUCT_CATEGORIES.length);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectIndex(index);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {label ? (
        <label id={labelId} className="text-sm font-medium text-gray-900">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={label ? `${labelId} ${listboxId}-trigger` : undefined}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          id={`${listboxId}-trigger`}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 flex-col">
              <span className={selectedCategory ? "text-sm font-medium text-gray-900" : "text-sm text-gray-500"}>
                {selectedCategory?.label || "Select a product category"}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">
                {selectedCategory?.hint || "Choose the main product family for this niche."}
              </span>
            </span>
            <svg
              className={`h-4 w-4 flex-none text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-activedescendant={`${listboxId}-${PRODUCT_CATEGORIES[focusedIndex]?.id ?? ""}`}
            className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm"
          >
            {PRODUCT_CATEGORIES.map((category, index) => {
              const isSelected = category.id === value;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={category.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  id={`${listboxId}-${category.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => selectIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                    isSelected ? "border-l-2 border-gray-900 bg-gray-50" : "border-l-2 border-transparent"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">
                      {category.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {category.hint}
                    </span>
                  </span>
                  {isSelected ? (
                    <svg
                      className="mt-0.5 h-4 w-4 flex-none text-gray-900"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 10.5L8.5 14L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ProductCategorySelectExample() {
  const [category, setCategory] = React.useState<string | undefined>("apparel");

  return (
    <div className="max-w-sm space-y-2">
      <label className="text-sm font-medium text-gray-900">
        Product category
      </label>
      <ProductCategorySelect
        value={category}
        onChange={setCategory}
      />
      <p className="text-xs text-gray-500">
        Selected: {category || "none"}
      </p>
    </div>
  );
}
