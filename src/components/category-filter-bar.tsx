"use client";

import { useEffect, useState } from "react";
import { Button, Group, rem } from "@mantine/core";

type CategorySummary = {
  name: string;
  slug: string;
};

type Props = {
  categories: CategorySummary[];
};

/**
 * Renders in-page category filters that hide/show sections client-side
 * without changing the URL. When a category is selected, the page scrolls
 * smoothly to that section so readers immediately see the relevant posts.
 */
export default function CategoryFilterBar({ categories }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>("all");

  const syncSections = (slug: string) => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-category-section]",
    );
    sections.forEach((section) => {
      const { categorySection } = section.dataset;
      if (!categorySection) return;
      const hidden =
        slug !== "all" && categorySection !== slug ? "none" : "";
      section.style.display = hidden;
    });
  };

  const scrollToSlug = (slug: string) => {
    setActiveSlug(slug);
    if (slug === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document
      .querySelector<HTMLElement>(`[data-category-section='${slug}']`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    syncSections(activeSlug);
  }, [activeSlug]);

  useEffect(() => {
    const listener = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail ?? "all";
      scrollToSlug(slug);
    };
    window.addEventListener(
      "category-filter-select",
      listener as EventListener,
    );

    const pending = sessionStorage.getItem("pendingCategoryFilter");
    if (pending) {
      sessionStorage.removeItem("pendingCategoryFilter");
      scrollToSlug(pending);
    }

    return () => {
      window.removeEventListener(
        "category-filter-select",
        listener as EventListener,
      );
    };
  }, []);

  const handleSelect = (slug: string) => {
    scrollToSlug(slug);
  };

  if (categories.length === 0) return null;

  return (
    <Group justify="center" gap="sm" wrap="wrap">
      <Button
        size="sm"
        variant={activeSlug === "all" ? "filled" : "outline"}
        onClick={() => handleSelect("all")}
        radius={0}
        styles={{
          root: { letterSpacing: rem(1), textTransform: "uppercase" },
        }}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.slug}
          size="sm"
          variant={activeSlug === category.slug ? "filled" : "outline"}
          onClick={() => handleSelect(category.slug)}
          radius={0}
          styles={{
            root: { letterSpacing: rem(1), textTransform: "uppercase" },
          }}
        >
          {category.name}
        </Button>
      ))}
    </Group>
  );
}
